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
RUN npm run build

# Produção: copia app completo do builder (dist + node_modules + prisma)
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 3000
# Nest pode gerar dist/main.js ou dist/src/main.js conforme tsconfig
CMD ["sh", "-c", "node dist/src/main.js 2>/dev/null || node dist/main.js"]
