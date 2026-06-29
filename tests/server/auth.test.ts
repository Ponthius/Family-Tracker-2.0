import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../../src/server/utils/hash.js";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies the correct plaintext", async () => {
    const hash = await hashPassword("secret123");
    assert.ok(hash !== "secret123", "hash should not equal plaintext");
    assert.ok(await verifyPassword("secret123", hash));
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("secret123");
    assert.ok(!(await verifyPassword("wrongpassword", hash)));
  });
});
