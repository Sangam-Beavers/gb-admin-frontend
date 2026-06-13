import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/auth/tokenStore';

/**
 * 백엔드 ApiResponse / ErrorResponse 형식 (gb-backend common-response 모듈 SSOT).
 *
 * - 성공: { success: true, data: T, message: string }
 * - 실패: { success: false, code: string, message: string }
 *
 * interceptor가 envelope을 자동으로 풀어, 호출 측 코드는 항상 data만 받는다.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
}

export class ApiException extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, httpStatus: number, message: string) {
    super(message);
    this.name = 'ApiException';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * baseURL = '/api/v1' — Vite proxy(dev) 또는 Envoy/ALB(prod)가 admin-service(8085)로 라우팅.
 * 같은 origin 호출이라 CORS 별도 설정 불필요(Vite proxy 환경 기준).
 *
 * timeout 15s — 대시보드 집계 API 등 느린 응답 고려.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    const body = res.data as ApiSuccess<unknown>;
    if (body && typeof body === 'object' && 'success' in body && body.success === true) {
      return body.data as unknown as typeof res;
    }
    throw new ApiException(
      'INVALID_ENVELOPE',
      res.status,
      '백엔드 응답이 표준 envelope을 따르지 않습니다.'
    );
  },
  (err: AxiosError<ApiError>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;

    // no-login 콘솔: 401이어도 로그인 페이지로 튕기지 않는다. 에러는 그대로 던져 호출 측(react-query)이 처리.
    if (body && typeof body === 'object' && body.success === false) {
      throw new ApiException(body.code, status, body.message);
    }

    throw new ApiException('NETWORK_ERROR', status, err.message || '네트워크 오류가 발생했습니다.');
  }
);
