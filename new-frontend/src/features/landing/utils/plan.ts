import { LANDING_PLANS, type Plan, type PlanType } from '../constants/plans'

export type { PlanType }

export const PLAN_TYPES: PlanType[] = ['healthcare', 'commerce', 'workshop']

export function isPlanType(value: string | null | undefined): value is PlanType {
  return Boolean(value && PLAN_TYPES.includes(value as PlanType))
}

export function getPlanByType(planType: string | null | undefined): Plan | undefined {
  if (!isPlanType(planType)) {
    return undefined
  }
  return LANDING_PLANS.find((plan) => plan.planType === planType)
}

export function trialRegisterPath(planType: PlanType) {
  return `/register?plan=${planType}`
}
