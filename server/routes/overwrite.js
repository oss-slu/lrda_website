#!/usr/bin/env node
import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/overwrite:
 *   put:
 *     summary: Fully overwrite an existing object with a new body.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Performs a complete replacement of an object's contents. Input must provide the exact identifying property (such as _id) and the full new body (all fields required by schema). All old values will be replaced; missing fields will be removed.
 *
 *       Edge cases: not found (404), validation failure (400), missing required fields (400), unauthorized (401).
 *     tags:
 *       - Data CRUD
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 description: Unique document identifier.
 *                 example: "abc123456"
 *               label:
 *                 type: string
 *                 example: "New Label"
 *               description:
 *                 type: string
 *                 example: "Overwrite new body."
 *             required:
 *               - _id
 *           example:
 *             _id: "abc123456"
 *             label: "Overwritten Object"
 *             description: "This is the complete new object body."
 *     responses:
 *       '200':
 *         description: The overwritten object body, after replacement.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               label: "Overwritten Object"
 *               description: "This is the complete new object body."
 *       '400':
 *         description: Invalid/missing fields or failing schema validation.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object with _id not found for overwrite.
 */
router
  .route("/")
  .put(auth.checkJwt, controller.overwrite)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for overwriting, please use PUT to overwrite this object.";
    res.status(405);
    next(res);
  });

export default router;
