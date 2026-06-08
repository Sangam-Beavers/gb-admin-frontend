import { useState } from 'react';
import styles from './EmbedFrame.module.css';

interface EmbedFrameProps {
  label: string;
  url: string;
  height?: number;
  placeholder?: string;
}

/**
 * Grafana / ArgoCD 등 외부 대시보드 iframe 래퍼.
 *
 * 개발기에서는 실제 도달이 안 되므로 onError fallback + 기본적으로 placeholder 표시(showFrame=false 가 default).
 * 사용자가 "Open dashboard" 클릭하면 iframe 시도. 운영기 도입 후 default 를 true로.
 */
export default function EmbedFrame({ label, url, height = 360, placeholder }: EmbedFrameProps) {
  const [showFrame, setShowFrame] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={styles.box} style={{ minHeight: height }}>
      <div className={styles.header}>
        <strong>{label}</strong>
        <div className={styles.actions}>
          <a className={styles.openLink} href={url} target="_blank" rel="noreferrer">
            새 창에서 열기
          </a>
          {!showFrame && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowFrame(true)}
            >
              임베드 시도
            </button>
          )}
        </div>
      </div>
      {showFrame && !errored ? (
        <iframe
          title={label}
          src={url}
          className={styles.frame}
          style={{ height }}
          onError={() => setErrored(true)}
        />
      ) : (
        <div className={styles.placeholder} style={{ height }}>
          <p>{placeholder ?? 'Phase 2 인프라 도입 후 활성화됩니다.'}</p>
          <small>{url}</small>
        </div>
      )}
    </div>
  );
}
