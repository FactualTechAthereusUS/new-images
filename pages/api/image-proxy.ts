import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// Simple in-memory cache for images
const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  // Validate that the URL is from Printify to prevent abuse
  if (!url.includes('printify.com')) {
    return res.status(403).json({ error: 'Only Printify images are allowed' })
  }

  try {
    const cacheKey = url
    const cached = imageCache.get(cacheKey)
    
    // Check if we have a valid cached version
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      res.setHeader('Content-Type', cached.contentType)
      res.setHeader('Cache-Control', 'public, max-age=86400') // 24 hours
      res.setHeader('X-Cache', 'HIT')
      return res.send(cached.data)
    }

    // Fetch the image from Printify with optimizations
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 8000, // Reduced timeout for faster failure recovery
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      maxRedirects: 3
    })

    const imageBuffer = Buffer.from(response.data)
    const contentType = response.headers['content-type'] || 'image/jpeg'

    // Cache the image
    imageCache.set(cacheKey, {
      data: imageBuffer,
      contentType,
      timestamp: Date.now()
    })

    // Clean up old cache entries (simple cleanup)
    if (imageCache.size > 1000) {
      const now = Date.now()
      Array.from(imageCache.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_DURATION) {
          imageCache.delete(key)
        }
      })
    }

    // Set response headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // 24 hours
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Content-Length', imageBuffer.length)

    res.send(imageBuffer)
  } catch (error) {
    console.error('Error proxying image:', error)
    
    // Return a placeholder image on error
    const placeholderSvg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#f3f4f6"/>
        <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="16" fill="#6b7280">
          Image not available
        </text>
      </svg>
    `
    
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=300') // 5 minutes for errors
    res.send(placeholderSvg)
  }
} 