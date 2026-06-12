/**
 * React Query hooks for admin-service.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminQueryParams } from '@/api/admin';
import type {
  DashboardSummary,
  DashboardAlerts,
  MonitoringSnapshot,
  TransactionList,
  UserList,
  CommunityReportList,
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
      const [service_health, domain_slo, queues, auth_failures, config, embeds] =
        await Promise.all([
          adminApi.getServiceHealth(),
          adminApi.getDomainSlo(),
          adminApi.getQueues(),
          adminApi.getAuthFailures(),
          adminApi.getConfig(),
          adminApi.getEmbeds(),
        ]);
      return { service_health, domain_slo, queues, auth_failures, config, embeds };
    },
    // 모니터링 화면은 30초마다 자동 갱신. staleTime(전역 30s)을 0으로 덮어써
    // 화면에 머물러 있어도 주기적으로 최신 헬스/SLO를 가져온다.
    refetchInterval: 30_000,
    staleTime: 0,
  });
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
