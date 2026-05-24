import { API_BASE_URL } from '../../config'
import { parseJsonIfOk } from '../../api-response'
import type { CreateTenantRequest } from '../auth/types'

const credentials: RequestCredentials = 'include'

export async function setupTenantRequest(
  payload: CreateTenantRequest,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tenants/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials,
    body: JSON.stringify(payload),
  })
  await parseJsonIfOk(response, 'Failed to create workspace')
}
