// Temperatura do lead
export type Temperature = 'Frio' | 'Morno' | 'Quente' | 'Prioritário'

// Estágios do kanban (12 colunas em ordem)
export type LeadStatus =
  | 'Lead Novo'
  | 'Primeiro Contato'
  | 'Qualificação'
  | 'Em Negociação'
  | 'Visita Agendada'
  | 'Visita Realizada'
  | 'Proposta Enviada'
  | 'Aguardando Resposta'
  | 'Reserva Efetuada'
  | 'Contrato Assinado'
  | 'Venda Concluída'
  | 'Lead Perdido'

export const LEAD_STATUSES: LeadStatus[] = [
  'Lead Novo', 'Primeiro Contato', 'Qualificação', 'Em Negociação',
  'Visita Agendada', 'Visita Realizada', 'Proposta Enviada', 'Aguardando Resposta',
  'Reserva Efetuada', 'Contrato Assinado', 'Venda Concluída', 'Lead Perdido'
]

// Tipos de tarefa
export type TaskType = 'ligar' | 'enviar_proposta' | 'confirmar_visita' | 'enviar_contrato' | 'outro'

// Status de mensagem WhatsApp
export type MessageStatus = 'enviada' | 'entregue' | 'lida' | 'erro'

// Classificação de timing de tarefa
export type TaskTiming = 'overdue' | 'today' | 'upcoming' | 'future'

// Variáveis de template dinâmico
export interface TemplateVars {
  nome?: string
  empreendimento?: string
  cidade?: string
  corretor?: string
}

// Payload de webhook Meta
export interface WebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: { display_phone_number: string; phone_number_id: string }
      contacts?: Array<{ profile: { name: string }; wa_id: string }>
      messages?: Array<{
        id: string
        from: string
        type: string
        text?: { body: string }
        timestamp: string
      }>
      statuses?: Array<{
        id: string
        status: 'sent' | 'delivered' | 'read' | 'failed'
        timestamp: string
        recipient_id: string
      }>
    }
    field: string
  }>
}

// Resposta do dashboard
export interface DashboardMetrics {
  totalLeads: number
  leadsToday: number
  leadsThisWeek: number
  leadsThisMonth: number
  pendingVisits: number
  openProposals: number
  closedThisMonth: number
  conversionRate: number
  estimatedRevenue: number
  realizedRevenue: number
  funnelDistribution: Partial<Record<LeadStatus, number>>
  dailyNewLeads: Array<{ date: string; count: number }>
}

// Lead completo com relações
export interface LeadFull {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  city: string | null
  neighborhood: string | null
  status: LeadStatus
  temperature: Temperature
  incomeRange: string | null
  hasFgts: boolean
  downPayment: number | null
  creditApproved: boolean
  propertyType: string | null
  desiredArea: number | null
  priceMin: number | null
  priceMax: number | null
  region: string | null
  bedrooms: number | null
  parkingSpots: number | null
  development: string | null
  budget: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  messages: WhatsAppMessageFull[]
  history: LeadHistoryItem[]
  tasks: TaskFull[]
}

export interface WhatsAppMessageFull {
  id: string
  leadId: string
  body: string
  sender: 'lead' | 'broker' | 'system'
  status: MessageStatus
  whatsappMessageId: string | null
  isAutomated: boolean
  timestamp: string
}

export interface LeadHistoryItem {
  id: string
  leadId: string
  fromStatus: string
  toStatus: string
  changedBy: string
  createdAt: string
}

export interface TaskFull {
  id: string
  leadId: string
  type: TaskType
  description: string | null
  status: 'pendente' | 'concluida' | 'atrasada'
  dueAt: string
  completedAt: string | null
  createdAt: string
  timing?: TaskTiming
}

// Cores de temperatura
export const TEMPERATURE_COLORS: Record<Temperature, string> = {
  'Frio': 'blue',
  'Morno': 'yellow',
  'Quente': 'orange',
  'Prioritário': 'red',
}
