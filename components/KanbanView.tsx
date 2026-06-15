'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Post, Estado } from '@/lib/types'
import { ESTADOS, ESTADO_COLORS } from '@/lib/types'
import { BoardCardOverlay } from './BoardCard'
import BoardCard from './BoardCard'

interface Props {
  posts: Post[]
  onEditPost: (post: Post) => void
  onUpdatePost: (id: string, updates: Partial<Post>) => Promise<void>
}

export default function KanbanView({ posts, onEditPost, onUpdatePost }: Props) {
  const [activePost, setActivePost] = useState<Post | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const byEstado = useMemo(() => {
    const map: Record<Estado, Post[]> = {
      Idea: [],
      'En producción': [],
      Listo: [],
      Programado: [],
      Publicado: [],
    }
    for (const post of posts) {
      if (post.estado) map[post.estado].push(post)
      else map['Idea'].push(post)
    }
    return map
  }, [posts])

  function handleDragStart(event: DragStartEvent) {
    const post = posts.find((p) => p.id === event.active.id)
    setActivePost(post ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePost(null)
    const { active, over } = event
    if (!over) return
    const postId = active.id as string
    const estado = over.id as Estado
    const post = posts.find((p) => p.id === postId)
    if (post && post.estado !== estado) {
      onUpdatePost(postId, { estado })
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 py-6 pb-10 items-start">
        {ESTADOS.map((estado) => {
          const estadoPosts = byEstado[estado]
          return (
            <KanbanColumn
              key={estado}
              estado={estado}
              posts={estadoPosts}
              onEditPost={onEditPost}
            />
          )
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activePost ? <BoardCardOverlay post={activePost} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  estado,
  posts,
  onEditPost,
}: {
  estado: Estado
  posts: Post[]
  onEditPost: (post: Post) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: estado })
  const color = ESTADO_COLORS[estado]

  return (
    <div className="flex-shrink-0 w-[220px] flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold" style={{ color: '#282727' }}>
            {estado}
          </span>
        </div>
        <span
          className="text-xs tabular-nums px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}15`, color }}
        >
          {posts.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-[60px] rounded-xl p-2 transition-colors"
        style={{
          background: isOver ? `${color}10` : '#f3f1ea',
          border: `1px solid ${isOver ? color : '#e7e3d7'}`,
        }}
      >
        {posts.length === 0 && (
          <div className="flex items-center justify-center h-12 text-xs" style={{ color: '#9a877d' }}>
            Sin posts
          </div>
        )}
        {posts.map((post) => (
          <div key={post.id} className="mb-1">
            <BoardCard post={post} onEdit={onEditPost} />
          </div>
        ))}
      </div>
    </div>
  )
}
