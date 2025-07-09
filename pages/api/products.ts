import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_BASE = 'https://api.printify.com/v1'
const TOKEN = process.env.NEXT_PUBLIC_PRINTIFY_TOKEN

// In-memory cache for Swift Pod products
let swiftPodCache: any[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shopId, page = 1, limit = 20, providerId, refresh } = req.query

  if (!TOKEN) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_PRINTIFY_TOKEN is not configured' })
  }

  if (!shopId) {
    return res.status(400).json({ error: 'Shop ID is required' })
  }

  try {
    const targetLimit = parseInt(limit as string) || 20
    const currentPage = parseInt(page as string) || 1
    const targetProviderId = providerId ? parseInt(providerId as string) : null
    
    if (!targetProviderId) {
      // If no provider filtering, just return normal results
      const response = await axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
        headers: { 
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: page,
          limit: limit
        }
      })
      return res.status(200).json(response.data)
    }
    
    // Check if we have valid cached data
    const now = Date.now()
    const forceRefresh = refresh === 'true'
    const cacheValid = swiftPodCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION && !forceRefresh
    
    if (!cacheValid) {
      console.log('Refreshing Swift Pod cache...')
      
      // Strategy: Fast initial load, then background cache building
      if (swiftPodCache.length === 0) {
                // First request - get just enough products quickly
        try {
          // Simple sequential approach for reliability
          let quickProducts: any[] = []
          
          // Get first 3 pages sequentially with shorter timeouts
          for (let page = 1; page <= 3; page++) {
            try {
              const response = await axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
                headers: { 
                  'Authorization': `Bearer ${TOKEN}`,
                  'Content-Type': 'application/json'
                },
                params: { page, limit: 100 },
                timeout: 4000
              })
              
              const products = response.data.data || []
              quickProducts = quickProducts.concat(products)
              
              // Early exit if we have enough Swift Pod products
              const swiftPodCount = quickProducts.filter((product: any) => 
                product.print_provider_id === targetProviderId
              ).length
              
              if (swiftPodCount >= 20) {
                console.log(`Early exit: Found ${swiftPodCount} Swift Pod products`)
                break
              }
            } catch (error) {
              console.error(`Page ${page} fetch failed:`, error)
              // Continue with next page
            }
          }
          
          swiftPodCache = quickProducts.filter((product: any) => 
            product.print_provider_id === targetProviderId
          )
          
          cacheTimestamp = now
          console.log(`Quick cache: ${swiftPodCache.length} Swift Pod products`)
          
          // Background cache building (don't await)
          buildFullCache(shopId as string, targetProviderId)
          
        } catch (error) {
          console.error('Quick cache failed:', error)
          swiftPodCache = []
        }
       } else {
         // Cache exists but expired - refresh in background
         buildFullCache(shopId as string, targetProviderId)
       }
    }
    
    // Use cached data for pagination
    const startIndex = (currentPage - 1) * targetLimit
    const endIndex = startIndex + targetLimit
    const pageProducts = swiftPodCache.slice(startIndex, endIndex)
    
    // Optimize payload - only return essential fields
    const optimizedProducts = pageProducts.map((product: any) => ({
      id: product.id,
      title: product.title,
      tags: product.tags || [],
      images: product.images ? product.images.slice(0, 4) : [], // Limit to 4 images max
      print_provider_id: product.print_provider_id,
      created_at: product.created_at
    }))
    
    // Use actual cache count for better accuracy
    const totalProducts = swiftPodCache.length
    const totalPages = Math.ceil(totalProducts / targetLimit)
    
    const result = {
      data: optimizedProducts,
      total: totalProducts,
      per_page: targetLimit,
      current_page: currentPage,
      last_page: totalPages,
      from: startIndex + 1,
      to: startIndex + optimizedProducts.length,
      prev_page_url: currentPage > 1 ? `/?page=${currentPage - 1}` : null,
      next_page_url: currentPage < totalPages ? `/?page=${currentPage + 1}` : null
    }
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// Background function to build full cache
async function buildFullCache(shopId: string, targetProviderId: number) {
  const maxPages = 6 // Reduced from 10 for faster loading
  
  try {
    // Create parallel requests for multiple pages
    const requests = []
    for (let i = 1; i <= maxPages; i++) {
      requests.push(
        axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
          headers: { 
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: {
            page: i,
            limit: 100 // Increased limit per page
          },
          timeout: 8000 // 8 second timeout per request
        })
      )
    }
    
    // Execute all requests in parallel
    const responses = await Promise.all(requests)
    
    // Combine and filter all products
    let allProducts: any[] = []
    for (const response of responses) {
      const products = response.data.data || []
      allProducts = allProducts.concat(products)
    }
    
    // Filter to only Swift Pod products
    const fullCache = allProducts.filter((product: any) => 
      product.print_provider_id === targetProviderId
    )
    
    // Update cache only if we got more products
    if (fullCache.length > swiftPodCache.length) {
      swiftPodCache = fullCache
      cacheTimestamp = Date.now()
      console.log(`Full cache built: ${swiftPodCache.length} Swift Pod products`)
    }
    
  } catch (error) {
    console.error('Background cache building failed:', error)
  }
} 