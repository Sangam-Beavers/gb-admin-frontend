import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Wallet,
  Receipt,
  Users as UsersIcon,
  MessageSquare,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { startLogout } from '@/auth/logout';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  labelKey: string;
  Icon: typeof LayoutDashboard;
}

interface NavSection {
  /** undefined 면 헤더 없는 최상단 그룹(Dashboard·Monitoring). */
  labelKey?: string;
  items: NavItem[];
}

/**
 * 사이드바 메뉴 — 3 섹션 구조.
 *
 *   (top)        Dashboard, Monitoring
 *   금융 운영    Transactions, Financial Audit Log, Charge Attempts
 *   사용자 운영  Users·KYC, Community, Document AI
 *   시스템       Settings
 */
const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: ROUTES.DASHBOARD, labelKey: 'nav.dashboard', Icon: LayoutDashboard },
      { to: ROUTES.MONITORING, labelKey: 'nav.monitoring', Icon: Activity },
      { to: ROUTES.ANALYTICS, labelKey: 'nav.analytics', Icon: BarChart3 },
      { to: ROUTES.REVENUE, labelKey: 'nav.revenue', Icon: Wallet },
    ],
  },
  {
    labelKey: 'nav.section.financial',
    items: [
      { to: ROUTES.TRANSACTIONS, labelKey: 'nav.transactions', Icon: Receipt },
      {
        to: ROUTES.FINANCIAL_AUDIT_LOG,
        labelKey: 'nav.financialAuditLog',
        Icon: ShieldCheck,
      },
      { to: ROUTES.CHARGE_ATTEMPTS, labelKey: 'nav.chargeAttempts', Icon: CreditCard },
    ],
  },
  {
    labelKey: 'nav.section.userOps',
    items: [
      { to: ROUTES.USERS, labelKey: 'nav.users', Icon: UsersIcon },
      { to: ROUTES.COMMUNITY, labelKey: 'nav.community', Icon: MessageSquare },
      { to: ROUTES.DOCUMENTS, labelKey: 'nav.documents', Icon: FileText },
    ],
  },
  {
    labelKey: 'nav.section.system',
    items: [{ to: ROUTES.SETTINGS, labelKey: 'nav.settings', Icon: SettingsIcon }],
  },
];

export default function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>GB</div>
        <div className={styles.brandText}>
          <strong>Global Bridge</strong>
          <span>Admin</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className={styles.section}>
            {section.labelKey && <div className={styles.sectionHeader}>{t(section.labelKey)}</div>}
            {section.items.map(({ to, labelKey, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon size={18} />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={() => startLogout()}
          title={t('auth.logout')}
        >
          <LogOut size={16} />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
