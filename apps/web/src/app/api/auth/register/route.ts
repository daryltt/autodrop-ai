import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, RoleName } from "@autodrop/db";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character")
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`register:${ip}`, 10, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many registration attempts." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid registration payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (existingUser) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const role = await prisma.role.upsert({
    where: { name: RoleName.VIEWER },
    update: {},
    create: {
      name: RoleName.VIEWER,
      description: "Default viewer role"
    }
  });

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || null,
      passwordHash,
      roleId: role.id
    }
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
