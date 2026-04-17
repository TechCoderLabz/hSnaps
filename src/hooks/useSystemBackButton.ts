import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { isMobilePlatform } from '../utils/platform-detection'

/**
 * Android hardware back button → go back one step in history.
 * On /dashboard we stay put (don't exit).
 *
 * iOS swipe-back gesture is handled natively by WKWebView via
 * ios.allowsBackForwardNavigationGestures in capacitor.config.
 */
export function useSystemBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isMobilePlatform()) return

    const handle = App.addListener('backButton', () => {
      navigate(-1)
      // const path = window.location.hash.replace(/^#/, '').split('?')[0] || '/'
      // if (path === '/dashboard') return
      // navigate(-1)
    })

    return () => {
      void handle.then((h) => h.remove())
    }
  }, [navigate])
}
