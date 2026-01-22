import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createTestApp, request } from "./helpers";
import { db } from "../db";
import { user, account, session } from "../db/schema";
import { eq } from "drizzle-orm";

describe("Auth endpoints", () => {
  let app: ReturnType<typeof createTestApp>;
  const testEmail = `auth-test-${Date.now()}@test.com`;

  beforeAll(() => {
    app = createTestApp();
  });

  afterEach(async () => {
    // Cleanup test users
    const testUser = await db.query.user.findFirst({
      where: eq(user.email, testEmail),
    });
    if (testUser) {
      await db.delete(session).where(eq(session.userId, testUser.id));
      await db.delete(account).where(eq(account.userId, testUser.id));
      await db.delete(user).where(eq(user.id, testUser.id));
    }
  });

  describe("POST /api/auth/sign-up/email", () => {
    it("should create a new user", async () => {
      const res = await request(app, "POST", "/api/auth/sign-up/email", {
        body: {
          email: testEmail,
          password: "password123",
          name: "Test Auth User",
        },
      });

      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty("token");
      expect(res.json).toHaveProperty("user");

      const responseUser = (res.json as { user: { email: string } }).user;
      expect(responseUser.email).toBe(testEmail);
    });

    it("should reject duplicate email", async () => {
      // First signup
      await request(app, "POST", "/api/auth/sign-up/email", {
        body: {
          email: testEmail,
          password: "password123",
          name: "Test Auth User",
        },
      });

      // Second signup with same email
      const res = await request(app, "POST", "/api/auth/sign-up/email", {
        body: {
          email: testEmail,
          password: "password456",
          name: "Another User",
        },
      });

      expect(res.status).not.toBe(200);
    });
  });

  describe("POST /api/auth/sign-in/email", () => {
    it("should sign in existing user", async () => {
      // First create user
      await request(app, "POST", "/api/auth/sign-up/email", {
        body: {
          email: testEmail,
          password: "password123",
          name: "Test Auth User",
        },
      });

      // Then sign in
      const res = await request(app, "POST", "/api/auth/sign-in/email", {
        body: {
          email: testEmail,
          password: "password123",
        },
      });

      expect(res.status).toBe(200);
      expect(res.json).toHaveProperty("token");
      expect(res.json).toHaveProperty("user");
    });

    it("should reject invalid credentials", async () => {
      const res = await request(app, "POST", "/api/auth/sign-in/email", {
        body: {
          email: "nonexistent@test.com",
          password: "wrongpassword",
        },
      });

      expect(res.status).not.toBe(200);
    });
  });
});
