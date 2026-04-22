/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from 'hive-authentication'

export interface HiveAuthUser {
  username: string
  provider: string
  challenge: string
  publicKey: string
  proof: string
  serverResponse?: string
}

export interface HiveServerResponse {
  token: string
  type: string
}

export interface AuthUser {
  username: string
  provider: string
  challenge: string
  publicKey: string
  proof: string
  token: string
  type: string
}

interface AuthContextValue {
  currentUser: AuthUser | null
  loggedInUsers: AuthUser[]
  isLoading: boolean
  error: string | null
}

interface HiveAuthStore {
  currentUser: HiveAuthUser | null
  loggedInUsers: HiveAuthUser[]
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loggedInUsers: [],
  isLoading: false,
  error: null,
})

const parseUser = (user: HiveAuthUser): AuthUser => {
  let token = ''
  let type = ''
  if (user?.serverResponse) {
    try {
      const parsed: HiveServerResponse = JSON.parse(user.serverResponse)
      token = parsed.token
      type = parsed.type
    } catch (err) {
      console.warn('Invalid serverResponse JSON', err)
    }
  }
  return {
    username: user.username,
    provider: user.provider,
    challenge: user.challenge,
    publicKey: user.publicKey,
    proof: user.proof,
    token,
    type,
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore()
  const [state, setState] = useState<AuthContextValue>({
    currentUser: store.currentUser ? parseUser(store.currentUser as unknown as HiveAuthUser) : null,
    loggedInUsers: Array.isArray(store.loggedInUsers)
      ? (store.loggedInUsers as unknown as HiveAuthUser[]).map(parseUser)
      : [],
    isLoading: store.isLoading,
    error: store.error,
  })

  // Initialize encryption key so persisted auth data is decrypted on any page reload.
  // Mirrors HiveLoginButton's expression — the env key is passed straight through, matching what
  // AuthButton does internally via setSecretKey.
  useEffect(() => {
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY ?? import.meta.env.VITE_LOCAL_KEY
    if (!encryptionKey) return
    if (useAuthStore.getState().secretKey === encryptionKey) return

    const hadStoredUsers =
      !!localStorage.getItem('ha-logged-in-users') || !!localStorage.getItem('ha-logged-in-user')
    useAuthStore.getState().setSecretKey(encryptionKey)

    // If ciphertext was present but decrypt produced no users, the data was encrypted under a
    // different key. Purge it so the next reload doesn't re-trigger the "Malformed UTF-8" log.
    const after = useAuthStore.getState()
    if (hadStoredUsers && !after.currentUser && after.loggedInUsers.length === 0) {
      localStorage.removeItem('ha-logged-in-users')
      localStorage.removeItem('ha-logged-in-user')
    }
  }, [])

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((s: HiveAuthStore) => {
      setState({
        currentUser: s.currentUser ? parseUser(s.currentUser) : null,
        loggedInUsers: Array.isArray(s.loggedInUsers)
          ? s.loggedInUsers.map(parseUser)
          : [],
        isLoading: s.isLoading,
        error: s.error,
      })
    })

    return unsubscribe
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)

