/**
 * This module is used to define the routes of static resources available in `/public`
 * but also under `/v1` paths.
 *
 * @author cubap
 */
import express from "express";
const router = express.Router();
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// public also available at `/v1`
router.use(express.urlencoded({ extended: false }));
router.use(express.static(path.join(__dirname, "../public")));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serve the static landing (index) page for the LRDA API.
 *     description: |
 *       PUBLIC ENDPOINT.
 *
 *       Delivers the static index.html file as the landing page for API or web documentation, typically at the root of /v1/. This does not require authentication and is safe for all external/public access.
 *     tags:
 *       - Static/Public
 *     responses:
 *       '200':
 *         description: The static HTML index file for LRDA.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<!DOCTYPE html>...index content...'
 */
router.get("/", (req, res) => {
  res.sendFile("index.html");
});

// Export API routes
export default router;
