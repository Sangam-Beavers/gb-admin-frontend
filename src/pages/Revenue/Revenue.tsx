import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Wallet, ArrowLeftRight, Send, FileText, Users } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { useRevenue } from '@/hooks/useAdminQueries';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { RevenueSummary } from '@/types/admin';
import revenueMock from '@/mocks/revenue.json';
import styles from './Revenue.module.css';

const EXCHANGE_COLOR = '#6366F1';
const REMITTANCE_COLOR = '#10B981';

/**
 * 추이 차트 X축 라벨. 백엔드가 주 시작일("2026-06-09")을 보내면 "6/9",
 * 구형 월 포맷("2026-06")이면 "6월"로 표시(혼용 안전).
 */
function trendLabel(s: string): string {
  const parts = String(s).split('-');
  const mo = Number(parts[1]);
  const day = Number(parts[2]);
  if (Number.isNaN(mo)) return s;
  return Number.isNaN(day) ? `${mo}월` : `${mo}/${day}`;
}

export default function Revenue() {
  const { t } = useTranslation();
  const { data, isLoading } = useRevenue();

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  // 백엔드 엔드포인트가 아직 없거나 실패하면 mock 으로 fail-soft(데모 데이터 배지 표시).
  const isDemo = !data;
  const rev: RevenueSummary = data ?? (revenueMock as RevenueSummary);
  const fee = rev.fee_revenue;
  const sub = rev.document_subscription;
  const cur = fee.currency_code;

  const trend = rev.monthly_trend.map((p) => ({ ...p, label: trendLabel(p.month) }));
  const byCurrency = fee.by_currency.map((c) => ({
    ...c,
    exchange: Number(c.exchange_fee),
    remittance: Number(c.remittance_fee),
  }));

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>{t('revenue.title')}</h2>
        <span className={styles.subtitle}>{t('revenue.subtitle')}</span>
        {isDemo && <span className={styles.demoBadge}>DEMO</span>}
      </div>
      {isDemo && <p className={styles.demoNote}>{t('revenue.demoNote')}</p>}

      {/* ── 핵심 지표 ───────────────────────────────────────── */}
      <div className={styles.statGrid}>
        <StatCard
          label={t('revenue.totalFee')}
          value={formatCurrency(fee.total_fee_revenue, cur)}
          hint={t('revenue.totalFeeHint')}
          icon={<Wallet size={16} />}
          tone="success"
        />
        <StatCard
          label={t('revenue.exchangeFee')}
          value={formatCurrency(fee.total_exchange_fee, cur)}
          hint={`${t('revenue.thisMonth')} +${formatCurrency(fee.this_month_exchange_fee, cur)}`}
          icon={<ArrowLeftRight size={16} />}
          tone="info"
        />
        <StatCard
          label={t('revenue.remittanceFee')}
          value={formatCurrency(fee.total_remittance_fee, cur)}
          hint={`${t('revenue.thisMonth')} +${formatCurrency(fee.this_month_remittance_fee, cur)}`}
          icon={<Send size={16} />}
          tone="info"
        />
        <StatCard
          label={t('revenue.subscriptionRevenue')}
          value={formatCurrency(sub.expected_monthly_revenue, sub.currency_code)}
          hint={`${formatNumber(sub.active_subscribers)}명 × ${formatCurrency(sub.monthly_price, sub.currency_code)}`}
          icon={<FileText size={16} />}
          tone="warning"
        />
      </div>

      {/* ── 월별 추이 + 문서분석 구독 ───────────────────────── */}
      <div className={styles.twoCol}>
        <div className={styles.chartPanel}>
          <h4>{t('revenue.trendTitle')}</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EXCHANGE_COLOR} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={EXCHANGE_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={REMITTANCE_COLOR} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={REMITTANCE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                width={52}
                tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
              />
              <Tooltip formatter={(v: number) => formatCurrency(String(v), cur)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="exchange_fee"
                name={t('revenue.exchangeFee')}
                stroke={EXCHANGE_COLOR}
                fill="url(#gEx)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="remittance_fee"
                name={t('revenue.remittanceFee')}
                stroke={REMITTANCE_COLOR}
                fill="url(#gRem)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartPanel}>
          <h4>
            {t('revenue.subscriptionTitle')}
            <span className={styles.mockTag}>mock</span>
          </h4>
          <div className={styles.subHero}>
            <Users size={22} className={styles.subHeroIcon} />
            <div>
              <div className={styles.subHeroValue}>{formatNumber(sub.active_subscribers)}</div>
              <div className={styles.subHeroLabel}>{t('revenue.subscribers')}</div>
            </div>
          </div>
          <ul className={styles.kvList}>
            <li>
              <span>{t('revenue.expectedMonthly')}</span>
              <strong>{formatCurrency(sub.expected_monthly_revenue, sub.currency_code)}</strong>
            </li>
            <li>
              <span>{t('revenue.perSubscriber')}</span>
              <strong>{formatCurrency(sub.monthly_price, sub.currency_code)}</strong>
            </li>
            <li>
              <span>{t('revenue.newThisMonth')}</span>
              <strong className={styles.pos}>
                +{formatNumber(sub.new_subscribers_this_month)}
              </strong>
            </li>
            <li>
              <span>{t('revenue.churnedThisMonth')}</span>
              <strong className={styles.neg}>-{formatNumber(sub.churned_this_month)}</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* ── 통화별 수수료 수익 ──────────────────────────────── */}
      <div className={styles.chartPanel}>
        <h4>{t('revenue.byCurrencyTitle')}</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCurrency} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="currency_code" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={52}
              tickFormatter={(v: number) => `${Math.round(v / 10000)}만`}
            />
            <Tooltip formatter={(v: number) => formatCurrency(String(v), cur)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="exchange"
              name={t('revenue.exchangeFee')}
              fill={EXCHANGE_COLOR}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="remittance"
              name={t('revenue.remittanceFee')}
              fill={REMITTANCE_COLOR}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
