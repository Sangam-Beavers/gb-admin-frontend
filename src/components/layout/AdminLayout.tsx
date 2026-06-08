import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import styles from './AdminLayout.module.css';

/**
 * 관리자 콘솔 표준 레이아웃.
 *
 * - 좌측: Sidebar (240px 고정, 다크 네이비)
 * - 우측: TopHeader + main 컨텐츠 영역 (밝은 회색 배경)
 */
export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <TopHeader />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
