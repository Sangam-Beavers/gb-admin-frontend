import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  /** 현재 페이지(0-based) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 전체 건수 */
  totalElements: number;
  /** 페이지 이동(0-based) */
  onPageChange: (page: number) => void;
}

/** 현재 페이지 주변으로 최대 5개의 페이지 번호를 만든다(1-based 표시값). */
function pageWindow(current: number, total: number): number[] {
  const span = 5;
  let start = Math.max(0, current - Math.floor(span / 2));
  const end = Math.min(total, start + span);
  start = Math.max(0, end - span);
  const out: number[] = [];
  for (let i = start; i < end; i++) out.push(i);
  return out;
}

/**
 * 목록 하단 페이지네이션. "총 N 건 · 페이지 X / Y" 요약 + 실제 이동 버튼.
 * page 는 0-based(백엔드 계약과 동일), 표시만 +1 한다.
 */
export default function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: PaginationProps) {
  const total = Math.max(totalPages, 1);
  const atFirst = page <= 0;
  const atLast = page >= total - 1;
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 0), total - 1);
    if (next !== page) onPageChange(next);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.summary}>
        총 {totalElements} 건 · 페이지 {page + 1} / {total}
      </div>
      <div className={styles.pager}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(0)}
          disabled={atFirst}
          title="첫 페이지"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(page - 1)}
          disabled={atFirst}
          title="이전 페이지"
        >
          <ChevronLeft size={15} />
        </button>
        {pageWindow(page, total).map((p) => (
          <button
            type="button"
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(page + 1)}
          disabled={atLast}
          title="다음 페이지"
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(total - 1)}
          disabled={atLast}
          title="마지막 페이지"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
