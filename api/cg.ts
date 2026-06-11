import type { VercelRequest, VercelResponse } from '@vercel/node'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

const ALLOWED_PREFIXES = [
  '/coins/markets',
  '/coins/',
  '/search/trending',
  '/search?',
  '/coins/categories',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace('/api/cg', '') || ''

  // Allowlist: only permit CoinGecko API paths
  const allowed = ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix) || path.includes(prefix))
  if (!allowed) {
    return res.status(403).json({ error: 'Path not allowed' })
  }

  const url = `${COINGECKO_BASE}${path}`

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(process.env.COINGECKO_API_KEY
          ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }
          : {}),
      },
    })

    // Cache on Vercel edge — shared across users, reduces rate limit hits
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: `CoinGecko error: ${response.statusText}`,
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch from CoinGecko' })
  }
}
