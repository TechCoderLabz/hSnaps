/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { useAuthStore as useHiveAuthStore } from 'hive-authentication'
import { create } from 'zustand'

/**
 * Local app auth store (Zustand). Not persisted as hSnaps-auth.
 * Hydrated from hive-authentication serverResponse via useAuthData.
 */
interface AppAuthState {
  token: string | null
  username: string | null
  ecencyToken: string | undefined
  provider: string | null
  serverResponse: string | null
  isAuthenticated: boolean
  setFromServerResponse: (serverResponse: string) => void
  setUsername: (username: string | null) => void
  clearAuth: () => void
}

const initialState = {
  token: null as string | null,
  username: null as string | null,
  ecencyToken: undefined as string | undefined,
  provider: null as string | null,
  serverResponse: null as string | null,
  isAuthenticated: false,
}

export const useAppAuthStore = create<AppAuthState>((set) => ({
  ...initialState,
  setFromServerResponse: (serverResponse: string) => {
    try {
      const parsed = JSON.parse(serverResponse) as Record<string, any>
      set({
        serverResponse,
        token: parsed.token ?? null,
        username: parsed.username ?? null,
        ecencyToken: parsed.ecencyToken,
        provider: parsed.provider ?? null,
        isAuthenticated: !!parsed.token,
      })
    } catch {
      set({ ...initialState })
    }
  },
  setUsername: (username: string | null) =>
    set({
      username,
      token: null,
      ecencyToken: undefined,
      provider: null,
      serverResponse: null,
      isAuthenticated: !!username,
    }),
  clearAuth: () => set(initialState),
}))

/**
 * Auth data from Zustand store (ecencyToken, provider, etc.) with optional sync from hive-authentication.
 * Prefer Zustand; hydrate from hive-authentication serverResponse on mount if Zustand is empty.
 */
export const useAuthData = () => {
  const { currentUser } = useHiveAuthStore()
  const {
    token,
    username: storeUsername,
    ecencyToken,
    provider,
    serverResponse,
    isAuthenticated: storeAuthenticated,
    setFromServerResponse,
  } = useAppAuthStore()

  // Hydrate Zustand from hive-authentication when we have stored login but Zustand is empty
  useEffect(() => {
    const serverResponseFromHive = currentUser?.serverResponse
    if (serverResponseFromHive && !useAppAuthStore.getState().serverResponse) {
      setFromServerResponse(serverResponseFromHive)
    }
  }, [currentUser?.serverResponse, setFromServerResponse])

  // Keep local auth store in sync on logout from hive-authentication
  useEffect(() => {
    const { isAuthenticated, clearAuth: clear } = useAppAuthStore.getState()
    if (!currentUser && isAuthenticated) {
      clear()
    }
  }, [currentUser])

  let parsedHive: Record<string, any> = {}
  if (currentUser?.serverResponse) {
    try {
      parsedHive = JSON.parse(currentUser.serverResponse) as Record<string, any>
    } catch {
      // ignore
    }
  }
  const username =
    storeUsername || parsedHive?.username || (currentUser?.username ?? '')
  const tokenResolved = token || parsedHive?.token || ''
  const isAuthenticated =
    storeAuthenticated || !!(currentUser && tokenResolved)

  return {
    currentUser: currentUser
      ? {
          ...currentUser,
          serverResponse: serverResponse ?? currentUser.serverResponse,
          username: username || currentUser.username,
          provider,
        }
      : null,
    token: token || tokenResolved,
    username,
    ecencyToken,
    provider,
    isApprover: parsedHive?.isApprover ?? '',
    isAuthenticated,
  }
}

export const getToken = (currentUser: any): string => {
  const serverResponse = currentUser?.serverResponse
  if (!serverResponse) return ''
  try {
    return (JSON.parse(serverResponse) as Record<string, string>)?.token ?? ''
  } catch {
    return ''
  }
}

export const getType = (currentUser: any): string => {
  const serverResponse = currentUser?.serverResponse
  if (!serverResponse) return ''
  try {
    return (JSON.parse(serverResponse) as Record<string, string>)?.type ?? ''
  } catch {
    return ''
  }
}

export const getUsername = (currentUser: any): string => {
  return currentUser?.username || ''
}
