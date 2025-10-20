'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useAuth } from '@/src/contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  module?: string;
  requireOwner?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PermissionGuard({
  children,
  permission,
  module,
  requireOwner = false,
  fallback = <div>Access Denied</div>,
  redirectTo = '/dashboard'
}: PermissionGuardProps) {
  const { hasPermission, hasModuleAccess, isOwner, userPermissions, loading } = usePermissions();
  const router = useRouter();

  // Check if user has required access
  const hasAccess = (() => {
    if (requireOwner && !isOwner()) return false;
    if (permission && !hasPermission(permission)) return false;
    if (module && !hasModuleAccess(module)) return false;
    return true;
  })();

  // Redirect if no access and redirectTo is specified
  React.useEffect(() => {
    if (!loading && userPermissions && !hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasAccess, redirectTo, router, loading, userPermissions]);

  // Show loading state while permissions are being fetched
  if (loading || !userPermissions) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ModuleGuardProps {
  children: React.ReactNode;
  module: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ModuleGuard({ children, module, fallback, redirectTo }: ModuleGuardProps) {
  return (
    <PermissionGuard module={module} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </PermissionGuard>
  );
}

interface OwnerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function OwnerGuard({ children, fallback, redirectTo }: OwnerGuardProps) {
  return (
    <PermissionGuard requireOwner={true} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </PermissionGuard>
  );
}

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function SuperAdminGuard({ children, fallback, redirectTo }: SuperAdminGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is super admin
  const isSuperAdmin = user?.userRole === 'super_admin';

  // Redirect if no access and redirectTo is specified
  React.useEffect(() => {
    if (!isSuperAdmin && redirectTo) {
      router.push(redirectTo);
    }
  }, [isSuperAdmin, redirectTo, router]);

  if (!isSuperAdmin) {
    return <>{fallback || <div>You need super admin privileges to access this page.</div>}</>;
  }

  return <>{children}</>;
}

