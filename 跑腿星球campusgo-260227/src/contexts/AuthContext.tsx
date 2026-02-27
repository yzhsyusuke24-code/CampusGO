import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  switchUser: () => Promise<void>; // Creates new user
  switchUserById: (id: string) => Promise<void>; // Switches to existing user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('requester');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (userId?: string) => {
    try {
      // Try to get from local storage if not provided
      const idToFetch = userId || localStorage.getItem('campus_user_id');
      const url = idToFetch ? `/api/user/me?id=${idToFetch}` : '/api/user/me';
      
      const res = await fetch(url);
      const data = await res.json();
      
      setUser(data);
      // Ensure we store the ID we got back
      localStorage.setItem('campus_user_id', data.id);
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async () => {
    setIsLoading(true);
    try {
      console.log('Switching user...');
      const res = await fetch('/api/user/switch', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const newUser = await res.json();
      console.log('Switched to user:', newUser);
      setUser(newUser);
      localStorage.setItem('campus_user_id', newUser.id);
      // Reset role to requester when switching
      setRole('requester');
    } catch (err) {
      console.error('Failed to switch user', err);
      throw err; // Re-throw to be caught by component
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserById = async (id: string) => {
    setIsLoading(true);
    await fetchUser(id);
    setRole('requester');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, setRole, isLoading, refreshUser: () => fetchUser(), switchUser, switchUserById }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
