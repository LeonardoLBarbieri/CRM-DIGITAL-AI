import { NextResponse } from 'next/server';
import { whatsAppService } from '@/services/whatsapp';

export async function POST(req: Request) {
  try {
    const { leadId, message } = await req.json();
    const result = await whatsAppService.sendMessage(leadId, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
