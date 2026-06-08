// ─────────────────────────────────────────────────────────────
// auth/config.ts — 설정값 보관함
// .env.development / .env.local 에 적어둔 OIDC 설정을 한 곳에 모아 꺼내 쓴다.
// ─────────────────────────────────────────────────────────────

export const authConfig = {
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  authorizeEndpoint: import.meta.env.VITE_OIDC_AUTHORIZE_ENDPOINT,
  tokenEndpoint: import.meta.env.VITE_OIDC_TOKEN_ENDPOINT,
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  scope: import.meta.env.VITE_OIDC_SCOPE,
  endSessionEndpoint: import.meta.env.VITE_OIDC_END_SESSION_ENDPOINT as string | undefined,
  postLogoutRedirectUri:
    (import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI as string | undefined) ??
    (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined),
};

// 비어 있으면 상대경로(/api/...) → Vite 프록시(vite.config.ts)가 admin-service(8085)로 전달(개발).
// 운영은 게이트웨이 주소.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
