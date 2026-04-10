export const WORKSHOP_NATIVE_PATHS = [
  '/workshop-management/work-orders',
  '/workshop-management/job-cards',
  '/workshop-management/vehicles',
  '/workshop-management/production',
  '/workshop-management/quality-control',
  '/workshop-management/maintenance',
] as const;

export function isWorkshopNativePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (WORKSHOP_NATIVE_PATHS as readonly string[]).includes(n);
}
