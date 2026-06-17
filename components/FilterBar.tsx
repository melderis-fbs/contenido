'use client'

import { useState, useRef, useEffect } from 'react'
import type { WeekFilters, Canal, Estado, Pilar } from '@/lib/types'
import { CANALES, ESTADOS, PILARES, CANAL_COLORS, ESTADO_COLORS } from '@/lib/types'

interface Props {
  filters: WeekFilters
  onChange: (filters: WeekFilters) => void
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function IGIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-4.08-2.64V9.56a6.34 6.34 0 1 0 7.53 6.22V8.69a8.18 8.18 0 0 0 4.84 1.56V6.81a4.83 4.83 0 0 1-1.07-.12z"/>
    </svg>
  )
}

const CANAL_ICONS: Record<Canal, React.ReactNode> = {
  'IG Founders': <IGIcon />,
  'IG Vicky': <IGIcon />,
  LinkedIn: <LinkedInIcon />,
  TikTok: <TikTokIcon />,
}

const CANAL_SHORT: Record<Canal, string> = {
  'IG Founders': 'Founders',
  'IG Vicky': 'Vicky',
  LinkedIn: 'LinkedIn',
  TikTok: 'TikTok',
}

export default function FilterBar({ filters, onChange }: Props) {
  const [showPilarMenu, setShowPilarMenu] = useState(false)
  const pilarRef = useRef<HTMLDivElement>(null)

  const hasFilters =
    filters.canales.length > 0 ||
    filters.estados.length > 0 ||
    filters.pilares.length > 0 ||
    filters.search !== ''

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pilarRef.current && !pilarRef.current.contains(e.target as Node)) {
        setShowPilarMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div
      className="px-4 sm:px-6 py-2.5 flex items-center gap-2 border-b overflow-x-auto"
      style={{ borderColor: '#e7e3d7', scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {/* Search */}
      <div className="relative flex-shrink-0">
        <input
          type="search"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-7 pr-3 py-1 rounded-lg text-xs border bg-white focus:outline-none focus:ring-1 focus:ring-accent w-28"
          style={{ borderColor: '#e7e3d7' }}
        />
        <svg
          className="absolute left-2 top-1.5 w-3 h-3 pointer-events-none"
          style={{ color: '#9a877d' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>

      <span className="w-px h-4 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Canal filters */}
      {CANALES.map((canal) => {
        const active = filters.canales.includes(canal)
        return (
          <button
            key={canal}
            onClick={() => onChange({ ...filters, canales: toggle(filters.canales, canal) })}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex-shrink-0"
            style={{
              borderColor: active ? CANAL_COLORS[canal] : '#e7e3d7',
              background: active ? `${CANAL_COLORS[canal]}15` : 'transparent',
              color: active ? CANAL_COLORS[canal] : '#9a877d',
            }}
          >
            {CANAL_ICONS[canal]}
            {CANAL_SHORT[canal]}
          </button>
        )
      })}

      <span className="w-px h-4 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Estado filters */}
      {ESTADOS.map((estado) => {
        const active = filters.estados.includes(estado)
        return (
          <button
            key={estado}
            onClick={() => onChange({ ...filters, estados: toggle(filters.estados, estado) })}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex-shrink-0"
            style={{
              borderColor: active ? ESTADO_COLORS[estado] : '#e7e3d7',
              background: active ? `${ESTADO_COLORS[estado]}15` : 'transparent',
              color: active ? ESTADO_COLORS[estado] : '#9a877d',
            }}
          >
            {estado}
          </button>
        )
      })}

      <span className="w-px h-4 flex-shrink-0" style={{ background: '#e7e3d7' }} />

      {/* Pilar dropdown */}
      <div ref={pilarRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowPilarMenu((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
          style={{
            borderColor: filters.pilares.length > 0 ? '#c6b297' : '#e7e3d7',
            background: filters.pilares.length > 0 ? '#c6b29720' : 'transparent',
            color: filters.pilares.length > 0 ? '#282727' : '#9a877d',
          }}
        >
          Pilar
          {filters.pilares.length > 0 && (
            <span
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white"
              style={{ background: '#c6b297' }}
            >
              {filters.pilares.length}
            </span>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        {showPilarMenu && (
          <div
            className="absolute top-full mt-1 left-0 bg-white rounded-xl border shadow-lg py-1.5 z-50 min-w-48"
            style={{ borderColor: '#e7e3d7' }}
          >
            {PILARES.map((pilar) => {
              const active = filters.pilares.includes(pilar)
              return (
                <button
                  key={pilar}
                  onClick={() => onChange({ ...filters, pilares: toggle(filters.pilares, pilar) })}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface flex items-center gap-2 transition-colors"
                  style={{ color: active ? '#282727' : '#9a877d', fontWeight: active ? 600 : 400 }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: active ? '#c6b297' : '#e7e3d7' }}
                  />
                  {pilar}
                </button>
              )
            })}
            {filters.pilares.length > 0 && (
              <>
                <div className="my-1 mx-3" style={{ borderTop: '1px solid #e7e3d7' }} />
                <button
                  onClick={() => { onChange({ ...filters, pilares: [] }); setShowPilarMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-surface"
                  style={{ color: '#9a877d' }}
                >
                  Limpiar pilares
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Clear all */}
      {hasFilters && (
        <>
          <span className="w-px h-4 flex-shrink-0" style={{ background: '#e7e3d7' }} />
          <button
            onClick={() => onChange({ canales: [], estados: [], pilares: [], search: '' })}
            className="text-[11px] px-2 py-1 rounded transition-colors hover:bg-surface flex-shrink-0"
            style={{ color: '#9a877d' }}
          >
            Limpiar
          </button>
        </>
      )}
    </div>
  )
}
