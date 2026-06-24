import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    const isDemoMode = !apiKey || apiKey === 'cole_sua_chave_aqui';

    if (isDemoMode) {
      return NextResponse.json({
        avatars: [
          {
            id: 'demo-avatar',
            name: 'Corretor (Demo)',
            type: 'stock',
            thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            ownership: 'public'
          }
        ]
      });
    }

    // List all avatar looks (both stock and private/digital_twin)
    const response = await fetch('https://api.heygen.com/v3/avatars/looks', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HeyGen list avatars error:', errorData);
      return NextResponse.json(
        { error: 'Falha ao listar avatars da HeyGen.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const avatars = (data.data?.looks || []).map((look: {
      id: string;
      name: string;
      avatar_type?: string;
      thumbnail_image_url?: string;
      ownership?: string;
    }) => ({
      id: look.id,
      name: look.name,
      type: look.avatar_type || 'stock',
      thumbnail: look.thumbnail_image_url || null,
      ownership: look.ownership || 'public',
    }));

    // Sort: private (digital twin) first, then public
    avatars.sort((a: { ownership: string }, b: { ownership: string }) => {
      if (a.ownership === 'private' && b.ownership !== 'private') return -1;
      if (a.ownership !== 'private' && b.ownership === 'private') return 1;
      return 0;
    });

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Error listing avatars:', error);
    return NextResponse.json({ error: 'Erro interno ao listar avatars.' }, { status: 500 });
  }
}
