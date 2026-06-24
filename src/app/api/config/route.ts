import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ─────────────────────────────────────────────
// GET /api/config
// Retorna todos os pares SystemConfig como Record<string, string>
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const rows = await prisma.systemConfig.findMany()

    const config: Record<string, string> = {}
    for (const { key, value } of rows) {
      config[key] = value
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('GET /api/config error:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// PUT /api/config
// Recebe Record<string, string> e faz upsert em lote
// ─────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const body: Record<string, string> = await req.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Body deve ser um objeto Record<string, string>.' },
        { status: 400 },
      )
    }

    const entries = Object.entries(body)

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.systemConfig.upsert({
          where:  { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )

    return NextResponse.json({ success: true, updated: entries.length })
  } catch (error) {
    console.error('PUT /api/config error:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 })
  }
}
