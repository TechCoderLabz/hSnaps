/**
 * Sign Up page: multi-step Hive account creation flow.
 * Step 1 – Pick username (with live availability check)
 * Step 2 – Set master password (auto-generated, user can copy)
 * Step 3 – Confirm keys saved → create account
 * Step 4 – Success: show all keys, prompt to save
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  KeyRound,
  UserPlus,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { checkUsername, createAccount } from '../services/accountService'
import type { CreateAccountResult } from '../services/accountService'

/** Generate a strong random password (P5 + 48 random base58 chars). */
function generatePassword(): string {
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  let pw = 'P5'
  for (const b of bytes) pw += BASE58[b % BASE58.length]
  return pw
}

type Step = 'username' | 'password' | 'confirm' | 'success'

export function SignUpPage() {
  const navigate = useNavigate()

  // --- state ---
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const [password] = useState(() => generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const [keysSavedChecked, setKeysSavedChecked] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [result, setResult] = useState<CreateAccountResult | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // --- username validation ---
  const VALID_USERNAME = /^[a-z][a-z0-9\-\.]{1,14}[a-z0-9]$/

  const handleUsernameChange = useCallback(
    (raw: string) => {
      const val = raw.toLowerCase().replace(/[^a-z0-9\-\.]/g, '')
      setUsername(val)
      setUsernameAvailable(null)
      setUsernameError('')

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (val.length < 3) {
        if (val.length > 0) setUsernameError('Username must be at least 3 characters')
        return
      }
      if (!VALID_USERNAME.test(val)) {
        setUsernameError(
          'Must start with a letter, end with letter/digit, only lowercase letters, digits, hyphens, dots',
        )
        return
      }

      setCheckingUsername(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await checkUsername(val)
          setUsernameAvailable(res.available)
          if (!res.available) setUsernameError('Username is already taken')
        } catch (err: any) {
          setUsernameError(err.message || 'Could not check username')
        } finally {
          setCheckingUsername(false)
        }
      }, 500)
    },
    [],
  )

  // cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const canProceedUsername = username.length >= 3 && usernameAvailable === true && !checkingUsername

  // --- password step ---
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setPasswordCopied(true)
      toast.success('Password copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  // --- create account ---
  const handleCreate = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const res = await createAccount(username, password)
      setResult(res)
      setStep('success')
    } catch (err: any) {
      setCreateError(err.message || 'Account creation failed')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyKey = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} key copied`)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleCopyAllKeys = async () => {
    if (!result) return
    const text = [
      `Username: ${result.username}`,
      `Master Password: ${password}`,
      `Owner Key: ${result.keys.owner}`,
      `Active Key: ${result.keys.active}`,
      `Posting Key: ${result.keys.posting}`,
      `Memo Key: ${result.keys.memo}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('All keys copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  // --- shared UI helpers ---
  const StepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password' },
      { key: 'confirm', label: 'Create' },
    ]
    const currentIdx = steps.findIndex((s) => s.key === step)
    const isSuccess = step === 'success'
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => {
          const done = isSuccess || i < currentIdx
          const active = s.key === step
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-green-600 text-white'
                    : active
                      ? 'bg-[#e31337] text-white'
                      : 'bg-[#2f353d] text-[#9ca3b0]'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden sm:inline text-xs ${
                  active ? 'text-[#f0f0f8] font-medium' : 'text-[#9ca3b0]'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${done ? 'bg-green-600' : 'bg-[#3a424a]'}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212529] text-[#f0f0f8]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/45 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative mx-auto max-w-lg px-4 py-12 sm:py-20">
        {/* Back */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#9ca3b0] hover:text-[#f0f0f8] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e31337]/15">
            <UserPlus className="h-8 w-8 text-[#e31337]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {step === 'success' ? 'Account Created!' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-[#9ca3b0]">
            {step === 'success'
              ? 'Your Hive account is ready'
              : 'Create a free Hive blockchain account'}
          </p>
        </div>

        {step !== 'success' && <StepIndicator />}

        {/* ─── Step 1: Username ─── */}
        {step === 'username' && (
          <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6">
            <label className="block text-sm font-medium text-[#c8cad6] mb-2">
              Choose a username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. john.doe"
                maxLength={16}
                className="w-full rounded-xl border border-[#3a424a] bg-[#2b3138] px-4 py-3 pr-10 text-[#f0f0f8] placeholder-[#6b7280] outline-none focus:border-[#e31337] transition"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && <Loader2 className="h-5 w-5 animate-spin text-[#9ca3b0]" />}
                {!checkingUsername && usernameAvailable === true && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
            {usernameError && (
              <p className="mt-2 text-sm text-red-400">{usernameError}</p>
            )}
            {usernameAvailable === true && (
              <p className="mt-2 text-sm text-green-400">Username is available!</p>
            )}
            <p className="mt-3 text-xs text-[#9ca3b0]">
              3–16 characters. Lowercase letters, digits, hyphens and dots. Must start with a
              letter.
            </p>
            <button
              type="button"
              disabled={!canProceedUsername}
              onClick={() => setStep('password')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e31337] px-6 py-3 font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── Step 2: Password ─── */}
        {step === 'password' && (
          <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6">
            <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold">Save this password securely!</p>
                  <p className="mt-1 text-yellow-300/80">
                    This is your master password. It cannot be recovered if lost. Write it down or
                    store it in a password manager.
                  </p>
                </div>
              </div>
            </div>

            <label className="block text-sm font-medium text-[#c8cad6] mb-2">
              Your master password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                readOnly
                className="w-full rounded-xl border border-[#3a424a] bg-[#2b3138] px-4 py-3 pr-20 font-mono text-sm text-[#f0f0f8] outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-lg p-1.5 text-[#9ca3b0] hover:bg-[#3a424a] hover:text-[#f0f0f8]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="rounded-lg p-1.5 text-[#9ca3b0] hover:bg-[#3a424a] hover:text-[#f0f0f8]"
                  aria-label="Copy password"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#9ca3b0]">
              Your account for <span className="font-semibold text-[#e7e7f1]">{username}</span>.
              This password derives your owner, active, posting, and memo keys.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('username')}
                className="flex items-center gap-2 rounded-xl border border-[#3a424a] px-5 py-3 text-sm font-medium text-[#e7e7f1] transition hover:border-[#505863]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!passwordCopied}
                onClick={() => setStep('confirm')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e31337] px-6 py-3 font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                I've saved my password
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Confirm & Create ─── */}
        {step === 'confirm' && (
          <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6">
            <div className="mb-6 rounded-xl border border-[#3a424a] bg-[#2b3138] p-4">
              <p className="text-sm text-[#c8cad6]">
                <span className="font-medium text-[#f0f0f8]">Username:</span>{' '}
                <span className="font-mono">{username}</span>
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div className="text-sm text-red-200">
                  <p className="font-semibold">Final confirmation</p>
                  <p className="mt-1 text-red-300/80">
                    Make sure you have saved your master password. Without it, you will lose access
                    to your account permanently.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keysSavedChecked}
                onChange={(e) => setKeysSavedChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#3a424a] bg-[#2b3138] text-[#e31337] accent-[#e31337]"
              />
              <span className="text-sm text-[#c8cad6]">
                I confirm that I have securely saved my master password and understand it cannot be
                recovered.
              </span>
            </label>

            {createError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-300">{createError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('password')}
                className="flex items-center gap-2 rounded-xl border border-[#3a424a] px-5 py-3 text-sm font-medium text-[#e7e7f1] transition hover:border-[#505863]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!keysSavedChecked || creating}
                onClick={handleCreate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e31337] px-6 py-3 font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Success ─── */}
        {step === 'success' && result && (
          <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <p className="text-center text-lg font-semibold text-[#f0f0f8]">
              Welcome to Hive, <span className="text-[#e31337]">@{result.username}</span>!
            </p>
            <p className="mt-2 text-center text-sm text-[#9ca3b0]">
              Save your keys below. You'll need them to log in.
            </p>

            <div className="mt-6 space-y-3">
              {(
                [
                  ['Master Password', password],
                  ['Owner', result.keys.owner],
                  ['Active', result.keys.active],
                  ['Posting', result.keys.posting],
                  ['Memo', result.keys.memo],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-[#3a424a] bg-[#2b3138] p-3"
                >
                  <KeyRound className="h-4 w-4 shrink-0 text-[#9ca3b0]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#9ca3b0]">{label}</p>
                    <p className="truncate font-mono text-xs text-[#e7e7f1]">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(label, value)}
                    className="shrink-0 rounded-lg p-1.5 text-[#9ca3b0] hover:bg-[#3a424a] hover:text-[#f0f0f8]"
                    aria-label={`Copy ${label} key`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyAllKeys}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#3a424a] px-5 py-3 text-sm font-medium text-[#e7e7f1] transition hover:border-[#505863] hover:bg-[#2f353d]"
            >
              <Copy className="h-4 w-4" />
              Copy all keys
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e31337] px-6 py-3 font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231]"
            >
              Go to App
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
