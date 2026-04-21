const API_SERVER =
  import.meta.env.VITE_HIVE_API_SERVER || 'https://hreplier-api.sagarkothari88.one'

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export interface AbusiveUser {
  name: string
  reason: string
  addedBy: string
  createdAt: string
}

export interface ReportedUserSummary {
  username: string
  reportCount: number
  isAbusive: boolean
  reports: { reportedBy: string; reason: string; createdAt: string }[]
}

export async function getAbusiveUsers(): Promise<AbusiveUser[]> {
  const res = await fetch(`${API_SERVER}/admin/abusive-users`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
  return res.json()
}

export async function addAbusiveUser(token: string, username: string, reason: string) {
  const res = await fetch(`${API_SERVER}/admin/abusive-users`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ username, reason }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
  return res.json()
}

export async function removeAbusiveUser(token: string, username: string) {
  const res = await fetch(`${API_SERVER}/admin/abusive-users`, {
    method: 'DELETE', headers: authHeaders(token), body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
  return res.json()
}

export async function getReportedUsersSummary(token: string): Promise<ReportedUserSummary[]> {
  const res = await fetch(`${API_SERVER}/admin/reported-users-summary`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
  return res.json()
}
