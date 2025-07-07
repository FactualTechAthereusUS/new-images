import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import ProductCard from '../components/ProductCard'
import { debounce } from 'lodash'

interface OptimizedProduct {
  id: string
  title: string
  tags: string[]
  image: string | null
  print_provider_id: number
  created_at: string
}

interface ApiResponse {
  data: OptimizedProduct[]
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number
  to: number
  cached_at: number
  cache_hit: boolean
}

export default function Home() {
  const [products, setProducts] = useState<OptimizedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [cacheInfo, setCacheInfo] = useState<{ cached_at: number; cache_hit: boolean } | null>(null)
  const productsPerPage = 24 // Increased for better performance
  const router = useRouter()

  // Product categories
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'tshirts', name: 'T-Shirts' },
    { id: 'sweatshirts', name: 'Sweatshirts' },
    { id: 'hoodies', name: 'Hoodies' },
    { id: 'stickers', name: 'Stickers' },
    { id: 'art', name: 'Wall Art' }
  ]

  // Debounced search
  const debouncedSearchHandler = useMemo(
    () => debounce((term: string) => {
      setDebouncedSearch(term)
      setCurrentPage(1)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearchHandler(searchTerm)
    return () => debouncedSearchHandler.cancel()
  }, [searchTerm, debouncedSearchHandler])

  // Load products with server-side filtering
  const loadProducts = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString(),
        search: debouncedSearch,
        category: categoryFilter
      })
      
      const response = await fetch(`/api/products?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data: ApiResponse = await response.json()
      
      setProducts(data.data)
      setTotalProducts(data.total)
      setTotalPages(data.last_page)
      setCacheInfo({ cached_at: data.cached_at, cache_hit: data.cache_hit })
      
      // Prefetch next page for better UX
      if (page < data.last_page) {
        const nextParams = new URLSearchParams({
          page: (page + 1).toString(),
          limit: productsPerPage.toString(),
          search: debouncedSearch,
          category: categoryFilter
        })
        fetch(`/api/products?${nextParams}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, categoryFilter, productsPerPage])

  useEffect(() => {
    loadProducts(currentPage)
  }, [currentPage, debouncedSearch, categoryFilter])

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProductClick = useCallback((productId: string) => {
    router.push(`/product/${productId}`)
  }, [router])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  // Loading skeleton
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-start mb-3">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => loadProducts(currentPage)}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-start mb-3">
            <img 
              src="/logo.png" 
              alt="Unhinged One" 
              className="h-6 md:h-8 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Products
            {cacheInfo && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({cacheInfo.cache_hit ? '🚀 Cached' : '🔄 Fresh'})
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Showing {totalProducts} Swift Pod products
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-primary-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          </div>
        )}

        <div className={`${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }`}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              onProductClick={handleProductClick}
              priority={index < 8} // Prioritize first 8 images
            />
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
