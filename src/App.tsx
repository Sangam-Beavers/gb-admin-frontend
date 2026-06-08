import Router from '@/routes/Router';

/**
 * 관리자 콘솔은 모바일 앱(430px)과 달리 데스크탑 풀와이드 레이아웃.
 * 좌우 여백·max-width 제한 없이 사이드바 + 컨텐츠 영역이 화면 전체를 사용.
 */
function App() {
  return <Router />;
}

export default App;
