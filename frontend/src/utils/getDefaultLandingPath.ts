import { SIDEBAR_PATH_PERMISSIONS } from '@/src/constants/rbacPermissions';

const LANDING_PRIORITY = [
  '/dashboard',
  '/projects',
  '/users',
  '/crm',
  '/tasks',
  '/team',
  '/inventory/products',
  '/sales/invoice-dashboard',
  '/hrm/employees',
  '/reports',
  '/events',
];

export function getDefaultLandingPath(
  permissions: string[],
  isOwner: boolean,
  userRole?: string,
): string {
  if (userRole === 'super_admin') {
    return '/admin/tenants';
  }

  if (isOwner) {
    return '/dashboard';
  }

  for (const path of LANDING_PRIORITY) {
    const required = SIDEBAR_PATH_PERMISSIONS[path];
    if (!required || permissions.includes(required)) {
      return path;
    }
  }

  for (const [path, required] of Object.entries(SIDEBAR_PATH_PERMISSIONS)) {
    if (permissions.includes(required)) {
      return path;
    }
  }

  return '/dashboard';
}
