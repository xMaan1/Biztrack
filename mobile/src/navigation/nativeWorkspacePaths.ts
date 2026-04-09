import { INVENTORY_NATIVE_PATHS } from '../features/inventory/inventoryPaths';
import { POS_NATIVE_PATHS } from '../features/pos/posPaths';
import { HRM_NATIVE_PATHS } from '../features/hrm/hrmPaths';
import { PROJECT_NATIVE_PATHS } from '../features/projects/projectPaths';
import { WORKSPACE_HUB_PATHS } from '../features/workspace/workspacePaths';

export const NATIVE_WORKSPACE_PATHS = [
  '/dashboard',
  '/crm',
  '/crm/customers',
  '/crm/contacts',
  '/crm/companies',
  '/crm/leads',
  '/crm/opportunities',
  '/sales/quotes',
  '/sales/contracts',
  '/sales/analytics',
  '/sales/invoices',
  '/sales/installments',
  '/sales/delivery-notes',
  ...INVENTORY_NATIVE_PATHS,
  ...POS_NATIVE_PATHS,
  ...HRM_NATIVE_PATHS,
  ...PROJECT_NATIVE_PATHS,
  ...WORKSPACE_HUB_PATHS,
] as const;

export type NativeWorkspacePath = (typeof NATIVE_WORKSPACE_PATHS)[number];

export function isNativeWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (NATIVE_WORKSPACE_PATHS as readonly string[]).includes(n);
}
