import express from "express";
import { createCoreRouter } from "lrda-server-core";
import { firebaseAuthMiddleware } from "./auth.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const coreApiRouter = await createCoreRouter({
  auth: { disableAuth: process.env.DISABLE_AUTH === "true", authMiddleware: firebaseAuthMiddleware, enableClientRoutes: false },
  scalar: {
    baseServerUrl: "/",
    mountPath: "/reference",
    openapiMountPath: "/openapi.json",
  },
  // RERUM configuration
  rerum: {
    RERUM_API_VERSION: process.env.RERUM_API_VERSION,
    RERUM_BASE: process.env.RERUM_BASE,
    RERUM_PREFIX: process.env.RERUM_PREFIX,
    RERUM_ID_PREFIX: process.env.RERUM_ID_PREFIX,
    RERUM_AGENT_CLAIM: process.env.RERUM_AGENT_CLAIM,
    RERUM_CONTEXT: process.env.RERUM_CONTEXT,
    RERUM_API_DOC: process.env.RERUM_API_DOC,
  },

  // MongoDB configuration
  mongoUri: process.env.MONGO_CONNECTION_STRING,
  mongodbName: process.env.MONGO_DB,
  mongodbCollection: process.env.MONGO_COLLECTION,
  connectOnStart: process.env.DOWN === "false",
  trustProxy: process.env.TRUST_PROXY === "true",
});

// Mount core RERUM API
app.use("/", coreApiRouter);


// Add your custom LRDA/project-specific endpoints BELOW this line
// Example:
// import myPrivateRouter from './my-private-routes.js';
// app.use('/custom', myPrivateRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LRDA-ready app server running on port ${PORT}`);
});
