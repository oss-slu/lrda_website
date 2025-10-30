#!/usr/bin/env node
import express from "express";
const router = express.Router();

//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/bulkCreate:
 *   post:
 *     summary: Bulk-create multiple new objects in the database.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Creates multiple JSON objects in one request. Accepts an array of objects. Returns all successfully created items with any system-assigned fields (such as _id) included. Atomicity is not guaranteed—all-or-none depending on database errors.
 *
 *       Edge cases include malformed array, objects failing validation (400), duplicate keys (409), or unauthorized (401).
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
 *                 label:
 *                   type: string
 *                   example: Item 1
 *                 description:
 *                   type: string
 *                   example: First batch object
 *               [other_properties]:
 *                 type: string
 *           example:
 *             - label: "Batch Object 1"
 *               description: "Desc 1"
 *             - label: "Batch Object 2"
 *               description: "Desc 2"
 *     responses:
 *       '201':
 *         description: Array of created objects with IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "id1abc"
 *                 label: "Batch Object 1"
 *                 description: "Desc 1"
 *               - _id: "id2abc"
 *                 label: "Batch Object 2"
 *                 description: "Desc 2"
 *       '400':
 *         description: Invalid request body (not an array or objects fail schema).
 *       '409':
 *         description: One or more objects violate uniqueness/deduplication rules.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 */
router
  .route("/")
  .post(auth.checkJwt, controller.bulkCreate)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for creating, please use POST.";
    res.status(405);
    next(res);
  });

export default router;
