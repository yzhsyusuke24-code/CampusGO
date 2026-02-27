import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize database
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      openid TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      rating_as_requester REAL DEFAULT 5.0,
      rating_as_runner REAL DEFAULT 5.0,
      requester_order_count INTEGER DEFAULT 0,
      runner_order_count INTEGER DEFAULT 0,
      preferences TEXT DEFAULT '[]', -- JSON array of tags
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      runner_id TEXT,
      type TEXT NOT NULL, -- 'takeout', 'express', 'send', 'errand'
      description TEXT NOT NULL, -- size, weight details
      pickup_location TEXT NOT NULL,
      delivery_location TEXT NOT NULL,
      price REAL NOT NULL,
      requester_wechat TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'completed_by_runner', 'confirmed', 'cancelled'
      time_requirement TEXT,
      extra_needs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (runner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      role TEXT NOT NULL, -- 'requester' or 'runner' (who is being reviewed)
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (target_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;

  db.exec(schema);
  console.log('Database initialized successfully');
}

export default db;
