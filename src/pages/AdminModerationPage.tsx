/**
 * Admin Moderation page: manage reported users and global abusive blacklist.
 * Only visible to admin/approver users.
 */
import { useEffect, useState } from 'react'
import { ShieldAlert, Loader2, Trash2, Ban, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthData } from '../stores/authStore'
import {
  getAbusiveUsers,
  addAbusiveUser,
  removeAbusiveUser,
  getReportedUsersSummary,
} from '../services/adminService'
import type { AbusiveUser, ReportedUserSummary } from '../services/adminService'

export function AdminModerationPage() {
  const { token, isApprover } = useAuthData()
  const [tab, setTab] = useState<'reported' | 'abusive'>('reported')

  const [reported, setReported] = useState<ReportedUserSummary[]>([])
  const [abusive, setAbusive] = useState<AbusiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [markUsername, setMarkUsername] = useState('')
  const [markReason, setMarkReason] = useState('')
  const [marking, setMarking] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, a] = await Promise.all([
        getReportedUsersSummary(token),
        getAbusiveUsers(),
      ])
      setReported(r)
      setAbusive(a)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  if (!isApprover) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-[#9ca3b0]">
        <ShieldAlert className="mr-2 h-5 w-5" /> Admin access required
      </div>
    )
  }

  const handleMarkAbusive = async (username: string, reason: string) => {
    if (!token) return
    setMarking(true)
    try {
      await addAbusiveUser(token, username, reason)
      toast.success(`@${username} added to blacklist`)
      await load()
      setMarkUsername('')
      setMarkReason('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setMarking(false)
    }
  }

  const handleRemoveAbusive = async (username: string) => {
    if (!token) return
    try {
      await removeAbusiveUser(token, username)
      toast.success(`@${username} removed from blacklist`)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const tabs = [
    { key: 'reported' as const, label: `Reported Users (${reported.length})` },
    { key: 'abusive' as const, label: `Blacklist (${abusive.length})` },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-[#f0f0f8] flex items-center gap-2 mb-6">
        <ShieldAlert className="h-5 w-5 text-[#e31337]" /> Admin Moderation
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-[#e31337] text-white'
                : 'bg-[#262b30] text-[#9ca3b0] border border-[#3a424a] hover:text-[#f0f0f8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#9ca3b0]" />
        </div>
      )}

      {/* Reported Users Tab */}
      {!loading && tab === 'reported' && (
        <div className="space-y-3">
          {reported.length === 0 && (
            <p className="text-center text-[#9ca3b0] py-8">No reported users</p>
          )}
          {reported.map((r) => (
            <div key={r.username} className="rounded-xl border border-[#3a424a] bg-[#262b30]/85">
              <button
                onClick={() => setExpanded(expanded === r.username ? null : r.username)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <img
                  src={`https://images.hive.blog/u/${r.username}/avatar`}
                  alt=""
                  className="h-8 w-8 rounded-full bg-[#2f353d] object-cover"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[#f0f0f8]">@{r.username}</span>
                  <span className="ml-2 text-xs text-[#9ca3b0]">
                    {r.reportCount} report{r.reportCount !== 1 ? 's' : ''}
                  </span>
                  {r.isAbusive && (
                    <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                      BLACKLISTED
                    </span>
                  )}
                </div>
                {expanded === r.username ? (
                  <ChevronUp className="h-4 w-4 text-[#9ca3b0]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#9ca3b0]" />
                )}
              </button>
              {expanded === r.username && (
                <div className="border-t border-[#3a424a] px-4 py-3 space-y-2">
                  {r.reports.map((rp, i) => (
                    <div key={i} className="text-sm text-[#c8cad6]">
                      <span className="text-[#9ca3b0]">By @{rp.reportedBy}:</span> {rp.reason}
                    </div>
                  ))}
                  {!r.isAbusive && (
                    <button
                      onClick={() => handleMarkAbusive(r.username, `Reported ${r.reportCount} time(s) by users`)}
                      disabled={marking}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Ban className="h-3 w-3" /> Add to blacklist
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Abusive Users Tab */}
      {!loading && tab === 'abusive' && (
        <div className="space-y-4">
          {/* Add form */}
          <div className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 p-4">
            <h3 className="text-sm font-medium text-[#f0f0f8] mb-3">Add to blacklist</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={markUsername}
                onChange={(e) => setMarkUsername(e.target.value.toLowerCase().trim())}
                className="flex-1 rounded-lg border border-[#3a424a] bg-[#1a1e22] px-3 py-2 text-sm text-white placeholder-[#6b7280] outline-none focus:border-[#e31337]"
              />
              <input
                type="text"
                placeholder="Reason"
                value={markReason}
                onChange={(e) => setMarkReason(e.target.value)}
                className="flex-[2] rounded-lg border border-[#3a424a] bg-[#1a1e22] px-3 py-2 text-sm text-white placeholder-[#6b7280] outline-none focus:border-[#e31337]"
              />
              <button
                onClick={() => markUsername && markReason && handleMarkAbusive(markUsername, markReason)}
                disabled={!markUsername || !markReason || marking}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>

          {/* List */}
          {abusive.length === 0 && (
            <p className="text-center text-[#9ca3b0] py-8">No blacklisted users</p>
          )}
          {abusive.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-3 rounded-xl border border-[#3a424a] bg-[#262b30]/85 px-4 py-3"
            >
              <img
                src={`https://images.hive.blog/u/${a.name}/avatar`}
                alt=""
                className="h-8 w-8 rounded-full bg-[#2f353d] object-cover"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[#f0f0f8]">@{a.name}</span>
                <p className="text-xs text-[#9ca3b0] truncate">{a.reason}</p>
              </div>
              <button
                onClick={() => handleRemoveAbusive(a.name)}
                className="shrink-0 rounded-lg p-2 text-[#9ca3b0] hover:bg-red-500/20 hover:text-red-400"
                title="Remove from blacklist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
