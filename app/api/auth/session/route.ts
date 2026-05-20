/**
 * Session API Route — GET /api/auth/session
 *
 * Returns the authenticated user from the httpOnly session cookie.
 * Also silently refreshes the access token when it is within 60 seconds
 * of expiry, using the refresh_token stored in the session.
 *
 * Doc ref: POST /oauth2/token with grant_type=refresh_token
 */
import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE =
  process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation';
const CLIENT_ID = process.env.NEXT_PUBLIC_QF_CLIENT_ID!;
const CLIENT_SECRET = process.env.QF_CLIENT_SECRET!;

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
} | null> {
  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const res = await fetch(`${AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID
      }).toString()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[session] Token refresh failed:', err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[session] Token refresh threw:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('auth_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  let session: {
    accessToken: string;
    refreshToken?: string | null;
    idToken?: string | null;
    expiresAt: number;
    user: {
      sub: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      name?: string | null;
    };
  };

  try {
    session = JSON.parse(sessionCookie);
  } catch {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete('auth_session');
    return res;
  }

  // ── Silent token refresh (if expiring within 60 seconds) ────────────────────
  const REFRESH_THRESHOLD_MS = 60_000;
  if (session.refreshToken && session.expiresAt - Date.now() < REFRESH_THRESHOLD_MS) {
    const fresh = await refreshAccessToken(session.refreshToken);
    if (fresh) {
      session.accessToken = fresh.access_token;
      session.refreshToken = fresh.refresh_token ?? session.refreshToken;
      session.expiresAt = Date.now() + fresh.expires_in * 1000;

      // Persist the updated session back into the cookie
      const res = NextResponse.json({
        authenticated: true,
        user: session.user,
        expiresAt: session.expiresAt
      });
      res.cookies.set('auth_session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      return res;
    } else {
      // Refresh failed — clear session and force re-login
      const res = NextResponse.json({ authenticated: false, user: null });
      res.cookies.delete('auth_session');
      return res;
    }
  }

  // ── Session has hard-expired and no refresh available ───────────────────────
  if (session.expiresAt && Date.now() > session.expiresAt) {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete('auth_session');
    return res;
  }

  // ── Valid session ─────────────────────────────────────────────────────────────
  return NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt
  });
}
