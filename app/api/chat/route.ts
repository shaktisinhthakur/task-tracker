import { NextResponse } from 'next/server';
import { buildRagContext } from '@/lib/rag-service';
import { executeLLM, LLMProvider, ChatMessage, ImageAttachment } from '@/lib/llm-gateway';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages,
      provider = 'groq',
      model,
      apiKey,
      images = [],
      customDocs = [],
      useRag = true,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // Get last user query for RAG retrieval
    const lastUserMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'user')?.content || '';

    let systemPrompt = 'You are a helpful and intelligent AI assistant.';
    let sources: any[] = [];
    let metricsSummary: any = null;

    if (useRag) {
      const ragResult = await buildRagContext(lastUserMessage, customDocs);
      systemPrompt = ragResult.systemPrompt;
      sources = ragResult.sources;
      metricsSummary = ragResult.metricsSummary;
    }

    const response = await executeLLM({
      provider: provider as LLMProvider,
      model,
      apiKeyOverride: apiKey,
      messages,
      systemPrompt,
      images: images as ImageAttachment[],
    });

    return NextResponse.json({
      success: true,
      content: response.content,
      provider: response.provider,
      model: response.model,
      sources,
      metrics: metricsSummary,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while communicating with the AI model.',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
