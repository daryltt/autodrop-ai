# AutoDrop AI Architecture

## Phase 1 goals

Phase 1 establishes a production-ready monorepo foundation for a self-hostable, multi-tenant e-commerce automation SaaS. The platform is designed to boot without any AI API keys configured while keeping clean seams for Gemini, Claude, DeepSeek, Grok, and Mistral.

## Multi-tenant model

- `Store` is the tenant boundary.
- Each `User` belongs to a `Role` and can own one or more stores.
- Tenant-scoped resources such as products, customers, orders, campaigns, suppliers, AI providers, and analytics reference `storeId`.
- RBAC is modeled with `Role`, `Permission`, and `RolePermission`.

## Authentication and authorization

- Auth.js v5 with JWT sessions is used for app authentication.
- Credentials auth uses Argon2id password hashing.
- Google OAuth is optional and only enabled when credentials are configured.
- Middleware protects dashboard routes and rate limits authentication endpoints.
- AES-256-GCM is used for application-level secret encryption.

## Data layer

- Prisma manages the PostgreSQL schema in `packages/db`.
- Auth-compatible `Account`, `Session`, and `VerificationToken` models are included for optional database-backed sessions later.
- Seed data creates roles, permissions, an admin user, a store, products, a customer, and an order for rapid local setup.

## AI provider abstraction plan

Phase 1 only defines the seam:

- Store-level `AiProvider` records capture provider configuration and limits.
- `AiUsage` records usage, latency, success, and optional cost.
- `packages/config` exports the supported provider list.
- Phase 2: AI provider implementations.

## Storage abstraction

Storage is abstracted behind `StorageProvider`:

- `local` for zero-cost self-hosted development.
- `minio` for S3-compatible object storage.

The app chooses the implementation at runtime from `STORAGE_PROVIDER`.

## Security model

- Strict env parsing with typed defaults for local development.
- Security headers are applied from middleware and `next.config.ts`.
- Authentication endpoints are rate-limited.
- Passwords use Argon2id via `@node-rs/argon2`.
- Secrets are encrypted with AES-256-GCM before persistence.
- No AI provider is required for boot or day-one usage.
