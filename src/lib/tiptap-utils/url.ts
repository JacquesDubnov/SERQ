import { MAX_FILE_SIZE } from "./constants"

export type ProtocolOptions = {
  /**
   * The protocol scheme to be registered.
   * @default '''
   * @example 'ftp'
   * @example 'git'
   */
  scheme: string

  /**
   * If enabled, it allows optional slashes after the protocol.
   * @default false
   * @example true
   */
  optionalSlashes?: boolean
}

export type ProtocolConfig = Array<ProtocolOptions | string>

export const ATTR_WHITESPACE =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

/**
 * Handles image upload with progress tracking and abort capability
 * @param file The file to upload
 * @param onProgress Optional callback for tracking upload progress
 * @param abortSignal Optional AbortSignal for cancelling the upload
 * @returns Promise resolving to the URL of the uploaded image
 */
export const handleImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  // Validate file
  if (!file) {
    throw new Error("No file provided")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`
    )
  }

  // For demo/testing: Simulate upload progress. In production, replace the following code
  // with your own upload implementation.
  for (let progress = 0; progress <= 100; progress += 10) {
    if (abortSignal?.aborted) {
      throw new Error("Upload cancelled")
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    onProgress?.({ progress })
  }

  return "/images/tiptap-ui-placeholder-image.jpg"
}

export function isAllowedUri(
  uri: string | undefined,
  protocols?: ProtocolConfig
) {
  const allowedProtocols: string[] = [
    "http",
    "https",
    "ftp",
    "ftps",
    "mailto",
    "tel",
    "callto",
    "sms",
    "cid",
    "xmpp",
  ]

  if (protocols) {
    protocols.forEach((protocol) => {
      const nextProtocol =
        typeof protocol === "string" ? protocol : protocol.scheme

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  return (
    !uri ||
    uri.replace(ATTR_WHITESPACE, "").match(
      new RegExp(
        // eslint-disable-next-line no-useless-escape
        `^(?:(?:${allowedProtocols.join("|")}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`,
        "i"
      )
    )
  )
}

export function sanitizeUrl(
  inputUrl: string,
  baseUrl: string,
  protocols?: ProtocolConfig
): string {
  try {
    const url = new URL(inputUrl, baseUrl)

    if (isAllowedUri(url.href, protocols)) {
      return url.href
    }
  } catch {
    // If URL creation fails, it's considered invalid
  }
  return "#"
}
