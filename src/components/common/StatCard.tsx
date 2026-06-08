import type { ReactNode } from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
}

export default function StatCard({ label, value, hint, tone = 'default', icon }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[`tone_${tone}`]}`}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
