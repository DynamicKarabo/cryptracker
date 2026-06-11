const BASE = '/api/cg'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limited')
    throw new Error(`CoinGecko API error: ${res.status}`)
  }
  return res.json()
}

export interface CoinMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number | null
  market_cap: number | null
  market_cap_rank: number | null
  price_change_percentage_24h: number | null
  sparkline_in_7d?: { price: number[] }
}

export interface CoinDetail {
  id: string
  symbol: string
  name: string
  image: { large: string; small: string; thumb: string }
  market_data: {
    current_price: Record<string, number>
    market_cap: Record<string, number>
    price_change_percentage_24h: number | null
    price_change_percentage_7d: number | null
    price_change_percentage_30d: number | null
    ath: Record<string, number>
    ath_date: Record<string, string>
  }
  description: { en: string }
  links: { homepage: string[]; twitter_screen_name: string }
  categories: string[]
}

export interface ChartData {
  prices: [number, number][]
}

export interface TrendingCoin {
  item: {
    id: string
    name: string
    symbol: string
    market_cap_rank: number | null
    thumb: string
    price_btc: number
    score: number
  }
}

export function getMarkets(page = 1, perPage = 50, currency = 'zar') {
  return fetchJson<CoinMarket[]>(
    `/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true`,
  )
}

export function getCoin(id: string) {
  return fetchJson<CoinDetail>(
    `/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`,
  )
}

export function getChart(id: string, days: number, currency = 'zar') {
  return fetchJson<ChartData>(`/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`)
}

export function getTrending() {
  return fetchJson<{ coins: TrendingCoin[] }>('/search/trending')
}

export function searchCoins(query: string) {
  return fetchJson<{ coins: { id: string; name: string; symbol: string; thumb: string; market_cap_rank: number | null }[] }>(
    `/search?query=${encodeURIComponent(query)}`,
  )
}

export function getMarketsByIds(ids: string[], currency = 'zar') {
  if (ids.length === 0) return Promise.resolve([])
  return fetchJson<CoinMarket[]>(
    `/coins/markets?vs_currency=${currency}&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false`,
  )
}
