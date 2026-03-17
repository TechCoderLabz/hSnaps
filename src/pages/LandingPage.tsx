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
  Eye,
  Target,
  Sparkles,
  Code2,
  Rocket,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { isMobilePlatform, isIOS } from '../utils/platform-detection'
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  APP_STORE_LOGO,
  PLAY_STORE_LOGO,
} from '../constants/appStores'
import { FEED_AVATARS } from '../constants/feeds'
import { SUPPORT_DISCORD_URL, VOTE_WITNESS_URL, SUPPORTERS } from '../constants/support'
import type { FeedType } from '../utils/types'
import { HiveToolbar } from 'hive-react-kit'
import { openLink } from '../utils/openLink'

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
  const ios = isIOS()
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
            {ios ? 'Share moments. Connect with others.' : 'Share moments. Earn rewards.'}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#c8cad6]">
            {ios
              ? 'hSnaps brings social to the Hive blockchain. Share your moments and connect with others.'
              : 'hSnaps brings social to the Hive blockchain. Share your moments, connect with others, and earn cryptocurrency rewards for your content.'}
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
            <button
              type="button"
              onClick={() => void openLink('https://ecency.com/signup')}
              className="rounded-xl border border-[#505863] px-6 py-3 text-base font-medium text-[#e7e7f1] transition hover:border-[#e31337] hover:text-white"
            >
              Sign Up
            </button>
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
            {ios
              ? 'Bookmarks, share, upvote, reply, comments, reblog, search users, ignored list, flagging, multi-account, GIF, preview, uploads, 3Speak, swipable images, tags & more.'
              : 'Bookmarks, share, tipping, upvote, reply, comments, reblog, search users, ignored list, flagging, multi-account, GIF, preview, uploads, 3Speak, swipable images, tags & more.'}
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ALL_FEATURES.filter(({ label }) => !ios || label !== 'Tipping').map(({ label, icon: Icon }) => (
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
            {ios
              ? 'Social media on the blockchain. Post and connect—all in one place.'
              : 'Social media on the blockchain. Post, connect, and earn—all in one place.'}
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.filter(({ label }) => !ios || (label !== 'Earn crypto rewards' && label !== 'Markdown, media & tipping')).map(({ label, icon: Icon }) => (
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

        {/* Vision & Mission */}
        <section className="border-t border-[#3a424a] bg-[#262b30]/40 px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Vision */}
              <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Eye className="h-6 w-6 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">Vision</h3>
                <p className="mt-2 text-sm font-medium text-[#e7e7f1]">Make Hive accessible to the world through simple, powerful applications.</p>
                <p className="mt-2 text-sm text-[#9ca3b0]">
                  We aim to bridge the gap between traditional social apps and decentralized technologies by creating familiar, easy-to-use products.
                </p>
              </div>
              {/* Mission */}
              <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Target className="h-6 w-6 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">Mission</h3>
                <p className="mt-2 text-sm font-medium text-[#e7e7f1]">Build open, user-friendly applications that help Hive reach Web2 audiences.</p>
                <p className="mt-2 text-sm text-[#9ca3b0]">
                  Everything we build is open source and community driven.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="border-t border-[#3a424a] bg-[#262b30]/60 px-4 py-16 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            What We Believe
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { label: 'Simplicity Wins', desc: 'Blockchain technology should feel as easy as using any modern mobile app.', icon: Sparkles },
              { label: 'Open Ecosystem', desc: 'All our apps are open source so developers can learn, extend, and build.', icon: Code2 },
              { label: 'Build First, Talk Later', desc: 'We prefer shipping real products and improving with community feedback.', icon: Rocket },
              { label: 'Community Over Ownership', desc: 'These are tools built for the entire Hive ecosystem, not closed platforms.', icon: Users },
            ] as const).map(({ label, desc, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Icon className="h-6 w-6 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{label}</h3>
                <p className="mt-2 text-sm text-[#9ca3b0]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Apps We've Built */}
        <section className="border-t border-[#3a424a] bg-[#262b30]/40 px-4 py-16 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-[#f0f0f8] sm:text-3xl">
            Apps We&apos;ve Built &amp; What&apos;s Coming
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[#9ca3b0]">
            We focus on building multiple specialized apps, each solving a specific problem.
          </p>
          <div className="mx-auto mt-12 max-w-5xl">
            {/* Delivered */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {([
                'Distriator', 'CheckInWithXYZ', 'hReplier', 'hStats', 'hPolls', 'hFestFacts',
              ]).map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-2xl border border-[#3a424a] bg-[#262b30]/85 px-5 py-4 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" aria-hidden />
                  <span className="font-medium text-[#f0f0f8]">{name}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-green-500/30 bg-green-500/20 px-2.5 py-0.5 text-[11px] font-medium text-green-400">
                    Delivered
                  </span>
                </div>
              ))}
            </div>
            {/* In Development */}
            <p className="mt-8 mb-4 text-center text-sm font-medium uppercase tracking-wide text-[#9ca3b0]">In Development</p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
              {([
                { name: 'hApprover', desc: 'Approve Hive transactions from your phone' },
                { name: 'hSnaps', desc: 'Short-form content inspired by Snapie & PeakD Snaps' },
              ]).map((app) => (
                <div
                  key={app.name}
                  className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 px-5 py-4 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#f0f0f8]">{app.name}</span>
                    <span className="shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2.5 py-0.5 text-[11px] font-medium text-yellow-400">
                      In Dev
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#9ca3b0]">{app.desc}</p>
                </div>
              ))}
            </div>
            {/* Planned */}
            <p className="mt-8 mb-4 text-center text-sm font-medium uppercase tracking-wide text-[#9ca3b0]">Planned</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {([
                'hSurvey', 'hChat', 'hShorts', 'hVideos', 'hGovernance', 'hFind', 'hMarketPlace',
              ]).map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-2xl border border-[#3a424a] bg-[#262b30]/85 px-5 py-4 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
                >
                  <span className="font-medium text-[#f0f0f8]">{name}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">
                    Planned
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Why We Build + Learn More */}
          <div className="mx-auto mt-12 max-w-2xl text-center">
            <p className="text-lg font-medium text-[#e7e7f1]">
              Built without external funding, with passion for Hive, for the entire community, and completely open source.
            </p>
            <p className="mt-4 text-[#c8cad6]">
              Our goal is simple: Help Hive grow by making it easier for Web2 users to discover and use.
            </p>
            <Link
              to="/about-us"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e31337] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231]"
            >
              Learn more about us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* About Us: Vote Us, supporters, Contact Support */}
        <section id="about-us" className="border-t border-[#3a424a] bg-[#262b30]/60 px-4 py-16 sm:px-8">
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
      <HiveToolbar isHsnaps={false} backgroundColor='#212529' borderTopColor='#3a424a' textColor='#f0f0f8'/>
    </div>
  )
}
