import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";

/**
 * @swagger
 * /api/query:
 *   post:
 *     summary: Query for objects matching given properties.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Query for objects that match any number of property-value pairs from the request body (JSON object).
 *
 *       Response is an array of all objects matching the criteria. Useful for complex/flexible search.
 *       Edge cases include invalid queries (returns 400), unauthorized access (401), or if none found (returns empty array, 200).
 *     tags:
 *       - Data Search
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Properties and values used to search. Any field in the object schema is acceptable.
 *           example:
 *             label: "Sample Object"
 *             creator: "Jane Doe"
 *     responses:
 *       '200':
 *         description: Array of objects that match the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example:
 *               - _id: "abc123"
 *                 label: "Sample Object"
 *                 creator: "Jane Doe"
 *                 description: "Returned result."
 *       '400':
 *         description: Invalid request format or unsupported query.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 */
router
  .route("/")
  .post(controller.query)
  .head(controller.queryHeadRequest)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for requesting objects with matching properties.  Please use POST.";
    res.status(405);
    next(res);
  });

export default router;
