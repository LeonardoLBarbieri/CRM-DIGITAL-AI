import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { writeFile } from 'fs/promises'
import path from 'path'
// @ts-ignore
const pdfParse = require('pdf-parse');
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ properties })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar empreendimentos.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "GERENTE") {
      return NextResponse.json({ error: 'Apenas gerentes podem cadastrar.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    
    if (!file || !name) {
      return NextResponse.json({ error: 'Arquivo e nome são obrigatórios.' }, { status: 400 })
    }

    // 1. Salvar o arquivo localmente
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = Date.now() + '-' + file.name.replaceAll(' ', '_')
    // Na vida real usaríamos S3, mas aqui usamos a pasta public para MVP
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    
    // Garante que o diretorio existe
    await require('fs').promises.mkdir(uploadDir, { recursive: true }).catch(console.error)
    
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    const publicUrl = `/uploads/${filename}`

    // 2. Extrair texto (somente para PDFs neste MVP)
    let extractedText = ""
    if (file.type === 'application/pdf') {
      try {
        const data = await pdfParse(buffer)
        extractedText = data.text.substring(0, 5000) // limitando o texto
      } catch (err) {
        console.error("Erro ao ler PDF:", err)
      }
    }

    // 3. Resumir Tópicos com OpenAI
    let keyTopics = "Diferenciais não identificados."
    if (extractedText) {
      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um assistente imobiliário. Leia o texto extraído do material do empreendimento e liste em tópicos curtos os principais diferenciais (lazer, localização, metragem, quartos). Formate em JSON string array." },
            { role: "user", content: extractedText }
          ]
        })
        keyTopics = aiResponse.choices[0].message.content || keyTopics
      } catch(e) {
         console.error("OpenAI erro:", e)
      }
    }

    // 4. Salvar no banco
    const property = await prisma.property.create({
      data: {
        name,
        filePath: publicUrl,
        keyTopics: keyTopics,
      }
    })

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao cadastrar empreendimento.' }, { status: 500 })
  }
}
