# Build e run da API NestJS no Railway (evita Nixpacks e lockfile corrompido)
FROM node:20-alpine AS base
WORKDIR /app

# Instala dependências (sem package-lock para evitar erro "extraneous"; npm gera árvore limpa)
FROM base AS deps
COPY package.json ./
RUN npm install

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Produção: só o necessário para rodar
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
# Prisma precisa do schema para runtime (migrations opcional)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
