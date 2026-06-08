import type { ReactNode } from 'react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * 페이지 상단 필터 바. 좌측에는 필터 컨트롤들, 우측에는 액션 버튼들.
 */
export default function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.filters}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
