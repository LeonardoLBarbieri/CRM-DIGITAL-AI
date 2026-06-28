import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/nvidia-client';

export async function POST(req: Request) {
  try {
    const { name, features, style, format } = await req.json();

    if (!name || !features) {
      return NextResponse.json({ error: 'Faltando nome ou diferenciais do empreendimento.' }, { status: 400 });
    }

    const systemPrompt = `Você é um especialista em vendas imobiliárias de alto padrão e copywriting.
Você precisa criar um roteiro de vídeo extremamente persuasivo para um anúncio nas redes sociais, que será interpretado pelo avatar digital do corretor Leonardo Barbieri.
A linguagem deve ser: ${style}. O formato do vídeo é para ${format}.

ESTRUTURA OBRIGATÓRIA DO ROTEIRO (Framework AIDA ou PAS):
1. GANCHO (Atenção/Problema) (0-3 seg): Interrompa a rolagem. Seja disruptivo. Fale diretamente com a dor ou o desejo do público-alvo de alto padrão.
2. DESENVOLVIMENTO (Interesse/Desejo/Agitação) (15-30 seg): Apresente os diferenciais como a solução ideal. Foque no que realmente importa (Localização premium, valorização, status, infraestrutura). Não seja genérico.
3. FECHAMENTO (Ação) (5 seg): Chamada para ação (CTA) clara, direta e com senso de urgência. ("Clique em Saiba Mais", "Fale comigo agora pelo WhatsApp").

REGRAS ESTABELECIDAS:
- Duração: O roteiro deve ser curto e dinâmico (no máximo 100-130 palavras), ideal para vídeos de 30 a 60 segundos.
- Interpretação para IA de Voz: O texto gerado será enviado DIRETAMENTE para um gerador de voz, portanto:
  - NÃO inclua direções de palco como "[sorri]", "[caminhando]", "[olha para a câmera]".
  - Escreva apenas o texto que deve ser FALADO, palavra por palavra.
  - Formate os números por extenso se ajudar na fluidez da voz (ex: "três suítes").
- Gatilhos: Autoridade ("Eu, Leonardo Barbieri..."), Escassez, Exclusividade.

Retorne APENAS o roteiro final, sem explicações extras, sem introdução, e sem marcadores de seção no meio do texto. O texto deve fluir naturalmente.`;

    const userPrompt = `Crie um roteiro persuasivo para o empreendimento:
NOME: ${name}
DIFERENCIAIS: ${features}
ESTILO: ${style}
FORMATO: ${format}`;

    // Seleciona automaticamente NVIDIA NIM (grátis) ou OpenAI
    const { client, defaultModel } = getAIClient();

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: defaultModel,
    });

    const script = completion.choices[0].message.content;

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: 'Falha ao gerar o roteiro. Configure NVIDIA_API_KEY ou OPENAI_API_KEY no .env.local.' }, { status: 500 });
  }
}
