import { NextResponse } from 'next/server';
import { ttsService } from '@/services/tts';

export async function GET() {
  try {
    const result = await ttsService.listVoices();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing voices:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao listar vozes.' }, { status: 500 });
  }
}
