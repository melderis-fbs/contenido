import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, createPost } from '@/lib/notion'

export async function GET() {
  try {
    const posts = await getAllPosts()
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'No se pudieron cargar los contenidos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const post = await createPost(body)
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'No se pudo crear el contenido' }, { status: 500 })
  }
}
