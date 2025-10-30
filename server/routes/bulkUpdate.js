#!/usr/bin/env node
import express from "express";
const router = express.Router();

//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/bulkUpdate:
 *   put:
 *     summary: Bulk-update multiple existing objects in the database.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Updates multiple objects at once. Accepts an array of objects, each with required identifying field(s) (_id or key) and the changes to be made for each. All objects must exist; failure for one (e.g., not found, validation error) prevents update.
 *     tags:
 *       - Data CRUD
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "id1abc"
 *                 label:
 *                   type: string
 *                   example: "Updated label"
 *                 [other_properties]:
 *                   type: string
 *           example:
 *             - _id: "id1abc"
 *               label: "Updated label for item 1"
 *             - _id: "id2abc"
 *               label: "Updated label for item 2"
 *     responses:
 *       '200':
 *         description: Array of updated objects after changes applied.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "id1abc"
 *                 label: "Updated label for item 1"
 *               - _id: "id2abc"
 *                 label: "Updated label for item 2"
 *       '400':
 *         description: Invalid request body/array or missing required fields.
 *       '404':
 *         description: One or more objects could not be found for update.
 *       '409':
 *         description: One or more objects violate validation/uniqueness.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 */
router
  .route("/")
  .put(auth.checkJwt, controller.bulkUpdate)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for creating, please use PUT.";
    res.status(405);
    next(res);
  });

export default router;
