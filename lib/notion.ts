import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import type { Post, Canal, Formato, Estado, Pilar, CreatePostInput, UpdatePostInput } from './types'
import { toRichText } from './utils'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRichText(prop: any): string {
  if (prop?.type === 'rich_text') {
    return prop.rich_text.map((t: { plain_text: string }) => t.plain_text).join('')
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(prop: any): string {
  if (prop?.type === 'title') {
    return prop.title.map((t: { plain_text: string }) => t.plain_text).join('')
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSelect(prop: any): string | null {
  return prop?.select?.name ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDate(prop: any): string | null {
  return prop?.date?.start ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUrl(prop: any): string | null {
  return prop?.url ?? null
}

export function mapPageToPost(page: PageObjectResponse): Post {
  const p = page.properties
  return {
    id: page.id,
    titulo: extractTitle(p['Título']),
    canal: extractSelect(p['Canal']) as Canal | null,
    formato: extractSelect(p['Formato']) as Formato | null,
    estado: extractSelect(p['Estado']) as Estado | null,
    pilar: extractSelect(p['Pilar']) as Pilar | null,
    fecha: extractDate(p['Fecha']),
    caption: extractRichText(p['Caption']),
    hashtags: extractRichText(p['Hashtags']),
    linkMaterial: extractUrl(p['Link material']),
    linkPublicado: extractUrl(p['Link publicado']),
    notas: extractRichText(p['Notas']),
    notionUrl: page.url,
  }
}

function buildProperties(data: Partial<CreatePostInput>): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  if (data.titulo !== undefined) {
    props['Título'] = { title: [{ text: { content: data.titulo } }] }
  }
  if (data.canal !== undefined) {
    props['Canal'] = data.canal ? { select: { name: data.canal } } : { select: null }
  }
  if (data.formato !== undefined) {
    props['Formato'] = data.formato ? { select: { name: data.formato } } : { select: null }
  }
  if (data.estado !== undefined) {
    props['Estado'] = data.estado ? { select: { name: data.estado } } : { select: null }
  }
  if (data.pilar !== undefined) {
    props['Pilar'] = data.pilar ? { select: { name: data.pilar } } : { select: null }
  }
  if (data.fecha !== undefined) {
    props['Fecha'] = data.fecha ? { date: { start: data.fecha } } : { date: null }
  }
  if (data.caption !== undefined) {
    props['Caption'] = { rich_text: toRichText(data.caption) }
  }
  if (data.hashtags !== undefined) {
    props['Hashtags'] = { rich_text: toRichText(data.hashtags) }
  }
  if (data.linkMaterial !== undefined) {
    props['Link material'] = { url: data.linkMaterial || null }
  }
  if (data.linkPublicado !== undefined) {
    props['Link publicado'] = { url: data.linkPublicado || null }
  }
  if (data.notas !== undefined) {
    props['Notas'] = { rich_text: toRichText(data.notas) }
  }

  return props
}

function isFullPage(
  page: PageObjectResponse | PartialPageObjectResponse,
): page is PageObjectResponse {
  return 'properties' in page
}

export async function getAllPosts(): Promise<Post[]> {
  const posts: Post[] = []
  let cursor: string | undefined

  do {
    // Notion SDK v5: databases.query → dataSources.query
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      start_cursor: cursor,
      page_size: 100,
      in_trash: false,
      sorts: [{ property: 'Fecha', direction: 'ascending' }],
    })

    for (const page of response.results) {
      if (isFullPage(page as PageObjectResponse | PartialPageObjectResponse)) {
        posts.push(mapPageToPost(page as PageObjectResponse))
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  return posts
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  const page = await notion.pages.create({
    parent: { data_source_id: DATA_SOURCE_ID, type: 'data_source_id' },
    properties: buildProperties(data) as Parameters<typeof notion.pages.create>[0]['properties'],
  })
  return mapPageToPost(page as PageObjectResponse)
}

export async function updatePost(id: string, data: UpdatePostInput): Promise<Post> {
  const page = await notion.pages.update({
    page_id: id,
    properties: buildProperties(data) as Parameters<typeof notion.pages.update>[0]['properties'],
  })
  return mapPageToPost(page as PageObjectResponse)
}

export async function archivePost(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true })
}
