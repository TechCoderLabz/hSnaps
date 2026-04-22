/**
 * About Us page: Vision, Mission, What We Believe, Our Approach, Apps, Why We Build, Open Source, Long Term Goal.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  Target,
  Sparkles,
  Code2,
  Rocket,
  Users,
  Heart,
  Globe,
  CheckCircle2,
  Wrench,
  Clock,
  Map,
  GitBranch,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SectionProps {
  id?: string
  title: string
  subtitle?: string
  icon: LucideIcon
  children: React.ReactNode
  alt?: boolean
}

function Section({ id, title, subtitle, icon: Icon, children, alt }: SectionProps) {
  return (
    <section
      id={id}
      className={`border-t border-[#3a424a] px-4 py-16 sm:px-8 ${alt ? 'bg-[#262b30]/40' : 'bg-[#262b30]/60'}`}
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
            <Icon className="h-5 w-5 text-[#e31337]" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold text-[#f0f0f8] sm:text-3xl">{title}</h2>
        </div>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-medium text-[#e7e7f1]">
            {subtitle}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c8cad6] leading-relaxed text-center">{children}</p>
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 max-w-xl mx-auto">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[#c8cad6]">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#e31337] mt-0.5" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

interface AppCardProps {
  name: string
  desc: string
  status: 'delivered' | 'in-dev' | 'planned'
}

const STATUS_COLORS = {
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  'in-dev': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  planned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const STATUS_LABELS = {
  delivered: 'Delivered',
  'in-dev': 'In Development',
  planned: 'Planned',
}

function AppCard({ name, desc, status }: AppCardProps) {
  return (
    <div className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-5 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-[#f0f0f8]">{name}</h4>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-[#9ca3b0]">{desc}</p>
    </div>
  )
}

const DELIVERED_APPS: AppCardProps[] = [
  { name: 'Distriator', desc: 'Rewards distribution tool for Hive', status: 'delivered' },
  { name: 'CheckInWithXYZ', desc: 'Location-based check-in app', status: 'delivered' },
  { name: 'hReplier', desc: 'Smart reply tool for Hive posts', status: 'delivered' },
  { name: 'hStats', desc: 'Statistics & analytics for Hive', status: 'delivered' },
  { name: 'hPolls', desc: 'Polling system for Hive community', status: 'delivered' },
  { name: 'hFestFacts (HiveFest Facts)', desc: 'Fun facts and trivia from HiveFest events', status: 'delivered' },
]

const IN_DEV_APPS: AppCardProps[] = [
  { name: 'hApprover', desc: 'Approve Hive transactions from your phone', status: 'in-dev' },
  { name: 'hSnaps', desc: 'Short-form content inspired by Snapie & PeakD Snaps', status: 'in-dev' },
]

const PLANNED_APPS: AppCardProps[] = [
  { name: 'hSurvey', desc: 'Surveys & research tools', status: 'planned' },
  { name: 'hChat', desc: 'Communication platform', status: 'planned' },
  { name: 'hShorts', desc: 'Short video platform (3Speak powered)', status: 'planned' },
  { name: 'hVideos', desc: 'Video discovery app for Hive', status: 'planned' },
  { name: 'hGovernance', desc: 'Governance tracking & participation', status: 'planned' },
  { name: 'hFind', desc: 'Powerful search across Hive content', status: 'planned' },
  { name: 'hMarketPlace', desc: 'Decentralized marketplace', status: 'planned' },
]

interface BeliefCardProps {
  title: string
  desc: string
  icon: LucideIcon
}

const BELIEFS: BeliefCardProps[] = [
  {
    title: 'Simplicity Wins',
    desc: 'Blockchain technology should feel as easy as using any modern mobile app.',
    icon: Sparkles,
  },
  {
    title: 'Open Ecosystem',
    desc: 'All our apps are open source so developers can learn from them, extend them, and build new things for Hive.',
    icon: Code2,
  },
  {
    title: 'Build First, Talk Later',
    desc: 'Instead of long proposals and discussions, we prefer shipping real products and improving them with community feedback.',
    icon: Rocket,
  },
  {
    title: 'Community Over Ownership',
    desc: 'These apps are not meant to be closed platforms — they are tools built for the entire Hive ecosystem.',
    icon: Users,
  },
]

export function AboutUsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Go back to the route that brought us here; if the page was opened directly
  // (no prior in-app history), fall back to the landing page.
  const handleBack = () => {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }
  return (
    <div className="min-h-screen bg-[#212529] text-[#f0f0f8]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/45 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative">
        {/* Header */}
        <header className="app-header-safe-area sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#3a424a] bg-[#212529] px-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg p-2 text-[#9ca3b0] transition hover:bg-[#2f353d] hover:text-[#f0f0f8]"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-[#f0f0f8] via-[#e7e7f1] to-[#ff7a92] bg-clip-text text-transparent">
            About Us
          </h1>
        </header>

        {/* Hero */}
        <section className="px-4 pt-12 pb-8 text-center sm:px-8 sm:pt-16">
          <img
            src="/logo.png"
            alt="hSnaps"
            className="mx-auto h-20 w-20 object-contain rounded-[5px] sm:h-24 sm:w-24"
          />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#c8cad6]">
            We are a team of builders passionate about making Hive accessible to the world through simple, powerful applications.
          </p>
        </section>

        {/* Vision */}
        <Section title="Vision" icon={Eye} subtitle="Make Hive accessible to the world through simple, powerful applications.">
          <Prose>
            Our vision is to build a complete suite of modern apps that bring the Hive blockchain closer to everyday internet users. By creating familiar, easy-to-use products inspired by successful Web2 platforms, we aim to bridge the gap between traditional social apps and decentralized technologies.
          </Prose>
          <Prose>
            We believe the future of Hive depends not only on technology, but on great user experiences that anyone can understand and enjoy.
          </Prose>
        </Section>

        {/* Mission */}
        <Section title="Mission" icon={Target} subtitle="Build open, user-friendly applications that help Hive reach Web2 audiences." alt>
          <Prose>Our mission is to design and deliver high-quality apps that:</Prose>
          <BulletList
            items={[
              'Simplify Hive for new users',
              'Improve the experience for existing users',
              'Increase visibility of Hive in the wider internet ecosystem',
              'Experiment with new product ideas for decentralized communities',
            ]}
          />
          <p className="mt-6 text-center text-[#e7e7f1] font-medium">
            Everything we build is open source and community driven.
          </p>
        </Section>

        {/* What We Believe */}
        <Section title="What We Believe" icon={Heart}>
          <div className="grid gap-5 sm:grid-cols-2">
            {BELIEFS.map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#3a424a] bg-[#262b30]/85 p-6 transition hover:border-[#e31337]/40 hover:bg-[#2b3138]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f353d] ring-1 ring-[#3a424a]">
                  <Icon className="h-5 w-5 text-[#e31337]" aria-hidden />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#f0f0f8]">{title}</h3>
                <p className="mt-2 text-sm text-[#c8cad6]">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Our Approach */}
        <Section title="Our Approach" icon={Wrench} subtitle="We focus on building multiple specialized apps, each solving a specific problem." alt>
          <Prose>
            Rather than creating one massive "super-app", we believe in an ecosystem of lightweight tools that work together.
          </Prose>
          <BulletList
            items={[
              'Faster development',
              'Faster experimentation',
              'Better user experiences',
              'More innovation within Hive',
            ]}
          />
        </Section>

        {/* Apps */}
        <Section title="Apps We Have Delivered" icon={CheckCircle2}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DELIVERED_APPS.map((app) => (
              <AppCard key={app.name} {...app} />
            ))}
          </div>

          <h3 className="mt-12 mb-4 text-center text-xl font-bold text-[#f0f0f8] flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" aria-hidden />
            Currently in Development
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            {IN_DEV_APPS.map((app) => (
              <AppCard key={app.name} {...app} />
            ))}
          </div>

          <h3 className="mt-12 mb-4 text-center text-xl font-bold text-[#f0f0f8] flex items-center justify-center gap-2">
            <Map className="h-5 w-5 text-blue-400" aria-hidden />
            Planned Applications
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLANNED_APPS.map((app) => (
              <AppCard key={app.name} {...app} />
            ))}
          </div>
        </Section>

        {/* Why We Build */}
        <Section title="Why We Build" icon={Star} alt>
          <Prose>We are building these applications:</Prose>
          <BulletList
            items={[
              'Without external funding',
              'With passion for Hive',
              'For the entire community',
              'And completely open source',
            ]}
          />
          <p className="mt-8 text-center text-lg font-medium text-[#e7e7f1]">
            Our goal is simple: Help Hive grow by making it easier for Web2 users to discover and use.
          </p>
        </Section>

        {/* Open Source Commitment */}
        <Section title="Open Source Commitment" icon={GitBranch}>
          <Prose>
            All of our projects are open source and publicly available.
          </Prose>
          <Prose>
            Developers are welcome to explore, contribute, fork, and build upon our work.
          </Prose>
          <p className="mt-6 text-center text-lg font-medium text-[#e7e7f1]">
            Hive grows stronger when builders collaborate.
          </p>
        </Section>

        {/* Long Term Goal */}
        <Section title="Long Term Goal" icon={Globe} alt>
          <Prose>
            Our long-term goal is to create a complete ecosystem of mobile and web apps for Hive that rivals the usability and polish of Web2 platforms.
          </Prose>
          <div className="mt-4">
            <Prose>By doing this, we hope to:</Prose>
          </div>
          <BulletList
            items={[
              'Attract new users',
              'Empower creators',
              'Support communities',
              'Help Hive reach a global audience',
            ]}
          />
        </Section>

        <footer className="border-t border-[#3a424a] px-4 py-8 text-center text-sm text-[#9ca3b0] sm:px-8">
          <p>All Rights Reserved &copy; 2026 hSnaps</p>
        </footer>
      </div>
    </div>
  )
}
