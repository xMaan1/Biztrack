import { API_BASE_URL } from '../../config'
import { parseJsonIfOk, voidIfOk } from '../../api-response'
import type { LoginRequest, MeResponse, RegisterRequest } from './types'

const credentials: RequestCredentials = 'include'

async function postJson(path: string, body: unknown): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials,
    body: JSON.stringify(body),
  })
  return voidIfOk(response, 'Request failed')
}

export async function loginRequest(payload: LoginRequest): Promise<void> {
  return postJson('/auth/login', payload)
}

export async function registerRequest(payload: RegisterRequest): Promise<void> {
  return postJson('/auth/register', payload)
}

export async function fetchMe(): Promise<MeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials })
  return parseJsonIfOk<MeResponse>(response, 'Failed to load user')
}

export async function logoutRequest(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials,
  })
  return voidIfOk(response, 'Logout failed')
}
