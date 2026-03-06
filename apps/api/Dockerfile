# Build e run da API NestJS no Railway (evita Nixpacks e lockfile corrompido)
# node:20-slim = Debian Bookworm (OpenSSL 3.x). Prisma usa binaryTargets = ["debian-openssl-3.0.x"].
FROM node:20-slim AS base
WORKDIR /app

# Instala OpenSSL para o Prisma detectar a versão e usar o engine correto (evita default openssl-1.1.x)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Instala dependências (npm ci é rápido e usa cache quando package-lock não muda)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN test -f dist/main.js || test -f dist/src/main.js || (echo "Build output:" && ls -la dist/ 2>/dev/null; ls -la dist/src/ 2>/dev/null; exit 1)
# Se o build gerou dist/src/main.js, use-o (alguns ambientes Nest/tsc geram assim)
RUN if [ -f dist/src/main.js ] && [ ! -f dist/main.js ]; then cp dist/src/main.js dist/main.js; fi

# Produção: copia app completo do builder (dist + node_modules + prisma)
FROM base AS runner
ENV NODE_ENV=production
# Força o Prisma a usar o engine OpenSSL 3 (detecção automática falha em imagens mínimas)
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
