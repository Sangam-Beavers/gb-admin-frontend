import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** 최대 너비 (px). 기본 720. */
  maxWidth?: number;
  children: ReactNode;
  /** 푸터 영역(버튼 등). 선택. */
  footer?: ReactNode;
}

/**
 * 가벼운 자체 구현 Modal. 모달 라이브러리 의존 추가 없이
 * - ESC 닫기
 * - backdrop 클릭 닫기
 * - 본문 스크롤 잠금
 *
 * 발표용 audit trail 드릴다운에 쓰인다.
 */
export default function Modal({ open, onClose, title, maxWidth = 720, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth }}
      >
        <header className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
