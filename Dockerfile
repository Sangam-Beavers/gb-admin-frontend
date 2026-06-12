# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# 1) Builder — pnpm install + vite build
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm 활성화 (Node 22 corepack 내장)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Husky git hook 설치 스킵 (CI / Docker 빌드 환경)
ENV HUSKY=0

# 의존성 캐시 레이어 (lock 파일 변경 시에만 재설치)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 전체 복사
COPY . .

# 모니터링 대시보드는 OIDC 미사용, VITE_API_BASE_URL 불필요.
# axios baseURL('/api/v1')이 하드코딩 → 빌드 시 env 주입 없음.
RUN pnpm build

# ─────────────────────────────────────────────────────────────
# 2) Runtime — nginx:alpine 정적 호스팅 + API proxy
# ─────────────────────────────────────────────────────────────
FROM nginx:alpine

# gettext(envsubst) 설치 — nginx.conf 템플릿의 ${ADMIN_API_URL} 치환에 사용
RUN apk add --no-cache gettext

# nginx 설정 (template으로 배치 → docker-entrypoint.sh가 envsubst 후 실제 경로에 복사)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 런타임 환경변수 치환 entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
