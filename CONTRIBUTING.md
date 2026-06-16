# Contributing

Thanks for contributing to AutoDrop AI.

## Development flow

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env`.
3. Start infrastructure with `docker compose up -d db minio`.
4. Run migrations and seed data with `pnpm db:migrate && pnpm db:seed`.
5. Start the app with `pnpm dev`.

## Quality checks

Run the following before opening a pull request:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`

## Standards

- Keep the platform self-hostable with zero mandatory recurring cost.
- Do not introduce OpenAI integrations.
- Preserve strict TypeScript typing and avoid `any` in core code.
