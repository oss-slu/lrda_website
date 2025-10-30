import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";
import rest from "../rest.js";

/**
 * @swagger
 * /api/set:
 *   patch:
 *     summary: Add new properties to an existing object.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Adds new key-value pairs (i.e., creates new fields) to an object, identified by _id. If the property already exists, its value is updated. This endpoint is used for gradual extension of objects without complete replacement.
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
 *                 example: "abc123456"
 *               newField:
 *                 type: string
 *                 example: "new value"
 *             required:
 *               - _id
 *           example:
 *             _id: "abc123456"
 *             favorite_color: "blue"
 *             occupation: "Librarian"
 *     responses:
 *       '200':
 *         description: The object after new keys are added or updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               favorite_color: "blue"
 *               occupation: "Librarian"
 *       '400':
 *         description: Body invalid, missing _id, or request fails schema validation.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object not found for key addition.
 */
router
  .route("/")
  .patch(auth.checkJwt, controller.patchSet)
  .post(auth.checkJwt, (req, res, next) => {
    if (rest.checkPatchOverrideSupport(req, res)) {
      controller.patchSet(req, res, next);
    } else {
      res.statusMessage = "Improper request method for updating, please use PATCH to add new keys to this object.";
      res.status(405);
      next(res);
    }
  })
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for updating, please use PATCH to add new keys to this object.";
    res.status(405);
    next(res);
  });

export default router;
