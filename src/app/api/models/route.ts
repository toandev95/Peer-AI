import { orderBy } from 'lodash';
import type { ServerRuntime } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { env } from '@/lib/env.mjs';

export const runtime: ServerRuntime = 'edge';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customApiKey = req.headers.get('x-custom-api-key');
  const customBaseUrl = req.headers.get('x-custom-base-url');

  const api = new OpenAI({
    apiKey: customApiKey || env.OPENAI_API_KEY,
    baseURL: customBaseUrl || env.OPENAI_BASE_URL,
  });

  try {
    const { data } = await api.models.list();
    const models = orderBy(data, (model) => model.created, 'desc');

    return NextResponse.json({ data: models });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'UNABLE_TO_FETCH_MODELS' },
      { status: 502 },
    );
  }
}
