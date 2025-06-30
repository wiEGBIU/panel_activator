"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, User, Crown } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <Crown className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code Management System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {user?.role === 'superadmin' ? (
                <Crown className="w-4 h-4 text-yellow-500" />
              ) : (
                <User className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 p-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-9 h-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}