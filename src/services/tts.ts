import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export class TTSService {
  private elevenLabsKey: string;
  private nvidiaKey: string;

  constructor() {
    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY || '';
    this.nvidiaKey = process.env.NVIDIA_API_KEY || '';
  }

  async listVoices() {
    const isDemoMode = !this.elevenLabsKey || this.elevenLabsKey === 'cole_sua_chave_aqui';
    if (isDemoMode) {
      throw new Error('Chave da API da ElevenLabs não configurada.');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': this.elevenLabsKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao listar vozes do ElevenLabs.');
    }

    const data = await response.json();
    const voices = data.voices.map((voice: any) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      category: voice.category,
      labels: voice.labels || {},
      previewUrl: voice.preview_url || null,
    }));

    voices.sort((a: any, b: any) => {
      if (a.category === 'cloned' && b.category !== 'cloned') return -1;
      if (a.category !== 'cloned' && b.category === 'cloned') return 1;
      return 0;
    });

    const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID;
    return {
      voices,
      configuredVoiceId: configuredVoiceId && configuredVoiceId !== 'cole_o_id_da_sua_voz_aqui' ? configuredVoiceId : null,
    };
  }

  async generateAudio(payload: { script: string; voiceId?: string; voiceSettings?: any }) {
    if (!payload.script) {
      throw new Error('Faltando o roteiro para gerar o áudio.');
    }

    const useNvidia = this.nvidiaKey && this.nvidiaKey !== 'cole_sua_chave_nvidia_aqui' && this.nvidiaKey.startsWith('nvapi-');

    if (useNvidia) {
      console.log('[TTS] Usando NVIDIA NIM Magpie-TTS — modo gratuito ✓');
      try {
        const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.nvidiaKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.NVIDIA_TTS_MODEL || 'nvidia/magpie-tts-multilingual',
            input: payload.script,
            voice: 'Leonardo',
            response_format: 'mp3',
          }),
        });

        if (nvidiaResponse.ok) {
          const audioBuffer = await nvidiaResponse.arrayBuffer();
          return this.saveAudio(audioBuffer, 'nvidia');
        }
      } catch (nvidiaErr) {
        console.warn('[TTS] Erro NVIDIA NIM TTS, tentando ElevenLabs...', nvidiaErr);
      }
    }

    const isDemoMode = !this.elevenLabsKey || this.elevenLabsKey === 'cole_sua_chave_aqui';
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        audioDataUrl: "data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
        downloadUrl: "#",
        filename: "demo_audio.mp3",
        timestamp: Date.now(),
        provider: 'demo',
      };
    }

    const voiceId = payload.voiceId || process.env.ELEVENLABS_VOICE_ID;
    if (!voiceId || voiceId === 'cole_o_id_da_sua_voz_aqui') {
      throw new Error('Voice ID não configurado.');
    }

    console.log('[TTS] Usando ElevenLabs');
    const settings = {
      stability: payload.voiceSettings?.stability ?? 0.5,
      similarity_boost: payload.voiceSettings?.similarityBoost ?? 0.75,
      style: payload.voiceSettings?.style ?? 0.2,
      use_speaker_boost: true,
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': this.elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: payload.script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: settings,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Falha ao comunicar com o ElevenLabs.';
      try {
        const errorData = await response.json();
        if (errorData.detail?.message) errorMessage = errorData.detail.message;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const audioBuffer = await response.arrayBuffer();
    return this.saveAudio(audioBuffer, 'elevenlabs');
  }

  private async saveAudio(arrayBuffer: ArrayBuffer, provider: string) {
    const timestamp = Date.now();
    const filename = `audio_${provider}_${timestamp}.mp3`;
    const audioDir = path.join(process.cwd(), 'public', 'audio');

    try {
      await mkdir(audioDir, { recursive: true });
      await writeFile(path.join(audioDir, filename), Buffer.from(arrayBuffer));
    } catch (fileError) {
      console.error('Error saving audio file:', fileError);
    }

    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    return {
      audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`,
      downloadUrl: `/audio/${filename}`,
      filename,
      timestamp,
      provider,
    };
  }
}

export const ttsService = new TTSService();
