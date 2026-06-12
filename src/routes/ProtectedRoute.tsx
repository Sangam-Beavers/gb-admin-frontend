import { Outlet } from 'react-router-dom';

/**
 * 인증 가드 — 로그인 비활성화(무조건 통과).
 *
 * 관리자 콘솔은 현재 로그인 없이 바로 접근 가능하도록 모든 요청을 그대로 통과시킨다.
 * (이전: VITE_SKIP_AUTH=true 또는 토큰 보유 시에만 통과)
 * 추후 인증을 다시 켜려면 authed 체크 + Navigate(LOGIN) 로직을 복구한다.
 */
export default function ProtectedRoute() {
  return <Outlet />;
}
