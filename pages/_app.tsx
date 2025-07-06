import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Handle Shopify proxy parameters
    const { pathname, query } = router
    
    // Remove Shopify proxy parameters from URL display
    if (query.shop || query.path_prefix || query.timestamp || query.signature) {
      const cleanQuery = { ...query }
      delete cleanQuery.shop
      delete cleanQuery.path_prefix
      delete cleanQuery.timestamp
      delete cleanQuery.signature
      
      // Update URL without Shopify parameters
      router.replace({
        pathname,
        query: cleanQuery
      }, undefined, { shallow: true })
    }
  }, [router])

  return <Component {...pageProps} />
} 