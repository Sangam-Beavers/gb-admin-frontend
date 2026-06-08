import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Users, FileText, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import { useDashboardSummary, useDashboardAlerts } from '@/hooks/useAdminQueries';
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/format';
import type { AdminAlert, AlertStatus } from '@/types/admin';
import styles from './Dashboard.module.css';

function alertTone(status: AlertStatus) {
  switch (status) {
    case 'REVIEW_NEEDED':
      return 'danger' as const;
    case 'ACTION_NEEDED':
      return 'warning' as const;
    case 'PENDING':
      return 'info' as const;
    case 'RESOLVED':
      return 'success' as const;
  }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: summary } = useDashboardSummary();
  const { data: alerts } = useDashboardAlerts();

  const txTotalKRW = summary
    ? formatCurrency(summary.today_transactions_total.KRW, 'KRW')
    : '-';
  const txTotalUSD = summary
    ? formatCurrency(summary.today_transactions_total.USD, 'USD')
    : '-';
  const txTotalVND = summary
    ? formatCurrency(summary.today_transactions_total.VND, 'VND')
    : '-';

  const totalQueueCount = summary
    ? summary.queues.kyc_pending +
      summary.queues.community_reports +
      summary.queues.charge_failed +
      summary.queues.analysis_failed
    : 0;

  const columns: ColumnDef<AdminAlert>[] = [
    {
      key: 'type',
      header: '유형',
      width: '120px',
      render: (row) => <Badge tone="info">{row.label}</Badge>,
    },
    { key: 'message', header: '내용', render: (row) => row.message },
    {
      key: 'status',
      header: '상태',
      width: '140px',
      render: (row) => <Badge tone={alertTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      header: '시각',
      width: '120px',
      align: 'right',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>{t('dashboard.title')}</h2>

      <div className={styles.statGrid}>
        <StatCard
          label={t('dashboard.txTotalLabel')}
          value={txTotalKRW}
          hint={
            <span>
              {txTotalUSD} · {txTotalVND}
            </span>
          }
          icon={<ArrowUpRight size={16} />}
          tone="info"
        />
        <StatCard
          label={t('dashboard.dauLabel')}
          value={summary ? formatNumber(summary.daily_active_users) : '-'}
          hint="전일 대비 — Phase 2"
          icon={<Users size={16} />}
        />
        <StatCard
          label={t('dashboard.docsLabel')}
          value={summary ? formatNumber(summary.today_documents_analyzed) : '-'}
          hint="OCR 실패 6건"
          icon={<FileText size={16} />}
        />
        <StatCard
          label={t('dashboard.queueLabel')}
          value={formatNumber(totalQueueCount)}
          hint="KYC · 신고 · 충전실패 · 분석실패"
          icon={<AlertTriangle size={16} />}
          tone="warning"
        />
      </div>

      <h3 className={styles.sectionSub}>{t('dashboard.alertsTitle')}</h3>
      <DataTable<AdminAlert>
        columns={columns}
        rows={alerts?.alerts ?? []}
        rowKey={(r) => `${r.type}-${r.created_at}`}
      />
    </div>
  );
}
