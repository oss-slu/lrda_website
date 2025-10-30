import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /api/delete:
 *   delete:
 *     summary: Delete an object (soft delete via match on request body).
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Soft-deletes a single object (marks as deleted) based on supplied object body. Use only when the object's identifying information (keys/fields) are known and unique. Typical edge cases: object does not exist (404), not unique enough (409), or malformed request (400). Returns the deleted object if successful.
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
 *             description: A unique set of identifying fields for the object to delete.
 *           example:
 *             _id: "abc123456"
 *     responses:
 *       '200':
 *         description: The deleted object after marking as deleted in the system.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               status: "deleted"
 *       '400':
 *         description: Malformed JSON, missing identifying properties, or fails validation.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object not found with those properties.
 *       '409':
 *         description: Duplicate/multiple objects match identifying fields (deletion not unique).
 *
 * /api/delete/{_id}:
 *   delete:
 *     summary: Delete an object by its unique ID (soft delete).
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Soft-deletes (marks as deleted) the object with the specified unique ID. Fails if object does not exist or user unauthorized.
 *     tags:
 *       - Data CRUD
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *           example: abc123456
 *         description: Unique identifier for the object.
 *     responses:
 *       '200':
 *         description: The deleted object (with system fields).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               status: "deleted"
 *       '400':
 *         description: Invalid _id format or missing _id.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: No object found with the specified _id.
 */
router
  .route("/")
  .delete(auth.checkJwt, controller.deleteObj)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for deleting, please use DELETE.";
    res.status(405);
    next(res);
  });

/**
 * @swagger
 * /api/delete/{_id}:
 *   delete:
 *     summary: Delete an object by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The object ID.
 *     responses:
 *       200:
 *         description: The deleted object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router
  .route("/:_id")
  .delete(auth.checkJwt, controller.deleteObj)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for deleting, please use DELETE.";
    res.status(405);
    next(res);
  });

export default router;
