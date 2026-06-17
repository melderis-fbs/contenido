export type Canal = 'IG Founders' | 'IG Vicky' | 'LinkedIn' | 'TikTok' | 'YouTube'
export type Formato =
  | 'Reel'
  | 'Carrusel'
  | 'Imagen/Post'
  | 'Video'
  | 'Texto'
  | 'Story'
  | 'Recorte'
  | 'Testimonio'
export type Estado = 'Idea' | 'En producción' | 'Listo' | 'Programado' | 'Publicado'
export type Pilar =
  | 'Claridad y decisión'
  | 'Mentiras que te contás'
  | 'Miedo / prudencia'
  | 'Posicionamiento'
  | 'Tu historia'
  | 'Evolución'

export const CANALES: Canal[] = ['IG Founders', 'IG Vicky', 'LinkedIn', 'TikTok', 'YouTube']
export const FORMATOS: Formato[] = [
  'Reel',
  'Carrusel',
  'Imagen/Post',
  'Video',
  'Texto',
  'Story',
  'Recorte',
  'Testimonio',
]
export const ESTADOS: Estado[] = ['Idea', 'En producción', 'Listo', 'Programado', 'Publicado']
export const PILARES: Pilar[] = [
  'Claridad y decisión',
  'Mentiras que te contás',
  'Miedo / prudencia',
  'Posicionamiento',
  'Tu historia',
  'Evolución',
]

export const CANAL_COLORS: Record<Canal, string> = {
  'IG Founders': '#E1306C',
  'IG Vicky': '#8B3FB5',
  LinkedIn: '#0A66C2',
  TikTok: '#FE2C55',
  YouTube: '#FF0000',
}

export const ESTADO_COLORS: Record<Estado, string> = {
  Idea: '#9a877d',
  'En producción': '#E8A23D',
  Listo: '#1D9E75',
  Programado: '#378ADD',
  Publicado: '#6B7280',
}

export const CAPTION_LIMITS: Record<Canal, number> = {
  'IG Founders': 2200,
  'IG Vicky': 2200,
  LinkedIn: 3000,
  TikTok: 2200,
  YouTube: 5000,
}

export const ESTADOS_COMPLETOS: Estado[] = ['Listo', 'Programado', 'Publicado']

export interface Post {
  id: string
  titulo: string
  canal: Canal | null
  formato: Formato | null
  estado: Estado | null
  pilar: Pilar | null
  fecha: string | null
  caption: string
  hashtags: string
  linkMaterial: string | null
  linkPublicado: string | null
  notas: string
  notasVicky: string
  notionUrl: string
  // Métricas post-publicación
  alcance: number | null
  guardados: number | null
  compartidos: number | null
  comentarios: number | null
  leadMagnets: number | null
}

export type CreatePostInput = Omit<Post, 'id' | 'notionUrl'>
export type UpdatePostInput = Partial<CreatePostInput>

export interface WeekFilters {
  canales: Canal[]
  estados: Estado[]
  pilares: Pilar[]
  search: string
}
