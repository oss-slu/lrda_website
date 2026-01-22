import { describe, it, expect, beforeAll } from "vitest";
import { createTestApp, request } from "./helpers";
import type { Elysia } from "elysia";

describe("Health endpoint", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  it("should return healthy status when database is connected", async () => {
    const res = await request(app, "GET", "/api/health");

    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({
      status: "healthy",
      database: "connected",
    });
    expect(res.json).toHaveProperty("timestamp");
  });
});
