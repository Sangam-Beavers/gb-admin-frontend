import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { MonAlert } from '@/types/admin';
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  alerts: MonAlert[];
  /** true면 정상(경보 0건)일 때 초록 "이상 없음" 배너를 숨긴다(Dashboard 등에서). */
  hideWhenOk?: boolean;
}

/**
 * 위험 경보 배너 — 페이지 상단에 빨강(위험)/주황(주의)/초록(정상)으로 표시.
 * 헤더 뱃지·Monitoring·Dashboard·Charge·Transactions가 동일 컴포넌트를 공유한다.
 */
export default function AlertBanner({ alerts, hideWhenOk = false }: AlertBannerProps) {
  if (alerts.length === 0) {
    if (hideWhenOk) return null;
    return (
      <div className={`${styles.banner} ${styles.ok}`}>
        <div className={`${styles.head} ${styles.headOk}`}>
          <CheckCircle2 size={18} />
          이상 없음 — 활성 경보 0건
        </div>
      </div>
    );
  }
  const hasCritical = alerts.some((a) => a.level === 'critical');
  return (
    <div className={`${styles.banner} ${hasCritical ? styles.critical : styles.warning}`}>
      <div className={`${styles.head} ${hasCritical ? styles.headCritical : styles.headWarning}`}>
        <AlertTriangle size={18} />
        {hasCritical ? '위험 경보' : '주의'} — 활성 경보 {alerts.length}건
      </div>
      <ul className={styles.list}>
        {alerts.map((a, i) => (
          <li key={i} className={styles.item}>
            <span className={`${styles.dot} ${a.level === 'critical' ? styles.dotCritical : styles.dotWarning}`} />
            {a.source && <code className={styles.src}>{a.source}</code>}
            <span className={styles.text}>{a.text}</span>
            {a.dashboardLabel && (
              <span className={styles.dash} title="이 경보는 이 Grafana 대시보드에서 확인">
                📊 {a.dashboardLabel}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
