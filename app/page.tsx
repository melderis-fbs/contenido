'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval } from 'date-fns'
import type { Post, Canal, WeekFilters } from '@/lib/types'
import WeeklyBoard from '@/components/WeeklyBoard'
import WeekMetrics from '@/components/WeekMetrics'
import FilterBar from '@/components/FilterBar'
import PostEditor from '@/components/PostEditor'
import KanbanView from '@/components/KanbanView'
import ChannelView from '@/components/ChannelView'

type Tab = 'tablero' | 'estado' | 'canal'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tablero', label: 'Tablero' },
  { id: 'estado', label: 'Por estado' },
  { id: 'canal', label: 'Por canal' },
]

const emptyFilters: WeekFilters = { canales: [], estados: [], pilares: [], search: '' }

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [tab, setTab] = useState<Tab>('tablero')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [filters, setFilters] = useState<WeekFilters>(emptyFilters)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPosts(data.posts)
    } catch {
      setLoadError('No se pudieron cargar los contenidos. Revisá la conexión con Notion.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  // Filtered posts (all views)
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filters.canales.length && (!p.canal || !filters.canales.includes(p.canal))) return false
      if (filters.estados.length && (!p.estado || !filters.estados.includes(p.estado))) return false
      if (filters.pilares.length && (!p.pilar || !filters.pilares.includes(p.pilar))) return false
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const hay = `${p.titulo} ${p.caption} ${p.hashtags} ${p.notas}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [posts, filters])

  // Posts in the current week (for metrics)
  const weekPosts = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return filteredPosts.filter((p) => {
      if (!p.fecha) return false
      try {
        return isWithinInterval(new Date(p.fecha), { start: currentWeekStart, end: weekEnd })
      } catch {
        return false
      }
    })
  }, [filteredPosts, currentWeekStart])

  const isFiltered = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== '',
  )

  // CRUD handlers
  const handleCreate = useCallback(
    async (data: Omit<Post, 'id' | 'notionUrl'>): Promise<Post> => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const { post } = await res.json()
      setPosts((prev) => [...prev, post])
      return post
    },
    [],
  )

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Post>): Promise<void> => {
      // Optimistic
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      try {
        const res = await fetch(`/api/posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error()
        const { post } = await res.json()
        setPosts((prev) => prev.map((p) => (p.id === id ? post : p)))
      } catch {
        // Rollback
        loadPosts()
        throw new Error('No se pudo actualizar')
      }
    },
    [loadPosts],
  )

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      setPosts((prev) => prev.filter((p) => p.id !== id))
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        loadPosts()
        throw new Error('No se pudo borrar')
      }
    },
    [loadPosts],
  )

  const handleMove = useCallback(
    async (id: string, canal: Canal, fecha: string) => {
      await handleUpdate(id, { canal, fecha })
    },
    [handleUpdate],
  )

  const openNewPost = useCallback((canal: Canal, fecha: string) => {
    setEditingPost({
      id: '',
      titulo: '',
      canal,
      formato: null,
      estado: 'Idea',
      pilar: null,
      fecha,
      caption: '',
      hashtags: '',
      linkMaterial: null,
      linkPublicado: null,
      notas: '',
      notionUrl: '',
    })
  }, [])

  async function handleDuplicate(canal: Canal) {
    if (!editingPost) return
    const newPost = await handleCreate({
      titulo: editingPost.titulo,
      canal,
      formato: editingPost.formato,
      estado: 'Idea',
      pilar: editingPost.pilar,
      fecha: editingPost.fecha,
      caption: editingPost.caption,
      hashtags: editingPost.hashtags,
      linkMaterial: editingPost.linkMaterial,
      linkPublicado: editingPost.linkPublicado,
      notas: editingPost.notas,
    })
    setEditingPost(newPost)
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* App header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b"
        style={{ borderColor: '#e7e3d7' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #c6b297 0%, #9a877d 100%)' }}
          />
          <div>
            <h1 className="text-sm font-semibold leading-tight tracking-tight">
              Founders · Contenido
            </h1>
            <p className="text-[11px] leading-tight" style={{ color: '#9a877d' }}>
              Planificador semanal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPosts()}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-surface"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
            title="Recargar"
          >
            ↺
          </button>
          <button
            onClick={() => openNewPost('IG Founders', new Date().toISOString().slice(0, 16))}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: '#282727' }}
          >
            + Nuevo
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-surface ml-1"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Metrics + week nav */}
      <WeekMetrics
        posts={weekPosts}
        currentWeekStart={currentWeekStart}
        isFiltered={isFiltered}
        onPrevWeek={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
        onNextWeek={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
        onToday={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
      />

      {/* Tabs */}
      <div
        className="flex-shrink-0 border-b px-4 sm:px-6 flex gap-5"
        style={{ borderColor: '#e7e3d7' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === t.id ? '#c6b297' : 'transparent',
              color: tab === t.id ? '#282727' : '#9a877d',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-sm" style={{ color: '#9a877d' }}>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Conectando con Notion...
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <p className="text-sm" style={{ color: '#9a877d' }}>{loadError}</p>
            <button
              onClick={loadPosts}
              className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-surface"
              style={{ borderColor: '#e7e3d7', color: '#282727' }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {tab === 'tablero' && (
              <WeeklyBoard
                posts={filteredPosts}
                currentWeekStart={currentWeekStart}
                onEditPost={setEditingPost}
                onMovePost={handleMove}
                onAddPost={openNewPost}
              />
            )}
            {tab === 'estado' && (
              <KanbanView
                posts={filteredPosts}
                onEditPost={setEditingPost}
                onUpdatePost={handleUpdate}
              />
            )}
            {tab === 'canal' && (
              <ChannelView posts={filteredPosts} onEditPost={setEditingPost} />
            )}
          </>
        )}
      </div>

      {/* Post editor */}
      {editingPost !== null && (
        <PostEditor
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  )
}
