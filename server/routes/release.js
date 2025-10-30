#!/usr/bin/env node
import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/release/{_id}:
 *   patch:
 *     summary: Mark an object as released (lock from further changes)
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Relinquishes the editable state of an object, marking it as released. Released objects cannot be modified except in special administrative flows. Used to lock finalized versions or publish resources. If the object is already released, returns a no-op (200 for idempotency). Object is identified by its unique _id.
 *     tags:
 *       - Data Workflow
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *           example: abc123456
 *         description: The unique identifier of the object to release/lock.
 *     responses:
 *       '200':
 *         description: The object was marked as released (locked/finalized).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               released: true
 *       '400':
 *         description: Bad request. Malformed or missing _id.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object to release not found.
 */
router
  .route("/:_id")
  .patch(auth.checkJwt, controller.release)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for releasing, please use PATCH to release this object.";
    res.status(405);
    next(res);
  });

export default router;
