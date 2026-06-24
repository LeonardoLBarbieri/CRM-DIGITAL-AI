import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === 'cole_sua_chave_aqui') {
      return NextResponse.json(
        { error: 'Chave da API da ElevenLabs não configurada. Verifique o arquivo .env.local.' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ElevenLabs List Voices Error: status', response.status);
      return NextResponse.json(
        { error: 'Falha ao listar vozes do ElevenLabs.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Map to simpler format
    const voices = data.voices.map((voice: {
      voice_id: string;
      name: string;
      category: string;
      labels?: Record<string, string>;
      preview_url?: string;
    }) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      category: voice.category, // "cloned", "premade", "professional"
      labels: voice.labels || {},
      previewUrl: voice.preview_url || null,
    }));

    // Sort: cloned voices first, then premade
    voices.sort((a: { category: string }, b: { category: string }) => {
      if (a.category === 'cloned' && b.category !== 'cloned') return -1;
      if (a.category !== 'cloned' && b.category === 'cloned') return 1;
      return 0;
    });

    const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID;

    return NextResponse.json({
      voices,
      configuredVoiceId: configuredVoiceId && configuredVoiceId !== 'cole_o_id_da_sua_voz_aqui'
        ? configuredVoiceId
        : null,
    });
  } catch (error) {
    console.error('Error listing voices:', error);
    return NextResponse.json({ error: 'Erro interno ao listar vozes.' }, { status: 500 });
  }
}
