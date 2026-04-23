/**
 * EULA gate for iOS: blocks the app with a non-dismissable, non-skippable
 * EULA screen on first launch. Once accepted, persists to localStorage so
 * it is not shown again. No-op on web and Android.
 */
import { useState } from 'react'
import { FileText } from 'lucide-react'
import { isIOS } from '../utils/platform-detection'

const EULA_ACCEPTED_KEY = 'hsnaps_eula_accepted'

function hasAcceptedEula(): boolean {
  try {
    return localStorage.getItem(EULA_ACCEPTED_KEY) === '1'
  } catch {
    return false
  }
}

function persistEulaAcceptance() {
  try {
    localStorage.setItem(EULA_ACCEPTED_KEY, '1')
  } catch {
    // storage unavailable – still let the user proceed this session
  }
}

export function EulaGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState(() => !isIOS() || hasAcceptedEula())

  if (accepted) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#212529] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#3a424a] bg-[#262b30] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2f353d]">
            <FileText className="h-6 w-6 text-[#e31337]" />
          </div>
          <h2 className="text-xl font-bold text-[#f0f0f8]">End-User License Agreement</h2>
        </div>

        <div className="mt-5 max-h-[60vh] overflow-y-auto rounded-lg border border-[#3a424a] bg-[#1a1e22] p-4 text-sm leading-relaxed text-[#c8cad6]">
          <p>
            By using hSnaps ("the App"), you agree to be bound by this End-User License Agreement.
          </p>

          <div className="mt-3 rounded-lg border border-[#e31337]/60 bg-[#e31337]/10 p-3">
            <p className="font-bold uppercase tracking-wide text-[#ff7a92]">
              Zero tolerance policy
            </p>
            <p className="mt-1 text-[#f0f0f8]">
              hSnaps has <span className="font-semibold">no tolerance for objectionable content or abusive users</span>. Posting, sharing, or promoting such content — or harassing, threatening, or abusing other users — will result in content removal and account restrictions, and may be reported to the relevant authorities.
            </p>
          </div>

          <p className="mt-3 font-semibold text-[#e7e7f1]">User-generated content</p>
          <p className="mt-1">
            hSnaps displays content posted by third-party users on the Hive blockchain. We do not control, endorse, or guarantee the accuracy, integrity, or quality of any user-generated content. You acknowledge that you may be exposed to content that is offensive, indecent, or objectionable, and you use the App at your own risk.
          </p>
          <p className="mt-2">
            You are solely responsible for any content you post through the App.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Prohibited content and behavior</p>
          <p className="mt-1">
            You agree not to use the App to post, share, or promote content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, hateful, or otherwise objectionable. You also agree not to stalk, harass, impersonate, or otherwise abuse other users. Content involving child sexual abuse or exploitation (CSAE) is strictly prohibited and will be reported to the relevant authorities.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Flagging objectionable content</p>
          <p className="mt-1">
            Every post and comment has a "Report" option in its menu. Use it to flag content you believe violates this agreement. Reports are reviewed and appropriate action — including content removal — is taken within 24 hours.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Blocking abusive users</p>
          <p className="mt-1">
            You can mute or block any user directly from their profile or from the menu on any of their posts or comments. Blocked users' content will no longer appear in your feed.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Enforcement</p>
          <p className="mt-1">
            We reserve the right to remove content and restrict or terminate accounts that violate this agreement, with or without prior notice.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Disclaimer</p>
          <p className="mt-1">
            The App is provided "as is" without warranty of any kind. In no event shall hSnaps or its developers be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
          </p>

          <p className="mt-3 font-semibold text-[#e7e7f1]">Changes</p>
          <p className="mt-1">
            We reserve the right to modify this EULA at any time. Continued use of the App constitutes acceptance of the revised terms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            persistEulaAcceptance()
            setAccepted(true)
          }}
          className="mt-5 w-full rounded-xl bg-[#e31337] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#e31337]/25 transition hover:bg-[#c51231]"
        >
          I Agree
        </button>
      </div>
    </div>
  )
}
