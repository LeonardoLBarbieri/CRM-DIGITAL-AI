import prisma from '@/lib/prisma'

// Tipo de configuração de horário por dia
export interface DayConfig {
  enabled: boolean
  start: string // "08:00"
  end: string   // "18:00"
}

// key = "0".."6" (0=domingo)
export type BusinessHoursConfig = Record<string, DayConfig>

/**
 * Busca configuração de horário comercial do banco.
 * A configuração é armazenada em SystemConfig com chaves "businessHours.0" … "businessHours.6"
 * ou como um único JSON em "businessHours".
 */
export async function getBusinessHoursConfig(): Promise<BusinessHoursConfig> {
  const record = await prisma.systemConfig.findUnique({
    where: { key: 'businessHours' },
  })

  if (!record) {
    // Retorna configuração padrão: seg–sex 08:00–18:00
    const defaultConfig: BusinessHoursConfig = {}
    for (let day = 0; day <= 6; day++) {
      defaultConfig[day.toString()] = {
        enabled: day >= 1 && day <= 5, // segunda (1) a sexta (5)
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
 *
 * @param timestamp - Data/hora a verificar
 * @param config    - Configuração de horário comercial por dia da semana
 * @returns true se o timestamp cair dentro do intervalo habilitado para aquele dia
 */
export function isWithinBusinessHours(
  timestamp: Date,
  config: BusinessHoursConfig,
): boolean {
  const dayOfWeek = timestamp.getDay() // 0=domingo, 6=sábado
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

/**
 * Busca um valor de configuração do SystemConfig pelo chave.
 *
 * @param key - Chave da configuração
 * @returns Valor da configuração ou null se não encontrado
 */
export async function getConfig(key: string): Promise<string | null> {
  const record = await prisma.systemConfig.findUnique({ where: { key } })
  return record?.value ?? null
}

/**
 * Envia uma mensagem de texto via Meta WhatsApp Business API v18.
 * Busca accessToken e phoneNumberId do banco (SystemConfig).
 *
 * @param phone - Número de telefone do destinatário (formato internacional, ex: "5511999999999")
 * @param body  - Texto da mensagem
 * @returns Objeto com o ID da mensagem enviada
 * @throws Erro se o WhatsApp não estiver configurado ou se a API retornar erro
 */
export async function sendWhatsAppMessage(
  phone: string,
  body: string,
): Promise<{ messageId: string }> {
  const [accessTokenRecord, phoneNumberIdRecord] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'whatsapp.accessToken' } }),
    prisma.systemConfig.findUnique({ where: { key: 'whatsapp.phoneNumberId' } }),
  ])

  if (!accessTokenRecord?.value || !phoneNumberIdRecord?.value) {
    throw new Error('WhatsApp não configurado')
  }

  const accessToken = accessTokenRecord.value
  const phoneNumberId = phoneNumberIdRecord.value

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
