'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperuser, getCurrentUser, getAuthToken, getStoredUser } from '@/utils/sessionAuth';
import { buildApiUrl } from '@/lib/api';
import { Loader2, CheckCircle } from 'lucide-react';

interface AdminUser {
  user_id: number;
  client_id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperuser: boolean;
  created_at: string | null;
  last_login: string | null;
}

interface ActivityLog {
  log_key: string;
  description: string;
  timestamp: string | null;
  data: any;
}


export function UserPermissions({ onNavigateBack }: { onNavigateBack: () => void }) {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newSuperuserStatus, setNewSuperuserStatus] = useState(false);
  
  // Loading and notification states
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is superuser
  if (!isSuperuser()) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            You don't have superuser privileges to access user permissions management. Only superuser administrators can manage user roles and permissions.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
    // Get the user_id from the JWT token to ensure we have the correct ID
    const tokenUser = getCurrentUser();
    console.log('UserPermissions - Token user:', tokenUser);
    const storedUser = getStoredUser();
    console.log('UserPermissions - Stored user from session:', storedUser);
    
    if (tokenUser) {
      const userId = parseInt(tokenUser.sub);
      console.log('UserPermissions - Setting current user ID to:', userId);
      setCurrentUserId(userId);
    } else {
      console.log('UserPermissions - No token user found, setting current user ID to null');
      setCurrentUserId(null);
    }
  }, []);

  // Debug logging to help troubleshoot
  useEffect(() => {
    console.log('UserPermissions Debug:');
    console.log('Current user ID:', currentUserId);
    console.log('Current user ID type:', typeof currentUserId);
    console.log('Admin users:', adminUsers);
    if (adminUsers.length > 0) {
      console.log('First admin user ID:', adminUsers[0].user_id);
      console.log('First admin user ID type:', typeof adminUsers[0].user_id);
      console.log('Comparison for first user:', currentUserId !== adminUsers[0].user_id);
      console.log('Strict equality check:', currentUserId !== adminUsers[0].user_id);
      console.log('Loose equality check:', currentUserId != adminUsers[0].user_id);
    }
  }, [currentUserId, adminUsers]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load admin users and activity logs in parallel
      const token = getAuthToken();
      const [usersResponse, logsResponse] = await Promise.all([
        fetch(buildApiUrl('/api/admin/users'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(buildApiUrl('/api/admin/activity-logs?limit=20'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      // Check each response individually for better error handling
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json().catch(() => ({}));
        throw new Error(`Failed to load admin users: ${errorData.error || usersResponse.statusText}`);
      }
      if (!logsResponse.ok) {
        const errorData = await logsResponse.json().catch(() => ({}));
        throw new Error(`Failed to load activity logs: ${errorData.error || logsResponse.statusText}`);
      }

      const usersData = await usersResponse.json();
      const logsData = await logsResponse.json();

      setAdminUsers(usersData.admin_users || []);
      setActivityLogs(logsData.logs || []);
    } catch (error) {
      console.error('Error loading user permissions data:', error);
      setError('Failed to load user permissions data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setIsUpdatingRole(true);

    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.user_id}/role`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isSuperuser: newSuperuserStatus,
          reason: roleChangeReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      const result = await response.json();
      console.log('Role updated successfully:', result);
      
      // Close dialog and refresh data
      setRoleDialogOpen(false);
      setRoleChangeReason('');
      setSelectedUser(null);
      
      // Show success notification
      const userName = `${selectedUser.username} (${selectedUser.email})`;
      const newRole = newSuperuserStatus ? 'Superuser' : 'Admin';
      setSuccessMessage(`Successfully changed ${userName} role to ${newRole}`);
      setShowSuccessNotification(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
      
      loadData();
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(buildApiUrl(`/api/admin/users/${selectedUser.user_id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deleteReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete admin user');
      }

      const result = await response.json();
      console.log('User deleted successfully:', result);
      
      // Close dialog and refresh data
      setDeleteDialogOpen(false);
      setDeleteReason('');
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete admin user');
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getLogDescription = (log: ActivityLog) => {
    if (log.description.includes('role change')) {
      const data = log.data;
      const action = data.new_is_superuser ? 'Promoted to superuser' : 'Demoted from superuser';
      // Use username if available, otherwise fall back to user_id
      const userIdentifier = data.username || `User ${data.user_id}`;
      // Add reason if provided
      const reason = data.reason && data.reason.trim() ? ` - Reason: ${data.reason}` : '';
      return `${action} - ${userIdentifier}${reason}`;
    }
    if (log.description.includes('deletion')) {
      return `Admin user deleted - ${log.data.deleted_username} (${log.data.deleted_email})`;
    }
    if (log.description.includes('demotion')) {
      const data = log.data;
      const userIdentifier = data.username || `User ${data.user_id}`;
      return `Admin user demoted - ${userIdentifier}`;
    }
    // Handle security code related logs
    if (log.log_key === 'admin_security_code') {
      return `Admin security code updated to: ${log.data.security_code || log.data.raw_value || 'Unknown'}`;
    }
    if (log.log_key === 'admin_security_code_updated_by') {
      return `Security code updated by: ${log.data.username || log.data.raw_value || 'Unknown user'}`;
    }
    return log.description;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with gradient background matching admin dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-lg p-4 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              User Permissions
            </h2>
            <p className="text-blue-100 text-sm">Manage admin user roles and monitor administrative activities</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateBack}
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-md backdrop-blur-sm">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-500/20 text-gray-700 font-medium rounded-md transition-all duration-300 hover:bg-gray-100 data-[state=active]:hover:from-blue-700 data-[state=active]:hover:to-blue-800 text-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Admin Users
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-500/20 text-gray-700 font-medium rounded-md transition-all duration-300 hover:bg-gray-100 data-[state=active]:hover:from-blue-700 data-[state=active]:hover:to-blue-800 text-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Activity Logs
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Admin Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-sm relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-lg"></div>
             
            {/* Header with enhanced styling */}
            <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Admin User Management</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Manage administrator roles and permissions</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-md text-xs">
                {adminUsers.length} admin users
              </Badge>
            </div>
             
            <div className="relative z-10 space-y-3">
              {adminUsers.map((user) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-lg hover:bg-white/90 hover:shadow-md hover:border-blue-200/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      {user.isSuperuser && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{user.username}</span>
                        <Badge
                          variant={user.isSuperuser ? "default" : "secondary"}
                          className={`${user.isSuperuser
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-md'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-md'
                          } text-xs`}
                        >
                          <div className="flex items-center gap-1">
                            {user.isSuperuser ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                            {user.isSuperuser ? "Superuser" : "Admin"}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{user.email}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created: {formatDateTime(user.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Last login: {formatDateTime(user.last_login)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Debug: Show buttons conditionally with robust comparison */}
                    {(() => {
                      // Ensure both values are numbers for comparison
                      const currentUserIdNum = currentUserId ? parseInt(currentUserId.toString()) : null;
                      const adminUserIdNum = user.user_id ? parseInt(user.user_id.toString()) : null;
                      const shouldShowButtons = currentUserIdNum !== adminUserIdNum;
                      
                      console.log(`=== User ${user.username} Button Visibility Debug ===`);
                      console.log(`  - User ID from API: ${user.user_id} (${typeof user.user_id})`);
                      console.log(`  - Current user ID: ${currentUserId} (${typeof currentUserId})`);
                      console.log(`  - Parsed current ID: ${currentUserIdNum} (${typeof currentUserIdNum})`);
                      console.log(`  - Parsed admin ID: ${adminUserIdNum} (${typeof adminUserIdNum})`);
                      console.log(`  - Should show buttons: ${shouldShowButtons}`);
                      console.log(`  - Strict comparison result: ${currentUserIdNum} !== ${adminUserIdNum} = ${currentUserIdNum !== adminUserIdNum}`);
                      console.log(`  - Is same user?: ${currentUserIdNum === adminUserIdNum}`);
                      console.log(`================================================`);
                      
                      return shouldShowButtons;
                    })() && (
                      <>
                        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                          <DialogTrigger asChild>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewSuperuserStatus(!user.isSuperuser);
                                }}
                                className="bg-white/80 hover:bg-white border-gray-300 hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all duration-300 backdrop-blur-sm text-xs px-2 py-1"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Change Role
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change User Role</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>User: {selectedUser?.username}</Label>
                                <div className="text-sm text-gray-600">{selectedUser?.email}</div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={newSuperuserStatus}
                                  onCheckedChange={setNewSuperuserStatus}
                                />
                                <Label>Superuser Admin</Label>
                              </div>
                              
                              <div>
                                <Label htmlFor="reason" className="text-sm">Reason for change</Label>
                                <Textarea
                                  id="reason"
                                  placeholder="Enter reason for role change..."
                                  value={roleChangeReason}
                                  onChange={(e) => setRoleChangeReason(e.target.value)}
                                  className="text-sm resize-none"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-2">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRoleDialogOpen(false)}
                                    className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
                                  >
                                    Cancel
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    onClick={handleRoleChange}
                                    disabled={isUpdatingRole}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-500/20 backdrop-blur-sm flex items-center gap-2 text-sm px-3 py-1.5"
                                  >
                                    {isUpdatingRole ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Update Role'
                                    )}
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 text-xs px-2 py-1"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete User
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Admin User</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>User: {selectedUser?.username}</Label>
                                <div className="text-sm text-gray-600">{selectedUser?.email}</div>
                              </div>
                              
                              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                This will permanently delete the admin user account from the system. This action cannot be undone.
                              </div>
                              
                              <div>
                                <Label htmlFor="deleteReason" className="text-sm">Reason for removal</Label>
                                <Textarea
                                  id="deleteReason"
                                  placeholder="Enter reason for user deletion..."
                                  value={deleteReason}
                                  onChange={(e) => setDeleteReason(e.target.value)}
                                  className="text-sm resize-none"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-2">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteDialogOpen(false)}
                                    className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
                                  >
                                    Cancel
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDeleteUser}
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-red-500/20 backdrop-blur-sm text-sm px-3 py-1.5"
                                  >
                                    Delete Admin User
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="p-4 shadow-lg border-0 bg-gradient-to-br from-white via-blue-50/30 to-white backdrop-blur-sm relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-lg"></div>
             
            {/* Enhanced Header */}
            <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Activity Logs</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Track all administrative actions and changes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-md text-xs">
                  {activityLogs.length} logs
                </Badge>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    className="bg-white/80 hover:bg-white border-gray-300 hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all duration-300 backdrop-blur-sm text-xs px-2 py-1"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </motion.div>
              </div>
            </div>
             
            <div className="relative z-10 space-y-3">
              {activityLogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">No activity logs found</h4>
                  <p className="text-sm text-gray-500">Administrative actions will appear here once performed</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log, index) => (
                    <motion.div
                      key={`${log.log_key}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group relative overflow-hidden"
                    >
                      {/* Log entry card with enhanced styling */}
                      <div className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-lg hover:bg-white/90 hover:shadow-md hover:border-blue-200/50 transition-all duration-300">
                        {/* Icon indicator based on log type */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                          {(() => {
                            if (log.description.includes('role change') || log.log_key === 'admin_security_code') {
                              return (
                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              );
                            }
                            if (log.description.includes('deletion')) {
                              return (
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              );
                            }
                            return (
                              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            );
                          })()}
                        </div>
                         
                        {/* Log content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1 leading-tight text-sm">
                            {getLogDescription(log)}
                          </div>
                          <div className="text-xs text-gray-600 leading-relaxed">
                            {log.description}
                          </div>
                          {/* Additional log data display if available */}
                          {log.data && typeof log.data === 'object' && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                         
                        {/* Timestamp */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDateTime(log.timestamp)}
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 border-0"
                            >
                              {log.log_key}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Accent border */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 opacity-60"></div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Success</p>
                <p className="text-xs">{successMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessNotification(false)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}