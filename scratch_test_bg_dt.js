// Test to check if HeyGen v3 respects background for digital_twin avatar
async function testBgDT() {
  const apiKey = 'sk_V2_hgu_kbYjH2hrQXk_vHGZXDWEn2GfJw21mG3WxJJQMLWgkHGW';

  // Test with background.remove = true and then image
  const payload = {
    type: "avatar",
    avatar_id: "5ba1d40361ac4afe92fd191e80b04781",
    script: "Olá, teste de fundo de decorado.",
    resolution: "720p",
    aspect_ratio: "9:16",
    title: "BG Test",
    background: {
      type: "image",
      url: "https://www.incorposul.com.br/wp-content/uploads/2022/07/como-decorar-um-apartamento-de-alto-padrao.jpg"
    }
  };

  console.log("Sending payload:", JSON.stringify(payload, null, 2));

  const res = await fetch('https://api.heygen.com/v3/videos', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Response status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (data?.data?.video_id) {
    // Wait 60s then check the resulting video URL
    console.log("Video ID:", data.data.video_id, "- Waiting 60s to check status...");
    await new Promise(r => setTimeout(r, 60000));
    
    const statusRes = await fetch(`https://api.heygen.com/v3/videos/${data.data.video_id}`, {
      headers: { 'x-api-key': apiKey }
    });
    const statusData = await statusRes.json();
    console.log("Final video status:", JSON.stringify(statusData, null, 2));
  }
}

testBgDT();
