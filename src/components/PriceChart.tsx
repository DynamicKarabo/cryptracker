import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle } from 'lightweight-charts'

interface PriceChartProps {
  data: [number, number][]
  days: number
  height?: number
}

export function PriceChart({ data, days, height = 280 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const isDark = document.documentElement.classList.contains('dark')
    const startPrice = data[0]?.[1] ?? 0
    const endPrice = data[data.length - 1]?.[1] ?? 0
    const lineColor = endPrice >= startPrice ? '#16a34a' : '#dc2626'

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
      },
      rightPriceScale: {
        borderColor: 'transparent',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: 'transparent',
        timeVisible: days <= 1,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000)
          if (days <= 1) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
          if (days <= 7) return d.toLocaleDateString('en-ZA', { weekday: 'short' })
          return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
        },
      },
      crosshair: {
        vertLine: {
          style: LineStyle.Dashed,
          width: 1,
          color: isDark ? '#475569' : '#94a3b8',
          labelBackgroundColor: lineColor,
        },
        horzLine: {
          style: LineStyle.Dashed,
          width: 1,
          color: isDark ? '#475569' : '#94a3b8',
          labelBackgroundColor: lineColor,
        },
      },
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addLineSeries({
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: isDark ? '#0f172a' : '#ffffff',
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
  }, [data, days, height])

  return <div ref={containerRef} className='w-full h-full' />
}
