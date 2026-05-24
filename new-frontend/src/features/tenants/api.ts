import { API_BASE_URL } from '../../config'
import { parseJsonIfOk } from '../../api-response'
import type { CreateTenantRequest, CreateTenantResponse } from './types'

const credentials: RequestCredentials = 'include'

export async function setupTenantRequest(
  payload: CreateTenantRequest,
): Promise<CreateTenantResponse> {
  const response = await fetch(`${API_BASE_URL}/tenants/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials,
    body: JSON.stringify(payload),
  })
  return parseJsonIfOk<CreateTenantResponse>(response, 'Failed to create workspace')
}
