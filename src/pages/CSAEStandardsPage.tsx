/**
 * CSAE (Child Sexual Abuse and Exploitation) standards for Google Play.
 * Externally published standards; link this page in Play Console.
 */
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Flag } from 'lucide-react'

export function CSAEStandardsPage() {
  return (
    <div className="app-header-safe-area min-h-screen bg-[#212529] text-[#f0f0f8]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/30 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#9ca3b0] transition hover:text-[#e7e7f1]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d]">
            <Shield className="h-6 w-6 text-[#e31337]" />
          </div>
          <h1 className="text-3xl font-bold text-[#f0f0f8]">
            Standards against Child Sexual Abuse and Exploitation (CSAE)
          </h1>
        </div>

        <div className="mt-8 space-y-8 text-[#c8cad6]">
          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Our position</h2>
            <p className="mt-2 leading-relaxed">
              hSnaps has zero tolerance for child sexual abuse and exploitation (CSAE). We do not permit any content that sexualizes or endangers minors. We are committed to keeping our platform safe and to complying with applicable laws, including those aimed at preventing and addressing CSAE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Content flagging and reporting</h2>
            <p className="mt-2 leading-relaxed">
              We provide in-app content flagging so that users can report posts, comments, or accounts that violate our standards or the law. When you use the <strong className="text-[#e7e7f1]">Flag</strong> option on a post or comment, your report is submitted through our reporting system. We treat reports of possible CSAE with the highest priority and will act in line with our standards and legal obligations.
            </p>
            <p className="mt-3 leading-relaxed">
              If you see content that you believe involves or promotes child sexual abuse or exploitation, please use the flag option in the app or contact us directly (see below). We encourage reporting so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Enforcement</h2>
            <p className="mt-2 leading-relaxed">
              Content or accounts that we determine violate our CSAE standards will be removed or restricted as appropriate. We may report to relevant authorities where required by law. We cooperate with law enforcement and designated bodies in accordance with applicable regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Contact</h2>
            <p className="mt-2 leading-relaxed">
              For questions about these standards or to report concerns, contact us via our{' '}
              <a
                href="https://discord.gg/WEKa8JKg7W"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e31337] underline hover:text-[#ff7a92]"
              >
                Discord server
              </a>
              {' '}or at{' '}
              <a
                href="mailto:sagar@techcoderlabz.com"
                className="text-[#e31337] underline hover:text-[#ff7a92]"
              >
                sagar@techcoderlabz.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 pt-8 border-t border-[#3a424a]">
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center gap-2 text-sm text-[#9ca3b0] transition hover:text-[#e7e7f1]"
          >
            <Flag className="h-4 w-4" />
            Settings &amp; support
          </Link>
          <Link to="/" className="text-sm text-[#e31337] hover:underline">
            Back to hSnaps
          </Link>
        </div>
      </div>
    </div>
  )
}
