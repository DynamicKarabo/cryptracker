import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarkets, getTrending } from '@/lib/api'
import { formatZar, formatPercent, cn } from '@/lib/utils'

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

  const topGainers = markets?.filter((c) => (c.price_change_percentage_24h ?? 0) > 0).slice(0, 3)
  const topLosers = markets?.filter((c) => (c.price_change_percentage_24h ?? 0) < 0).slice(0, 3)

  return (
    <div className='p-4 max-w-lg mx-auto space-y-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Cryptracker</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>ZAR crypto prices</p>
        </div>
        <div className='flex gap-2'>
          <Link to='/browse' className='text-sm text-cyan-600 hover:underline'>
            Browse
          </Link>
          <Link to='/watchlist' className='text-sm text-cyan-600 hover:underline'>
            Watchlist
          </Link>
        </div>
      </header>

      {/* Top Gainers */}
      <section>
        <h2 className='text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
          Top Gainers (24h)
        </h2>
        {marketsLoading ? (
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
            ))}
          </div>
        ) : (
          <div className='space-y-1'>
            {topGainers?.map((coin) => (
              <Link
                key={coin.id}
                to='/coin/$id'
                params={{ id: coin.id }}
                className='flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              >
                <img src={coin.image} alt='' className='w-8 h-8 rounded-full' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>{coin.name}</p>
                  <p className='text-xs text-slate-400 uppercase'>{coin.symbol}</p>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-sm'>{formatZar(coin.current_price)}</p>
                  <p className={cn('text-xs', (coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {formatPercent(coin.price_change_percentage_24h)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Losers */}
      <section>
        <h2 className='text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
          Top Losers (24h)
        </h2>
        {marketsLoading ? (
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
            ))}
          </div>
        ) : (
          <div className='space-y-1'>
            {topLosers?.map((coin) => (
              <Link
                key={coin.id}
                to='/coin/$id'
                params={{ id: coin.id }}
                className='flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              >
                <img src={coin.image} alt='' className='w-8 h-8 rounded-full' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>{coin.name}</p>
                  <p className='text-xs text-slate-400 uppercase'>{coin.symbol}</p>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-sm'>{formatZar(coin.current_price)}</p>
                  <p className={cn('text-xs', (coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {formatPercent(coin.price_change_percentage_24h)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <h2 className='text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
          Trending
        </h2>
        {trendingLoading ? (
          <div className='space-y-2'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
            ))}
          </div>
        ) : (
          <div className='space-y-1'>
            {trending?.coins.slice(0, 7).map(({ item }) => (
              <Link
                key={item.id}
                to='/coin/$id'
                params={{ id: item.id }}
                className='flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              >
                <img src={item.thumb} alt='' className='w-6 h-6 rounded-full' />
                <span className='text-sm font-medium flex-1 truncate'>{item.name}</span>
                <span className='text-xs text-slate-400 uppercase'>{item.symbol}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
