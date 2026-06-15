'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Post } from '@/lib/types'
import { ESTADO_COLORS, CANAL_COLORS } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface Props {
  post: Post
  onEdit: (post: Post) => void
  isOverlay?: boolean
}

const FORMATO_SHORT: Record<string, string> = {
  Reel: 'Reel',
  Carrusel: 'Car',
  'Imagen/Post': 'Img',
  Video: 'Vid',
  Texto: 'Txt',
  Story: 'Str',
  Recorte: 'Rec',
  Testimonio: 'Tes',
}

export function BoardCardOverlay({ post }: { post: Post }) {
  return <BoardCardInner post={post} isOverlay />
}

export default function BoardCard({ post, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-30' : ''}
      {...attributes}
      {...listeners}
    >
      <BoardCardInner post={post} onEdit={onEdit} />
    </div>
  )
}

function BoardCardInner({
  post,
  onEdit,
  isOverlay = false,
}: {
  post: Post
  onEdit?: (post: Post) => void
  isOverlay?: boolean
}) {
  const estadoColor = post.estado ? ESTADO_COLORS[post.estado] : '#e7e3d7'
  const time = formatTime(post.fecha)

  return (
    <div
      onClick={onEdit ? () => onEdit(post) : undefined}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onEdit(post)
            }
          : undefined
      }
      className="group relative rounded-lg border bg-white mb-1.5 px-2.5 py-2 cursor-pointer select-none transition-shadow hover:shadow-sm"
      style={{
        borderColor: '#e7e3d7',
        borderLeftWidth: 3,
        borderLeftColor: estadoColor,
        boxShadow: isOverlay ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
      }}
    >
      {/* Top row: format + time */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ background: `${estadoColor}18`, color: estadoColor }}
        >
          {post.formato ? FORMATO_SHORT[post.formato] || post.formato : '—'}
        </span>
        {time && (
          <span className="text-[10px] tabular-nums" style={{ color: '#9a877d' }}>
            {time}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-xs leading-snug line-clamp-2" style={{ color: '#282727' }}>
        {post.titulo || <span style={{ color: '#9a877d' }}>Sin título</span>}
      </p>

      {/* Bottom icons */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {post.caption && (
          <span title="Tiene caption" style={{ color: '#9a877d' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
        )}
        {post.linkMaterial && (
          <span title="Tiene link" style={{ color: '#9a877d' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
        )}
      </div>
    </div>
  )
}
