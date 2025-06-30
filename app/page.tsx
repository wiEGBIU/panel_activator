"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNavigation } from '@/components/dashboard-navigation';
import { OverviewPanel } from '@/components/overview-panel';
import { SuperAdminOverviewPanel } from '@/components/superadmin-overview-panel';
import { AccessCodesPanel } from '@/components/access-codes-panel';
import { PromoCodesPanel } from '@/components/promo-codes-panel';
import { UserActivationPanel } from '@/components/user-activation-panel';
import { AdminManagementPanel } from '@/components/admin-management-panel';
import { ProfilePanel } from '@/components/profile-panel';
import { LogsPanel } from '@/components/logs-panel';
import { CheckerPanel } from '@/components/checker-panel';

function DashboardContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'overview':
        return user.role === 'superadmin' ? 
          <SuperAdminOverviewPanel /> : 
          <OverviewPanel onNavigate={setActiveTab} />;
      case 'access-codes':
        return user.role === 'admin' ? <AccessCodesPanel /> : null;
      case 'promo-codes':
        return user.role === 'admin' ? <PromoCodesPanel /> : null;
      case 'user-activation':
        return user.role === 'admin' ? <UserActivationPanel /> : null;
      case 'logs':
        return user.role === 'admin' ? <LogsPanel /> : null;
      case 'checker':
        return user.role === 'admin' ? <CheckerPanel /> : null;
      case 'profile':
        return <ProfilePanel />;
      case 'admin-management':
        return user.role === 'superadmin' ? <AdminManagementPanel /> : null;
      default:
        return user.role === 'superadmin' ? 
          <SuperAdminOverviewPanel /> : 
          <OverviewPanel onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <DashboardNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderActivePanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}