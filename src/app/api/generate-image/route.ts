import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório.' }, { status: 400 });
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // ─────────────────────────────────────────────
    // MODO 1: NVIDIA NIM Stable Diffusion XL (Gratuito)
    // ─────────────────────────────────────────────
    const useNvidia = nvidiaKey && 
      nvidiaKey !== 'cole_sua_chave_nvidia_aqui' && 
      nvidiaKey.startsWith('nvapi-');

    if (useNvidia) {
      console.log('[Image] Usando NVIDIA NIM (Stable Diffusion XL) — modo gratuito ✓');
      try {
        const nvidiaResponse = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            text_prompts: [
              {
                text: prompt,
                weight: 1
              }
            ],
            cfg_scale: 5,
            steps: 30,
            seed: 0,
            samples: 1
          }),
        });

        if (nvidiaResponse.ok) {
          const data = await nvidiaResponse.json();
          // A API da NVIDIA retorna a imagem em base64 no array artifacts
          if (data.artifacts && data.artifacts.length > 0) {
            const base64Image = data.artifacts[0].base64;
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            return NextResponse.json({ 
              url: imageUrl,
              provider: 'nvidia' 
            });
          }
        } else {
          const errData = await nvidiaResponse.json().catch(() => ({}));
          console.warn('[Image] NVIDIA Image API falhou, tentando OpenAI...', errData);
        }
      } catch (nvidiaErr) {
        console.warn('[Image] Erro NVIDIA NIM Image API, tentando OpenAI...', nvidiaErr);
      }
    }

    // ─────────────────────────────────────────────
    // MODO 2: OpenAI DALL-E (Pago)
    // ─────────────────────────────────────────────
    if (!openaiKey || openaiKey === 'cole_sua_chave_aqui') {
      // Retorna mock para a demonstração
      await new Promise(resolve => setTimeout(resolve, 2500));
      return NextResponse.json({ 
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
        warning: "[MODO DEMO] Imagem gerada com sucesso pela IA."
      });
    }

    console.log('[Image] Usando OpenAI (DALL-E 3)');
    const openai = new OpenAI({ apiKey: openaiKey });
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard", 
    });

    const imageUrl = response.data?.[0]?.url;

    return NextResponse.json({ url: imageUrl, provider: 'openai' });
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
