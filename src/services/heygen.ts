export class HeyGenService {
  private apiKey: string;
  private isDemoMode: boolean;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || '';
    this.isDemoMode = !this.apiKey || this.apiKey === 'cole_sua_chave_aqui';
  }

  async listAvatars() {
    if (this.isDemoMode) {
      return {
        avatars: [
          {
            id: 'demo-avatar',
            name: 'Corretor (Demo)',
            type: 'stock',
            thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
            ownership: 'public'
          }
        ]
      };
    }

    const response = await fetch('https://api.heygen.com/v3/avatars/looks', {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HeyGen list avatars error:', errorData);
      throw new Error('Falha ao listar avatars da HeyGen.');
    }

    const data = await response.json();
    const avatars = (data.data?.looks || []).map((look: any) => ({
      id: look.id,
      name: look.name,
      type: look.avatar_type || 'stock',
      thumbnail: look.thumbnail_image_url || null,
      ownership: look.ownership || 'public',
    }));

    avatars.sort((a: any, b: any) => {
      if (a.ownership === 'private' && b.ownership !== 'private') return -1;
      if (a.ownership !== 'private' && b.ownership === 'private') return 1;
      return 0;
    });

    return { avatars };
  }

  async generateVideo(payload: {
    script: string;
    avatarId?: string;
    voiceId?: string;
    aspectRatio?: string;
    resolution?: string;
    backgroundUrl?: string;
  }) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        message: '[MODO DEMO] Vídeo enviado para processamento.',
        videoId: 'demo-video-id-12345',
      };
    }

    const finalAvatarId = payload.avatarId || process.env.HEYGEN_AVATAR_ID;
    if (!finalAvatarId || finalAvatarId === 'cole_o_id_do_seu_avatar_aqui') {
      throw new Error('Avatar ID não configurado. Selecione um avatar ou configure HEYGEN_AVATAR_ID.');
    }

    const reqPayload: Record<string, unknown> = {
      type: 'avatar',
      avatar_id: finalAvatarId,
      script: payload.script.trim(),
      resolution: payload.resolution || '1080p',
      aspect_ratio: payload.aspectRatio || '9:16',
      title: `LB Digital AI — ${new Date().toLocaleString('pt-BR')}`,
    };

    if (payload.backgroundUrl && payload.backgroundUrl.trim().length > 0) {
      reqPayload.background = { type: "image", url: payload.backgroundUrl.trim() };
    }

    if (payload.voiceId) {
      reqPayload.voice_id = payload.voiceId;
    } else if (process.env.HEYGEN_VOICE_ID && process.env.HEYGEN_VOICE_ID !== 'cole_o_id_da_voz_aqui') {
      reqPayload.voice_id = process.env.HEYGEN_VOICE_ID;
    }

    const response = await fetch('https://api.heygen.com/v3/videos', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || 'Falha ao criar vídeo na HeyGen.');
    }

    const videoId = data?.data?.video_id;
    if (!videoId) {
      throw new Error('HeyGen não retornou um video_id.');
    }

    return { message: 'Vídeo enviado para processamento com sucesso.', videoId };
  }

  async checkStatus(videoId: string) {
    if (this.isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { status: 'completed', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', progress: 100 };
    }

    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HeyGen check status error:', errorData);
      throw new Error('Falha ao verificar status na HeyGen.');
    }

    const data = await response.json();
    const status = data.data?.status || 'unknown';
    const videoUrl = data.data?.video_url;

    return { status, videoUrl, progress: status === 'completed' ? 100 : 50 };
  }
}

export const heyGenService = new HeyGenService();
