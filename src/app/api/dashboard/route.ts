import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { LEAD_STATUSES, type DashboardMetrics, type LeadStatus } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? 'month'

    // 1. Determinar startDate baseado no period
    const now = new Date()
    let startDate: Date

    if (period === '3months') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 90)
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1) // 1 de janeiro do ano atual
    } else {
      // 'month' ou padrão
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
    }

    // Início do dia de hoje
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // Início da semana (últimos 7 dias)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)

    // Início dos últimos 30 dias (para dailyNewLeads)
    const last30DaysStart = new Date(now)
    last30DaysStart.setDate(last30DaysStart.getDate() - 29)
    last30DaysStart.setHours(0, 0, 0, 0)

    // 2. Buscar dados do Prisma em paralelo
    const [
      totalLeads,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      pendingVisits,
      openProposals,
      closedThisMonth,
      estimatedRevenueLeads,
      realizedRevenueLeads,
      allLeadsForFunnel,
      allLeadsLast30Days,
    ] = await Promise.all([
      // totalLeads: count de todos os leads
      prisma.lead.count(),

      // leadsToday: leads criados hoje
      prisma.lead.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // leadsThisWeek: leads criados nos últimos 7 dias
      prisma.lead.count({
        where: { createdAt: { gte: weekStart } },
      }),

      // leadsThisMonth: leads criados no período selecionado
      prisma.lead.count({
        where: { createdAt: { gte: startDate } },
      }),

      // pendingVisits: leads com status 'Visita Agendada'
      prisma.lead.count({
        where: { status: 'Visita Agendada' },
      }),

      // openProposals: leads com status 'Proposta Enviada'
      prisma.lead.count({
        where: { status: 'Proposta Enviada' },
      }),

      // closedThisMonth: 'Venda Concluída' no período
      prisma.lead.count({
        where: {
          status: 'Venda Concluída',
          createdAt: { gte: startDate },
        },
      }),

      // estimatedRevenue: soma de priceMax dos leads em pipeline
      prisma.lead.findMany({
        where: {
          status: {
            in: [
              'Proposta Enviada',
              'Aguardando Resposta',
              'Reserva Efetuada',
              'Contrato Assinado',
              'Venda Concluída',
            ],
          },
        },
        select: { priceMax: true },
      }),

      // realizedRevenue: soma de priceMax de 'Venda Concluída'
      prisma.lead.findMany({
        where: { status: 'Venda Concluída' },
        select: { priceMax: true },
      }),

      // funnelDistribution: todos os leads com status (para contagem por status)
      prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // dailyNewLeads: leads criados nos últimos 30 dias
      prisma.lead.findMany({
        where: { createdAt: { gte: last30DaysStart } },
        select: { createdAt: true },
      }),
    ])

    // 3. Calcular métricas derivadas

    // conversionRate
    const conversionRate =
      leadsThisMonth > 0
        ? Math.round((closedThisMonth / leadsThisMonth) * 100 * 100) / 100
        : 0

    // estimatedRevenue
    const estimatedRevenue = estimatedRevenueLeads.reduce(
      (sum, lead) => sum + (lead.priceMax ?? 0),
      0
    )

    // realizedRevenue
    const realizedRevenue = realizedRevenueLeads.reduce(
      (sum, lead) => sum + (lead.priceMax ?? 0),
      0
    )

    // funnelDistribution: mapear todos os 12 status
    const funnelDistribution: Partial<Record<LeadStatus, number>> = {}
    for (const status of LEAD_STATUSES) {
      const entry = allLeadsForFunnel.find((g) => g.status === status)
      funnelDistribution[status] = entry?._count.id ?? 0
    }

    // dailyNewLeads: para cada dia nos últimos 30 dias
    const dailyNewLeads: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(day.getDate() - i)
      day.setHours(0, 0, 0, 0)

      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)

      const dateStr = day.toISOString().slice(0, 10) // 'YYYY-MM-DD'

      const count = allLeadsLast30Days.filter((lead) => {
        const d = new Date(lead.createdAt)
        return d >= day && d < nextDay
      }).length

      dailyNewLeads.push({ date: dateStr, count })
    }

    // 4. Montar resposta
    const metrics: DashboardMetrics = {
      totalLeads,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      pendingVisits,
      openProposals,
      closedThisMonth,
      conversionRate,
      estimatedRevenue,
      realizedRevenue,
      funnelDistribution,
      dailyNewLeads,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar métricas do dashboard' },
      { status: 500 }
    )
  }
}
