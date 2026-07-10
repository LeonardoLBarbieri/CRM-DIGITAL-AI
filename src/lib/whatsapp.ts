import prisma from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface DayConfig {
  enabled: boolean
  start: string // "08:00"
  end: string   // "18:00"
}

// key = "0".."6" (0=domingo)
export type BusinessHoursConfig = Record<string, DayConfig>

export interface WhatsAppConfig {
  accessToken: string | null
  phoneNumberId: string | null
  verifyToken: string | null
  brokerName: string | null
  configured: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuração centralizada: DB (SystemConfig) → fallback .env.local
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca a configuração completa do WhatsApp.
 * Prioridade: SystemConfig (banco) → .env.local (fallback).
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const [accessTokenRecord, phoneNumberIdRecord, verifyTokenRecord, brokerNameRecord] =
    await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'whatsapp.accessToken' } }),
      prisma.systemConfig.findUnique({ where: { key: 'whatsapp.phoneNumberId' } }),
      prisma.systemConfig.findUnique({ where: { key: 'whatsapp.verifyToken' } }),
      prisma.systemConfig.findUnique({ where: { key: 'whatsapp.brokerName' } }),
    ])

  // DB tem prioridade; se não tiver, cai pro .env.local
  const accessToken =
    accessTokenRecord?.value ||
    process.env.WHATSAPP_API_TOKEN ||
    null

  const phoneNumberId =
    phoneNumberIdRecord?.value ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    null

  const verifyToken =
    verifyTokenRecord?.value ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    null

  const brokerName =
    brokerNameRecord?.value ||
    'Corretor'

  const configured = !!(
    accessToken &&
    accessToken !== 'sua_chave_whatsapp_aqui' &&
    phoneNumberId
  )

  return { accessToken, phoneNumberId, verifyToken, brokerName, configured }
}

// ─────────────────────────────────────────────────────────────────────────────
// Buscar config genérica do SystemConfig
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca um valor de configuração do SystemConfig pela chave.
 */
export async function getConfig(key: string): Promise<string | null> {
  const record = await prisma.systemConfig.findUnique({ where: { key } })
  return record?.value ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Horário comercial
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca configuração de horário comercial do banco.
 * Default: seg–sex 08:00–18:00
 */
export async function getBusinessHoursConfig(): Promise<BusinessHoursConfig> {
  const record = await prisma.systemConfig.findUnique({
    where: { key: 'businessHours' },
  })

  if (!record) {
    const defaultConfig: BusinessHoursConfig = {}
    for (let day = 0; day <= 6; day++) {
      defaultConfig[day.toString()] = {
        enabled: day >= 1 && day <= 5,
        start: '08:00',
        end: '18:00',
      }
    }
    return defaultConfig
  }

  return JSON.parse(record.value) as BusinessHoursConfig
}

/**
 * Verifica se um timestamp está dentro do horário comercial configurado.
 */
export function isWithinBusinessHours(
  timestamp: Date,
  config: BusinessHoursConfig,
): boolean {
  const dayOfWeek = timestamp.getDay()
  const dayConfig = config[dayOfWeek.toString()]

  if (!dayConfig || !dayConfig.enabled) {
    return false
  }

  const hours = timestamp.getHours()
  const minutes = timestamp.getMinutes()
  const currentMinutes = hours * 60 + minutes

  const [startHour, startMin] = dayConfig.start.split(':').map(Number)
  const [endHour, endMin] = dayConfig.end.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

// ─────────────────────────────────────────────────────────────────────────────
// Enviar mensagem
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_API_VERSION = 'v19.0'

/**
 * Envia uma mensagem de texto via Meta WhatsApp Business Cloud API.
 * Busca tokens via getWhatsAppConfig() (DB → ENV fallback).
 *
 * @param phone - Número do destinatário (formato internacional, ex: "5511999999999")
 * @param body  - Texto da mensagem
 * @returns Objeto com o ID da mensagem enviada
 * @throws Erro se o WhatsApp não estiver configurado ou se a API retornar erro
 */
export async function sendWhatsAppMessage(
  phone: string,
  body: string,
): Promise<{ messageId: string }> {
  const config = await getWhatsAppConfig()

  if (!config.configured || !config.accessToken || !config.phoneNumberId) {
    throw new Error('WhatsApp não configurado. Configure o Access Token e Phone Number ID.')
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `WhatsApp API error ${response.status}: ${JSON.stringify(errorData)}`,
    )
  }

  const data = await response.json()
  return { messageId: data.messages[0].id as string }
}

/**
 * Marca uma mensagem como lida na Meta (blue ticks).
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const config = await getWhatsAppConfig()
  if (!config.configured || !config.accessToken || !config.phoneNumberId) return

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  }).catch(() => {
    // Silenciar erros de mark-as-read — não é crítico
  })
}
