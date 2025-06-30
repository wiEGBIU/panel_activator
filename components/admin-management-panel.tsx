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
  Shield, 
  Plus, 
  Trash2, 
  User, 
  Server,
  Crown,
  AlertCircle,
  CheckCircle,
  Lock,
  Globe,
  Edit,
  Save,
  X,
  Settings,
  Key
} from 'lucide-react';

export function AdminManagementPanel() {
  const { user, admins, addAdmin, removeAdmin, updateAdmin, updateSuperAdminCredentials } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiHost, setApiHost] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Edit state
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editApiHost, setEditApiHost] = useState('');

  // Super admin credentials change
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [newSuperUsername, setNewSuperUsername] = useState('');
  const [newSuperPassword, setNewSuperPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  // Only allow super admins to access this panel
  if (user?.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Superadmin Access Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Only superadministrators can manage admin users and their API endpoints.
        </p>
      </div>
    );
  }

  const handleAddAdmin = async () => {
    if (!username.trim() || !password.trim() || !apiHost.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic URL validation
    try {
      new URL(apiHost);
    } catch {
      toast.error('Please enter a valid API host URL');
      return;
    }

    setIsAdding(true);
    try {
      const success = await addAdmin(username.trim(), password.trim(), apiHost.trim());
      if (success) {
        toast.success('Admin added successfully');
        setUsername('');
        setPassword('');
        setApiHost('');
      } else {
        toast.error('Failed to add admin - username may already exist');
      }
    } catch (error) {
      toast.error('Failed to add admin');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = (adminId: string, adminUsername: string) => {
    removeAdmin(adminId);
    toast.success(`Admin ${adminUsername} removed successfully`);
  };

  const startEdit = (admin: any) => {
    setEditingAdmin(admin.id);
    setEditUsername(admin.username);
    setEditPassword(admin.password);
    setEditApiHost(admin.api_host);
  };

  const cancelEdit = () => {
    setEditingAdmin(null);
    setEditUsername('');
    setEditPassword('');
    setEditApiHost('');
  };

  const saveEdit = async () => {
    if (!editUsername.trim() || !editPassword.trim() || !editApiHost.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic URL validation
    try {
      new URL(editApiHost);
    } catch {
      toast.error('Please enter a valid API host URL');
      return;
    }

    try {
      const success = await updateAdmin(editingAdmin!, editUsername.trim(), editPassword.trim(), editApiHost.trim());
      if (success) {
        toast.success('Admin updated successfully');
        setEditingAdmin(null);
      } else {
        toast.error('Failed to update admin - username may already exist');
      }
    } catch (error) {
      toast.error('Failed to update admin');
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
            <Crown className="w-7 h-7 text-yellow-500" />
            <span>Admin Management</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage admin users and their API endpoints (Superadmin only)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20">
                <Key className="w-4 h-4 mr-2" />
                Change Credentials
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
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Admins: {admins.length}
          </div>
        </div>
      </motion.div>

      {/* Add Admin Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span>Add New Admin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_username"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin_password"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-host">API Host</Label>
                <Input
                  id="api-host"
                  value={apiHost}
                  onChange={(e) => setApiHost(e.target.value)}
                  placeholder="https://api1.example.com"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleAddAdmin}
                  disabled={isAdding || !username.trim() || !password.trim() || !apiHost.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admins List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Admin Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Admins Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first admin user to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin, index) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {editingAdmin === admin.id ? (
                      // Edit mode
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="Username"
                          className="text-sm"
                        />
                        <Input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Password"
                          className="text-sm"
                        />
                        <Input
                          value={editApiHost}
                          onChange={(e) => setEditApiHost(e.target.value)}
                          placeholder="API Host"
                          className="text-sm"
                        />
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={saveEdit}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {admin.username}
                              </h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                                Admin
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <Globe className="w-4 h-4" />
                                <span className="font-mono">{admin.api_host}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                <span>Created: {new Date(admin.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                          </div>
                          
                          <Button
                            onClick={() => startEdit(admin)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => handleRemoveAdmin(admin.id, admin.username)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span>Admin System Architecture</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <p className="font-medium">Superadmin Role</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Only superadmins can add/remove/edit admin users. Admin list is stored locally in browser storage.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <p className="font-medium">Admin Full Access</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      All admins have the same interface with full access to manage codes, send emails, and activate users.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <p className="font-medium">API Host Routing</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Each admin's API requests are routed to their configured API host (e.g., api1.example.com, api2.example.com).
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