import prisma from '@/lib/prisma'
import { sendWhatsAppMessage, getConfig } from '@/lib/whatsapp'
import { renderTemplate } from '@/lib/utils'

const DEFAULT_FOLLOW_UP_MESSAGE =
  'Olá {nome}, tudo bem? Passando para verificar se ainda possui interesse em adquirir um imóvel. Estou à disposição.'

/**
 * Verifica leads inativos e envia follow-up automático.
 * Retorna o número de leads processados.
 *
 * Um lead é considerado inativo quando:
 *  - Possui pelo menos uma mensagem registrada
 *  - A mensagem mais recente tem timestamp anterior ao cutoff (now - followUpDays)
 *  - O status NÃO é "Venda Concluída" nem "Lead Perdido"
 */
export async function checkAndSendFollowUps(): Promise<number> {
  // 1. Verificar se a automação de follow-up está habilitada
  const enabled = await getConfig('automation.enableFollowUp')
  if (enabled !== 'true') {
    return 0
  }

  // 2. Buscar número de dias de inatividade (padrão: 3)
  const daysRaw = await getConfig('automation.followUpDays')
  const followUpDays = daysRaw ? parseInt(daysRaw, 10) : 3
  const days = isNaN(followUpDays) || followUpDays <= 0 ? 3 : followUpDays

  // 3. Calcular cutoff
  const now = Date.now()
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000)

  // 4. Buscar leads com mensagem mais recente antes do cutoff,
  //    excluindo status "Venda Concluída" e "Lead Perdido"
  const inactiveLeads = await prisma.lead.findMany({
    where: {
      status: {
        notIn: ['Venda Concluída', 'Lead Perdido'],
      },
      messages: {
        some: {}, // tem pelo menos uma mensagem
      },
    },
    include: {
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  })

  // Filtrar apenas leads cuja mensagem mais recente é anterior ao cutoff
  const leadsToFollowUp = inactiveLeads.filter((lead) => {
    const lastMessage = lead.messages[0]
    return lastMessage && lastMessage.timestamp < cutoff
  })

  // 5. Processar cada lead
  let processed = 0

  for (const lead of leadsToFollowUp) {
    try {
      // Buscar template de follow-up (com fallback para mensagem padrão)
      const templateRaw = await getConfig('automation.followUpMessage')
      const template = templateRaw || DEFAULT_FOLLOW_UP_MESSAGE

      // Renderizar template com o nome do lead
      const message = renderTemplate(template, { nome: lead.name })

      // Enviar mensagem via WhatsApp
      const phone = lead.whatsapp || lead.phone
      await sendWhatsAppMessage(phone as string, message)

      // Registrar a mensagem enviada no banco
      await prisma.whatsAppMessage.create({
        data: {
          leadId: lead.id,
          body: message,
          sender: 'system',
          status: 'enviada',
          isAutomated: true,
        },
      })

      processed++
    } catch (err) {
      // Logar erro e continuar para o próximo lead sem interromper o loop
      console.error(
        `[automation] Erro ao enviar follow-up para lead ${lead.id} (${lead.name}):`,
        err,
      )
    }
  }

  return processed
}
