import { NextResponse } from 'next/server';
import { PROVIDER_CONFIGS, LLMProvider } from '@/lib/llm-gateway';

export async function GET() {
  try {
    const providers = (Object.keys(PROVIDER_CONFIGS) as LLMProvider[]).map((key) => {
      const cfg = PROVIDER_CONFIGS[key];
      const hasServerKey = Boolean(process.env[cfg.envKey] && process.env[cfg.envKey]!.trim().length > 0);

      return {
        id: key,
        name: cfg.name,
        description: cfg.description,
        defaultModel: cfg.defaultModel,
        visionModel: cfg.visionModel,
        models: cfg.models,
        envKey: cfg.envKey,
        apiKeyDocsUrl: cfg.apiKeyDocsUrl,
        hasServerKey,
      };
    });

    return NextResponse.json({
      success: true,
      defaultProvider: 'groq',
      providers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
