// ─────────────────────────────────────────────────────────────
// pages/auth/Callback/Callback.tsx — OIDC code → token 교환
// 모바일 앱 frontend 의 Callback 과 동일 구현(SSOT 동기화).
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authConfig } from '@/auth/config';
import { pkceStorageKeys } from '@/auth/login';
import { saveTokens, type TokenResponse } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      const url = new URLSearchParams(window.location.search);
      const code = url.get('code');
      const returnedState = url.get('state');

      if (!code) {
        setError('code가 없습니다. 로그인 주소가 잘못됐을 수 있어요.');
        return;
      }

      const savedState = sessionStorage.getItem(pkceStorageKeys.STATE_KEY);
      if (!returnedState || returnedState !== savedState) {
        setError('state가 일치하지 않아 보안상 로그인을 중단했어요.');
        return;
      }

      const verifier = sessionStorage.getItem(pkceStorageKeys.VERIFIER_KEY);
      if (!verifier) {
        setError('verifier가 없습니다. 로그인을 처음부터 다시 시도해 주세요.');
        return;
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: authConfig.redirectUri,
        client_id: authConfig.clientId,
        code_verifier: verifier,
      });

      try {
        const res = await fetch(authConfig.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!res.ok) {
          setError(`토큰 교환 실패 (${res.status})`);
          return;
        }

        const tokens = (await res.json()) as TokenResponse;
        saveTokens(tokens);
        sessionStorage.removeItem(pkceStorageKeys.STATE_KEY);
        sessionStorage.removeItem(pkceStorageKeys.VERIFIER_KEY);
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch (e) {
        setError(`네트워크 오류: ${String(e)}`);
      }
    }

    run();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h3>로그인 실패</h3>
        <p style={{ color: '#d9534f' }}>{error}</p>
        <a href={ROUTES.LOGIN}>로그인 화면으로</a>
      </div>
    );
  }

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>;
}
