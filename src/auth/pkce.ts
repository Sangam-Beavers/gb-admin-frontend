// ─────────────────────────────────────────────────────────────
// auth/pkce.ts — PKCE 보안 장치
// 모바일 앱 frontend 와 동일한 구현. SSOT 동기화 시 함께 갱신.
// ─────────────────────────────────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function createCodeVerifier(): string {
  return randomString(32);
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function createState(): string {
  return randomString(16);
}
