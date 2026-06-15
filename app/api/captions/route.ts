import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { titulo, canal, formato, pilar, notas } = await request.json()

    const canalInfo =
      canal === 'LinkedIn'
        ? 'LinkedIn (profesional, pensativo, 1500-2000 caracteres)'
        : canal === 'TikTok'
          ? 'TikTok (breve, hook fuerte, máx 500 caracteres)'
          : `${canal} (Instagram, conversacional, entre 300-800 caracteres)`

    const prompt = `Sos el asistente de contenido de Founders / Vicky Becci, una mentora argentina para coaches y consultores que quieren crecer su negocio.

Contexto del post:
- Canal: ${canalInfo}
- Formato: ${formato || 'no especificado'}
- Pilar de contenido: ${pilar || 'no especificado'}
- Hook / título: "${titulo}"
${notas ? `- Notas adicionales: ${notas}` : ''}

Tono y reglas:
- Rioplatense argentino: "vos", "te vas a", "hacés", etc.
- Directo, sin rodeos. Sin corporativo. Sin clichés como "en el mundo actual" o "en este panorama".
- Sentence case: solo mayúscula al inicio y en nombres propios.
- Sin emojis a menos que sean muy naturales para el canal (Instagram sí, LinkedIn no).
- Terminá con un CTA claro: una pregunta directa o una acción concreta.
- Párrafos cortos. Líneas de respiro entre ideas.

Escribí el caption completo para este post. Solo el texto del caption, sin explicaciones ni comentarios adicionales.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const caption = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return NextResponse.json({ caption })
  } catch (error) {
    console.error('Error generating caption:', error)
    return NextResponse.json({ error: 'No se pudo generar el caption' }, { status: 500 })
  }
}
