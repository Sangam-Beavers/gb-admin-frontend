import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import Login from '@/pages/auth/Login/Login';
import Callback from '@/pages/auth/Callback/Callback';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Monitoring from '@/pages/Monitoring/Monitoring';
import Analytics from '@/pages/Analytics/Analytics';
import TransactionLogs from '@/pages/TransactionLogs/TransactionLogs';
import TransactionAuditTrail from '@/pages/TransactionLogs/TransactionAuditTrail';
import FinancialAuditLog from '@/pages/FinancialAuditLog/FinancialAuditLog';
import ChargeAttempts from '@/pages/ChargeAttempts/ChargeAttempts';
import Users from '@/pages/Users/Users';
import Community from '@/pages/Community/Community';
import DocumentAI from '@/pages/DocumentAI/DocumentAI';
import Settings from '@/pages/Settings/Settings';
import { ROUTES } from '@/constants/routes';

export default function Router() {
  return (
    <Routes>
      {/* ===== 인증 페이지 ===== */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.AUTH_CALLBACK} element={<Callback />} />

      {/* ===== 인증 필요 + 사이드바 레이아웃 ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.MONITORING} element={<Monitoring />} />
          <Route path={ROUTES.ANALYTICS} element={<Analytics />} />

          {/* 금융 운영 */}
          <Route path={ROUTES.TRANSACTIONS} element={<TransactionLogs />} />
          <Route
            path={`${ROUTES.TRANSACTIONS}/:publicId/audit-trail`}
            element={<TransactionAuditTrail />}
          />
          <Route path={ROUTES.FINANCIAL_AUDIT_LOG} element={<FinancialAuditLog />} />
          <Route path={ROUTES.CHARGE_ATTEMPTS} element={<ChargeAttempts />} />

          {/* 사용자 운영 */}
          <Route path={ROUTES.USERS} element={<Users />} />
          <Route path={ROUTES.COMMUNITY} element={<Community />} />
          <Route path={ROUTES.DOCUMENTS} element={<DocumentAI />} />

          {/* 시스템 */}
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
