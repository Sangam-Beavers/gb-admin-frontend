import { useMemo, useState } from 'react';
import { CreditCard, RotateCcw } from 'lucide-react';
import FilterBar from '@/components/common/FilterBar';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge, { type BadgeTone } from '@/components/common/Badge';
import { useChargeAttempts } from '@/hooks/useAdminQueries';
import { formatCurrency, formatDateTimeWithSeconds } from '@/utils/format';
import type { ChargeAttempt, FinancialAuditStatus } from '@/types/admin';
import styles from './ChargeAttempts.module.css';

const STATUS_OPTIONS: { value: 'ALL' | FinancialAuditStatus; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'FAILED', label: '실패' },
  { value: 'PENDING', label: '대기' },
  { value: 'SUCCESS', label: '성공' },
];

function statusTone(s: FinancialAuditStatus): BadgeTone {
  switch (s) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'PENDING':
      return 'warning';
  }
}

const INITIAL_FILTERS = {
  status: 'FAILED' as 'ALL' | FinancialAuditStatus, // 기본: 실패한 충전만
  user_public_id: '',
  from: '',
  to: '',
};

export default function ChargeAttempts() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const params = useMemo(
    () => ({
      status: filters.status !== 'ALL' ? filters.status : undefined,
      user_public_id: filters.user_public_id || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters]
  );

  const { data, isLoading, isError } = useChargeAttempts(params);
  const rows = data?.attempts ?? [];

  const onResetFilters = () => setFilters(INITIAL_FILTERS);

  const columns: ColumnDef<ChargeAttempt>[] = [
    {
      key: 'time',
      header: '시각',
      width: '150px',
      render: (r) => (
        <span className={styles.mono}>{formatDateTimeWithSeconds(r.created_at)}</span>
      ),
    },
    {
      key: 'user',
      header: '사용자',
      render: (r) => (
        <div>
          <div>{r.user_nickname ?? '(닉네임 없음)'}</div>
          <div className={`${styles.subtle} ${styles.mono}`}>
            {r.user_public_id.slice(0, 8)}…
          </div>
        </div>
      ),
    },
    {
      key: 'bank',
      header: '은행',
      width: '160px',
      render: (r) => (
        <div>
          <div>{r.bank_label ?? r.bank_code}</div>
          {r.bank_label && <div className={styles.subtle}>{r.bank_code}</div>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: '금액',
      align: 'right',
      width: '180px',
      render: (r) => (
        <span className={styles.amount}>{formatCurrency(r.amount, r.currency_code)}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '90px',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status_label}</Badge>,
    },
    {
      key: 'reason',
      header: '사유',
      render: (r) => <span className={styles.reason}>{r.reason ?? '-'}</span>,
    },
  ];

  const emptyText = isLoading
    ? '불러오는 중…'
    : isError
      ? '충전 시도 내역을 불러오지 못했습니다.'
      : '조건에 맞는 충전 시도가 없습니다.';

  return (
    <div>
      <div className={styles.headerBlock}>
        <h2 className={styles.sectionTitle}>
          <CreditCard size={20} className={styles.titleIcon} />
          Charge Attempts
        </h2>
        <p className={styles.lede}>
          외부 은행에 보낸 충전 시도 — 기본은 <strong>실패한 충전</strong> 만 표시.
          은행 측 오류·잔액 부족·인증 실패 등 운영 모니터링용.
        </p>
      </div>

      <FilterBar
        actions={
          <button type="button" className="secondary" onClick={onResetFilters}>
            <RotateCcw size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            필터 초기화
          </button>
        }
      >
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value as 'ALL' | FinancialAuditStatus,
            }))
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          placeholder="사용자 public_id"
          value={filters.user_public_id}
          onChange={(e) => setFilters((f) => ({ ...f, user_public_id: e.target.value }))}
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          title="시작일"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          title="종료일"
        />
      </FilterBar>

      <DataTable<ChargeAttempt>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.charge_attempt_public_id}
        emptyText={emptyText}
      />

      <div className={styles.meta}>
        총 {data?.total_elements ?? 0} 건 · 페이지 {(data?.page ?? 0) + 1} /{' '}
        {data?.total_pages ?? 1}
      </div>
    </div>
  );
}
