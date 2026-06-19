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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNumber(prop: any): number | null {
  if (prop?.type === 'number') return prop.number ?? null
  return null
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
    notasVicky: extractRichText(p['Notas Vicky']),
    notionUrl: page.url,
    alcance: extractNumber(p['Alcance']),
    guardados: extractNumber(p['Guardados']),
    compartidos: extractNumber(p['Compartidos']),
    comentarios: extractNumber(p['Comentarios']),
    leadMagnets: extractNumber(p['Lead magnets']),
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
  if (data.notasVicky) {
    props['Notas Vicky'] = { rich_text: toRichText(data.notasVicky) }
  }
  if (data.alcance !== undefined) {
    props['Alcance'] = { number: data.alcance }
  }
  if (data.guardados !== undefined) {
    props['Guardados'] = { number: data.guardados }
  }
  if (data.compartidos !== undefined) {
    props['Compartidos'] = { number: data.compartidos }
  }
  if (data.comentarios !== undefined) {
    props['Comentarios'] = { number: data.comentarios }
  }
  if (data.leadMagnets !== undefined) {
    props['Lead magnets'] = { number: data.leadMagnets }
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

// Optional Notion properties that may not exist in all database schemas.
// If Notion rejects the update mentioning one of these, we retry without them.
const OPTIONAL_PROPS = ['Notas Vicky', 'Alcance', 'Guardados', 'Compartidos', 'Comentarios', 'Lead magnets']

export async function updatePost(id: string, data: UpdatePostInput): Promise<Post> {
  const properties = buildProperties(data)
  try {
    const page = await notion.pages.update({
      page_id: id,
      properties: properties as Parameters<typeof notion.pages.update>[0]['properties'],
    })
    return mapPageToPost(page as PageObjectResponse)
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? ''
    const badProp = OPTIONAL_PROPS.find((p) => msg.includes(p))
    if (!badProp) throw e
    // Strip the offending property and retry once
    const safe = { ...properties } as Record<string, unknown>
    delete safe[badProp]
    const page = await notion.pages.update({
      page_id: id,
      properties: safe as Parameters<typeof notion.pages.update>[0]['properties'],
    })
    return mapPageToPost(page as PageObjectResponse)
  }
}

export async function archivePost(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, in_trash: true })
}

// ─── Weekly reports ───────────────────────────────────────────────────────────

const REPORTS_PAGE_ID = process.env.NOTION_REPORTS_PAGE_ID

function weekReportTitle(weekStart: string): string {
  return `Reporte ${weekStart}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textToNotionBlocks(text: string): any[] {
  return text
    .split(/\n{2,}/)
    .filter((s) => s.trim())
    .map((para) => ({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: toRichText(para) },
    }))
}

export async function getWeekReport(
  weekStart: string,
): Promise<{ id: string; content: string } | null> {
  if (!REPORTS_PAGE_ID) return null
  const title = weekReportTitle(weekStart)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRes: any = await notion.blocks.children.list({ block_id: REPORTS_PAGE_ID })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportBlock = listRes.results.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.type === 'child_page' && b.child_page?.title === title,
  )
  if (!reportBlock) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentRes: any = await notion.blocks.children.list({ block_id: reportBlock.id })
  const content = contentRes.results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b.type === 'paragraph')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.paragraph?.rich_text?.map((rt: any) => rt.plain_text).join('') ?? '')
    .filter(Boolean)
    .join('\n\n')

  return { id: reportBlock.id, content }
}

export async function saveWeekReport(weekStart: string, content: string): Promise<void> {
  if (!REPORTS_PAGE_ID) throw new Error('NOTION_REPORTS_PAGE_ID no configurado')
  const title = weekReportTitle(weekStart)
  const blocks = textToNotionBlocks(content)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRes: any = await notion.blocks.children.list({ block_id: REPORTS_PAGE_ID })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = listRes.results.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b: any) => b.type === 'child_page' && b.child_page?.title === title,
  )

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentRes: any = await notion.blocks.children.list({ block_id: existing.id })
    for (const block of contentRes.results) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await notion.blocks.delete({ block_id: (block as any).id })
    }
    await notion.blocks.children.append({
      block_id: existing.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: blocks as any,
    })
  } else {
    await notion.pages.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parent: { type: 'page_id', page_id: REPORTS_PAGE_ID } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: { title: { title: [{ text: { content: title } }] } } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: blocks as any,
    })
  }
}
