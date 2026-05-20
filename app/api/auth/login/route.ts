/**
 * Login API Route — GET /api/auth/login
 *
 * Generates PKCE pair + state server-side, stores them in httpOnly cookies,
 * then redirects the browser to the QF OAuth2 authorize endpoint.
 *
 * Doc: GET /oauth2/auth
 * Params: response_type, client_id, redirect_uri, scope, state, (optional) nonce,
 *         code_challenge, code_challenge_method
 */
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePkcePair() {
  const codeVerifier = base64url(crypto.randomBytes(32));
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64url(hash);
  return { codeVerifier, codeChallenge };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_QF_CLIENT_ID;
  const authBase =
    process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation';

  // Derive the app URL from the incoming request so this works on any port.
  // NEXT_PUBLIC_QF_OAUTH_REDIRECT_URI can override (e.g. staging / production).
  const requestOrigin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const redirectUri = process.env.NEXT_PUBLIC_QF_OAUTH_REDIRECT_URI || `${requestOrigin}/callback`;

  console.log('[login] redirect_uri will be:', redirectUri);

  if (!clientId) {
    console.error('[login] Missing NEXT_PUBLIC_QF_CLIENT_ID');
    return NextResponse.json({ error: 'Auth configuration missing' }, { status: 500 });
  }

  const { codeVerifier, codeChallenge } = generatePkcePair();
  const state = base64url(crypto.randomBytes(16));
  const nonce = base64url(crypto.randomBytes(16));

  const scope =
    process.env.QF_AUTH_SCOPE ||
    'offline_access profile user collection bookmark note goal streak reading_session activity_day room preference comment post';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `${authBase}/oauth2/auth?${params.toString()}`;
  console.log('[login] Redirecting to:', authUrl);

  const response = NextResponse.redirect(authUrl);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 600, // 10 minutes — enough time to complete login
    path: '/'
  };

  response.cookies.set('oauth_state', state, cookieOptions);
  response.cookies.set('oauth_code_verifier', codeVerifier, cookieOptions);

  return response;
}
