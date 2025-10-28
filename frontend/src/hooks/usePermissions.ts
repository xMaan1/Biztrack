'use client';

import { useRBAC } from '@/src/contexts/RBACContext';

export function usePermissions() {
  const { userPermissions, hasPermission, hasModuleAccess, isOwner, loading, initializing } = useRBAC();

  return {
    permissions: userPermissions?.permissions || [],
    accessibleModules: userPermissions?.accessible_modules || [],
    isOwner: isOwner,
    hasPermission,
    hasModuleAccess,
    userPermissions,
    loading,
    initializing,
    
    // Convenience methods for common permissions
    canManageUsers: () => hasPermission('users:create') || isOwner(),
    canViewCRM: () => hasModuleAccess('crm'),
    canManageCRM: () => hasPermission('crm:create') || isOwner(),
    canViewHRM: () => hasModuleAccess('hrm'),
    canManageHRM: () => hasPermission('hrm:create') || isOwner(),
    canViewInventory: () => hasModuleAccess('inventory'),
    canManageInventory: () => hasPermission('inventory:create') || isOwner(),
    canViewFinance: () => hasModuleAccess('finance'),
    canManageFinance: () => hasPermission('finance:create') || isOwner(),
    canViewProjects: () => hasModuleAccess('projects'),
    canManageProjects: () => hasPermission('projects:create') || isOwner(),
    canViewProduction: () => hasModuleAccess('production'),
    canManageProduction: () => hasPermission('production:create') || isOwner(),
    canViewQuality: () => hasModuleAccess('quality'),
    canManageQuality: () => hasPermission('quality:create') || isOwner(),
    canViewMaintenance: () => hasModuleAccess('maintenance'),
    canManageMaintenance: () => hasPermission('maintenance:create') || isOwner(),
    canViewBanking: () => hasModuleAccess('banking'),
    canManageBanking: () => hasPermission('banking:create') || isOwner(),
    canViewEvents: () => hasModuleAccess('events'),
    canManageEvents: () => hasPermission('events:create') || isOwner(),
    canViewReports: () => hasPermission('reports:view') || isOwner(),
    canExportReports: () => hasPermission('reports:export') || isOwner(),
  };
}

export function useModuleAccess(module: string) {
  const { hasModuleAccess } = useRBAC();
  return hasModuleAccess(module);
}

export function usePermission(permission: string) {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}
