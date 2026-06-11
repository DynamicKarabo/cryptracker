import { useState, useCallback } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCoin, getChart } from '@/lib/api'
import { formatZar, formatPercent, formatMarketCap } from '@/lib/utils'
import { PriceChart } from '@/components/PriceChart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star } from 'lucide-react'

export const Route = createFileRoute('/coin/$id')({
  component: CoinDetail,
})

const DAYS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
] as const

function getWatchlist(): string[] {
  try {
    const raw = localStorage.getItem('cryptracker:watchlist')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function toggleWatchlist(id: string): string[] {
  const current = getWatchlist()
  const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
  localStorage.setItem('cryptracker:watchlist', JSON.stringify(next))
  return next
}

function CoinDetail() {
  const { id } = useParams({ from: '/coin/$id' })
  const [days, setDays] = useState('7')
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [watched, setWatched] = useState(() => getWatchlist().includes(id))

  const { data: coin, isLoading } = useQuery({
    queryKey: ['coin', id],
    queryFn: () => getCoin(id),
    staleTime: 5 * 60_000,
  })

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['chart', id, days],
    queryFn: () => getChart(id, Number(days)),
    staleTime: 5 * 60_000,
  })

  const handleWatchToggle = useCallback(() => {
    toggleWatchlist(id)
    setWatched((prev) => !prev)
  }, [id])

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <Skeleton className='h-8 w-48 rounded' />
        <Skeleton className='h-64 rounded-lg' />
      </div>
    )
  }

  if (!coin) {
    return (
      <div className='p-4'>
        <p className='text-muted-foreground'>Coin not found</p>
      </div>
    )
  }

  const price = coin.market_data.current_price.zar
  const change24h = coin.market_data.price_change_percentage_24h
  const isUp = change24h !== null && change24h >= 0
  const ath = coin.market_data.ath.zar
  const athDate = coin.market_data.ath_date.zar

  return (
    <div className='space-y-4 pb-6'>
      {/* Header */}
      <div className='flex items-center gap-3 px-4 pt-4'>
        <img src={coin.image.large} alt='' className='size-10 rounded-full' />
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-base font-semibold'>{coin.name}</h1>
            <span className='text-xs text-muted-foreground uppercase'>{coin.symbol}</span>
          </div>
          <div className='flex items-center gap-2 mt-0.5'>
            <span className='text-3xl font-semibold tabular-nums'>{formatZar(price)}</span>
            <span className={`text-sm font-medium tabular-nums ${isUp ? 'text-gain' : 'text-loss'}`}>
              {change24h !== null ? (
                <>{isUp ? '▲' : '▼'} {formatPercent(change24h)}</>
              ) : '—'}
            </span>
          </div>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={handleWatchToggle}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Star className={`size-5 ${watched ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>

      {/* Chart */}
      <div className='-mx-4'>
        <div className='h-64'>
          {chartLoading ? (
            <div className='h-full bg-muted/30 mx-4 rounded-lg animate-pulse' />
          ) : chart ? (
            <PriceChart data={chart.prices} days={Number(days)} height={256} />
          ) : null}
        </div>

        <div className='px-4 mt-3'>
          <Tabs value={days} onValueChange={setDays}>
            <TabsList className='grid grid-cols-4 w-full'>
              {DAYS.map((opt) => (
                <TabsTrigger key={opt.days} value={String(opt.days)}>
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats */}
      <div className='px-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='grid grid-cols-2 gap-x-4'>
              <StatRow label='Market Cap' value={formatMarketCap(coin.market_data.market_cap.zar)} />
              <StatRow label='24h Change' value={formatPercent(change24h)} valueClass={isUp ? 'text-gain' : 'text-loss'} />
              <StatRow label='7d Change' value={formatPercent(coin.market_data.price_change_percentage_7d)} />
              <StatRow label='30d Change' value={formatPercent(coin.market_data.price_change_percentage_30d)} />
              <StatRow label='All-Time High' value={formatZar(ath)} />
              <StatRow label='ATH Date' value={athDate ? new Date(athDate).toLocaleDateString('en-ZA') : '—'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {coin.categories.length > 0 && (
        <div className='px-4 flex flex-wrap gap-1.5'>
          {coin.categories.slice(0, 5).map((cat) => (
            <Badge key={cat} variant='secondary'>
              {cat}
            </Badge>
          ))}
          {coin.categories.length > 5 && (
            <Badge variant='secondary'>+{coin.categories.length - 5}</Badge>
          )}
        </div>
      )}

      {/* Description */}
      {coin.description.en && (
        <div className='px-4'>
          <div
            className={`text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline prose-sm ${
              showFullDesc ? '' : 'line-clamp-4'
            }`}
            dangerouslySetInnerHTML={{
              __html: coin.description.en,
            }}
          />
          {coin.description.en.length > 300 && (
            <Button
              variant='ghost'
              size='sm'
              className='mt-1'
              onClick={() => setShowFullDesc(!showFullDesc)}
            >
              {showFullDesc ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className='flex items-center justify-between py-2.5 border-b border-border last:border-b-0'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
