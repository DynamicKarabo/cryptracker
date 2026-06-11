import { useEffect, useState } from 'react'
import { Link, Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Star, Search, LayoutDashboard, ChevronLeft } from 'lucide-react'

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

function getTheme(): 'light' | 'dark' | 'system' {
  try {
    const stored = localStorage.getItem('cryptracker:theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'system'
}

function resolveTheme(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

function Layout() {
  const location = useLocation()
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(getTheme)

  useEffect(() => {
    const resolved = resolveTheme(themeMode)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    try {
      localStorage.setItem('cryptracker:theme', themeMode)
    } catch {}
  }, [themeMode])

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = resolveTheme('system')
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const resolved = resolveTheme(prev)
      return resolved === 'dark' ? 'light' : 'dark'
    })
  }

  const isDetailPage = location.pathname.startsWith('/coin/')
  const coinName = isDetailPage
    ? // We don't have access to the coin data here, but we can show a simple back button
      null
    : null

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/browse', icon: Search, label: 'Browse' },
    { path: '/watchlist', icon: Star, label: 'Watchlist' },
  ] as const

  return (
    <QueryClientProvider client={queryClient}>
      <div className='flex min-h-dvh flex-col bg-background'>
        {/* Top App Bar */}
        <header className='sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
          <div className='flex h-full items-center justify-between px-4 max-w-lg mx-auto'>
            <div className='flex items-center gap-2'>
              {isDetailPage ? (
                <Link to='/' className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'>
                  <ChevronLeft className='size-5' />
                  <span>Back</span>
                </Link>
              ) : (
                <h1 className='text-base font-semibold tracking-tight'>Cryptracker</h1>
              )}
            </div>
            <Button variant='ghost' size='icon-sm' onClick={toggleTheme} aria-label='Toggle theme'>
              {resolveTheme(themeMode) === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className='flex-1 max-w-lg mx-auto w-full'>
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className='fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]'>
          <div className='grid grid-cols-3 h-14 max-w-lg mx-auto'>
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className='flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors'
                  activeProps={{ className: 'text-primary' }}
                  inactiveProps={{ className: 'text-muted-foreground' }}
                >
                  <item.icon className={`size-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
      <TanStackRouterDevtools />
    </QueryClientProvider>
  )
}

export const Route = createRootRoute({
  component: Layout,
})
