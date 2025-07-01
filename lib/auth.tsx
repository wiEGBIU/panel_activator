"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  username: string;
  role: 'superadmin' | 'admin';
  api_host?: string;
}

export interface Admin {
  id: string;
  username: string;
  password: string; // Store password for validation
  api_host: string;
  created_at: string;
}

interface AuthData {
  superadmin_credentials: {
    username: string;
    password: string;
  };
  admins: Admin[];
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

// JSONBin.io Configuration - Replace with your actual values
const JSONBIN_CONFIG = {
  binId: '686238628561e97a502eb223', // Replace with your bin ID from JSONBin.io
  apiKey: '$2a$10$m301Vhg578IV6wGTDKXD0OC487psmAWMGU2BxI12sC5qnAoIk2W/u', // Replace with your API key from JSONBin.io
  baseUrl: 'https://api.jsonbin.io/v3/b'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // JSONBin.io API functions
  const loadAuthData = async (): Promise<AuthData> => {
    try {
      const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`, {
        headers: JSONBIN_CONFIG.apiKey ? { 'X-Master-Key': JSONBIN_CONFIG.apiKey } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.record;
      }
      
      // If no data exists, return defaults
      throw new Error('No data found');
      
    } catch (error) {
      console.log('No existing data found, using defaults');
      // Return default data structure
      return {
        superadmin_credentials: {
          username: 'superadmin',
          password: 'admin123'
        },
        admins: []
      };
    }
  };

  const saveAuthData = async (data: AuthData): Promise<void> => {
    try {
      const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(JSONBIN_CONFIG.apiKey ? { 'X-Master-Key': JSONBIN_CONFIG.apiKey } : {})
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Load user from cookie
      const savedUser = Cookies.get('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          Cookies.remove('user');
        }
      }

      // Load auth data from remote storage
      try {
        const authData = await loadAuthData();
        setAdmins(authData.admins);
        
        // Initialize with default data if this is the first time
        if (authData.admins.length === 0 && 
            authData.superadmin_credentials.username === 'superadmin' && 
            authData.superadmin_credentials.password === 'admin123') {
          await saveAuthData(authData);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Load fresh data from remote storage
      const authData = await loadAuthData();
      
      // Super admin login
      if (username === authData.superadmin_credentials.username && 
          password === authData.superadmin_credentials.password) {
        const superUser: User = {
          id: 'super-1',
          username: authData.superadmin_credentials.username,
          role: 'superadmin'
        };
        setUser(superUser);
        Cookies.set('user', JSON.stringify(superUser), { expires: 7 });
        return true;
      }

      // Regular admin login
      const admin = authData.admins.find(a => a.username === username && a.password === password);
      if (admin) {
        const adminUser: User = {
          id: admin.id,
          username: admin.username,
          role: 'admin',
          api_host: admin.api_host
        };
        setUser(adminUser);
        Cookies.set('user', JSON.stringify(adminUser), { expires: 7 });
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

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
  };

  const addAdmin = async (username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    try {
      const authData = await loadAuthData();
      
      // Check if username already exists
      if (authData.admins.some(admin => admin.username === username)) {
        return false;
      }

      const newAdmin: Admin = {
        id: `admin-${Date.now()}`,
        username,
        password,
        api_host,
        created_at: new Date().toISOString()
      };

      authData.admins.push(newAdmin);
      await saveAuthData(authData);
      setAdmins(authData.admins);
      return true;
    } catch (error) {
      console.error('Error adding admin:', error);
      return false;
    }
  };

  const removeAdmin = async (id: string): Promise<void> => {
    if (user?.role !== 'superadmin') return;

    try {
      const authData = await loadAuthData();
      authData.admins = authData.admins.filter(a => a.id !== id);
      await saveAuthData(authData);
      setAdmins(authData.admins);
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  };

  const updateAdmin = async (id: string, username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    try {
      const authData = await loadAuthData();
      
      // Check if username already exists (excluding current admin)
      if (authData.admins.some(admin => admin.username === username && admin.id !== id)) {
        return false;
      }

      authData.admins = authData.admins.map(admin => 
        admin.id === id 
          ? { ...admin, username, password, api_host }
          : admin
      );
      
      await saveAuthData(authData);
      setAdmins(authData.admins);
      return true;
    } catch (error) {
      console.error('Error updating admin:', error);
      return false;
    }
  };

  const updateCurrentAdminProfile = async (username: string, password: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      const authData = await loadAuthData();
      
      // Check if username already exists (excluding current admin)
      if (authData.admins.some(admin => admin.username === username && admin.id !== user.id)) {
        return false;
      }

      authData.admins = authData.admins.map(admin => 
        admin.id === user.id 
          ? { ...admin, username, password }
          : admin
      );
      
      await saveAuthData(authData);
      setAdmins(authData.admins);
      
      // Log out the user so they need to login with new credentials
      logout();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const updateSuperAdminCredentials = async (username: string, password: string): Promise<void> => {
    if (user?.role !== 'superadmin') {
      throw new Error('Only superadmin can update credentials');
    }

    try {
      const authData = await loadAuthData();
      authData.superadmin_credentials = { username, password };
      await saveAuthData(authData);
      
      // Log out the user so they need to login with new credentials
      logout();
    } catch (error) {
      console.error('Error updating superadmin credentials:', error);
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