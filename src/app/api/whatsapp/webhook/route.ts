import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  sendWhatsAppMessage,
  getConfig,
  getBusinessHoursConfig,
  isWithinBusinessHours,
} from '@/lib/whatsapp'
import { renderTemplate } from '@/lib/utils'
import type { WebhookEntry } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// GET — verificação do webhook Meta
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const record = await prisma.systemConfig.findUnique({
    where: { key: 'whatsapp.verifyToken' },
  })
  const verifyToken = record?.value

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — receber eventos do WhatsApp
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { object?: string; entry?: WebhookEntry[] }

  try {
    body = (await request.json()) as { object?: string; entry?: WebhookEntry[] }
  } catch {
    // Body inválido — retornar 200 para evitar retry da Meta
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // Sem entry → retornar 200 imediatamente
  if (!body.entry || body.entry.length === 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const value = change.value

      // ── Processar mensagens recebidas ──────────────────────────────────────
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          if (message.type !== 'text' || !message.text?.body) continue

          const from = message.from
          const messageBody = message.text.body

          // Buscar nome do contato na notificação
          const contact = value.contacts?.find((c) => c.wa_id === from)
          const contactName = contact?.profile.name ?? null

          // Buscar lead existente
          let lead = await prisma.lead.findFirst({
            where: { OR: [{ phone: from }, { whatsapp: from }] },
          })

          if (!lead) {
            // Criar novo lead
            lead = await prisma.lead.create({
              data: {
                name: contactName || from,
                phone: from,
                whatsapp: from,
                status: 'Lead Novo',
                temperature: 'Frio',
              },
            })

            // Criar tarefa automática de retorno se automação habilitada
            const enableAutoTask = await getConfig('automation.enableAutoTask')
            if (enableAutoTask === 'true') {
              await prisma.task.create({
                data: {
                  leadId: lead.id,
                  type: 'ligar',
                  dueAt: new Date(Date.now() + 30 * 60 * 1000),
                },
              })
            }

            // Verificar horário comercial e enviar mensagem automática
            const now = new Date()
            const businessHoursConfig = await getBusinessHoursConfig()
            const withinHours = isWithinBusinessHours(now, businessHoursConfig)

            const brokerName = await getConfig('whatsapp.brokerName')
            const templateVars = {
              nome: contactName || from,
              corretor: brokerName ?? '',
            }

            if (withinHours) {
              const enableWelcome = await getConfig('automation.enableWelcome')
              if (enableWelcome === 'true') {
                const welcomeTemplate = await getConfig('automation.welcomeMessage')
                if (welcomeTemplate) {
                  const welcomeText = renderTemplate(welcomeTemplate, templateVars)
                  try {
                    const { messageId } = await sendWhatsAppMessage(from, welcomeText)
                    await prisma.whatsAppMessage.create({
                      data: {
                        leadId: lead.id,
                        body: welcomeText,
                        sender: 'system',
                        status: 'enviada',
                        whatsappMessageId: messageId,
                        isAutomated: true,
                      },
                    })
                  } catch {
                    // Erro ao enviar boas-vindas — continuar sem interromper o fluxo
                  }
                }
              }
            } else {
              const enableOutOfHours = await getConfig('automation.enableOutOfHours')
              if (enableOutOfHours === 'true') {
                const outOfHoursTemplate = await getConfig('automation.outOfHoursMessage')
                if (outOfHoursTemplate) {
                  const outOfHoursText = renderTemplate(outOfHoursTemplate, templateVars)
                  try {
                    const { messageId } = await sendWhatsAppMessage(from, outOfHoursText)
                    await prisma.whatsAppMessage.create({
                      data: {
                        leadId: lead.id,
                        body: outOfHoursText,
                        sender: 'system',
                        status: 'enviada',
                        whatsappMessageId: messageId,
                        isAutomated: true,
                      },
                    })
                  } catch {
                    // Erro ao enviar mensagem de ausência — continuar sem interromper o fluxo
                  }
                }
              }
            }
          }

          // Registrar mensagem recebida do lead
          await prisma.whatsAppMessage.create({
            data: {
              leadId: lead.id,
              body: messageBody,
              sender: 'lead',
              status: 'entregue',
              whatsappMessageId: message.id,
            },
          })
        }
      }

      // ── Processar eventos de status (delivered / read) ─────────────────────
      if (value.statuses && value.statuses.length > 0) {
        for (const statusEvent of value.statuses) {
          if (statusEvent.status !== 'delivered' && statusEvent.status !== 'read') {
            continue
          }

          const newStatus = statusEvent.status === 'delivered' ? 'entregue' : 'lida'

          const existingMessage = await prisma.whatsAppMessage.findFirst({
            where: { whatsappMessageId: statusEvent.id },
          })

          if (existingMessage) {
            await prisma.whatsAppMessage.update({
              where: { id: existingMessage.id },
              data: { status: newStatus },
            })
          }
        }
      }
    }
  }

  // Sempre retornar 200 para evitar retry da Meta
  return NextResponse.json({ ok: true }, { status: 200 })
}
