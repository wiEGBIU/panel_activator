"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Activity
} from 'lucide-react';

export function LogsPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [limit, setLimit] = useState(100);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const loadLogs = async () => {
    if (!apiClient) return;
    
    setIsLoading(true);
    try {
      let response: LogsResponse;
      
      if (searchQuery || (selectedLevel && selectedLevel !== 'all') || (selectedFunction && selectedFunction !== 'all')) {
        response = await apiClient.searchLogs(
          searchQuery || undefined,
          selectedLevel !== 'all' ? selectedLevel : undefined,
          selectedFunction !== 'all' ? selectedFunction : undefined,
          limit
        );
      } else {
        response = await apiClient.getRecentLogs(limit);
      }
      
      setLogs(response.logs);
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueFunctions = () => {
    const functionSet = new Set(logs.map(log => log.function));
    return Array.from(functionSet).sort();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG': return 'text-gray-500';
      case 'INFO': return 'text-blue-500';
      case 'WARNING': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      case 'CRITICAL': return 'text-purple-500';
      default: return 'text-gray-500';
    }
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
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Log Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All functions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All functions</SelectItem>
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

      {/* Terminal-Style Logs Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span>System Logs ({logs.length} entries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
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
              <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="flex hover:bg-gray-900 px-2 py-1">
                    <span className="text-gray-500 w-8 text-right mr-4 select-none">
                      {index + 1}
                    </span>
                    <span className="text-gray-400 w-40 mr-4">
                      {formatTimestamp(log.timestamp).split(' ')[1]}
                    </span>
                    <span className={`w-16 mr-4 font-bold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-cyan-400 w-32 mr-4">
                      {log.function}
                    </span>
                    <span className="text-white flex-1">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}