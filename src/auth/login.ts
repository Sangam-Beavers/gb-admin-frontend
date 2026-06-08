// ─────────────────────────────────────────────────────────────
// auth/login.ts — 로그인 시작 (PKCE Authorization Code)
// 사용자를 Authentik 인증 화면으로 이동시킨다.
// ─────────────────────────────────────────────────────────────

import { authConfig } from './config';
import { createCodeVerifier, createCodeChallenge, createState } from './pkce';

const VERIFIER_KEY = 'pkce_code_verifier';
const STATE_KEY = 'oauth_state';

export async function startLogin(): Promise<void> {
  const verifier = createCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  const state = createState();

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    scope: authConfig.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${authConfig.authorizeEndpoint}?${params.toString()}`;
}

export const pkceStorageKeys = { VERIFIER_KEY, STATE_KEY };
