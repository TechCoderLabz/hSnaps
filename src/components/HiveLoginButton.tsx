import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import 'hive-authentication/build.css'
import { useAioha } from '@aioha/react-provider'
import { AuthButton } from 'hive-authentication'
import type { HiveAuthResult } from 'hive-authentication'
import { useAppAuthStore } from '../stores/authStore'

const HD_API_SERVER =
  import.meta.env.VITE_HIVE_API_SERVER || 'https://hreplier-api.sagarkothari88.one'

// Hive brand gradient
const LOGIN_BUTTON_COLORS = ['#e31337', '#c51231', '#9f1028']

/** Ecency-style token: signed_message + authors + timestamp; signatures = [challenge] then btoa(JSON.stringify). */
export const HiveLoginButton: React.FC = () => {
  const { aioha } = useAioha()
  const setFromServerResponse = useAppAuthStore((s) => s.setFromServerResponse)
  const navigate = useNavigate()
  const location = useLocation()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Ecency token: same shape as reference (signed_message, authors, timestamp, signatures = [challenge])
  const objectForAuthRef = useRef<{
    signed_message: { type: string; app: string }
    authors: string[]
    timestamp: string
    signatures?: string[]
  } | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => setTheme(mq.matches ? 'dark' : 'light')
    updateTheme()
    mq.addEventListener('change', updateTheme)
    return () => {
      mq.removeEventListener('change', updateTheme)
    }
  }, [])

  const handleAuthenticate = async (hiveResult: HiveAuthResult) => {
    try {
      if (!objectForAuthRef.current) {
        objectForAuthRef.current = {
          signed_message: { type: 'login', app: 'thehivemobileapp' },
          authors: [hiveResult.username],
          timestamp: new Date().toISOString(),
        }
      }

      // Ecency token: attach signature (challenge), then base64-encode the object
      objectForAuthRef.current.signatures = [hiveResult.challenge]
      const stringifiedForToken = JSON.stringify(objectForAuthRef.current)
      const ecencyToken = btoa(stringifiedForToken)

      const response = await fetch(`${HD_API_SERVER}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: hiveResult.challenge,
          proof: hiveResult.proof,
          pubkey: hiveResult.publicKey,
          username: hiveResult.username,
        }),
      })

      if (!response.ok) {
        throw new Error('Server authentication failed')
      }

      const data = await response.json()
      // Enrich payload similar to reference implementation
      data.provider = hiveResult.provider
      data.ecencyToken = ecencyToken
      data.challenge = hiveResult.challenge
      data.proof = hiveResult.proof
      data.pubkey = hiveResult.publicKey
      data.username = hiveResult.username

      if (hiveResult.privatePostingKey) {
        ;(data as any).privatePostingKey = hiveResult.privatePostingKey
      }

      const serverResponse = JSON.stringify(data)

      // Store in app Zustand (ecencyToken, token, etc.) for ImageUploader and useAuthData
      setFromServerResponse(serverResponse)

      // Redirect to intended path or default dashboard (same pattern as reference)
      const redirectPath = (location.state as { from?: string } | null)?.from ?? '/dashboard/snaps'
      navigate(redirectPath)

      return serverResponse
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  return (
    <AuthButton
      onAuthenticate={handleAuthenticate}
      aioha={aioha}
      encryptionKey={import.meta.env.VITE_ENCRYPTION_KEY ?? import.meta.env.VITE_LOCAL_KEY}
      onClose={() => {
        // login dialog closed
      }}
      onSignMessage={(username) => {
        const objectForAuth = {
          signed_message: { type: 'login', app: 'thehivemobileapp' },
          authors: [username],
          timestamp: new Date().toISOString(),
        }
        objectForAuthRef.current = objectForAuth
        return JSON.stringify(objectForAuth)
      }}
      theme={theme}
      isActiveFieldVisible={true}
      loginButtonColors={LOGIN_BUTTON_COLORS}
    />
  )
}

