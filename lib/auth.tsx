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

interface AuthContextType {
  user: User | null;
  admins: Admin[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addAdmin: (username: string, password: string, api_host: string) => Promise<boolean>;
  removeAdmin: (id: string) => void;
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

  useEffect(() => {
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

    // Load admins from localStorage (acts as our "file storage")
    const savedAdmins = localStorage.getItem('admins');
    if (savedAdmins) {
      try {
        setAdmins(JSON.parse(savedAdmins));
      } catch (error) {
        console.error('Error parsing saved admins:', error);
        localStorage.removeItem('admins');
      }
    }

    // Initialize superadmin credentials if not exists
    const superadminCreds = localStorage.getItem('superadmin_credentials');
    if (!superadminCreds) {
      // Set default superadmin credentials on first run
      const defaultCreds = { username: 'superadmin', password: 'admin123' };
      localStorage.setItem('superadmin_credentials', JSON.stringify(defaultCreds));
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Load superadmin credentials from localStorage
      const superadminCreds = localStorage.getItem('superadmin_credentials');
      let superUsername = 'superadmin';
      let superPassword = 'admin123';
      
      if (superadminCreds) {
        try {
          const parsed = JSON.parse(superadminCreds);
          superUsername = parsed.username;
          superPassword = parsed.password;
        } catch (error) {
          console.error('Error parsing superadmin credentials:', error);
        }
      }

      // Super admin login
      if (username === superUsername && password === superPassword) {
        const superUser: User = {
          id: 'super-1',
          username: superUsername,
          role: 'superadmin'
        };
        setUser(superUser);
        Cookies.set('user', JSON.stringify(superUser), { expires: 7 });
        return true;
      }

      // Regular admin login - check against stored admins
      const admin = admins.find(a => a.username === username && a.password === password);
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

    // Check if username already exists
    if (admins.some(admin => admin.username === username)) {
      return false;
    }

    const newAdmin: Admin = {
      id: `admin-${Date.now()}`,
      username,
      password, // In production, this should be hashed
      api_host,
      created_at: new Date().toISOString()
    };

    const updatedAdmins = [...admins, newAdmin];
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    return true;
  };

  const removeAdmin = (id: string) => {
    if (user?.role !== 'superadmin') return;

    const updatedAdmins = admins.filter(a => a.id !== id);
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
  };

  const updateAdmin = async (id: string, username: string, password: string, api_host: string): Promise<boolean> => {
    if (user?.role !== 'superadmin') return false;

    // Check if username already exists (excluding current admin)
    if (admins.some(admin => admin.username === username && admin.id !== id)) {
      return false;
    }

    const updatedAdmins = admins.map(admin => 
      admin.id === id 
        ? { ...admin, username, password, api_host }
        : admin
    );
    
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    return true;
  };

  const updateCurrentAdminProfile = async (username: string, password: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    // Check if username already exists (excluding current admin)
    if (admins.some(admin => admin.username === username && admin.id !== user.id)) {
      return false;
    }

    const updatedAdmins = admins.map(admin => 
      admin.id === user.id 
        ? { ...admin, username, password }
        : admin
    );
    
    setAdmins(updatedAdmins);
    localStorage.setItem('admins', JSON.stringify(updatedAdmins));
    
    // Log out the user so they need to login with new credentials
    logout();
    return true;
  };

  const updateSuperAdminCredentials = async (username: string, password: string): Promise<void> => {
    if (user?.role !== 'superadmin') {
      throw new Error('Only superadmin can update credentials');
    }

    // Update the superadmin credentials in localStorage
    const newCredentials = { username, password };
    localStorage.setItem('superadmin_credentials', JSON.stringify(newCredentials));
    
    // Log out the user so they need to login with new credentials
    logout();
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