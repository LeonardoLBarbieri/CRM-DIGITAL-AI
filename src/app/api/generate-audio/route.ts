import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Gera áudio usando NVIDIA NIM TTS (grátis) ou ElevenLabs (pago).
 *
 * Prioridade:
 *   1. NVIDIA NIM Magpie-TTS (grátis, multilingual, incluindo pt-BR)
 *   2. ElevenLabs (pago, melhor qualidade de clonagem de voz)
 *   3. Modo demo (sem chave, retorna áudio fictício)
 */
export async function POST(req: Request) {
  try {
    const { script, voiceId: requestVoiceId, voiceSettings } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Faltando o roteiro para gerar o áudio.' }, { status: 400 });
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    // ─────────────────────────────────────────────
    // MODO 1: NVIDIA NIM TTS (Gratuito)
    // ─────────────────────────────────────────────
    const useNvidia = nvidiaKey &&
      nvidiaKey !== 'cole_sua_chave_nvidia_aqui' &&
      nvidiaKey.startsWith('nvapi-');

    if (useNvidia) {
      console.log('[TTS] Usando NVIDIA NIM Magpie-TTS — modo gratuito ✓');
      try {
        const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.NVIDIA_TTS_MODEL || 'nvidia/magpie-tts-multilingual',
            input: script,
            voice: 'Leonardo', // voz padrão multilingual
            response_format: 'mp3',
          }),
        });

        if (nvidiaResponse.ok) {
          const audioBuffer = await nvidiaResponse.arrayBuffer();
          const timestamp = Date.now();
          const filename = `audio_nvidia_${timestamp}.mp3`;
          const audioDir = path.join(process.cwd(), 'public', 'audio');

          try {
            await mkdir(audioDir, { recursive: true });
            await writeFile(path.join(audioDir, filename), Buffer.from(audioBuffer));
          } catch (fileError) {
            console.error('Error saving audio file:', fileError);
          }

          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          return NextResponse.json({
            audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`,
            downloadUrl: `/audio/${filename}`,
            filename,
            timestamp,
            provider: 'nvidia',
          });
        } else {
          const errData = await nvidiaResponse.json().catch(() => ({}));
          console.warn('[TTS] NVIDIA TTS falhou, tentando ElevenLabs...', errData);
        }
      } catch (nvidiaErr) {
        console.warn('[TTS] Erro NVIDIA NIM TTS, tentando ElevenLabs...', nvidiaErr);
      }
    }

    // ─────────────────────────────────────────────
    // MODO 2: ElevenLabs (Pago)
    // ─────────────────────────────────────────────
    const isDemoMode = !elevenLabsKey || elevenLabsKey === 'cole_sua_chave_aqui';

    if (isDemoMode) {
      // Modo demo: retorna áudio fictício
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        audioDataUrl: "data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
        downloadUrl: "#",
        filename: "demo_audio.mp3",
        timestamp: Date.now(),
        provider: 'demo',
      });
    }

    // Use voiceId from request, or fall back to env
    const voiceId = requestVoiceId || process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId || voiceId === 'cole_o_id_da_sua_voz_aqui') {
      return NextResponse.json(
        { error: 'Voice ID não configurado. Selecione uma voz na seção "Voz & Áudio" ou configure no .env.local.' },
        { status: 500 }
      );
    }

    console.log('[TTS] Usando ElevenLabs');

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
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
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

    const timestamp = Date.now();
    const filename = `audio_${timestamp}.mp3`;
    const audioDir = path.join(process.cwd(), 'public', 'audio');

    try {
      await mkdir(audioDir, { recursive: true });
      await writeFile(path.join(audioDir, filename), Buffer.from(audioBuffer));
    } catch (fileError) {
      console.error('Error saving audio file:', fileError);
    }

    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      audioDataUrl,
      downloadUrl: `/audio/${filename}`,
      filename,
      timestamp,
      provider: 'elevenlabs',
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar o áudio.' }, { status: 500 });
  }
}
