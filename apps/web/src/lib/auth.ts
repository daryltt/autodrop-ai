import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { getEnv } from "@autodrop/config";
import { prisma, RoleName } from "@autodrop/db";
import type { RoleName as AppRoleName } from "@autodrop/types";
import { verifyPassword } from "@/lib/password";
import { resolveRole } from "@/lib/auth-utils";

export { resolveRole } from "@/lib/auth-utils";

const env = getEnv();
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

async function ensureDefaultRole() {
  return prisma.role.upsert({
    where: { name: RoleName.VIEWER },
    update: {},
    create: {
      name: RoleName.VIEWER,
      description: "Default viewer role"
    }
  });
}

/**
 * Ensures that a User row exists in the database for the given OAuth profile
 * and that it has a role assigned.  This is the primary place where
 * default-role assignment happens for OAuth sign-ins when using the JWT
 * session strategy, because the Prisma adapter's `createUser` hook is not
 * guaranteed to be invoked on every first-time OAuth sign-in under JWT.
 */
async function ensureOAuthUserWithRole(email: string, name?: string | null, image?: string | null): Promise<void> {
  const defaultRole = await ensureDefaultRole();
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name ?? null,
      image: image ?? null,
      roleId: defaultRole.id
    },
    update: {}
  });
}

const providers: NonNullable<NextAuthConfig["providers"]> = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        include: { role: true }
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await verifyPassword(user.passwordHash, parsed.data.password);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role.name as AppRoleName
      };
    }
  })
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false
    })
  );
}

/**
 * The Prisma adapter is retained so that OAuth Account rows are persisted
 * (enabling account linking and email-based lookups).  Its `createUser` hook
 * is customised to assign the default VIEWER role.  However, because
 * Auth.js v5 with `strategy: "jwt"` does not guarantee that `createUser`
 * runs for every first-time OAuth sign-in, the `signIn` callback below
 * performs a DB upsert as the authoritative role-assignment path.
 */
const baseAdapter = PrismaAdapter(prisma);
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data) {
    const defaultRole = await ensureDefaultRole();
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
        roleId: defaultRole.id
      }
    });
  }
};

export const authConfig = {
  adapter,
  providers,
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/sign-in"
  },
  callbacks: {
    /**
     * For OAuth sign-ins, ensure the user row exists with a role before the
     * `jwt` callback runs.  Credentials sign-ins already carry the role
     * directly from the `authorize` return value, so they are skipped.
     *
     * If the DB upsert fails (e.g. connection error), we log the error and
     * return `false` to block sign-in rather than let the user proceed with
     * a session that has no resolvable role.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        try {
          await ensureOAuthUserWithRole(user.email, user.name, user.image);
        } catch (err) {
          console.error("[auth] signIn: failed to upsert OAuth user with role", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (user?.role !== undefined) {
        token.role = resolveRole(user.role, "jwt/user");
      }

      const email = user?.email ?? token.email;
      if ((!token.role || !token.userId) && email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { role: true }
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = resolveRole(dbUser.role?.name, "jwt/db");
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = resolveRole(token.role, "session");
      }

      return session;
    }
  }
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
