import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getWhatsAppConfig,
  getBusinessHoursConfig,
  isWithinBusinessHours,
  sendWhatsAppMessage,
  markMessageAsRead,
  getConfig,
} from '@/lib/whatsapp';
import { renderTemplate } from '@/lib/utils';

// Helper to clean phone numbers for matching
function formatPhone(phone: string) {
  return phone.replace(/\D/g, '');
}

// ----------------------------------------------------------------------------
// GET: Webhook Verification for Meta
// ----------------------------------------------------------------------------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

// ----------------------------------------------------------------------------
// POST: Receive Webhook Events (Messages, Status updates)
// ----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object) {
      if (body.entry?.[0]?.changes?.[0]?.value?.messages) {

        // ── Mensagem recebida de um usuário ──────────────────────────────
        const message = body.entry[0].changes[0].value.messages[0];
        const contact = body.entry[0].changes[0].value.contacts?.[0];

        const fromPhone = message.from; // ex: "5511999999999"
        const msgBody = message.text?.body;
        const messageId = message.id;

        if (msgBody) {
          console.log(`[WEBHOOK] Mensagem recebida de ${fromPhone}: ${msgBody}`);

          // 1. Marcar mensagem como lida na Meta (blue ticks)
          markMessageAsRead(messageId).catch(() => {});

          // 2. Encontrar ou criar lead
          let lead = await prisma.lead.findFirst({
            where: {
              OR: [
                { phone: { contains: fromPhone } },
                { phone: { contains: fromPhone.substring(2) } },
                { whatsapp: { contains: fromPhone } },
              ]
            }
          });

          const isNewLead = !lead;

          if (!lead) {
            lead = await prisma.lead.create({
              data: {
                name: contact?.profile?.name || 'Novo Lead (WhatsApp)',
                phone: fromPhone,
                whatsapp: fromPhone,
                status: 'Lead Novo',
                temperature: 'Morno',
              }
            });
            console.log('[WEBHOOK] Novo lead criado via WhatsApp:', lead.id);
          }

          // 3. Salvar a mensagem recebida no banco
          await prisma.whatsAppMessage.create({
            data: {
              leadId: lead.id,
              body: msgBody,
              sender: 'lead',
              whatsappMessageId: messageId,
              status: 'recebida',
            }
          });

          // ── AUTOMAÇÕES ─────────────────────────────────────────────────
          await processAutomations(lead, fromPhone, isNewLead, msgBody);
        }
      }

      // Handle Message Status Updates (delivered, read)
      else if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
        const statusObj = body.entry[0].changes[0].value.statuses[0];
        const messageId = statusObj.id;
        const status = statusObj.status; // sent, delivered, read, failed

        if (status === 'delivered' || status === 'read') {
          await prisma.whatsAppMessage.updateMany({
            where: { whatsappMessageId: messageId },
            data: { status: status === 'read' ? 'lida' : 'entregue' },
          });
        }

        if (status === 'failed') {
          const errorCode = statusObj.errors?.[0]?.code;
          const errorTitle = statusObj.errors?.[0]?.title;
          console.error(`[WEBHOOK] Mensagem ${messageId} falhou: ${errorCode} - ${errorTitle}`);
          await prisma.whatsAppMessage.updateMany({
            where: { whatsappMessageId: messageId },
            data: { status: 'falha' },
          });
        }
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid object' }, { status: 404 });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Automações: boas-vindas, ausência, tarefa automática
// ─────────────────────────────────────────────────────────────────────────────
async function processAutomations(
  lead: any,
  fromPhone: string,
  isNewLead: boolean,
  messageBody: string,
) {
  try {
    const config = await getWhatsAppConfig();
    if (!config.configured) {
      console.log('[AUTOMATIONS] WhatsApp não configurado — pulando automações');
      return;
    }

    // Carregar flags de automação do banco
    const [
      enableWelcomeStr,
      welcomeMessageTemplate,
      enableOutOfHoursStr,
      outOfHoursMessageTemplate,
      enableAutoTaskStr,
      brokerName,
    ] = await Promise.all([
      getConfig('automation.enableWelcome'),
      getConfig('automation.welcomeMessage'),
      getConfig('automation.enableOutOfHours'),
      getConfig('automation.outOfHoursMessage'),
      getConfig('automation.enableAutoTask'),
      getConfig('whatsapp.brokerName'),
    ]);

    const enableWelcome = enableWelcomeStr === 'true';
    const enableOutOfHours = enableOutOfHoursStr === 'true';
    const enableAutoTask = enableAutoTaskStr !== 'false'; // default true

    // Verificar horário comercial
    const businessHours = await getBusinessHoursConfig();
    const now = new Date();
    const withinHours = isWithinBusinessHours(now, businessHours);

    // ── 1. Mensagem de ausência (fora do horário) ──────────────────────
    if (!withinHours && enableOutOfHours) {
      const template = outOfHoursMessageTemplate ||
        'Olá {nome}! No momento estamos fora do horário de atendimento. Retornaremos seu contato assim que possível! 🏠';

      const rendered = renderTemplate(template, {
        nome: lead.name,
        corretor: brokerName || 'Corretor',
      });

      try {
        await sendWhatsAppMessage(fromPhone, rendered);

        // Salvar no banco
        await prisma.whatsAppMessage.create({
          data: {
            leadId: lead.id,
            body: rendered,
            sender: 'system',
            status: 'enviada',
            whatsappMessageId: 'auto_absence_' + Date.now(),
          },
        });

        console.log('[AUTOMATIONS] Mensagem de ausência enviada para', fromPhone);
      } catch (err) {
        console.error('[AUTOMATIONS] Erro ao enviar mensagem de ausência:', err);
      }
      // Não envia boas-vindas se está fora do horário
    }

    // ── 2. Mensagem de boas-vindas (dentro do horário, lead novo) ─────
    else if (withinHours && isNewLead && enableWelcome) {
      const template = welcomeMessageTemplate ||
        'Olá {nome}! 👋 Sou o {corretor} da LB Digital. Vi que você tem interesse em nossos empreendimentos! Como posso ajudá-lo?';

      const rendered = renderTemplate(template, {
        nome: lead.name,
        corretor: brokerName || 'Corretor',
      });

      try {
        await sendWhatsAppMessage(fromPhone, rendered);

        await prisma.whatsAppMessage.create({
          data: {
            leadId: lead.id,
            body: rendered,
            sender: 'system',
            status: 'enviada',
            whatsappMessageId: 'auto_welcome_' + Date.now(),
          },
        });

        console.log('[AUTOMATIONS] Mensagem de boas-vindas enviada para', fromPhone);
      } catch (err) {
        console.error('[AUTOMATIONS] Erro ao enviar boas-vindas:', err);
      }
    }

    // ── 3. Criar tarefa automática ────────────────────────────────────
    if (isNewLead && enableAutoTask) {
      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + 2); // 2 horas para retornar

      await prisma.task.create({
        data: {
          leadId: lead.id,
          type: 'Retorno (WhatsApp)',
          description: `Lead "${lead.name}" (${fromPhone}) enviou mensagem: "${messageBody.substring(0, 100)}"`,
          dueAt,
          status: 'pendente',
        },
      });

      console.log('[AUTOMATIONS] Tarefa de retorno criada para', lead.name);
    }
  } catch (err) {
    console.error('[AUTOMATIONS] Erro geral nas automações:', err);
    // Não propagar erro — automações não devem impedir o webhook de responder 200
  }
}
