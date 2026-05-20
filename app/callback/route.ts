/**
 * OAuth2 Callback Handler — GET /callback
 *
 * Exchanges the authorization code for tokens using the Authorization Code + PKCE
 * flow described at https://api-docs.quran.foundation/docs/oauth2_apis_versioned/oauth-2-apis/
 *
 * Flow:
 *  1. Validate `state` against the httpOnly cookie set in /api/auth/login
 *  2. Exchange `code` + PKCE verifier for tokens at POST /oauth2/token
 *  3. Fetch user profile from GET /userinfo using the access token
 *  4. Store a server-side session in an httpOnly cookie
 *  5. Redirect to the dashboard
 */
import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE =
  process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation';
const CLIENT_ID = process.env.NEXT_PUBLIC_QF_CLIENT_ID!;
const CLIENT_SECRET = process.env.QF_CLIENT_SECRET!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // ── 1. Handle provider-level errors ─────────────────────────────────────────
  if (error) {
    console.error('[callback] Provider error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_code_or_state', request.url));
  }

  // ── 2. Validate state (CSRF protection) ─────────────────────────────────────
  const storedState = request.cookies.get('oauth_state')?.value;
  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;

  if (!storedState || storedState !== state) {
    console.error('[callback] State mismatch', { storedState, state });
    return NextResponse.redirect(new URL('/login?error=state_mismatch', request.url));
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/login?error=missing_verifier', request.url));
  }

  // Build redirect_uri — must match exactly what was sent in the login request
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const redirectUri = process.env.NEXT_PUBLIC_QF_OAUTH_REDIRECT_URI || `${appUrl}/callback`;

  // ── 3. Exchange code for tokens ──────────────────────────────────────────────
  // Per the docs: POST /oauth2/token with client credentials in Basic Auth header
  // client_id in body is also acceptable per the doc but Basic auth is preferred
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier, // PKCE verifier
    client_id: CLIENT_ID // Included in body as well for compatibility
  });

  let tokenData: {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };

  try {
    const tokenRes = await fetch(`${AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json'
      },
      body: tokenBody.toString()
    });

    const raw = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('[callback] Token exchange failed:', raw);
      const msg = raw.error_description || raw.error || 'token_exchange_failed';
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, request.url));
    }

    tokenData = raw;
  } catch (err) {
    console.error('[callback] Token fetch threw:', err);
    return NextResponse.redirect(new URL('/login?error=network_error', request.url));
  }

  // ── 4. Fetch user profile from /userinfo ────────────────────────────────────
  // Doc: GET /userinfo with Authorization: Bearer <access_token>
  // Returns: sub, name, given_name, family_name, preferred_username, email, email_verified
  let userInfo: {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
  } = { sub: '' };

  try {
    const userRes = await fetch(`${AUTH_BASE}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json'
      }
    });

    if (userRes.ok) {
      userInfo = await userRes.json();
    } else {
      // Non-fatal — decode id_token as fallback if userinfo fails
      if (tokenData.id_token) {
        try {
          const payload = JSON.parse(
            Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString('utf-8')
          );
          userInfo = {
            sub: payload.sub || '',
            email: payload.email,
            name: payload.name,
            given_name: payload.given_name,
            family_name: payload.family_name,
            preferred_username: payload.preferred_username
          };
        } catch {
          /* ignore */
        }
      }
    }
  } catch (err) {
    console.error('[callback] /userinfo request failed (non-fatal):', err);
  }

  // ── 5. Build and store the session ──────────────────────────────────────────
  const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

  const session = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    idToken: tokenData.id_token || null,
    expiresAt,
    user: {
      sub: userInfo.sub,
      email: userInfo.email || null,
      firstName: userInfo.given_name || null,
      lastName: userInfo.family_name || null,
      name: userInfo.name || userInfo.preferred_username || null
    }
  };

  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  // Store full session in httpOnly cookie (server-side only)
  response.cookies.set('auth_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  // Clean up PKCE / state cookies
  response.cookies.delete('oauth_state');
  response.cookies.delete('oauth_code_verifier');

  return response;
}
