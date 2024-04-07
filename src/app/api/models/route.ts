import { orderBy } from 'lodash';
import type { ServerRuntime } from 'next';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime: ServerRuntime = 'edge';

export async function GET(): Promise<NextResponse> {
  const api = new OpenAI();

  try {
    const { data } = await api.models.list();
    const models = orderBy(data, (model) => model.created, 'desc');

    return NextResponse.json({ data: models });
  } catch (error) {
    return NextResponse.json(
      // { error: 'Unable to fetch models.' },
      { error: 'UNABLE_TO_FETCH_MODELS' },
      { status: 502 },
    );
  }
}
