import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { renderTemplate } from '@/lib/utils'
import type { TemplateVars } from '@/lib/types'

export interface ImportedContact {
  name: string
  phone: string
}

export interface ImportResult {
  valid: ImportedContact[]
  skipped: number
}

/**
 * Parseia CSV ou XLSX e extrai contatos válidos.
 *
 * @param buffer   - ArrayBuffer do arquivo
 * @param mimeType - 'text/csv' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 * @returns { valid: ImportedContact[], skipped: number }
 */
export function importContacts(buffer: ArrayBuffer, mimeType: string): ImportResult {
  // Parsear o buffer com xlsx (suporta tanto CSV quanto XLSX)
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Pegar a primeira sheet
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  // Converter para array de arrays (header: 1 → primeira linha como dados, não como chave)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

  if (rows.length === 0) {
    return { valid: [], skipped: 0 }
  }

  // Primeira linha = headers
  const headers = (rows[0] as unknown[]).map((h) =>
    String(h ?? '').trim().toLowerCase(),
  )

  // Detectar índices das colunas de nome e telefone
  const nameIndex = headers.findIndex((h) =>
    ['nome', 'name'].includes(h),
  )
  const phoneIndex = headers.findIndex((h) =>
    ['telefone', 'phone', 'whatsapp'].includes(h),
  )

  // Sem coluna de telefone → nenhum contato válido
  if (phoneIndex === -1) {
    const dataRows = rows.length > 1 ? rows.length - 1 : 0
    return { valid: [], skipped: dataRows }
  }

  const valid: ImportedContact[] = []
  let skipped = 0

  // Conjunto de telefones já vistos (deduplicação interna ao arquivo)
  const seen = new Set<string>()

  // Linhas de dados (pular o header na posição 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]

    const rawPhone = String(row[phoneIndex] ?? '').trim()
    const rawName = nameIndex !== -1 ? String(row[nameIndex] ?? '').trim() : ''

    // Validar telefone: remover não-numéricos e checar mínimo de 10 dígitos
    const digits = rawPhone.replace(/\D/g, '')
    if (digits.length < 10) {
      skipped++
      continue
    }

    // Checar duplicata interna ao arquivo (pelo número de dígitos normalizado)
    if (seen.has(digits)) {
      skipped++
      continue
    }

    seen.add(digits)
    valid.push({
      name: rawName || rawPhone, // fallback: usar o próprio telefone se não houver nome
      phone: rawPhone,
    })
  }

  return { valid, skipped }
}

/**
 * Executa uma campanha: busca os destinatários pendentes e envia mensagem
 * para cada um com intervalo mínimo de 3s entre os envios.
 *
 * @param campaignId - ID da campanha a executar
 */
export async function executeCampaign(campaignId: string): Promise<void> {
  // 1. Buscar campanha com destinatários e leads associados
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        include: {
          lead: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new Error(`Campanha não encontrada: ${campaignId}`)
  }

  // 2. Atualizar status para 'running'
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  })

  // 3. Iterar sobre destinatários com status 'pending'
  const pendingRecipients = campaign.recipients.filter(
    (r) => r.status === 'pending',
  )

  for (let i = 0; i < pendingRecipients.length; i++) {
    const recipient = pendingRecipients[i]
    const lead = recipient.lead

    // Construir variáveis de template a partir dos dados do lead
    const vars: TemplateVars = {
      nome: lead.name,
      empreendimento: lead.development ?? undefined,
      cidade: lead.city ?? undefined,
      // corretor não está no lead; será substituído por '' se não fornecido
      corretor: undefined,
    }

    // Renderizar a mensagem com as variáveis do lead
    const message = renderTemplate(campaign.message, vars)

    // Telefone para envio: preferir whatsapp, depois phone
    const phone = lead.whatsapp ?? lead.phone ?? ''

    try {
      if (!phone) {
        throw new Error('Lead sem número de telefone/WhatsApp')
      }

      await sendWhatsAppMessage(phone, message)

      // Atualizar recipient para 'sent'
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          errorMsg: null,
        },
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)

      // Atualizar recipient para 'failed'
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'failed',
          errorMsg,
        },
      })
    }

    // Aguardar 3000ms antes do próximo envio (exceto após o último)
    if (i < pendingRecipients.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 3000))
    }
  }

  // 4. Atualizar campanha para 'completed'
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  })
}
