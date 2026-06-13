import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import { useMonitoringSnapshot, useAuditLogs } from '@/hooks/useAdminQueries';
import type { AdminAuditLog, AdminConfigEntry } from '@/types/admin';
import { formatDateTime } from '@/utils/format';
import styles from './Settings.module.css';

const ACTION_LABEL: Record<string, string> = {
  KYC_APPROVE: 'KYC 승인',
  KYC_REJECT: 'KYC 반려',
  POST_HIDE: '게시글 숨김',
  POST_DELETE: '게시글 삭제',
  CONFIG_UPDATE: '운영 설정 변경',
};

export default function Settings() {
  const { data: monitoring } = useMonitoringSnapshot();
  const { data: auditLogs } = useAuditLogs();

  const configCols: ColumnDef<AdminConfigEntry>[] = [
    { key: 'key', header: 'Key', render: (r) => <code>{r.key}</code> },
    { key: 'value', header: 'Value', align: 'right', render: (r) => r.value },
    {
      key: 'currency',
      header: '단위',
      width: '100px',
      align: 'right',
      render: (r) => r.currency ?? '-',
    },
  ];

  const auditCols: ColumnDef<AdminAuditLog>[] = [
    {
      key: 'admin',
      header: '관리자',
      width: '200px',
      render: (r) => <code>{r.admin_public_id.slice(0, 8)}…</code>,
    },
    {
      key: 'action',
      header: '액션',
      render: (r) => ACTION_LABEL[r.action] ?? r.action,
    },
    {
      key: 'target',
      header: '대상',
      width: '180px',
      render: (r) => (
        <span>
          {r.target_type} · <code>{r.target_public_id.slice(0, 8)}…</code>
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      width: '120px',
      render: (r) => r.ip_address,
    },
    {
      key: 'at',
      header: '시각',
      width: '140px',
      align: 'right',
      render: (r) => formatDateTime(r.created_at),
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>Settings</h2>

      <h3 className={styles.sectionSub}>현재 운영 설정값</h3>
      <DataTable<AdminConfigEntry>
        columns={configCols}
        rows={monitoring?.config.configs ?? []}
        rowKey={(r) => r.key}
      />

      <h3 className={styles.sectionSub}>운영자 감사 로그</h3>
      <DataTable<AdminAuditLog>
        columns={auditCols}
        rows={auditLogs?.audit_logs ?? []}
        rowKey={(r) => r.public_id}
      />
    </div>
  );
}
