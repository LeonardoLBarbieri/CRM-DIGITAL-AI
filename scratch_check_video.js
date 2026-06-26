async function checkStatus() {
  const apiKey = 'sk_V2_hgu_kbYjH2hrQXk_vHGZXDWEn2GfJw21mG3WxJJQMLWgkHGW';
  const videoId = '2cb79c7f86554b24b066ba8574371d67';
  try {
    const response = await fetch(`https://api.heygen.com/v3/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkStatus();
