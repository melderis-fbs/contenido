'use client'

import { useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isThisWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post } from '@/lib/types'
import { CANALES, CANAL_COLORS, ESTADOS_COMPLETOS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  posts: Post[]
  currentWeekStart: Date
  isFiltered: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export default function WeekMetrics({
  posts,
  currentWeekStart,
  isFiltered,
  onPrevWeek,
  onNextWeek,
  onToday,
}: Props) {
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  const stats = useMemo(() => {
    const byCanal = Object.fromEntries(CANALES.map((c) => [c, 0])) as Record<string, number>
    let completas = 0

    for (const post of posts) {
      if (post.canal) byCanal[post.canal] = (byCanal[post.canal] || 0) + 1
      if (post.estado && ESTADOS_COMPLETOS.includes(post.estado)) completas++
    }

    return { byCanal, completas, total: posts.length }
  }, [posts])

  const weekLabel = `${format(currentWeekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
  const isCurrentWeek = isThisWeek(currentWeekStart, { weekStartsOn: 1 })
  const progress = stats.total > 0 ? Math.round((stats.completas / stats.total) * 100) : 0

  return (
    <div className="border-b px-4 sm:px-6 py-4" style={{ borderColor: '#e7e3d7' }}>
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors hover:bg-surface"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <span className="text-sm font-medium tabular-nums min-w-40 text-center">{weekLabel}</span>
          <button
            onClick={onNextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors hover:bg-surface"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
            aria-label="Semana siguiente"
          >
            ›
          </button>
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-surface"
              style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
            >
              Hoy
            </button>
          )}
        </div>

        {/* Canal counts */}
        <div className="flex items-center gap-3 flex-wrap">
          {CANALES.map((canal) => (
            <span
              key={canal}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: stats.byCanal[canal] > 0 ? '#282727' : '#9a877d' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: CANAL_COLORS[canal] }}
              />
              <span className="font-medium tabular-nums">{stats.byCanal[canal]}</span>
            </span>
          ))}

          <span
            className="w-px h-4 flex-shrink-0"
            style={{ background: '#e7e3d7' }}
            aria-hidden
          />

          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums">
              <span className="font-semibold">{stats.completas}</span>
              <span style={{ color: '#9a877d' }}>/{stats.total}</span>
            </span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#e7e3d7' }}>
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress === 100 ? '' : '',
                )}
                style={{
                  width: `${progress}%`,
                  background:
                    progress === 100
                      ? '#1D9E75'
                      : progress >= 60
                        ? '#378ADD'
                        : '#E8A23D',
                }}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: '#9a877d' }}>
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {isFiltered && (
        <p className="mt-2 text-xs" style={{ color: '#9a877d' }}>
          Mostrando resultados filtrados
        </p>
      )}
    </div>
  )
}
