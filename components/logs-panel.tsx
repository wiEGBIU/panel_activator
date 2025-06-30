"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { ApiClient, LogEntry, LogsResponse, LogStatsResponse } from '@/lib/api';
import { toast } from 'sonner';
import { 
  FileText, 
  RefreshCw, 
  Search, 
  Trash2, 
  Download,
  Filter,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Bug,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

const LOG_LEVEL_COLORS = {
  DEBUG: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
  INFO: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
  WARNING: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
  ERROR: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
  CRITICAL: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20'
};

const LOG_LEVEL_ICONS = {
  DEBUG: Bug,
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  CRITICAL: AlertCircle
};

export function LogsPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [limit, setLimit] = useState(100);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const loadLogs = async () => {
    if (!apiClient) return;
    
    setIsLoading(true);
    try {
      let response: LogsResponse;
      
      if (searchQuery || selectedLevel || selectedFunction) {
        response = await apiClient.searchLogs(
          searchQuery || undefined,
          selectedLevel || undefined,
          selectedFunction || undefined,
          limit
        );
      } else {
        response = await apiClient.getRecentLogs(limit);
      }
      
      setLogs(response.logs);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      toast.error('Failed to load logs');
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!apiClient) return;
    
    setIsLoadingStats(true);
    try {
      const response = await apiClient.getLogStats();
      setStats(response);
    } catch (error) {
      toast.error('Failed to load log statistics');
      console.error('Error loading log stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const clearLogs = async () => {
    if (!apiClient) return;
    
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.clearLogs();
      toast.success('Logs cleared successfully');
      setLogs([]);
      loadStats();
    } catch (error) {
      toast.error('Failed to clear logs');
      console.error('Error clearing logs:', error);
    }
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Level,Function,Message\n" +
      logs.map(log => `"${log.timestamp}","${log.level}","${log.function}","${log.message.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLevel, selectedFunction]);

  // Pagination
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueFunctions = () => {
    const functionSet = new Set(logs.map(log => log.function));
    const functions = Array.from(functionSet);
    return functions.sort();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and analyze system activity and errors
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportLogs}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={clearLogs}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
          <Button
            onClick={() => {
              loadLogs();
              loadStats();
            }}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total_logs}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.level_counts.INFO || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Info Logs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.level_counts.WARNING || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats.level_counts.ERROR || 0) + (stats.level_counts.CRITICAL || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-500" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Message</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className="pl-10 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Log Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="function">Function</Label>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All functions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All functions</SelectItem>
                    {getUniqueFunctions().map((func) => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={loadLogs}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logs Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span>Recent Logs</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({logs.length} entries)
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Logs Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No logs match your current filters or no logs have been generated yet.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedLogs.map((log, index) => {
                    const LogIcon = LOG_LEVEL_ICONS[log.level as keyof typeof LOG_LEVEL_ICONS] || Info;
                    const colorClass = LOG_LEVEL_COLORS[log.level as keyof typeof LOG_LEVEL_COLORS] || LOG_LEVEL_COLORS.INFO;
                    
                    return (
                      <motion.div
                        key={`${log.timestamp}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${colorClass}`}>
                            <LogIcon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                {log.level}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.function}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, logs.length)} of {logs.length} logs
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
