import { LANDING_PLANS, type Plan } from '../constants/plans'

export type PlanType = Plan['planType']

export const PLAN_TYPES: PlanType[] = ['starter', 'professional', 'enterprise']

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
