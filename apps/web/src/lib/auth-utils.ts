import type { RoleName } from "@autodrop/types";

/** All valid role names as a typed tuple for narrowing. */
const VALID_ROLES = ["ADMIN", "MANAGER", "STAFF", "VIEWER"] as const satisfies readonly RoleName[];

/**
 * Centralised role resolver used by both the `jwt` and `session` callbacks.
 *
 * Returns the role as-is if it is one of the known valid values, otherwise
 * falls back to `VIEWER` and logs a warning so misconfigurations are
 * observable without leaking token contents.
 *
 * @param role  - raw value from the JWT token or database record
 * @param context - optional label shown in the warning log (e.g. "jwt/db")
 */
export function resolveRole(role: unknown, context?: string): RoleName {
  if (VALID_ROLES.includes(role as RoleName)) {
    return role as RoleName;
  }

  const ctx = context ? ` (context: ${context})` : "";
  console.warn(`[auth] resolveRole: unexpected role value (type: ${typeof role})${ctx}; defaulting to VIEWER`);
  return "VIEWER";
}
