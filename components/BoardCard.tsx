'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Post } from '@/lib/types'
import { ESTADO_COLORS, FORMATO_COLORS } from '@/lib/types'
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
  const formatoColor = post.formato ? FORMATO_COLORS[post.formato] : '#e7e3d7'
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
        borderLeftColor: formatoColor,
        boxShadow: isOverlay ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
      }}
    >
      {/* Top row: format badge + estado dot + time */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: `${formatoColor}18`, color: formatoColor }}
          >
            {post.formato ? FORMATO_SHORT[post.formato] || post.formato : '—'}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: estadoColor }}
            title={post.estado ?? ''}
          />
        </div>
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
        {post.notasVicky && (
          <span title="Tiene comentario de Vicky" style={{ color: '#F59E0B' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </span>
        )}
        {post.linkMaterial && (
          <span title="Tiene material" style={{ color: '#9a877d' }}>
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
