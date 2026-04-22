/**
 * Privacy Policy for hSnaps. Adapted from HiveFest Facts–style policy.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Go back to the route that brought us here; if the page was opened directly
  // (no prior in-app history), fall back to the landing page.
  const handleBack = () => {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }
  return (
    <div className="app-header-safe-area min-h-screen bg-[#212529] text-[#f0f0f8]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#3a1118]/30 via-[#212529] to-[#2b3138] pointer-events-none" />
      <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-[#9ca3b0] transition hover:text-[#e7e7f1]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <h1 className="mt-8 text-3xl font-bold text-[#f0f0f8]">Privacy Policy</h1>

        <div className="mt-8 space-y-8 text-[#c8cad6]">
          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">Introduction</h2>
            <p className="mt-2 leading-relaxed">
              Welcome to hSnaps, a social application that aggregates short-form content from the Hive blockchain (Snaps, Threads, Waves, Moments). Your privacy is important to us. This Privacy Policy outlines how we handle your information when you use our app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">1. We Do Not Collect Your Data</h2>
            <p className="mt-2 leading-relaxed">
              hSnaps does not collect, store, or track any personal data. We do not collect analytics, device information, usage data, or any other form of personal information. You authenticate via the Hive blockchain (e.g. Hive Keychain or Hive Auth), and we do not store your private keys.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">2. You Decide What to Share</h2>
            <p className="mt-2 leading-relaxed">
              Any content you submit through hSnaps (such as snaps, threads, waves, moments, or comments) is entirely your choice. You are in full control of what you share. Content you post is published on the Hive blockchain according to the rules of the respective dApps (PeakD, Ecency, LeoFinance, Liketu, etc.). We do not require or compel you to provide any information beyond what is needed to use the app&apos;s features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">3. You Can Delete Your Data Anytime</h2>
            <p className="mt-2 leading-relaxed">
              You have the right to delete or manage any content you have submitted. Content on the Hive blockchain can be modified or managed according to the chain&apos;s and each dApp&apos;s rules. If you wish to have data associated with your use of hSnaps removed from our systems (e.g. locally stored preferences), you can clear app data or contact us. We do not retain your personal data on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">4. No Third-Party Sharing</h2>
            <p className="mt-2 leading-relaxed">
              Since we do not collect your personal data, there is nothing to share with third parties. We do not sell, trade, or transfer any user information to outside parties. We may use third-party services (e.g. for authentication or API access) that have their own privacy policies; your interaction with the Hive blockchain is subject to its public, decentralized nature.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">5. Security</h2>
            <p className="mt-2 leading-relaxed">
              We take reasonable measures to ensure the security of the app. Any credentials or tokens used for authentication are handled by your wallet or the Hive Auth flow; we do not store your private keys. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">6. Changes to This Privacy Policy</h2>
            <p className="mt-2 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#e7e7f1]">7. Contact Us</h2>
            <p className="mt-2 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us via our{' '}
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

        <div className="mt-12 pt-8 border-t border-[#3a424a] text-center text-sm text-[#9ca3b0]">
          <Link to="/" className="text-[#e31337] hover:underline">
            Back to hSnaps
          </Link>
        </div>
      </div>
    </div>
  )
}
