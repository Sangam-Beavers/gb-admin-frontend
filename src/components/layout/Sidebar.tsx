import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
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
  label: string;
  Icon: typeof LayoutDashboard;
}

interface NavSection {
  /** undefined 면 헤더 없는 최상단 그룹(Dashboard·Monitoring). */
  label?: string;
  items: NavItem[];
}

/**
 * 사이드바 메뉴 — 3 섹션 구조.
 *
 *   (top)        Dashboard, Monitoring, Analytics
 *   Financial Ops  Transactions, Financial Audit Log, Charge Attempts
 *   User Ops       Users·KYC, Community, Document AI
 *   System         Settings
 *
 * ⚠️ 라벨/섹션명은 i18n(t())을 타지 않고 **영어로 하드코딩**한다. 운영 콘솔 탭 간 통일성을 위해
 * 로케일과 무관하게 항상 영어로 보이게 한다(한국어 환경에서 'Analytics' 등이 한글로 튀던 문제 방지).
 */
const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: ROUTES.DASHBOARD, label: 'Dashboard', Icon: LayoutDashboard },
      { to: ROUTES.MONITORING, label: 'Monitoring', Icon: Activity },
      { to: ROUTES.ANALYTICS, label: 'Analytics', Icon: BarChart3 },
    ],
  },
  {
    label: 'Financial Ops',
    items: [
      { to: ROUTES.TRANSACTIONS, label: 'Transactions', Icon: Receipt },
      {
        to: ROUTES.FINANCIAL_AUDIT_LOG,
        label: 'Financial Audit Log',
        Icon: ShieldCheck,
      },
      { to: ROUTES.CHARGE_ATTEMPTS, label: 'Charge Attempts', Icon: CreditCard },
    ],
  },
  {
    label: 'User Ops',
    items: [
      { to: ROUTES.USERS, label: 'Users · KYC', Icon: UsersIcon },
      { to: ROUTES.COMMUNITY, label: 'Community', Icon: MessageSquare },
      { to: ROUTES.DOCUMENTS, label: 'Document AI', Icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [{ to: ROUTES.SETTINGS, label: 'Settings', Icon: SettingsIcon }],
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
            {section.label && (
              <div className={styles.sectionHeader}>{section.label}</div>
            )}
            {section.items.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
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
