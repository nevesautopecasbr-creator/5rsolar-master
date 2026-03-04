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

**Solução definitiva:** O projeto da API usa **apenas npm** na Vercel (sem pnpm), para evitar o erro `ERR_INVALID_THIS`. O `vercel.json` em `apps/api` define `npm install --ignore-scripts` e `npm run build`; tudo roda dentro de `apps/api`, sem depender da raiz do monorepo nem da versão do Node no dashboard.

1. Acesse [vercel.com/new](https://vercel.com/new).
2. **Import** o repositório do projeto.
3. **Configure assim**:
   - **Project Name**: ex. `energia-solar-api`.
   - **Root Directory**: clique em **Edit** e selecione **`apps/api`** (só a pasta da API).
   - **Framework Preset**: Vercel deve detectar NestJS; se não, use **Other**.
   - **Install Command** e **Build Command**: deixe em branco (o `vercel.json` em `apps/api` já define: `npm install --ignore-scripts` e `npm run build`).
   - **Output Directory**: deixe em branco (NestJS não gera pasta `out`).
4. **Não** use "Override" no dashboard para Install/Build a menos que queira forçar npm: o `vercel.json` já faz isso.

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

### 1.3 Build da API no Vercel (serverless)

- Na Vercel a API roda como **função serverless**:
  - **`api/index.js`**: entrypoint que carrega o handler de `dist/src/serverless.js` (gerado pelo `nest build`). A Vercel descobre funções na pasta `api/` automaticamente.
  - **`vercel.json`** usa **rewrites**: `"source": "/(.*)", "destination": "/api"` para que todas as requisições (incluindo `/api/auth/login`, `/api/auth/logout`, OPTIONS, etc.) sejam atendidas pela mesma função em `/api`, evitando 404. Não use mais `builds`/`routes` (configuração legada).
- O `vercel.json` força **npm**: `npm install --ignore-scripts` e `npm run build` (`prisma generate && nest build`). O build gera `dist/`; o handler em `api/index.js` faz `require('../dist/src/serverless').default`.
- Em ambiente local, a API continua com `npm run dev` / `main.ts`. Em produção na Vercel, o tráfego vai para `api/index.js` → handler Nest.
- Se no dashboard da Vercel estiver definido **Install Command** ou **Build Command** (override), apague ou deixe em branco para usar o que está no `vercel.json`.

### 1.4 Anotar a URL da API

Após o primeiro deploy, a API ficará em algo como:

- `https://energia-solar-api.vercel.app`
  "https://5rsolar-mxvjbad5n-itallo-neves-projects.vercel.app/"

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

---

## Web e API não conversando (logout/login falha, Failed to fetch)

**Sintoma:** No console do navegador aparece `POST https://seu-web.vercel.app/api/auth/logout net::ERR_FAILED` ou "Failed to fetch" — a requisição vai para o domínio do **Web** em vez do domínio da **API**.

**Causa:** A variável `NEXT_PUBLIC_API_URL` no projeto **Web** está vazia ou apontando para a URL do próprio frontend.

**Correção:**

1. **Projeto Web na Vercel** → **Settings** → **Environment Variables**
   - Confirme que existe **`NEXT_PUBLIC_API_URL`**.
   - O valor deve ser **exatamente** a URL do projeto da **API** (ex.: `https://energia-solar-api.vercel.app` ou a URL que a API usa na Vercel).
   - **Sem barra no final.** Marque **Production** (e Preview se for usar).
   - Salve e faça um **novo deploy** do Web (variáveis `NEXT_PUBLIC_*` entram no build; mudou variável = redeploy).

2. **Projeto API na Vercel** → **Settings** → **Environment Variables**
   - Confirme que **`WEB_ORIGIN`** é a URL do **frontend** (ex.: `https://5rsolar-web.vercel.app` ou a URL do seu projeto Web).
   - Assim a API aceita requisições do navegador vindo desse domínio (CORS e cookies).

3. **CORS no `vercel.json` da API**  
   O `apps/api/vercel.json` já inclui headers CORS com a origem `https://5rsolar-web.vercel.app`. Se o seu frontend usar **outra URL** (outro subdomínio ou domínio próprio), edite esse arquivo e altere o valor de `Access-Control-Allow-Origin` para a URL exata do seu Web (ex.: `https://seu-dominio.com`). Depois faça um novo deploy da API.

Depois de ajustar as duas variáveis e redeployar o Web, login, logout e demais chamadas à API devem funcionar.

---

## CORS: preflight OPTIONS sem status 2xx (logout bloqueado)

**Sintoma:** No console: `Access to fetch at 'https://...-api.vercel.app/api/auth/logout' from origin 'https://...-web.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status`, seguido de `POST ... net::ERR_FAILED` e `TypeError: Failed to fetch`.

**Causa:** O navegador envia um preflight **OPTIONS** antes do POST. Se a API responder ao OPTIONS com status diferente de 2xx (ex.: 404), o navegador bloqueia o POST.

**O que foi feito na API:** Foi adicionado o **middleware** `CorsPreflightMiddleware` (`apps/api/src/cors-preflight.middleware.ts`), registrado em `AppModule` para todas as rotas (`*`). Esse middleware:

1. Define os headers CORS em toda resposta (incluindo `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials`).
2. Para requisições **OPTIONS**, responde imediatamente com **204** (No Content), sem passar para as rotas. Assim o preflight sempre recebe status 2xx e o navegador libera o POST.

Após um novo deploy da API, o logout e outras requisições que disparam preflight (POST/PUT com headers customizados) devem funcionar. Se o frontend usar outro domínio, altere a constante `ALLOWED_ORIGIN` no middleware para a URL do Web.

---

## Análise: POST /api/auth/login retorna 404 (e solução aplicada)

### Fluxo atual

1. **Front** chama `POST https://5rsolar-api.vercel.app/api/auth/login` (body: email, password).
2. **Vercel** aplica o rewrite `"/(.*)" → "/api?path=$1"`, então a requisição é atendida pela função em **`/api`** (arquivo `api/index.js`).
3. **api/index.js** só repassa `(req, res)` ao handler Nest (`dist/src/serverless.js`). Não altera mais o `req`.
4. **serverless.js** usa o app Express do Nest (cache) e chama `expressApp(req, res)`.
5. **Nest/Express** deveria casar a rota `POST /api/auth/login` (AuthController) e responder.

### O que os logs mostraram

- **OPTIONS** `/api/auth/login` → **204**: preflight OK (CorsPreflightMiddleware responde).
- **POST** `/api/auth/login` → **404**: a função `/api/index` é invocada (Route: `/api`), mas o Nest devolve 404.
- No log do POST apareceu: `req.url=/api/auth/login?path=api%2Fauth%2Flogin` e `path=/api/auth/login`. Ou seja, o pathname já estava correto no `req` que chegou ao entrypoint.

### Por que o 404 pode acontecer

- O **path** que o **roteador do Express/Nest** usa para casar rotas pode não ser o mesmo que `req.url` no entrypoint: o objeto `req` pode ser normalizado ou ter getters em outro nível (ex.: camada Vercel), e alterar `req.url` no `api/index.js` pode não refletir no que o Express lê depois.
- Por isso a correção do path foi levada para **dentro do Nest**, como **primeiro middleware** do Express, no mesmo processo em que o roteador roda, garantindo que o mesmo `req` que o middleware altera seja o que o roteador usa.

### Solução aplicada no código

1. **`apps/api/src/app.factory.ts`**  
   Foi adicionado um **middleware** no **início** da pilha do Express (logo após `setGlobalPrefix("api")`):
   - Lê `req.url` e faz parse (pathname + query).
   - Se o pathname for **apenas** `/api` (ou muito curto) e existir **`?path=...`**, reescreve `req.url`, `req.originalUrl`, `req.path` e `req.baseUrl` para o path vindo do query (ex.: `/api/auth/login`).
   - Assim, quando a Vercel enviar a requisição como `/api?path=api/auth/login`, o roteador do Nest enxerga `POST /api/auth/login` e a rota do AuthController passa a ser encontrada.

2. **`apps/api/api/index.js`**  
   Foi **simplificado**: apenas repassa o handler do Nest (`require("../dist/src/serverless").default`). Toda a lógica de path ficou no middleware dentro do Nest.

### O que conferir na Vercel (se ainda der 404)

- **Root Directory** do projeto da API = **`apps/api`**.
- **Não** usar `outputDirectory` no `vercel.json` (ou manter a pasta `public` se usar).
- Em **Resources** do deploy, deve aparecer a função **`/api/index`**.
- Fazer **novo deploy** após qualquer mudança em `app.factory.ts` ou `api/index.js`.

---

## Requisição indo para URL errada (3rsular, .sp, /sp/…)

**Sintoma:** No console aparece algo como `POST https://3rsular-api.vercel.sp/sp/auth/logout net::ERR_FAILED` ou "Failed to fetch". A URL está com domínio ou caminho errados.

**Causa:** O valor de **`NEXT_PUBLIC_API_URL`** no projeto **Web** na Vercel está incorreto (typo, .sp em vez de .app, 3 em vez de 5, ou path a mais).

**Correção:**

1. Abra o projeto **Web** na Vercel → **Settings** → **Environment Variables**.
2. Edite **`NEXT_PUBLIC_API_URL`** e deixe **exatamente** assim (ajuste só se sua API tiver outra URL):
   - **Valor:** `https://5rsolar-api.vercel.app`
   - **Sem** barra no final.
   - **Sem** caminho (nada depois de `.app`).
   - Domínio com **5** (cinco), não 3 ou “s” (ex.: `5rsolar-api`, não `3rsular-api`).
   - TLD **`.app`**, não `.sp` (ex.: `vercel.app`).
3. Salve e faça um **novo deploy** do Web (Redeploy). Variáveis `NEXT_PUBLIC_*` só entram no build no próximo deploy.
4. Confira a URL real da API em **Deployments** do projeto da API (ex.: `https://5rsolar-api.vercel.app`) e use essa mesma URL em `NEXT_PUBLIC_API_URL`.

Se seguir esse passo a passo, o ambiente sobe no Vercel (API + Web) e continua usando o banco que já está funcionando no Supabase, com o sistema funcional de ponta a ponta.
