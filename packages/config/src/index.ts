import { z } from "zod";

export const SUPPORTED_AI_PROVIDERS = ["GEMINI", "CLAUDE", "DEEPSEEK", "GROK", "MISTRAL"] as const;
export const SUPPORTED_STORAGE_PROVIDERS = ["local", "minio"] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("AutoDrop AI"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgresql://autodrop:autodrop_secret@localhost:5432/autodrop"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(16).default("autodrop-phase-one-local-secret"),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  STORAGE_PROVIDER: z.enum(SUPPORTED_STORAGE_PROVIDERS).default("local"),
  LOCAL_STORAGE_PATH: z.string().default("./storage"),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin123"),
  MINIO_BUCKET: z.string().default("autodrop"),
  MINIO_REGION: z.string().default("us-east-1"),
  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal("")),
  GOOGLE_CLIENT_SECRET: z.string().optional().or(z.literal("")),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@autodrop.local"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("Admin123!"),
  SEED_STORE_NAME: z.string().default("AutoDrop Demo Store"),
  SEED_STORE_SLUG: z.string().default("autodrop-demo"),
  GEMINI_API_KEY: z.string().optional().or(z.literal("")),
  CLAUDE_API_KEY: z.string().optional().or(z.literal("")),
  DEEPSEEK_API_KEY: z.string().optional().or(z.literal("")),
  GROK_API_KEY: z.string().optional().or(z.literal("")),
  MISTRAL_API_KEY: z.string().optional().or(z.literal(""))
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(input);
  }

  return cachedEnv;
}

export function getAiProviderConfiguration(env: AppEnv = getEnv()) {
  return SUPPORTED_AI_PROVIDERS.map((provider) => {
    const key = `${provider}_API_KEY` as const;
    const value = env[key];

    return {
      name: provider,
      configured: Boolean(value),
      status: value ? "available" : "not_configured"
    };
  });
}
