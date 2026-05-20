/**
 * Debug route — GET /api/auth/debug
 * Decodes the current access token (no signature verification) and returns
 * the claims so you can see exactly what scopes were granted.
 * Remove this file before going to production.
 */
import { NextRequest, NextResponse } from 'next/server';

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('auth_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session cookie found' }, { status: 401 });
  }

  let session: Record<string, unknown>;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return NextResponse.json({ error: 'Could not parse session cookie' }, { status: 400 });
  }

  const token = session.accessToken as string | undefined;
  if (!token) {
    return NextResponse.json({ error: 'No accessToken in session' }, { status: 400 });
  }

  const claims = decodeJwt(token);
  return NextResponse.json({
    tokenPreview: `${token.slice(0, 20)}…`,
    claims,
    sessionExpiresAt: session.expiresAt,
    hasRefreshToken: !!session.refreshToken
  });
}
