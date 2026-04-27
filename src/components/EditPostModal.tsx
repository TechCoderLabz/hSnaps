/**
 * Modal for editing an existing post. Uses the shared PostComposer from hive-react-kit
 * so the edit flow matches the new-post flow (same toolbar, image upload with ecency→hive
 * fallback, paste/drag, emoji, GIF, preview, etc.).
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { PostComposer, useHiveImageSign } from 'hive-react-kit'
import { useAioha } from '@aioha/react-ui'
import { useAuthStore as useHiveAuthStore } from 'hive-authentication'
import { useAuthData } from '../stores/authStore'
import { useHiveOperations, stripAppSuffix } from '../hooks/useHiveOperations'
import type { NormalizedPost } from '../utils/types'

interface EditPostModalProps {
  post: NormalizedPost
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newBody: string) => void
}

function extractImageUrlsFromMarkdown(md: string): string[] {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urls: string[] = []
  let m
  while ((m = re.exec(md)) !== null) urls.push(m[2].trim())
  return [...new Set(urls)]
}

export function EditPostModal({ post, isOpen, onClose, onSuccess }: EditPostModalProps) {
  const { editPost } = useHiveOperations()
  const { username, ecencyToken, token } = useAuthData()
  const { aioha } = useAioha()
  const { currentUser: hiveAuthUser } = useHiveAuthStore()
  const signMessage = useHiveImageSign({ signer: aioha, user: hiveAuthUser })
  const [body, setBody] = useState(() => stripAppSuffix(post.body))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const provider = (hiveAuthUser?.provider || '').toLowerCase()
  const isWalletProvider = provider === 'keychain' || provider === 'peakvault' || provider === 'hiveauth'
  const awaitingWalletApproval = isSubmitting && isWalletProvider

  const giphyApiKey = import.meta.env.VITE_GIPHY_KEY || undefined
  const threeSpeakApiKey = import.meta.env.VITE_3SPEAK_API_KEY || undefined

  const handleSubmit = async (submittedBody: string) => {
    if (!submittedBody.trim() || isSubmitting) return
    const parentAuthor = post.parent_author
    const parentPermlink = post.parent_permlink
    if (!parentAuthor || !parentPermlink) {
      toast.error('Cannot edit: missing parent post info')
      return
    }

    setIsSubmitting(true)
    try {
      const finalBody = submittedBody.trim()
      const images = extractImageUrlsFromMarkdown(finalBody)
      const existingMeta = post.json_metadata ? JSON.parse(post.json_metadata) : {}
      if (images.length > 0) existingMeta.image = images
      const jsonMetadata = JSON.stringify(existingMeta)

      await editPost(parentAuthor, parentPermlink, post.permlink, finalBody, post.title, jsonMetadata)
      toast.success('Post updated successfully!')
      onSuccess?.(finalBody)
      onClose()
    } catch {
      // error toast already shown by useHiveOperations
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#3a424a] border-b-0 bg-[#262b30] sm:rounded-2xl sm:border-b">
        <div className="flex shrink-0 items-center justify-between px-4 py-3 bg-[#262b30] border-b border-[#3a424a]">
          <h2 className="text-base font-semibold text-[#f0f0f8]">Edit post</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3b0] transition-colors hover:bg-[#2f353d] hover:text-[#f0f0f8]"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <PostComposer
            onSubmit={handleSubmit}
            onCancel={onClose}
            currentUser={username || undefined}
            placeholder="Edit your post..."
            value={body}
            onChange={setBody}
            disabled={isSubmitting}
            submitLabel={isSubmitting ? 'Saving…' : 'Save'}
            showCancel
            hideUserHeader
            bgColor="#262b30"
            borderColor="#3a424a"
            ecencyToken={ecencyToken}
            onSignMessage={signMessage}
            signingUsername={username || undefined}
            awaitingWalletApproval={awaitingWalletApproval}
            threeSpeakApiKey={threeSpeakApiKey}
            giphyApiKey={giphyApiKey}
            templateApiBaseUrl={import.meta.env.VITE_TEMPLATE_API_BASE_URL || 'https://hreplier-api.sagarkothari88.one/data/templates'}
            templateToken={token}
            hidePoll
          />
        </div>
      </div>
    </div>
  )
}
