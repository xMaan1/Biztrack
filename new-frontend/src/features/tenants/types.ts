import type { PlanType } from '../auth/types'

export type TenantMemberRole = 'owner' | 'member'

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: TenantMemberRole
}

export interface CreateTenantRequest {
  name: string
  plan_type: PlanType
}

export interface TenantSummary {
  id: string
  name: string
  plan_type: PlanType
  role: TenantMemberRole
}

export interface CreateTenantResponse {
  ok: boolean
  tenant: TenantSummary
}
