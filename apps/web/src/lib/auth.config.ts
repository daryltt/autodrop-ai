/**
 * Edge-safe Auth.js configuration.
 *
 * This file intentionally imports NO Node-only modules (no Prisma, no argon2)
 * so it can be used safely inside the Next.js middleware (Edge runtime).
 * The full auth configuration — including the Prisma adapter, Credentials
 * provider, and role-assignment callbacks — lives in `auth.ts`.
 */
import type { NextAuthConfig } from "next-auth";

export const edgeAuthConfig = {
  /**
   * Secret is read directly from process.env here rather than via
   * @autodrop/config to avoid any potential module-initialisation side-effects
   * in the Edge runtime. Both sources ultimately read the same variable.
   */
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" as const },
  pages: { signIn: "/auth/sign-in" },
  /** Providers are registered only in the full Node.js `auth.ts` config. */
  providers: [],
} satisfies NextAuthConfig;
