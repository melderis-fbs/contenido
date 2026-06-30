'use client'

import { useState, useEffect, useRef } from 'react'
import type { Post, Canal, Formato, Estado, Pilar } from '@/lib/types'
import {
  CANALES,
  FORMATOS,
  ESTADOS,
  PILARES,
  CANAL_COLORS,
  ESTADO_COLORS,
  CAPTION_LIMITS,
} from '@/lib/types'
import { toDatetimeLocal } from '@/lib/utils'

interface Props {
  post: Post
  onClose: () => void
  onCreate: (post: Omit<Post, 'id' | 'notionUrl'>) => Promise<Post>
  onUpdate: (id: string, updates: Partial<Post>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDuplicate: (canal: Canal) => Promise<void>
}

export default function PostEditor({ post, onClose, onCreate, onUpdate, onDelete, onDuplicate }: Props) {
  const isNew = !post.id

  const [form, setForm] = useState<Omit<Post, 'id' | 'notionUrl'>>({
    titulo: post.titulo,
    canal: post.canal,
    formato: post.formato,
    estado: post.estado,
    pilar: post.pilar,
    fecha: post.fecha,
    caption: post.caption,
    hashtags: post.hashtags,
    linkMaterial: post.linkMaterial,
    linkPublicado: post.linkPublicado,
    notas: post.notas,
    notasVicky: post.notasVicky,
    alcance: post.alcance,
    visualizaciones: post.visualizaciones,
    meGusta: post.meGusta,
    comentarios: post.comentarios,
    guardados: post.guardados,
    compartidos: post.compartidos,
    seguimientos: post.seguimientos,
    engagement: post.engagement,
    leadMagnets: post.leadMagnets,
  })

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDupMenu, setShowDupMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const dupRef = useRef<HTMLDivElement>(null)

  // Sync form when post changes externally
  useEffect(() => {
    setForm({
      titulo: post.titulo,
      canal: post.canal,
      formato: post.formato,
      estado: post.estado,
      pilar: post.pilar,
      fecha: post.fecha,
      caption: post.caption,
      hashtags: post.hashtags,
      linkMaterial: post.linkMaterial,
      linkPublicado: post.linkPublicado,
      notas: post.notas,
      notasVicky: post.notasVicky,
      alcance: post.alcance,
      visualizaciones: post.visualizaciones,
      meGusta: post.meGusta,
      comentarios: post.comentarios,
      guardados: post.guardados,
      compartidos: post.compartidos,
      seguimientos: post.seguimientos,
      engagement: post.engagement,
      leadMagnets: post.leadMagnets,
    })
  }, [post.id])

  // Close dup menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dupRef.current && !dupRef.current.contains(e.target as Node)) {
        setShowDupMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  async function handleSave() {
    if (!form.titulo.trim()) {
      setError('El título es obligatorio')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        await onCreate(form)
        onClose()
      } else {
        await onUpdate(post.id, form)
        onClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      await onDelete(post.id)
      onClose()
    } catch {
      setError('No se pudo borrar. Intentá de nuevo.')
      setDeleting(false)
    }
  }

  async function handleGenerateCaption() {
    setGeneratingCaption(true)
    setError(null)
    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          canal: form.canal,
          formato: form.formato,
          pilar: form.pilar,
          notas: form.notas,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      set('caption', data.caption)
    } catch (e) {
      setError('No se pudo generar el caption. Revisá que ANTHROPIC_API_KEY esté configurada.')
    } finally {
      setGeneratingCaption(false)
    }
  }

  const captionLimit = form.canal ? CAPTION_LIMITS[form.canal] : 2200
  const captionLen = form.caption.length
  const captionOver = captionLen > captionLimit
  const captionNear = captionLen > captionLimit * 0.9

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 editor-backdrop"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-white z-50 flex flex-col shadow-2xl editor-panel"
        style={{ borderLeft: '1px solid #e7e3d7' }}
        role="dialog"
        aria-label={isNew ? 'Nuevo contenido' : 'Editar contenido'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e7e3d7' }}>
          <h2 className="text-sm font-semibold">
            {isNew ? 'Nuevo contenido' : 'Editar contenido'}
          </h2>
          <div className="flex items-center gap-2">
            {post.notionUrl && !isNew && (
              <a
                href={post.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-2 py-1 rounded border transition-colors hover:bg-surface"
                style={{ color: '#9a877d', borderColor: '#e7e3d7' }}
              >
                Notion ↗
              </a>
            )}
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="text-[11px] px-2 py-1 rounded border transition-colors hover:bg-surface"
              style={{
                borderColor: showPreview ? '#c6b297' : '#e7e3d7',
                color: showPreview ? '#282727' : '#9a877d',
                background: showPreview ? '#c6b29715' : 'transparent',
              }}
            >
              {showPreview ? 'Editar' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-surface"
              style={{ color: '#9a877d' }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {showPreview ? (
            <PostPreview form={form} />
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="label">Hook / Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => set('titulo', e.target.value)}
                  placeholder="El gancho del post..."
                  className="input mt-1"
                  autoFocus={isNew}
                />
              </div>

              {/* Canal + Formato */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Canal</label>
                  <div className="relative mt-1">
                    <select
                      value={form.canal ?? ''}
                      onChange={(e) => set('canal', (e.target.value as Canal) || null)}
                      className="input appearance-none pr-7"
                      style={
                        form.canal
                          ? { borderColor: CANAL_COLORS[form.canal], color: CANAL_COLORS[form.canal] }
                          : {}
                      }
                    >
                      <option value="">—</option>
                      {CANALES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div>
                  <label className="label">Formato</label>
                  <div className="relative mt-1">
                    <select
                      value={form.formato ?? ''}
                      onChange={(e) => set('formato', (e.target.value as Formato) || null)}
                      className="input appearance-none pr-7"
                    >
                      <option value="">—</option>
                      {FORMATOS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>
              </div>

              {/* Estado + Pilar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Estado</label>
                  <div className="relative mt-1">
                    <select
                      value={form.estado ?? ''}
                      onChange={(e) => set('estado', (e.target.value as Estado) || null)}
                      className="input appearance-none pr-7"
                      style={
                        form.estado
                          ? { borderColor: ESTADO_COLORS[form.estado], color: ESTADO_COLORS[form.estado] }
                          : {}
                      }
                    >
                      <option value="">—</option>
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>

                <div>
                  <label className="label">Pilar</label>
                  <div className="relative mt-1">
                    <select
                      value={form.pilar ?? ''}
                      onChange={(e) => set('pilar', (e.target.value as Pilar) || null)}
                      className="input appearance-none pr-7"
                    >
                      <option value="">—</option>
                      {PILARES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronIcon />
                  </div>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="label">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(form.fecha)}
                  onChange={(e) => set('fecha', e.target.value || null)}
                  className="input mt-1"
                />
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">Caption</label>
                  <button
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption || !form.titulo}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all disabled:opacity-40"
                    style={{ borderColor: '#c6b297', color: '#9a877d' }}
                    title={!form.titulo ? 'Agregá un título primero' : 'Generar con IA'}
                  >
                    {generatingCaption ? (
                      <>
                        <SpinnerIcon />
                        Generando...
                      </>
                    ) : (
                      <>✦ Generar caption</>
                    )}
                  </button>
                </div>
                <textarea
                  value={form.caption}
                  onChange={(e) => set('caption', e.target.value)}
                  placeholder="El caption del post..."
                  rows={6}
                  className="input resize-none"
                />
                <div
                  className="flex justify-end mt-1 text-[11px] tabular-nums"
                  style={{ color: captionOver ? '#E8A23D' : captionNear ? '#E8A23D' : '#9a877d' }}
                >
                  {captionLen.toLocaleString('es-AR')} / {captionLimit.toLocaleString('es-AR')}
                  {captionOver && ' · Excede el límite'}
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="label">Hashtags</label>
                <input
                  type="text"
                  value={form.hashtags}
                  onChange={(e) => set('hashtags', e.target.value)}
                  placeholder="#founders #coaching"
                  className="input mt-1"
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="label">Link material</label>
                  <input
                    type="url"
                    value={form.linkMaterial ?? ''}
                    onChange={(e) => set('linkMaterial', e.target.value || null)}
                    placeholder="drive.google.com/..."
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Link publicado</label>
                  <input
                    type="url"
                    value={form.linkPublicado ?? ''}
                    onChange={(e) => set('linkPublicado', e.target.value || null)}
                    placeholder="instagram.com/p/..."
                    className="input mt-1"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="label">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => set('notas', e.target.value)}
                  placeholder="Referencias, ideas, contexto..."
                  rows={3}
                  className="input resize-none mt-1"
                />
              </div>

              {/* Comentario de Vicky */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: '#FEF9EC', border: '1px solid #F5E3B0' }}
              >
                <label
                  className="text-xs font-semibold flex items-center gap-1.5"
                  style={{ color: '#92700A' }}
                >
                  💬 Feedback de Vicky
                </label>
                <textarea
                  value={form.notasVicky}
                  onChange={(e) => set('notasVicky', e.target.value)}
                  placeholder="Dejá tu feedback o comentario acá..."
                  rows={3}
                  className="w-full resize-none outline-none leading-relaxed"
                  style={{ background: 'transparent', color: '#282727', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Métricas de rendimiento */}
              <div>
                <div
                  className="flex items-center gap-2 py-2 my-1"
                  style={{ borderTop: '1px solid #e7e3d7' }}
                >
                  <span className="text-xs font-semibold" style={{ color: '#282727' }}>
                    Rendimiento
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#e7e3d7', color: '#9a877d' }}>
                    post-publicación
                  </span>
                </div>
                <p className="text-[11px] mb-3" style={{ color: '#9a877d' }}>
                  ⭐ guardados, compartidos y leads son los que más importan
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <MetricInput label="Alcance" value={form.alcance} onChange={(v) => set('alcance', v)} placeholder="0" />
                  <MetricInput label="Visualizaciones" value={form.visualizaciones} onChange={(v) => set('visualizaciones', v)} placeholder="0" />
                  <MetricInput label="Me gusta" value={form.meGusta} onChange={(v) => set('meGusta', v)} placeholder="0" />
                  <MetricInput label="Comentarios" value={form.comentarios} onChange={(v) => set('comentarios', v)} placeholder="0" />
                  <MetricInput label="Guardados ⭐" value={form.guardados} onChange={(v) => set('guardados', v)} placeholder="0" highlight />
                  <MetricInput label="Compartidos ⭐" value={form.compartidos} onChange={(v) => set('compartidos', v)} placeholder="0" highlight />
                  <MetricInput label="Seguimientos" value={form.seguimientos} onChange={(v) => set('seguimientos', v)} placeholder="0" />
                  <MetricInput label="Engagement %" value={form.engagement} onChange={(v) => set('engagement', v)} placeholder="0.0" isDecimal />
                </div>
                <div className="mt-3">
                  <MetricInput label="Lead magnets / DMs ⭐⭐" value={form.leadMagnets} onChange={(v) => set('leadMagnets', v)} placeholder="0" highlight />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t flex items-center gap-2 flex-wrap"
          style={{ borderColor: '#e7e3d7' }}
        >
          {error && (
            <p className="w-full text-xs text-red-500 mb-1">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: '#282727' }}
          >
            {saving ? 'Guardando...' : isNew ? 'Crear post' : 'Guardar'}
          </button>

          {!isNew && (
            <>
              {/* Duplicate */}
              <div ref={dupRef} className="relative">
                <button
                  onClick={() => setShowDupMenu((v) => !v)}
                  className="px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-surface"
                  style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
                  title="Duplicar a otro canal"
                >
                  Dupl.
                </button>
                {showDupMenu && (
                  <div
                    className="absolute bottom-full mb-2 left-0 bg-white rounded-lg border shadow-lg py-1 z-10 min-w-36"
                    style={{ borderColor: '#e7e3d7' }}
                  >
                    {CANALES.filter((c) => c !== form.canal).map((canal) => (
                      <button
                        key={canal}
                        onClick={async () => {
                          setShowDupMenu(false)
                          await onDuplicate(canal)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface flex items-center gap-2"
                        style={{ color: '#282727' }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: CANAL_COLORS[canal] }}
                        />
                        {canal}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-lg text-sm border transition-colors hover:bg-red-50 disabled:opacity-60"
                style={{
                  borderColor: confirmDelete ? '#ef4444' : '#e7e3d7',
                  color: confirmDelete ? '#ef4444' : '#9a877d',
                }}
              >
                {deleting ? '...' : confirmDelete ? '¿Confirmar?' : 'Borrar'}
              </button>
            </>
          )}
        </div>
      </aside>

      <style>{`
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #282727;
        }
        .input {
          display: block;
          width: 100%;
          padding: 0.5rem 0.625rem;
          font-size: 0.8125rem;
          border: 1px solid #e7e3d7;
          border-radius: 0.5rem;
          background: #fbfaf5;
          color: #282727;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .input:focus {
          border-color: #c6b297;
          box-shadow: 0 0 0 3px #c6b29720;
        }
      `}</style>
    </>
  )
}

function ChevronIcon() {
  return (
    <svg
      className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
      style={{ color: '#9a877d' }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MetricInput({
  label,
  value,
  onChange,
  placeholder,
  highlight = false,
  isDecimal = false,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  highlight?: boolean
  isDecimal?: boolean
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min="0"
        step={isDecimal ? '0.1' : '1'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="input mt-1"
        style={highlight && value !== null ? { borderColor: '#c6b297' } : {}}
      />
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="w-3 h-3 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function PostPreview({ form }: { form: Omit<Post, 'id' | 'notionUrl'> }) {
  const username =
    form.canal === 'IG Founders' ? 'founders'
    : form.canal === 'IG Vicky' ? 'vickybecci'
    : form.canal === 'LinkedIn' ? 'Vicky Becci'
    : form.canal === 'YouTube' ? 'Founders'
    : 'TikTok'

  const initial = username[0].toUpperCase()

  const captionPreview = (form.caption || form.titulo || '').slice(0, 220)
  const hasMore = (form.caption || form.titulo || '').length > 220

  const formatLabel: Record<string, string> = {
    Reel: '▶ Reel',
    Carrusel: '⊞ Carrusel',
    'Imagen/Post': '⊡ Imagen',
    Video: '▶ Video',
    Texto: 'Texto',
    Story: '⊙ Story',
    Recorte: '✂ Recorte',
    Testimonio: '💬 Testimonio',
  }

  const color = form.canal ? CANAL_COLORS[form.canal] : '#9a877d'

  return (
    <div className="flex justify-center py-2">
      <div
        className="w-full max-w-[300px] rounded-2xl overflow-hidden border"
        style={{ borderColor: '#e7e3d7' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-white">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ background: color }}
            >
              {initial}
            </div>
            <p className="text-[12px] font-semibold">{username}</p>
          </div>
          <span className="text-base" style={{ color: '#9a877d' }}>···</span>
        </div>

        {/* Media placeholder */}
        <div
          className="w-full aspect-square flex flex-col items-center justify-center gap-2"
          style={{ background: `${color}10` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${color}20` }}
          >
            {form.formato === 'Reel' || form.formato === 'Video' ? '▶' :
             form.formato === 'Carrusel' ? '⊞' :
             form.formato === 'Story' ? '⊙' :
             form.formato === 'Testimonio' ? '💬' : '⊡'}
          </div>
          {form.formato && (
            <span className="text-[11px] font-medium" style={{ color }}>
              {formatLabel[form.formato] ?? form.formato}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="px-3 py-2 bg-white flex items-center gap-3 text-lg">
          <span>♡</span>
          <span>💬</span>
          <span>↗</span>
        </div>

        {/* Caption */}
        <div className="px-3 pb-4 bg-white space-y-1">
          {captionPreview ? (
            <>
              <p className="text-[12px] leading-relaxed">
                <strong>{username}</strong>{' '}
                {captionPreview}
                {hasMore && <span style={{ color: '#9a877d' }}> ... más</span>}
              </p>
              {form.hashtags && (
                <p className="text-[11px] break-all" style={{ color: '#0095F6' }}>
                  {form.hashtags.slice(0, 120)}
                </p>
              )}
            </>
          ) : (
            <p className="text-[12px]" style={{ color: '#9a877d' }}>
              {form.titulo ? `${form.titulo}...` : 'Sin caption aún.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
