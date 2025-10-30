import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";

/**
 * @swagger
 * /id/{_id}:
 *   get:
 *     summary: Retrieve an object by its unique identifier.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Fetches a single object from the system using its unique identifier (typically _id). Returns the complete object body if found. Used for retrieving detailed views or direct access during application/data workflows. Does not require object ownership—simply valid authentication.
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
 *         description: The unique identifier of the requested object.
 *     responses:
 *       '200':
 *         description: The requested object (full detail).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               label: "Example Object"
 *               description: "The complete object data."
 *       '400':
 *         description: Invalid ID format/missing ID.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object not found for the specified ID.
 */
router
  .route("/:_id")
  .get(controller.id)
  .head(controller.idHeadRequest)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method, please use GET.";
    res.status(405);
    next(res);
  });

export default router;
