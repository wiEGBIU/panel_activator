"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { ApiClient, CheckerResponse } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  Plus,
  Download,
  Copy,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export function CheckerPanel() {
  const { user } = useAuth();
  const [inputCodes, setInputCodes] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckerResponse | null>(null);
  const [isAddingCodes, setIsAddingCodes] = useState(false);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const handleCheckCodes = async () => {
    if (!apiClient || !inputCodes.trim()) {
      toast.error('Please enter promo codes to check');
      return;
    }

    const codes = inputCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codes.length === 0) {
      toast.error('No valid codes found');
      return;
    }

    if (codes.length > 1000) {
      toast.error('Maximum 1000 codes allowed per check');
      return;
    }

    setIsChecking(true);
    try {
      const response = await apiClient.checkPromoCodes(codes);
      setResults(response);
      toast.success(`Checked ${codes.length} codes successfully`);
    } catch (error) {
      toast.error('Failed to check promo codes');
      console.error('Error checking codes:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddWorkingCodes = async () => {
    if (!apiClient || !results?.results.working_codes.length) {
      toast.error('No working codes to add');
      return;
    }

    setIsAddingCodes(true);
    try {
      const codes = results.results.working_codes.map(code => ({ promo_code: code }));
      await apiClient.addPromoCodesBulk(codes);
      toast.success(`Added ${codes.length} working codes to the promo codes list`);
    } catch (error) {
      toast.error('Failed to add working codes');
      console.error('Error adding codes:', error);
    } finally {
      setIsAddingCodes(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportResults = (category: string, codes: string[]) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Code,Status\n" +
      codes.map(code => `${code},${category}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${category}_codes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCodesCount = () => {
    return inputCodes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0).length;
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Promo Code Checker</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Validate promo codes and categorize them by status
          </p>
        </div>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-500" />
              <span>Check Promo Codes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codes-input">Promo Codes (one per line)</Label>
                <Textarea
                  id="codes-input"
                  value={inputCodes}
                  onChange={(e) => setInputCodes(e.target.value)}
                  placeholder="Enter promo codes, one per line..."
                  rows={8}
                  className="border-gray-300 dark:border-gray-600 font-mono"
                />
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{getCodesCount()} codes detected</span>
                  <span>Maximum 1000 codes per check</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckCodes}
                disabled={isChecking || !inputCodes.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking Codes...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Codes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <span>Check Results</span>
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    {results.results.working_codes.length > 0 && (
                      <Button
                        onClick={handleAddWorkingCodes}
                        disabled={isAddingCodes}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isAddingCodes ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Add Working Codes to List
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {results.summary.working_codes}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Working</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                          {results.summary.already_redeemed}
                        </div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">Redeemed</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {results.summary.non_existent}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">Non-existent</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {results.summary.errors}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <Tabs defaultValue="working" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="working" className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Working ({results.results.working_codes.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="redeemed" className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Redeemed ({results.results.already_redeemed.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="nonexistent" className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4" />
                      <span>Non-existent ({results.results.non_existent.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="errors" className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Errors ({results.results.error.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  {Object.entries({
                    working: { codes: results.results.working_codes, color: 'green', icon: CheckCircle },
                    redeemed: { codes: results.results.already_redeemed, color: 'yellow', icon: AlertTriangle },
                    nonexistent: { codes: results.results.non_existent, color: 'red', icon: XCircle },
                    errors: { codes: results.results.error, color: 'gray', icon: AlertCircle }
                  }).map(([key, { codes, color, icon: Icon }]) => (
                    <TabsContent key={key} value={key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {key.charAt(0).toUpperCase() + key.slice(1)} Codes ({codes.length})
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => copyToClipboard(codes.join('\n'))}
                            variant="outline"
                            size="sm"
                            disabled={codes.length === 0}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy All
                          </Button>
                          <Button
                            onClick={() => exportResults(key, codes)}
                            variant="outline"
                            size="sm"
                            disabled={codes.length === 0}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>

                      {codes.length === 0 ? (
                        <div className="text-center py-8">
                          <Icon className={`w-16 h-16 text-${color}-400 mx-auto mb-4`} />
                          <p className="text-gray-500 dark:text-gray-400">
                            No {key} codes found
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                          {codes.map((code, index) => (
                            <motion.div
                              key={code}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-colors border border-${color}-200 dark:border-${color}-800`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Icon className={`w-4 h-4 text-${color}-500`} />
                                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                    {code}
                                  </span>
                                </div>
                                <Button
                                  onClick={() => copyToClipboard(code)}
                                  variant="ghost"
                                  size="sm"
                                  className={`text-${color}-600 hover:text-${color}-700 hover:bg-${color}-100 dark:text-${color}-400 dark:hover:text-${color}-300 dark:hover:bg-${color}-900/20`}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                <span>How Code Checking Works</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Working Codes</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Codes that are valid and can be redeemed. These can be added directly to your promo codes list.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Already Redeemed</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Codes that were valid but have already been used, expired, or reached their usage limit.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">Non-existent</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Codes that don't exist in the system or are invalid format.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-medium">4</div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Errors</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Codes that couldn't be checked due to network issues or API errors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}