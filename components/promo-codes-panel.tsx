"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Gift, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Download,
  Search,
  CheckCheck,
  AlertCircle,
  CheckCircle,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PromoCodesData {
  working_promo_codes: string[];
  non_working_promo_codes: string[];
  working_count: number;
  non_working_count: number;
}

const ITEMS_PER_PAGE = 20;

export function PromoCodesPanel() {
  const { user } = useAuth();
  const [promoData, setPromoData] = useState<PromoCodesData>({
    working_promo_codes: [],
    non_working_promo_codes: [],
    working_count: 0,
    non_working_count: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('working');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Add form
  const [singleCode, setSingleCode] = useState('');
  const [bulkCodes, setBulkCodes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const loadPromoCodesCounts = async () => {
    if (!apiClient) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.getAllPromoCodesCounts();
      setPromoData(prev => ({
        ...prev,
        working_count: response.working_count || 0,
        non_working_count: response.non_working_count || 0
      }));
    } catch (error) {
      toast.error('Failed to load promo codes counts');
      console.error('Error loading promo codes counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPromoCodes = async () => {
    if (!apiClient) return;
    
    setIsLoadingCodes(true);
    try {
      const response = await apiClient.getPromoCodes();
      setPromoData(response);
    } catch (error) {
      toast.error('Failed to load promo codes');
      console.error('Error loading promo codes:', error);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadPromoCodesCounts();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when switching tabs or searching
  }, [activeTab, searchTerm]);

  const handleAddSingle = async () => {
    if (!apiClient || !singleCode.trim()) return;
    
    setIsAdding(true);
    try {
      await apiClient.addPromoCode(singleCode.trim());
      toast.success('Promo code added successfully');
      setSingleCode('');
      loadPromoCodesCounts();
      if (showCodes) {
        loadPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to add promo code');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddBulk = async () => {
    if (!apiClient || !bulkCodes.trim()) return;
    
    const codes = bulkCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0)
      .map(code => ({ promo_code: code }));

    if (codes.length === 0) {
      toast.error('No valid codes found');
      return;
    }

    setIsAdding(true);
    try {
      await apiClient.addPromoCodesBulk(codes);
      toast.success(`Added ${codes.length} promo codes`);
      setBulkCodes('');
      loadPromoCodesCounts();
      if (showCodes) {
        loadPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to add promo codes');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!apiClient) return;
    
    try {
      await apiClient.deletePromoCode(code);
      toast.success('Promo code deleted');
      loadPromoCodesCounts();
      if (showCodes) {
        loadPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const handleBulkDelete = async () => {
    if (!apiClient || selectedCodes.length === 0) return;
    
    try {
      await apiClient.deletePromoCodesBulk(selectedCodes);
      toast.success(`Deleted ${selectedCodes.length} promo codes`);
      setSelectedCodes([]);
      loadPromoCodesCounts();
      if (showCodes) {
        loadPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to delete promo codes');
    }
  };

  const handleClearAll = async () => {
    if (!apiClient) return;
    
    try {
      await apiClient.clearPromoCodes();
      toast.success('All promo codes cleared');
      setSelectedCodes([]);
      loadPromoCodesCounts();
      if (showCodes) {
        loadPromoCodes();
      }
    } catch (error) {
      toast.error('Failed to clear promo codes');
    }
  };

  const handleShowCodes = async () => {
    if (!showCodes) {
      await loadPromoCodes();
    }
    setShowCodes(!showCodes);
  };

  const getCurrentCodes = () => {
    return activeTab === 'working' ? promoData.working_promo_codes : promoData.non_working_promo_codes;
  };

  const getFilteredCodes = () => {
    return getCurrentCodes().filter(code => 
      code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Pagination
  const filteredCodes = getFilteredCodes();
  const totalPages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedCodes.length === paginatedCodes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(paginatedCodes);
    }
  };

  const exportCodes = () => {
    const codes = filteredCodes;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Code,Status\n" +
      codes.map(code => `${code},${activeTab}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_promo_codes.csv`);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Codes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage promotional codes for your application
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Working: {promoData.working_count} | Non-working: {promoData.non_working_count}
          </div>
          <Button
            onClick={loadPromoCodesCounts}
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

      {/* Add Codes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-500" />
              <span>Add Promo Codes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Code</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Label htmlFor="single-code">Promo Code</Label>
                    <Input
                      id="single-code"
                      value={singleCode}
                      onChange={(e) => setSingleCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddSingle}
                      disabled={isAdding || !singleCode.trim()}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      {isAdding ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Code
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="bulk-codes">Bulk Codes (one per line)</Label>
                  <Textarea
                    id="bulk-codes"
                    value={bulkCodes}
                    onChange={(e) => setBulkCodes(e.target.value)}
                    placeholder="Enter multiple promo codes, one per line"
                    rows={6}
                    className="border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {bulkCodes.split('\n').filter(code => code.trim().length > 0).length} codes detected
                    </p>
                    <Button
                      onClick={handleAddBulk}
                      disabled={isAdding || !bulkCodes.trim()}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      {isAdding ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Codes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
                <Gift className="w-5 h-5 text-purple-500" />
                <span>Promo Codes List</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                {selectedCodes.length > 0 && (
                  <>
                    <Button
                      onClick={handleBulkDelete}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedCodes.length})
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </>
                )}
                <Button
                  onClick={exportCodes}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                  disabled={!showCodes || getCurrentCodes().length === 0}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="working" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Working ({promoData.working_count})</span>
                </TabsTrigger>
                <TabsTrigger value="non-working" className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Non-Working ({promoData.non_working_count})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {/* Search and Controls */}
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search promo codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 dark:border-gray-600"
                      disabled={!showCodes}
                    />
                  </div>
                  
                  {showCodes && (
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      {selectedCodes.length === paginatedCodes.length ? 'Deselect All' : 'Select All'}
                    </Button>
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
                      <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {getCurrentCodes().length} {activeTab === 'working' ? 'Working' : 'Non-Working'} Codes
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Click "Show Codes" to load and view all promo codes
                      </p>
                      <Button
                        onClick={handleShowCodes}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
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
                          <p className="text-gray-500 dark:text-gray-400">No promo codes found</p>
                        </div>
                      ) : (
                        <>
                          {paginatedCodes.map((code, index) => (
                            <motion.div
                              key={code}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={selectedCodes.includes(code)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCodes([...selectedCodes, code]);
                                    } else {
                                      setSelectedCodes(selectedCodes.filter(c => c !== code));
                                    }
                                  }}
                                />
                                <div className="flex items-center space-x-3">
                                  {activeTab === 'working' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                    {code}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  activeTab === 'working' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {activeTab === 'working' ? 'Working' : 'Non-Working'}
                                </span>
                                {activeTab === 'working' && (
                                  <Button
                                    onClick={() => handleDelete(code)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}