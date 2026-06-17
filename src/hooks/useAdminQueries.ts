/**
 * React Query hooks for admin-service.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminQueryParams } from '@/api/admin';
import { computeAppAlerts, sortAlerts } from '@/utils/alerts';
import type {
  DashboardSummary,
  DashboardAlerts,
  MonitoringSnapshot,
  BusinessAnalyticsResponse,
  RevenueSummary,
  InfraAlertsResponse,
  DocumentSubscription,
  MonAlert,
  TransactionList,
  UserList,
  CommunityReportList,
  AdminPostDetail,
  DocumentDashboardData,
  AuditLogList,
  FinancialAuditLogPage,
  TransactionAuditTrail,
  ChargeAttemptPage,
} from '@/types/admin';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: () => adminApi.getDashboardSummary(),
  });
}

export function useDashboardAlerts() {
  return useQuery<DashboardAlerts>({
    queryKey: ['admin', 'dashboard', 'alerts'],
    queryFn: () => adminApi.getDashboardAlerts(),
  });
}

export function useMonitoringSnapshot() {
  return useQuery<MonitoringSnapshot>({
    queryKey: ['admin', 'monitoring', 'snapshot'],
    queryFn: async () => {
      const [service_health, domain_slo, queues, auth_failures, config, embeds] = await Promise.all(
        [
          adminApi.getServiceHealth(),
          adminApi.getDomainSlo(),
          adminApi.getQueues(),
          adminApi.getAuthFailures(),
          adminApi.getConfig(),
          adminApi.getEmbeds(),
        ]
      );
      return { service_health, domain_slo, queues, auth_failures, config, embeds };
    },
    // 모니터링 화면은 30초마다 자동 갱신. staleTime(전역 30s)을 0으로 덮어써
    // 화면에 머물러 있어도 주기적으로 최신 헬스/SLO를 가져온다.
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

/**
 * 비즈니스 분석(인구통계 + 매출/사용) — 모니터링 스냅샷과 분리된 독립 쿼리.
 * 백엔드에 엔드포인트가 없거나(구버전) 실패해도 모니터링/설정 화면이 깨지지 않도록 분리한다.
 */
export function useBusinessAnalytics() {
  return useQuery<BusinessAnalyticsResponse>({
    queryKey: ['admin', 'monitoring', 'business-analytics'],
    queryFn: () => adminApi.getBusinessAnalytics(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Revenue(앱이 번 수익) view model.
 *
 * - 환전/송금 수수료 = 백엔드 `/admin/monitoring/revenue` 실데이터(wallet COMPLETED 거래 fee 집계).
 * - 문서분석 구독 = 별도 도메인(미구현)이라 mock 으로 합성한다.
 *
 * 독립 쿼리 + 페이지 측 mock fail-soft 로, 백엔드가 죽어도 화면이 깨지지 않는다.
 */
export function useRevenue() {
  return useQuery<RevenueSummary>({
    queryKey: ['admin', 'monitoring', 'revenue'],
    queryFn: async () => {
      const api = await adminApi.getRevenue();
      return {
        fee_revenue: api.fee_revenue,
        // 문서분석 구독은 백엔드에 없으므로 mock 으로 채운다(요구사항: 구독만 mock).
        document_subscription: DOCUMENT_SUBSCRIPTION_MOCK,
        // 차트는 number 가 필요하므로 string 금액을 변환.
        monthly_trend: api.monthly_trend.map((m) => ({
          month: m.month,
          exchange_fee: Number(m.exchange_fee),
          remittance_fee: Number(m.remittance_fee),
        })),
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}

/** 문서분석 구독 mock(별도 도메인 미구현). 활성 구독자 ~30명 기준. */
export const DOCUMENT_SUBSCRIPTION_MOCK: DocumentSubscription = {
  currency_code: 'KRW',
  active_subscribers: 30,
  monthly_price: '4900',
  expected_monthly_revenue: '147000',
  new_subscribers_this_month: 5,
  churned_this_month: 2,
};

/**
 * 인프라 경보(RDS/ElastiCache 등) — admin-service가 Prometheus를 쿼리해 반환.
 * 실패해도 화면이 안 깨지도록 독립 쿼리 + fail-soft(빈 배열).
 */
export function useInfraAlerts() {
  return useQuery<InfraAlertsResponse>({
    queryKey: ['admin', 'monitoring', 'infra-alerts'],
    queryFn: () => adminApi.getInfraAlerts(),
    refetchInterval: 30_000,
    staleTime: 0,
    retry: 1,
  });
}

/**
 * 통합 경보 — 앱 레벨(스냅샷 계산) + 인프라(백엔드)를 합쳐 한 목록으로.
 * 헤더 뱃지·각 페이지 배너가 모두 이 훅 하나를 쓴다.
 */
// 경보 출처 → 확인할 Grafana 대시보드(embeds name) 매핑.
// 경보 출처 → 확인할 Grafana 대시보드. label은 Monitoring 임베드 제목과 동일하게 맞춘다.
const SOURCE_TO_DASHBOARD: Record<string, { name: string; label: string }> = {
  RDS: { name: 'rds', label: 'AWS RDS / Aurora' },
  ELASTICACHE: { name: 'elasticache', label: 'AWS ElastiCache' },
  SLO: { name: 'spring_boot', label: 'Spring Boot HTTP (APM)' },
  APP: { name: 'spring_boot', label: 'Spring Boot HTTP (APM)' },
};

export function useAlerts(): { alerts: MonAlert[]; hasCritical: boolean } {
  const { data: snapshot } = useMonitoringSnapshot();
  const { data: infra } = useInfraAlerts();
  const appAlerts = computeAppAlerts(snapshot);
  const infraAlerts: MonAlert[] = (infra?.alerts ?? []).map((a) => ({
    level: a.level,
    text: a.text,
    source: a.source,
  }));

  // 경보별 "확인할 대시보드" 링크 부착 — embeds(grafana) name으로 URL 해석.
  const byName: Record<string, string> = {};
  (snapshot?.embeds.grafana ?? []).forEach((g) => {
    byName[g.name] = g.url;
  });
  const withDashboard = (a: MonAlert): MonAlert => {
    const d = a.source ? SOURCE_TO_DASHBOARD[a.source] : undefined;
    const url = d ? byName[d.name] : undefined;
    return url ? { ...a, dashboardUrl: url, dashboardLabel: d!.label } : a;
  };

  const alerts = sortAlerts([...appAlerts, ...infraAlerts]).map(withDashboard);
  return { alerts, hasCritical: alerts.some((a) => a.level === 'critical') };
}

export function useTransactions(params?: AdminQueryParams) {
  return useQuery<TransactionList>({
    queryKey: ['admin', 'transactions', params ?? {}],
    queryFn: () => adminApi.getTransactions(params),
  });
}

export function useUsers(params?: AdminQueryParams) {
  return useQuery<UserList>({
    queryKey: ['admin', 'users', params ?? {}],
    queryFn: () => adminApi.getUsers(params),
  });
}

export function useApproveKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userPublicId: string) => adminApi.approveKyc(userPublicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userPublicId: string; reason: string }) =>
      adminApi.rejectKyc(vars.userPublicId, vars.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useCommunityReports(params?: AdminQueryParams) {
  return useQuery<CommunityReportList>({
    queryKey: ['admin', 'community', 'reports', params ?? {}],
    queryFn: () => adminApi.getCommunityReports(params),
  });
}

export function useHidePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postPublicId: string) => adminApi.hidePost(postPublicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'community'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postPublicId: string) => adminApi.deletePost(postPublicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'community'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

/** 신고된 게시글 본문 단건 — 모달이 열릴 때만 조회(postPublicId=null이면 비활성). */
export function usePostDetail(postPublicId: string | null) {
  return useQuery<AdminPostDetail>({
    queryKey: ['admin', 'community', 'post', postPublicId],
    queryFn: () => adminApi.getPostDetail(postPublicId!),
    enabled: !!postPublicId,
  });
}

export function useDismissReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postPublicId: string) => adminApi.dismissReport(postPublicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'community'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}

export function useDocuments() {
  return useQuery<DocumentDashboardData>({
    queryKey: ['admin', 'documents'],
    queryFn: async () => {
      const [stats, list] = await Promise.all([
        adminApi.getDocumentStats(),
        adminApi.getRecentDocuments(),
      ]);
      return { stats, documents: list.documents };
    },
  });
}

export function useAuditLogs(params?: AdminQueryParams) {
  return useQuery<AuditLogList>({
    queryKey: ['admin', 'audit-logs', params ?? {}],
    queryFn: () => adminApi.getAuditLogs(params),
  });
}

/**
 * Financial Audit Log — 모든 잔액 변동의 append-only 기록.
 * 부정거래·고객분쟁 조사용 (백엔드 admin-service 신규 엔드포인트).
 */
export function useFinancialAuditLogs(params?: AdminQueryParams) {
  return useQuery<FinancialAuditLogPage>({
    queryKey: ['admin', 'financial-audit-logs', params ?? {}],
    queryFn: () => adminApi.getFinancialAuditLogs(params),
  });
}

/**
 * 특정 거래의 audit trail(드릴다운). 거래 1건의 잔액 변동 흐름을 시각순으로.
 * publicId 가 null 이면 비활성(`enabled: false`).
 */
export function useTransactionAuditTrail(publicId: string | null) {
  return useQuery<TransactionAuditTrail>({
    queryKey: ['admin', 'transactions', publicId, 'audit-logs'],
    queryFn: () => adminApi.getTransactionAuditTrail(publicId!),
    enabled: !!publicId,
  });
}

/**
 * Charge Attempts — 충전 시도 목록. 기본 status=FAILED 로 호출하면
 * "실패한 충전" 운영 큐가 된다.
 */
export function useChargeAttempts(params?: AdminQueryParams) {
  return useQuery<ChargeAttemptPage>({
    queryKey: ['admin', 'charge-attempts', params ?? {}],
    queryFn: () => adminApi.getChargeAttempts(params),
  });
}
