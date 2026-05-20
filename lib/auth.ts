/**
 * Quran Foundation OAuth2 Auth Helpers
 * Authorization Code flow with PKCE (confidential client)
 */

// ── PKCE helpers (browser-safe, using Web Crypto API) ──

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64url(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(digest);
}

export function generateRandomString(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64url(array.buffer);
}

// ── Auth config ──

export const AUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QF_CLIENT_ID || 'ab85c628-83d6-4b8b-ae23-58cb37dc9f70',
  authBaseUrl:
    process.env.NEXT_PUBLIC_QF_OAUTH_BASE_URL || 'https://prelive-oauth2.quran.foundation',
  redirectUri:
    process.env.NEXT_PUBLIC_QF_OAUTH_REDIRECT_URI ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/callback`
      : 'http://localhost:3000/callback'),
  scope: 'openid offline_access user collection bookmark note goal streak reading_session'
};

// ── Build the login URL (client-side) ──

export async function buildLoginUrl(): Promise<{
  url: string;
  codeVerifier: string;
  state: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(16);
  const nonce = generateRandomString(16);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    scope: AUTH_CONFIG.scope,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return {
    url: `${AUTH_CONFIG.authBaseUrl}/oauth2/auth?${params.toString()}`,
    codeVerifier,
    state
  };
}

// ── Session token interface ──

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number; // unix ms
  user?: {
    sub: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}
