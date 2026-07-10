import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const adConfig = await req.json();

    if (!adConfig) {
      return NextResponse.json({ error: "Ad config is required" }, { status: 400 });
    }

    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;
    const META_PAGE_ID = process.env.META_PAGE_ID;

    // Se o usuário não tiver configurado as chaves no .env, continuamos usando o Mock
    if (!META_ACCESS_TOKEN || !AD_ACCOUNT_ID || META_ACCESS_TOKEN === "sua_chave_meta_aqui") {
      console.log("[META_ADS] Credenciais não encontradas. Usando Mock de resposta.");
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return NextResponse.json({
        success: true,
        message: "Campanha publicada com sucesso (Mock: chaves não configuradas)",
        campaignId: "camp_mock_" + Math.random().toString(36).substring(7),
        adSetId: "adset_mock_" + Math.random().toString(36).substring(7),
        adId: "ad_mock_" + Math.random().toString(36).substring(7),
        details: adConfig
      });
    }

    console.log("[META_ADS] Iniciando criação real de anúncio na Meta Graph API...");
    const API_VERSION = "v19.0";
    const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

    // 1. Criar a Campaign
    // Objetivo de engajamento para gerar mensagens no WhatsApp
    const campaignFormData = new FormData();
    campaignFormData.append("name", `LB Digital AI - Campanha WhatsApp - ${new Date().toISOString()}`);
    campaignFormData.append("objective", "OUTCOME_ENGAGEMENT");
    campaignFormData.append("status", "PAUSED"); // Cria pausada para segurança inicial
    campaignFormData.append("special_ad_categories", "[]");
    campaignFormData.append("access_token", META_ACCESS_TOKEN);

    const campaignRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`, {
      method: "POST",
      body: campaignFormData
    });
    const campaignData = await campaignRes.json();
    if (campaignData.error) throw new Error(`Meta API Campaign Error: ${campaignData.error.message}`);
    const campaignId = campaignData.id;

    // 2. Criar o AdSet (Conjunto de Anúncios)
    const adSetFormData = new FormData();
    adSetFormData.append("name", "Conjunto Automático Advantage+");
    adSetFormData.append("campaign_id", campaignId);
    adSetFormData.append("status", "PAUSED");
    adSetFormData.append("daily_budget", (adConfig.dailyBudget * 100).toString()); // Cents
    adSetFormData.append("billing_event", "IMPRESSIONS");
    adSetFormData.append("optimization_goal", "CONVERSATIONS"); // Otimizar para conversas
    adSetFormData.append("destination_type", "MESSENGER");
    // Configuração mínima de público - O Advantage+ vai expandir
    adSetFormData.append("targeting", JSON.stringify({
      geo_locations: { countries: ["BR"] },
      age_min: 30, // Foco em compradores
    }));
    adSetFormData.append("access_token", META_ACCESS_TOKEN);

    const adSetRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/adsets`, {
      method: "POST",
      body: adSetFormData
    });
    const adSetData = await adSetRes.json();
    if (adSetData.error) throw new Error(`Meta API AdSet Error: ${adSetData.error.message}`);
    const adSetId = adSetData.id;

    // 3. Criar Ad Creative (Precisaria de upload de imagem para ser completo)
    // Para simplificar, assumimos que teríamos uma imagem pre-definida ou gerada
    // const creativeFormData = new FormData(); ...

    // 4. Criar o Ad
    // const adFormData = new FormData(); ...

    return NextResponse.json({
      success: true,
      message: "Campanha criada com sucesso na Meta!",
      campaignId: campaignId,
      adSetId: adSetId,
      details: adConfig
    });

  } catch (error: any) {
    console.error("[META_ADS_ERROR]", error.message || error);
    return NextResponse.json({ error: "Falha ao comunicar com a Meta API: " + (error.message || "") }, { status: 500 });
  }
}
