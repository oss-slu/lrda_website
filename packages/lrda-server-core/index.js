import express from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createSwaggerSpec } from "./swagger.js";
import { apiReference } from "@scalar/express-api-reference";
import { setConfig, getConfig } from "./config.js";
import { connected as dbConnected } from "./database/index.js";
import rest from "./rest.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createCoreRouter(options = {}) {
  const {
    // DB
    mongoUri = undefined,
    mongodbName = undefined,
    mongodbCollection = undefined,
    connectOnStart = true,
    // RERUM configuration
    rerum = {
      RERUM_API_VERSION: undefined,
      RERUM_BASE: undefined,
      RERUM_PREFIX: undefined,
      RERUM_ID_PREFIX: undefined,
      RERUM_AGENT_CLAIM: undefined,
      RERUM_CONTEXT: undefined,
      RERUM_API_DOC: undefined,
    },

    // HTTP concerns (placeholders for future use)
    // cors = undefined,
    // morgan = undefined,
    // trustProxy = undefined,
    // Static/OpenAPI/Scalar
    scalar = {},
    basePath = undefined,
    // Auth config passthrough
    auth = { disableAuth: false, authMiddleware: null, enableClientRoutes: true },
  } = options;

  const {
    enabled: scalarEnabled = true,
    mountPath: scalarMountPath = "/reference",
    openapiMountPath: openapiMountPath = "/openapi.json",
    baseServerUrl: baseServerUrl = "/api/v1",
  } = scalar || {};

  // Store config for internal modules
  setConfig({ mongoUri, mongodbName, mongodbCollection, baseServerUrl, auth, rerum });

  const router = express.Router();

  const swaggerSpec = createSwaggerSpec({ baseServerUrl });

  router.get(openapiMountPath, (req, res) => {
    res.json(swaggerSpec);
  });

  if (scalarEnabled) {
    router.use(
      scalarMountPath,
      apiReference(
        // Mount Scalar API Reference UI at /reference
        router.use(
          "/reference",
          apiReference({
            theme: "elysiajs",
            title: "API #1",
            slug: "api-1",
            hideClientButton: true,
            showSidebar: true,
            showToolbar: "localhost",
            operationTitleSource: "summary",
            _integration: "express",
            persistAuth: false,
            telemetry: true,
            layout: "modern",
            isEditable: false,
            isLoading: false,
            hideModels: false,
            documentDownloadType: "both",
            hideTestRequestButton: false,
            hideSearch: false,
            showOperationId: false,
            hideDarkModeToggle: false,
            withDefaultFonts: true,
            defaultOpenAllTags: false,
            expandAllModelSections: false,
            expandAllResponses: false,
            orderSchemaPropertiesBy: "alpha",
            orderRequiredPropertiesFirst: true,
            url: "/openapi.json",
          })
        )
      )
    );
  }

  router.use(
    cors({
      methods: "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST",
      allowedHeaders: [
        "Content-Type",
        "Content-Length",
        "Allow",
        "Authorization",
        "Location",
        "ETag",
        "Connection",
        "Keep-Alive",
        "Date",
        "Cache-Control",
        "Last-Modified",
        "Link",
        "X-HTTP-Method-Override",
        "Origin",
        "Referrer",
        "User-Agent",
      ],
      exposedHeaders: "*",
      origin: "*",
      maxAge: "600",
    })
  );
  router.use(morgan("dev"));
  router.use(cookieParser());

  // Publicly available scripts, CSS, and HTML pages.
  router.use(express.static(path.join(__dirname, "public")));

  router.use("/", (await import("./routes/index.js")).default);

  // Dynamically import routes after config is set
  const apiRoutesFactory = (await import("./routes/api-routes.js")).default;
  const apiRoutes = apiRoutesFactory({ ...auth });
  router.use("/v1", apiRoutes);

  router.use("/client", (await import("./routes/client.js")).default);

  router.use("/gog/fragmentsInManuscript", (await import("./routes/_gog_fragments_from_manuscript.js")).default);
  router.use("/gog/glossesInManuscript", (await import("./routes/_gog_glosses_from_manuscript.js")).default);

  /**
   * Handle API errors and warnings RESTfully.  All routes that don't end in res.send() will end up here.
   * Important to note that res.json() will fail to here
   * Important to note api-routes.js handles all the 405s without failing to here - they res.send()
   * Important to note that failures in the controller from the mongo client will fail to here
   *
   * */
  router.use(rest.messenger);

  // catch 404 because of an invalid site path
  router.use((req, res, next) => {
    res.status(404).json({ error: res.statusMessage || "This page does not exist" });
  });

  if (connectOnStart && mongoUri) {
    try {
      await dbConnected();
    } catch (e) {
      console.error("Database connection failed on server start:", e);
    }
  }

  return router;
}
