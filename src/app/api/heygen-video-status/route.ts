import { NextResponse } from 'next/server';
import { heyGenService } from '@/services/heygen';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id é obrigatório' }, { status: 400 });
    }

    const result = await heyGenService.checkStatus(videoId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('HeyGen Video Status Error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao verificar o status do vídeo.' }, { status: 500 });
  }
}
