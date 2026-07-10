import { NextResponse } from 'next/server'
import { getWhatsAppConfig } from '@/lib/whatsapp'

/**
 * GET /api/whatsapp/test
 *
 * Testa a conexão com a Meta WhatsApp Cloud API.
 * Verifica se os tokens estão configurados e se o phoneNumberId é válido.
 */
export async function GET() {
  try {
    const config = await getWhatsAppConfig()

    // 1. Verificar se está configurado
    if (!config.configured || !config.accessToken || !config.phoneNumberId) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'WhatsApp não configurado. Configure o Access Token e Phone Number ID.',
        details: {
          hasAccessToken: !!config.accessToken,
          hasPhoneNumberId: !!config.phoneNumberId,
          hasVerifyToken: !!config.verifyToken,
        },
      })
    }

    // 2. Testar a conexão fazendo um GET no phoneNumberId
    const testUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}`
    const testRes = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    })

    if (!testRes.ok) {
      const errorData = await testRes.json().catch(() => ({}))
      return NextResponse.json({
        status: 'error',
        message: 'Token inválido ou Phone Number ID incorreto.',
        error: errorData?.error?.message || `HTTP ${testRes.status}`,
        details: {
          httpStatus: testRes.status,
          errorData,
        },
      })
    }

    const phoneData = await testRes.json()

    return NextResponse.json({
      status: 'connected',
      message: 'WhatsApp conectado com sucesso! ✓',
      details: {
        phoneNumber: phoneData.display_phone_number || phoneData.verified_name || config.phoneNumberId,
        verifiedName: phoneData.verified_name || null,
        qualityRating: phoneData.quality_rating || null,
        platformType: phoneData.platform_type || null,
        hasVerifyToken: !!config.verifyToken,
      },
    })
  } catch (error: any) {
    console.error('[WHATSAPP_TEST]', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao testar conexão: ' + (error.message || 'Erro desconhecido'),
    }, { status: 500 })
  }
}
