import { NextResponse } from "next/server";
import type { RoleName } from "@autodrop/types";

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  VIEWER: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4
};

const ROLE_PERMISSIONS: Record<RoleName, readonly string[]> = {
  ADMIN: ["*:*"],
  MANAGER: [
    "dashboard:view",
    "products:*",
    "orders:*",
    "customers:*",
    "marketing:*",
    "analytics:view",
    "ai:configure",
    "settings:*"
  ],
  STAFF: [
    "dashboard:view",
    "products:view",
    "orders:*",
    "customers:view",
    "marketing:view",
    "analytics:view",
    "settings:view"
  ],
  VIEWER: [
    "dashboard:view",
    "products:view",
    "orders:view",
    "customers:view",
    "analytics:view",
    "settings:view"
  ]
};

function isRoleName(value: string): value is RoleName {
  return value in ROLE_HIERARCHY;
}

export function hasPermission(role: RoleName, resource: string, action: string): boolean {
  const grants = ROLE_PERMISSIONS[role];
  return grants.includes("*:*") || grants.includes(`${resource}:*`) || grants.includes(`${resource}:${action}`);
}

export function canAccess(userRole: string, requiredRole: string): boolean {
  if (!isRoleName(userRole) || !isRoleName(requiredRole)) {
    return false;
  }

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function requirePermission(role: RoleName | null, resource: string, action: string): NextResponse | null {
  if (!role || !hasPermission(role, resource, action)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
