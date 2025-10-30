import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";

/**
 * @swagger
 * /history/{_id}:
 *   get:
 *     summary: Get all previous (ancestral) versions of a specified object.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Returns an array (chain) of all ancestors leading up to the specified version of an object. This is used for full version history and provenance tracing. Each array element represents one earlier version of the resource.
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
 *         description: The unique identifier of the versioned object.
 *     responses:
 *       '200':
 *         description: An array of ancestor versions for the given object.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "ancestor1"
 *                 label: "Original Version"
 *               - _id: "ancestor2"
 *                 label: "Subsequent Version"
 *       '400':
 *         description: Invalid or malformed _id parameter.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: No ancestry found for the given _id.
 */
router
  .route("/:_id")
  .get(controller.history)
  .head(controller.historyHeadRequest)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method, please use GET.";
    res.status(405);
    next(res);
  });

export default router;
