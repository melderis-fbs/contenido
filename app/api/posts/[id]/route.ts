import { NextRequest, NextResponse } from 'next/server'
import { updatePost, archivePost } from '@/lib/notion'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const post = await updatePost(id, body)
    return NextResponse.json({ post })
  } catch (error) {
    const msg = (error as { message?: string })?.message ?? 'Error desconocido'
    console.error('Error updating post:', error)
    return NextResponse.json({ error: `No se pudo actualizar: ${msg}` }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await archivePost(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'No se pudo borrar el contenido' }, { status: 500 })
  }
}
