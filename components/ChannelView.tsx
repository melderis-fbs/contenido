'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Post, Canal } from '@/lib/types'
import { CANALES, CANAL_COLORS, ESTADO_COLORS, ESTADOS_COMPLETOS } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface Props {
  posts: Post[]
  onEditPost: (post: Post) => void
}

export default function ChannelView({ posts, onEditPost }: Props) {
  const byCanal = useMemo(() => {
    const map: Record<Canal, Post[]> = {
      'IG Founders': [],
      'IG Vicky': [],
      LinkedIn: [],
      TikTok: [],
      YouTube: [],
    }
    for (const post of posts) {
      if (post.canal) map[post.canal].push(post)
    }
    return map
  }, [posts])

  return (
    <div className="px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 pb-10">
      {CANALES.map((canal) => {
        const canalPosts = byCanal[canal].sort(
          (a, b) => (a.fecha || '').localeCompare(b.fecha || ''),
        )
        const completas = canalPosts.filter((p) => p.estado && ESTADOS_COMPLETOS.includes(p.estado)).length
        return (
          <ChannelColumn
            key={canal}
            canal={canal}
            posts={canalPosts}
            completas={completas}
            onEditPost={onEditPost}
          />
        )
      })}
    </div>
  )
}

function ChannelColumn({
  canal,
  posts,
  completas,
  onEditPost,
}: {
  canal: Canal
  posts: Post[]
  completas: number
  onEditPost: (post: Post) => void
}) {
  const color = CANAL_COLORS[canal]

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold">{canal}</span>
        </div>
        <span className="text-xs tabular-nums" style={{ color: '#9a877d' }}>
          {completas}/{posts.length}
        </span>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-2">
        {posts.length === 0 && (
          <div
            className="rounded-xl border-2 border-dashed flex items-center justify-center py-8 text-sm"
            style={{ borderColor: '#e7e3d7', color: '#9a877d' }}
          >
            Sin contenido
          </div>
        )}
        {posts.map((post) => (
          <ChannelCard key={post.id} post={post} onClick={() => onEditPost(post)} />
        ))}
      </div>
    </div>
  )
}

function ChannelCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const estadoColor = post.estado ? ESTADO_COLORS[post.estado] : '#e7e3d7'
  const time = formatTime(post.fecha)

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border bg-white p-3 transition-shadow hover:shadow-sm"
      style={{ borderColor: '#e7e3d7', borderLeftWidth: 3, borderLeftColor: estadoColor }}
    >
      {/* Date + time */}
      <div className="text-[11px] mb-1.5" style={{ color: '#9a877d' }}>
        {post.fecha
          ? `${format(new Date(post.fecha), "d MMM", { locale: es })}${time ? ` · ${time}` : ''}`
          : 'Sin fecha'}
      </div>

      {/* Title */}
      <p className="text-sm leading-snug font-medium line-clamp-2">{post.titulo || '—'}</p>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {post.formato && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{ background: `${estadoColor}15`, color: estadoColor }}
          >
            {post.formato}
          </span>
        )}
        {post.estado && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: `${estadoColor}10`, color: estadoColor }}
          >
            {post.estado}
          </span>
        )}
        {post.pilar && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: '#c6b29715', color: '#9a877d' }}
          >
            {post.pilar}
          </span>
        )}
      </div>
    </button>
  )
}
