import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle } from 'lightweight-charts'

interface PriceChartProps {
  data: [number, number][]
  days: number
}

export function PriceChart({ data, days }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const isDark = document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#334155' : '#e2e8f0',
      },
      timeScale: {
        borderColor: isDark ? '#334155' : '#e2e8f0',
        timeVisible: days <= 1,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000)
          if (days <= 1) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
          if (days <= 7) return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })
          return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
        },
      },
      crosshair: {
        vertLine: {
          style: LineStyle.Dashed,
          width: 1,
          color: isDark ? '#64748b' : '#94a3b8',
          labelBackgroundColor: '#0891b2',
        },
        horzLine: {
          style: LineStyle.Dashed,
          width: 1,
          color: isDark ? '#64748b' : '#94a3b8',
          labelBackgroundColor: '#0891b2',
        },
      },
    })

    const series = chart.addLineSeries({
      color: '#0891b2',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    const chartData = data.map(([timestamp, price]) => ({
      time: Math.floor(timestamp / 1000) as any,
      value: price,
    }))
    series.setData(chartData)
    chart.timeScale().fitContent()

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, days])

  return <div ref={containerRef} className='w-full' />
}
