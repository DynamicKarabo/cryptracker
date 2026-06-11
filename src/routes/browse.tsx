import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarkets } from '@/lib/api'
import { formatZar, formatPercent, cn } from '@/lib/utils'

export const Route = createFileRoute('/browse')({
  component: Browse,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
})

function Browse() {
  const { page } = useSearch({ from: '/browse' })
  const navigate = useNavigate({ from: '/browse' })
  const [searchQuery, setSearchQuery] = useState('')

  const { data: coins, isLoading } = useQuery({
    queryKey: ['markets', page],
    queryFn: () => getMarkets(page),
    placeholderData: (prev) => prev,
  })

  const setPage = (p: number) => {
    navigate({ search: { page: p } })
  }

  const filtered = searchQuery
    ? coins?.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : coins

  return (
    <div className='p-4 max-w-lg mx-auto'>
      <header className='flex items-center justify-between mb-4'>
        <Link to='/' className='text-sm text-cyan-600 hover:underline'>
          &larr; Home
        </Link>
        <h1 className='text-lg font-bold'>Browse</h1>
        <Link to='/watchlist' className='text-sm text-cyan-600 hover:underline'>
          Watchlist
        </Link>
      </header>

      <input
        type='search'
        placeholder='Search coins...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='w-full p-2 mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm'
      />

      {isLoading ? (
        <div className='space-y-2'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse' />
          ))}
        </div>
      ) : (
        <div className='space-y-1'>
          {filtered?.map((coin) => (
            <Link
              key={coin.id}
              to='/coin/$id'
              params={{ id: coin.id }}
              className='flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
            >
              <span className='text-xs text-slate-400 w-6 text-right'>
                {coin.market_cap_rank ?? '?'}
              </span>
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
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className='flex items-center justify-center gap-4 mt-6'>
        <button
          type='button'
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className='px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30'
        >
          Prev
        </button>
        <span className='text-sm text-slate-500'>Page {page}</span>
        <button
          type='button'
          onClick={() => setPage(page + 1)}
          disabled={page >= 10}
          className='px-3 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30'
        >
          Next
        </button>
      </div>
    </div>
  )
}
