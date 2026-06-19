'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post } from '@/lib/types'
import { CANAL_COLORS, ESTADOS_COMPLETOS } from '@/lib/types'
import { parsePostDate } from '@/lib/utils'

interface Props {
  posts: Post[]
  onEditPost: (post: Post) => void
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function buildCSV(rows: string[][], headers: string[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [
    headers.join(','),
    ...rows.map((r) => r.map((v) => (v.includes(',') || v.includes('"') || v.includes('\n') ? escape(v) : v)).join(',')),
  ].join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportWeeklyCSV(posts: Post[], weekLabel: string) {
  const headers = ['Fecha', 'Estado', 'Canal', 'Formato', 'Pilar', 'Título', 'Link publicado']
  const rows = posts.map((p) => [
    p.fecha ? format(parsePostDate(p.fecha), 'dd/MM/yyyy') : '',
    p.estado ?? '',
    p.canal ?? '',
    p.formato ?? '',
    p.pilar ?? '',
    p.titulo || '',
    p.linkPublicado ?? '',
  ])
  downloadCSV(buildCSV(rows, headers), `founders-semana-${weekLabel}.csv`)
}

function exportMonthlyCSV(posts: Post[], monthKey: string) {
  const headers = ['Fecha', 'Canal', 'Formato', 'Pilar', 'Título', 'Alcance', 'Guardados', 'Compartidos', 'Comentarios', 'Lead magnets', 'Link publicado']
  const rows = posts.map((p) => [
    p.fecha ? format(parsePostDate(p.fecha), 'dd/MM/yyyy') : '',
    p.canal ?? '',
    p.formato ?? '',
    p.pilar ?? '',
    p.titulo || '',
    String(p.alcance ?? ''),
    String(p.guardados ?? ''),
    String(p.compartidos ?? ''),
    String(p.comentarios ?? ''),
    String(p.leadMagnets ?? ''),
    p.linkPublicado ?? '',
  ])
  downloadCSV(buildCSV(rows, headers), `founders-posts-${monthKey}.csv`)
}

// ─── Prompt templates ─────────────────────────────────────────────────────────

const WEEKLY_PROMPT = (weekLabel: string) =>
  `Te adjunto el archivo founders-semana-${weekLabel}.csv con el contenido planificado y publicado esta semana en Founders / Vicky Becci.

Hacé un vistazo rápido de la semana:

1. ¿Qué se publicó? Listalo brevemente por canal.
2. ¿Hay diversidad de formatos y pilares, o estamos repitiendo?
3. ¿Qué viene la próxima semana? ¿Hay algo incompleto o que merezca revisión antes de publicar?
4. Una sugerencia concreta para ajustar.

Breve y directo. Sin intro corporativa.`

const MONTHLY_PROMPT = (monthLabel: string) =>
  `Te adjunto dos archivos:
1. founders-posts-${format(new Date(monthLabel + '-01'), 'yyyy-MM')}.csv — posts publicados en ${monthLabel} con métricas (si están cargadas)
2. El CSV de métricas de Meta (si lo tenés, cruzalo por fecha/título)

Respondé estas 4 preguntas con datos concretos:

1. ¿Cuáles 3 piezas rindieron MEJOR y qué tienen en común?
2. ¿Cuáles 3 rindieron PEOR y qué tienen en común?
3. ¿Qué formato tracciona más en cada red?
4. ¿Qué contenido generó más lead magnets / consultas (no solo likes)?

Cerrá con UNA recomendación accionable: "el mes que viene, más de X y menos de Y porque..."

Las métricas que más importan: guardados, compartidos y leads — no los likes.`

const PROJECT_INSTRUCTIONS = `Sos la analista de contenido de Founders / Vicky Becci.

CONTEXTO DE MARCA:
Founders es una marca de mentoría para coaches y consultores en Argentina. La cara visible es Vicky Becci. Tiene dos canales principales en Instagram: @founders (contenido de marca, casos, transformaciones) y @vickybecci (contenido personal, historia, procesos). También publica en LinkedIn y TikTok.

PILARES DE CONTENIDO:
- Claridad y decisión
- Mentiras que te contás
- Miedo / prudencia
- Posicionamiento
- Tu historia
- Evolución

FORMATOS USADOS: Reel, Carrusel, Imagen/Post, Video, Texto, Story, Recorte, Testimonio

FRAMEWORK DE MÉTRICAS:
Las métricas que más importan son GUARDADOS, COMPARTIDOS y LEAD MAGNETS/DMs generados.
El alcance y los likes son secundarios.
Un post que genera 5 DMs vale más que uno con 1000 likes.

ANÁLISIS MENSUAL — respondés 4 preguntas:
1. ¿Cuáles 3 piezas rindieron MEJOR y qué tienen en común?
2. ¿Cuáles 3 rindieron PEOR y qué tienen en común?
3. ¿Qué formato tracciona más en cada red?
4. ¿Qué contenido generó más lead magnets / consultas?
→ Cerrás con UNA recomendación accionable: "el mes que viene, más de X y menos de Y porque..."

VISTAZO SEMANAL — cuando te pasan el plan de la semana:
1. ¿Qué se publicó? Lista breve por canal.
2. ¿Hay diversidad de formatos y pilares?
3. ¿Qué viene la próxima semana? ¿Hay algo flojo o incompleto?
4. Una sugerencia concreta.

TONO DE RESPUESTA:
- Español rioplatense ("vos", "hacés", "te va a")
- Directo, sin rodeos, sin intro corporativa
- Sentence case, sin gritar
- Bullets y números concretos cuando hay datos
- Sin frases como "en el mundo actual" o "es importante destacar"

ARCHIVOS QUE TE VAN A PASAR:
- founders-semana-YYYY-MM-DD.csv: plan semanal (con estado, canal, formato, pilar, título)
- founders-posts-YYYY-MM.csv: posts publicados del mes (con métricas si están cargadas)
- CSV de Meta Business Suite: métricas de alcance, guardados, compartidos, comentarios (cruzarlo con el de posts por fecha o título)`

// ─── Analytics helpers ────────────────────────────────────────────────────────

function engagementScore(p: Post): number {
  return (p.leadMagnets ?? 0) * 3 + (p.guardados ?? 0) * 2 + (p.compartidos ?? 0) * 2 + (p.comentarios ?? 0) + (p.alcance ?? 0) * 0.01
}

function hasAnyMetrics(p: Post): boolean {
  return [p.alcance, p.guardados, p.compartidos, p.comentarios, p.leadMagnets].some(
    (v) => v !== null && v !== undefined,
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

type Mode = 'semana' | 'mes'

export default function ReportView({ posts, onEditPost }: Props) {
  const [mode, setMode] = useState<Mode>('semana')
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [slackStatus, setSlackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [slackError, setSlackError] = useState<string | null>(null)

  const [showWeeklyPrompt, setShowWeeklyPrompt] = useState(false)
  const [showMonthlyPrompt, setShowMonthlyPrompt] = useState(false)
  const [showProjectInstructions, setShowProjectInstructions] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // ── Derived data ──

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const weekLabel = format(currentWeekStart, 'yyyy-MM-dd')
  const weekDisplayLabel = `${format(currentWeekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es })
  const monthKey = format(currentMonth, 'yyyy-MM')

  const weekPosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (!p.fecha) return false
        try {
          return isWithinInterval(parsePostDate(p.fecha), { start: currentWeekStart, end: weekEnd })
        } catch { return false }
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  }, [posts, currentWeekStart, weekEnd])

  const monthPosts = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return posts
      .filter((p) => {
        if (p.estado !== 'Publicado' || !p.fecha) return false
        try {
          return isWithinInterval(parsePostDate(p.fecha), { start, end })
        } catch { return false }
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  }, [posts, currentMonth])

  const monthTotals = useMemo(() => monthPosts.reduce(
    (acc, p) => ({
      alcance: acc.alcance + (p.alcance ?? 0),
      guardados: acc.guardados + (p.guardados ?? 0),
      compartidos: acc.compartidos + (p.compartidos ?? 0),
      comentarios: acc.comentarios + (p.comentarios ?? 0),
      leadMagnets: acc.leadMagnets + (p.leadMagnets ?? 0),
    }),
    { alcance: 0, guardados: 0, compartidos: 0, comentarios: 0, leadMagnets: 0 },
  ), [monthPosts])

  const postsWithMetrics = useMemo(() => monthPosts.filter(hasAnyMetrics), [monthPosts])

  const topPosts = useMemo(
    () => [...postsWithMetrics].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 3),
    [postsWithMetrics],
  )

  const bottomPosts = useMemo(
    () => [...postsWithMetrics].sort((a, b) => engagementScore(a) - engagementScore(b)).slice(0, 3),
    [postsWithMetrics],
  )

  const formatBreakdown = useMemo(() => {
    const map: Record<string, { count: number; guardados: number; compartidos: number; leads: number }> = {}
    for (const p of monthPosts) {
      const fmt = p.formato ?? '—'
      if (!map[fmt]) map[fmt] = { count: 0, guardados: 0, compartidos: 0, leads: 0 }
      map[fmt].count++
      map[fmt].guardados += p.guardados ?? 0
      map[fmt].compartidos += p.compartidos ?? 0
      map[fmt].leads += p.leadMagnets ?? 0
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count)
  }, [monthPosts])

  const weekPublished = weekPosts.filter((p) => p.estado === 'Publicado')
  const weekPlanned = weekPosts.filter((p) => p.estado !== 'Publicado')

  // ── Handlers ──

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    setReportError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthKey, sendToSlack: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data.report)
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Error generando el reporte')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSendSlack() {
    setSlackStatus('sending')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthKey, sendToSlack: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSlackStatus(data.slackSent ? 'sent' : 'error')
      if (!data.slackSent) setSlackError(data.slackError)
    } catch (e) {
      setSlackStatus('error')
      setSlackError(e instanceof Error ? e.message : 'Error')
    }
  }

  // ── Render ──

  return (
    <div className="px-4 sm:px-6 py-6 pb-16 max-w-5xl mx-auto space-y-8">

      {/* ── Proyecto Claude setup (always visible) ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#c6b29760' }}>
        <button
          onClick={() => setShowProjectInstructions((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface"
          style={{ background: '#c6b29712' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">✦</span>
            <div className="text-left">
              <p className="text-sm font-semibold">Configurar proyecto en Claude</p>
              <p className="text-xs" style={{ color: '#9a877d' }}>
                Hacelo una vez. Dale a Claude el contexto de Founders para que siempre sepa de qué hablás.
              </p>
            </div>
          </div>
          <span className="text-xs" style={{ color: '#9a877d' }}>
            {showProjectInstructions ? 'Ocultar ↑' : 'Ver instrucciones ↓'}
          </span>
        </button>

        {showProjectInstructions && (
          <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid #e7e3d7' }}>
            <ol className="space-y-2 text-sm" style={{ color: '#282727' }}>
              <li>1. Ir a <strong>claude.ai</strong> → <strong>Projects</strong> → <strong>New project</strong></li>
              <li>2. Darle un nombre: <em>"Founders · Contenido"</em></li>
              <li>3. En <strong>Project instructions</strong>, pegá el texto de abajo</li>
              <li>4. Guardá. Desde ese proyecto, Claude siempre va a conocer el contexto de la marca.</li>
            </ol>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(PROJECT_INSTRUCTIONS, 'project')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-surface"
                style={{
                  borderColor: copied === 'project' ? '#1D9E75' : '#e7e3d7',
                  color: copied === 'project' ? '#1D9E75' : '#282727',
                }}
              >
                {copied === 'project' ? '✓ Copiado' : 'Copiar instrucciones del proyecto'}
              </button>
              <button
                onClick={() => setShowProjectInstructions(false)}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-surface transition-colors"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >
                Ver texto
              </button>
            </div>
            <pre
              className="p-4 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap overflow-auto max-h-72"
              style={{ background: '#f3f1ea', border: '1px solid #e7e3d7', color: '#282727' }}
            >
              {PROJECT_INSTRUCTIONS}
            </pre>
          </div>
        )}
      </div>

      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: '#f3f1ea' }}>
        {(['semana', 'mes'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            style={{
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#282727' : '#9a877d',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {m === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {/* ── SEMANA mode ── */}
      {mode === 'semana' && (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >‹</button>
              <span className="text-sm font-medium">{weekDisplayLabel}</span>
              <button
                onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >›</button>
            </div>
            <span className="text-xs tabular-nums" style={{ color: '#9a877d' }}>
              {weekPublished.length} publicados · {weekPlanned.length} planificados
            </span>
          </div>

          {weekPosts.length === 0 ? (
            <EmptyState label="esta semana" />
          ) : (
            <>
              {/* Published this week */}
              {weekPublished.length > 0 && (
                <PostsTable
                  posts={weekPublished}
                  label="Publicado esta semana"
                  onEditPost={onEditPost}
                  showMetrics
                />
              )}
              {/* Planned */}
              {weekPlanned.length > 0 && (
                <PostsTable
                  posts={weekPlanned}
                  label="Planificado / En proceso"
                  onEditPost={onEditPost}
                  showMetrics={false}
                />
              )}
            </>
          )}

          {/* Export + Prompt for week */}
          <ClaudeWorkflow
            title="Reporte semanal con Claude"
            description={`Exportá el plan de la semana y subilo al proyecto de Claude para el vistazo rápido.`}
            exportLabel={`↓ founders-semana-${weekLabel}.csv`}
            exportCount={weekPosts.length}
            onExport={() => exportWeeklyCSV(weekPosts, weekLabel)}
            promptLabel="Ver prompt semanal"
            promptText={WEEKLY_PROMPT(weekLabel)}
            showPrompt={showWeeklyPrompt}
            onTogglePrompt={() => setShowWeeklyPrompt((v) => !v)}
            onCopyPrompt={() => copyText(WEEKLY_PROMPT(weekLabel), 'weekly')}
            copied={copied === 'weekly'}
            metaStep={false}
          />

          {/* Save report to Notion */}
          <WeeklyReportSave weekLabel={weekLabel} weekDisplayLabel={weekDisplayLabel} />
        </>
      )}

      {/* ── MES mode ── */}
      {mode === 'mes' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentMonth((m) => subMonths(m, 1)); setReport(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >‹</button>
              <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
              <button
                onClick={() => { setCurrentMonth((m) => addMonths(m, 1)); setReport(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm hover:bg-surface"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >›</button>
            </div>
            <span className="text-xs tabular-nums" style={{ color: '#9a877d' }}>
              {monthPosts.length} publicados
            </span>
          </div>

          {/* Totals */}
          {monthPosts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Alcance', value: monthTotals.alcance, star: false },
                { label: 'Comentarios', value: monthTotals.comentarios, star: false },
                { label: 'Guardados', value: monthTotals.guardados, star: true },
                { label: 'Compartidos', value: monthTotals.compartidos, star: true },
                { label: 'Lead magnets', value: monthTotals.leadMagnets, star: true },
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
                    {m.label}{m.star && ' ⭐'}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {m.value > 0 ? m.value.toLocaleString('es-AR') : <span style={{ color: '#9a877d' }}>—</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Analytics: Top 3 / Bottom 3 / Format breakdown */}
          {postsWithMetrics.length > 0 && (
            <MonthlyAnalytics
              topPosts={topPosts}
              bottomPosts={bottomPosts}
              formatBreakdown={formatBreakdown}
              onEditPost={onEditPost}
            />
          )}

          {monthPosts.length === 0 ? (
            <EmptyState label={`en ${monthLabel} (marcados como Publicado)`} />
          ) : (
            <PostsTable
              posts={monthPosts}
              label="Posts publicados"
              onEditPost={onEditPost}
              showMetrics
            />
          )}

          {/* Export + Prompt for month */}
          {monthPosts.length > 0 && (
            <ClaudeWorkflow
              title="Reporte mensual con Claude"
              description="Exportá los posts y cruzalos con el CSV de Meta en el proyecto de Claude."
              exportLabel={`↓ founders-posts-${monthKey}.csv`}
              exportCount={monthPosts.length}
              onExport={() => exportMonthlyCSV(monthPosts, monthKey)}
              promptLabel="Ver prompt mensual"
              promptText={MONTHLY_PROMPT(monthLabel)}
              showPrompt={showMonthlyPrompt}
              onTogglePrompt={() => setShowMonthlyPrompt((v) => !v)}
              onCopyPrompt={() => copyText(MONTHLY_PROMPT(monthLabel), 'monthly')}
              copied={copied === 'monthly'}
              metaStep
            />
          )}

          {/* Automatic report (needs API key) */}
          {monthPosts.length > 0 && (
            <div className="space-y-4 pt-2" style={{ borderTop: '1px solid #e7e3d7' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Generar reporte automático</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9a877d' }}>
                    Requiere{' '}
                    <code className="px-1 rounded" style={{ background: '#e7e3d7' }}>
                      ANTHROPIC_API_KEY
                    </code>
                    {' '}en Vercel. Claude genera el análisis sin salir de la app.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
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
                  ) : '✦ Generar reporte'}
                </button>
              </div>

              {reportError && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#ef444415', color: '#ef4444' }}>
                  {reportError}
                </div>
              )}

              {report && (
                <div className="space-y-3">
                  <div
                    className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ background: '#f3f1ea', border: '1px solid #e7e3d7' }}
                  >
                    {report}
                  </div>
                  <button
                    onClick={handleSendSlack}
                    disabled={slackStatus === 'sending' || slackStatus === 'sent'}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                    style={{
                      borderColor: slackStatus === 'sent' ? '#1D9E75' : '#e7e3d7',
                      color: slackStatus === 'sent' ? '#1D9E75' : '#282727',
                      background: slackStatus === 'sent' ? '#1D9E7515' : 'transparent',
                    }}
                  >
                    {slackStatus === 'sending' ? 'Enviando...' : slackStatus === 'sent' ? '✓ Enviado a Slack' : '↗ Enviar a Slack'}
                  </button>
                  {slackStatus === 'error' && slackError && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>{slackError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-1"
      style={{ borderColor: '#e7e3d7' }}
    >
      <p className="text-sm" style={{ color: '#9a877d' }}>Sin posts para {label}.</p>
    </div>
  )
}

function PostsTable({
  posts,
  label,
  onEditPost,
  showMetrics,
}: {
  posts: Post[]
  label: string
  onEditPost: (p: Post) => void
  showMetrics: boolean
}) {
  const cols = showMetrics
    ? '80px 1fr 70px 55px 55px 55px 55px'
    : '80px 80px 80px 1fr'

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9a877d' }}>
        {label}
      </h3>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e7e3d7' }}>
        <div
          className="grid text-[11px] font-semibold uppercase tracking-wide px-3 py-2"
          style={{ gridTemplateColumns: cols, background: '#f3f1ea', color: '#9a877d', borderBottom: '1px solid #e7e3d7' }}
        >
          <span>Fecha</span>
          {showMetrics ? (
            <>
              <span>Título</span>
              <span className="text-right">Alcance</span>
              <span className="text-right">Guard.</span>
              <span className="text-right">Comp.</span>
              <span className="text-right">Com.</span>
              <span className="text-right">Leads⭐</span>
            </>
          ) : (
            <>
              <span>Estado</span>
              <span>Canal</span>
              <span>Título</span>
            </>
          )}
        </div>
        {posts.map((post, i) => (
          <button
            key={post.id}
            onClick={() => onEditPost(post)}
            className="w-full grid text-left text-xs px-3 py-2.5 hover:bg-surface transition-colors"
            style={{ gridTemplateColumns: cols, borderTop: i > 0 ? '1px solid #e7e3d7' : undefined }}
          >
            <span style={{ color: '#9a877d' }}>
              {post.fecha ? format(parsePostDate(post.fecha), 'd MMM', { locale: es }) : '—'}
            </span>
            {showMetrics ? (
              <>
                <span className="truncate pr-2 flex items-center gap-1.5">
                  {post.canal && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CANAL_COLORS[post.canal] }} />}
                  {post.titulo || '—'}
                </span>
                <MetricCell value={post.alcance} />
                <MetricCell value={post.guardados} highlight />
                <MetricCell value={post.compartidos} highlight />
                <MetricCell value={post.comentarios} />
                <MetricCell value={post.leadMagnets} highlight />
              </>
            ) : (
              <>
                <span style={{ color: '#9a877d' }}>{post.estado ?? '—'}</span>
                <span className="flex items-center gap-1.5">
                  {post.canal && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CANAL_COLORS[post.canal] }} />}
                  {post.canal ?? '—'}
                </span>
                <span className="truncate pr-2">{post.titulo || '—'}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function ClaudeWorkflow({
  title,
  description,
  exportLabel,
  exportCount,
  onExport,
  promptLabel,
  promptText,
  showPrompt,
  onTogglePrompt,
  onCopyPrompt,
  copied,
  metaStep,
}: {
  title: string
  description: string
  exportLabel: string
  exportCount: number
  onExport: () => void
  promptLabel: string
  promptText: string
  showPrompt: boolean
  onTogglePrompt: () => void
  onCopyPrompt: () => void
  copied: boolean
  metaStep: boolean
}) {
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: '#f3f1ea', border: '1px solid #e7e3d7' }}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: '#9a877d' }}>{description}</p>
      </div>
      <ol className="space-y-3 text-sm" style={{ color: '#282727' }}>
        <li className="flex gap-3">
          <Step n={1} />
          <div>
            <p className="font-medium">Exportá los posts</p>
            <button
              onClick={onExport}
              disabled={exportCount === 0}
              className="mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-white transition-colors disabled:opacity-40"
              style={{ borderColor: '#e7e3d7', color: '#282727' }}
            >
              {exportLabel}
              <span style={{ color: '#9a877d' }}>({exportCount})</span>
            </button>
          </div>
        </li>
        {metaStep && (
          <li className="flex gap-3">
            <Step n={2} />
            <div>
              <p className="font-medium">Descargá las métricas de Meta</p>
              <p className="text-xs mt-0.5" style={{ color: '#9a877d' }}>Meta Business Suite → Insights → Exportar datos del período</p>
            </div>
          </li>
        )}
        <li className="flex gap-3">
          <Step n={metaStep ? 3 : 2} />
          <div>
            <p className="font-medium">Subí el/los archivos al proyecto de Claude y usá este prompt</p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={onTogglePrompt}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-white transition-colors"
                style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
              >
                {showPrompt ? 'Ocultar' : promptLabel}
              </button>
              <button
                onClick={onCopyPrompt}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-white transition-colors"
                style={{ borderColor: copied ? '#1D9E75' : '#e7e3d7', color: copied ? '#1D9E75' : '#282727' }}
              >
                {copied ? '✓ Copiado' : 'Copiar prompt'}
              </button>
            </div>
            {showPrompt && (
              <pre
                className="mt-3 p-3 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap overflow-auto max-h-56"
                style={{ background: 'white', border: '1px solid #e7e3d7', color: '#282727' }}
              >
                {promptText}
              </pre>
            )}
          </div>
        </li>
      </ol>
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
      style={{ background: '#c6b297', color: 'white' }}
    >
      {n}
    </span>
  )
}

function MetricCell({ value, highlight = false }: { value: number | null; highlight?: boolean }) {
  return (
    <span className="text-right tabular-nums" style={{ color: value !== null && highlight ? '#282727' : '#9a877d' }}>
      {value !== null ? value.toLocaleString('es-AR') : '—'}
    </span>
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

function MonthlyAnalytics({
  topPosts,
  bottomPosts,
  formatBreakdown,
  onEditPost,
}: {
  topPosts: Post[]
  bottomPosts: Post[]
  formatBreakdown: [string, { count: number; guardados: number; compartidos: number; leads: number }][]
  onEditPost: (p: Post) => void
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9a877d' }}>
        Análisis del mes
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top 3 */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e7e3d7' }}>
          <div className="px-4 py-2.5 text-xs font-semibold" style={{ background: '#f3f1ea', borderBottom: '1px solid #e7e3d7', color: '#282727' }}>
            Top 3 mejores
          </div>
          {topPosts.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#9a877d' }}>Sin datos suficientes</p>
          ) : (
            topPosts.map((p, i) => (
              <RankRow key={p.id} post={p} medal={MEDALS[i]} onEdit={onEditPost} />
            ))
          )}
        </div>

        {/* Bottom 3 */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e7e3d7' }}>
          <div className="px-4 py-2.5 text-xs font-semibold" style={{ background: '#f3f1ea', borderBottom: '1px solid #e7e3d7', color: '#282727' }}>
            Bottom 3 con menor rendimiento
          </div>
          {bottomPosts.length === 0 ? (
            <p className="px-4 py-3 text-xs" style={{ color: '#9a877d' }}>Sin datos suficientes</p>
          ) : (
            bottomPosts.map((p, i) => (
              <RankRow key={p.id} post={p} medal={['➊', '➋', '➌'][i]} onEdit={onEditPost} isBottom />
            ))
          )}
        </div>
      </div>

      {/* Format breakdown */}
      {formatBreakdown.length > 1 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e7e3d7' }}>
          <div
            className="grid text-[11px] font-semibold uppercase tracking-wide px-4 py-2"
            style={{ gridTemplateColumns: '1fr 50px 55px 55px 55px', background: '#f3f1ea', color: '#9a877d', borderBottom: '1px solid #e7e3d7' }}
          >
            <span>Formato</span>
            <span className="text-right">Posts</span>
            <span className="text-right">Guard.</span>
            <span className="text-right">Comp.</span>
            <span className="text-right">Leads⭐</span>
          </div>
          {formatBreakdown.map(([fmt, stats], i) => (
            <div
              key={fmt}
              className="grid text-xs px-4 py-2.5"
              style={{ gridTemplateColumns: '1fr 50px 55px 55px 55px', borderTop: i > 0 ? '1px solid #e7e3d7' : undefined }}
            >
              <span className="font-medium">{fmt}</span>
              <span className="text-right tabular-nums" style={{ color: '#9a877d' }}>{stats.count}</span>
              <MetricCell value={stats.guardados || null} highlight />
              <MetricCell value={stats.compartidos || null} highlight />
              <MetricCell value={stats.leads || null} highlight />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RankRow({ post, medal, onEdit, isBottom = false }: { post: Post; medal: string; onEdit: (p: Post) => void; isBottom?: boolean }) {
  return (
    <button
      onClick={() => onEdit(post)}
      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-surface transition-colors"
      style={{ borderTop: '1px solid #e7e3d7' }}
    >
      <span className="text-sm flex-shrink-0 mt-0.5">{medal}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: '#282727' }}>{post.titulo || '(sin título)'}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {post.canal && (
            <span className="text-[10px]" style={{ color: CANAL_COLORS[post.canal] }}>{post.canal}</span>
          )}
          {post.formato && (
            <span className="text-[10px]" style={{ color: '#9a877d' }}>{post.formato}</span>
          )}
          <span className="text-[10px] tabular-nums" style={{ color: isBottom ? '#9a877d' : '#282727' }}>
            {post.leadMagnets ? `${post.leadMagnets} leads · ` : ''}
            {post.guardados ? `${post.guardados} guard. · ` : ''}
            {post.compartidos ? `${post.compartidos} comp.` : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

function WeeklyReportSave({ weekLabel, weekDisplayLabel }: { weekLabel: string; weekDisplayLabel: string }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    setText('')
    setSaved(false)
    setError(null)
    setLoading(true)
    fetch(`/api/reportes?week=${weekLabel}`)
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? true)
        if (data.report?.content) setText(data.report.content)
      })
      .catch(() => setConfigured(null))
      .finally(() => setLoading(false))
  }, [weekLabel])

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: weekLabel, content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  if (configured === false) {
    return (
      <div className="rounded-xl p-5 space-y-2" style={{ background: '#f3f1ea', border: '1px solid #e7e3d7' }}>
        <h3 className="text-sm font-semibold">Guardar reporte en Notion</h3>
        <p className="text-xs leading-relaxed" style={{ color: '#9a877d' }}>
          Para guardar reportes en Notion, creá una página <strong>"Reportes"</strong> en tu workspace,
          compartila con la integración, y agregá su ID como{' '}
          <code className="px-1 rounded" style={{ background: '#e7e3d7' }}>NOTION_REPORTS_PAGE_ID</code>
          {' '}en las variables de entorno de Vercel.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: '#f3f1ea', border: '1px solid #e7e3d7' }}>
      <div>
        <h3 className="text-sm font-semibold">Guardar reporte en Notion</h3>
        <p className="text-xs mt-0.5" style={{ color: '#9a877d' }}>
          Pegá el análisis que generó Claude y quedá guardado como <em>Reporte {weekLabel}</em> en tu Notion.
        </p>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#9a877d' }} />
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false) }}
            placeholder={`Pegá acá el reporte de la semana del ${weekDisplayLabel}...`}
            rows={10}
            className="w-full rounded-xl p-4 text-sm leading-relaxed resize-y outline-none"
            style={{ background: 'white', border: '1px solid #e7e3d7', color: '#282727' }}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity"
              style={{ background: saved ? '#1D9E75' : '#282727' }}
            >
              {saving ? 'Guardando...' : saved ? '✓ Guardado en Notion' : 'Guardar en Notion'}
            </button>
            {error && <span className="text-xs" style={{ color: '#ef4444' }}>{error}</span>}
          </div>
        </>
      )}
    </div>
  )
}
