# gb-admin-frontend

외국인 근로자 금융 플랫폼의 **관리자 페이지 프론트엔드**.

모바일 앱 (`SBeavers/frontend`) 과 별개의 데스크탑용 관리자 콘솔이며, 동일한 Authentik OIDC 를 사용한다.

## 기술 스택

- React 19 + TypeScript (tsc 6)
- Vite 8 + pnpm
- TanStack React Query 5
- React Router 7
- i18next (ko/en)
- recharts (Error Budget gauge)
- lucide-react (아이콘)
- ESLint + Prettier + Husky + commitlint

## 시작하기

```bash
pnpm install
cp .env.example .env.development
pnpm dev   # http://localhost:5174
```

기본값 `VITE_SKIP_AUTH=true` 로 인증 없이 모든 페이지가 mock 데이터로 즉시 렌더된다.

## 페이지

| 경로                                       | 설명                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `/dashboard`                               | 운영 KPI 요약 (거래액·DAU·문서·큐 + 운영 알림)                        |
| `/monitoring`                              | 서비스 헬스·도메인 SLO·Error Budget·운영 큐 + Grafana/ArgoCD 임베드 |
| `/transactions`                            | 거래 로그 검색 / 필터 / CSV / 행별 감사 로그 드릴다운               |
| `/transactions/:publicId/audit-trail`      | 거래별 audit trail 전체 페이지                                       |
| `/financial-audit-log` ★                   | 금융 감사 로그 (모든 잔액 변동 append-only — 부정거래·고객분쟁 조사) |
| `/charge-attempts`                         | 외부 은행 충전 시도 (기본 FAILED 필터, 운영 모니터링)                |
| `/users`                                   | KYC 처리 (승인/반려) + PII 마스킹                                    |
| `/community`                               | 신고 게시글 (숨김/삭제)                                              |
| `/document-ai`                             | AI 문서 분석 통계 + 최근 분석                                        |
| `/settings`                                | 운영 설정값 read-only + 운영자 감사 로그                              |

사이드바 3 섹션: **금융 운영 / 사용자 운영 / 시스템**.

## 인증

- Authentik OIDC PKCE (기존 모바일 앱과 동일 IdP).
- 운영 전환 시 Authentik 콘솔에서 **admin Application + admin group 정책**을 별도 등록.
- 데모 시 `.env` 의 `VITE_SKIP_AUTH=true` 로 인증 우회.

## 백엔드 연동

- Vite proxy 로 `/api/v1/admin/*` → `http://localhost:8085` (admin-service).
- 응답 envelope: `{ success, data, message }` (snake_case).
- `hooks/useAdminQueries.ts` 가 `adminApi.getXxx()` 를 호출해 **실 admin-service API 와 직접 연동**.
- `src/mocks/*.json` 은 fallback/테스트용으로 보존 (현재 import 안 함).
- 백엔드 SLO·Error Budget·금융 감사 로그·운영 알림 등 모두 실 데이터 기반.

## 폴더 구조

```
src/
├── api/         axios client + admin endpoint 래퍼
├── auth/        OIDC PKCE (config / login / logout / pkce / tokenStore)
├── components/
│   ├── common/  Modal / StatCard / DataTable / Badge / FilterBar / EmbedFrame
│   └── layout/  AdminLayout / Sidebar / TopHeader
├── constants/   ROUTES
├── hooks/       useAdminQueries (React Query)
├── i18n/        ko/en
├── mocks/       fallback/테스트용 JSON (현재 미사용)
├── pages/       Dashboard / Monitoring / TransactionLogs(+AuditTrail) / FinancialAuditLog ★
│                ChargeAttempts / Users / Community / DocumentAI / Settings + auth/Login·Callback
├── routes/      Router / ProtectedRoute
├── stores/      authStore (zustand)
├── types/       admin.ts (API contract — snake_case envelope)
├── utils/       format (날짜·금액·잔액 변화 포맷터)
├── App.tsx / main.tsx / index.css
```

## 컨벤션

- 응답 필드는 snake_case 그대로 사용 (백엔드 SSOT).
- 절대경로 `@/` (vite alias + tsconfig paths).
- CSS Modules (`*.module.css`).
- queryKey 는 `['admin', '<domain>', ...]` 형태로 API path 와 정렬.
- 커밋 컨벤션은 모바일 앱과 동일 (`Feature: …` / `Fix: …` …).
