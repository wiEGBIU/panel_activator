"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ApiClient } from '@/lib/api';
import { 
  Users, 
  Server, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  Globe,
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';

interface AdminStats {
  id: string;
  username: string;
  api_host: string;
  created_at: string;
  status: 'online' | 'offline' | 'error';
  stats?: {
    access_codes: number;
    working_promo_codes: number;
    non_working_promo_codes: number;
  };
}

export function SuperAdminOverviewPanel() {
  const { admins } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAdminStats = async () => {
    setIsLoading(true);
    
    const statsPromises = admins.map(async (admin) => {
      const adminStat: AdminStats = {
        id: admin.id,
        username: admin.username,
        api_host: admin.api_host,
        created_at: admin.created_at,
        status: 'offline'
      };

      try {
        const apiClient = new ApiClient({ baseUrl: admin.api_host });
        
        // Test connection and get stats
        const [accessCodesCount, promoCodesCount] = await Promise.all([
          apiClient.getAccessCodesCount(),
          apiClient.getAllPromoCodesCounts()
        ]);

        adminStat.status = 'online';
        adminStat.stats = {
          access_codes: accessCodesCount.count || 0,
          working_promo_codes: promoCodesCount.working_count || 0,
          non_working_promo_codes: promoCodesCount.non_working_count || 0
        };
      } catch (error) {
        adminStat.status = 'error';
        console.error(`Failed to get stats for admin ${admin.username}:`, error);
      }

      return adminStat;
    });

    try {
      const results = await Promise.all(statsPromises);
      setAdminStats(results);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (admins.length > 0) {
      loadAdminStats();
    }
  }, [admins]);

  const getTotalStats = () => {
    return adminStats.reduce(
      (totals, admin) => {
        if (admin.stats) {
          totals.access_codes += admin.stats.access_codes;
          totals.working_promo_codes += admin.stats.working_promo_codes;
          totals.non_working_promo_codes += admin.stats.non_working_promo_codes;
        }
        return totals;
      },
      { access_codes: 0, working_promo_codes: 0, non_working_promo_codes: 0 }
    );
  };

  const getStatusCounts = () => {
    return adminStats.reduce(
      (counts, admin) => {
        counts[admin.status]++;
        return counts;
      },
      { online: 0, offline: 0, error: 0 }
    );
  };

  const totalStats = getTotalStats();
  const statusCounts = getStatusCounts();

  const summaryCards = [
    {
      title: 'Total Admins',
      value: admins.length,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Online Admins',
      value: statusCounts.online,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total Access Codes',
      value: totalStats.access_codes,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Total Promo Codes',
      value: totalStats.working_promo_codes + totalStats.non_working_promo_codes,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Crown className="w-7 h-7 text-yellow-500" />
            <span>Superadmin Overview</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor all admin instances and system statistics
          </p>
        </div>
        <Button
          onClick={loadAdminStats}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${card.bgColor}`}>
                      <Icon className={`w-6 h-6 ${card.textColor}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isLoading ? (
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ) : (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                          >
                            {card.value}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">Live</span>
                    </div>
                  </div>
                </CardContent>
                
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Admin Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-500" />
              <span>Admin Instances</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Admins Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first admin user to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Admin</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">API Host</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Access Codes</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Promo Codes</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStats.map((admin, index) => (
                      <motion.tr
                        key={admin.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {admin.username}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                              {admin.api_host}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {admin.status === 'online' ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
                              </>
                            ) : admin.status === 'error' ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">Error</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {admin.stats?.access_codes ?? '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="text-green-600 dark:text-green-400">
                              Working: {admin.stats?.working_promo_codes ?? '-'}
                            </div>
                            <div className="text-orange-600 dark:text-orange-400">
                              Non-working: {admin.stats?.non_working_promo_codes ?? '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}