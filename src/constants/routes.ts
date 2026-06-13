// 관리자 콘솔 라우트 SSOT. 사이드바·Router·Login redirect가 모두 이 상수를 참조한다.
export const ROUTES = {
  // ===== Auth =====
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',

  // ===== Admin pages =====
  HOME: '/',
  DASHBOARD: '/dashboard',
  MONITORING: '/monitoring',
  ANALYTICS: '/analytics',

  // 금융 운영
  TRANSACTIONS: '/transactions',
  FINANCIAL_AUDIT_LOG: '/financial-audit-log',
  CHARGE_ATTEMPTS: '/charge-attempts',

  // 사용자 운영
  USERS: '/users',
  COMMUNITY: '/community',
  DOCUMENTS: '/document-ai',

  // 시스템
  SETTINGS: '/settings',
} as const;