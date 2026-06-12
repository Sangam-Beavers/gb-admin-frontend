#!/bin/sh
# ─────────────────────────────────────────────────────────────
# docker-entrypoint.sh — nginx.conf 의 ${ADMIN_API_URL} 치환 후 nginx 기동
#
# 환경변수:
#   ADMIN_API_URL  admin-service 백엔드 주소 (기본: http://localhost:8085)
#                  stage K8s: http://admin-service.sb-stage-app-ns.svc.cluster.local:8085
# ─────────────────────────────────────────────────────────────
set -e

: "${ADMIN_API_URL:=http://localhost:8085}"

echo "[entrypoint] ADMIN_API_URL=${ADMIN_API_URL}"

# nginx.conf 템플릿에서 ${ADMIN_API_URL}만 치환 (다른 nginx 변수 $host 등은 그대로)
envsubst '${ADMIN_API_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
