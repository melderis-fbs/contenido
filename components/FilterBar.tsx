'use client'

import type { WeekFilters, Canal, Estado, Pilar } from '@/lib/types'
import { CANALES, ESTADOS, PILARES, CANAL_COLORS, ESTADO_COLORS } from '@/lib/types'

interface Props {
  filters: WeekFilters
  onChange: (filters: WeekFilters) => void
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

export default function FilterBar({ filters, onChange }: Props) {
  const hasFilters =
    filters.canales.length > 0 ||
    filters.estados.length > 0 ||
    filters.pilares.length > 0 ||
    filters.search !== ''

  return (
    <div
      className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap border-b overflow-x-auto"
      style={{ borderColor: '#e7e3d7' }}
    >
      {/* Search */}
      <div className="relative flex-shrink-0">
        <input
          type="search"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-7 pr-3 py-1.5 rounded-lg text-sm border bg-cream focus:outline-none focus:ring-1 focus:ring-accent w-36"
          style={{ borderColor: '#e7e3d7' }}
        />
        <svg
          className="absolute left-2 top-2 w-3.5 h-3.5 pointer-events-none"
          style={{ color: '#9a877d' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>

      <span className="w-px h-5 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Canal filters */}
      {CANALES.map((canal) => (
        <button
          key={canal}
          onClick={() => onChange({ ...filters, canales: toggle(filters.canales, canal) })}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={{
            borderColor: filters.canales.includes(canal) ? CANAL_COLORS[canal] : '#e7e3d7',
            background: filters.canales.includes(canal) ? `${CANAL_COLORS[canal]}15` : 'transparent',
            color: filters.canales.includes(canal) ? CANAL_COLORS[canal] : '#9a877d',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: CANAL_COLORS[canal] }}
          />
          {canal}
        </button>
      ))}

      <span className="w-px h-5 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Estado filters */}
      {ESTADOS.map((estado) => (
        <button
          key={estado}
          onClick={() => onChange({ ...filters, estados: toggle(filters.estados, estado) })}
          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={{
            borderColor: filters.estados.includes(estado) ? ESTADO_COLORS[estado] : '#e7e3d7',
            background: filters.estados.includes(estado)
              ? `${ESTADO_COLORS[estado]}15`
              : 'transparent',
            color: filters.estados.includes(estado) ? ESTADO_COLORS[estado] : '#9a877d',
          }}
        >
          {estado}
        </button>
      ))}

      <span className="w-px h-5 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Pilar filters */}
      {PILARES.map((pilar) => (
        <button
          key={pilar}
          onClick={() => onChange({ ...filters, pilares: toggle(filters.pilares, pilar) })}
          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={{
            borderColor: filters.pilares.includes(pilar) ? '#c6b297' : '#e7e3d7',
            background: filters.pilares.includes(pilar) ? '#c6b29720' : 'transparent',
            color: filters.pilares.includes(pilar) ? '#282727' : '#9a877d',
          }}
        >
          {pilar}
        </button>
      ))}

      {/* Clear */}
      {hasFilters && (
        <>
          <span className="w-px h-5 flex-shrink-0" style={{ background: '#e7e3d7' }} />
          <button
            onClick={() =>
              onChange({ canales: [], estados: [], pilares: [], search: '' })
            }
            className="text-xs px-2 py-1 rounded transition-colors hover:bg-surface"
            style={{ color: '#9a877d' }}
          >
            Limpiar
          </button>
        </>
      )}
    </div>
  )
}
