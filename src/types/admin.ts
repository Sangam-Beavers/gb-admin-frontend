// types/admin.ts — admin-service API contract (Phase 1, 실 API 연동)

export interface PageMeta {
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface CurrencyAmounts {
  [code: string]: string;
}

export interface QueueCounts {
  kyc_pending: number;
  community_reports: number;
  charge_failed: number;
  analysis_failed: number;
  [k: string]: number;
}

export interface DashboardSummary {
  today_transactions_total: CurrencyAmounts;
  daily_active_users: number;
  today_documents_analyzed: number;
  queues: QueueCounts;
}

export type AlertType =
  | 'SUSPICIOUS_TRANSACTION'
  | 'KYC_PENDING'
  | 'COMMUNITY_REPORT'
  | 'ANALYSIS_FAILED'
  | 'CHARGE_FAILED';

export type AlertStatus = 'REVIEW_NEEDED' | 'PENDING' | 'ACTION_NEEDED' | 'RESOLVED';

export interface AdminAlert {
  type: AlertType;
  label: string;
  message: string;
  status: AlertStatus;
  created_at: string;
}

export interface DashboardAlerts {
  alerts: AdminAlert[];
}

export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  response_time_ms: number | null;
}

export interface ServiceHealthResponse {
  services: ServiceHealth[];
}

export type SloUnit = 'PERCENT' | 'COUNT' | 'MILLISECONDS';

export interface DomainSlo {
  name: string;
  label: string;
  target: string;
  current: string;
  error_budget_remaining_pct: string;
  unit: SloUnit;
}

export interface DomainSloResponse {
  slos: DomainSlo[];
}

export interface AdminQueue {
  name: string;
  label: string;
  count: number;
}

export interface QueuesResponse {
  queues: AdminQueue[];
}

export interface AuthFailureReason {
  reason: string;
  count: number;
}

export interface AuthFailuresResponse {
  window_minutes: number;
  total_failures: number;
  by_reason: AuthFailureReason[];
}

export interface AdminConfigEntry {
  key: string;
  value: string;
  currency: string | null;
}

export interface ConfigResponse {
  configs: AdminConfigEntry[];
}

export interface GrafanaEmbed {
  name: string;
  label: string;
  url: string;
}

export interface ArgoCdEmbed {
  url: string;
}

export interface EmbedsResponse {
  grafana: GrafanaEmbed[];
  argocd: ArgoCdEmbed;
}

export interface MonitoringSnapshot {
  service_health: ServiceHealthResponse;
  domain_slo: DomainSloResponse;
  queues: QueuesResponse;
  auth_failures: AuthFailuresResponse;
  config: ConfigResponse;
  embeds: EmbedsResponse;
}

export type TxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TxRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type TxType = 'INTERNAL_TRANSFER' | 'REMITTANCE' | 'EXCHANGE' | 'CHARGE' | 'PAYOUT';

export interface AdminTransaction {
  transaction_public_id: string;
  user_public_id: string;
  user_name: string;
  type: TxType;
  amount: string;
  currency_code: string;
  status: TxStatus;
  risk_level: TxRisk;
  executed_at: string;
}

export interface TransactionList extends PageMeta {
  transactions: AdminTransaction[];
}

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW' | 'MATCHED';

export interface AdminUser {
  user_public_id: string;
  email: string;
  name: string;
  nickname: string;
  nationality: string;
  kyc_status: KycStatus;
  identity_document_type: string;
  joined_at: string;
}

export interface UserList extends PageMeta {
  members: AdminUser[];
}

export type ReportReason = 'SPAM' | 'ABUSE' | 'FRAUD' | 'SEXUAL' | 'ETC';
export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportStatus = 'PENDING' | 'RESOLVED_DELETED' | 'DISMISSED';

export interface AdminCommunityReport {
  post_public_id: string;
  title: string;
  author_public_id: string;
  author_nickname: string;
  report_count: number;
  reason: ReportReason;
  target_type: ReportTargetType;
  status: ReportStatus;
  last_reported_at: string;
}

export interface CommunityReportList extends PageMeta {
  reports: AdminCommunityReport[];
}

export interface DocumentStats {
  today_analyzed: number;
  success_count: number;
  failed_count: number;
  partial_count: number;
}

export interface AdminDocument {
  document_public_id: string;
  user_public_id: string;
  user_name: string;
  analysis_document_type: string;
  language: string;
  overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  follow_up_action: string | null;
  analyzed_at: string;
}

export interface DocumentRecentList extends PageMeta {
  documents: AdminDocument[];
}

export interface DocumentDashboardData {
  stats: DocumentStats;
  documents: AdminDocument[];
}

export interface AdminAuditLog {
  public_id: string;
  admin_public_id: string;
  action: string;
  target_type: string;
  target_public_id: string;
  ip_address: string;
  before_snapshot: string | null;
  after_snapshot: string | null;
  created_at: string;
}

export interface AuditLogList extends PageMeta {
  audit_logs: AdminAuditLog[];
}

// ── Financial Audit Log (append-only 잔액 변동 기록) ────────────
// 부정거래·고객분쟁 조사용. 모든 잔액 변동이 한 줄씩 적힌다.

export type FinancialAuditAction =
  | 'CHARGE'
  | 'TRANSFER'
  | 'REMITTANCE'
  | 'EXCHANGE'
  | 'CANCEL';

export type FinancialAuditStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface FinancialAuditLog {
  audit_log_public_id: string;
  transaction_public_id: string | null;
  user_public_id: string;
  user_email: string | null;
  user_nickname: string | null;
  action: FinancialAuditAction;
  action_label: string;
  amount: string; // BigDecimal
  currency_code: string;
  before_balance: string;
  after_balance: string;
  status: FinancialAuditStatus;
  status_label: string;
  reason: string | null;
  ip_address: string | null;
  created_at: string; // ISO Z
}

export interface FinancialAuditLogPage extends PageMeta {
  logs: FinancialAuditLog[];
}

// ── Transaction audit trail (드릴다운) ─────────────────────────

export interface TransactionAuditTrailHeader {
  transaction_public_id: string;
  user_public_id: string;
  user_email: string | null;
  user_nickname: string | null;
  receiver_user_public_id: string | null;
  receiver_nickname: string | null;
  type: string;
  type_label: string;
  amount: string;
  currency_code: string;
  status: string;
  status_label: string;
  risk_level: string;
  risk_label: string;
  executed_at: string;
}

export interface TransactionAuditTrail {
  transaction: TransactionAuditTrailHeader;
  logs: FinancialAuditLog[];
}

// ── Charge Attempts ─────────────────────────────────────────────

export interface ChargeAttempt {
  charge_attempt_public_id: string;
  user_public_id: string;
  user_nickname: string | null;
  bank_code: string;
  bank_label: string | null;
  amount: string;
  currency_code: string;
  status: FinancialAuditStatus;
  status_label: string;
  reason: string | null;
  created_at: string;
}

export interface ChargeAttemptPage extends PageMeta {
  attempts: ChargeAttempt[];
}
