import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { classifyTaskTiming } from '@/lib/utils'

// ─────────────────────────────────────────────
// GET /api/leads/[id] – lead completo com relações
// ─────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
        tasks: {
          orderBy: { dueAt: 'asc' },
          include: {
            lead: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    // Adiciona campo `timing` em cada tarefa
    const tasksWithTiming = lead.tasks.map((task) => ({
      ...task,
      timing: classifyTaskTiming(task.dueAt),
    }))

    return NextResponse.json({ ...lead, tasks: tasksWithTiming })
  } catch (error) {
    console.error('GET /api/leads/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar lead.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// DELETE /api/leads/[id] – exclui um lead
// ─────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await prisma.lead.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/leads/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao excluir lead.' }, { status: 500 })
  }
}
