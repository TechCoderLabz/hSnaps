/**
 * Settings: Support link, Vote Us, supporters, CSAE standards, and other app settings.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ExternalLink, FileText, Server, Shield, Trash2 } from 'lucide-react'
import { useAuthStore } from 'hive-authentication'
import { toast } from 'sonner'
import { APP_VERSION } from '../config/appVersion'
import { SUPPORT_DISCORD_URL, VOTE_WITNESS_URL, SUPPORTERS } from '../constants/support'
import { useAuthData, useAppAuthStore } from '../stores/authStore'
import { useHiveNodeStore, HIVE_API_NODE_OPTIONS } from '../stores/hiveNodeStore'
import type { HiveApiNode } from '../stores/hiveNodeStore'
import { isIOS } from '../utils/platform-detection'

const HD_API_SERVER =
  import.meta.env.VITE_HIVE_API_SERVER || 'https://hreplier-api.sagarkothari88.one'

export function SettingsPage() {
  const { isAuthenticated, token } = useAuthData()
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser)
  const clearAuth = useAppAuthStore((s) => s.clearAuth)
  const hiveApiNode = useHiveNodeStore((s) => s.hiveApiNode)
  const setHiveApiNode = useHiveNodeStore((s) => s.setHiveApiNode)
  const navigate = useNavigate()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReady, setDeleteReady] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (showDeleteConfirm) {
      setDeleteReady(false)
      timerRef.current = setTimeout(() => setDeleteReady(true), 5000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [showDeleteConfirm])

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`${HD_API_SERVER}/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Delete failed')
      }
      setCurrentUser(null)
      clearAuth()
      toast.success('Account deleted successfully')
      navigate('/')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleVoteUs = () => {
    window.open(VOTE_WITNESS_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-xl font-bold text-[#f0f0f8]">Settings</h1>

      <section className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#f0f0f8]">App version</span>
          <span className="text-[#9ca3b0] tabular-nums">v{APP_VERSION}</span>
        </div>
      </section>

      {/* Hive API Node */}
      <section className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 shrink-0 text-[#e31337]" />
            <div>
              <h3 className="font-medium text-[#f0f0f8]">Hive API Node</h3>
              <p className="text-xs text-[#9ca3b0]">Choose your preferred Hive API node for data fetching</p>
            </div>
          </div>
          <select
            value={hiveApiNode}
            onChange={(e) => setHiveApiNode(e.target.value as HiveApiNode)}
            className="w-full rounded-lg border border-[#3a424a] bg-[#1a1e22] px-3 py-2 text-sm text-white focus:border-transparent focus:ring-2 focus:ring-[#e31337] outline-none"
          >
            {HIVE_API_NODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-[#3a424a] bg-[#262b30]/85">
        <Link
          to="/csae-standards"
          className="flex items-center justify-between gap-3 px-4 py-3 text-[#f0f0f8] transition hover:bg-[#2f353d] first:rounded-t-xl rounded-t-xl"
        >
          <span className="flex items-center gap-3 font-medium">
            <Shield className="h-5 w-5 shrink-0 text-[#e31337]" />
            Child safety (CSAE) standards
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#9ca3b0]" />
        </Link>
        <Link
          to="/eula"
          className="flex items-center justify-between gap-3 px-4 py-3 text-[#f0f0f8] transition hover:bg-[#2f353d]"
        >
          <span className="flex items-center gap-3 font-medium">
            <FileText className="h-5 w-5 shrink-0 text-[#e31337]" />
            End-User License Agreement
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#9ca3b0]" />
        </Link>
        <a
          href={SUPPORT_DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 px-4 py-3 text-[#f0f0f8] transition hover:bg-[#2f353d] rounded-b-xl"
        >
          <span className="flex items-center gap-3 font-medium">
            <img
              src="https://cdn.simpleicons.org/discord/5865F2"
              alt=""
              className="h-5 w-5 shrink-0"
              width={20}
              height={20}
            />
            Contact Support
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-[#9ca3b0]" />
        </a>
      </section>

      {/* Vote Us */}
      <section className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 p-6">
        <div className="flex items-center gap-3">
          <img
            src="https://images.hive.blog/u/sagarkothari88/avatar"
            alt="Vote Us"
            className="h-14 w-14 shrink-0 rounded-full object-cover border border-[#505863]"
          />
          <div className="min-w-0">
            <h3 className="text-lg font-medium text-[#f0f0f8]">Vote Us</h3>
            <p className="text-sm text-[#9ca3b0]">Support @sagarkothari88 on Hive</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleVoteUs}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-white transition-colors hover:bg-[#c51231] sm:w-auto"
          >
            <span>Vote</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Supporters */}
      {SUPPORTERS.map((s, idx) => (
        <section
          key={idx}
          className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 p-6"
        >
          <div className="flex items-center gap-3">
            <img
              src={s.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover bg-[#2f353d]"
            />
            <div className="min-w-0">
              <h3 className="break-words text-lg font-medium text-[#f0f0f8]">{s.title}</h3>
              <p className="break-words text-sm text-[#9ca3b0]">{s.description}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => window.open(s.link, '_blank', 'noopener,noreferrer')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-white transition-colors hover:bg-[#c51231] sm:w-auto"
            >
              <span>{s.buttonText}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </section>
      ))}

      {/* Delete Account */}
      {isAuthenticated && isIOS() && (
        <section className="rounded-xl border border-[#3a424a] bg-[#262b30]/85 p-6">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          ) : (
            <div>
              <p className="text-center text-sm font-semibold text-red-400 animate-pulse">
                Are you sure you want to delete your account?
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-lg border border-[#3a424a] bg-[#262b30] px-4 py-2 text-sm font-medium text-[#f0f0f8] transition-colors hover:bg-[#2f353d] disabled:opacity-50"
                >
                  Oops! No.
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={!deleteReady || deleting}
                  className="rounded-lg border border-red-500/60 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : !deleteReady ? 'Wait...' : 'Yes! Delete It!'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
