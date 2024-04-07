import { NextResponse } from 'next/server';

export async function middleware(): Promise<NextResponse> {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
