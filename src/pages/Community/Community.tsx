import { useState } from 'react';
import FilterBar from '@/components/common/FilterBar';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import { useCommunityReports, useHidePost, useDeletePost } from '@/hooks/useAdminQueries';
import type { AdminCommunityReport, ReportCategory } from '@/types/admin';
import styles from './Community.module.css';

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  SPAM: '스팸',
  ABUSE: '비방',
  FRAUD: '사칭',
  OTHER: '기타',
};

function categoryTone(r: ReportCategory) {
  switch (r) {
    case 'SPAM':
      return 'warning' as const;
    case 'ABUSE':
      return 'danger' as const;
    case 'FRAUD':
      return 'danger' as const;
    case 'OTHER':
      return 'info' as const;
  }
}

export default function Community() {
  const [category, setCategory] = useState<'ALL' | ReportCategory>('ALL');
  const { data } = useCommunityReports({
    category: category !== 'ALL' ? category : undefined,
  });
  const hidePost = useHidePost();
  const deletePost = useDeletePost();

  const rows = data?.reports ?? [];

  const onHide = (postPublicId: string) => {
    if (!confirm('이 게시글을 숨기시겠습니까?')) return;
    hidePost.mutate(postPublicId);
  };
  const onDelete = (postPublicId: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    deletePost.mutate(postPublicId);
  };

  const columns: ColumnDef<AdminCommunityReport>[] = [
    {
      key: 'title',
      header: '게시글',
      render: (r) => <span className={styles.title}>{r.title}</span>,
    },
    { key: 'author', header: '작성자', width: '140px', render: (r) => r.author_nickname },
    {
      key: 'count',
      header: '신고',
      width: '80px',
      align: 'right',
      render: (r) => r.report_count,
    },
    {
      key: 'category',
      header: '사유',
      width: '100px',
      render: (r) => (
        <Badge tone={categoryTone(r.category)}>{CATEGORY_LABEL[r.category] ?? r.category}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      width: '160px',
      align: 'right',
      render: (r) => (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.hide}
            onClick={() => onHide(r.post_public_id)}
            disabled={hidePost.isPending}
          >
            숨김
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
          value={category}
          onChange={(e) => setCategory(e.target.value as 'ALL' | ReportCategory)}
        >
          <option value="ALL">전체 카테고리</option>
          <option value="SPAM">스팸</option>
          <option value="ABUSE">비방</option>
          <option value="FRAUD">사칭</option>
          <option value="OTHER">기타</option>
        </select>
      </FilterBar>

      <DataTable<AdminCommunityReport>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.post_public_id}
        emptyText="신고된 게시글이 없습니다."
      />
    </div>
  );
}
