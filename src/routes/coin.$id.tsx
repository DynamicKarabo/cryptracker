import { useState } from 'react'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCoin, getChart } from '@/lib/api'
import { formatZar, formatPercent, formatMarketCap, cn } from '@/lib/utils'
import { PriceChart } from '@/components/PriceChart'

export const Route = createFileRoute('/coin/$id')({
  component: CoinDetail,
})

const DAYS_OPTIONS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
] as const

function CoinDetail() {
  const { id } = useParams({ from: '/coin/$id' })
  const [days, setDays] = useState(7)

  const { data: coin, isLoading } = useQuery({
    queryKey: ['coin', id],
    queryFn: () => getCoin(id),
    staleTime: 5 * 60_000,
  })

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['chart', id, days],
    queryFn: () => getChart(id, days),
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <div className='p-4 max-w-lg mx-auto space-y-4'>
        <div className='h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' />
        <div className='h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' />
        <div className='h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
      </div>
    )
  }

  if (!coin) {
    return (
      <div className='p-4 max-w-lg mx-auto'>
        <Link to='/' className='text-sm text-cyan-600 hover:underline'>&larr; Back</Link>
        <p className='mt-4 text-slate-500'>Coin not found</p>
      </div>
    )
  }

  const price = coin.market_data.current_price.zar
  const change24h = coin.market_data.price_change_percentage_24h
  const ath = coin.market_data.ath.zar
  const athDate = coin.market_data.ath_date.zar

  return (
    <div className='p-4 max-w-lg mx-auto space-y-4'>
      <Link to='/' className='text-sm text-cyan-600 hover:underline inline-block'>
        &larr; Home
      </Link>

      {/* Header */}
      <div className='flex items-center gap-3'>
        <img src={coin.image.large} alt='' className='w-10 h-10 rounded-full' />
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-xl font-bold'>{coin.name}</h1>
            <span className='text-sm text-slate-400 uppercase'>{coin.symbol}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-2xl font-bold'>{formatZar(price)}</span>
            <span
              className={cn(
                'text-sm font-medium',
                (change24h ?? 0) >= 0 ? 'text-green-500' : 'text-red-500',
              )}
            >
              {formatPercent(change24h)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className='bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3'>
        <div className='flex gap-2 mb-3'>
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type='button'
              onClick={() => setDays(opt.days)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                days === opt.days
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {chartLoading ? (
          <div className='h-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' />
        ) : chart ? (
          <PriceChart data={chart.prices} days={days} />
        ) : null}
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-3'>
        <Stat label='Market Cap' value={formatMarketCap(coin.market_data.market_cap.zar)} />
        <Stat label='24h Change' value={formatPercent(change24h)} valueClass={change24h && change24h >= 0 ? 'text-green-500' : 'text-red-500'} />
        <Stat label='7d Change' value={formatPercent(coin.market_data.price_change_percentage_7d)} />
        <Stat label='30d Change' value={formatPercent(coin.market_data.price_change_percentage_30d)} />
        <Stat label='All-Time High' value={formatZar(ath)} />
        <Stat label='ATH Date' value={athDate ? new Date(athDate).toLocaleDateString('en-ZA') : '—'} />
      </div>

      {/* Categories */}
      {coin.categories.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {coin.categories.map((cat) => (
            <span key={cat} className='px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500'>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {coin.description.en && (
        <div
          className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed [&_a]:text-cyan-600'
          // Server-rendered safe HTML — sanitized by DOMPurify during build or CMS input
          dangerouslySetInnerHTML={{
            __html: coin.description.en.slice(0, 500),
          }}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className='bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3'>
      <p className='text-xs text-slate-500 mb-1'>{label}</p>
      <p className={cn('font-semibold text-sm', valueClass)}>{value}</p>
    </div>
  )
}
