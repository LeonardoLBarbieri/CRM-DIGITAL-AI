import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to find a value by a list of possible column names (case-insensitive)
function getValue(obj: any, keys: string[]): any {
  if (!obj) return null;
  const objKeys = Object.keys(obj);
  for (const key of keys) {
    const match = objKeys.find(k => k.trim().toLowerCase().includes(key.toLowerCase()));
    if (match && obj[match]) return obj[match];
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data must be a non-empty array' }, { status: 400 });
    }

    const leadsToInsert = data.map((lead: any) => {
      const name = getValue(lead, ['name', 'nome', 'cliente', 'contato', 'first name', 'nome completo']);
      const phone = getValue(lead, ['phone', 'telefone', 'celular', 'whatsapp', 'wpp', 'numero', 'número', 'contato']);
      const email = getValue(lead, ['email', 'e-mail']);
      const city = getValue(lead, ['city', 'cidade', 'municipio', 'município']);
      const neighborhood = getValue(lead, ['neighborhood', 'bairro', 'regiao', 'região']);
      const status = getValue(lead, ['status', 'fase', 'etapa']) || 'Lead Novo';
      const temperature = getValue(lead, ['temperature', 'temperatura']) || 'Frio';
      const incomeRange = getValue(lead, ['incomerange', 'renda', 'salario', 'salário']);
      
      return {
        name: name ? String(name) : 'Lead sem nome',
        phone: phone ? String(phone) : null,
        whatsapp: phone ? String(phone) : null, // Assuming whatsapp is the same as phone
        email: email ? String(email) : null,
        city: city ? String(city) : null,
        neighborhood: neighborhood ? String(neighborhood) : null,
        status: String(status),
        temperature: String(temperature),
        incomeRange: incomeRange ? String(incomeRange) : null,
      };
    });

    const result = await prisma.lead.createMany({
      data: leadsToInsert,
    });

    return NextResponse.json({ success: true, count: result.count, data: leadsToInsert });
  } catch (error: any) {
    console.error('Error importing leads:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
