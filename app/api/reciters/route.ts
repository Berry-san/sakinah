import { NextResponse } from 'next/server';

const CONTENT_BASE = 'https://apis.quran.foundation/content/api/v4';
const OAUTH_BASE = 'https://oauth2.quran.foundation';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getContentToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) return cachedToken;

  const clientId = process.env.QF_CONTENT_CLIENT_ID;
  const clientSecret = process.env.QF_CONTENT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const res = await fetch(`${OAUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        scope: 'content'
      }).toString(),
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('[reciters] token fetch failed:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    return cachedToken;
  } catch (err) {
    console.error('[reciters] token fetch threw:', err);
    return null;
  }
}

export async function GET() {
  const clientId = process.env.QF_CONTENT_CLIENT_ID;
  const token = await getContentToken();

  if (!token) {
    return NextResponse.json({ error: 'Unable to obtain content token' }, { status: 503 });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-auth-token': token,
    'x-client-id': clientId!
  };

  try {
    const res = await fetch(`${CONTENT_BASE}/resources/chapter_reciters`, {
      headers,
      cache: 'no-store'
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[reciters] upstream fetch failed:', err);
    return NextResponse.json({ error: 'Failed to fetch reciters' }, { status: 500 });
  }
}
