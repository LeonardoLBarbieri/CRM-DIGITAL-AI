import { NextResponse } from 'next/server'
import { checkAndSendFollowUps } from '@/lib/automation'

export async function POST() {
  try {
    const processed = await checkAndSendFollowUps()
    return NextResponse.json({ processed })
  } catch (error) {
    console.error('[automation/check] Erro ao processar follow-ups:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar follow-ups automáticos.' },
      { status: 500 },
    )
  }
}
