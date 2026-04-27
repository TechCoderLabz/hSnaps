import React, { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useAioha } from '@aioha/react-ui'
import { useAuthData } from '../stores/authStore'
import { uploadToHiveImages } from '../services/hiveImageUpload'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
}

async function validateMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const signatures = MAGIC_BYTES[file.type]
  if (!signatures) return false
  return signatures.some((sig) => sig.every((b, i) => bytes[i] === b))
}

function stripMetadataViaCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0)
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = file.type === 'image/png' ? undefined : 0.92
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name, { type: mime, lastModified: Date.now() }))
        },
        mime,
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to process image')) }
    img.src = url
  })
}

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { currentUser, ecencyToken: ecencyTokenFromStore, username } = useAuthData()
  const { aioha } = useAioha()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    const validBytes = await validateMagicBytes(file);
    if (!validBytes) {
      setError("File content doesn't match its type. Please select a valid image.");
      return;
    }
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const cleaned = file.type === 'image/gif' ? file : await stripMetadataViaCanvas(file);
      uploadImage(cleaned);
    } catch {
      uploadImage(file);
    }
  };

  const uploadToEcency = async (file: File): Promise<string> => {
    const ecencyToken =
      ecencyTokenFromStore ||
      (currentUser?.serverResponse ? (JSON.parse(currentUser.serverResponse) as { ecencyToken?: string })?.ecencyToken : undefined);
    if (!ecencyToken) {
      throw new Error("Please log in to upload images. Upload token not found.");
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("https://images.ecency.com/hs/" + ecencyToken, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        origin: "https://ecency.com",
        referer: "https://ecency.com/",
      },
      body: formData,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    const data = await response.json();
    if (!data.url) throw new Error("No URL returned from upload");
    return data.url as string;
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      let url: string;
      try {
        url = await uploadToEcency(file);
      } catch (ecencyErr) {
        if (!aioha || !username) throw ecencyErr;
        try {
          url = await uploadToHiveImages(aioha, username, file);
        } catch (hiveErr) {
          const ecencyMsg = ecencyErr instanceof Error ? ecencyErr.message : String(ecencyErr);
          const hiveMsg = hiveErr instanceof Error ? hiveErr.message : String(hiveErr);
          throw new Error(`Both upload methods failed. Ecency: ${ecencyMsg}. Hive: ${hiveMsg}`);
        }
      }
      onImageUploaded(url);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        title="Upload Image"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {(previewUrl || error) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{error ? "Upload Error" : "Image Preview"}</h3>
              <button type="button" onClick={clearPreview} className="p-1 hover:bg-slate-800 rounded">
                <X className="h-5 w-5 text-slate-300" />
              </button>
            </div>
            <div className="p-4">
              {error ? (
                <div className="text-rose-400 text-sm">{error}</div>
              ) : previewUrl ? (
                <div className="space-y-4">
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain rounded" />
                  {isUploading && (
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-400" />
                      <p className="text-sm text-slate-400">Uploading image...</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
