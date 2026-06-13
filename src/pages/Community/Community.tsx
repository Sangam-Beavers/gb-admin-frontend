import { useState } from 'react';
import FilterBar from '@/components/common/FilterBar';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { useCommunityReports, useDeletePost, useDismissReport } from '@/hooks/useAdminQueries';
import { formatDateTime } from '@/utils/format';
import type { AdminCommunityReport, ReportReason, ReportStatus } from '@/types/admin';
import styles from './Community.module.css';

const REASON_LABEL: Record<ReportReason, string> = {
  SPAM: '스팸',
  ABUSE: '비방',
  FRAUD: '사칭',
  SEXUAL: '성적',
  ETC: '기타',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: '미처리',
  RESOLVED_DELETED: '삭제됨',
  DISMISSED: '기각',
};

function reasonTone(r: ReportReason) {
  switch (r) {
    case 'SPAM':
      return 'warning' as const;
    case 'ABUSE':
      return 'danger' as const;
    case 'FRAUD':
      return 'danger' as const;
    case 'SEXUAL':
      return 'danger' as const;
    case 'ETC':
      return 'info' as const;
  }
}

function statusTone(s: ReportStatus) {
  switch (s) {
    case 'PENDING':
      return 'warning' as const;
    case 'RESOLVED_DELETED':
      return 'info' as const;
    case 'DISMISSED':
      return 'info' as const;
  }
}

export default function Community() {
  const [reason, setReason] = useState<'ALL' | ReportReason>('ALL');
  const [status, setStatus] = useState<'ALL' | ReportStatus>('ALL');
  const { data } = useCommunityReports({
    reason: reason !== 'ALL' ? reason : undefined,
    status: status !== 'ALL' ? status : undefined,
  });
  const deletePost = useDeletePost();
  const dismissReport = useDismissReport();
  const [viewing, setViewing] = useState<AdminCommunityReport | null>(null);

  const rows = data?.reports ?? [];

  const onDelete = (postPublicId: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    deletePost.mutate(postPublicId);
  };
  const onDismiss = (postPublicId: string) => {
    if (!confirm('이 신고를 거부(기각)하시겠습니까? 게시글은 유지됩니다.')) return;
    dismissReport.mutate(postPublicId);
  };

  const columns: ColumnDef<AdminCommunityReport>[] = [
    {
      key: 'title',
      header: '게시글',
      render: (r) => <span className={styles.title}>{r.title}</span>,
    },
    { key: 'author', header: '작성자', width: '140px', render: (r) => r.author_nickname },
    {
      key: 'target_type',
      header: '유형',
      width: '80px',
      render: (r) => r.target_type,
    },
    {
      key: 'count',
      header: '신고',
      width: '80px',
      align: 'right',
      render: (r) => r.report_count,
    },
    {
      key: 'reason',
      header: '사유',
      width: '100px',
      render: (r) => (
        <Badge tone={reasonTone(r.reason)}>{REASON_LABEL[r.reason] ?? r.reason}</Badge>
      ),
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
      key: 'actions',
      header: '관리',
      width: '240px',
      align: 'right',
      render: (r) => (
        <div className={styles.actions}>
          <button type="button" className={styles.view} onClick={() => setViewing(r)}>
            보기
          </button>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => onDismiss(r.post_public_id)}
            disabled={dismissReport.isPending || r.status !== 'PENDING'}
          >
            신고 거부
          </button>
          <button
            type="button"
            className={styles.del}
            onClick={() => onDelete(r.post_public_id)}
            disabled={deletePost.isPending}
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>Community 신고 처리</h2>
      <FilterBar
        actions={
          <button type="button" className="primary" disabled>
            선택 삭제
          </button>
        }
      >
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as 'ALL' | ReportReason)}
        >
          <option value="ALL">전체 사유</option>
          <option value="SPAM">스팸</option>
          <option value="ABUSE">비방</option>
          <option value="FRAUD">사칭</option>
          <option value="SEXUAL">성적</option>
          <option value="ETC">기타</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ALL' | ReportStatus)}
        >
          <option value="ALL">전체 상태</option>
          <option value="PENDING">미처리</option>
          <option value="RESOLVED_DELETED">삭제됨</option>
          <option value="DISMISSED">기각</option>
        </select>
      </FilterBar>

      <DataTable<AdminCommunityReport>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.post_public_id}
        emptyText="신고된 게시글이 없습니다."
      />

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="신고 상세" maxWidth={560}>
        {viewing && (
          <ul className={styles.detailList}>
            <li>
              <span>게시글</span>
              <strong>{viewing.title}</strong>
            </li>
            <li>
              <span>작성자</span>
              <strong>{viewing.author_nickname ?? viewing.author_public_id}</strong>
            </li>
            <li>
              <span>유형</span>
              <strong>{viewing.target_type}</strong>
            </li>
            <li>
              <span>신고 사유</span>
              <strong>{REASON_LABEL[viewing.reason] ?? viewing.reason}</strong>
            </li>
            <li>
              <span>신고 수</span>
              <strong>{viewing.report_count}</strong>
            </li>
            <li>
              <span>상태</span>
              <strong>{STATUS_LABEL[viewing.status] ?? viewing.status}</strong>
            </li>
            <li>
              <span>최근 신고</span>
              <strong>{formatDateTime(viewing.last_reported_at)}</strong>
            </li>
          </ul>
        )}
      </Modal>
    </div>
  );
}
