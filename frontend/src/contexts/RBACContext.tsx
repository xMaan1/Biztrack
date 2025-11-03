'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/src/services/ApiService';
import { useAuth } from './AuthContext';

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  userId: string;
  role_id: string;
  custom_permissions: string[];
  isActive: boolean;
  invitedBy?: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  user?: {
    id: string;
    userName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface UserWithPermissions {
  id: string;
  tenant_user_id?: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  role?: Role;
  role_id?: string;
  custom_permissions?: string[];
  permissions: string[];
  joinedAt: string;
}

export interface UserPermissions {
  permissions: string[];
  accessible_modules: string[];
  is_owner: boolean;
}

export interface CreateUserData {
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
}

export interface CreateTenantUserData {
  tenant_id: string;
  userId: string;
  role_id: string;
  custom_permissions?: string[];
  isActive?: boolean;
}

export interface UpdateTenantUserData {
  role_id?: string;
  custom_permissions?: string[];
  isActive?: boolean;
}

export interface CreateRoleData {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleData {
  display_name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

interface RBACContextType {
  // State
  roles: Role[];
  tenantUsers: UserWithPermissions[];
  userPermissions: UserPermissions | null;
  loading: boolean;
  initializing: boolean;

  // Role management
  fetchRoles: () => Promise<void>;
  createRole: (roleData: CreateRoleData) => Promise<Role>;
  updateRole: (roleId: string, roleData: UpdateRoleData) => Promise<Role>;

  // User management
  fetchTenantUsers: () => Promise<void>;
  createUser: (userData: CreateUserData, roleId: string) => Promise<any>;
  createTenantUser: (userData: CreateTenantUserData) => Promise<TenantUser>;
  updateTenantUser: (userId: string, userData: UpdateTenantUserData) => Promise<TenantUser>;
  removeTenantUser: (userId: string) => Promise<void>;

  // Permission checking
  fetchUserPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  isOwner: () => boolean;

  // Utility
  refreshData: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenantUsers, setTenantUsers] = useState<UserWithPermissions[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/rbac/roles');
      if (response.roles) {
        setRoles(response.roles);
      } else if (response.success && response.data?.roles) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (roleData: CreateRoleData): Promise<Role> => {
    try {
      const response = await apiService.post('/rbac/roles', roleData);
      if (response.success) {
        await fetchRoles(); // Refresh roles list
        return response.data;
      }
      throw new Error(response.message || 'Failed to create role');
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  };

  const updateRole = async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    try {
      const response = await apiService.put(`/rbac/roles/${roleId}`, roleData);
      if (response.success) {
        await fetchRoles(); // Refresh roles list
        return response.data;
      }
      throw new Error(response.message || 'Failed to update role');
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  };

  const fetchTenantUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/rbac/tenant-users');
      if (Array.isArray(response)) {
        setTenantUsers(response);
      } else if (response.success && Array.isArray(response.data)) {
        setTenantUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tenant users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData, roleId: string): Promise<any> => {
    try {
      const response = await apiService.post(`/rbac/create-user?role_id=${roleId}`, userData);
      if (response.success) {
        await fetchTenantUsers(); // Refresh users list
        return response.data;
      }
      throw new Error(response.message || 'Failed to create user');
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const createTenantUser = async (userData: CreateTenantUserData): Promise<TenantUser> => {
    try {
      const response = await apiService.post('/rbac/tenant-users', userData);
      if (response.success) {
        await fetchTenantUsers(); // Refresh users list
        return response.data;
      }
      throw new Error(response.message || 'Failed to add user to tenant');
    } catch (error) {
      console.error('Failed to add user to tenant:', error);
      throw error;
    }
  };

  const updateTenantUser = async (userId: string, userData: UpdateTenantUserData): Promise<TenantUser> => {
    try {
      const response = await apiService.put(`/rbac/tenant-users/${userId}`, userData);
      if (response.success) {
        await fetchTenantUsers(); // Refresh users list
        return response.data;
      }
      throw new Error(response.message || 'Failed to update user');
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const removeTenantUser = async (userId: string): Promise<void> => {
    try {
      const response = await apiService.delete(`/rbac/tenant-users/${userId}`);
      if (response.success) {
        await fetchTenantUsers(); // Refresh users list
      } else {
        throw new Error(response.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      throw error;
    }
  };

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/rbac/permissions');

      if (response.permissions && response.accessible_modules !== undefined) {
        setUserPermissions(response);
      } else if (response.success) {
        setUserPermissions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    // Force refresh by clearing current permissions first, then fetching new ones
    setUserPermissions(null);
    await fetchUserPermissions();
  };

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.includes(permission);
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.accessible_modules.includes(module);
  };

  const isOwner = (): boolean => {
    if (!userPermissions) return false;
    return userPermissions.is_owner;
  };

  const refreshData = useCallback(async () => {
    setInitializing(true);
    try {
      await Promise.all([
        fetchRoles(),
        fetchTenantUsers(),
        fetchUserPermissions()
      ]);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    } else {
      setUserPermissions(null);
      setRoles([]);
      setTenantUsers([]);
      setInitializing(false);
    }
  }, [isAuthenticated, user, refreshData]);

  const value: RBACContextType = {
    roles,
    tenantUsers,
    userPermissions,
    loading,
    initializing,
    fetchRoles,
    createRole,
    updateRole,
    fetchTenantUsers,
    createUser,
    createTenantUser,
    updateTenantUser,
    removeTenantUser,
    fetchUserPermissions,
    refreshPermissions,
    hasPermission,
    hasModuleAccess,
    isOwner,
    refreshData
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}
