import { canAccess, hasPermission, ROLE_HIERARCHY } from "@/lib/rbac";

describe("rbac helpers", () => {
  it("respects role hierarchy", () => {
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.MANAGER);
    expect(canAccess("MANAGER", "STAFF")).toBe(true);
    expect(canAccess("VIEWER", "ADMIN")).toBe(false);
  });

  it("checks permissions correctly", () => {
    expect(hasPermission("ADMIN", "products", "delete")).toBe(true);
    expect(hasPermission("MANAGER", "products", "manage")).toBe(true);
    expect(hasPermission("STAFF", "products", "manage")).toBe(false);
    expect(hasPermission("VIEWER", "orders", "view")).toBe(true);
  });
});
