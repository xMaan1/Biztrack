export type { PlanType } from '../landing/utils/plan'

export type { TenantMemberRole } from '../tenants/types'

import type { PlanType } from '../landing/utils/plan'
import type { TenantMemberRole } from '../tenants/types'

export interface MeResponse {
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  needs_tenant_setup: boolean
  tenant_id?: string | null
  tenant_name?: string | null
  plan_type?: PlanType | null
  tenant_role?: TenantMemberRole | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}
