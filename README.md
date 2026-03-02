# ERP Energia Solar

Monorepo TypeScript para ERP de empresas de energia solar com foco em Projetos/Obras e Financeiro por projeto.

## Stack
- Backend: NestJS + Prisma + Postgres
- Cache/Queue: Redis + BullMQ
- Frontend: Next.js (App Router) + Tailwind + shadcn/ui (base)
- Auth: JWT + RBAC + auditoria
- Qualidade: ESLint + Prettier + Husky + lint-staged + Vitest/Jest

## Requisitos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

## Configuração
1) Copie envs:
```
Copy-Item env.example .env
Copy-Item apps\api\env.example apps\api\.env
Copy-Item apps\web\env.example apps\web\.env
```

2) Suba Postgres/Redis:
```
docker compose up -d
```

3) Instale dependências:
```
pnpm install
```

4) Prisma (API):
```
pnpm --filter @erp/api prisma generate
pnpm --filter @erp/api prisma migrate dev --name init
pnpm --filter @erp/api prisma db seed
```

## Rodar
- API:
```
pnpm --filter @erp/api dev
```

- Web:
```
pnpm --filter @erp/web dev
```

## Testes
- API:
```
pnpm --filter @erp/api test
```

- Web:
```
pnpm --filter @erp/web test
```

## Lint/Format
```
pnpm lint
pnpm format
```

## Estrutura
```
apps/
  api/   # NestJS + Prisma
  web/   # Next.js App Router
packages/
  shared/
  config/
```

## Documentação da API
- Swagger: `http://localhost:3001/api/docs`

## Precificação e Custos
- Rotas Web:
  - `/pricing` (Despesas)
  - `/pricing/simulator` (Simulador de Preço)
- Endpoints principais:
  - `GET/PUT /api/pricing/settings`
  - `CRUD /api/pricing/fixed-expenses`
  - `CRUD /api/pricing/variable-expenses`
  - `GET/PUT /api/pricing/revenue-base?year=YYYY`
  - `CRUD /api/pricing/items`
  - `GET /api/pricing/summary?year=YYYY`
  - `GET /api/pricing/items/calculated?year=YYYY`

## Observações
- Auth usa JWT com permissões por módulo.
- Todas as entidades relevantes possuem auditoria (`createdBy`, `updatedBy`, timestamps) e `AuditLog`.
- Multi-tenant opcional via `companyId`.
- Seeds criam um admin padrão:
  - `admin@erp.local` / `Admin@123`
