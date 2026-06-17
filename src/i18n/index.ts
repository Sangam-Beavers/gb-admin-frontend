import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ko from './locales/ko.json';
import en from './locales/en.json';

/**
 * i18next 전역 초기화. 관리자 콘솔은 ko/en 만 지원.
 * (모바일 앱과 달리 운영자는 한국어/영어 중심)
 *
 * 참고: 왼쪽 사이드바(Sidebar.tsx) 메뉴/섹션 라벨은 탭 간 통일성을 위해 i18n을 타지 않고
 * 영어로 하드코딩되어 있다. 로케일과 무관하게 항상 영어로 보인다.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    returnNull: false,
  });

export default i18n;
