import { create } from 'zustand';
import { isLoggedIn as checkLoggedIn, clearLocalTokens } from '@/auth/tokenStore';

/**
 * 인증 상태 store. tokenStore(sessionStorage)는 SSOT지만,
 * React 컴포넌트가 상태 변화를 구독하려면 별도 store가 필요.
 *
 * 토큰 변경(saveTokens/clearLocalTokens) 시 syncFromStorage()를 호출해야 한다.
 */
interface AuthState {
  isAuthenticated: boolean;
  syncFromStorage: () => void;
  logoutLocal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: checkLoggedIn(),
  syncFromStorage: () => set({ isAuthenticated: checkLoggedIn() }),
  logoutLocal: () => {
    clearLocalTokens();
    set({ isAuthenticated: false });
  },
}));
