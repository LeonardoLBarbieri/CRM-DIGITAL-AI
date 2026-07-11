import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test 1: Prisma connection
    const leadCount = await prisma.lead.count();
    
    // Test 2: SystemConfig access
    let configOk = false;
    try {
      await prisma.systemConfig.findFirst();
      configOk = true;
    } catch (e: any) {
      configOk = false;
    }

    // Test 3: Env vars
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      WHATSAPP_API_TOKEN: !!process.env.WHATSAPP_API_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
    };

    return NextResponse.json({
      status: 'ok',
      leadCount,
      configOk,
      envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error?.message || String(error),
    }, { status: 500 });
  }
}
