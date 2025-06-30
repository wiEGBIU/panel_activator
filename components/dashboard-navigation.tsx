"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { 
  Key, 
  Gift, 
  Mail, 
  Users, 
  BarChart3,
  Settings,
  Shield,
  User,
  FileText,
  Search
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardNavigation({ activeTab, onTabChange }: NavigationProps) {
  const { user } = useAuth();

  const getNavigationItems = () => {
    if (user?.role === 'superadmin') {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: BarChart3,
          description: 'Admin statistics and system overview'
        },
        {
          id: 'admin-management',
          label: 'Admin Management',
          icon: Shield,
          description: 'Manage admin users and API endpoints'
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          description: 'Manage your account settings'
        }
      ];
    } else {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: BarChart3,
          description: 'Dashboard overview and statistics'
        },
        {
          id: 'access-codes',
          label: 'Access Codes',
          icon: Key,
          description: 'Manage access codes and generation'
        },
        {
          id: 'promo-codes',
          label: 'Promo Codes',
          icon: Gift,
          description: 'Manage promotional codes'
        },
        {
          id: 'user-activation',
          label: 'User Activation',
          icon: Mail,
          description: 'Send emails and activate users'
        },
        {
          id: 'logs',
          label: 'System Logs',
          icon: FileText,
          description: 'View and monitor system logs'
        },
        {
          id: 'checker',
          label: 'Code Checker',
          icon: Search,
          description: 'Check and validate promo codes'
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          description: 'Manage your account settings'
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Card className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-0 shadow-lg">
      <div className="space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20'
                    : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-sm transition-colors ${
                    isActive
                      ? 'text-white/80'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}