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
 * 기본적으로 iframe을 바로 임베드한다(showFrame=true). 운영기에서 대시보드가 도달 가능하면
 * 클릭 없이 곧장 라이브 패널이 보인다. 로드 실패(onError) 시에만 placeholder + "다시 시도"로 폴백.
 * 화면이 무겁거나 잠시 숨기고 싶으면 "임베드 숨기기"로 토글한다.
 */
export default function EmbedFrame({ label, url, height = 360, placeholder }: EmbedFrameProps) {
  const [showFrame, setShowFrame] = useState(true);
  const [errored, setErrored] = useState(false);

  return (
    <div className={styles.box} style={{ minHeight: height }}>
      <div className={styles.header}>
        <strong>{label}</strong>
        <div className={styles.actions}>
          <a className={styles.openLink} href={url} target="_blank" rel="noreferrer">
            새 창에서 열기
          </a>
          {showFrame ? (
            <button type="button" className={styles.toggleBtn} onClick={() => setShowFrame(false)}>
              임베드 숨기기
            </button>
          ) : (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => {
                setErrored(false);
                setShowFrame(true);
              }}
            >
              임베드 표시
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
          <p>{errored ? '대시보드를 불러오지 못했습니다. 네트워크/권한을 확인하세요.' : (placeholder ?? '임베드가 숨겨져 있습니다.')}</p>
          <small>{url}</small>
        </div>
      )}
    </div>
  );
}
