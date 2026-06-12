import { useTranslation } from 'react-i18next';
import { Server, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import StatCard from '@/components/common/StatCard';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import EmbedFrame from '@/components/common/EmbedFrame';
import { useMonitoringSnapshot } from '@/hooks/useAdminQueries';
import type { DomainSlo, ServiceHealth } from '@/types/admin';
import styles from './Monitoring.module.css';

function sloTone(slo: DomainSlo) {
  const current = Number(slo.current);
  const target = Number(slo.target);
  if (current >= target) return 'success' as const;
  if (current >= target - 5) return 'warning' as const;
  return 'danger' as const;
}

function sloColor(slo: DomainSlo) {
  const current = Number(slo.current);
  const target = Number(slo.target);
  if (current >= target) return '#10B981';
  if (current >= target - 5) return '#F59E0B';
  return '#EF4444';
}

function SloCard({ slo }: { slo: DomainSlo }) {
  const current = Number(slo.current);
  const target = Number(slo.target);
  const achieved = current >= target;
  const data = [{ name: slo.name, value: current }];
  return (
    <div className={styles.sloCard}>
      <div className={styles.sloHeader}>
        <span className={styles.sloLabel}>{slo.label}</span>
        <Badge tone={sloTone(slo)}>{achieved ? '목표 달성' : '목표 미달'}</Badge>
      </div>
      <div className={styles.sloChart}>
        <ResponsiveContainer width="100%" height={140}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} fill={sloColor(slo)} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className={styles.sloChartLabel}>
          <strong>{current.toFixed(1)}%</strong>
          <small>성공률</small>
        </div>
      </div>
      <div className={styles.sloMeta}>
        목표 {slo.target}% / 현재 {slo.current}%
      </div>
    </div>
  );
}

export default function Monitoring() {
  const { t } = useTranslation();
  const { data } = useMonitoringSnapshot();

  if (!data) {
    return <div>{t('common.loading')}</div>;
  }

  const upCount = data.service_health.services.filter((s) => s.status === 'UP').length;

  const healthCols: ColumnDef<ServiceHealth>[] = [
    { key: 'name', header: 'Service', render: (r) => r.name },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <Badge tone={r.status === 'UP' ? 'success' : r.status === 'DOWN' ? 'danger' : 'warning'}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'rt',
      header: 'p50',
      width: '100px',
      align: 'right',
      render: (r) => (r.response_time_ms == null ? '-' : `${r.response_time_ms} ms`),
    },
  ];

  return (
    <div>
      <h2 className={styles.sectionTitle}>{t('monitoring.title')}</h2>

      <div className={styles.statGrid}>
        <StatCard
          label="API Gateway"
          value="OK"
          hint={`${upCount}/${data.service_health.services.length} services UP`}
          icon={<Server size={16} />}
          tone="success"
        />
        <StatCard
          label="OCR Queue"
          value={data.queues.queues.find((q) => q.name === 'ANALYSIS_FAILED')?.count ?? 0}
          hint="실패 큐"
          icon={<Layers size={16} />}
          tone="warning"
        />
      </div>

      <h3 className={styles.sectionSub}>{t('monitoring.domainSlo')}</h3>
      <div className={styles.sloGrid}>
        {data.domain_slo.slos.map((slo) => (
          <SloCard key={slo.name} slo={slo} />
        ))}
      </div>

      <h3 className={styles.sectionSub}>{t('monitoring.queues')}</h3>
      <div className={styles.queueGrid}>
        {data.queues.queues.map((q) => (
          <StatCard
            key={q.name}
            label={q.label}
            value={q.count}
            tone={q.count === 0 ? 'success' : q.count > 10 ? 'warning' : 'info'}
          />
        ))}
      </div>

      <h3 className={styles.sectionSub}>{t('monitoring.serviceHealth')}</h3>
      <DataTable<ServiceHealth>
        columns={healthCols}
        rows={data.service_health.services}
        rowKey={(r) => r.name}
      />


<div className={styles.twoCol}>
        <div className={styles.panel}>
          <h4>{t('monitoring.authFailures')}</h4>
          <p className={styles.authMsg}>
            최근 {data.auth_failures.window_minutes}분 인증 실패 {data.auth_failures.total_failures}건
          </p>
        </div>
        <div className={styles.panel}>
          <h4>{t('monitoring.config')}</h4>
          <ul className={styles.configList}>
            {data.config.configs.map((c) => (
              <li key={c.key}>
                <code>{c.key}</code>
                <strong>
                  {c.value} {c.currency ?? ''}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className={styles.sectionSub}>{t('monitoring.grafanaTitle')}</h3>
      <div className={styles.embedGrid}>
        {data.embeds.grafana.map((g) => (
          <EmbedFrame
            key={g.name}
            label={g.label}
            url={g.url}
            height={240}
            placeholder="Grafana 대시보드 - Phase 2 인프라 도입 후 활성화"
          />
        ))}
      </div>

      <h3 className={styles.sectionSub}>{t('monitoring.argocdTitle')}</h3>
      <EmbedFrame
        label="ArgoCD Applications"
        url={data.embeds.argocd.url}
        height={300}
        placeholder="ArgoCD - Phase 2 인프라 도입 후 활성화"
      />
    </div>
  );
}
