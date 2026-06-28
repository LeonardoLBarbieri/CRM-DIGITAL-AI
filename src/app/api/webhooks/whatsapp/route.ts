import { NextResponse } from "next/server";
import { qualifyLeadMessage } from "@/lib/ai-qualifier";

// GET é usado pelo Meta para verificar o Webhook no momento da configuração
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const MY_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "lb_digital_token_123";

  if (mode === "subscribe" && token === MY_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST recebe as mensagens reais dos leads
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validação básica do payload da Meta
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    // Verifica se é uma nova mensagem
    if (value?.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      
      const incomingText = message.text?.body;
      const phoneNumber = message.from;
      const contactName = contact?.profile?.name || "Desconhecido";

      if (incomingText) {
        console.log(`[WHATSAPP] Mensagem recebida de ${contactName} (${phoneNumber}): ${incomingText}`);

        // Aqui nós passaríamos o histórico se já tivéssemos armazenado no DB,
        // mas para esse MVP usaremos apenas a mensagem atual e trataremos como primeiro contato.
        
        const qualification = await qualifyLeadMessage(incomingText, []);
        
        console.log("[WHATSAPP_AI] Decisão da IA:", qualification);

        // TODO: Enviar o 'qualification.nextMessage' de volta para a Meta Cloud API
        // const whatsappToken = process.env.WHATSAPP_API_TOKEN;
        // await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, { ... })

        // TODO: Salvar o lead e o status no Prisma DB (Atualizar o CRM)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[WHATSAPP_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
