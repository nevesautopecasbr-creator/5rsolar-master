## Guia de Migração do Ambiente de Desenvolvimento (ERP Energia Solar)

Este documento descreve o passo a passo completo para migrar o desenvolvimento do projeto **ERP Energia Solar** para outro computador, incluindo:

- Instalação de ferramentas necessárias
- Clonagem do repositório
- Configuração de variáveis de ambiente
- Subida de banco de dados e Redis (via Docker)
- Migrations, seed e execução da API e do frontend
- Observações sobre autenticação e políticas de acesso
- Uso do Cursor como IDE

Repositório oficial: `https://github.com/juarezsilveirajunior-byte/energia-solar-5r`

---

## Visão geral da stack

- **Backend**: NestJS + Prisma + Postgres
- **Cache/Fila**: Redis + BullMQ
- **Frontend**: Next.js (App Router) + Tailwind + shadcn/ui
- **Auth**: JWT + RBAC (permissões por módulo) + auditoria
- **Qualidade**: ESLint + Prettier + Husky + lint-staged + Vitest/Jest
- **Gerenciador de pacotes**: pnpm
- **Orquestração local**: Docker + Docker Compose

---

## Pré-requisitos na nova máquina

Instale **todos** os itens abaixo na nova máquina antes de continuar.

### Git

- Baixar em: `https://git-scm.com/downloads`
- Durante a instalação, aceitar opções padrão (pode ajustar conforme preferência).

### Node.js 20+

- Baixar em: `https://nodejs.org/`
- Escolher versão **LTS** (se for 20.x) ou superior compatível com o projeto.
- Depois de instalar, conferir no terminal (PowerShell ou CMD):

```bash
node -v
npm -v
```

### pnpm 9+

Instalar globalmente:

```bash
npm install -g pnpm
```

Conferir versão:

```bash
pnpm -v
```

### Docker e Docker Compose

- Instalar **Docker Desktop** para Windows:  
  `https://www.docker.com/products/docker-desktop/`
- Após a instalação, abrir o Docker Desktop e confirmar que ele está rodando.
- No terminal:

```bash
docker -v
docker compose version
```

### Editor / IDE (Cursor)

- Instalar o **Cursor** na nova máquina:  
  `https://www.cursor.com/`
- Abrir o Cursor e configurar login/tema/extensões conforme preferência.

---

## Clonar o repositório na nova máquina

No novo computador:

1. Escolher uma pasta de trabalho, por exemplo:
   - `C:\Users\SEU_USUARIO\Desktop\`  
     ou  
   - `C:\dev\projetos\`
2. No PowerShell (ou terminal de sua preferência):

```bash
cd "C:\Users\SEU_USUARIO\Desktop"
git clone https://github.com/juarezsilveirajunior-byte/energia-solar-5r.git
cd energia-solar-5r
```

3. Verificar se os arquivos foram clonados (por exemplo, se existem `apps`, `packages`, `package.json`, etc.).

---

## Configurar variáveis de ambiente (.env)

O repositório já traz arquivos `env.example` com os exemplos.  
No Windows/PowerShell, a partir da pasta raiz do projeto (`energia-solar-5r`):

### Clonar envs base

```powershell
Copy-Item env.example .env
Copy-Item apps\api\env.example apps\api\.env
Copy-Item apps\web\env.example apps\web\.env
```

Se estiver usando outro shell (Git Bash, etc.), use o comando equivalente de cópia (`cp`).

### Ajustar os valores das variáveis

- Abrir os arquivos `.env` criados:
  - `.env` na raiz
  - `apps/api/.env`
  - `apps/web/.env`
- Conferir e ajustar conforme necessário:
  - URL de conexão com Postgres (host, porta, usuário, senha, database)
  - URL de Redis
  - Segredos JWT (ex.: `JWT_SECRET`)
  - Portas de API e Web, se quiser customizar

> Importante: manter os mesmos valores que você usava na máquina antiga, se possível, para comportamentos equivalentes.

---

## Subir Banco de Dados (Postgres) e Redis com Docker

Na pasta raiz do projeto (`energia-solar-5r`), existe um `docker-compose.yml` configurado.

1. Subir os serviços:

```bash
docker compose up -d
```

Isso deve subir, pelo menos:

- Um container **Postgres** (banco de dados principal)
- Um container **Redis** (cache/fila)

2. Confirmar se os containers estão rodando:

```bash
docker ps
```

Você deve ver os containers definidos no `docker-compose.yml` em estado `Up`.

---

## Instalar dependências do projeto

Ainda na raiz do projeto:

```bash
pnpm install
```

Isso vai instalar dependências de todos os pacotes/apps do monorepo, de acordo com o `pnpm-workspace.yaml`.

---

## Preparar o banco de dados com Prisma

As migrations e seeds do backend estão no app `@erp/api`.

Rodar os comandos Prisma:

```bash
pnpm --filter @erp/api prisma generate
pnpm --filter @erp/api prisma migrate dev --name init
pnpm --filter @erp/api prisma db seed
```

- `prisma generate`: gera o client do Prisma.
- `prisma migrate dev --name init`: aplica as migrations no banco de dados.
- `prisma db seed`: popula o banco com dados iniciais (incluindo usuário admin, permissões e dados de teste, se configurado).

> Observação: o seed normalmente cria um usuário admin padrão, conforme documentado no README:
> - Email: `admin@erp.local`
> - Senha: `Admin@123`
>  
> Esses valores podem ser diferentes se você alterou o seed na máquina antiga.

---

## Rodar a API e o Frontend localmente

Após tudo configurado:

### Rodar API (backend)

Na raiz do projeto:

```bash
pnpm --filter @erp/api dev
```

- A API deve subir na porta configurada no `.env` da API (ex.: `http://localhost:3001`).
- Swagger geralmente fica em `http://localhost:3001/api/docs`.

### Rodar Web (frontend)

Em outro terminal, também na raiz do projeto:

```bash
pnpm --filter @erp/web dev
```

- O frontend (Next.js) deve subir na porta padrão do Next (ex.: `http://localhost:3000`) ou na porta configurada no `.env` do app web.

---

## Acessar o sistema para testes

1. Com API e Web rodando:
   - Abrir o navegador na URL do frontend, por exemplo:
     - `http://localhost:3000`
2. Fazer login com o usuário admin (se o seed padrão estiver ativo):
   - Usuário: `admin@erp.local`
   - Senha: `Admin@123`
3. Confirmar acesso aos módulos:
   - Projetos/Obras
   - Financeiro por projeto
   - Rotas de precificação (`/pricing`, `/pricing/simulator`) se estiverem ativas

---

## Políticas de acesso, RBAC e auditoria

O projeto usa **RBAC** (Role-Based Access Control) e auditoria:

- Permissões por módulo, associadas ao usuário/role.
- Auditoria com campos como `createdBy`, `updatedBy`, timestamps, e entidades de audit log (como `AuditLog`).
- Multi-tenant opcional via `companyId`.

Na migração para a nova máquina:

- Essas políticas são definidas **no código** e nas migrations/seeds.
- Ao rodar `prisma migrate` + `prisma db seed` no novo banco, a estrutura de permissão e auditoria é recriada conforme o código atual.
- Você não precisa “copiar” as políticas manualmente; elas vêm junto com o schema e o seed.

Se você tiver feito alterações manuais no banco antigo (por exemplo, criar roles direto no banco sem passar por migrations/seed), então seria necessário:

- Exportar esse banco antigo (dump do Postgres).
- Importar no novo Postgres.

Caso contrário, usar apenas migrations + seed é suficiente.

---

## Migração de dados reais (opcional)

Se na máquina antiga você tinha **dados reais ou de teste avançado** que quer manter:

1. No Postgres da máquina antiga:

   Fazer um dump do banco:

   ```bash
   pg_dump -h HOST_ANTIGO -U USUARIO -d NOME_DO_BANCO > backup.sql
   ```

2. No Postgres da nova máquina:

   Restaurar o backup:

   ```bash
   psql -h HOST_NOVO -U USUARIO -d NOME_DO_BANCO < backup.sql
   ```

3. Ajustar as variáveis de ambiente (`DATABASE_URL`) se necessário.

> Se você não precisa dos dados antigos (só da estrutura), basta usar `prisma migrate` + `prisma db seed` e ignorar este passo.

---

## Usando o Cursor na nova máquina

1. Abrir o **Cursor**.
2. `File > Open Folder` e selecionar a pasta clonada `energia-solar-5r`.
3. Confirmar que o Cursor reconhece o projeto (TypeScript/Node).
4. Se quiser usar os mesmos agentes e configurações:
   - Sincronizar sua conta Cursor (login com GitHub, Google, etc.).
   - Ajustar tema, formatação, etc., se necessário.

---

## Checklist rápido de migração

Use esta lista para confirmar que tudo foi feito:

- [ ] Instalei **Git**
- [ ] Instalei **Node.js 20+**
- [ ] Instalei **pnpm 9+**
- [ ] Instalei **Docker Desktop** e ele está rodando
- [ ] Clonei o repositório `energia-solar-5r`
- [ ] Copiei `env.example` → `.env` (raiz, `apps/api`, `apps/web`)
- [ ] Ajustei as variáveis de ambiente conforme necessário
- [ ] Rodei `docker compose up -d`
- [ ] Rodei `pnpm install`
- [ ] Rodei:
  - [ ] `pnpm --filter @erp/api prisma generate`
  - [ ] `pnpm --filter @erp/api prisma migrate dev --name init`
  - [ ] `pnpm --filter @erp/api prisma db seed`
- [ ] Consigo rodar:
  - [ ] API: `pnpm --filter @erp/api dev`
  - [ ] Web: `pnpm --filter @erp/web dev`
- [ ] Consigo acessar o sistema no navegador e logar como admin
- [ ] Cursor abre o projeto normalmente na nova máquina

Se todos os itens estão marcados, a migração do ambiente de desenvolvimento foi concluída com sucesso.

