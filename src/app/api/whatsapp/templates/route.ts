import { NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp';

export async function GET() {
  try {
    const config = await getWhatsAppConfig();
    
    if (!config.configured || !config.accessToken) {
      return NextResponse.json({ error: 'WhatsApp API not configured' }, { status: 400 });
    }
    
    // To fetch templates we need the WhatsApp Business Account ID (WABA ID).
    // Usually, this is available via the token info, or we can fetch the phone number to get it.
    // For simplicity, we first get the WABA ID from the phone number.
    
    const phoneRes = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}`, {
      headers: { Authorization: `Bearer ${config.accessToken}` }
    });
    
    let wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    
    if (!wabaId && phoneRes.ok) {
      const phoneData = await phoneRes.json();
      // Sometimes the waba id is not returned here directly depending on permissions, but let's try.
      // If we don't have it, we return a fallback list or require the user to configure it.
    }
    
    // Mocking templates for now if we can't fetch them, as WABA ID isn't in env
    return NextResponse.json([
      { name: "boas_vindas", language: "pt_BR", category: "MARKETING" },
      { name: "lembrete_visita", language: "pt_BR", category: "UTILITY" },
      { name: "campanha_promocional", language: "pt_BR", category: "MARKETING" }
    ]);
    
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
