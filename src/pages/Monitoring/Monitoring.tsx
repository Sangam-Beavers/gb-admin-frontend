import { useTranslation } from 'react-i18next';
import { Server, Layers, ShieldAlert, UserCheck } from 'lucide-react';
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
import AlertBanner from '@/components/common/AlertBanner';
import { useMonitoringSnapshot, useAlerts } from '@/hooks/useAdminQueries';
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
  const { alerts } = useAlerts();

  if (!data) {
    return <div>{t('common.loading')}</div>;
  }

  const services = data.service_health.services;
  const upCount = services.filter((s) => s.status === 'UP').length;
  const allUp = upCount === services.length && services.length > 0;
  const kycPending = data.queues.queues.find((q) => q.name === 'KYC_PENDING')?.count ?? 0;
  const analysisFailed = data.queues.queues.find((q) => q.name === 'ANALYSIS_FAILED')?.count ?? 0;
  const authFailures = data.auth_failures.total_failures;

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

      {/* 0) 위험 경보 배너 — 문제 발생 시 상단에 빨강/주황으로 즉시 표시 */}
      <AlertBanner alerts={alerts} />

      {/* 1) 핵심 운영 상태 — 실데이터 기반 */}
      <div className={styles.statGrid}>
        <StatCard
          label="서비스 상태"
          value={`${upCount}/${services.length}`}
          hint="UP / 전체 서비스"
          icon={<Server size={16} />}
          tone={allUp ? 'success' : 'danger'}
        />
        <StatCard
          label="인증 실패"
          value={authFailures}
          hint={`최근 ${data.auth_failures.window_minutes}분`}
          icon={<ShieldAlert size={16} />}
          tone={authFailures === 0 ? 'success' : authFailures > 10 ? 'danger' : 'warning'}
        />
        <StatCard
          label="KYC 대기"
          value={kycPending}
          hint="심사 대기 큐"
          icon={<UserCheck size={16} />}
          tone={kycPending === 0 ? 'success' : kycPending > 50 ? 'warning' : 'info'}
        />
        <StatCard
          label="AI 분석 실패"
          value={analysisFailed}
          hint="실패 큐"
          icon={<Layers size={16} />}
          tone={analysisFailed === 0 ? 'success' : analysisFailed > 10 ? 'danger' : 'warning'}
        />
      </div>

      {/* 2) 인프라/앱 헬스 — Grafana 라이브 임베드(기본 표시, 운영 중요도순) */}
      <h3 className={styles.sectionSub}>{t('monitoring.grafanaTitle')}</h3>
      <div className={styles.embedGrid}>
        {data.embeds.grafana.map((g) => (
          <EmbedFrame
            key={g.name}
            label={g.label}
            url={g.url}
            height={260}
            placeholder="Grafana 대시보드에 도달할 수 없습니다. 운영망/권한을 확인하세요."
          />
        ))}
      </div>

      {/* 3) 도메인 SLO */}
      <h3 className={styles.sectionSub}>{t('monitoring.domainSlo')}</h3>
      <div className={styles.sloGrid}>
        {data.domain_slo.slos.map((slo) => (
          <SloCard key={slo.name} slo={slo} />
        ))}
      </div>

      {/* 4) 운영 큐 */}
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

      {/* 5) 서비스 헬스 상세 */}
      <h3 className={styles.sectionSub}>{t('monitoring.serviceHealth')}</h3>
      <DataTable<ServiceHealth>
        columns={healthCols}
        rows={services}
        rowKey={(r) => r.name}
      />

      {/* 6) 운영 설정 / 인증 실패 상세 */}
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
    </div>
  );
}
