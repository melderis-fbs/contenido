import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAllPosts } from '@/lib/notion'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function slackBlocks(report: string, monthName: string, count: number) {
  // Split report into chunks of max 3000 chars for Slack
  const chunks: string[] = []
  for (let i = 0; i < report.length; i += 2900) {
    chunks.push(report.slice(i, i + 2900))
  }

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 Reporte mensual · ${monthName} · Founders`, emoji: true },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `${count} piezas publicadas ese mes` }],
    },
    { type: 'divider' },
    ...chunks.map((chunk) => ({
      type: 'section',
      text: { type: 'mrkdwn', text: chunk },
    })),
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { month, sendToSlack } = await request.json() // month = "2026-06"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Formato de mes inválido (esperado: YYYY-MM)' }, { status: 400 })
    }

    const [year, mon] = month.split('-').map(Number)
    const monthName = new Date(year, mon - 1).toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    })

    const allPosts = await getAllPosts()
    const monthPosts = allPosts.filter((p) => {
      if (p.estado !== 'Publicado' || !p.fecha) return false
      const d = new Date(p.fecha)
      return d.getFullYear() === year && d.getMonth() + 1 === mon
    })

    if (monthPosts.length === 0) {
      return NextResponse.json(
        { error: `No hay posts marcados como Publicado en ${monthName}` },
        { status: 400 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY no configurada. Agregala a tus variables de entorno.' },
        { status: 500 },
      )
    }

    const postsData = monthPosts.map((p) => ({
      fecha: p.fecha?.slice(0, 10),
      canal: p.canal,
      formato: p.formato,
      pilar: p.pilar,
      titulo: p.titulo,
      alcance: p.alcance,
      guardados: p.guardados,
      compartidos: p.compartidos,
      comentarios: p.comentarios,
      leadMagnets: p.leadMagnets,
    }))

    const hasMetrics = monthPosts.some(
      (p) =>
        p.alcance !== null ||
        p.guardados !== null ||
        p.compartidos !== null ||
        p.leadMagnets !== null,
    )

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Sos la analista de contenido de Founders / Vicky Becci, marca de mentoría para coaches y consultores en Argentina.

Analizá los datos de rendimiento del contenido publicado en ${monthName}:

${JSON.stringify(postsData, null, 2)}

${!hasMetrics ? '⚠️ Nota: las métricas numéricas están vacías. Hacé el análisis basándote en los datos disponibles (canal, formato, pilar, título) y aclaralo en el reporte.' : ''}

Respondé estas 4 preguntas con datos concretos (nombrá el título y las métricas cuando estén disponibles):

1. ¿Cuáles 3 piezas rindieron MEJOR y qué tienen en común?
2. ¿Cuáles 3 rindieron PEOR y qué tienen en común?
3. ¿Qué formato tracciona más en cada red?
4. ¿Qué contenido generó más lead magnets / consultas?

Cerrá con UNA recomendación accionable: "el mes que viene, más de X y menos de Y porque..."

Reglas de formato:
- Español rioplatense, directo, sin intro corporativa
- Usá bullets (*) y numeración
- Las métricas clave son guardados, compartidos y lead magnets — no los likes
- Máximo 1500 palabras en total`,
        },
      ],
    })

    const report = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    // Send to Slack
    let slackSent = false
    let slackError: string | undefined

    if (sendToSlack) {
      if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
        slackError = 'SLACK_BOT_TOKEN o SLACK_CHANNEL_ID no configurados'
      } else {
        try {
          const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel: process.env.SLACK_CHANNEL_ID,
              text: `📊 Reporte mensual Founders · ${monthName}`,
              blocks: slackBlocks(report, monthName, monthPosts.length),
            }),
          })
          const slackData = await slackRes.json()
          if (slackData.ok) {
            slackSent = true
          } else {
            slackError = `Slack error: ${slackData.error}`
          }
        } catch {
          slackError = 'No se pudo conectar con Slack'
        }
      }
    }

    return NextResponse.json({ report, posts: monthPosts, slackSent, slackError })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Error generando el reporte' }, { status: 500 })
  }
}
