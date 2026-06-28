/**
 * Cliente centralizado para NVIDIA NIM (gratuito) com fallback para OpenAI.
 *
 * NVIDIA NIM é 100% compatível com a API da OpenAI.
 * Basta configurar NVIDIA_API_KEY no .env.local para ativar o modo gratuito.
 *
 * Modelos disponíveis (gratuitos em build.nvidia.com):
 *   - LLM: meta/llama-3.3-70b-instruct (recomendado para português)
 *   - LLM: nvidia/llama-3.1-nemotron-ultra-253b-v1 (melhor qualidade)
 *   - LLM: mistralai/mistral-large-2-instruct
 *   - LLM: deepseek-ai/deepseek-r1-0528 (raciocínio avançado)
 */

import OpenAI from 'openai';

export type AIProvider = 'nvidia' | 'openai';

export interface AIClientConfig {
  provider: AIProvider;
  client: OpenAI;
  defaultModel: string;
}

/**
 * Cria e retorna o cliente de IA configurado automaticamente.
 * Prioridade: NVIDIA NIM (grátis) → OpenAI (pago)
 */
export function getAIClient(): AIClientConfig {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // NVIDIA NIM tem prioridade se a chave estiver configurada
  if (nvidiaKey && nvidiaKey !== 'cole_sua_chave_nvidia_aqui' && nvidiaKey.startsWith('nvapi-')) {
    const client = new OpenAI({
      apiKey: nvidiaKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const defaultModel =
      process.env.NVIDIA_LLM_MODEL || 'meta/llama-3.3-70b-instruct';

    console.log(`[AI] Usando NVIDIA NIM (${defaultModel}) — modo gratuito ✓`);
    return { provider: 'nvidia', client, defaultModel };
  }

  // Fallback: OpenAI
  if (openaiKey && openaiKey !== 'cole_sua_chave_openai_aqui') {
    const client = new OpenAI({ apiKey: openaiKey });
    const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    console.log(`[AI] Usando OpenAI (${defaultModel})`);
    return { provider: 'openai', client, defaultModel };
  }

  // Modo demo (sem chave configurada) — retorna cliente inválido, lógica de demo tratada em cada rota
  console.warn('[AI] Nenhuma API key configurada. Modo demo ativado.');
  return {
    provider: 'openai',
    client: new OpenAI({ apiKey: 'demo-mode' }),
    defaultModel: 'demo',
  };
}

/**
 * Verifica se algum provedor de IA está configurado
 */
export function isAIConfigured(): boolean {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const nvidiaOk = nvidiaKey && nvidiaKey !== 'cole_sua_chave_nvidia_aqui' && nvidiaKey.startsWith('nvapi-');
  const openaiOk = openaiKey && openaiKey !== 'cole_sua_chave_openai_aqui' && !openaiKey.includes('proj-FnAd');

  return !!(nvidiaOk || openaiOk);
}

/**
 * Retorna o nome legível do provedor atual
 */
export function getProviderName(): string {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
    return 'NVIDIA NIM (Gratuito)';
  }
  return 'OpenAI';
}
