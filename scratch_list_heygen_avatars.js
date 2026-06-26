async function listAvatars() {
  const apiKey = 'sk_V2_hgu_kbYjH2hrQXk_vHGZXDWEn2GfJw21mG3WxJJQMLWgkHGW';
  try {
    const response = await fetch('https://api.heygen.com/v2/avatars', {
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

listAvatars();
