import { NextRequest, NextResponse } from 'next/server';

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

export async function GET(request: NextRequest) {
  if (!QDRANT_URL) {
    return NextResponse.json({ error: 'QDRANT_URL not set' }, { status: 500 });
  }

  const path = request.nextUrl.searchParams.get('path') || '';
  const url = `${QDRANT_URL}/${path}`;

  try {
    const qdrantRes = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
      },
    });
    const data = await qdrantRes.json();
    return NextResponse.json(data, { status: qdrantRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', details: err }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!QDRANT_URL) {
    return NextResponse.json({ error: 'QDRANT_URL not set' }, { status: 500 });
  }

  const path = request.nextUrl.searchParams.get('path') || '';
  const url = `${QDRANT_URL}/${path}`;
  const body = await request.json();

  try {
    const qdrantRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await qdrantRes.json();
    return NextResponse.json(data, { status: qdrantRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', details: err }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!QDRANT_URL) {
    return NextResponse.json({ error: 'QDRANT_URL not set' }, { status: 500 });
  }

  const path = request.nextUrl.searchParams.get('path') || '';
  const url = `${QDRANT_URL}/${path}`;

  try {
    const qdrantRes = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}),
      },
    });
    const data = await qdrantRes.json();
    return NextResponse.json(data, { status: qdrantRes.status });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', details: err }, { status: 500 });
  }
}
