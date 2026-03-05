/**
 * Landing page: logo, See All Snaps (read-only), Hive auth login.
 */
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'

const FEATURES = [
  {
    title: 'Snaps',
    desc: 'Short, punchy posts. PeakD-style snaps on Hive.',
    icon: '📸',
  },
  {
    title: 'Threads',
    desc: 'Conversation threads. LeoFinance-style discussions.',
    icon: '🧵',
  },
  {
    title: 'Waves',
    desc: 'Wave-style updates. Ecency waves on chain.',
    icon: '🌊',
  },
  {
    title: 'DBuzz',
    desc: 'Buzz-style micro content. Quick takes and vibes.',
    icon: '🐝',
  },
  {
    title: 'Moments',
    desc: 'Moments. Liketu-style captures in time.',
    icon: '⏱️',
  },
]

const HIGHLIGHTS = [
  'Real on-chain Hive data',
  'Pure Hive Markdown rendering',
  'Polls & media upload preview',
  'Rewards & tipping',
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#212529] text-[#f0f0f8]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/45 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative">
        <AppHeader />

        {/* Hero: logo + See All Snaps at center */}
        <section className="px-4 pt-12 pb-20 text-center sm:px-8 sm:pt-24">
          <img
            src="/logo.png"
            alt="hSnaps"
            className="mx-auto h-24 w-24 object-contain sm:h-32 sm:w-32"
          />
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent">
              One app.
            </span>
            <br />
            <span className="text-[#e7e7f1]">Snaps, Threads, Waves & more.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#c8cad6]">
            hSnaps brings Snaps, Threads, Waves, DBuzz, and Moments into one
            place—real Hive data, pure Markdown, and a single feed.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard/snaps"
              className="rounded-xl bg-[#e31337] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231]"
            >
              See All Snaps
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-[#505863] px-6 py-3 text-base font-medium text-[#e7e7f1] transition hover:border-[#e31337] hover:text-white"
            >
              See features
            </a>
          </div>
        </section>

        {/* Feature cards — 5 feeds */}
        <section id="features" className="px-4 pb-20 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            One feed. Five vibes.
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[#c8cad6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="border-t border-[#3a424a] bg-[#262b30]/60 px-4 py-16 sm:px-8">
          <h2 className="text-center text-xl font-bold text-[#f0f0f8]">
            Why hSnaps
          </h2>
          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-4">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="rounded-xl bg-[#2f353d] px-4 py-2 text-sm text-[#e7e7f1]"
              >
                {h}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-[#9ca3b0]">
            Markdown support, poll system, media upload preview, rewards and
            tipping—all in a clean, responsive UI.
          </p>
        </section>

        <footer className="border-t border-[#3a424a] px-4 py-8 text-center text-sm text-[#9ca3b0] sm:px-8">
         <Link to="/dashboard/snaps" className="text-[#9ca3b0] hover:text-[#e7e7f1]"> Snaps </Link> · <Link to="/dashboard/threads" className="text-[#9ca3b0] hover:text-[#e7e7f1]"> Threads </Link> · <Link to="/dashboard/waves" className="text-[#9ca3b0] hover:text-[#e7e7f1]"> Waves </Link> · <Link to="/dashboard/dbuzz" className="text-[#9ca3b0] hover:text-[#e7e7f1]"> DBuzz </Link> · <Link to="/dashboard/moments" className="text-[#9ca3b0] hover:text-[#e7e7f1]"> Moments </Link>
          All Rights Reserved © 2026 hSnaps
       </footer>
      </div>
    </div>
  )
}
