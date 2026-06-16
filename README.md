# AutoDrop AI

AutoDrop AI is a self-hostable, AI-powered e-commerce automation SaaS platform built for zero mandatory recurring cost. Phase 1 delivers the production foundation: monorepo tooling, authentication, RBAC, Prisma schema, storage abstraction, Docker, and CI.

## Phase roadmap

- **Phase 1** — Foundation, auth, RBAC, Prisma, storage, CI
- **Phase 2** — AI provider implementations (Gemini, Claude, DeepSeek, Grok, Mistral)
- **Phase 3** — Product research and niche discovery workflows
- **Phase 4** — Etsy and Printify integrations
- **Phase 5** — Supplier automation and fulfillment routing
- **Phase 6** — Marketing automation and customer engagement
- **Phase 7** — Analytics, forecasting, and decision support
- **Phase 8** — Multi-store operations, hardening, and scaling

## Architecture overview

- **Apps**: Next.js 15 web app
- **Packages**: shared Prisma/db, typed config, shared TypeScript contracts
- **Database**: PostgreSQL + Prisma
- **Auth**: Auth.js v5 with credentials and optional Google OAuth
- **Storage**: local filesystem or MinIO
- **Security**: Argon2id, AES-256-GCM, RBAC, middleware protection, rate limiting

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Monorepo structure

```text
apps/
  web/              Next.js app
packages/
  config/           Shared typed env/config
  db/               Prisma schema, client, seed data
  types/            Shared API and platform types
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker / Docker Compose

### Local development

```bash
pnpm install
cp .env.example .env
docker compose up -d db minio
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`.

### Docker setup

```bash
docker compose up --build
```

This starts PostgreSQL, MinIO, and the Next.js app.

## Environment variables

All variables are documented in [.env.example](./.env.example). The platform works without any AI keys configured.

Key variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `STORAGE_PROVIDER=local|minio`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (optional)
- `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `DEEPSEEK_API_KEY`, `GROK_API_KEY`, `MISTRAL_API_KEY` (all optional)

## Database tasks

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Testing and quality

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Seed credentials

Default seed admin credentials:

- **Email**: `admin@autodrop.local`
- **Password**: `Admin123!`

Override them with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
