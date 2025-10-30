import express from "express";
const router = express.Router();
import auth from "../auth/index.js";
import { getAgentClaim } from "../controllers/utils.js";

/**
 * @swagger
 * /register:
 *   get:
 *     summary: Register with the LRDA Auth0 authentication service.
 *     description: |
 *       PUBLIC ENDPOINT.
 *
 *       Provides a registration URL for new applications or users to obtain a refresh token/code for authentication with the API. Used in OAuth flow. Does not require a token; safe for external/public use. Returns a URL that initiates registration on LRDA Auth0.
 *     tags:
 *       - Authentication
 *     responses:
 *       '200':
 *         description: Returns the Auth0 registration URL (string).
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "https://cubap.auth0.com/authorize?...params..."
 *
 * /request-new-access-token:
 *   post:
 *     summary: Request a new access token using a valid refresh token.
 *     description: |
 *       PUBLIC ENDPOINT.
 *
 *       Exchanges a refresh token for a new access token to authorize further API calls. No authentication required to call, but valid refresh token required in request body. Fails if token is invalid/expired.
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
 *                 description: The refresh token from registration/login.
 *                 example: "eyJhbGciOi..."
 *     responses:
 *       '200':
 *         description: Returns a new access token (JWT).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOi..."
 *       '400':
 *         description: Missing or malformed refresh token.
 *       '401':
 *         description: Unauthorized/invalid/expired refresh token.
 *
 * /request-new-refresh-token:
 *   post:
 *     summary: Request a new refresh token using a valid access token.
 *     description: |
 *       PUBLIC ENDPOINT.
 *
 *       Used for extending a login session. Exchanges a (possibly soon-expiring) access token for a new long-lived refresh token. No authentication required to call, but valid access token required in body. Fails if the token is invalid or expired.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: The current access token (JWT).
 *                 example: "eyJhbGciOi..."
 *     responses:
 *       '200':
 *         description: Returns a new refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOi..."
 *       '400':
 *         description: Missing or malformed access token.
 *       '401':
 *         description: Unauthorized/invalid/expired access token.
 *
 * /verify:
 *   get:
 *     summary: Checks validity of a JWT access token (Auth0).
 *     description: |
 *       INTERNAL ENDPOINT.
 *
 *       Requires submission of a bearer token (JWT). If valid, confirms that token is issued by LRDA (Auth0) and is not revoked/expired. Used for status and testing authentication.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The token was verified successfully.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "The token was verified by Auth0"
 *       '401':
 *         description: Token missing, expired, malformed, or from an unauthorized issuer.
 */
router.get("/register", (req, res, next) => {
  //Register means register with the RERUM Server Auth0 client and get a new code for a refresh token.
  //See https://auth0.com/docs/libraries/custom-signup
  const params = new URLSearchParams({
    audience: process.env.AUDIENCE,
    scope: "offline_access",
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.RERUM_PREFIX,
    state: "register",
  }).toString();
  res.status(200).send(`https://cubap.auth0.com/authorize?${params}`);
});

/**
 * @swagger
 * /request-new-access-token:
 *   post:
 *     summary: Request a new access token using a refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token.
 *     responses:
 *       200:
 *         description: Returns a new access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOi...
 */
router.post("/request-new-access-token", auth.generateNewAccessToken);
/**
 * @swagger
 * /request-new-refresh-token:
 *   post:
 *     summary: Request a new refresh token using a valid access token.
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
router.post("/request-new-refresh-token", auth.generateNewRefreshToken);

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Verifies that a token is valid and from RERUM.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The token was verified by Auth0.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: The token was verified by Auth0
 *       401:
 *         description: Invalid or missing token.
 */
// Verifies good tokens are from RERUM.  Fails with 401 on tokens from other platforms, or bad tokens in genreal.
router.get("/verify", auth.checkJwt, (req, res, next) => {
  const generatorAgent = getAgentClaim(req, next);
  res.set("Content-Type", "text/plain");
  res.status(200);
  res.send("The token was verified by Auth0");
});

export default router;
