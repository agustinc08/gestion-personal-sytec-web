FROM node:24.22.1-bookworm-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Se fijan en el bundle: una imagen por entorno. Los pasa el build de CI (ver .github/workflows/ci.yml).
#   BASE_PATH    prefijo público de la web, con barra final (/gestion-personal-sytec/)
#   VITE_API_URL URL de la API, relativa al mismo dominio (/gestion-personal-sytec-api)
ARG BASE_PATH=/gestion-personal-sytec/
ARG VITE_API_URL=/gestion-personal-sytec-api
ENV BASE_PATH=$BASE_PATH VITE_API_URL=$VITE_API_URL
RUN pnpm run build

FROM nginx:1.30.6-alpine3.24 AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
