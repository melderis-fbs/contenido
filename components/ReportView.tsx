'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post } from '@/lib/types'
import { CANAL_COLORS, ESTADO_COLORS } from '@/lib/types'

interface Props {
  posts: Post[]
  onEditPost: (post: Post) => void
}

export default function ReportView({ posts, onEditPost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [slackStatus, setSlackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [slackError, setSlackError] = useState<string | null>(null)
  const [lastReport, setLastReport] = useState<string | null>(null)

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es })
  const monthKey = format(currentMonth, 'yyyy-MM')

  const monthPosts = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return posts
      .filter((p) => {
        if (p.estado !== 'Publicado' || !p.fecha) return false
        try {
          return isWithinInterval(new Date(p.fecha), { start, end })
        } catch {
          return false
        }
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  }, [posts, currentMonth])

  // Aggregate totals
  const totals = useMemo(() => {
    return monthPosts.reduce(
      (acc, p) => ({
        alcance: acc.alcance + (p.alcance ?? 0),
        guardados: acc.guardados + (p.guardados ?? 0),
        compartidos: acc.compartidos + (p.compartidos ?? 0),
        comentarios: acc.comentarios + (p.comentarios ?? 0),
        leadMagnets: acc.leadMagnets + (p.leadMagnets ?? 0),
      }),
      { alcance: 0, guardados: 0, compartidos: 0, comentarios: 0, leadMagnets: 0 },
    )
  }, [monthPosts])

  const hasAnyMetrics = monthPosts.some(
    (p) => p.alcance !== null || p.guardados !== null || p.leadMagnets !== null,
  )

  async function handleGenerate(sendToSlack = false) {
    setGenerating(true)
    setReportError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthKey, sendToSlack }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report)
      setLastReport(data.report)
      if (sendToSlack) {
        if (data.slackSent) {
          setSlackStatus('sent')
        } else {
          setSlackStatus('error')
          setSlackError(data.slackError ?? 'Error desconocido')
        }
      }
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Error generando el reporte')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSendSlack() {
    if (!lastReport) return
    setSlackStatus('sending')
    setSlackError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthKey, sendToSlack: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.slackSent) {
        setSlackStatus('sent')
      } else {
        setSlackStatus('error')
        setSlackError(data.slackError ?? 'Error desconocido')
      }
    } catch (e) {
      setSlackStatus('error')
      setSlackError(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 pb-16 max-w-5xl mx-auto space-y-8">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCurrentMonth((m) => subMonths(m, 1)); setReport(null) }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface transition-colors"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
          >
            ‹
          </button>
          <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
          <button
            onClick={() => { setCurrentMonth((m) => addMonths(m, 1)); setReport(null) }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface transition-colors"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
          >
            ›
          </button>
        </div>
        <span className="text-sm tabular-nums" style={{ color: '#9a877d' }}>
          {monthPosts.length} publicados
        </span>
      </div>

      {/* Totals row */}
      {monthPosts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Alcance', value: totals.alcance, star: false },
            { label: 'Comentarios', value: totals.comentarios, star: false },
            { label: 'Guardados', value: totals.guardados, star: true },
            { label: 'Compartidos', value: totals.compartidos, star: true },
            { label: 'Lead magnets', value: totals.leadMagnets, star: true },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{
                background: m.star ? '#c6b29712' : '#f3f1ea',
                border: `1px solid ${m.star ? '#c6b29740' : '#e7e3d7'}`,
              }}
            >
              <span className="text-[11px]" style={{ color: '#9a877d' }}>
                {m.label} {m.star && '⭐'}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {m.value > 0 ? m.value.toLocaleString('es-AR') : <span style={{ color: '#9a877d' }}>—</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Posts table */}
      {monthPosts.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-2"
          style={{ borderColor: '#e7e3d7' }}
        >
          <p className="text-sm" style={{ color: '#9a877d' }}>
            No hay posts marcados como <strong>Publicado</strong> en {monthLabel}.
          </p>
          <p className="text-xs" style={{ color: '#9a877d' }}>
            Cambiá el estado a "Publicado" en el editor de cada post.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9a877d' }}>
            Posts publicados
          </h3>
          {!hasAnyMetrics && (
            <div
              className="rounded-lg px-3 py-2 text-xs mb-3"
              style={{ background: '#E8A23D15', color: '#9a877d', border: '1px solid #E8A23D30' }}
            >
              Sin métricas cargadas. Abrí cada post y completá los números de rendimiento para que el reporte sea más preciso.
            </div>
          )}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e7e3d7' }}>
            <div
              className="grid text-[11px] font-semibold uppercase tracking-wide px-3 py-2"
              style={{
                gridTemplateColumns: '80px 1fr 70px 60px 60px 60px 60px',
                background: '#f3f1ea',
                color: '#9a877d',
                borderBottom: '1px solid #e7e3d7',
              }}
            >
              <span>Fecha</span>
              <span>Título</span>
              <span className="text-right">Alcance</span>
              <span className="text-right">Guard.</span>
              <span className="text-right">Comp.</span>
              <span className="text-right">Coment.</span>
              <span className="text-right">Leads⭐</span>
            </div>
            {monthPosts.map((post, i) => (
              <button
                key={post.id}
                onClick={() => onEditPost(post)}
                className="w-full grid text-left text-xs px-3 py-2.5 transition-colors hover:bg-surface"
                style={{
                  gridTemplateColumns: '80px 1fr 70px 60px 60px 60px 60px',
                  borderTop: i > 0 ? '1px solid #e7e3d7' : undefined,
                }}
              >
                <span style={{ color: '#9a877d' }}>
                  {post.fecha ? format(new Date(post.fecha), 'd MMM', { locale: es }) : '—'}
                </span>
                <span className="truncate pr-2 flex items-center gap-1.5">
                  {post.canal && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: CANAL_COLORS[post.canal] }}
                    />
                  )}
                  {post.titulo || '—'}
                </span>
                <MetricCell value={post.alcance} />
                <MetricCell value={post.guardados} highlight />
                <MetricCell value={post.compartidos} highlight />
                <MetricCell value={post.comentarios} />
                <MetricCell value={post.leadMagnets} highlight />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report generator */}
      {monthPosts.length > 0 && (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between pb-4"
            style={{ borderBottom: '1px solid #e7e3d7' }}
          >
            <div>
              <h3 className="text-sm font-semibold">Reporte mensual</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9a877d' }}>
                Claude analiza qué funcionó y qué no, y da una recomendación accionable.
              </p>
            </div>
            <button
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: '#282727' }}
            >
              {generating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>✦ Generar reporte</>
              )}
            </button>
          </div>

          {reportError && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#ef444415', color: '#ef4444' }}>
              {reportError}
            </div>
          )}

          {report && (
            <div className="space-y-4">
              <div
                className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: '#f3f1ea', border: '1px solid #e7e3d7', color: '#282727' }}
              >
                {report}
              </div>

              {/* Slack send */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleSendSlack}
                  disabled={slackStatus === 'sending' || slackStatus === 'sent'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50"
                  style={{
                    borderColor: slackStatus === 'sent' ? '#1D9E75' : '#e7e3d7',
                    color: slackStatus === 'sent' ? '#1D9E75' : '#282727',
                    background: slackStatus === 'sent' ? '#1D9E7515' : 'transparent',
                  }}
                >
                  {slackStatus === 'sending' ? 'Enviando...' : slackStatus === 'sent' ? '✓ Enviado a Slack' : '↗ Enviar a Slack'}
                </button>
                {slackStatus === 'error' && slackError && (
                  <span className="text-xs" style={{ color: '#ef4444' }}>{slackError}</span>
                )}
                {!process.env.NEXT_PUBLIC_SLACK_CONFIGURED && slackStatus === 'idle' && (
                  <span className="text-xs" style={{ color: '#9a877d' }}>
                    Configurá SLACK_BOT_TOKEN y SLACK_CHANNEL_ID en tus env vars para enviar directo a Slack.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCell({ value, highlight = false }: { value: number | null; highlight?: boolean }) {
  return (
    <span
      className="text-right tabular-nums"
      style={{ color: value !== null && highlight ? '#282727' : '#9a877d' }}
    >
      {value !== null ? value.toLocaleString('es-AR') : '—'}
    </span>
  )
}
