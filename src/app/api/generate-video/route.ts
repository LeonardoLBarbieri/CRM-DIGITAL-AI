import { NextResponse } from 'next/server';
import { heyGenService } from '@/services/heygen';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.script || payload.script.trim().length === 0) {
      return NextResponse.json({ error: 'Roteiro é obrigatório para gerar o vídeo.' }, { status: 400 });
    }

    const result = await heyGenService.generateVideo(payload);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar o vídeo.' }, { status: 500 });
  }
}
