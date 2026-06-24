import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/ogg', 'audio/opus'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const isDemoMode = !apiKey || apiKey === 'cole_sua_chave_aqui';

    if (isDemoMode) {
      // Simulação para a Demonstração:
      // Aguarda 2.5s para simular o processamento da IA
      await new Promise(resolve => setTimeout(resolve, 2500));
      return NextResponse.json({
        voiceId: "demo-voice-id-" + Math.floor(Math.random() * 1000),
        message: `[MODO DEMO] Voz clonada com sucesso! A IA analisou as características vocais.`,
      });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const files = formData.getAll('files') as File[];

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da voz é obrigatório.' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos um arquivo de áudio.' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Arquivo "${file.name}" excede o limite de 50MB.` },
          { status: 400 }
        );
      }
      // Check file type (some browsers may not set the exact MIME type)
      if (file.type && !ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|opus|mp4)$/i)) {
        return NextResponse.json(
          { error: `Formato de arquivo não suportado: "${file.name}". Use MP3, WAV, M4A, WebM, OGG, OPUS ou MP4.` },
          { status: 400 }
        );
      }
    }

    // Build FormData for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', name.trim());
    elevenLabsFormData.append('description', `Voz clonada de ${name.trim()} - Leonardo Digital AI`);

    for (const file of files) {
      elevenLabsFormData.append('files', file, file.name);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      let errorMessage = 'Falha ao clonar a voz no ElevenLabs.';
      try {
        const errorData = await response.json();
        console.error('ElevenLabs Clone Error:', errorData);
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        }
      } catch {
        console.error('ElevenLabs Clone Error: status', response.status);
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      voiceId: data.voice_id,
      message: `Voz "${name.trim()}" clonada com sucesso!`,
    });
  } catch (error) {
    console.error('Error cloning voice:', error);
    return NextResponse.json({ error: 'Erro interno ao clonar a voz.' }, { status: 500 });
  }
}
