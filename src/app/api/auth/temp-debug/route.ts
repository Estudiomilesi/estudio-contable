import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('key') === 'FedeTest123') {
    return NextResponse.json({
      db: process.env.DATABASE_URL,
      direct: process.env.DIRECT_URL
    });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
