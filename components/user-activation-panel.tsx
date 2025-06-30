"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Mail, 
  Shield, 
  Send, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export function UserActivationPanel() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [verification, setVerification] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const apiClient = user ? new ApiClient({ 
    baseUrl: user.role === 'superadmin' ? 'http://localhost:8000' : user.api_host || 'http://localhost:8000' 
  }) : null;

  const handleSendEmail = async () => {
    if (!apiClient || !email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const response = await apiClient.sendEmail(email.trim());
      
      if (response.status === 'success') {
        toast.success('Verification email sent successfully!');
        setEmail('');
      } else {
        toast.error(response.message || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send verification email');
      console.error('Error sending email:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleActivatePro = async () => {
    if (!apiClient || !email.trim() || !verification.trim() || !accessCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsActivating(true);
    try {
      const response = await apiClient.activatePro(email.trim(), verification.trim(), accessCode.trim());
      
      if (response.status === 'success' || response.status === 'active') {
        toast.success('Pro features activated successfully!');
        setEmail('');
        setVerification('');
        setAccessCode('');
      } else if (response.status === 'already_subscribed') {
        toast.info('User is already subscribed to pro features');
      } else {
        toast.error(response.message || 'Failed to activate pro features');
      }
    } catch (error) {
      toast.error('Failed to activate pro features');
      console.error('Error activating pro:', error);
    } finally {
      setIsActivating(false);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Activation</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Send verification emails and activate pro features for users
          </p>
        </div>
      </motion.div>

      {/* Send Email Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Send Verification Email</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-send">Email Address</Label>
                <Input
                  id="email-send"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !email.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activate Pro Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Activate Pro Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-activate">Email Address</Label>
                  <Input
                    id="email-activate"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification">Verification Code</Label>
                  <Input
                    id="verification"
                    type="text"
                    value={verification}
                    onChange={(e) => setVerification(e.target.value)}
                    placeholder="Enter verification code"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="access-code">Access Code</Label>
                  <Input
                    id="access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="KOO12345678"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleActivatePro}
                disabled={isActivating || !email.trim() || !verification.trim() || !accessCode.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Activating Pro...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Pro Features
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                <span>How to Use</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <p className="font-medium">Send Verification Email</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter the user's email address and click "Send Verification Email" to send them a verification code.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <p className="font-medium">Activate Pro Features</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Once the user receives their verification code, enter their email, verification code, and an access code to activate pro features.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <p className="font-medium">Access Codes</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Access codes can be generated in the "Access Codes" section. Each code can only be used once.
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