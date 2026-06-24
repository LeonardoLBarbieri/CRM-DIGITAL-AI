import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { script, voiceId: requestVoiceId, voiceSettings } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Faltando o roteiro para gerar o áudio.' }, { status: 400 });
    }

    // Use voiceId from request, or fall back to env
    const voiceId = requestVoiceId || process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId || voiceId === 'cole_o_id_da_sua_voz_aqui') {
      return NextResponse.json(
        { error: 'Voice ID não configurado. Selecione uma voz na seção "Voz & Áudio" ou configure no .env.local.' },
        { status: 500 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === 'cole_sua_chave_aqui') {
      return NextResponse.json({ error: 'Chave da API da ElevenLabs não configurada.' }, { status: 500 });
    }

    // Default voice settings with overrides from request
    const settings = {
      stability: voiceSettings?.stability ?? 0.5,
      similarity_boost: voiceSettings?.similarityBoost ?? 0.75,
      style: voiceSettings?.style ?? 0.2,
      use_speaker_boost: true,
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2', // Best model for Portuguese
        voice_settings: settings,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Falha ao comunicar com o ElevenLabs.';
      try {
        const errorData = await response.json();
        console.error('ElevenLabs API Error:', errorData);
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch {
        console.error('ElevenLabs API Error: status', response.status);
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    // Save audio file for download
    const timestamp = Date.now();
    const filename = `audio_${timestamp}.mp3`;
    const audioDir = path.join(process.cwd(), 'public', 'audio');

    try {
      await mkdir(audioDir, { recursive: true });
      await writeFile(path.join(audioDir, filename), Buffer.from(audioBuffer));
    } catch (fileError) {
      console.error('Error saving audio file:', fileError);
      // Continue even if file save fails - we still have the base64
    }

    // Return both base64 (for immediate playback) and file URL (for download)
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      audioDataUrl,
      downloadUrl: `/audio/${filename}`,
      filename,
      timestamp,
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar o áudio.' }, { status: 500 });
  }
}
