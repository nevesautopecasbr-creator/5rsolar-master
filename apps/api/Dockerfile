# Build e run da API NestJS no Railway (evita Nixpacks e lockfile corrompido)
FROM node:20-alpine AS base
WORKDIR /app

# Instala dependências (npm ci é rápido e usa cache quando package-lock não muda)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && (test -f dist/main.js || test -f dist/src/main.js) || (echo "Build output:" && ls -la dist/ 2>/dev/null; ls -la dist/src/ 2>/dev/null; exit 1)

# Produção: copia app completo do builder (dist + node_modules + prisma)
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
