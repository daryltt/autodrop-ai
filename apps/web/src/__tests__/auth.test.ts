import { hashPassword, verifyPassword } from "@/lib/password";

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
