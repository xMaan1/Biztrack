'use client';

import React, { useState } from 'react';
import { useRBAC } from '@/src/contexts/RBACContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { OwnerGuard } from '@/src/components/guards/PermissionGuard';
import { DashboardLayout } from '../../components/layout';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { CreateUserModal } from '@/src/components/users/CreateUserModal';
import { EditUserModal } from '@/src/components/users/EditUserModal';
import { RoleManagementModal } from '@/src/components/users/RoleManagementModal';

export default function UserManagementPage() {
  const { tenantUsers, roles, loading, refreshData, removeTenantUser } = useRBAC();
  const { canManageUsers, isOwner } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user from the tenant?')) {
      try {
        await removeTenantUser(userId);
        await refreshData();
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    return roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInitials = (firstName?: string, lastName?: string, userName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (userName) {
      return userName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <OwnerGuard>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their permissions within your organization
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Manage Roles
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantUsers.filter(u => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantUsers.filter(u => u.role?.name === 'owner').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {tenantUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {getInitials(user.firstName, user.lastName, user.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.userName
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.role && (
                            <Badge variant="outline">
                              {getRoleDisplayName(user.role.name)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(user.joinedAt).toLocaleDateString()}
                      </div>
                      {canManageUsers() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
                {tenantUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found. Add your first user to get started.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateUserModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshData();
          }}
        />
        
        <EditUserModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          user={selectedUser}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            refreshData();
          }}
        />
        
        <RoleManagementModal
          open={showRoleModal}
          onOpenChange={setShowRoleModal}
          onSuccess={() => {
            setShowRoleModal(false);
            refreshData();
          }}
        />
        </OwnerGuard>
      </div>
    </DashboardLayout>
  );
}