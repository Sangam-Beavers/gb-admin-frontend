import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * 관리자 콘솔 전용 백엔드 admin-service (포트 8085).
 * 운영기에서는 Envoy/ALB가 같은 역할(/api/v1/admin → admin-service)을 하므로
 * 프론트 코드의 호출 경로는 dev/prod 동일하게 '/api/v1/admin/...'을 유지한다.
 */
const ADMIN_BACKEND = 'http://localhost:8085';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 모바일 앱(5173)과 충돌 방지.
    port: 5174,
    proxy: {
      '/api/v1/admin': {
        target: ADMIN_BACKEND,
        changeOrigin: true,
      },
    },
  },
});
