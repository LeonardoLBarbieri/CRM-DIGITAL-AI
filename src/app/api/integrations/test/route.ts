import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ttsService } from '@/services/tts';
import { heyGenService } from '@/services/heygen';

export async function POST(req: Request) {
  try {
    const { service } = await req.json();

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    if (service === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('Chave OPENAI_API_KEY não configurada.');
      
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Diga 'Conexão com OpenAI estabelecida com sucesso' de forma muito curta." }],
        model: "gpt-3.5-turbo",
        max_tokens: 20
      });

      return NextResponse.json({
        success: true,
        message: 'Conexão OpenAI OK',
        result: completion.choices[0].message.content
      });
    }

    if (service === 'elevenlabs') {
      const audioData = await ttsService.generateAudio({
        script: "Conexão com Eleven Labs estabelecida com sucesso.",
      });
      return NextResponse.json({
        success: true,
        message: 'Conexão ElevenLabs OK',
        result: audioData.audioDataUrl
      });
    }

    if (service === 'heygen') {
      const videoData = await heyGenService.generateVideo({
        script: "Conexão com Hey Gen estabelecida com sucesso.",
      });
      return NextResponse.json({
        success: true,
        message: 'Conexão HeyGen OK',
        result: videoData
      });
    }

    return NextResponse.json({ error: 'Serviço desconhecido' }, { status: 400 });

  } catch (error: any) {
    console.error(`Erro ao testar integração:`, error);
    return NextResponse.json({ error: error.message || 'Erro interno no teste' }, { status: 500 });
  }
}
