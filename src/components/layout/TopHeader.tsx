import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './TopHeader.module.css';
import { ROUTES } from '@/constants/routes';

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
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{t(titleKeyFromPath(pathname))}</h1>
      <div className={styles.right}>
        <span className={styles.subtitle}>{t('app.subtitle')}</span>
      </div>
    </header>
  );
}
