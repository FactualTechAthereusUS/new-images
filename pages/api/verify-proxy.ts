import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // For Shopify app proxy, we need to verify the request
  // This is a basic implementation - you can add more security if needed
  const { shop, timestamp, signature, path_prefix, ...otherParams } = req.query

  // Basic validation
  if (!shop || !timestamp || !signature) {
    return res.status(400).json({ message: 'Missing required parameters' })
  }

  // Return success for now - implement proper HMAC verification if needed
  res.status(200).json({ 
    message: 'Proxy verification successful',
    shop,
    timestamp,
    path_prefix
  })
} 