import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { testConnection } from "../db";
import type { AppEnv } from "../types";

const HealthResponseSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  timestamp: z.string(),
  database: z.enum(["connected", "disconnected"]),
});

const getHealthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Health check response",
    },
  },
});

export const healthRoutes = new OpenAPIHono<AppEnv>().openapi(
  getHealthRoute,
  async (c) => {
    const dbConnected = await testConnection();

    return c.json(
      {
        status: dbConnected ? ("healthy" as const) : ("unhealthy" as const),
        timestamp: new Date().toISOString(),
        database: dbConnected
          ? ("connected" as const)
          : ("disconnected" as const),
      },
      200
    );
  }
);
