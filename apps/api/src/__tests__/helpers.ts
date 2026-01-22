import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { routes } from "../routes";
import { auth } from "../auth";
import type { AppEnv } from "../types";

// Create a test app instance (without listening)
export function createTestApp() {
  const app = new OpenAPIHono<AppEnv>();

  // CORS middleware
  app.use(
    "*",
    cors({
      origin: "*",
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Mount better-auth handler
  app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  });

  // Mount API routes
  app.route("/api", routes);

  return app;
}

// Helper to make requests to the test app
export async function request(
  app: OpenAPIHono<AppEnv>,
  method: string,
  path: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { body, headers = {} } = options;

  const req = new Request(`http://localhost${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const response = await app.fetch(req);
  const text = await response.text();

  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Not JSON
  }

  return {
    status: response.status,
    headers: response.headers,
    text,
    json,
  };
}
