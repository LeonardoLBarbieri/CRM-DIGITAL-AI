import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { propertyName, keyTopics, style } = await req.json()

    if (!propertyName || !keyTopics) {
      return NextResponse.json({ error: 'Faltam parâmetros.' }, { status: 400 })
    }

    const systemPrompt = `Você é um Social Media especialista em mercado imobiliário.
O usuário vai fornecer o nome de um empreendimento, os diferenciais extraídos do material (Tópicos Chaves) e o estilo desejado.
Sua tarefa é criar 3 ideias diferentes de COPY para postagens no Instagram.
Escreva a copy pronta para uso, incluindo emojis e hashtags estratégicas.
Separe as ideias por "---".`

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Empreendimento: ${propertyName}\nDiferenciais: ${keyTopics}\nEstilo: ${style}` }
      ]
    })

    const rawContent = aiResponse.choices[0].message.content || ""
    const posts = rawContent.split("---").map(p => p.trim()).filter(p => p.length > 0)

    return NextResponse.json({ posts })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao gerar posts.' }, { status: 500 })
  }
}
