"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { ApiClient } from '@/lib/api';
import { Key, Gift, Users, TrendingUp, Activity, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Stats {
  accessCodes: number;
  workingPromoCodes: number;
  nonWorkingPromoCodes: number;
  totalAdmins: number;
}

interface OverviewPanelProps {
  onNavigate: (tab: string) => void;
}

export function OverviewPanel({ onNavigate }: OverviewPanelProps) {
  const { user, admins } = useAuth();
  const [stats, setStats] = useState<Stats>({
    accessCodes: 0,
    workingPromoCodes: 0,
    nonWorkingPromoCodes: 0,
    totalAdmins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        setApiError(null);
        
        // Determine API host based on user role
        let apiHost: string;
        if (user.role === 'superadmin') {
          apiHost = 'http://localhost:8000'; // Default for superadmin
        } else {
          apiHost = user.api_host || 'http://localhost:8000';
        }

        const apiClient = new ApiClient({ baseUrl: apiHost });

        // Use the new fast count endpoints
        const [accessCodesCount, promoCodesCounts] = await Promise.all([
          apiClient.getAccessCodesCount(),
          apiClient.getAllPromoCodesCounts()
        ]);

        setStats({
          accessCodes: accessCodesCount.count || 0,
          workingPromoCodes: promoCodesCounts.working_count || 0,
          nonWorkingPromoCodes: promoCodesCounts.non_working_count || 0,
          totalAdmins: admins.length
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to connect to API');
        // Set default stats when API is unavailable
        setStats({
          accessCodes: 0,
          workingPromoCodes: 0,
          nonWorkingPromoCodes: 0,
          totalAdmins: admins.length
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user, admins]);

  const getApiHost = () => {
    if (user?.role === 'superadmin') {
      return 'localhost:8000 (Default)';
    }
    return user?.api_host || 'Not configured';
  };

  const statCards = [
    {
      title: 'Access Codes',
      value: stats.accessCodes,
      icon: Key,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Working Promo Codes',
      value: stats.workingPromoCodes,
      icon: Gift,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Non-Working Promos',
      value: stats.nonWorkingPromoCodes,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    ...(user?.role === 'superadmin' ? [{
      title: 'Total Admins',
      value: stats.totalAdmins,
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* API Connection Status */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>API Connection Issue:</strong> {apiError}
              <br />
              <span className="text-sm">Stats may not reflect current data. Please check if your API server is running.</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? (
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ) : (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            {stat.value}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">Live</span>
                    </div>
                  </div>
                </CardContent>
                
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* System Status */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Connection</span>
                <div className="flex items-center space-x-2">
                  {apiError ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm font-medium text-red-600">Disconnected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Host</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {getApiHost()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">User Role</span>
                <div className="flex items-center space-x-2">
                  {user?.role === 'superadmin' ? (
                    <Shield className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Users className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('access-codes')}
                className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Generate Access Codes
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Create new access codes for user activations
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('promo-codes')}
                className="w-full p-3 text-left bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Add Promo Codes
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Add new promotional codes to the system
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('user-activation')}
                className="w-full p-3 text-left bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Send Activation Email
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Help users activate their pro features
                </div>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}