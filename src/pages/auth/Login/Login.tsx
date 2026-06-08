import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startLogin } from '@/auth/login';
import { ROUTES } from '@/constants/routes';
import styles from './Login.module.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  // VITE_SKIP_AUTH=true 면 데모용으로 자동 이동.
  useEffect(() => {
    if (skipAuth) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [skipAuth, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>GB</div>
        <h1 className={styles.title}>{t('auth.login.title')}</h1>
        <p className={styles.desc}>{t('auth.login.description')}</p>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            void startLogin();
          }}
        >
          {t('auth.login.button')}
        </button>
        {skipAuth && <p className={styles.skipNote}>{t('auth.login.skipNote')}</p>}
      </div>
    </div>
  );
}
