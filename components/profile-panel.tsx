"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { 
  User, 
  Edit, 
  Save, 
  Key,
  AlertCircle,
  Shield,
  Globe,
  Calendar,
  Crown
} from 'lucide-react';

export function ProfilePanel() {
  const { user, updateCurrentAdminProfile, updateSuperAdminCredentials } = useAuth();
  
  // Profile update state
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Super admin credentials change (for superadmin only)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [newSuperUsername, setNewSuperUsername] = useState('');
  const [newSuperPassword, setNewSuperPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const handleUpdateProfile = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error('Please fill in both username and password');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const success = await updateCurrentAdminProfile(newUsername.trim(), newPassword.trim());
      if (success) {
        toast.success('Profile updated successfully. You will be logged out.');
        setShowProfileDialog(false);
        setNewUsername('');
        setNewPassword('');
      } else {
        toast.error('Failed to update profile - username may already exist');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateSuperAdminCredentials = async () => {
    if (!newSuperUsername.trim() || !newSuperPassword.trim()) {
      toast.error('Please fill in both username and password');
      return;
    }

    setIsUpdatingCredentials(true);
    try {
      await updateSuperAdminCredentials(newSuperUsername.trim(), newSuperPassword.trim());
      toast.success('Superadmin credentials updated successfully. You will be logged out.');
      setShowCredentialsDialog(false);
      setNewSuperUsername('');
      setNewSuperPassword('');
    } catch (error) {
      toast.error('Failed to update credentials');
    } finally {
      setIsUpdatingCredentials(false);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <User className="w-7 h-7 text-blue-500" />
            <span>Profile Settings</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information and credentials
          </p>
        </div>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-500" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current User Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {user?.role === 'superadmin' ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user?.username}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.role === 'superadmin' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Globe className="w-4 h-4" />
                      <span>API Host: {user?.role === 'superadmin' ? 'localhost:8000 (Default)' : user?.api_host || 'Not configured'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Role: {user?.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {user?.role === 'admin' && (
                  <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        <Edit className="w-4 h-4 mr-2" />
                        Update Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Edit className="w-5 h-5 text-blue-500" />
                          <span>Update Your Profile</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-username">New Username</Label>
                          <Input
                            id="new-username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="Enter new username"
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium">Important:</p>
                              <p>After updating your profile, you will be automatically logged out and need to sign in with your new credentials.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowProfileDialog(false);
                              setNewUsername('');
                              setNewPassword('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateProfile}
                            disabled={isUpdatingProfile || !newUsername.trim() || !newPassword.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isUpdatingProfile ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Update Profile
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {user?.role === 'superadmin' && (
                  <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20">
                        <Key className="w-4 h-4 mr-2" />
                        Change Superadmin Credentials
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Key className="w-5 h-5 text-yellow-500" />
                          <span>Update Superadmin Credentials</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-super-username">New Username</Label>
                          <Input
                            id="new-super-username"
                            value={newSuperUsername}
                            onChange={(e) => setNewSuperUsername(e.target.value)}
                            placeholder="Enter new username"
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-super-password">New Password</Label>
                          <Input
                            id="new-super-password"
                            type="password"
                            value={newSuperPassword}
                            onChange={(e) => setNewSuperPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                              <p className="font-medium">Important:</p>
                              <p>After updating your credentials, you will be automatically logged out and need to sign in with your new username and password.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCredentialsDialog(false);
                              setNewSuperUsername('');
                              setNewSuperPassword('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateSuperAdminCredentials}
                            disabled={isUpdatingCredentials || !newSuperUsername.trim() || !newSuperPassword.trim()}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            {isUpdatingCredentials ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Update Credentials
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Security Information</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <p className="font-medium">Profile Security</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user?.role === 'admin' 
                        ? 'As an admin, you can update your own username and password. Changes require re-authentication.'
                        : 'As a superadmin, you can update your credentials and manage all admin users.'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <p className="font-medium">Automatic Logout</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      For security reasons, updating your credentials will automatically log you out. You'll need to sign in again with your new credentials.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <p className="font-medium">Data Persistence</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {user?.role === 'admin' 
                        ? 'Your profile changes are stored securely and will be reflected across all your sessions.'
                        : 'Superadmin credential changes affect the demo login system and are stored locally.'
                      }
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