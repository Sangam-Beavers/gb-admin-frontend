import { useState } from 'react';
import { Download, FileSearch, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '@/components/common/FilterBar';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge, { type BadgeTone } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { useTransactions, useTransactionAuditTrail } from '@/hooks/useAdminQueries';
import { adminApi } from '@/api/admin';
import {
  compareBalance,
  formatBalance,
  formatCurrency,
  formatDateTime,
  formatTimeWithMillis,
} from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import type {
  AdminTransaction,
  FinancialAuditLog,
  TxRisk,
  TxStatus,
  TxType,
} from '@/types/admin';
import styles from './TransactionLogs.module.css';

const TYPE_LABEL: Record<TxType, string> = {
  INTERNAL_TRANSFER: '앱내이체',
  REMITTANCE: '해외송금',
  EXCHANGE: '환전',
  CHARGE: '충전',
  PAYOUT: '현금화',
};

const STATUS_LABEL: Record<TxStatus, string> = {
  PENDING: '대기',
  PROCESSING: '처리중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소',
};

const RISK_LABEL: Record<TxRisk, string> = {
  LOW: '정상',
  MEDIUM: '주의',
  HIGH: '위험',
};

function statusTone(s: TxStatus): BadgeTone {
  switch (s) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'info';
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    case 'CANCELLED':
      return 'danger';
  }
}

function riskTone(r: TxRisk): BadgeTone {
  switch (r) {
    case 'LOW':
      return 'success';
    case 'MEDIUM':
      return 'warning';
    case 'HIGH':
      return 'danger';
  }
}

export default function TransactionLogs() {
  const [period, setPeriod] = useState('TODAY');
  const [type, setType] = useState<'ALL' | TxType>('ALL');
  const [risk, setRisk] = useState<'ALL' | TxRisk>('ALL');
  const [downloading, setDownloading] = useState(false);
  const [trailTxId, setTrailTxId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data } = useTransactions({
    type: type !== 'ALL' ? type : undefined,
    risk: risk !== 'ALL' ? risk : undefined,
  });
  const trail = useTransactionAuditTrail(trailTxId);

  const rows = data?.transactions ?? [];

  const onCsvDownload = async () => {
    setDownloading(true);
    try {
      const blob = await adminApi.exportTransactionsCsv({
        type: type !== 'ALL' ? type : undefined,
        risk: risk !== 'ALL' ? risk : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('CSV 다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  const onOpenFullPage = () => {
    if (!trailTxId) return;
    navigate(`${ROUTES.TRANSACTIONS}/${trailTxId}/audit-trail`);
    setTrailTxId(null);
  };

  const columns: ColumnDef<AdminTransaction>[] = [
    {
      key: 'time',
      header: '시간',
      width: '120px',
      render: (r) => formatDateTime(r.executed_at),
    },
    {
      key: 'user',
      header: '사용자',
      render: (r) => (
        <div>
          <div>{r.user_name}</div>
          <div className={styles.subtle}>{r.user_public_id.slice(0, 8)}…</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: '유형',
      width: '120px',
      render: (r) => TYPE_LABEL[r.type] ?? r.type,
    },
    {
      key: 'amount',
      header: '금액',
      width: '180px',
      align: 'right',
      render: (r) => formatCurrency(r.amount, r.currency_code),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      render: (r) => (
        <Badge tone={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
      ),
    },
    {
      key: 'risk',
      header: '위험',
      width: '100px',
      render: (r) => (
        <Badge tone={riskTone(r.risk_level)}>{RISK_LABEL[r.risk_level] ?? r.risk_level}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '감사',
      width: '120px',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          className={styles.trailBtn}
          onClick={() => setTrailTxId(r.transaction_public_id)}
          title="이 거래의 audit trail 보기"
        >
          <FileSearch size={13} />
          <span>감사 로그</span>
        </button>
      ),
    },
  ];

  // 모달에서 보여줄 트레이스 헤더 + 로그
  const tx = trail.data?.transaction;
  const logs = trail.data?.logs ?? [];

  return (
    <div>
      <h2 className={styles.sectionTitle}>Transaction Logs</h2>
      <FilterBar
        actions={
          <button type="button" className="primary" onClick={onCsvDownload} disabled={downloading}>
            <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {downloading ? '다운로드 중…' : 'CSV 다운로드'}
          </button>
        }
      >
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="TODAY">오늘</option>
          <option value="WEEK">최근 7일</option>
          <option value="MONTH">최근 30일</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as 'ALL' | TxType)}>
          <option value="ALL">전체 유형</option>
          <option value="INTERNAL_TRANSFER">앱내이체</option>
          <option value="REMITTANCE">해외송금</option>
          <option value="EXCHANGE">환전</option>
          <option value="CHARGE">충전</option>
          <option value="PAYOUT">현금화</option>
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value as 'ALL' | TxRisk)}>
          <option value="ALL">전체 위험도</option>
          <option value="LOW">정상</option>
          <option value="MEDIUM">주의</option>
          <option value="HIGH">위험</option>
        </select>
      </FilterBar>

      <DataTable<AdminTransaction>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.transaction_public_id}
        emptyText="조회된 거래가 없습니다."
      />

      <Modal
        open={!!trailTxId}
        onClose={() => setTrailTxId(null)}
        maxWidth={760}
        title={
          <span className={styles.modalTitle}>
            <FileSearch size={16} />
            거래 감사 트레이스
            {tx && <code className={styles.modalTxId}>{tx.transaction_public_id}</code>}
          </span>
        }
        footer={
          <>
            <button type="button" className="secondary" onClick={() => setTrailTxId(null)}>
              닫기
            </button>
            <button type="button" className="primary" onClick={onOpenFullPage}>
              전체 페이지로 보기
            </button>
          </>
        }
      >
        {trail.isLoading && <div className={styles.modalNotice}>불러오는 중…</div>}
        {trail.isError && <div className={styles.modalNotice}>트레이스를 불러오지 못했습니다.</div>}

        {tx && (
          <div className={styles.modalSummary}>
            <div className={styles.modalSummaryLine}>
              <strong>{tx.user_nickname ?? '(닉네임 없음)'}</strong>
              {tx.receiver_nickname ? (
                <>
                  <span className={styles.modalArrow}>→</span>
                  <strong>{tx.receiver_nickname}</strong>
                </>
              ) : null}
              <span className={styles.modalSep}>·</span>
              <span className={styles.modalAmount}>
                {formatCurrency(tx.amount, tx.currency_code)}
              </span>
              <span className={styles.modalSep}>·</span>
              <span className={styles.modalType}>{tx.type_label}</span>
            </div>
            <div className={styles.modalBadgeRow}>
              <Badge tone={statusTone(tx.status as TxStatus)}>{tx.status_label}</Badge>
              <Badge tone={riskTone(tx.risk_level as TxRisk)}>위험: {tx.risk_label}</Badge>
            </div>
          </div>
        )}

        {trail.data && (
          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th className={styles.modalThTime}>시각 (ms)</th>
                <th>Action</th>
                <th className={styles.modalThRight}>잔액 변화</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.modalEmpty}>
                    이 거래에 연결된 감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((l: FinancialAuditLog) => {
                  const dir = compareBalance(l.before_balance, l.after_balance);
                  const cls =
                    dir === 'increase'
                      ? styles.increase
                      : dir === 'decrease'
                        ? styles.decrease
                        : styles.same;
                  return (
                    <tr key={l.audit_log_public_id}>
                      <td>
                        <span className={styles.mono}>{formatTimeWithMillis(l.created_at)}</span>
                      </td>
                      <td>
                        <Badge tone="info">{l.action_label}</Badge>
                      </td>
                      <td className={styles.modalThRight}>
                        <span className={`${styles.balanceCell} ${cls}`}>
                          <span className={styles.before}>{formatBalance(l.before_balance)}</span>
                          <ArrowRight size={12} className={styles.arrow} />
                          <span className={styles.after}>{formatBalance(l.after_balance)}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
