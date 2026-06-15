'use client'

import { useMemo } from 'react'
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
import { useState } from 'react'
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post, Canal } from '@/lib/types'
import { CANALES, CANAL_COLORS, ESTADOS_COMPLETOS, ESTADO_COLORS } from '@/lib/types'
import BoardCard, { BoardCardOverlay } from './BoardCard'

interface Props {
  posts: Post[]
  currentWeekStart: Date
  onEditPost: (post: Post) => void
  onMovePost: (id: string, canal: Canal, fecha: string) => void
  onAddPost: (canal: Canal, fecha: string) => void
}

export default function WeeklyBoard({
  posts,
  currentWeekStart,
  onEditPost,
  onMovePost,
  onAddPost,
}: Props) {
  const [activePost, setActivePost] = useState<Post | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const days = useMemo(
    () =>
      eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) }),
    [currentWeekStart],
  )

  function getCellPosts(canal: Canal, day: Date): Post[] {
    return posts
      .filter((p) => {
        if (p.canal !== canal || !p.fecha) return false
        return isSameDay(new Date(p.fecha), day)
      })
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  }

  function handleDragStart(event: DragStartEvent) {
    const post = posts.find((p) => p.id === event.active.id)
    setActivePost(post ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePost(null)
    const { active, over } = event
    if (!over) return

    const postId = active.id as string
    const cellId = over.id as string
    const [canal, dateStr] = cellId.split('::')

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    // Preserve time if post had one, otherwise use noon
    let newFecha = dateStr
    if (post.fecha && post.fecha.includes('T')) {
      const time = post.fecha.slice(11, 16)
      newFecha = `${dateStr}T${time}`
    }

    if (post.canal !== canal || !isSameDay(new Date(post.fecha || ''), new Date(dateStr))) {
      onMovePost(postId, canal as Canal, newFecha)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-auto pb-8">
        <div className="min-w-[760px]">
          {/* Day headers */}
          <div className="board-grid sticky top-0 z-10 bg-cream" style={{ borderBottom: '1px solid #e7e3d7' }}>
            <div className="px-3 py-3 text-xs font-medium" style={{ color: '#9a877d' }} />
            {days.map((day) => {
              const today = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className="px-2 py-3 text-center"
                  style={{ borderLeft: '1px solid #e7e3d7' }}
                >
                  <div
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: '#9a877d' }}
                  >
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div
                    className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full transition-colors ${today ? 'text-white' : ''}`}
                    style={today ? { background: '#c6b297' } : { color: '#282727' }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Channel rows */}
          {CANALES.map((canal) => {
            const canalPosts = posts.filter((p) => p.canal === canal)
            const weekCanalPosts = canalPosts.filter((p) => p.fecha && days.some((d) => isSameDay(new Date(p.fecha!), d)))
            const completas = weekCanalPosts.filter((p) => p.estado && ESTADOS_COMPLETOS.includes(p.estado)).length

            return (
              <div
                key={canal}
                className="board-grid"
                style={{ borderBottom: '1px solid #e7e3d7' }}
              >
                {/* Canal label */}
                <div
                  className="px-2 py-3 flex flex-col justify-between gap-1"
                  style={{ borderRight: '1px solid #e7e3d7' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CANAL_COLORS[canal] }}
                    />
                    <span
                      className="text-xs font-semibold leading-tight"
                      style={{ color: '#282727' }}
                    >
                      {canal}
                    </span>
                  </div>
                  {weekCanalPosts.length > 0 && (
                    <span className="text-[10px] tabular-nums" style={{ color: '#9a877d' }}>
                      {completas}/{weekCanalPosts.length}
                    </span>
                  )}
                </div>

                {/* Day cells */}
                {days.map((day) => {
                  const cellId = `${canal}::${format(day, 'yyyy-MM-dd')}`
                  const cellPosts = getCellPosts(canal, day)
                  return (
                    <BoardCell
                      key={cellId}
                      id={cellId}
                      posts={cellPosts}
                      onEditPost={onEditPost}
                      onAddPost={() =>
                        onAddPost(canal, `${format(day, 'yyyy-MM-dd')}T12:00`)
                      }
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activePost ? <BoardCardOverlay post={activePost} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function BoardCell({
  id,
  posts,
  onEditPost,
  onAddPost,
}: {
  id: string
  posts: Post[]
  onEditPost: (post: Post) => void
  onAddPost: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="p-1.5 min-h-[90px] transition-colors"
      style={{
        borderLeft: '1px solid #e7e3d7',
        background: isOver ? '#c6b29710' : undefined,
      }}
    >
      {posts.map((post) => (
        <BoardCard key={post.id} post={post} onEdit={onEditPost} />
      ))}
      <button
        onClick={onAddPost}
        className="w-full text-left px-1.5 py-1 rounded text-[11px] transition-colors opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-surface"
        style={{ color: '#9a877d' }}
        aria-label="Agregar post"
      >
        +
      </button>
    </div>
  )
}
