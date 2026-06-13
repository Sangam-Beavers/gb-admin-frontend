import type { MonitoringSnapshot, MonAlert } from '@/types/admin';

/**
 * 모니터링 스냅샷에서 앱 레벨 위험 조건을 계산해 경보 목록을 만든다.
 * (서비스 다운 / SLO 미달 / 큐 적체 / 인증실패 — 추가 인프라 불필요)
 * 인프라 경보(RDS/ElastiCache)는 백엔드 infra-alerts에서 별도로 받아 합친다.
 */
export function computeAppAlerts(data: MonitoringSnapshot | undefined): MonAlert[] {
  if (!data) return [];
  const alerts: MonAlert[] = [];

  const down = data.service_health.services.filter((s) => s.status === 'DOWN');
  if (down.length > 0) {
    alerts.push({ level: 'critical', source: 'APP', text: `서비스 다운: ${down.map((s) => s.name).join(', ')}` });
  }

  data.domain_slo.slos.forEach((s) => {
    const cur = Number(s.current);
    const tgt = Number(s.target);
    if (cur < tgt) {
      alerts.push({
        level: cur < tgt - 5 ? 'critical' : 'warning',
        source: 'SLO',
        text: `SLO 미달 — ${s.label} ${s.current}% (목표 ${s.target}%)`,
      });
    }
  });

  const qCount = (name: string) => data.queues.queues.find((q) => q.name === name)?.count ?? 0;
  const queueRules: { name: string; label: string; threshold: number }[] = [
    { name: 'CHARGE_FAILED', label: '충전 실패', threshold: 10 },
    { name: 'ANALYSIS_FAILED', label: 'AI 분석 실패', threshold: 10 },
    { name: 'KYC_PENDING', label: 'KYC 대기', threshold: 50 },
    { name: 'COMMUNITY_REPORTS', label: '신고 게시글', threshold: 20 },
  ];
  queueRules.forEach((r) => {
    const c = qCount(r.name);
    if (c > r.threshold) {
      alerts.push({ level: 'warning', source: 'QUEUE', text: `${r.label} 적체 — ${c}건 (임계 ${r.threshold})` });
    }
  });

  const af = data.auth_failures.total_failures;
  if (af > 10) {
    alerts.push({
      level: 'warning',
      source: 'AUTH',
      text: `인증 실패 급증 — ${af}건 (최근 ${data.auth_failures.window_minutes}분)`,
    });
  }

  return alerts;
}

/** critical 먼저 정렬. */
export function sortAlerts(alerts: MonAlert[]): MonAlert[] {
  return [...alerts].sort((a, b) => (a.level === b.level ? 0 : a.level === 'critical' ? -1 : 1));
}
