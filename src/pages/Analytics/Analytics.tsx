import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
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
import { useBusinessAnalytics } from '@/hooks/useAdminQueries';
import type { AnalyticsBucket } from '@/types/admin';
import { formatNumber } from '@/utils/format';
import styles from './Analytics.module.css';

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
  US: '미국',
  ETC: '기타',
};
const ACTION_LABEL: Record<string, string> = {
  CHARGE: '충전',
  TRANSFER: '회원간 송금',
  INTERNAL_TRANSFER: '회원간 송금', // 백엔드 거래 타입 값(INTERNAL_TRANSFER)이 raw로 뜨던 것 매핑
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

export default function Analytics() {
  const { t } = useTranslation();
  const { data: ba, isLoading, isError } = useBusinessAnalytics();

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }
  if (isError || !ba) {
    return (
      <div>
        <h2 className={styles.sectionTitle}>{t('monitoring.businessTitle')}</h2>
        <div className={styles.panel}>
          <p className={styles.authMsg}>
            비즈니스 분석 데이터를 불러오지 못했습니다. (admin-service business-analytics 엔드포인트 확인)
          </p>
        </div>
      </div>
    );
  }

  const rev = ba.revenue;
  const txEntries = Object.entries(rev.today_transactions_total ?? {});

  return (
    <div>
      <h2 className={styles.sectionTitle}>{t('monitoring.businessTitle')}</h2>

      <div className={styles.statGrid}>
        <StatCard label="총 회원" value={formatNumber(rev.total_members)} hint="가입 누적" tone="info" />
        <StatCard label="오늘 신규 가입" value={formatNumber(rev.new_members_today)} hint="당일" tone="success" />
        <StatCard label="DAU" value={formatNumber(rev.daily_active_users)} hint="일간 활성 사용자" tone="info" />
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
    </div>
  );
}
