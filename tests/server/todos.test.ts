import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/server/utils/errors.js";

// Unit tests for business rules that don't need a real database.
// Tests that need Prisma should use a test database — see .env.example.

describe("AppError", () => {
  it("carries a status code and message", () => {
    const err = new AppError(404, "Todo not found.");
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, "Todo not found.");
    assert.ok(err instanceof Error);
  });
});
