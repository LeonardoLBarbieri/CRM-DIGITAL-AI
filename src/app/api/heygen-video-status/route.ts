import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    const isDemoMode = !apiKey || apiKey === 'cole_sua_chave_aqui';

    if (isDemoMode) {
      const { searchParams } = new URL(req.url);
      const videoId = searchParams.get('videoId');

      // Em modo demo, vamos simular que terminou o processamento 
      return NextResponse.json({
        videoId: videoId,
        status: "completed",
        videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1576444356170-66073046b1bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
        failureMessage: null,
      });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId é obrigatório.' }, { status: 400 });
    }

    const response = await fetch(`https://api.heygen.com/v3/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HeyGen video status error:', errorData);
      return NextResponse.json(
        { error: 'Falha ao obter status do vídeo.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const video = data.data;

    return NextResponse.json({
      videoId: video.video_id,
      status: video.status, // "pending" | "processing" | "completed" | "failed"
      videoUrl: video.video_url || null,
      thumbnailUrl: video.thumbnail_url || null,
      failureMessage: video.failure_message || null,
    });
  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json({ error: 'Erro interno ao verificar status.' }, { status: 500 });
  }
}
