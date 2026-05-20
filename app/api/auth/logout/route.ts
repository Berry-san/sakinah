/**
 * Logout API Route — GET /api/auth/logout
 *
 * Clears the server-side session cookie and redirects to the home page.
 * Optionally triggers the QF RP-Initiated Logout endpoint so the user
 * is also signed out from the Quran Foundation identity provider.
 *
 * Doc: GET /oauth2/sessions/logout
 * Params: id_token_hint (recommended), post_logout_redirect_uri, state
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authBase =
    process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation';
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Read id_token from session (needed for RP-Initiated Logout hint)
  const sessionCookie = request.cookies.get('auth_session')?.value;
  let idToken: string | null = null;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      idToken = session.idToken || null;
    } catch {
      /* ignore */
    }
  }

  // Fire-and-forget RP-Initiated Logout to clear the QF server-side session.
  // We do NOT pass post_logout_redirect_uri because the client URI isn't whitelisted.
  if (idToken) {
    const logoutParams = new URLSearchParams({ id_token_hint: idToken });
    fetch(`${authBase}/oauth2/sessions/logout?${logoutParams.toString()}`).catch(() => {});
  }

  // Clear local session cookie and send user to home page.
  const response = NextResponse.redirect(`${appUrl}/`);
  response.cookies.set('auth_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  return response;
}
