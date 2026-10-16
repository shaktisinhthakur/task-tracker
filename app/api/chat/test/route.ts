import { NextResponse } from 'next/server';
import { testLlmApiKey, LLMProvider } from '@/lib/llm-gateway';

export async function POST(request: Request) {
  try {
    const { provider, apiKey, model } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required.' }, { status: 400 });
    }

    const result = await testLlmApiKey(provider as LLMProvider, apiKey, model);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Key verification failed.' },
      { status: 500 }
    );
  }
}
