// ─────────────────────────────────────────────────────────────
// auth/tokenStore.ts — 토큰 보관함
// 모바일 앱과 동일 정책 (sessionStorage). 운영 전환 시 보안 방식 재검토.
// ─────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

const ACCESS = 'access_token';
const ID = 'id_token';

export function saveTokens(tokens: TokenResponse): void {
  sessionStorage.setItem(ACCESS, tokens.access_token);
  if (tokens.id_token) sessionStorage.setItem(ID, tokens.id_token);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS);
}

export function getIdToken(): string | null {
  return sessionStorage.getItem(ID);
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

export function clearLocalTokens(): void {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(ID);
}
