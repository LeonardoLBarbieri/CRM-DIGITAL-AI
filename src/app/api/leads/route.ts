import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// ─────────────────────────────────────────────
// GET /api/leads?status=&temperature=&page=&limit=
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    // Auth temporariamente desabilitado
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    // }

    const { searchParams } = new URL(req.url)

    const status      = searchParams.get('status')      || undefined
    const temperature = searchParams.get('temperature') || undefined
    const page        = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit       = Math.max(1, parseInt(searchParams.get('limit') || '50', 10))
    const skip        = (page - 1) * limit

    const where: any = {
      ...(status      ? { status }      : {}),
      ...(temperature ? { temperature } : {}),
    }

    // Se for corretor, filtra apenas os leads dele. Se for gerente, vê todos.
    // if ((session.user as any).role === "CORRETOR") {
    //   where.brokerId = (session.user as any).id;
    // }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { messages: true, tasks: true },
          },
          // próxima tarefa pendente
          tasks: {
            where:   { status: 'pendente' },
            orderBy: { dueAt: 'asc' },
            take: 1,
          },
          // mensagens não lidas (aproximação: sender = 'lead')
          messages: {
            where: { sender: 'lead' },
            select: { id: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ])

    // normaliza: troca messages[] pela contagem de não-lidas
    const normalized = leads.map(({ messages, ...lead }) => ({
      ...lead,
      unreadCount: messages.length,
    }))

    return NextResponse.json({ leads: normalized, total, page, limit })
  } catch (error) {
    console.error('GET /api/leads error:', error)
    return NextResponse.json({ error: 'Erro ao buscar leads.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// POST /api/leads  – criar lead
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const missingFields: string[] = []
    if (!body.name) missingFields.push('name')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.', fields: missingFields },
        { status: 400 },
      )
    }

    const lead = await prisma.lead.create({
      data: {
        name:          body.name,
        phone:         body.phone         ?? null,
        whatsapp:      body.whatsapp      ?? null,
        email:         body.email         ?? null,
        city:          body.city          ?? null,
        neighborhood:  body.neighborhood  ?? null,
        status:        body.status        ?? 'Lead Novo',
        temperature:   body.temperature   ?? 'Frio',
        incomeRange:   body.incomeRange   ?? null,
        hasFgts:       body.hasFgts       ?? false,
        downPayment:   body.downPayment   ?? null,
        creditApproved:body.creditApproved ?? false,
        propertyType:  body.propertyType  ?? null,
        desiredArea:   body.desiredArea   ?? null,
        priceMin:      body.priceMin      ?? null,
        priceMax:      body.priceMax      ?? null,
        region:        body.region        ?? null,
        bedrooms:      body.bedrooms      ?? null,
        parkingSpots:  body.parkingSpots  ?? null,
        development:   body.development   ?? null,
        budget:        body.budget        ?? null,
        notes:         body.notes         ?? null,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('POST /api/leads error:', error)
    return NextResponse.json({ error: 'Erro ao criar lead.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// PUT /api/leads  – atualizar lead (qualquer campo)
// ─────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do lead é obrigatório.' }, { status: 400 })
    }

    // busca o lead atual para detectar mudança de status
    const current = await prisma.lead.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
    }

    const statusChanged = fields.status && fields.status !== current.status

    // monta objeto de atualização com apenas os campos permitidos do modelo Lead
    const allowedFields = [
      'name', 'phone', 'whatsapp', 'email', 'city', 'neighborhood',
      'status', 'temperature', 'incomeRange', 'hasFgts', 'downPayment',
      'creditApproved', 'propertyType', 'desiredArea', 'priceMin', 'priceMax',
      'region', 'bedrooms', 'parkingSpots', 'development', 'budget', 'notes', 'brokerId'
    ]

    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in fields) data[key] = fields[key]
    }

    // executa atualização e (se necessário) criação de histórico em transação
    const updatedLead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({ where: { id }, data })

      if (statusChanged) {
        await tx.leadHistory.create({
          data: {
            leadId:     id,
            fromStatus: current.status,
            toStatus:   fields.status as string,
            changedBy:  'broker',
          },
        })
      }

      return updated
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('PUT /api/leads error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar lead.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// DELETE /api/leads?id=
// ─────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do lead é obrigatório.' }, { status: 400 })
    }

    // onDelete: Cascade garante que messages, history e tasks são removidos
    await prisma.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/leads error:', error)
    return NextResponse.json({ error: 'Erro ao deletar lead.' }, { status: 500 })
  }
}
