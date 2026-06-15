import { NextRequest, NextResponse } from 'next/server'
import { getWeekReport, saveWeekReport } from '@/lib/notion'

export async function GET(request: NextRequest) {
  const week = request.nextUrl.searchParams.get('week')
  if (!week) return NextResponse.json({ error: 'week requerido' }, { status: 400 })

  if (!process.env.NOTION_REPORTS_PAGE_ID) {
    return NextResponse.json({ configured: false, report: null })
  }

  try {
    const report = await getWeekReport(week)
    return NextResponse.json({ configured: true, report })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error leyendo el reporte' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.NOTION_REPORTS_PAGE_ID) {
    return NextResponse.json({ error: 'NOTION_REPORTS_PAGE_ID no configurado' }, { status: 400 })
  }
  try {
    const { weekStart, content } = await request.json()
    if (!weekStart || !content?.trim()) {
      return NextResponse.json({ error: 'weekStart y content requeridos' }, { status: 400 })
    }
    await saveWeekReport(weekStart, content)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error guardando el reporte'
    console.error(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
