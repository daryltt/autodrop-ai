import { decrypt, encrypt } from "@/lib/crypto";

describe("crypto utilities", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it("encrypts and decrypts round-trips", () => {
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const plaintext = "autodrop-secret";
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toEqual(plaintext);
    expect(decrypt(ciphertext)).toEqual(plaintext);
  });

  it("throws when the key is missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("value")).toThrow("ENCRYPTION_KEY environment variable is not set");
  });

  it("fails with the wrong key", () => {
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const ciphertext = encrypt("hello-world");
    process.env.ENCRYPTION_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    expect(() => decrypt(ciphertext)).toThrow();
  });
});
