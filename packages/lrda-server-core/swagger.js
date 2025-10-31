import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createSwaggerSpec({ baseServerUrl = "/api/v1" } = {}) {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "LRDA API",
        version: "1.0.0",
        description: "API documentation for the LRDA Express server",
      },
      servers: [
        {
          url: baseServerUrl,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: [
      path.join(__dirname, "routes/*.js"),
      path.join(__dirname, "routes/**/*.js"),
    ],
  };

  return swaggerJSDoc(options);
}
