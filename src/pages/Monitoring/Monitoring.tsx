import { useTranslation } from 'react-i18next';
import { Server, Layers, ShieldAlert, UserCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts';
import StatCard from '@/components/common/StatCard';
import DataTable, { type ColumnDef } from '@/components/common/DataTable';
import Badge from '@/components/common/Badge';
import EmbedFrame from '@/components/common/EmbedFrame';
import { useMonitoringSnapshot, useBusinessAnalytics } from '@/hooks/useAdminQueries';
import type { DomainSlo, ServiceHealth, AnalyticsBucket } from '@/types/admin';
import { formatNumber } from '@/utils/format';
import styles from './Monitoring.module.css';

// ── 라벨 매핑 (enum/ISO 코드 → 표시 라벨) ─────────────────────────
const GENDER_LABEL: Record<string, string> = { MALE: '남성', FEMALE: '여성' };
const AGE_LABEL: Record<string, string> = {
  TEENS: '10대',
  TWENTIES: '20대',
  THIRTIES: '30대',
  FORTIES: '40대',
  FIFTIES: '50대',
  SIXTIES_PLUS: '60대+',
};
const NATIONALITY_LABEL: Record<string, string> = {
  VN: '베트남',
  CN: '중국',
  PH: '필리핀',
  KH: '캄보디아',
  NP: '네팔',
  TH: '태국',
  ID: '인도네시아',
  UZ: '우즈베키스탄',
  MM: '미얀마',
  LK: '스리랑카',
  BD: '방글라데시',
  KR: '한국',
};
const ACTION_LABEL: Record<string, string> = {
  CHARGE: '충전',
  TRANSFER: '내부 송금',
  REMITTANCE: '해외 송금',
  EXCHANGE: '환전',
  PAYOUT: '현금화',
  CANCEL: '취소',
};

const GENDER_COLORS: Record<string, string> = { MALE: '#3B82F6', FEMALE: '#EC4899' };
const BAR_COLOR = '#6366F1';
const NAT_COLOR = '#10B981';

function labelBuckets(buckets: AnalyticsBucket[], map: Record<string, string>) {
  return buckets.map((b) => ({ ...b, label: map[b.key] ?? b.key }));
}

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

function GenderDonut({ buckets }: { buckets: AnalyticsBucket[] }) {
  const data = labelBuckets(buckets, GENDER_LABEL);
  const total = data.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className={styles.chartPanel}>
      <h4>성별 분포</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((b) => (
              <Cell key={b.key} fill={GENDER_COLORS[b.key] ?? BAR_COLOR} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatNumber(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.legendRow}>
        {data.map((b) => {
          const pct = total > 0 ? ((b.count / total) * 100).toFixed(1) : '0.0';
          return (
            <span key={b.key} className={styles.legendItem}>
              <i style={{ background: GENDER_COLORS[b.key] ?? BAR_COLOR }} />
              {b.label} {pct}% ({formatNumber(b.count)})
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DistBar({
  title,
  buckets,
  map,
  color,
}: {
  title: string;
  buckets: AnalyticsBucket[];
  map: Record<string, string>;
  color: string;
}) {
  const data = labelBuckets(buckets, map);
  return (
    <div className={styles.chartPanel}>
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 11 }} width={36} />
          <Tooltip formatter={(v: number) => formatNumber(v)} />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#64748b' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Monitoring() {
  const { t } = useTranslation();
  const { data } = useMonitoringSnapshot();
  const { data: ba, isLoading: baLoading, isError: baError } = useBusinessAnalytics();

  if (!data) {
    return <div>{t('common.loading')}</div>;
  }

  const services = data.service_health.services;
  const upCount = services.filter((s) => s.status === 'UP').length;
  const allUp = upCount === services.length && services.length > 0;
  const kycPending = data.queues.queues.find((q) => q.name === 'KYC_PENDING')?.count ?? 0;
  const analysisFailed = data.queues.queues.find((q) => q.name === 'ANALYSIS_FAILED')?.count ?? 0;
  const authFailures = data.auth_failures.total_failures;

  const rev = ba?.revenue;
  const txEntries = Object.entries(rev?.today_transactions_total ?? {});

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

      {/* 1) 핵심 운영 상태 — 실데이터 기반(하드코딩 제거) */}
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

      {/* 6) 비즈니스 분석 — 신규 카테고리(누가 쓰는가 + 어디서 매출이 나는가) */}
      <h2 className={styles.categoryTitle}>{t('monitoring.businessTitle')}</h2>

      {!ba || !rev ? (
        <div className={styles.panel}>
          <p className={styles.authMsg}>
            {baLoading
              ? t('common.loading')
              : baError
                ? '비즈니스 분석 데이터를 불러오지 못했습니다. (admin-service business-analytics 엔드포인트 확인)'
                : '데이터 없음'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatCard label="총 회원" value={formatNumber(rev.total_members)} hint="가입 누적" tone="info" />
            <StatCard label="오늘 신규 가입" value={formatNumber(rev.new_members_today)} hint="당일" tone="success" />
            <StatCard label="DAU" value={formatNumber(rev.daily_active_users)} hint="일일 활성 사용자" tone="info" />
            <StatCard
              label="환전 수수료율"
              value={`${(Number(rev.exchange_fee_rate) * 100).toFixed(2)}%`}
              hint="주요 매출원"
              tone="default"
            />
          </div>

          <h3 className={styles.sectionSub}>{t('monitoring.demographics')}</h3>
          <div className={styles.analyticsGrid}>
            <GenderDonut buckets={ba.demographics.gender_distribution} />
            <DistBar
              title="연령대 분포"
              buckets={ba.demographics.age_distribution}
              map={AGE_LABEL}
              color={BAR_COLOR}
            />
            <DistBar
              title="국적 분포 (Top)"
              buckets={ba.demographics.nationality_distribution.slice(0, 8)}
              map={NATIONALITY_LABEL}
              color={NAT_COLOR}
            />
          </div>

          <h3 className={styles.sectionSub}>{t('monitoring.revenue')}</h3>
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <h4>오늘 거래 총액 (통화별)</h4>
              {txEntries.length === 0 ? (
                <p className={styles.authMsg}>오늘 거래 없음</p>
              ) : (
                <ul className={styles.configList}>
                  {txEntries.map(([currency, amount]) => (
                    <li key={currency}>
                      <code>{currency}</code>
                      <strong>{formatNumber(Number(amount))}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {rev.transactions_by_action.length === 0 ? (
              <div className={styles.panel}>
                <h4>거래 유형별 건수 (수요)</h4>
                <p className={styles.authMsg}>데이터 없음</p>
              </div>
            ) : (
              <DistBar
                title="거래 유형별 건수 (수요)"
                buckets={rev.transactions_by_action}
                map={ACTION_LABEL}
                color="#F59E0B"
              />
            )}
          </div>
        </>
      )}

      {/* 7) 운영 설정 / 인증 실패 상세 */}
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

      {/* 8) ArgoCD */}
      <h3 className={styles.sectionSub}>{t('monitoring.argocdTitle')}</h3>
      <EmbedFrame
        label="ArgoCD Applications"
        url={data.embeds.argocd.url}
        height={300}
        placeholder="ArgoCD에 도달할 수 없습니다. 운영망/권한을 확인하세요."
      />
    </div>
  );
}
