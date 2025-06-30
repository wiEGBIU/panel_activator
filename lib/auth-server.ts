import fs from 'fs/promises';
import path from 'path';

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

const AUTH_FILE_PATH = path.join(process.cwd(), 'data', 'users_db.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read auth data from file
export async function readAuthData(): Promise<AuthData> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(AUTH_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is corrupted, return default data
    const defaultData: AuthData = {
      superadmin_credentials: {
        username: 'superadmin',
        password: 'admin123'
      },
      admins: []
    };
    
    // Save default data to file
    await writeAuthData(defaultData);
    return defaultData;
  }
}

// Write auth data to file
export async function writeAuthData(data: AuthData): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(AUTH_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing auth data:', error);
    throw new Error('Failed to save authentication data');
  }
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const authData = await readAuthData();
    
    // Check superadmin credentials
    if (username === authData.superadmin_credentials.username && 
        password === authData.superadmin_credentials.password) {
      return {
        id: 'super-1',
        username: authData.superadmin_credentials.username,
        role: 'superadmin'
      };
    }

    // Check admin credentials
    const admin = authData.admins.find(a => a.username === username && a.password === password);
    if (admin) {
      return {
        id: admin.id,
        username: admin.username,
        role: 'admin',
        api_host: admin.api_host
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Add new admin
export async function addAdmin(username: string, password: string, api_host: string): Promise<boolean> {
  try {
    const authData = await readAuthData();
    
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
    await writeAuthData(authData);
    return true;
  } catch (error) {
    console.error('Error adding admin:', error);
    return false;
  }
}

// Remove admin
export async function removeAdmin(id: string): Promise<void> {
  try {
    const authData = await readAuthData();
    authData.admins = authData.admins.filter(a => a.id !== id);
    await writeAuthData(authData);
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
}

// Update admin
export async function updateAdmin(id: string, username: string, password: string, api_host: string): Promise<boolean> {
  try {
    const authData = await readAuthData();
    
    // Check if username already exists (excluding current admin)
    if (authData.admins.some(admin => admin.username === username && admin.id !== id)) {
      return false;
    }

    authData.admins = authData.admins.map(admin => 
      admin.id === id 
        ? { ...admin, username, password, api_host }
        : admin
    );
    
    await writeAuthData(authData);
    return true;
  } catch (error) {
    console.error('Error updating admin:', error);
    return false;
  }
}

// Update current admin profile
export async function updateCurrentAdminProfile(id: string, username: string, password: string): Promise<boolean> {
  try {
    const authData = await readAuthData();
    
    // Check if username already exists (excluding current admin)
    if (authData.admins.some(admin => admin.username === username && admin.id !== id)) {
      return false;
    }

    authData.admins = authData.admins.map(admin => 
      admin.id === id 
        ? { ...admin, username, password }
        : admin
    );
    
    await writeAuthData(authData);
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

// Update superadmin credentials
export async function updateSuperAdminCredentials(username: string, password: string): Promise<void> {
  try {
    const authData = await readAuthData();
    authData.superadmin_credentials = { username, password };
    await writeAuthData(authData);
  } catch (error) {
    console.error('Error updating superadmin credentials:', error);
    throw error;
  }
}

// Get all admins
export async function getAllAdmins(): Promise<Admin[]> {
  try {
    const authData = await readAuthData();
    return authData.admins;
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}