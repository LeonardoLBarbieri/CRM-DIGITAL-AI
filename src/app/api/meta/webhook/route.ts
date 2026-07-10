import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ----------------------------------------------------------------------------
// GET: Webhook Verification for Meta Lead Ads
// ----------------------------------------------------------------------------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN; // Usando o mesmo token de verificação

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('LEAD_ADS_WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

// ----------------------------------------------------------------------------
// POST: Receive Webhook Events from Meta Lead Ads
// ----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadId = change.value.leadgen_id;
            
            // Agora precisamos buscar os detalhes do Lead na Graph API usando o leadId
            const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
            if (META_ACCESS_TOKEN) {
              const url = `https://graph.facebook.com/v19.0/${leadId}?access_token=${META_ACCESS_TOKEN}`;
              const res = await fetch(url);
              const leadData = await res.json();
              
              if (!leadData.error) {
                // leadData.field_data contém as respostas do formulário
                let name = 'Novo Lead (Meta Ads)';
                let phone = null;
                let email = null;
                
                leadData.field_data.forEach((field: any) => {
                  if (field.name === 'full_name' || field.name === 'first_name') name = field.values[0];
                  if (field.name === 'phone_number') phone = field.values[0];
                  if (field.name === 'email') email = field.values[0];
                });
                
                // Salva no banco de dados
                const newLead = await prisma.lead.create({
                  data: {
                    name,
                    phone: phone ? String(phone) : null,
                    whatsapp: phone ? String(phone) : null,
                    email: email ? String(email) : null,
                    status: 'Lead Novo',
                    temperature: 'Quente', // Leads de Ads já vêm "Quentes" ou "Mornos"
                  }
                });
                console.log(`Lead from Meta Ads created successfully: ${newLead.id}`);
              } else {
                console.error("Meta Graph API error fetching lead details:", leadData.error);
              }
            } else {
              console.log(`Received leadgen event for ${leadId} but no META_ACCESS_TOKEN is configured to fetch details.`);
            }
          }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Invalid object' }, { status: 404 });
  } catch (error) {
    console.error('Error in Meta webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
