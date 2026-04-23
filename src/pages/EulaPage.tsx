/**
 * End-User License Agreement page.
 * Accessible from Settings; also shown as a mandatory gate on first iOS launch.
 */
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Flag } from 'lucide-react'

export function EulaPage() {
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
            <FileText className="h-6 w-6 text-[#e31337]" />
          </div>
          <h1 className="text-3xl font-bold text-[#f0f0f8]">
            End-User License Agreement
          </h1>
        </div>

        <div className="mt-8 space-y-8 text-[#c8cad6]">
          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Acceptance of terms</h2>
            <p className="mt-2 leading-relaxed">
              By downloading, installing, or using hSnaps ("the App"), you agree to be bound by the terms of this End-User License Agreement ("EULA"). If you do not agree to these terms, do not use the App.
            </p>
          </section>

          <section className="rounded-xl border border-[#e31337]/60 bg-[#e31337]/10 p-5">
            <h2 className="text-lg font-bold uppercase tracking-wide text-[#ff7a92]">
              Zero tolerance policy
            </h2>
            <p className="mt-2 leading-relaxed text-[#f0f0f8]">
              hSnaps has <span className="font-semibold">no tolerance for objectionable content or abusive users</span>. Posting, sharing, or promoting such content — or harassing, threatening, or abusing other users in any way — will result in content removal and account restrictions, and may be reported to the relevant authorities. By using the App, you affirm that you understand and accept this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">User-generated content</h2>
            <p className="mt-2 leading-relaxed">
              hSnaps displays content posted by third-party users on the Hive blockchain. We do not control, endorse, or guarantee the accuracy, integrity, or quality of any user-generated content. You acknowledge that you may be exposed to content that is offensive, indecent, or objectionable, and you use the App at your own risk.
            </p>
            <p className="mt-3 leading-relaxed">
              You are solely responsible for any content you post through the App. By posting content, you represent that you have all necessary rights to do so and that your content does not violate any applicable laws or the rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Prohibited content and behavior</h2>
            <p className="mt-2 leading-relaxed">
              You agree not to use the App to post, share, or promote content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, hateful, or otherwise objectionable. You also agree not to stalk, harass, impersonate, or otherwise abuse other users. Content involving child sexual abuse or exploitation (CSAE) is strictly prohibited and will be reported to the relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Flagging objectionable content</h2>
            <p className="mt-2 leading-relaxed">
              Every post and comment includes a "Report" option in its menu. If you encounter content that violates this agreement or is otherwise inappropriate, please flag it. Reports are reviewed and appropriate action — including content removal — is taken within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Blocking abusive users</h2>
            <p className="mt-2 leading-relaxed">
              You can mute or block any user directly from their profile, or from the menu on any of their posts or comments. Once blocked, that user's posts and comments will no longer appear in your feed or replies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Enforcement</h2>
            <p className="mt-2 leading-relaxed">
              We reserve the right to remove content and to restrict or terminate accounts that violate this agreement, with or without prior notice. Serious or repeat violations — including any CSAE content — may be reported to the relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Disclaimer of warranties</h2>
            <p className="mt-2 leading-relaxed">
              The App is provided "as is" without warranty of any kind. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Limitation of liability</h2>
            <p className="mt-2 leading-relaxed">
              In no event shall hSnaps or its developers be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or profits, arising out of or in connection with your use of the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Changes to this agreement</h2>
            <p className="mt-2 leading-relaxed">
              We reserve the right to modify this EULA at any time. Continued use of the App after any changes constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Contact</h2>
            <p className="mt-2 leading-relaxed">
              For questions about this agreement, contact us via our{' '}
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
