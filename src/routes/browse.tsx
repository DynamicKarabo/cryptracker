import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMarkets } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CoinRow, CoinRowSkeleton } from '@/components/CoinRow'

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
    <div className='space-y-4 py-4'>
      <div className='px-4'>
        <Input
          type='search'
          placeholder='Search coins...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className='divide-y divide-border'>
          {[1, 2, 3, 4, 5].map((i) => (
            <CoinRowSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className='divide-y divide-border'>
          {filtered?.map((coin) => (
            <CoinRow key={coin.id} coin={coin} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className='flex items-center justify-center gap-4 px-4 pb-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className='size-4 mr-1' />
          Prev
        </Button>
        <span className='text-sm text-muted-foreground tabular-nums'>Page {page}</span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page + 1)}
          disabled={page >= 10}
        >
          Next
          <ChevronRight className='size-4 ml-1' />
        </Button>
      </div>
    </div>
  )
}
