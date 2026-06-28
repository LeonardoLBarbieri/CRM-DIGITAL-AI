import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QualificationResult {
  nextMessage: string;
  isQualified: boolean;
  leadScore: "HOT" | "WARM" | "COLD" | "UNKNOWN";
  extractedData?: {
    name?: string;
    budget?: string;
    timeline?: string;
  };
}

export async function qualifyLeadMessage(
  incomingMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<QualificationResult> {
  
  const systemPrompt = `
Você é o assistente virtual imobiliário da LB Digital AI especializado em qualificar leads que vieram de anúncios do Facebook/Meta Ads via WhatsApp.
O seu objetivo principal é, de forma muito natural, educada e persuasiva:
1. Descobrir o nome do lead.
2. Entender o orçamento aproximado (budget).
3. Entender a urgência de compra (timeline).

Regras:
- Seja extremamente conciso. É WhatsApp, não mande textos longos.
- Responda de forma humanizada.
- Se o lead não responder as perguntas, tente contornar suavemente.
- Se o lead já passou o orçamento ou demonstrou intenção forte, marque-o como qualificado (isQualified = true).

Você deve responder APENAS num formato JSON válido:
{
  "nextMessage": "O texto que enviaremos de volta no WhatsApp para o lead",
  "isQualified": boolean,
  "leadScore": "HOT" | "WARM" | "COLD" | "UNKNOWN",
  "extractedData": {
    "name": "Nome se descoberto",
    "budget": "Orçamento se descoberto",
    "timeline": "Urgência se descoberta"
  }
}
  `;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: incomingMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.3, // Baixa temperatura para manter formato JSON estrito
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");

    return JSON.parse(content) as QualificationResult;
  } catch (error) {
    console.error("[AI_QUALIFIER_ERROR]", error);
    return {
      nextMessage: "Oi! Tudo bem? Tivemos um probleminha no sistema. Já já um de nossos corretores assume o atendimento, ok?",
      isQualified: false,
      leadScore: "UNKNOWN"
    };
  }
}
