import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { leadId, message } = body as { leadId: string; message: string }

    // Buscar lead pelo ID
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
    }

    // Verificar se o lead tem número de WhatsApp ou telefone
    const phone = lead.whatsapp || lead.phone
    if (!phone) {
      return NextResponse.json(
        { error: 'Lead não possui número de WhatsApp ou telefone.' },
        { status: 400 },
      )
    }

    let result: { messageId: string }

    try {
      // Enviar mensagem via WhatsApp API
      result = await sendWhatsAppMessage(phone, message)
    } catch (apiError) {
      // Em caso de erro da API, salvar mensagem com status 'erro'
      await prisma.whatsAppMessage.create({
        data: {
          leadId,
          body: message,
          sender: 'broker',
          status: 'erro',
          whatsappMessageId: null,
        },
      })

      const errorMessage =
        apiError instanceof Error ? apiError.message : 'Erro desconhecido'

      return NextResponse.json(
        { error: 'Falha ao enviar mensagem.', details: errorMessage },
        { status: 500 },
      )
    }

    // Salvar mensagem com sucesso no banco
    await prisma.whatsAppMessage.create({
      data: {
        leadId,
        body: message,
        sender: 'broker',
        status: 'enviada',
        whatsappMessageId: result.messageId,
      },
    })

    return NextResponse.json({ messageId: result.messageId, status: 'enviada' })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição.' },
      { status: 500 },
    )
  }
}
