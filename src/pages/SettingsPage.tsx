/**
 * Settings: Support link, Vote Us, supporters, CSAE standards, and other app settings.
 */
import { Link } from 'react-router-dom'
import { ChevronRight, ExternalLink, Shield } from 'lucide-react'
import { APP_VERSION } from '../config/appVersion'
import { SUPPORT_DISCORD_URL, VOTE_WITNESS_URL, SUPPORTERS } from '../constants/support'

export function SettingsPage() {
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
        <a
          href={SUPPORT_DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 px-4 py-3 text-[#f0f0f8] transition hover:bg-[#2f353d]"
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
    </div>
  )
}
