import { useEffect, useRef } from 'react'
import { useAuthStore } from 'hive-authentication'
import { useAppAuthStore } from '../stores/authStore'

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.'

type TokenExpiredEventDetail = { message?: string }

export default function TokenExpirationHandler() {
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser)
  const clearAuth = useAppAuthStore((s) => s.clearAuth)
  const hasHandledRef = useRef(false)

  useEffect(() => {
    let disposed = false

    const handleTokenExpired = (event: Event) => {
      if (disposed || hasHandledRef.current) return
      hasHandledRef.current = true
      const customEvent = event as CustomEvent<TokenExpiredEventDetail>
      const message = customEvent.detail?.message || SESSION_EXPIRED_MESSAGE
      console.warn(message)
      setCurrentUser(null)
      clearAuth()
    }

    window.addEventListener('tokenExpired', handleTokenExpired as EventListener)
    return () => {
      disposed = true
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener)
    }
  }, [setCurrentUser, clearAuth])

  return null
}
