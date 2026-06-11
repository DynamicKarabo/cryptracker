import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Response && error.status === 429) return false
        return failureCount < 3
      },
    },
  },
})

function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className='min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </QueryClientProvider>
  )
}

export const Route = createRootRoute({
  component: Layout,
})
