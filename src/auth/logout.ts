// ─────────────────────────────────────────────────────────────
// auth/logout.ts — RP-Initiated Logout
// 로컬 토큰 정리 후 Authentik end_session endpoint 로 redirect.
// ─────────────────────────────────────────────────────────────

import { authConfig } from './config';
import { clearLocalTokens, getIdToken } from './tokenStore';

export function startLogout(): void {
  const idToken = getIdToken();
  clearLocalTokens();

  if (authConfig.endSessionEndpoint) {
    const params = new URLSearchParams();
    if (idToken) params.set('id_token_hint', idToken);
    if (authConfig.postLogoutRedirectUri) {
      params.set('post_logout_redirect_uri', authConfig.postLogoutRedirectUri);
    }
    window.location.href = `${authConfig.endSessionEndpoint}?${params.toString()}`;
    return;
  }

  // fallback — env 미설정 시 로컬만 정리하고 로그인 화면으로.
  window.location.href = '/login';
}
