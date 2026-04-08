export const NATIVE_WORKSPACE_PATHS = [
  '/dashboard',
  '/crm',
  '/crm/customers',
] as const;

export type NativeWorkspacePath = (typeof NATIVE_WORKSPACE_PATHS)[number];

export function isNativeWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (NATIVE_WORKSPACE_PATHS as readonly string[]).includes(n);
}
