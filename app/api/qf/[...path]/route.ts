/**
 * QF API Proxy — /api/qf/[...path]
 *
 * Two auth modes:
 *  - Content paths (/content/api/v4/…)  → user's access token (falls back to public api.quran.com)
 *  - User paths (/v1/…)                 → user's access token (401 when unauthenticated)
 *
 * Token refresh: if the session token is expired or within 60s of expiry, the proxy
 * silently refreshes it via the OAuth refresh_token and writes the updated session
 * cookie onto the response so the browser stays in sync.
 */
import { NextRequest, NextResponse } from 'next/server';

const QF_API_BASE = process.env.QF_API_BASE_URL || 'https://apis.quran.foundation/auth';
const QF_CONTENT_API_BASE =
  process.env.QF_CONTENT_API_BASE_URL ||
  process.env.NEXT_PUBLIC_QF_CONTENT_BASE_URL ||
  'https://apis.quran.foundation/content/api/v4';
const QF_QURAN_REFLECT_BASE =
  process.env.QF_QURAN_REFLECT_URL || 'https://apis.quran.foundation/quran-reflect';
const OAUTH_BASE =
  process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation';

// ─── Session types ────────────────────────────────────────────────────────────

interface AuthSession {
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
  expiresAt: number;
  user: {
    sub: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  if (!session.refreshToken) return null;

  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!;
  const clientSecret = process.env.QF_CLIENT_SECRET!;
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
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
        client_id: clientId
      }).toString(),
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      ...session,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000
    };
  } catch {
    return null;
  }
}

function setSessionCookie(response: NextResponse, session: AuthSession) {
  response.cookies.set('auth_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params);
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params);
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params);
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params);
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params);
}

// ─── Core proxy logic ─────────────────────────────────────────────────────────

async function handleRequest(request: NextRequest, resolvedParams: { path: string[] }) {
  if (!resolvedParams?.path) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const pathParts = resolvedParams.path;
  const isContentPath = pathParts[0] === 'content';
  const isQuranReflectPath = pathParts[0] === 'quran-reflect';

  const upstreamUrl = isContentPath
    ? `${QF_CONTENT_API_BASE}/${pathParts.slice(3).join('/')}`
    : isQuranReflectPath
      ? `${QF_QURAN_REFLECT_BASE}/${pathParts.slice(1).join('/')}`
      : `${QF_API_BASE}/${pathParts.join('/')}`;
  const url = new URL(upstreamUrl);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  // ── Parse session cookie ───────────────────────────────────────────────────
  let session: AuthSession | null = null;
  const raw = request.cookies.get('auth_session')?.value;
  if (raw) {
    try {
      session = JSON.parse(raw) as AuthSession;
    } catch {
      /* ignore malformed cookie */
    }
  }

  // ── Refresh token if expired or within 60s of expiry ──────────────────────
  let refreshedSession: AuthSession | null = null;
  const REFRESH_THRESHOLD_MS = 60_000;
  if (session?.refreshToken && session.expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
    refreshedSession = await refreshSession(session);
    if (refreshedSession) {
      session = refreshedSession;
    } else {
      // Refresh failed — clear session and return 401
      const res = NextResponse.json({ error: 'Session expired' }, { status: 401 });
      res.cookies.delete('auth_session');
      return res;
    }
  }

  const sessionToken = session?.accessToken ?? null;

  // ── Route: content paths are publicly accessible — no user token needed ──────
  // Prelive session tokens are rejected by the production content API, so we
  // always call it without auth. Fall back to api.quran.com if unavailable.
  if (isContentPath) {
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const out = NextResponse.json(data, { status: 200 });
        if (refreshedSession) setSessionCookie(out, refreshedSession);
        return out;
      }
      // Fallback to public api.quran.com
      const fallbackUrl = url
        .toString()
        .replace(QF_CONTENT_API_BASE, 'https://api.quran.com/api/v4');
      const fbRes = await fetch(fallbackUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await fbRes.json().catch(() => ({}));
      const out = NextResponse.json(data, { status: fbRes.status });
      if (refreshedSession) setSessionCookie(out, refreshedSession);
      return out;
    } catch {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // ── Route: user and quran-reflect endpoints require a token ──────────────────
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = sessionToken!;
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID!;

  const reqHeaders: Record<string, string> = {
    'x-auth-token': token,
    'x-client-id': clientId,
    Accept: 'application/json'
  };
  const tz = request.headers.get('x-timezone');
  if (tz) reqHeaders['x-timezone'] = tz;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.text() : undefined;

  const callUpstream = (t: string) =>
    fetch(url.toString(), {
      method: request.method,
      headers: { ...reqHeaders, 'x-auth-token': t },
      body,
      cache: 'no-store'
    });

  try {
    let response = await callUpstream(token);

    // ── On 401/403 expired token, try one inline refresh then retry ───────────
    if ((response.status === 401 || response.status === 403) && session?.refreshToken) {
      const retrySession = await refreshSession(session);
      if (retrySession) {
        session = retrySession;
        refreshedSession = retrySession;
        response = await callUpstream(retrySession.accessToken);
      }
    }

    const data = await response.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: response.status });
    if (refreshedSession) setSessionCookie(res, refreshedSession);
    return res;
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
