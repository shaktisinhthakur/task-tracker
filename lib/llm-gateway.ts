export type LLMProvider = 'groq' | 'openai' | 'anthropic' | 'gemini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ImageAttachment {
  name?: string;
  mimeType: string;
  base64Data: string; // raw base64 or data URI
}

export interface LLMRequestOptions {
  provider: LLMProvider;
  model?: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  images?: ImageAttachment[];
  apiKeyOverride?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export const PROVIDER_CONFIGS: Record<
  LLMProvider,
  {
    name: string;
    description: string;
    defaultModel: string;
    visionModel: string;
    models: { id: string; label: string; supportsVision?: boolean }[];
    envKey: string;
    apiKeyDocsUrl: string;
  }
> = {
  groq: {
    name: 'Groq (Ultra-Fast Inference)',
    description: 'Primary high-speed Llama-3 inference engine with lightning response times.',
    defaultModel: 'llama-3.1-8b-instant',
    visionModel: 'llama-3.2-11b-vision-preview',
    models: [
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra-fast & Recommended)' },
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
      { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
      { id: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 11B Vision (Multimodal)', supportsVision: true },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32k context)' },
    ],
    envKey: 'GROQ_API_KEY',
    apiKeyDocsUrl: 'https://console.groq.com/keys',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    description: 'Industry-standard GPT models with high reasoning and multimodal vision.',
    defaultModel: 'gpt-4o-mini',
    visionModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-effective)', supportsVision: true },
      { id: 'gpt-4o', label: 'GPT-4o (Omni Reasoning & Vision)', supportsVision: true },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    envKey: 'OPENAI_API_KEY',
    apiKeyDocsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Advanced nuance, deep document comprehension, and long-context analysis.',
    defaultModel: 'claude-3-5-sonnet-20241022',
    visionModel: 'claude-3-5-sonnet-20241022',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (State-of-the-Art)', supportsVision: true },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast & Precise)', supportsVision: true },
    ],
    envKey: 'ANTHROPIC_API_KEY',
    apiKeyDocsUrl: 'https://console.anthropic.com/settings/keys',
  },
  gemini: {
    name: 'Google Gemini',
    description: "Google's multimodal powerhouse with large context windows.",
    defaultModel: 'gemini-1.5-flash',
    visionModel: 'gemini-1.5-flash',
    models: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Ultra-fast)', supportsVision: true },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep reasoning)', supportsVision: true },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-gen)', supportsVision: true },
    ],
    envKey: 'GEMINI_API_KEY',
    apiKeyDocsUrl: 'https://aistudio.google.com/app/apikey',
  },
};

/**
 * Resolves API Key by checking:
 * 1. User client override (passed from UI settings)
 * 2. Process environment variables
 */
export function resolveApiKey(provider: LLMProvider, apiKeyOverride?: string): string {
  if (apiKeyOverride && apiKeyOverride.trim().length > 0) {
    return apiKeyOverride.trim();
  }

  const envKeyName = PROVIDER_CONFIGS[provider].envKey;
  const envVal = process.env[envKeyName];
  if (envVal && envVal.trim().length > 0) {
    return envVal.trim();
  }

  return '';
}

/**
 * Helper to clean base64 data
 */
function cleanBase64(raw: string): { cleanData: string; mimeType: string } {
  if (raw.startsWith('data:')) {
    const parts = raw.split(',');
    const meta = parts[0];
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    return { cleanData: parts[1] || '', mimeType };
  }
  return { cleanData: raw, mimeType: 'image/jpeg' };
}

/**
 * Call Groq API (OpenAI-compatible)
 */
async function callGroq(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  images: ImageAttachment[] = []
): Promise<LLMResponse> {
  const chosenModel = images.length > 0 && !model.includes('vision')
    ? PROVIDER_CONFIGS.groq.visionModel
    : model || PROVIDER_CONFIGS.groq.defaultModel;

  const formattedMessages: any[] = [];

  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  messages.forEach((msg, idx) => {
    // If it's the last user message and images are attached, construct multimodal content
    if (msg.role === 'user' && idx === messages.length - 1 && images.length > 0) {
      const contentParts: any[] = [{ type: 'text', text: msg.content }];
      images.forEach((img) => {
        const { cleanData, mimeType } = cleanBase64(img.base64Data);
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || mimeType};base64,${cleanData}`,
          },
        });
      });
      formattedMessages.push({ role: 'user', content: contentParts });
    } else {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  });

  let res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  let finalModel = chosenModel;

  // Resilient fallback: If model was 404 (e.g. tier-restricted or model_not_found), fallback to llama-3.1-8b-instant
  if (!res.ok && res.status === 404 && chosenModel !== 'llama-3.1-8b-instant') {
    console.warn(`Groq model "${chosenModel}" returned 404. Automatically falling back to "llama-3.1-8b-instant"...`);
    finalModel = 'llama-3.1-8b-instant';
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalModel,
        messages: formattedMessages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || 'No response generated.';

  return {
    content,
    provider: 'groq',
    model: finalModel,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  images: ImageAttachment[] = []
): Promise<LLMResponse> {
  const chosenModel = images.length > 0 && model === 'gpt-3.5-turbo'
    ? 'gpt-4o-mini'
    : model || PROVIDER_CONFIGS.openai.defaultModel;

  const formattedMessages: any[] = [];

  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  messages.forEach((msg, idx) => {
    if (msg.role === 'user' && idx === messages.length - 1 && images.length > 0) {
      const contentParts: any[] = [{ type: 'text', text: msg.content }];
      images.forEach((img) => {
        const { cleanData, mimeType } = cleanBase64(img.base64Data);
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || mimeType};base64,${cleanData}`,
          },
        });
      });
      formattedMessages.push({ role: 'user', content: contentParts });
    } else {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || 'No response generated.';

  return {
    content,
    provider: 'openai',
    model: chosenModel,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    },
  };
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  images: ImageAttachment[] = []
): Promise<LLMResponse> {
  const chosenModel = model || PROVIDER_CONFIGS.anthropic.defaultModel;

  const formattedMessages: any[] = [];

  messages.forEach((msg, idx) => {
    if (msg.role === 'system') return; // Handled in top-level system parameter for Claude

    if (msg.role === 'user' && idx === messages.length - 1 && images.length > 0) {
      const contentParts: any[] = [];
      images.forEach((img) => {
        const { cleanData, mimeType } = cleanBase64(img.base64Data);
        contentParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mimeType || mimeType,
            data: cleanData,
          },
        });
      });
      contentParts.push({ type: 'text', text: msg.content });
      formattedMessages.push({ role: 'user', content: contentParts });
    } else {
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: chosenModel,
      system: systemPrompt,
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const content =
    data.content
      ?.filter((part: any) => part.type === 'text')
      ?.map((part: any) => part.text)
      ?.join('\n') || 'No response generated.';

  return {
    content,
    provider: 'anthropic',
    model: chosenModel,
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
    },
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  images: ImageAttachment[] = []
): Promise<LLMResponse> {
  const chosenModel = model || PROVIDER_CONFIGS.gemini.defaultModel;

  const contents: any[] = [];

  messages.forEach((msg, idx) => {
    if (msg.role === 'system') return;

    const parts: any[] = [];

    if (msg.role === 'user' && idx === messages.length - 1 && images.length > 0) {
      images.forEach((img) => {
        const { cleanData, mimeType } = cleanBase64(img.base64Data);
        parts.push({
          inlineData: {
            mimeType: img.mimeType || mimeType,
            data: cleanData,
          },
        });
      });
    }

    parts.push({ text: msg.content });
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    });
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ||
    'No response generated.';

  return {
    content,
    provider: 'gemini',
    model: chosenModel,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount,
      completionTokens: data.usageMetadata?.candidatesTokenCount,
      totalTokens: data.usageMetadata?.totalTokenCount,
    },
  };
}

/**
 * Unified Multi-Model Gateway Executor
 */
export async function executeLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const { provider, model, messages, systemPrompt = '', images = [], apiKeyOverride } = options;

  const apiKey = resolveApiKey(provider, apiKeyOverride);

  if (!apiKey) {
    const config = PROVIDER_CONFIGS[provider];
    throw new Error(
      `Missing API Key for ${config.name}.\n` +
      `Please provide an API key in the AI Assistant settings or configure the environment variable "${config.envKey}".\n` +
      `You can get a key at: ${config.apiKeyDocsUrl}`
    );
  }

  switch (provider) {
    case 'groq':
      return await callGroq(apiKey, model || PROVIDER_CONFIGS.groq.defaultModel, systemPrompt, messages, images);
    case 'openai':
      return await callOpenAI(apiKey, model || PROVIDER_CONFIGS.openai.defaultModel, systemPrompt, messages, images);
    case 'anthropic':
      return await callAnthropic(apiKey, model || PROVIDER_CONFIGS.anthropic.defaultModel, systemPrompt, messages, images);
    case 'gemini':
      return await callGemini(apiKey, model || PROVIDER_CONFIGS.gemini.defaultModel, systemPrompt, messages, images);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Test connectivity and validity of an API key for any provider
 */
export async function testLlmApiKey(
  provider: LLMProvider,
  apiKey: string,
  model?: string
): Promise<{ ok: boolean; message: string; modelUsed: string }> {
  try {
    const testMessages: ChatMessage[] = [
      { role: 'user', content: 'Say "Connection successful" in 2 words.' },
    ];
    const res = await executeLLM({
      provider,
      apiKeyOverride: apiKey,
      model,
      messages: testMessages,
      systemPrompt: 'Respond concisely.',
    });

    return {
      ok: true,
      message: `Verified! Response: "${res.content.trim().slice(0, 40)}"`,
      modelUsed: res.model,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.message || 'Verification failed. Please check key validity and network.',
      modelUsed: model || 'default',
    };
  }
}
