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
] as const;

export type NativeWorkspacePath = (typeof NATIVE_WORKSPACE_PATHS)[number];

export function isNativeWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (NATIVE_WORKSPACE_PATHS as readonly string[]).includes(n);
}
