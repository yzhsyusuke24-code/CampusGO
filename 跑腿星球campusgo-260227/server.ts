import express from "express";
import { createServer as createViteServer } from "vite";
import { initDatabase } from "./src/db";
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Helper to create notification
function createNotification(userId: string, title: string, message: string) {
  try {
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
    stmt.run(id, userId, title, message);
  } catch (error) {
    console.error('Failed to create notification', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDatabase();

  app.use(express.json());

  // --- API Routes ---

  // 1. User / Auth (Mock)
  // Get or create a mock user for testing
  app.get("/api/user/me", (req, res) => {
    const userId = req.query.id as string;
    let user;

    if (userId) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    // If no specific user requested or not found, get the first one or create default
    if (!user) {
      user = db.prepare('SELECT * FROM users LIMIT 1').get();
    }
    
    if (!user) {
      const newUser = {
        id: uuidv4(),
        openid: 'mock_openid_' + Date.now(),
        nickname: 'CampusGoUser',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        rating_as_requester: 5.0,
        rating_as_runner: 5.0,
        preferences: JSON.stringify([])
      };
      
      const stmt = db.prepare(`
        INSERT INTO users (id, openid, nickname, avatar_url, rating_as_requester, rating_as_runner, preferences)
        VALUES (@id, @openid, @nickname, @avatar_url, @rating_as_requester, @rating_as_runner, @preferences)
      `);
      stmt.run(newUser);
      user = newUser;
    }
    
    // Parse preferences
    if (user.preferences && typeof user.preferences === 'string') {
      user.preferences = JSON.parse(user.preferences);
    }

    // Calculate stats dynamically
    const requesterStats = db.prepare(`
      SELECT 
        COUNT(*) as order_count,
        (SELECT COUNT(*) FROM reviews WHERE target_id = ? AND role = 'requester') as review_count
      FROM orders WHERE requester_id = ?
    `).get(user.id, user.id);

    const runnerStats = db.prepare(`
      SELECT 
        COUNT(*) as order_count,
        (SELECT COUNT(*) FROM reviews WHERE target_id = ? AND role = 'runner') as review_count
      FROM orders WHERE runner_id = ? AND status IN ('completed_by_runner', 'confirmed')
    `).get(user.id, user.id);

    user.requester_order_count = requesterStats.order_count;
    user.requester_review_count = requesterStats.review_count;
    user.runner_order_count = runnerStats.order_count;
    user.runner_review_count = runnerStats.review_count;

    res.json(user);
  });

  // Create a new random user for testing
  app.post("/api/user/switch", (req, res) => {
    const seeds = ['Felix', 'Aneka', 'Zoe', 'Jack', 'Bella', 'Charlie'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Date.now();
    
    const newUser = {
      id: uuidv4(),
      openid: 'mock_openid_' + Date.now(),
      nickname: 'User_' + Math.floor(Math.random() * 1000),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`,
      rating_as_requester: 5.0,
      rating_as_runner: 5.0,
      preferences: JSON.stringify([])
    };
    
    const stmt = db.prepare(`
      INSERT INTO users (id, openid, nickname, avatar_url, rating_as_requester, rating_as_runner, preferences)
      VALUES (@id, @openid, @nickname, @avatar_url, @rating_as_requester, @rating_as_runner, @preferences)
    `);
    stmt.run(newUser);
    
    // Return the new user (same format as /me)
    newUser.preferences = [];
    // New user has 0 stats
    (newUser as any).requester_order_count = 0;
    (newUser as any).requester_review_count = 0;
    (newUser as any).runner_order_count = 0;
    (newUser as any).runner_review_count = 0;

    res.json(newUser);
  });

  // Get all users for testing switching
  app.get("/api/users", (req, res) => {
    const users = db.prepare('SELECT id, nickname, avatar_url FROM users ORDER BY created_at DESC LIMIT 10').all();
    res.json(users);
  });

  // Update User Preferences
  app.patch("/api/user/preferences", (req, res) => {
    // In a real app, we'd get user ID from session/token. 
    // For MVP, we'll assume the single mock user or pass ID in body (but let's just use the mock user logic for simplicity)
    // To be safe, let's require user_id in body or just update the first user found (since we only have one active session concept)
    
    const { id, preferences } = req.body;
    
    try {
      const stmt = db.prepare('UPDATE users SET preferences = ? WHERE id = ?');
      stmt.run(JSON.stringify(preferences), id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // Update User Profile (Nickname & Avatar)
  app.patch("/api/user/profile", (req, res) => {
    const { id, nickname, avatar_url } = req.body;
    
    try {
      const stmt = db.prepare('UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?');
      stmt.run(nickname, avatar_url, id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // 1.5 Reviews
  app.post("/api/reviews", (req, res) => {
    const { order_id, reviewer_id, target_id, role, rating, comment } = req.body;
    
    // Check if already reviewed
    const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?').get(order_id, reviewer_id);
    if (existing) {
      return res.status(400).json({ error: 'Already reviewed' });
    }

    const reviewId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO reviews (id, order_id, reviewer_id, target_id, role, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateRatingStmt = db.prepare(`
      UPDATE users 
      SET 
        rating_as_${role} = (
          SELECT AVG(rating) FROM reviews WHERE target_id = ? AND role = ?
        )
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      insertStmt.run(reviewId, order_id, reviewer_id, target_id, role, rating, comment);
      updateRatingStmt.run(target_id, role, target_id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  // Check review status for an order
  app.get("/api/orders/:id/review-status", (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    
    const review = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?').get(id, user_id);
    res.json({ hasReviewed: !!review });
  });

  // 3. Notifications
  app.get("/api/notifications", (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    try {
      const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(user_id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post("/api/notifications/mark-read", (req, res) => {
    const { id } = req.body;
    try {
      const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark read' });
    }
  });

  // 2. Orders
  // Create Order
  app.post("/api/orders", (req, res) => {
    const { requester_id, type, description, pickup_location, delivery_location, price, requester_wechat, time_requirement, extra_needs } = req.body;
    
    const newOrder = {
      id: uuidv4(),
      requester_id,
      runner_id: null,
      type,
      description,
      pickup_location,
      delivery_location,
      price,
      requester_wechat,
      status: 'pending',
      time_requirement,
      extra_needs,
      created_at: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO orders (id, requester_id, runner_id, type, description, pickup_location, delivery_location, price, requester_wechat, status, time_requirement, extra_needs, created_at)
      VALUES (@id, @requester_id, @runner_id, @type, @description, @pickup_location, @delivery_location, @price, @requester_wechat, @status, @time_requirement, @extra_needs, @created_at)
    `);
    
    try {
      stmt.run(newOrder);
      
      // Notify Requester
      createNotification(requester_id, '发布成功', `您的订单 "${description}" 已发布，请耐心等待接单。`);

      // Notify Matching Runners
      try {
        const potentialRunners = db.prepare('SELECT id, preferences FROM users WHERE id != ?').all(requester_id);
        
        for (const runner of potentialRunners) {
          let prefs: any = runner.preferences;
          
          // Parse JSON if it's a string
          if (typeof prefs === 'string') {
            try {
              prefs = JSON.parse(prefs);
            } catch (e) {
              continue; // Skip invalid preferences
            }
          }

          // Skip if no preferences set
          if (!prefs || (Array.isArray(prefs) && prefs.length === 0) || (!Array.isArray(prefs) && !prefs.types && !prefs.priceMin && !prefs.priceMax)) {
            continue;
          }

          let isMatch = true;

          // Handle new object format preferences
          if (!Array.isArray(prefs)) {
            // 1. Type Match
            if (prefs.types && prefs.types.length > 0) {
              if (!prefs.types.includes(type)) isMatch = false;
            }

            // 2. Price Match
            if (isMatch) {
              if (prefs.priceMin !== undefined && price < prefs.priceMin) isMatch = false;
              if (prefs.priceMax !== undefined && price > prefs.priceMax) isMatch = false;
            }
          } else {
            // Handle legacy array format (simple tags) - optional, or just skip
            // For MVP, let's assume legacy tags don't trigger this smart notification to avoid complexity
            isMatch = false; 
          }

          if (isMatch) {
            createNotification(runner.id, '新任务推荐', `有你感兴趣的订单发布了：${description}`);
          }
        }
      } catch (matchError) {
        console.error('Failed to match runners', matchError);
      }

      res.json(newOrder);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Get Orders (Filtered by status/role)
  app.get("/api/orders", (req, res) => {
    const { status, role, user_id } = req.query;
    
    let query = 'SELECT orders.*, users.nickname as requester_name, users.avatar_url as requester_avatar FROM orders JOIN users ON orders.requester_id = users.id';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (role === 'requester' && user_id) {
      conditions.push('requester_id = ?');
      params.push(user_id);
    } else if (role === 'runner' && user_id) {
      conditions.push('runner_id = ?');
      params.push(user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  });

  // Update Order Status (Accept, Complete, Confirm)
  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, runner_id } = req.body;
    
    try {
      // Get current order to find requester/runner for notifications
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      if (status === 'accepted' && runner_id) {
        const stmt = db.prepare('UPDATE orders SET status = ?, runner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(status, runner_id, id);

        // Notify Requester
        const runner = db.prepare('SELECT nickname FROM users WHERE id = ?').get(runner_id);
        createNotification(order.requester_id, '订单被接单', `您的订单已被 ${runner?.nickname || '接单人'} 接单。`);
      } else {
        const stmt = db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(status, id);

        // Notifications logic
        if (status === 'completed_by_runner') {
           createNotification(order.requester_id, '订单已送达', '接单人已确认送达，请您确认完成。');
        } else if (status === 'confirmed') {
           if (order.runner_id) {
             createNotification(order.runner_id, '订单已完成', '下单人已确认完成，请自行联系结算赏金。');
           }
        } else if (status === 'cancelled') {
           // If cancelled, notify the other party if exists
           if (order.runner_id) {
             createNotification(order.runner_id, '订单已取消', '下单人取消了订单。');
           }
           createNotification(order.requester_id, '订单已取消', '订单已成功取消。');
        }
      }
      
      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      res.json(updatedOrder);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Cancel Acceptance (Runner gives up)
  app.patch("/api/orders/:id/cancel-acceptance", (req, res) => {
    const { id } = req.params;
    const { runner_id } = req.body;

    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      
      if (order.runner_id !== runner_id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const stmt = db.prepare("UPDATE orders SET status = 'pending', runner_id = NULL WHERE id = ?");
      stmt.run(id);

      // Notify Requester
      createNotification(order.requester_id, '接单人取消', '接单人取消了接单，您的订单已重新回到任务大厅。');
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to cancel acceptance' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if needed later)
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
