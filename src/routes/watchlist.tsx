import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarketsByIds } from '@/lib/api'
import { formatZar, formatPercent, cn } from '@/lib/utils'

export const Route = createFileRoute('/watchlist')({
  component: Watchlist,
})

function getWatchlist(): string[] {
  try {
    const raw = localStorage.getItem('cryptracker:watchlist')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function toggleWatchlist(id: string) {
  const current = getWatchlist()
  const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
  localStorage.setItem('cryptracker:watchlist', JSON.stringify(next))
  return next
}

function Watchlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(getWatchlist())
  }, [])

  const { data: coins, isLoading } = useQuery({
    queryKey: ['watchlist', ids],
    queryFn: () => getMarketsByIds(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  })

  const handleToggle = (id: string) => {
    const next = toggleWatchlist(id)
    setIds(next)
  }

  return (
    <div className='p-4 max-w-lg mx-auto'>
      <header className='flex items-center justify-between mb-4'>
        <Link to='/' className='text-sm text-cyan-600 hover:underline'>
          &larr; Home
        </Link>
        <h1 className='text-lg font-bold'>Watchlist</h1>
        <Link to='/browse' className='text-sm text-cyan-600 hover:underline'>
          Browse
        </Link>
      </header>

      {ids.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-slate-500'>No watched coins</p>
          <Link to='/browse' className='text-sm text-cyan-600 hover:underline mt-2 inline-block'>
            Browse coins to add some
          </Link>
        </div>
      ) : isLoading ? (
        <div className='space-y-2'>
          {ids.map((id) => (
            <div key={id} className='h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
          ))}
        </div>
      ) : (
        <div className='space-y-1'>
          {coins?.map((coin) => (
            <div className='flex items-center gap-3 p-2 rounded-lg group'>
              <Link
                key={coin.id}
                to='/coin/$id'
                params={{ id: coin.id }}
                className='flex items-center gap-3 flex-1 min-w-0'
              >
                <img src={coin.image} alt='' className='w-8 h-8 rounded-full' />
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>{coin.name}</p>
                  <p className='text-xs text-slate-400 uppercase'>{coin.symbol}</p>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-sm'>{formatZar(coin.current_price)}</p>
                  <p
                    className={cn(
                      'text-xs',
                      (coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-green-500' : 'text-red-500',
                    )}
                  >
                    {formatPercent(coin.price_change_percentage_24h)}
                  </p>
                </div>
              </Link>
              <button
                type='button'
                onClick={() => handleToggle(coin.id)}
                className='text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
