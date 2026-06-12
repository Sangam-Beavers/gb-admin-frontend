#!/bin/sh
# ─────────────────────────────────────────────────────────────
# docker-entrypoint.sh
#
# 1) K8s pod 의 /etc/resolv.conf 에서 CoreDNS IP 추출 → export KUBE_DNS_IP
#    (envsubst 는 exported 환경변수만 읽으므로 export 필수)
# 2) nginx.conf 템플릿의 ${ADMIN_API_URL}, ${KUBE_DNS_IP} 치환
# 3) CRLF 제거(tr -d '\r') — Windows 에서 생성된 파일 대비 안전장치
# 4) nginx 기동
# ─────────────────────────────────────────────────────────────
set -e

: "${ADMIN_API_URL:=http://localhost:8085}"

# export 필수 — envsubst 는 shell 지역변수를 못 읽고 exported 변수만 읽음
export KUBE_DNS_IP
KUBE_DNS_IP=$(grep nameserver /etc/resolv.conf 2>/dev/null | awk '{print $2}' | head -1)
: "${KUBE_DNS_IP:=127.0.0.11}"

echo "[entrypoint] ADMIN_API_URL=${ADMIN_API_URL}"
echo "[entrypoint] KUBE_DNS_IP=${KUBE_DNS_IP}"

envsubst '${ADMIN_API_URL} ${KUBE_DNS_IP}' \
  < /etc/nginx/conf.d/default.conf.template \
  | tr -d '\r' \
  > /etc/nginx/conf.d/default.conf

exec "$@"
