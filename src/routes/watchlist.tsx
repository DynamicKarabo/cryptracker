import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarketsByIds } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Star, Search } from 'lucide-react'
import { CoinRow, CoinRowSkeleton } from '@/components/CoinRow'

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

  const handleRemove = (id: string) => {
    const next = toggleWatchlist(id)
    setIds(next)
  }

  // Empty state
  if (ids.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 px-4 text-center'>
        <Star className='size-10 text-muted-foreground mb-4' />
        <p className='text-base font-medium mb-1'>No watched coins</p>
        <p className='text-sm text-muted-foreground mb-6'>
          Tap the star on any coin to track it here
        </p>
        <Button asChild>
          <Link to='/browse'>
            <Search className='size-4 mr-2' />
            Browse coins
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='py-4'>
      {isLoading ? (
        <div className='divide-y divide-border'>
          {ids.map((id) => (
            <CoinRowSkeleton key={id} />
          ))}
        </div>
      ) : (
        <div className='divide-y divide-border'>
          {coins?.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              trailing={
                <Button
                  variant='ghost'
                  size='icon-xs'
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(coin.id)
                  }}
                  aria-label={`Remove ${coin.name} from watchlist`}
                  className='text-muted-foreground hover:text-loss shrink-0'
                >
                  <Star className='size-4 fill-primary text-primary' />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
