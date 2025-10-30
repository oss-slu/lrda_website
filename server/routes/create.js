#!/usr/bin/env node
import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/create:
 *   post:
 *     summary: Create a new object in the database.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Creates a single JSON object and stores it in the system. If successful, returns the created object with all system-assigned properties (such as _id) included.
 *
 *       Input must be a valid JSON object representing the model. Edge cases include duplicate primary/unique keys (returns error), invalid schema, or missing required fields.
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
 *               label:
 *                 type: string
 *                 description: Label or title of the object.
 *                 example: Sample Object
 *               description:
 *                 type: string
 *                 description: Main descriptive text.
 *                 example: This object is for demonstration of the create endpoint.
 *               [other_properties]:
 *                 type: string
 *                 description: Replace with actual model schema as needed.
 *           example:
 *             label: "Sample Object"
 *             description: "Demonstration of API object creation."
 *     responses:
 *       '201':
 *         description: The newly created object with its system fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique system identifier assigned to the object.
 *                 label:
 *                   type: string
 *                 description:
 *                   type: string
 *             example:
 *               _id: "abc123456"
 *               label: "Sample Object"
 *               description: "Demonstration of API object creation."
 *       '400':
 *         description: Invalid request—JSON body malformed, missing required properties, or fails validation.
 *       '409':
 *         description: Duplicate entry—object with those properties already exists.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 */
router
  .route("/")
  .post(auth.checkJwt, controller.create)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for creating, please use POST.";
    res.status(405);
    next(res);
  });

export default router;
