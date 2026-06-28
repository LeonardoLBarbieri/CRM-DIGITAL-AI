import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const adConfig = await req.json();

    if (!adConfig) {
      return NextResponse.json({ error: "Ad config is required" }, { status: 400 });
    }

    // TODO: Integração real com a Graph API (Meta Marketing API)
    // 1. Criar a Campaign (Objetivo: Mensagens / OUTCOME_AWARENESS / OUTCOME_ENGAGEMENT)
    // 2. Criar o AdSet (Advantage+ Audience, Orçamento Diário, Placement)
    // 3. Criar o AdCreative (Fazer upload da imagem para o Image API e pegar a hash)
    // 4. Criar o Ad (Juntar o Creative + AdSet)

    console.log("[META_ADS] Recebida solicitação de criação de anúncio:", adConfig);

    // Simulando atraso de rede da API do Facebook
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Retorno de sucesso mockado
    return NextResponse.json({
      success: true,
      message: "Campanha publicada com sucesso (Mock)",
      campaignId: "camp_mock_" + Math.random().toString(36).substring(7),
      adSetId: "adset_mock_" + Math.random().toString(36).substring(7),
      adId: "ad_mock_" + Math.random().toString(36).substring(7),
      details: adConfig
    });

  } catch (error: any) {
    console.error("[META_ADS_ERROR]", error);
    return NextResponse.json({ error: "Falha ao comunicar com a Meta API" }, { status: 500 });
  }
}
