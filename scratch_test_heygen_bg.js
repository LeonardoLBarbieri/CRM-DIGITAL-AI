async function testBg() {
  const apiKey = 'sk_V2_hgu_kbYjH2hrQXk_vHGZXDWEn2GfJw21mG3WxJJQMLWgkHGW';
  
  const payloadV3 = {
    type: "avatar",
    avatar_id: "5ba1d40361ac4afe92fd191e80b04781",
    script: "Teste de cenário de fundo simples.",
    background: {
      type: "image",
      url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&h=1920&fit=crop"
    }
  };

  try {
    const res = await fetch('https://api.heygen.com/v3/videos', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadV3)
    });
    const data = await res.json();
    console.log("V3 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("V3 Error:", err);
  }
}

testBg();
