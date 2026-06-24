import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'

// ─────────────────────────────────────────────
// Tipos de assistência suportados
// ─────────────────────────────────────────────
type AssistType =
  | 'summarize_conversation'
  | 'generate_message'
  | 'followup_message'
  | 'presentation_message'
  | 'sales_script'
  | 'social_ad'
  | 'property_caption'

interface AssistRequestBody {
  type: AssistType
  leadId?: string
  context?: string
}

// ─────────────────────────────────────────────
// Monta o prompt de acordo com o tipo e dados do lead
// ─────────────────────────────────────────────
function buildPrompt(
  type: AssistType,
  context?: string,
  lead?: { name: string; status: string; propertyType?: string | null; development?: string | null } | null,
  messages?: { body: string; sender: string }[],
): string {
  const leadInfo = lead
    ? `Lead: ${lead.name} | Status: ${lead.status}${lead.propertyType ? ` | Interesse: ${lead.propertyType}` : ''}${lead.development ? ` | Empreendimento: ${lead.development}` : ''}`
    : ''

  const extraContext = context ? `\nContexto adicional: ${context}` : ''

  switch (type) {
    case 'summarize_conversation': {
      const history = messages?.length
        ? messages
            .map((m) => `[${m.sender === 'lead' ? 'Cliente' : 'Corretor'}]: ${m.body}`)
            .join('\n')
        : 'Nenhuma mensagem encontrada.'
      return `Você é um assistente de CRM imobiliário. Resuma de forma objetiva a conversa abaixo entre corretor e cliente, destacando: interesses manifestados, objeções, próximos passos e nível de interesse do lead.

${leadInfo}${extraContext}

Conversa:
${history}`
    }

    case 'generate_message':
      return `Você é um corretor de imóveis experiente. Crie uma mensagem personalizada para WhatsApp, em português brasileiro, para o seguinte lead. A mensagem deve ser cordial, profissional e despertar interesse sem ser invasiva.

${leadInfo}${extraContext}

Retorne apenas o texto da mensagem, sem explicações.`

    case 'followup_message':
      return `Você é um corretor de imóveis experiente. Crie uma mensagem de follow-up para WhatsApp, em português brasileiro, para retomar contato com o seguinte lead de forma natural e não insistente, reacendendo o interesse.

${leadInfo}${extraContext}

Retorne apenas o texto da mensagem, sem explicações.`

    case 'presentation_message':
      return `Você é um corretor de imóveis especialista em apresentações. Crie uma mensagem de apresentação de empreendimento para WhatsApp, em português brasileiro, destacando os principais diferenciais e gerando curiosidade no lead.

${leadInfo}${extraContext}

Retorne apenas o texto da mensagem, sem explicações.`

    case 'sales_script':
      return `Você é um especialista em vendas imobiliárias. Crie um script de abordagem de vendas em português brasileiro para o seguinte lead. O script deve incluir: abertura, identificação de necessidades, apresentação de solução e chamada para ação.

${leadInfo}${extraContext}

Retorne apenas o script estruturado, pronto para uso.`

    case 'social_ad':
      return `Você é um especialista em marketing imobiliário e copywriting. Crie um anúncio persuasivo para redes sociais (Instagram/Facebook) em português brasileiro, com gancho inicial forte, destaque dos diferenciais e chamada para ação clara.

${leadInfo}${extraContext}

Retorne apenas o texto do anúncio, pronto para publicação.`

    case 'property_caption':
      return `Você é um especialista em marketing imobiliário e redes sociais. Crie uma legenda envolvente para post de imóvel no Instagram/Facebook, em português brasileiro. Use emojis com moderação, destaque os diferenciais e finalize com hashtags relevantes.

${leadInfo}${extraContext}

Retorne apenas a legenda, pronta para publicação.`

    default:
      return `Ajude com uma tarefa de CRM imobiliário. ${leadInfo}${extraContext}`
  }
}

// ─────────────────────────────────────────────
// POST /api/ai/assist
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  // Verifica se a chave está configurada
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'IA não configurada' }, { status: 503 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const body: AssistRequestBody = await req.json()
    const { type, leadId, context } = body

    if (!type) {
      return NextResponse.json({ error: 'Campo "type" é obrigatório.' }, { status: 400 })
    }

    // Busca dados do lead se leadId for fornecido
    let lead: { name: string; status: string; propertyType?: string | null; development?: string | null } | null = null
    let messages: { body: string; sender: string }[] = []

    if (leadId) {
      const leadData = await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          name: true,
          status: true,
          propertyType: true,
          development: true,
        },
      })

      lead = leadData

      // Para sumarização, busca o histórico de mensagens
      if (type === 'summarize_conversation') {
        messages = await prisma.whatsAppMessage.findMany({
          where: { leadId },
          orderBy: { timestamp: 'asc' },
          select: { body: true, sender: true },
        })
      }
    }

    const prompt = buildPrompt(type, context, lead, messages)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente especializado em CRM e vendas imobiliárias no Brasil. Responda sempre em português brasileiro, de forma clara e profissional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content ?? ''

    return NextResponse.json({ content })
  } catch (error: unknown) {
    console.error('POST /api/ai/assist error:', error)

    // Rate limit da OpenAI
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: number }).status === 429
    ) {
      return NextResponse.json(
        { error: 'IA temporariamente indisponível', retryable: true },
        { status: 429 },
      )
    }

    return NextResponse.json({ error: 'Erro ao processar solicitação de IA.' }, { status: 500 })
  }
}
