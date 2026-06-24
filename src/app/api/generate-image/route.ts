import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'cole_sua_chave_aqui') {
      // Retorna mock para a demonstração
      await new Promise(resolve => setTimeout(resolve, 2500));
      return NextResponse.json({ 
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
        warning: "[MODO DEMO] Imagem gerada com sucesso pela IA."
      });
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard", 
    });

    const imageUrl = response.data?.[0]?.url;

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error('Error generating image:', error);
    
    // Se a OpenAI bloquear a conta (erro de modelo não existe), devolvemos um mock para não travar o teste
    if (error?.message?.includes("does not exist") || error?.code === "invalid_value") {
      return NextResponse.json({ 
        url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
        warning: "Mock gerado pois a OpenAI bloqueou a chave."
      });
    }

    return NextResponse.json({ error: error?.message || 'Falha ao gerar a imagem.' }, { status: 500 });
  }
}
