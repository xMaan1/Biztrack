export const PLAN_TYPE_AGENCY = 'agency';

export const ALL_PLAN_TYPES = [PLAN_TYPE_AGENCY] as const;

export const RETAIL_PLAN_TYPES = [PLAN_TYPE_AGENCY] as const;

export type RetailPlanType = (typeof RETAIL_PLAN_TYPES)[number];

export function isRetailPlan(planType?: string | null): boolean {
  if (!planType) return false;
  return RETAIL_PLAN_TYPES.includes(planType as RetailPlanType);
}

export function isAgencyPlan(planType?: string | null): boolean {
  return planType === PLAN_TYPE_AGENCY;
}

export function getPlanDisplayLabel(planType?: string | null, planName?: string): string {
  switch (planType) {
    case PLAN_TYPE_AGENCY:
      return 'Agency Pro';
    default:
      return planName || 'Unknown Plan';
  }
}

export function withAgencyPlanTypes(planTypes: string[]): string[] {
  if (planTypes.includes('*')) return planTypes;
  if (planTypes.includes(PLAN_TYPE_AGENCY)) return planTypes;
  return [...planTypes, PLAN_TYPE_AGENCY];
}
