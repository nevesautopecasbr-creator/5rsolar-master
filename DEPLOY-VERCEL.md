# Passo a passo: Deploy no Vercel (Web + API) com Supabase

Este guia explica como subir o **Web** (Next.js) e a **API** (NestJS) no Vercel e conectá-los ao banco de dados que já está no **Supabase**, para o sistema ficar totalmente funcional.

---

## Visão geral

- **Dois projetos no Vercel**: um para o frontend (Web) e outro para a API.
- **Banco**: continua no Supabase (PostgreSQL). Use a mesma `DATABASE_URL` que você já usa.
- **Ordem recomendada**: 1) Deploy da API → 2) Deploy do Web (assim você já tem a URL da API para configurar no frontend).

---

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com) (login com GitHub).
2. Código do projeto em um repositório **Git** (GitHub, GitLab ou Bitbucket) — o Vercel faz deploy a partir do Git.
3. Variáveis do Supabase em mãos:
   - **DATABASE_URL** (connection string PostgreSQL do Supabase, ex.: `postgresql://postgres.xxx:senha@aws-0-us-east-1.pooler.supabase.com:5432/postgres`).

---

## Parte 1 — Deploy da API (NestJS)

### 1.1 Conectar o repositório ao Vercel (projeto API)

1. Acesse [vercel.com/new](https://vercel.com/new).
2. **Import** o repositório do projeto.
3. **Configure assim**:
   - **Project Name**: ex. `energia-solar-api`.
   - **Root Directory**: clique em **Edit** e selecione **`apps/api`** (só a pasta da API).
   - **Framework Preset**: Vercel deve detectar NestJS; se não, use **Other**.
   - **Build Command**: `pnpm install && pnpm exec prisma generate && pnpm run build`  
     (ou `npm run build` se usar npm na raiz do monorepo — ajuste conforme seu `package.json` em `apps/api`).
   - **Output Directory**: deixe em branco (NestJS não gera pasta `out`).
   - **Install Command**: `pnpm install` (ou `npm install`).

### 1.2 Variáveis de ambiente da API

Em **Settings → Environment Variables** do projeto da API, adicione:

| Nome | Valor | Observação |
|------|--------|------------|
| `NODE_ENV` | `production` | Opcional; Vercel costuma definir. |
| `DATABASE_URL` | `postgresql://...` | **Obrigatório.** Use a URL do Supabase (pooler ou direta). |
| `JWT_SECRET` | (string forte e aleatória) | **Obrigatório.** Gere uma chave segura. |
| `JWT_REFRESH_SECRET` | (outra string forte) | **Obrigatório.** Diferente do `JWT_SECRET`. |
| `JWT_ACCESS_MINUTES` | `15` | Opcional. |
| `JWT_REFRESH_DAYS` | `7` | Opcional. |
| `WEB_ORIGIN` | `https://seu-web.vercel.app` | **Importante.** URL do frontend no Vercel (veja Parte 2). Se tiver domínio próprio, use-o. |
| `REDIS_URL` | *(deixar vazio ou usar Upstash)* | Opcional. Sem Redis, a API sobe normalmente; jobs em background (lembretes/atrasos) ficam desativados. Para ativar, use [Upstash Redis](https://upstash.com) e coloque a URL aqui. |

- Marque essas variáveis para **Production** (e Preview se quiser).

### 1.3 Build da API no Vercel

- O NestJS usa `src/main.ts` como entrypoint; a Vercel detecta automaticamente.
- O build deve rodar **Prisma generate** antes do `nest build`. No `package.json` de `apps/api` já existe `nest build`; garanta que o **Build Command** no Vercel inclua:
  - `pnpm install` (ou `npm install`)
  - `pnpm exec prisma generate` (ou `npx prisma generate`)
  - `pnpm run build` (ou `npm run build`)

Se o build falhar por “prisma generate”, use como **Build Command**:

```bash
pnpm install && pnpm exec prisma generate && pnpm run build
```

### 1.4 Anotar a URL da API

Após o primeiro deploy, a API ficará em algo como:

- `https://energia-solar-api.vercel.app`

**Guarde essa URL** — você vai usar no frontend como `NEXT_PUBLIC_API_URL`.

---

## Parte 2 — Deploy do Web (Next.js)

### 2.1 Novo projeto no Vercel (frontend)

1. De novo em [vercel.com/new](https://vercel.com/new), importe **o mesmo repositório**.
2. Configure como **outro projeto**:
   - **Project Name**: ex. `energia-solar-web`.
   - **Root Directory**: **`apps/web`**.
   - **Framework Preset**: **Next.js** (detectado automaticamente).
   - **Build Command**: `pnpm run build` (ou `npm run build`).
   - **Output Directory**: deixe padrão do Next.js.

### 2.2 Variáveis de ambiente do Web

Em **Settings → Environment Variables** do projeto Web:

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://energia-solar-api.vercel.app` (a URL da API que você anotou) |

- Sem barra no final.
- Marque para **Production** (e Preview se quiser).

### 2.3 Deploy do Web

- Faça o deploy. O frontend passará a chamar a API pela URL configurada.

---

## Parte 3 — API e Web conversando + Supabase

### 3.1 CORS na API

A API já usa `WEB_ORIGIN` e `WEB_ORIGINS` para CORS. Com `WEB_ORIGIN` definido na API como a URL do frontend (ex.: `https://energia-solar-web.vercel.app`), o navegador permite requisições do Web para a API.

### 3.2 Frontend chamando a API

O Web usa `NEXT_PUBLIC_API_URL` em `lib/api.ts` e nas rotas de API. Com essa variável apontando para a URL da API no Vercel, login, cadastros e demais fluxos que usam a API passam a funcionar contra o backend na Vercel.

### 3.3 Banco de dados (Supabase)

- Tanto a API na Vercel quanto seu ambiente local podem usar a **mesma** `DATABASE_URL` do Supabase.
- Não é necessário alterar nada no Supabase; apenas garanta que a URL tenha permissão de conexão a partir da rede (Supabase já permite conexões externas por padrão).

---

## Resumo rápido

1. **API**: novo projeto Vercel, root `apps/api`, configurar `DATABASE_URL` (Supabase), `JWT_*`, `WEB_ORIGIN` (URL do Web). Deploy e copiar URL da API.
2. **Web**: novo projeto Vercel, root `apps/web`, configurar `NEXT_PUBLIC_API_URL` = URL da API. Deploy.
3. **Conversa**: Web usa `NEXT_PUBLIC_API_URL`; API usa `WEB_ORIGIN` para CORS. Banco continua no Supabase com a mesma `DATABASE_URL` na API.

---

## Observações

- **Redis**: Se não configurar `REDIS_URL`, a API sobe normalmente; apenas os jobs em background (lembretes de cobrança e alertas de atraso de obra) ficam desativados. Para ativar em produção, use [Upstash Redis](https://upstash.com) e defina `REDIS_URL`.
- **Uploads**: A API usa pasta local `uploads`. Na Vercel o sistema de arquivos é efêmero; para produção com arquivos persistentes, considere depois integrar **Vercel Blob** ou **S3** (Supabase Storage).
- **Preview (branch)**: Em deploys de preview, defina `NEXT_PUBLIC_API_URL` e `WEB_ORIGIN` para a URL de preview da API, se quiser testar branchs diferentes.

Se seguir esse passo a passo, o ambiente sobe no Vercel (API + Web) e continua usando o banco que já está funcionando no Supabase, com o sistema funcional de ponta a ponta.
