import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge, { type BadgeTone } from '@/components/common/Badge';
import { useTransactionAuditTrail } from '@/hooks/useAdminQueries';
import {
  compareBalance,
  formatBalance,
  formatCurrency,
  formatDateTimeWithSeconds,
  formatTimeWithMillis,
} from '@/utils/format';
import type { FinancialAuditLog, FinancialAuditStatus } from '@/types/admin';
import { ROUTES } from '@/constants/routes';
import styles from './TransactionAuditTrail.module.css';

function statusTone(s: string): BadgeTone {
  switch (s as FinancialAuditStatus | string) {
    case 'COMPLETED':
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
    case 'CANCELLED':
      return 'danger';
    case 'PROCESSING':
      return 'warning';
    case 'PENDING':
      return 'info';
    default:
      return 'neutral';
  }
}

function riskTone(r: string): BadgeTone {
  switch (r) {
    case 'LOW':
      return 'success';
    case 'MEDIUM':
      return 'warning';
    case 'HIGH':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function TransactionAuditTrail() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTransactionAuditTrail(publicId ?? null);

  const tx = data?.transaction;
  const logs = data?.logs ?? [];

  const columns: ColumnDef<FinancialAuditLog>[] = [
    {
      key: 'time',
      header: '시각 (ms)',
      width: '140px',
      render: (r) => <span className={styles.mono}>{formatTimeWithMillis(r.created_at)}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      width: '180px',
      render: (r) => (
        <div>
          <Badge tone="info">{r.action_label}</Badge>
          <div className={styles.subtle}>{r.action}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '금액',
      align: 'right',
      width: '160px',
      render: (r) => formatCurrency(r.amount, r.currency_code),
    },
    {
      key: 'balance',
      header: '잔액 변화',
      align: 'right',
      render: (r) => {
        const dir = compareBalance(r.before_balance, r.after_balance);
        const cls =
          dir === 'increase'
            ? styles.increase
            : dir === 'decrease'
              ? styles.decrease
              : styles.same;
        return (
          <span className={`${styles.balanceCell} ${cls}`}>
            <span className={styles.before}>{formatBalance(r.before_balance)}</span>
            <ArrowRight size={12} className={styles.arrow} />
            <span className={styles.after}>{formatBalance(r.after_balance)}</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status_label}</Badge>,
    },
  ];

  return (
    <div>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => navigate(ROUTES.FINANCIAL_AUDIT_LOG)}
      >
        <ArrowLeft size={14} />
        <span>Financial Audit Log 로 돌아가기</span>
      </button>

      <h2 className={styles.sectionTitle}>거래 감사 트레이스</h2>

      {isLoading && <div className={styles.notice}>불러오는 중…</div>}
      {isError && <div className={styles.notice}>감사 트레이스를 불러오지 못했습니다.</div>}

      {tx && (
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.kvBlock}>
              <span className={styles.kvKey}>거래 ID</span>
              <code className={styles.txId}>{tx.transaction_public_id}</code>
            </div>
            <div className={styles.kvBlock}>
              <span className={styles.kvKey}>실행 시각</span>
              <span className={styles.kvVal}>{formatDateTimeWithSeconds(tx.executed_at)}</span>
            </div>
          </div>

          <div className={styles.summaryLine}>
            <strong>{tx.user_nickname ?? '(닉네임 없음)'}</strong>
            {tx.receiver_nickname ? (
              <>
                <span className={styles.summaryArrow}>→</span>
                <strong>{tx.receiver_nickname}</strong>
              </>
            ) : null}
            <span className={styles.summarySep}>·</span>
            <span className={styles.summaryAmount}>
              {formatCurrency(tx.amount, tx.currency_code)}
            </span>
            <span className={styles.summarySep}>·</span>
            <span className={styles.summaryType}>{tx.type_label}</span>
          </div>

          <div className={styles.badgeRow}>
            <span className={styles.kvKey}>상태</span>
            <Badge tone={statusTone(tx.status)}>{tx.status_label}</Badge>
            <span className={styles.kvKey}>위험도</span>
            <Badge tone={riskTone(tx.risk_level)}>{tx.risk_label}</Badge>
          </div>
        </div>
      )}

      <h3 className={styles.sectionSub}>잔액 변동 트레이스 ({logs.length} 건)</h3>
      <DataTable<FinancialAuditLog>
        columns={columns}
        rows={logs}
        rowKey={(r) => r.audit_log_public_id}
        emptyText="이 거래에 연결된 감사 로그가 없습니다."
      />
    </div>
  );
}
