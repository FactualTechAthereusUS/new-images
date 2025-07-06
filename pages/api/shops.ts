import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_BASE = 'https://api.printify.com/v1'
const TOKEN = process.env.NEXT_PUBLIC_PRINTIFY_TOKEN

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!TOKEN) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_PRINTIFY_TOKEN is not configured' })
  }

  try {
    const response = await axios.get(`${API_BASE}/shops.json`, {
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
    })
    
    res.status(200).json(response.data)
  } catch (error) {
    console.error('Failed to fetch shops:', error)
    res.status(500).json({ error: 'Failed to fetch shops' })
  }
} 