/**
 * Open a URL: on iOS (Capacitor) use in-app browser (SFSafariViewController),
 * on Android/web open in new tab.
 */
import { Capacitor } from '@capacitor/core'

export async function openLink(url: string): Promise<void> {
  if (!url || !url.startsWith('http')) return
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
