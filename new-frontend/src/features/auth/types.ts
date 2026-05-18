export type PlanType = 'starter' | 'professional' | 'enterprise'

export interface MeResponse {
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  needs_tenant_setup: boolean
  tenant_id?: string | null
  tenant_name?: string | null
  plan_type?: PlanType | null
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

export interface CreateTenantRequest {
  name: string
  plan_type: PlanType
}
