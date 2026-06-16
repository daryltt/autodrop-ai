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
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (user?.role) {
        token.role = user.role;
      }

      const email = user?.email ?? token.email;
      if ((!token.role || !token.userId) && email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { role: true }
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role.name as AppRoleName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role =
          token.role === "ADMIN" || token.role === "MANAGER" || token.role === "STAFF" || token.role === "VIEWER"
            ? token.role
            : "VIEWER";
      }

      return session;
    }
  }
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
