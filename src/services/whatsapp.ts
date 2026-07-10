import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, getWhatsAppConfig } from '@/lib/whatsapp';

/**
 * Serviço unificado de WhatsApp.
 * Usa internamente a lib `@/lib/whatsapp` que busca config do DB → fallback .env.
 */
export class WhatsAppService {

  async getMessages(leadId: string) {
    if (!leadId) throw new Error('leadId is required');

    return prisma.whatsAppMessage.findMany({
      where: { leadId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async sendMessage(leadId: string, message: string) {
    if (!leadId || !message) {
      throw new Error('leadId and message are required');
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || !lead.phone) {
      throw new Error('Lead not found or has no phone number');
    }

    // Normalizar telefone para formato internacional (55...)
    let phone = (lead.whatsapp || lead.phone).replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone;
    }

    let whatsappMessageId = 'simulated_' + Date.now();
    let status = 'enviada';

    // Verificar se o WhatsApp está configurado
    const config = await getWhatsAppConfig();

    if (config.configured) {
      try {
        const result = await sendWhatsAppMessage(phone, message);
        whatsappMessageId = result.messageId;
      } catch (err) {
        console.error('WhatsApp API Error:', err);
        status = 'falha';
      }
    } else {
      console.log('[WhatsApp] Simulando envio para', phone, '— API não configurada');
    }

    // Salvar mensagem no banco
    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        leadId: lead.id,
        body: message,
        sender: 'system',
        status,
        whatsappMessageId,
      }
    });

    return { success: status !== 'falha', message: dbMessage };
  }

  /**
   * Envia mensagem via template (para leads fora da janela de 24h).
   */
  async sendTemplate(leadId: string, templateName: string, languageCode: string = 'pt_BR', components?: any[]) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || !lead.phone) {
      throw new Error('Lead not found or has no phone number');
    }

    let phone = (lead.whatsapp || lead.phone).replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone;
    }

    const config = await getWhatsAppConfig();
    if (!config.configured || !config.accessToken || !config.phoneNumberId) {
      throw new Error('WhatsApp não configurado');
    }

    const url = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('WhatsApp Template Error:', responseData);
      throw new Error(`Template error: ${JSON.stringify(responseData?.error?.message || responseData)}`);
    }

    const whatsappMessageId = responseData.messages?.[0]?.id || 'template_' + Date.now();

    // Salvar no banco
    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        leadId: lead.id,
        body: `[Template: ${templateName}]`,
        sender: 'system',
        status: 'enviada',
        whatsappMessageId,
      }
    });

    return { success: true, message: dbMessage };
  }
}

export const whatsAppService = new WhatsAppService();
