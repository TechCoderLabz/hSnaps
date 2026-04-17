import { Buffer } from 'buffer'
import { KeyTypes, type Aioha } from '@aioha/aioha'

export async function uploadToHiveImages(
  aioha: Aioha,
  username: string,
  file: Blob,
  filename?: string,
): Promise<string> {
  if (!username) throw new Error('Hive username is required for image upload')

  const arrayBuffer = await file.arrayBuffer()
  const imageBytes = Buffer.from(new Uint8Array(arrayBuffer))
  const prefix = Buffer.from('ImageSigningChallenge')
  const buf = Buffer.concat([prefix, imageBytes])

  const signed = await aioha.signMessage(JSON.stringify(buf), KeyTypes.Posting)
  if (!signed.success) {
    throw new Error(signed.error || 'Failed to sign image for Hive upload')
  }
  if (!signed.result) {
    throw new Error('Failed to sign image for Hive upload')
  }

  const formData = new FormData()
  if (filename) formData.append('file', file, filename)
  else formData.append('file', file)

  const response = await fetch(
    `https://images.hive.blog/${username}/${signed.result}`,
    { method: 'POST', body: formData },
  )
  if (!response.ok) {
    throw new Error(`Hive image upload failed: ${response.statusText}`)
  }
  const data = (await response.json()) as { url?: string }
  if (!data.url) throw new Error('No URL returned from Hive image upload')
  return data.url
}
