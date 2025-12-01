import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /v1/api/update:
 *   put:
 *     summary: Update an object by completely replacing its body (non-atomic, versioned).
 *     description: |
 *       PUBLIC ENDPOINT (JWT required).
 *
 *       Updates a single document by replacing its body with the supplied data. Object is identified by _id property. Requires all required fields for the model.
 *       This endpoint is versioned (old versions stored for history).
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
 *                 example: abc123456
 *               label:
 *                 type: string
 *                 example: Updated label
 *               description:
 *                 type: string
 *                 example: Updated description
 *             required:
 *               - _id
 *           example:
 *             _id: "abc123456"
 *             label: "Updated Object Label"
 *             description: "This replaces the previous version."
 *     responses:
 *       '200':
 *         description: The updated object after changes are saved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               label: "Updated Object Label"
 *               description: "This replaces the previous version."
 *       '400':
 *         description: Bad request, missing _id or invalid body.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object for update not found.
 */
router
  .route("/")
  .put(auth.checkJwt, controller.putUpdate)
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for updating, please use PUT to update this object.";
    res.status(405);
    next(res);
  });

export default router;
