import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { executeCampaign } from '@/lib/campaign'

// ─────────────────────────────────────────────
// GET /api/campaigns
// Lista campanhas com contagem de recipients
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { recipients: true },
        },
        recipients: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enriquecer cada campanha com contagens por status de recipient
    const result = campaigns.map(({ recipients, ...campaign }) => {
      const pendingCount = recipients.filter((r) => r.status === 'pending').length
      const sentCount    = recipients.filter((r) => r.status === 'sent').length
      const failedCount  = recipients.filter((r) => r.status === 'failed').length

      return {
        ...campaign,
        recipientStats: {
          pending: pendingCount,
          sent:    sentCount,
          failed:  failedCount,
        },
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/campaigns error:', error)
    return NextResponse.json({ error: 'Erro ao buscar campanhas.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// POST /api/campaigns
// Cria uma campanha, opcionalmente adiciona recipients e/ou dispara execução
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      name: string
      message: string
      scheduledAt?: string
      recipientLeadIds?: string[]
      segmentation?: {
        temperature?: string
        development?: string
        city?: string
      }
      action?: string
    }

    const { name, message, scheduledAt, recipientLeadIds, segmentation, action } = body

    // Validação dos campos obrigatórios
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.', fields: ['name', 'message'] },
        { status: 400 },
      )
    }

    // Criar a campanha
    const campaign = await prisma.campaign.create({
      data: {
        name,
        message,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'draft',
      },
    })

    // ── Adicionar recipients por IDs explícitos ──────────────────────────
    if (recipientLeadIds && recipientLeadIds.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: recipientLeadIds.map((leadId) => ({
          campaignId: campaign.id,
          leadId,
          status: 'pending',
        })),
      })
    }

    // ── Adicionar recipients por segmentação ────────────────────────────
    if (segmentation && Object.keys(segmentation).length > 0) {
      const where: Record<string, unknown> = {}

      if (segmentation.temperature) where.temperature = segmentation.temperature
      if (segmentation.development)  where.development = segmentation.development
      if (segmentation.city)         where.city        = segmentation.city

      const segmentedLeads = await prisma.lead.findMany({
        where,
        select: { id: true },
      })

      if (segmentedLeads.length > 0) {
        await prisma.campaignRecipient.createMany({
          data: segmentedLeads.map((lead) => ({
            campaignId: campaign.id,
            leadId:     lead.id,
            status:     'pending',
          })),
        })
      }
    }

    // ── Disparar execução assíncrona se action = 'start' ────────────────
    if (action === 'start') {
      // Fire-and-forget: não aguardar para responder imediatamente
      executeCampaign(campaign.id).catch((err) =>
        console.error(`executeCampaign(${campaign.id}) error:`, err),
      )
    }

    // Buscar campanha atualizada com contagens
    const created = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        _count: { select: { recipients: true } },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/campaigns error:', error)
    return NextResponse.json({ error: 'Erro ao criar campanha.' }, { status: 500 })
  }
}
