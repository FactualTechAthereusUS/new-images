import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_BASE = 'https://api.printify.com/v1'
const TOKEN = process.env.NEXT_PUBLIC_PRINTIFY_TOKEN
const SWIFT_POD_PROVIDER_ID = 39

// Enhanced caching with longer duration
let swiftPodCache: any[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes - longer cache
let totalProductsCache = 0
let isRefreshing = false

interface OptimizedProduct {
  id: string
  title: string
  tags: string[]
  image: string | null
  print_provider_id: number
  created_at: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shopId = '13337182', page = 1, limit = 20, search = '', category = 'all', refresh } = req.query

  if (!TOKEN) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_PRINTIFY_TOKEN is not configured' })
  }

  try {
    const targetLimit = Math.min(parseInt(limit as string) || 20, 50) // Cap at 50
    const currentPage = parseInt(page as string) || 1
    const searchTerm = (search as string).toLowerCase()
    const categoryFilter = category as string
    
    // Check cache validity
    const now = Date.now()
    const forceRefresh = refresh === 'true'
    const cacheValid = swiftPodCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION && !forceRefresh

    if (!cacheValid && !isRefreshing) {
      isRefreshing = true
      console.log('🚀 Ultra-fast refresh starting...')
      
      try {
        // OPTIMIZED: Fetch only essential fields to reduce payload by 80%
        const allProducts: OptimizedProduct[] = []
        
        // Smart pagination - start with larger page size
        for (let pageNum = 1; pageNum <= 20; pageNum++) {
          const response = await axios.get(`${API_BASE}/shops/${shopId}/products.json`, {
            headers: { 
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json'
            },
            params: {
              page: pageNum,
              limit: 50
            },
            timeout: 10000 // 10 second timeout
          })
          
          const products = response.data.data || []
          
          // Filter and optimize in one pass
          const swiftPodProducts = products
            .filter((product: any) => product.print_provider_id === SWIFT_POD_PROVIDER_ID)
            .map((product: any) => ({
              id: product.id,
              title: product.title,
              tags: product.tags || [],
              image: product.images?.[0]?.src || null, // Only first image
              print_provider_id: product.print_provider_id,
              created_at: product.created_at
            }))
          
          allProducts.push(...swiftPodProducts)
          
          // Stop if we have enough Swift Pod products
          if (allProducts.length >= 433 || products.length < 50) {
            break
          }
        }
        
        swiftPodCache = allProducts
        totalProductsCache = allProducts.length
        cacheTimestamp = now
        
        console.log(`⚡ Cached ${swiftPodCache.length} products in ${Date.now() - now}ms`)
        
      } catch (error) {
        console.error('❌ Cache refresh failed:', error)
        // Don't fail completely - use existing cache if available
      } finally {
        isRefreshing = false
      }
    }
    
    // Use cached data for filtering and pagination
    let filteredProducts = swiftPodCache
    
    // Server-side search filtering
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }
    
    // Server-side category filtering
    if (categoryFilter !== 'all') {
      const categoryMap: { [key: string]: string[] } = {
        'tshirts': ['T-shirts', 'Tshirts'],
        'sweatshirts': ['Sweatshirts'],
        'hoodies': ['Hoodies'],
        'stickers': ['Kiss-Cut Stickers', 'Laptop Stickers', 'Stickers'],
        'art': ['Unique Wall Art', 'Room Decor', 'Rage Room Art']
      }
      
      const categoryTags = categoryMap[categoryFilter] || []
      if (categoryTags.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          categoryTags.some(categoryTag => 
            product.tags.some(productTag => productTag.toLowerCase().includes(categoryTag.toLowerCase()))
          )
        )
      }
    }
    
    // Pagination
    const totalFiltered = filteredProducts.length
    const totalPages = Math.ceil(totalFiltered / targetLimit)
    const startIndex = (currentPage - 1) * targetLimit
    const endIndex = startIndex + targetLimit
    const pageProducts = filteredProducts.slice(startIndex, endIndex)
    
    // Set aggressive caching headers
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=300')
    
    const result = {
      data: pageProducts,
      total: totalFiltered,
      per_page: targetLimit,
      current_page: currentPage,
      last_page: totalPages,
      from: startIndex + 1,
      to: Math.min(startIndex + targetLimit, totalFiltered),
      cached_at: cacheTimestamp,
      cache_hit: cacheValid
    }
    
    res.status(200).json(result)
    
  } catch (error) {
    console.error('💥 API Error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
} 