// utils/printify.ts
import axios from 'axios'

// Placeholder image for fallback cases
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3Ctext x='150' y='150' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='16' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E"

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  images: Array<{
    src: string
    alt: string
    position: string
    is_default: boolean
  }>
  variants: Array<{
    id: number
    title: string
    options: Record<string, any>
    placeholders: Array<{
      position: string
      images: Array<{
        id: string
        name: string
        type: string
        height: number
        width: number
        x: number
        y: number
        scale: number
        angle: number
      }>
    }>
  }>
  print_areas: Array<{
    variant_ids: number[]
    placeholders: Array<{
      position: string
      images: Array<{
        id: string
        name: string
        type: string
        height: number
        width: number
        x: number
        y: number
        scale: number
        angle: number
      }>
    }>
  }>
  print_details: Array<{
    print_on_side: string
  }>
  sales_channel_properties: Array<any>
  is_locked: boolean
  created_at: string
  updated_at: string
  visible: boolean
  is_printify_express_eligible: boolean
  is_printify_express_enabled: boolean
  is_economy_shipping_eligible: boolean
  is_economy_shipping_enabled: boolean
  print_provider_id: number
}

export interface PrintifyShop {
  id: number
  title: string
  sales_channel: string
}

// Cache for shop ID
let cachedShopId: number | null = null

// Get user's shops
export async function fetchShops(): Promise<PrintifyShop[]> {
  try {
    const response = await axios.get('/api/shops')
    return response.data
  } catch (error) {
    console.error('Failed to fetch shops:', error)
    throw error
  }
}

// Get first shop ID (most users have one shop)
export async function getShopId(): Promise<number> {
  if (cachedShopId) {
    return cachedShopId
  }
  
  const shops = await fetchShops()
  if (shops.length === 0) {
    throw new Error('No shops found')
  }
  
  cachedShopId = shops[0].id
  return cachedShopId
}

// Get all products from the shop
export async function fetchProducts(): Promise<PrintifyProduct[]> {
  try {
    const shopId = await getShopId()
    const response = await axios.get(`/api/products?shopId=${shopId}`)
    return response.data.data || []
  } catch (error) {
    console.error('Failed to fetch products:', error)
    throw error
  }
}

// Get a single product by ID
export async function fetchProductById(productId: string): Promise<PrintifyProduct> {
  try {
    const shopId = await getShopId()
    const response = await axios.get(`/api/products/${productId}?shopId=${shopId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch product:', error)
    throw error
  }
}

// Download image utility
export function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Copy image to clipboard utility
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    // Check if the Clipboard API supports writing images
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported')
    }

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    const blob = await response.blob()
    
    // Check if the blob is an image
    if (!blob.type.startsWith('image/')) {
      throw new Error('URL does not point to an image')
    }

    // Copy the image to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])

    return true
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error)
    // Fallback: copy URL instead
    return await copyToClipboard(imageUrl)
  }
}

// Copy to clipboard utility (for URLs as fallback)
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
