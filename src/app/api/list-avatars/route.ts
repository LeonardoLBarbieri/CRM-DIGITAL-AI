import { NextResponse } from 'next/server';
import { heyGenService } from '@/services/heygen';

export async function GET() {
  try {
    const result = await heyGenService.listAvatars();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing avatars:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao listar avatars.' }, { status: 500 });
  }
}
