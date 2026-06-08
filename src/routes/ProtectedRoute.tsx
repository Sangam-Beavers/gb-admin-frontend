import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { isLoggedIn } from '@/auth/tokenStore';

/**
 * 인증 가드.
 * - VITE_SKIP_AUTH=true 면 우회 (오늘 데모용).
 * - 미인증이면 /login으로.
 *
 * TODO: 토큰 만료(401)는 axios interceptor 가 처리. 여기서는 "토큰 보유" 만 확인.
 */
export default function ProtectedRoute() {
  const authed = import.meta.env.VITE_SKIP_AUTH === 'true' || isLoggedIn();
  if (!authed) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
