import { hashPassword, verifyPassword } from "@/lib/password";
import { resolveRole } from "@/lib/auth-utils";

describe("password hashing", () => {
  it("hashes passwords with argon2id", async () => {
    const password = "Admin123!";
    const hashed = await hashPassword(password);

    expect(hashed).not.toEqual(password);
    await expect(verifyPassword(hashed, password)).resolves.toBe(true);
  });

  it("rejects invalid passwords", async () => {
    const hashed = await hashPassword("Admin123!");
    await expect(verifyPassword(hashed, "WrongPass123!")).resolves.toBe(false);
  });
});

describe("resolveRole", () => {
  it("returns ADMIN for ADMIN", () => {
    expect(resolveRole("ADMIN")).toBe("ADMIN");
  });

  it("returns MANAGER for MANAGER", () => {
    expect(resolveRole("MANAGER")).toBe("MANAGER");
  });

  it("returns STAFF for STAFF", () => {
    expect(resolveRole("STAFF")).toBe("STAFF");
  });

  it("returns VIEWER for VIEWER", () => {
    expect(resolveRole("VIEWER")).toBe("VIEWER");
  });

  it("defaults to VIEWER for unknown string", () => {
    expect(resolveRole("SUPERUSER")).toBe("VIEWER");
  });

  it("defaults to VIEWER for undefined", () => {
    expect(resolveRole(undefined)).toBe("VIEWER");
  });

  it("defaults to VIEWER for null", () => {
    expect(resolveRole(null)).toBe("VIEWER");
  });

  it("defaults to VIEWER for empty string", () => {
    expect(resolveRole("")).toBe("VIEWER");
  });
});
