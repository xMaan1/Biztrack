import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/ApiService';
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
  roles: Role[];
  tenantUsers: UserWithPermissions[];
  userPermissions: UserPermissions | null;
  loading: boolean;
  initializing: boolean;
  fetchRoles: () => Promise<void>;
  createRole: (roleData: CreateRoleData) => Promise<Role>;
  updateRole: (roleId: string, roleData: UpdateRoleData) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  fetchTenantUsers: () => Promise<void>;
  createUser: (userData: CreateUserData, roleId: string) => Promise<any>;
  createTenantUser: (userData: CreateTenantUserData) => Promise<TenantUser>;
  updateTenantUser: (userId: string, userData: UpdateTenantUserData) => Promise<TenantUser>;
  removeTenantUser: (userId: string) => Promise<void>;
  fetchUserPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  isOwner: () => boolean;
  refreshData: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

function extractErrorMessage(error: any, defaultMessage: string): string {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}

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
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (roleData: CreateRoleData): Promise<Role> => {
    try {
      const response = await apiService.post('/rbac/roles', roleData);
      if (response && response.id) {
        const newRole = response as Role;
        setRoles(prev => [...prev, newRole]);
        return newRole;
      }
      if (response.success && response.data) {
        const newRole = response.data;
        setRoles(prev => [...prev, newRole]);
        return newRole;
      }
      throw new Error(response.message || 'Failed to create role');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to create role');
      throw new Error(errorMessage);
    }
  };

  const updateRole = async (roleId: string, roleData: UpdateRoleData): Promise<Role> => {
    try {
      const response = await apiService.put(`/rbac/roles/${roleId}`, roleData);
      if (response && response.id) {
        const updatedRole = response as Role;
        setRoles(prev => prev.map(role => role.id === roleId ? updatedRole : role));
        setTenantUsers(prev => prev.map(user => 
          user.role?.id === roleId 
            ? { ...user, role: updatedRole }
            : user
        ));
        return updatedRole;
      }
      if (response.success && response.data) {
        const updatedRole = response.data;
        setRoles(prev => prev.map(role => role.id === roleId ? updatedRole : role));
        setTenantUsers(prev => prev.map(user => 
          user.role?.id === roleId 
            ? { ...user, role: updatedRole }
            : user
        ));
        return updatedRole;
      }
      throw new Error(response.message || 'Failed to update role');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to update role');
      throw new Error(errorMessage);
    }
  };

  const deleteRole = async (roleId: string): Promise<void> => {
    try {
      const response = await apiService.delete(`/rbac/roles/${roleId}`);
      if (response.success || response.message) {
        setRoles(prev => prev.filter(role => role.id !== roleId));
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to delete role');
      throw new Error(errorMessage);
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
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData, roleId: string): Promise<any> => {
    try {
      const response = await apiService.post(`/rbac/create-user?role_id=${roleId}`, userData);
      if (response && response.userId) {
        await fetchTenantUsers();
        return response;
      }
      if (response.success && response.data) {
        await fetchTenantUsers();
        return response.data;
      }
      throw new Error(response.message || 'Failed to create user');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to create user');
      throw new Error(errorMessage);
    }
  };

  const createTenantUser = async (userData: CreateTenantUserData): Promise<TenantUser> => {
    try {
      const response = await apiService.post('/rbac/tenant-users', userData);
      if (response && response.id) {
        await fetchTenantUsers();
        return response as TenantUser;
      }
      if (response.success && response.data) {
        await fetchTenantUsers();
        return response.data;
      }
      throw new Error(response.message || 'Failed to add user to tenant');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to add user to tenant');
      throw new Error(errorMessage);
    }
  };

  const updateTenantUser = async (userId: string, userData: UpdateTenantUserData): Promise<TenantUser> => {
    try {
      const response = await apiService.put(`/rbac/tenant-users/${userId}`, userData);
      if (response && response.id) {
        const updatedUser = response as TenantUser;
        const roleId = updatedUser.role_id || userData.role_id;
        const role = roles.find(r => r.id === roleId);
        
        const updatedUserWithRole: UserWithPermissions = {
          id: updatedUser.id,
          tenant_user_id: updatedUser.id,
          userName: updatedUser.user?.userName || '',
          email: updatedUser.user?.email || '',
          firstName: updatedUser.user?.firstName,
          lastName: updatedUser.user?.lastName,
          avatar: updatedUser.user?.avatar,
          isActive: updatedUser.isActive,
          role: role || undefined,
          role_id: roleId,
          custom_permissions: updatedUser.custom_permissions || [],
          permissions: role?.permissions || [],
          joinedAt: updatedUser.joinedAt,
        };
        
        setTenantUsers(prev => prev.map(user => {
          if (user.id === userId || user.tenant_user_id === userId) {
            return updatedUserWithRole;
          }
          return user;
        }));
        return updatedUser;
      }
      if (response.success && response.data) {
        const updatedUser = response.data;
        const roleId = updatedUser.role_id || userData.role_id;
        const role = roles.find(r => r.id === roleId);
        
        const updatedUserWithRole: UserWithPermissions = {
          id: updatedUser.id,
          tenant_user_id: updatedUser.id,
          userName: updatedUser.user?.userName || '',
          email: updatedUser.user?.email || '',
          firstName: updatedUser.user?.firstName,
          lastName: updatedUser.user?.lastName,
          avatar: updatedUser.user?.avatar,
          isActive: updatedUser.isActive,
          role: role || undefined,
          role_id: roleId,
          custom_permissions: updatedUser.custom_permissions || [],
          permissions: role?.permissions || [],
          joinedAt: updatedUser.joinedAt,
        };
        
        setTenantUsers(prev => prev.map(user => {
          if (user.id === userId || user.tenant_user_id === userId) {
            return updatedUserWithRole;
          }
          return user;
        }));
        return updatedUser;
      }
      throw new Error(response.message || 'Failed to update user');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to update user');
      throw new Error(errorMessage);
    }
  };

  const removeTenantUser = async (userId: string): Promise<void> => {
    try {
      const response = await apiService.delete(`/rbac/tenant-users/${userId}`);
      if (response.success || response.message) {
        setTenantUsers(prev => prev.filter(user => 
          user.id !== userId && user.tenant_user_id !== userId
        ));
      } else {
        throw new Error(response.message || 'Failed to remove user');
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Failed to remove user');
      throw new Error(errorMessage);
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
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
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
    deleteRole,
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
