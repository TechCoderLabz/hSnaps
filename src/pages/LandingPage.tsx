/**
 * Landing page: logo, features, Why hSnaps, Vote Us, supporters, Contact Support, Privacy.
 */
import { Link } from 'react-router-dom'
import {
  Bookmark,
  Share2,
  Gift,
  Heart,
  MessageCircle,
  Repeat2,
  Search,
  EyeOff,
  Flag,
  Users,
  RefreshCw,
  Image,
  ImagePlus,
  Film,
  LayoutGrid,
  Tag,
  ExternalLink,
  Compass,
  Layers,
  Lightbulb,
  Info,
  Video,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { isMobilePlatform } from '../utils/platform-detection'
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  APP_STORE_LOGO,
  PLAY_STORE_LOGO,
} from '../constants/appStores'
import { FEED_AVATARS } from '../constants/feeds'
import { SUPPORT_DISCORD_URL, VOTE_WITNESS_URL, SUPPORTERS } from '../constants/support'
import type { FeedType } from '../utils/types'

const FEED_FEATURES: { title: string; desc: string; feedId: FeedType }[] = [
  { title: 'Snaps', desc: 'Short, punchy posts. PeakD-style snaps on Hive.', feedId: 'snaps' },
  { title: 'Threads', desc: 'Conversation threads. LeoFinance-style discussions.', feedId: 'threads' },
  { title: 'Waves', desc: 'Wave-style updates. Ecency waves on chain.', feedId: 'waves' },
  { title: 'Moments', desc: 'Moments. Liketu-style captures in time.', feedId: 'moments' },
]

const ALL_FEATURES: { label: string; icon: LucideIcon }[] = [
  { label: 'Bookmarks', icon: Bookmark },
  { label: 'Share', icon: Share2 },
  { label: 'Tipping', icon: Gift },
  { label: 'Upvote', icon: Heart },
  { label: 'Reply & comments', icon: MessageCircle },
  { label: 'Reblog', icon: Repeat2 },
  { label: 'Search Hive user', icon: Search },
  { label: 'Manage ignored authors', icon: EyeOff },
  { label: 'Content & user flagging', icon: Flag },
  { label: 'Multi-user login & account switching', icon: Users },
  { label: 'Add GIFs in snaps', icon: Image },
  { label: 'Instant preview for snaps', icon: LayoutGrid },
  { label: 'Image upload', icon: ImagePlus },
  { label: '3Speak video in feed', icon: Film },
  { label: 'Swipable images in feed', icon: LayoutGrid },
  { label: 'Tags & explore by tag', icon: Tag },
  { label: 'Twitter/X tweet embed', icon: MessageSquare },
  { label: 'YouTube video embed', icon: Video },
]

const HIGHLIGHTS: { label: string; icon: LucideIcon }[] = [
  { label: 'Share moments on the blockchain', icon: Share2 },
  { label: 'Connect with others', icon: Users },
  { label: 'Earn crypto rewards', icon: Gift },
  { label: 'Real on-chain Hive data', icon: Heart },
  { label: 'Markdown, media & tipping', icon: MessageCircle },
  { label: 'Bookmarks & ignored list', icon: Bookmark },
  { label: 'Multi-account support', icon: RefreshCw },
]

const LANDING_NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'features', label: 'Features', icon: Layers },
  { id: 'why-hsnaps', label: 'Why hSnaps', icon: Lightbulb },
  { id: 'about-us', label: 'About Us', icon: Info },
]

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function LandingPage() {
  const isWeb = !isMobilePlatform()
  return (
    <div className="min-h-screen bg-[#212529] text-[#f0f0f8]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/45 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative">
        <AppHeader
          className="sticky top-0 z-30 border-b border-[#3a424a] bg-[#212529]"
          hideBrandOnMobile
          center={
            <>
              {LANDING_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#c8cad6] transition hover:text-[#f0f0f8] focus:outline-none focus:ring-2 focus:ring-[#e31337]/50 rounded px-1"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </button>
              ))}
            </>
          }
          right={null}
        />

        {/* Hero */}
        <section className="px-4 pt-12 pb-20 text-center sm:px-8 sm:pt-24">
          <img
            src="/logo.png"
            alt="hSnaps"
            className="mx-auto h-24 w-24 object-contain rounded-[5px] sm:h-32 sm:w-32"
          />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent">
              hSnaps
            </span>
          </h1>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-[#e7e7f1] sm:text-3xl">
            Share moments. Earn rewards.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#c8cad6]">
            hSnaps brings social to the Hive blockchain. Share your moments, connect with others, and earn cryptocurrency rewards for your content.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-xl bg-[#e31337] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231]"
            >
              Open App
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-[#505863] px-6 py-3 text-base font-medium text-[#e7e7f1] transition hover:border-[#e31337] hover:text-white"
            >
              See features
            </a>
          </div>
          {isWeb && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#3a424a] bg-[#262b30] px-4 py-3 transition hover:border-[#505863] hover:bg-[#2f353d]"
                aria-label="Download on the App Store"
              >
                <img
                  src={APP_STORE_LOGO}
                  alt=""
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <span className="font-medium text-[#e7e7f1]">App Store</span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#3a424a] bg-[#262b30] px-4 py-3 transition hover:border-[#505863] hover:bg-[#2f353d]"
                aria-label="Get it on Google Play"
              >
                <img
                  src={PLAY_STORE_LOGO}
                  alt=""
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <span className="font-medium text-[#e7e7f1]">Play Store</span>
              </a>
            </div>
          )}
        </section>

        {/* Feed cards: Snaps, Threads, Waves, Moments */}
        <section id="discover" className="px-4 pb-12 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            Discover what&apos;s happening right now
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[#9ca3b0]">
            One feed. Snaps, Threads, Waves &amp; Moments from the Hive blockchain.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEED_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <img src={FEED_AVATARS[f.feedId]} alt="" className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#c8cad6]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All features we offer - same card style as Snaps/Threads */}
        <section id="features" className="border-t border-[#3a424a] bg-[#262b30]/40 px-4 py-16 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            All the features we offer
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[#9ca3b0]">
            Bookmarks, share, tipping, upvote, reply, comments, reblog, search users, ignored list, flagging, multi-account, GIF, preview, uploads, 3Speak, swipable images, tags &amp; more.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ALL_FEATURES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Icon className="h-6 w-6 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{label}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Why hSnaps */}
        <section id="why-hsnaps" className="border-t border-[#3a424a] bg-[#262b30]/60 px-4 py-16 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            Why hSnaps
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[#9ca3b0]">
            Social media on the blockchain. Post, connect, and earn—all in one place.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Icon className="h-6 w-6 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{label}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* About Us: Vote Us, supporters, Contact Support */}
        <section id="about-us" className="border-t border-[#3a424a] bg-[#262b30]/40 px-4 py-16 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            About Us
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[#9ca3b0]">
            Vote for our witness, meet our supporters, and get in touch.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Vote Us */}
            <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                <img
                  src="https://images.hive.blog/u/sagarkothari88/avatar"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">Vote Us</h3>
              <p className="mt-2 text-sm text-[#9ca3b0]">Support @sagarkothari88 on Hive</p>
              <div className="mt-4">
                <a
                  href={VOTE_WITNESS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c51231]"
                >
                  Vote
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Supporters */}
            {SUPPORTERS.map((s, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{s.title}</h3>
                <p className="mt-2 text-sm text-[#9ca3b0]">{s.description}</p>
                <div className="mt-4">
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c51231]"
                  >
                    {s.buttonText}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}

            {/* Contact Support */}
            <a
              href={SUPPORT_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                <img
                  src="https://cdn.simpleicons.org/discord/5865F2"
                  alt=""
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">Contact Support</h3>
              <p className="mt-2 text-sm text-[#9ca3b0]">Get help on Discord</p>
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-lg bg-[#e31337] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c51231]">
                  Join
                  <ExternalLink className="h-4 w-4" />
                </span>
              </div>
            </a>
          </div>
        </section>

        <footer className="border-t border-[#3a424a] px-4 py-8 text-center text-sm text-[#9ca3b0] sm:px-8">
          <p>All Rights Reserved © 2026 hSnaps</p>
        </footer>
      </div>
    </div>
  )
}
