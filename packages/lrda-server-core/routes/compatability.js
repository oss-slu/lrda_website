#!/usr/bin/env node
import express from "express";
const router = express.Router();
import rewrite from "express-urlrewrite";
import auth from "../auth/index.js";
// This controller reroutes older style API calls.

router.use(rewrite("/:attemptedAction.action*", "/:attemptedAction$2"));
router.use(rewrite("/getByProperties*", "/query$1"));
router.use(rewrite("/batch_create*", "/bulkCreate$1"));
/**
 * @swagger
 * /v1/api/accessToken:
 *   post:
 *     summary: Request a new access token (legacy compatibility route).
 *     description: |
 *       PUBLIC ENDPOINT.
 *
 *       Exchange a refresh token for an access token using older/legacy route. Use this if migrating from v0/v1 or an older client; new code should use `/request-new-access-token` instead.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token obtained on login/registration.
 *                 example: "legacyRefreshToken..."
 *     responses:
 *       '200':
 *         description: Returns a new access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "newJWTaccessToken..."
 *       '400':
 *         description: Missing or invalid refresh token.
 *       '401':
 *         description: Unauthorized/expired/blacklisted refresh token.
 */
router.post("/accessToken", auth.generateNewAccessToken);
/**
 * @swagger
 * /v1/api/refreshToken:
 *   post:
 *     summary: Request a new refresh token (compatibility route).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: The access token.
 *     responses:
 *       200:
 *         description: Returns a new refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOi...
 */
router.post("/refreshToken", auth.generateNewRefreshToken);

export default router;
