import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowRight } from 'lucide-react';
import FilterBar from '@/components/common/FilterBar';
import { type ColumnDef } from '@/components/common/DataTable';
import Badge, { type BadgeTone } from '@/components/common/Badge';
import { useFinancialAuditLogs } from '@/hooks/useAdminQueries';
import {
  formatBalance,
  formatCurrency,
  formatDateTimeWithSeconds,
  compareBalance,
} from '@/utils/format';
import type {
  FinancialAuditLog as AuditLogRow,
  FinancialAuditAction,
  FinancialAuditStatus,
} from '@/types/admin';
import { ROUTES } from '@/constants/routes';
import styles from './FinancialAuditLog.module.css';

const ACTION_OPTIONS: { value: 'ALL' | FinancialAuditAction; label: string }[] = [
  { value: 'ALL', label: '전체 Action' },
  { value: 'CHARGE', label: '충전' },
  { value: 'TRANSFER', label: '앱내이체' },
  { value: 'REMITTANCE', label: '해외송금' },
  { value: 'EXCHANGE', label: '환전' },
  { value: 'CANCEL', label: '취소' },
];

const STATUS_OPTIONS: { value: 'ALL' | FinancialAuditStatus; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'SUCCESS', label: '성공' },
  { value: 'FAILED', label: '실패' },
  { value: 'PENDING', label: '대기' },
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

function actionTone(a: FinancialAuditAction): BadgeTone {
  switch (a) {
    case 'CHARGE':
      return 'info';
    case 'TRANSFER':
      return 'neutral';
    case 'REMITTANCE':
      return 'info';
    case 'EXCHANGE':
      return 'warning';
    case 'CANCEL':
      return 'danger';
  }
}

const INITIAL_FILTERS = {
  user_public_id: '',
  action: 'ALL' as 'ALL' | FinancialAuditAction,
  status: 'ALL' as 'ALL' | FinancialAuditStatus,
  from: '',
  to: '',
  ip_address: '',
  min_amount: '',
  max_amount: '',
};

export default function FinancialAuditLog() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const navigate = useNavigate();

  const params = useMemo(() => {
    return {
      user_public_id: filters.user_public_id || undefined,
      action: filters.action !== 'ALL' ? filters.action : undefined,
      status: filters.status !== 'ALL' ? filters.status : undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      ip_address: filters.ip_address || undefined,
      min_amount: filters.min_amount || undefined,
      max_amount: filters.max_amount || undefined,
    };
  }, [filters]);

  const { data, isLoading, isError } = useFinancialAuditLogs(params);
  const rows = data?.logs ?? [];

  const onResetFilters = () => setFilters(INITIAL_FILTERS);

  const onCsvDownload = () => {
    // 현재 admin-service 에 financial-audit-logs CSV 엔드포인트는 별도 추가 예정.
    // 발표용으로는 클라이언트에서 현재 페이지 결과만 CSV 로 묶어준다.
    if (rows.length === 0) {
      alert('내려받을 데이터가 없습니다.');
      return;
    }
    const header = [
      'created_at',
      'user_public_id',
      'user_nickname',
      'action',
      'amount',
      'currency_code',
      'before_balance',
      'after_balance',
      'status',
      'ip_address',
      'reason',
    ];
    const csv = [header.join(',')]
      .concat(
        rows.map((r) =>
          [
            r.created_at,
            r.user_public_id,
            r.user_nickname ?? '',
            r.action,
            r.amount,
            r.currency_code,
            r.before_balance,
            r.after_balance,
            r.status,
            r.ip_address ?? '',
            (r.reason ?? '').replace(/[,\n]/g, ' '),
          ].join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onRowClick = (row: AuditLogRow) => {
    if (!row.transaction_public_id) return; // 거래 ID 없는 로그는 드릴다운 불가
    navigate(`${ROUTES.TRANSACTIONS}/${row.transaction_public_id}/audit-trail`);
  };

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      key: 'time',
      header: '시각',
      width: '140px',
      render: (r) => <span className={styles.mono}>{formatDateTimeWithSeconds(r.created_at)}</span>,
    },
    {
      key: 'user',
      header: '사용자',
      render: (r) => (
        <div>
          <div className={styles.name}>
            {r.user_nickname ?? '(닉네임 없음)'}
            {r.user_email && <span className={styles.email}> · {r.user_email}</span>}
          </div>
          <div className={styles.mono + ' ' + styles.subtle}>
            {r.user_public_id.slice(0, 8)}…
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '160px',
      render: (r) => (
        <div className={styles.actionCell}>
          <Badge tone={actionTone(r.action)}>{r.action_label}</Badge>
          <div className={styles.subtle}>{r.action}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '금액',
      width: '180px',
      align: 'right',
      render: (r) => (
        <span className={styles.amount}>{formatCurrency(r.amount, r.currency_code)}</span>
      ),
    },
    {
      key: 'balance',
      header: '잔액 변화',
      width: '220px',
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
      width: '90px',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status_label}</Badge>,
    },
    {
      key: 'ip',
      header: 'IP',
      width: '140px',
      render: (r) => (
        <span className={styles.mono}>{r.ip_address ?? '-'}</span>
      ),
    },
  ];

  const emptyText = isLoading
    ? '불러오는 중…'
    : isError
      ? '감사 로그를 불러오지 못했습니다.'
      : '조건에 맞는 감사 로그가 없습니다.';

  return (
    <div>
      <div className={styles.headerBlock}>
        <h2 className={styles.sectionTitle}>
          <ShieldCheck size={20} className={styles.titleIcon} />
          Financial Audit Log
        </h2>
        <p className={styles.lede}>
          모든 잔액 변동의 append-only 기록 — 부정거래·고객분쟁 조사용.
          행을 클릭하면 해당 거래의 audit trail 로 이동합니다.
        </p>
      </div>

      <FilterBar
        actions={
          <>
            <button type="button" className="secondary" onClick={onResetFilters}>
              <RotateCcw size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              필터 초기화
            </button>
            <button type="button" className="primary" onClick={onCsvDownload}>
              CSV 다운로드
            </button>
          </>
        }
      >
        <input
          placeholder="사용자 public_id 검색"
          value={filters.user_public_id}
          onChange={(e) => setFilters((f) => ({ ...f, user_public_id: e.target.value }))}
        />
        <select
          value={filters.action}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              action: e.target.value as 'ALL' | FinancialAuditAction,
            }))
          }
        >
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
        <input
          placeholder="IP"
          value={filters.ip_address}
          onChange={(e) => setFilters((f) => ({ ...f, ip_address: e.target.value }))}
        />
        <input
          placeholder="최소 금액"
          value={filters.min_amount}
          onChange={(e) => setFilters((f) => ({ ...f, min_amount: e.target.value }))}
          inputMode="numeric"
        />
        <input
          placeholder="최대 금액"
          value={filters.max_amount}
          onChange={(e) => setFilters((f) => ({ ...f, max_amount: e.target.value }))}
          inputMode="numeric"
        />
      </FilterBar>

      <div className={styles.tableWrap}>
        <DataTableClickable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.audit_log_public_id}
          emptyText={emptyText}
          onRowClick={onRowClick}
          isRowClickable={(r) => !!r.transaction_public_id}
        />
      </div>

      <div className={styles.meta}>
        총 {data?.total_elements ?? 0} 건 · 페이지 {(data?.page ?? 0) + 1} /{' '}
        {data?.total_pages ?? 1}
      </div>
    </div>
  );
}

/**
 * DataTable 의 행에 클릭 핸들러를 얹은 작은 래퍼.
 * 공용 DataTable 을 그대로 두고 audit-log 페이지에서만 hover/pointer 가
 * 보이도록 td 단위로 onClick 을 위임하는 단순 변형.
 */
interface ClickableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
  onRowClick: (row: T) => void;
  isRowClickable: (row: T) => boolean;
}

function DataTableClickable<T>({
  columns,
  rows,
  rowKey,
  emptyText,
  onRowClick,
  isRowClickable,
}: ClickableProps<T>) {
  return (
    <div className={styles.clickableWrap}>
      <table className={styles.clickableTable}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width, textAlign: col.align ?? 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyText ?? 'No data'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const clickable = isRowClickable(row);
              return (
                <tr
                  key={rowKey(row)}
                  className={clickable ? styles.clickable : undefined}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
