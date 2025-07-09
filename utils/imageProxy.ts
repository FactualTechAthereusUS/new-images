// utils/imageProxy.ts
export function getProxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  
  // If it's already a local URL, return as-is
  if (originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
    return originalUrl
  }
  
  // Create the proxy URL
  const encodedUrl = encodeURIComponent(originalUrl)
  return `/api/image-proxy?url=${encodedUrl}`
}

export function getProxyImageUrlWithFallback(originalUrl: string, fallbackUrl?: string): string {
  if (!originalUrl && fallbackUrl) {
    return getProxyImageUrl(fallbackUrl)
  }
  return getProxyImageUrl(originalUrl)
} 