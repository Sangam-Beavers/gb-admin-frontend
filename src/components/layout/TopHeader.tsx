import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import styles from './TopHeader.module.css';
import { ROUTES } from '@/constants/routes';
import { useAlerts } from '@/hooks/useAdminQueries';

function titleKeyFromPath(pathname: string): string {
  switch (pathname) {
    case ROUTES.DASHBOARD:
      return 'nav.dashboard';
    case ROUTES.MONITORING:
      return 'nav.monitoring';
    case ROUTES.TRANSACTIONS:
      return 'nav.transactions';
    case ROUTES.FINANCIAL_AUDIT_LOG:
      return 'nav.financialAuditLog';
    case ROUTES.CHARGE_ATTEMPTS:
      return 'nav.chargeAttempts';
    case ROUTES.USERS:
      return 'nav.users';
    case ROUTES.COMMUNITY:
      return 'nav.community';
    case ROUTES.DOCUMENTS:
      return 'nav.documents';
    case ROUTES.SETTINGS:
      return 'nav.settings';
    default:
      return 'app.name';
  }
}

export default function TopHeader() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { alerts, hasCritical } = useAlerts();
  const count = alerts.length;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{t(titleKeyFromPath(pathname))}</h1>
      <div className={styles.right}>
        <Link
          to={ROUTES.MONITORING}
          className={`${styles.alertBadge} ${
            count === 0 ? styles.alertOk : hasCritical ? styles.alertCritical : styles.alertWarning
          }`}
          title="모니터링에서 상세 보기"
        >
          {count === 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {count === 0 ? '경보 없음' : `경보 ${count}건`}
        </Link>
        <span className={styles.subtitle}>{t('app.subtitle')}</span>
      </div>
    </header>
  );
}
