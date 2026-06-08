import { useState } from 'react';
import FilterBar from '@/components/common/FilterBar';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import { useUsers, useApproveKyc, useRejectKyc } from '@/hooks/useAdminQueries';
import { formatDateTime } from '@/utils/format';
import type { AdminUser, KycStatus } from '@/types/admin';
import styles from './Users.module.css';

const KYC_LABEL: Record<KycStatus, string> = {
  APPROVED: '승인',
  PENDING: '대기',
  NEEDS_REVIEW: '확인필요',
  REJECTED: '반려',
  MATCHED: '일치',
};

const DOC_TYPE_LABEL: Record<string, string> = {
  ALIEN_REGISTRATION: '외국인등록증',
  PASSPORT: '여권',
  NATIONAL_ID: '본국 신분증',
};

function kycTone(s: KycStatus) {
  switch (s) {
    case 'APPROVED':
      return 'success' as const;
    case 'MATCHED':
      return 'success' as const;
    case 'PENDING':
      return 'info' as const;
    case 'NEEDS_REVIEW':
      return 'warning' as const;
    case 'REJECTED':
      return 'danger' as const;
  }
}

export default function Users() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | KycStatus>('ALL');
  const { data } = useUsers({
    q: search || undefined,
    kyc_status: status !== 'ALL' ? status : undefined,
  });
  const approveKyc = useApproveKyc();
  const rejectKyc = useRejectKyc();

  const rows = data?.members ?? [];

  const onApprove = (publicId: string) => {
    if (!confirm('이 회원의 KYC를 승인하시겠습니까?')) return;
    approveKyc.mutate(publicId);
  };

  const onReject = (publicId: string) => {
    const reason = prompt('거절 사유를 입력하세요 (필수)');
    if (!reason || !reason.trim()) return;
    rejectKyc.mutate({ userPublicId: publicId, reason: reason.trim() });
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      key: 'user',
      header: '사용자',
      render: (r) => (
        <div>
          <div className={styles.name}>{r.nickname}</div>
          <div className={styles.subtle}>{r.email}</div>
        </div>
      ),
    },
    { key: 'name', header: '이름', width: '140px', render: (r) => r.name },
    { key: 'country', header: '국적', width: '80px', render: (r) => r.nationality },
    {
      key: 'doc',
      header: '신분증',
      width: '140px',
      render: (r) => DOC_TYPE_LABEL[r.identity_document_type] ?? r.identity_document_type,
    },
    {
      key: 'joined',
      header: '가입일',
      width: '120px',
      render: (r) => formatDateTime(r.joined_at),
    },
    {
      key: 'status',
      header: '상태',
      width: '110px',
      render: (r) => <Badge tone={kycTone(r.kyc_status)}>{KYC_LABEL[r.kyc_status]}</Badge>,
    },
    {
      key: 'actions',
      header: '처리',
      width: '180px',
      align: 'right',
      render: (r) => (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.approve}
            onClick={() => onApprove(r.user_public_id)}
            disabled={approveKyc.isPending || r.kyc_status === 'APPROVED'}
          >
            승인
          </button>
          <button
            type="button"
            className={styles.reject}
            onClick={() => onReject(r.user_public_id)}
            disabled={rejectKyc.isPending || r.kyc_status === 'REJECTED'}
          >
            반려
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>Users · KYC</h2>
      <FilterBar
        actions={
          <button type="button" className="primary" disabled>
            일괄 승인
          </button>
        }
      >
        <input
          placeholder="이메일·이름·닉네임 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as 'ALL' | KycStatus)}>
          <option value="ALL">전체 상태</option>
          <option value="PENDING">대기</option>
          <option value="NEEDS_REVIEW">확인필요</option>
          <option value="APPROVED">승인</option>
          <option value="MATCHED">일치</option>
          <option value="REJECTED">반려</option>
        </select>
      </FilterBar>

      <DataTable<AdminUser>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.user_public_id}
        emptyText="조회된 사용자가 없습니다."
      />
    </div>
  );
}
