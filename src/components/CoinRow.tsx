import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatZar, formatPercent } from '@/lib/utils'

interface CoinRowProps {
  coin: {
    id: string
    name: string
    symbol: string
    image: string
    current_price: number | null
    price_change_percentage_24h: number | null
    market_cap_rank?: number | null
  }
  trailing?: React.ReactNode
  showRank?: boolean
}

export function CoinRow({ coin, trailing, showRank = true }: CoinRowProps) {
  const change = coin.price_change_percentage_24h
  const isUp = change !== null && change >= 0

  return (
    <Link
      to='/coin/$id'
      params={{ id: coin.id }}
      className='flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors'
    >
      {showRank && (
        <span className='w-5 text-xs tabular-nums text-muted-foreground text-right'>
          {coin.market_cap_rank ?? '?'}
        </span>
      )}
      <img
        src={coin.image}
        alt=''
        className='size-8 rounded-full shrink-0'
        loading='lazy'
      />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{coin.name}</p>
        <p className='text-xs uppercase text-muted-foreground'>{coin.symbol}</p>
      </div>
      <div className='text-right'>
        <p className='text-sm font-medium tabular-nums'>{formatZar(coin.current_price)}</p>
        <p className={cn('text-xs tabular-nums', isUp ? 'text-gain' : 'text-loss')}>
          {change !== null ? (
            <>{isUp ? '▲ ' : '▼ '}{formatPercent(change)}</>
          ) : (
            '—'
          )}
        </p>
      </div>
      {trailing}
    </Link>
  )
}

export function CoinRowSkeleton({ showRank = true }: { showRank?: boolean }) {
  return (
    <div className='flex items-center gap-3 px-4 py-3'>
      {showRank && (
        <Skeleton className='w-5 h-4 rounded' />
      )}
      <Skeleton className='size-8 rounded-full shrink-0' />
      <div className='min-w-0 flex-1 space-y-1'>
        <Skeleton className='h-4 w-24 rounded' />
        <Skeleton className='h-3 w-12 rounded' />
      </div>
      <div className='text-right space-y-1'>
        <Skeleton className='h-4 w-20 rounded' />
        <Skeleton className='h-3 w-14 rounded' />
      </div>
    </div>
  )
}

interface CoinCardProps {
  coin: {
    id: string
    name: string
    symbol: string
    image: string
    current_price: number | null
    price_change_percentage_24h: number | null
  }
}

export function CoinCard({ coin }: CoinCardProps) {
  const change = coin.price_change_percentage_24h
  const isUp = change !== null && change >= 0

  return (
    <Link
      to='/coin/$id'
      params={{ id: coin.id }}
      className='w-36 shrink-0 snap-start rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors'
    >
      <img src={coin.image} alt='' className='size-8 rounded-full mb-2' loading='lazy' />
      <p className='text-sm font-medium truncate'>{coin.symbol.toUpperCase()}</p>
      <p className='text-xs text-muted-foreground truncate'>{coin.name}</p>
      <p className='text-sm font-medium tabular-nums mt-1'>{formatZar(coin.current_price)}</p>
      <p className={cn('text-xs tabular-nums', isUp ? 'text-gain' : 'text-loss')}>
        {change !== null ? formatPercent(change) : '—'}
      </p>
    </Link>
  )
}

export function CoinCardSkeleton() {
  return (
    <div className='w-36 shrink-0 snap-start rounded-lg border border-border p-3'>
      <Skeleton className='size-8 rounded-full mb-2' />
      <Skeleton className='h-4 w-16 mb-1 rounded' />
      <Skeleton className='h-3 w-12 mb-2 rounded' />
      <Skeleton className='h-4 w-20 rounded' />
      <Skeleton className='h-3 w-14 rounded mt-1' />
    </div>
  )
}
