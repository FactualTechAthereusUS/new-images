import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { PrintifyProduct } from '../utils/printify'
import { getProxyImageUrl } from '../utils/imageProxy'

export default function Home() {
  const [products, setProducts] = useState<PrintifyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('created_at')
  const [filterBy, setFilterBy] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('swiftpod') // Always filter by Swift Pod
  const productsPerPage = 12 // Increased from 8 to reduce API calls
  const router = useRouter()

  // Swift Pod provider ID
  const SWIFT_POD_PROVIDER_ID = 39

  // Product categories
  const categories = [
    { id: 'all', name: 'All Products', tags: [] },
    { id: 'tshirts', name: 'T-Shirts', tags: ['T-shirts'] },
    { id: 'sweatshirts', name: 'Sweatshirts', tags: ['Sweatshirts'] },
    { id: 'hoodies', name: 'Hoodies', tags: ['Hoodies'] },
    { id: 'stickers', name: 'Stickers', tags: ['Kiss-Cut Stickers', 'Laptop Stickers', 'Stickers'] },
    { id: 'art', name: 'Wall Art', tags: ['Unique Wall Art', 'Room Decor', 'Rage Room Art'] }
  ]

  useEffect(() => {
    loadProducts()
  }, [currentPage, sortBy, filterBy, categoryFilter, providerFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Always filter by Swift Pod provider (ID 39)
      const url = `/api/products?shopId=13337182&page=${currentPage}&limit=${productsPerPage}&providerId=39`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      // Simplified transformation - only keep essential fields
      const transformedProducts = data.data.map((product: any) => ({
        id: product.id,
        title: product.title,
        tags: product.tags || [],
        images: product.images || [],
        print_provider_id: product.print_provider_id,
        created_at: product.created_at || '',
      }))
      
      setProducts(transformedProducts)
      setTotalProducts(data.total)
      setTotalPages(data.last_page)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    
    // Category filtering
    let matchesCategory = true
    if (categoryFilter !== 'all') {
      const selectedCategory = categories.find(cat => cat.id === categoryFilter)
      if (selectedCategory && selectedCategory.tags.length > 0) {
        matchesCategory = selectedCategory.tags.some(categoryTag => 
          product.tags && product.tags.some(productTag => productTag.toLowerCase().includes(categoryTag.toLowerCase()))
        )
      }
    }

    // Provider filtering is now done on backend, all products are Swift Pod
    return matchesSearch && matchesCategory
  })

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 10
    
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

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
          
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          </div>
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
                onClick={loadProducts}
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
          {/* Logo */}
          <div className="flex justify-start mb-3">
            <img 
              src="/logo.png" 
              alt="Unhinged One" 
              className="h-6 md:h-10 w-auto object-contain max-w-xs"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            {categoryFilter === 'all' ? 'Products' : categories.find(cat => cat.id === categoryFilter)?.name || 'Products'}
          </h1>
          <p className="text-gray-600 text-center">
            {loading ? (
              <span>Loading products...</span>
            ) : (
              <>
                Showing {filteredProducts.length} of {totalProducts} products
                {categoryFilter !== 'all' && (
                  <span className="ml-2 text-primary-600">
                    • Filtered by {categories.find(cat => cat.id === categoryFilter)?.name}
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2 text-green-600">
                    • Search: "{searchTerm}"
                  </span>
                )}

              </>
            )}
          </p>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600 border border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* View Mode */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your search.</p>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${
                  viewMode === 'list' ? 'flex p-4' : ''
                }`}
                onClick={() => handleProductClick(product.id)}
              >
                <div className={`${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'} bg-gray-100 relative overflow-hidden`}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getProxyImageUrl(product.images[0].src)}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                                 <div className={`${viewMode === 'list' ? 'ml-4 flex-1' : 'p-4'}`}>
                   <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{product.title}</h3>
                   
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-600">
                       {product.images?.length || 0} images
                     </span>
                     <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                     </svg>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && filteredProducts.length > 0 && (
          <div className="mt-12 flex items-center justify-center">
            <nav className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                Previous
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
