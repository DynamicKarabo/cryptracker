import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarkets, getTrending } from '@/lib/api'
import { formatZar, formatPercent } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { CoinCard, CoinCardSkeleton } from '@/components/CoinRow'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: markets, isLoading: marketsLoading } = useQuery({
    queryKey: ['markets', 1],
    queryFn: () => getMarkets(1, 10),
  })

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrending,
    staleTime: 5 * 60_000,
  })

  const gainers = markets?.filter((c) => (c.price_change_percentage_24h ?? 0) > 0) || []
  const losers = markets?.filter((c) => (c.price_change_percentage_24h ?? 0) < 0) || []

  return (
    <div className='space-y-6 py-4'>
      {/* Market Overview Card */}
      <div className='px-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <p className='text-xs text-muted-foreground'>Market Cap</p>
                <p className='text-sm font-semibold tabular-nums mt-0.5'>
                  {markets?.[0]?.market_cap
                    ? formatZar(markets[0].market_cap)
                    : '—'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>24h Volume</p>
                <p className='text-sm font-semibold tabular-nums mt-0.5'>
                  {markets?.[0]?.market_cap
                    ? formatZar(markets[0].market_cap * 0.05)
                    : '—'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>BTC Dominance</p>
                <p className='text-sm font-semibold tabular-nums mt-0.5'>52.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gainers */}
      <section>
        <div className='flex items-center justify-between px-4 mb-3'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='size-4 text-gain' />
            <h2 className='text-sm font-semibold'>Top Gainers</h2>
          </div>
          <Button variant='ghost' size='xs' asChild>
            <Link to='/browse'>
              See all
              <ArrowRight className='size-3 ml-1' />
            </Link>
          </Button>
        </div>
        <div className='flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scrollbar-none'>
          {marketsLoading
            ? [1, 2, 3].map((i) => <CoinCardSkeleton key={i} />)
            : gainers.slice(0, 6).map((coin) => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
        </div>
      </section>

      {/* Losers */}
      <section>
        <div className='flex items-center justify-between px-4 mb-3'>
          <div className='flex items-center gap-2'>
            <TrendingDown className='size-4 text-loss' />
            <h2 className='text-sm font-semibold'>Top Losers</h2>
          </div>
          <Button variant='ghost' size='xs' asChild>
            <Link to='/browse'>
              See all
              <ArrowRight className='size-3 ml-1' />
            </Link>
          </Button>
        </div>
        <div className='flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scrollbar-none'>
          {marketsLoading
            ? [1, 2, 3].map((i) => <CoinCardSkeleton key={i} />)
            : losers.slice(0, 6).map((coin) => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className='flex items-center justify-between px-4 mb-3'>
          <div className='flex items-center gap-2'>
            <Flame className='size-4 text-primary' />
            <h2 className='text-sm font-semibold'>Trending</h2>
          </div>
        </div>
        <div className='flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scrollbar-none'>
          {trendingLoading
            ? [1, 2, 3, 4, 5].map((i) => <CoinCardSkeleton key={i} />)
            : trending?.coins.slice(0, 8).map(({ item }) => (
                <Link
                  key={item.id}
                  to='/coin/$id'
                  params={{ id: item.id }}
                  className='w-36 shrink-0 snap-start rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors'
                >
                  <img src={item.thumb} alt='' className='size-8 rounded-full mb-2' loading='lazy' />
                  <p className='text-sm font-medium truncate'>{item.symbol.toUpperCase()}</p>
                  <p className='text-xs text-muted-foreground truncate'>{item.name}</p>
                  <p className='text-xs text-muted-foreground mt-2'>
                    #{item.market_cap_rank ?? '?'}
                  </p>
                </Link>
              ))}
        </div>
      </section>
    </div>
  )
}
