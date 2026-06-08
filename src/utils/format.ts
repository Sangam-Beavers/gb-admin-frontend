/**
 * 백엔드는 금액을 string("1530000.0000")으로 보낸다(CLAUDE.md §5).
 * 표시용 포맷 헬퍼.
 */
export function formatCurrency(value: string, currency: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return `${value} ${currency}`;
  // KRW/VND 등은 정수, USD 는 소수 2자리.
  const decimals = currency === 'USD' ? 2 : 0;
  return `${num.toLocaleString('ko-KR', { maximumFractionDigits: decimals })} ${currency}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

export function formatDateTime(iso: string): string {
  // "2026-06-08T10:21:00Z" → "06-08 10:21"
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

/** "2026-06-08T10:21:00.123Z" → "06-08 10:21:00" (초 단위) */
export function formatDateTimeWithSeconds(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}:${ss}`;
  } catch {
    return iso;
  }
}

/** "2026-06-08T10:21:00.123Z" → "10:21:00.123" (드릴다운 audit trail용) */
export function formatTimeWithMillis(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mi}:${ss}.${ms}`;
  } catch {
    return iso;
  }
}

/** 잔액 변화 포맷팅: BigDecimal string → 천단위 콤마 + 통화코드 없는 숫자 */
export function formatBalance(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
}

/** 두 잔액의 차이 부호: 'increase' | 'decrease' | 'same'. 단순 비교만. */
export function compareBalance(before: string, after: string): 'increase' | 'decrease' | 'same' {
  const b = Number(before);
  const a = Number(after);
  if (Number.isNaN(b) || Number.isNaN(a)) return 'same';
  if (a > b) return 'increase';
  if (a < b) return 'decrease';
  return 'same';
}
