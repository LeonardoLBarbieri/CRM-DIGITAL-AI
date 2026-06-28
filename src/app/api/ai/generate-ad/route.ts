import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const systemPrompt = `
Você é um estrategista de tráfego focado no mercado imobiliário e Facebook/Meta Ads.
O usuário vai descrever o imóvel que deseja vender e possivelmente o público ou orçamento.
Você deve estruturar uma campanha de alto nível focada em cliques para WhatsApp (Advantage+).

Retorne EXATAMENTE um objeto JSON com as seguintes chaves (sem formatação markdown extra):
{
  "primaryText": "Texto principal do anúncio (copy persuasiva com gatilhos mentais)",
  "headline": "Título curto e impactante (máx 5 palavras)",
  "description": "Subtítulo ou descrição curta (máx 5 palavras)",
  "audienceNotes": "Sugestão detalhada de como a IA da Meta deve procurar o público (Advantage+). Ex: Médicos e investidores de 30-55 anos interessados em imóveis de luxo.",
  "dailyBudget": 50,
  "imagePromptHint": "Um prompt curto de como deve ser a imagem gerada (fotorrealista, clara, mostrando x)"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);

    // Ajuste de segurança caso o budget não venha como número
    if (!parsed.dailyBudget || isNaN(parsed.dailyBudget)) {
      parsed.dailyBudget = 50;
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("[GENERATE_AD_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate ad configuration" }, { status: 500 });
  }
}
