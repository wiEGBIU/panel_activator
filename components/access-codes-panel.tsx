"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Download,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AccessCode {
  code: string;
  created_at: string;
  status: string;
}

const ITEMS_PER_PAGE = 20;

export function AccessCodesPanel() {
  const { user } = useAuth();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Generation form
  const [generateCount, setGenerateCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const loadAccessCodesCount = async () => {
    if (!apiClient) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.getAccessCodesCount();
      setTotalCount(response.count || 0);
    } catch (error) {
      toast.error('Failed to load access codes count');
      console.error('Error loading access codes count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccessCodes = async () => {
    if (!apiClient) return;
    
    setIsLoadingCodes(true);
    try {
      const response = await apiClient.getAccessCodes();
      // Convert the response format to match the expected structure
      const codes = response.access_codes?.map((code: string) => ({
        code,
        created_at: new Date().toISOString(), // API doesn't return created_at for list format
        status: 'active'
      })) || [];
      setAccessCodes(codes);
      setTotalCount(codes.length);
    } catch (error) {
      toast.error('Failed to load access codes');
      console.error('Error loading access codes:', error);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadAccessCodesCount();
  }, [user]);

  const handleGenerate = async () => {
    if (!apiClient) return;
    
    setIsGenerating(true);
    try {
      await apiClient.generateAccessCodes(generateCount);
      toast.success(`Generated ${generateCount} access codes`);
      loadAccessCodesCount();
      if (showCodes) {
        loadAccessCodes();
      }
      setGenerateCount(10);
    } catch (error) {
      toast.error('Failed to generate access codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!apiClient) return;
    
    try {
      await apiClient.deleteAccessCode(code);
      toast.success('Access code deleted');
      loadAccessCodesCount();
      if (showCodes) {
        loadAccessCodes();
      }
    } catch (error) {
      toast.error('Failed to delete access code');
    }
  };

  const handleBulkDelete = async () => {
    if (!apiClient || selectedCodes.length === 0) return;
    
    try {
      await apiClient.deleteAccessCodesBulk(selectedCodes);
      toast.success(`Deleted ${selectedCodes.length} access codes`);
      setSelectedCodes([]);
      loadAccessCodesCount();
      if (showCodes) {
        loadAccessCodes();
      }
    } catch (error) {
      toast.error('Failed to delete access codes');
    }
  };

  const handleShowCodes = async () => {
    if (!showCodes) {
      await loadAccessCodes();
    }
    setShowCodes(!showCodes);
  };

  const filteredCodes = accessCodes.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedCodes.length === paginatedCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(paginatedCodes.map(code => code.code));
    }
  };

  const exportCodes = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Code,Created At,Status\n" +
      filteredCodes.map(code => `${code.code},${code.created_at},${code.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "access_codes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Codes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and generate access codes for user activations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {totalCount} codes
          </span>
          <Button
            onClick={loadAccessCodesCount}
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

      {/* Generate Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span>Generate Access Codes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Codes</Label>
                <Input
                  id="count"
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || generateCount < 1}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Codes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-green-500" />
                <span>Access Codes List</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                {selectedCodes.length > 0 && (
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedCodes.length})
                  </Button>
                )}
                <Button
                  onClick={exportCodes}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                  disabled={!showCodes || accessCodes.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleShowCodes}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                  disabled={isLoadingCodes}
                >
                  {isLoadingCodes ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : showCodes ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {showCodes ? 'Hide' : 'Show'} Codes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search access codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600"
                  disabled={!showCodes}
                />
              </div>
              
              {showCodes && (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    {selectedCodes.length === paginatedCodes.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              )}
            </div>

            {/* Codes Display */}
            <AnimatePresence mode="wait">
              {!showCodes ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {totalCount} Access Codes Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Click "Show Codes" to load and view all access codes
                  </p>
                  <Button
                    onClick={handleShowCodes}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    disabled={isLoadingCodes}
                  >
                    {isLoadingCodes ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {isLoadingCodes ? 'Loading...' : 'Show All Codes'}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="codes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {isLoadingCodes ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : paginatedCodes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No access codes found</p>
                    </div>
                  ) : (
                    <>
                      {paginatedCodes.map((code, index) => (
                        <motion.div
                          key={code.code}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedCodes.includes(code.code)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCodes([...selectedCodes, code.code]);
                                } else {
                                  setSelectedCodes(selectedCodes.filter(c => c !== code.code));
                                }
                              }}
                            />
                            <div>
                              <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                {code.code}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Status: Active
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Active
                            </span>
                            <Button
                              onClick={() => handleDelete(code.code)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredCodes.length)} of {filteredCodes.length} codes
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
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}