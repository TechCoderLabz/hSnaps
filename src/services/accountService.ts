import { isIOS } from '../utils/platform-detection'

const API_SERVER =
  import.meta.env.VITE_HIVE_API_SERVER || 'https://hreplier-api.sagarkothari88.one'

function platformHeaders(): Record<string, string> {
  return isIOS() ? { 'X-Client-Platform': 'capacitor-ios' } : {}
}

export interface CheckUsernameResult {
  username: string
  available: boolean
}

export interface CreateAccountResult {
  success: boolean
  username: string
  keys: {
    owner: string
    active: string
    posting: string
    memo: string
  }
  message: string
}

export async function checkUsername(username: string): Promise<CheckUsernameResult> {
  const res = await fetch(`${API_SERVER}/account/check-username/${encodeURIComponent(username)}`, {
    headers: platformHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function createAccount(
  username: string,
  password: string,
): Promise<CreateAccountResult> {
  const res = await fetch(`${API_SERVER}/account/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...platformHeaders() },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
