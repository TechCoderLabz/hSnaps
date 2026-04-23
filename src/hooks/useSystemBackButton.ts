import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { isMobilePlatform } from '../utils/platform-detection'
import { useBackDismissStore } from '../stores/backDismissStore'

/**
 * Android hardware back button handler.
 *
 * Priority:
 *   1. If any modal/sheet has registered a dismiss handler via
 *      `useBackDismiss`, pop and invoke the top one (close the modal).
 *   2. Otherwise navigate back one step in history.
 *
 * iOS swipe-back gesture is handled natively by WKWebView via
 * ios.allowsBackForwardNavigationGestures in capacitor.config.
 */
export function useSystemBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isMobilePlatform()) return

    const handle = App.addListener('backButton', () => {
      // 1) Let the topmost open modal/sheet consume the back press.
      if (useBackDismissStore.getState().popAndRun()) return
      // 2) Fall through to route navigation.
      navigate(-1)
    })

    return () => {
      void handle.then((h) => h.remove())
    }
  }, [navigate])
}
