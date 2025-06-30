"use client";

import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'admin';
  api_host?: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  api_host: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  admins: Admin[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addAdmin: (username: string, password: string, api_host: string) => Promise<boolean>;
  removeAdmin: (id: string) => Promise<void>;
  updateAdmin: (id: string, username: string, password: string, api_host: string) => Promise<boolean>;
  updateCurrentAdminProfile: (username: string, password: string) => Promise<boolean>;
  updateSuperAdminCredentials: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load admins when user is superadmin
  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadAdmins();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/auth/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Load admins error:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAdmins([]);
    }
  };

  const addAdmin = async (username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    try {
      const response = await fetch('/api/auth/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, api_host }),
      });

      if (response.ok) {
        await loadAdmins(); // Reload admins list
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Add admin error:', error);
      return false;
    }
  };

  const removeAdmin = async (id: string): Promise<void> => {
    if (user?.role !== 'superadmin') return;

    try {
      const response = await fetch(`/api/auth/admins/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAdmins(); // Reload admins list
      }
    } catch (error) {
      console.error('Remove admin error:', error);
      throw error;
    }
  };

  const updateAdmin = async (id: string, username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    try {
      const response = await fetch(`/api/auth/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, api_host }),
      });

      if (response.ok) {
        await loadAdmins(); // Reload admins list
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Update admin error:', error);
      return false;
    }
  };

  const updateCurrentAdminProfile = async (username: string, password: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, type: 'admin' }),
      });

      if (response.ok) {
        // User will be logged out automatically
        setUser(null);
        setAdmins([]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const updateSuperAdminCredentials = async (username: string, password: string): Promise<void> => {
    if (user?.role !== 'superadmin') {
      throw new Error('Only superadmin can update credentials');
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, type: 'superadmin' }),
      });

      if (response.ok) {
        // User will be logged out automatically
        setUser(null);
        setAdmins([]);
      } else {
        throw new Error('Failed to update credentials');
      }
    } catch (error) {
      console.error('Update superadmin credentials error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      admins,
      login,
      logout,
      addAdmin,
      removeAdmin,
      updateAdmin,
      updateCurrentAdminProfile,
      updateSuperAdminCredentials,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}