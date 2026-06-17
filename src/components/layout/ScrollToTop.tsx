import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 라우트(경로) 변경 시 스크롤을 맨 위로 올린다.
 * 사이드바 탭을 전환했을 때 직전 페이지의 스크롤 위치가 남아 중간부터 보이던 문제를 방지한다.
 * (AdminLayout의 스크롤 컨테이너는 window — .shell이 min-height:100vh라 페이지 자체가 스크롤됨)
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
