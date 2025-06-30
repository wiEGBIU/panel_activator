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
  password: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<AuthData>({
    superadmin_credentials: { username: 'superadmin', password: 'admin123' },
    admins: []
  });

  // Load auth data from localStorage (secure client-side storage)
  const loadAuthData = (): AuthData => {
    try {
      const stored = localStorage.getItem('admin_auth_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
    
    // Return default data if nothing stored
    return {
      superadmin_credentials: { username: 'superadmin', password: 'admin123' },
      admins: []
    };
  };

  // Save auth data to localStorage
  const saveAuthData = (data: AuthData): void => {
    try {
      localStorage.setItem('admin_auth_data', JSON.stringify(data));
      setAuthData(data);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
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

      // Load auth data from localStorage
      const loadedAuthData = loadAuthData();
      setAuthData(loadedAuthData);
      setAdmins(loadedAuthData.admins);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Load fresh data from localStorage
      const currentAuthData = loadAuthData();
      
      // Super admin login
      if (username === currentAuthData.superadmin_credentials.username && 
          password === currentAuthData.superadmin_credentials.password) {
        const superUser: User = {
          id: 'super-1',
          username: currentAuthData.superadmin_credentials.username,
          role: 'superadmin'
        };
        setUser(superUser);
        Cookies.set('user', JSON.stringify(superUser), { expires: 7 });
        return true;
      }

      // Regular admin login
      const admin = currentAuthData.admins.find(a => a.username === username && a.password === password);
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
      const currentAuthData = loadAuthData();
      
      // Check if username already exists
      if (currentAuthData.admins.some(admin => admin.username === username)) {
        return false;
      }

      const newAdmin: Admin = {
        id: `admin-${Date.now()}`,
        username,
        password,
        api_host,
        created_at: new Date().toISOString()
      };

      currentAuthData.admins.push(newAdmin);
      saveAuthData(currentAuthData);
      setAdmins(currentAuthData.admins);
      return true;
    } catch (error) {
      console.error('Error adding admin:', error);
      return false;
    }
  };

  const removeAdmin = async (id: string): Promise<void> => {
    if (user?.role !== 'superadmin') return;

    try {
      const currentAuthData = loadAuthData();
      currentAuthData.admins = currentAuthData.admins.filter(a => a.id !== id);
      saveAuthData(currentAuthData);
      setAdmins(currentAuthData.admins);
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  };

  const updateAdmin = async (id: string, username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    try {
      const currentAuthData = loadAuthData();
      
      // Check if username already exists (excluding current admin)
      if (currentAuthData.admins.some(admin => admin.username === username && admin.id !== id)) {
        return false;
      }

      currentAuthData.admins = currentAuthData.admins.map(admin => 
        admin.id === id 
          ? { ...admin, username, password, api_host }
          : admin
      );
      
      saveAuthData(currentAuthData);
      setAdmins(currentAuthData.admins);
      return true;
    } catch (error) {
      console.error('Error updating admin:', error);
      return false;
    }
  };

  const updateCurrentAdminProfile = async (username: string, password: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    try {
      const currentAuthData = loadAuthData();
      
      // Check if username already exists (excluding current admin)
      if (currentAuthData.admins.some(admin => admin.username === username && admin.id !== user.id)) {
        return false;
      }

      currentAuthData.admins = currentAuthData.admins.map(admin => 
        admin.id === user.id 
          ? { ...admin, username, password }
          : admin
      );
      
      saveAuthData(currentAuthData);
      setAdmins(currentAuthData.admins);
      
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
      const currentAuthData = loadAuthData();
      currentAuthData.superadmin_credentials = { username, password };
      saveAuthData(currentAuthData);
      
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