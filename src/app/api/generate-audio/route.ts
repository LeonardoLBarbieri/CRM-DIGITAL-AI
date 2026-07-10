import { NextResponse } from 'next/server';
import { ttsService } from '@/services/tts';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await ttsService.generateAudio(payload);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao gerar o áudio.' }, { status: 500 });
  }
}
