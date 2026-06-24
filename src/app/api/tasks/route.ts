import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { classifyTaskTiming } from '@/lib/utils'

// GET /api/tasks?leadId=&status=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const tasks = await prisma.task.findMany({
      where: {
        ...(leadId ? { leadId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { dueAt: 'asc' },
      include: {
        lead: {
          select: { id: true, name: true },
        },
      },
    })

    const tasksWithTiming = tasks.map((task) => ({
      ...task,
      timing: classifyTaskTiming(task.dueAt),
    }))

    return NextResponse.json(tasksWithTiming)
  } catch (error) {
    console.error('[GET /api/tasks]', error)
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, type, dueAt, description, status } = body

    if (!leadId || !type || !dueAt) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: leadId, type, dueAt' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    const task = await prisma.task.create({
      data: {
        leadId,
        type,
        dueAt: new Date(dueAt),
        description: description ?? null,
        status: status ?? 'pendente',
      },
      include: {
        lead: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      { ...task, timing: classifyTaskTiming(task.dueAt) },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/tasks]', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}

// PUT /api/tasks  — body: { id, ...updates }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Campo obrigatório: id' }, { status: 400 })
    }

    // Se estiver concluindo, registra completedAt
    if (updates.status === 'concluida') {
      updates.completedAt = new Date()
    }

    // Converte dueAt para Date se vier como string
    if (updates.dueAt) {
      updates.dueAt = new Date(updates.dueAt)
    }

    const task = await prisma.task.update({
      where: { id },
      data: updates,
      include: {
        lead: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ ...task, timing: classifyTaskTiming(task.dueAt) })
  } catch (error) {
    console.error('[PUT /api/tasks]', error)
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
  }
}

// DELETE /api/tasks?id=
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Parâmetro obrigatório: id' }, { status: 400 })
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/tasks]', error)
    return NextResponse.json({ error: 'Erro ao deletar tarefa' }, { status: 500 })
  }
}
