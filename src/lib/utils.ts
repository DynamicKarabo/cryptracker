export function formatZar(price: number | null): string {
  if (price === null) return '—'
  if (price < 0.01) {
    return `R${price.toFixed(8)}`
  }
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatPercent(pct: number | null): string {
  if (pct === null) return '—'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

export function formatMarketCap(cap: number | null): string {
  if (cap === null) return '—'
  if (cap >= 1e12) return `R${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9) return `R${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e6) return `R${(cap / 1e6).toFixed(2)}M`
  return formatZar(cap)
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatChartDate(timestamp: number, days: number): string {
  const date = new Date(timestamp)
  if (days <= 1) return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  if (days <= 7) return date.toLocaleDateString('en-ZA', { weekday: 'short', hour: '2-digit' })
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
