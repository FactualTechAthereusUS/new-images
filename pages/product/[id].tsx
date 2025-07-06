import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { fetchProductById, PrintifyProduct, PLACEHOLDER_IMAGE } from '../../utils/printify'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState<PrintifyProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProduct(id)
    }
  }, [id])

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProductById(productId)
      setProduct(data)
      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0].src)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-primary-600 hover:text-primary-800 font-medium">
              ← Back to Products
            </Link>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading product...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-primary-600 hover:text-primary-800 font-medium">
              ← Back to Products
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading product</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => id && typeof id === 'string' && loadProduct(id)}
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

  if (!product) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-primary-600 hover:text-primary-800 font-medium">
              ← Back to Products
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Product not found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="text-primary-600 hover:text-primary-800 font-medium">
            ← Back to Products
          </Link>
        </div>

        {/* Product Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selected Image */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                onClick={() => selectedImage && openImageInNewTab(selectedImage)}
              >
                <img
                  src={selectedImage || product.images?.[0]?.src || PLACEHOLDER_IMAGE}
                  alt={product.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
              {selectedImage && (
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Click image to open in new tab
                </p>
              )}
            </div>
          </div>

          {/* All Images Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                All Mockups ({product.images?.length || 0})
              </h2>
              <div className="text-sm text-gray-600 bg-primary-50 px-3 py-1 rounded-full">
                💡 Click any image to open full size
              </div>
            </div>
            
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`group relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all duration-200 ${
                      selectedImage === image.src ? 'ring-2 ring-primary-500' : 'hover:shadow-md hover:ring-2 hover:ring-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedImage(image.src)
                      openImageInNewTab(image.src)
                    }}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={image.src}
                        alt={`${product.title} mockup ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    {/* Click indicator */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No mockup images available for this product.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 