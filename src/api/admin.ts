/**
 * admin-service API 호출 래퍼.
 *
 * 백엔드 admin-service 의 실제 엔드포인트와 1:1 매칭한다(실 API 연동).
 * client.ts 의 response interceptor 가 ApiResponse envelope({success,data,message})
 * 을 풀어 주므로 호출 측은 항상 `data` 만 받는다.
 *
 * 모니터링은 단일 snapshot 엔드포인트가 백엔드에 없고 6개 개별 엔드포인트가 있다.
 * 프론트는 hook 단에서 Promise.all 로 묶는다.
 */

import { apiClient } from './client';
import { getAccessToken } from '@/auth/tokenStore';
import type {
  DashboardSummary,
  DashboardAlerts,
  ServiceHealthResponse,
  DomainSloResponse,
  QueuesResponse,
  AuthFailuresResponse,
  ConfigResponse,
  EmbedsResponse,
  BusinessAnalyticsResponse,
  TransactionList,
  UserList,
  CommunityReportList,
  DocumentStats,
  DocumentRecentList,
  AuditLogList,
  FinancialAuditLogPage,
  TransactionAuditTrail,
  ChargeAttemptPage,
} from '@/types/admin';

export type AdminQueryParams = Record<string, string | number | undefined>;

function toParams(p?: AdminQueryParams): Record<string, string | number> | undefined {
  if (!p) return undefined;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== '' && v !== 'ALL') out[k] = v;
  }
  return Object.keys(out).length === 0 ? undefined : out;
}

export const adminApi = {
  // ── Dashboard ───────────────────────────────────────────────
  getDashboardSummary: () =>
    apiClient.get<unknown, DashboardSummary>('/admin/dashboard/summary'),

  getDashboardAlerts: () =>
    apiClient.get<unknown, DashboardAlerts>('/admin/dashboard/alerts'),

  // ── Monitoring (6 개별 endpoint) ────────────────────────────
  getServiceHealth: () =>
    apiClient.get<unknown, ServiceHealthResponse>('/admin/monitoring/service-health'),

  getDomainSlo: () =>
    apiClient.get<unknown, DomainSloResponse>('/admin/monitoring/domain-slo'),

  getQueues: () => apiClient.get<unknown, QueuesResponse>('/admin/monitoring/queues'),

  getAuthFailures: () =>
    apiClient.get<unknown, AuthFailuresResponse>('/admin/monitoring/auth-failures'),

  getConfig: () => apiClient.get<unknown, ConfigResponse>('/admin/monitoring/config'),

  getEmbeds: () => apiClient.get<unknown, EmbedsResponse>('/admin/monitoring/embeds'),

  getBusinessAnalytics: () =>
    apiClient.get<unknown, BusinessAnalyticsResponse>('/admin/monitoring/business-analytics'),

  // ── Transactions ────────────────────────────────────────────
  getTransactions: (params?: AdminQueryParams) =>
    apiClient.get<unknown, TransactionList>('/admin/transactions', { params: toParams(params) }),

  /**
   * CSV 다운로드 — text/csv 응답이라 ApiResponse envelope 가 아님.
   * client.ts interceptor 가 `success` 키를 못 찾으면 INVALID_ENVELOPE 를 던지므로
   * raw axios 로 호출하지 않고 직접 fetch 한다(Authorization 헤더는 직접 부착).
   */
  exportTransactionsCsv: async (params?: AdminQueryParams): Promise<Blob> => {
    const qs = new URLSearchParams();
    const cleaned = toParams(params);
    if (cleaned) {
      for (const [k, v] of Object.entries(cleaned)) qs.append(k, String(v));
    }
    const url =
      `/api/v1/admin/transactions/export.csv` + (qs.toString() ? `?${qs.toString()}` : '');
    const token = getAccessToken();
    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`CSV download failed: ${res.status}`);
    }
    return await res.blob();
  },

  // ── Users / KYC ─────────────────────────────────────────────
  getUsers: (params?: AdminQueryParams) =>
    apiClient.get<unknown, UserList>('/admin/users', { params: toParams(params) }),

  approveKyc: (userPublicId: string) =>
    apiClient.post<unknown, void>(`/admin/users/${userPublicId}/kyc/approve`),

  rejectKyc: (userPublicId: string, reason: string) =>
    apiClient.post<unknown, void>(`/admin/users/${userPublicId}/kyc/reject`, { reason }),

  // ── Community ───────────────────────────────────────────────
  getCommunityReports: (params?: AdminQueryParams) =>
    apiClient.get<unknown, CommunityReportList>('/admin/community/reports', {
      params: toParams(params),
    }),

  hidePost: (postPublicId: string) =>
    apiClient.post<unknown, void>(`/admin/community/posts/${postPublicId}/hide`),

  deletePost: (postPublicId: string) =>
    apiClient.delete<unknown, void>(`/admin/community/posts/${postPublicId}`),

  // ── Document AI ─────────────────────────────────────────────
  getDocumentStats: () =>
    apiClient.get<unknown, DocumentStats>('/admin/documents/stats'),

  getRecentDocuments: (params?: AdminQueryParams) =>
    apiClient.get<unknown, DocumentRecentList>('/admin/documents/recent', {
      params: toParams(params),
    }),

  // ── Audit logs ──────────────────────────────────────────────
  getAuditLogs: (params?: AdminQueryParams) =>
    apiClient.get<unknown, AuditLogList>('/admin/audit-logs', { params: toParams(params) }),

  // ── Financial Audit Log (append-only 잔액 변동 기록) ────────
  getFinancialAuditLogs: (params?: AdminQueryParams) =>
    apiClient.get<unknown, FinancialAuditLogPage>('/admin/financial-audit-logs', {
      params: toParams(params),
    }),

  // ── Transaction audit trail (드릴다운) ──────────────────────
  getTransactionAuditTrail: (publicId: string) =>
    apiClient.get<unknown, TransactionAuditTrail>(
      `/admin/transactions/${publicId}/audit-logs`
    ),

  // ── Charge Attempts (충전 시도, 기본 FAILED 필터) ────────────
  getChargeAttempts: (params?: AdminQueryParams) =>
    apiClient.get<unknown, ChargeAttemptPage>('/admin/charge-attempts', {
      params: toParams(params),
    }),
};
