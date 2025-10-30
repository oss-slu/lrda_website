import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";

/**
 * @swagger
 * /since/{_id}:
 *   get:
 *     summary: Get all version descendants (children) of a given object version.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Returns an array of all subsequent versions or children (descendants) of the provided object _id. Used to track ongoing changes and data provenance.
 *     tags:
 *       - Data Versioning
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *           example: abc123456
 *         description: The unique ID of the versioned object.
 *     responses:
 *       '200':
 *         description: An array of descendants for the given version.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "def789"
 *                 label: "Descendant Version"
 *                 parent: "abc123456"
 *       '400':
 *         description: Invalid or malformed _id parameter.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: No descendants found for the given _id.
 */
router
  .route("/:_id")
  .get(controller.since)
  .head(controller.sinceHeadRequest)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method, please use GET.";
    res.status(405);
    next(res);
  });

export default router;
