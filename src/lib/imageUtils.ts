/**
 * Image utility functions for handling file uploads
 */

/** Size threshold for large image warning (2MB) */
export const IMAGE_SIZE_THRESHOLD = 2 * 1024 * 1024

/**
 * Check if a file is an image based on MIME type
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Check if an image file exceeds the size threshold
 * @returns true if the file is larger than the threshold
 */
export function isLargeImage(file: File): boolean {
  return file.size > IMAGE_SIZE_THRESHOLD
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Convert a File to a base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as string'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from a base64 data URL
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
