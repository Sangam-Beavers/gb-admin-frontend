import { FileText, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import { useDocuments } from '@/hooks/useAdminQueries';
import { formatDateTime } from '@/utils/format';
import type { AdminDocument } from '@/types/admin';
import styles from './DocumentAI.module.css';

const DOC_TYPE_LABEL: Record<string, string> = {
  LABOR_CONTRACT: '근로계약서',
  PAYSLIP: '급여명세서',
  EMPLOYMENT_CONTRACT: '고용계약서',
};

const RISK_LABEL: Record<AdminDocument['overall_risk_level'], string> = {
  LOW: '정상',
  MEDIUM: '주의',
  HIGH: '위험',
};

function riskTone(r: AdminDocument['overall_risk_level']) {
  switch (r) {
    case 'LOW':
      return 'success' as const;
    case 'MEDIUM':
      return 'warning' as const;
    case 'HIGH':
      return 'danger' as const;
  }
}

export default function DocumentAI() {
  const { data } = useDocuments();
  const stats = data?.stats;

  const columns: ColumnDef<AdminDocument>[] = [
    {
      key: 'doc',
      header: '문서',
      render: (r) => (
        <div>
          <div className={styles.title}>
            {DOC_TYPE_LABEL[r.analysis_document_type] ?? r.analysis_document_type}
          </div>
          <div className={styles.subtle}>{formatDateTime(r.analyzed_at)}</div>
        </div>
      ),
    },
    { key: 'user', header: '사용자', width: '160px', render: (r) => r.user_name },
    { key: 'lang', header: '언어', width: '80px', render: (r) => r.language },
    {
      key: 'risk',
      header: '위험도',
      width: '100px',
      render: (r) => (
        <Badge tone={riskTone(r.overall_risk_level)}>
          {RISK_LABEL[r.overall_risk_level] ?? r.overall_risk_level}
        </Badge>
      ),
    },
    {
      key: 'link',
      header: '연결',
      render: (r) => r.follow_up_action ?? <span className={styles.muted}>-</span>,
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>Document AI</h2>

      <div className={styles.statGrid}>
        <StatCard
          label="오늘 분석"
          value={stats?.today_analyzed ?? 0}
          icon={<FileText size={16} />}
          tone="info"
        />
        <StatCard
          label="성공"
          value={stats?.success_count ?? 0}
          icon={<CheckCircle2 size={16} />}
          tone="success"
        />
        <StatCard
          label="실패"
          value={stats?.failed_count ?? 0}
          icon={<AlertCircle size={16} />}
          tone="warning"
        />
        <StatCard
          label="부분 성공"
          value={stats?.partial_count ?? 0}
          icon={<Layers size={16} />}
        />
      </div>

      <h3 className={styles.sectionSub}>최근 분석</h3>
      <DataTable<AdminDocument>
        columns={columns}
        rows={data?.documents ?? []}
        rowKey={(r) => r.document_public_id}
      />
    </div>
  );
}
