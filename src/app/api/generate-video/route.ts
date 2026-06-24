import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey || apiKey === 'cole_sua_chave_aqui') {
      return NextResponse.json(
        { error: 'Chave da API da HeyGen não configurada. Verifique o arquivo .env.local.' },
        { status: 400 }
      );
    }

    const { script, avatarId, voiceId, aspectRatio, resolution } = await req.json();

    if (!script || script.trim().length === 0) {
      return NextResponse.json({ error: 'Roteiro é obrigatório para gerar o vídeo.' }, { status: 400 });
    }

    // Use avatar from request or fall back to env variable
    const finalAvatarId = avatarId || process.env.HEYGEN_AVATAR_ID;
    if (!finalAvatarId || finalAvatarId === 'cole_o_id_do_seu_avatar_aqui') {
      return NextResponse.json(
        { error: 'Avatar ID não configurado. Selecione um avatar ou configure HEYGEN_AVATAR_ID no .env.local.' },
        { status: 400 }
      );
    }

    // Build the video creation payload for HeyGen v3
    const payload: Record<string, unknown> = {
      type: 'avatar',
      avatar_id: finalAvatarId,
      script: script.trim(),
      resolution: resolution || '1080p',
      aspect_ratio: aspectRatio || '9:16', // default for Instagram Reels
      title: `LB Digital AI — ${new Date().toLocaleString('pt-BR')}`,
    };

    // Add voice if provided
    if (voiceId) {
      payload.voice_id = voiceId;
    } else if (process.env.HEYGEN_VOICE_ID && process.env.HEYGEN_VOICE_ID !== 'cole_o_id_da_voz_aqui') {
      payload.voice_id = process.env.HEYGEN_VOICE_ID;
    }

    console.log('Creating HeyGen video with payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.heygen.com/v3/videos', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('HeyGen create video error:', data);
      const message =
        data?.error?.message ||
        data?.message ||
        'Falha ao criar vídeo na HeyGen.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const videoId = data?.data?.video_id;
    if (!videoId) {
      console.error('HeyGen unexpected response:', data);
      return NextResponse.json(
        { error: 'HeyGen não retornou um video_id. Verifique a conta e o avatar_id.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vídeo enviado para processamento com sucesso.',
      videoId,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o vídeo.' }, { status: 500 });
  }
}
