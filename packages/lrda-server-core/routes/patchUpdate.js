import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import rest from "../rest.js";
import auth from "../auth/index.js";

/**
 * @swagger
 * /v1/api/patch:
 *   patch:
 *     summary: Partially update (patch) properties of an existing object.
 *     description: |
 *       PUBLIC ENDPOINT (JWT required).
 *
 *       Updates select property-value pairs for an existing object, identified by its _id. Only those fields present in the request body will be changed; all others remain unchanged. This endpoint is used for granular updates where replacing the entire object is not desirable. Maintains version history of all changes.
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
 *                 description: The unique identifier for the object.
 *                 example: "abc123"
 *               [updated_properties]:
 *                 type: string
 *                 description: Properties to change, in any structure valid for the object.
 *           example:
 *             _id: "abc123"
 *             label: "New label for this object"
 *     responses:
 *       '200':
 *         description: The updated object after patch is applied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123"
 *               label: "New label for this object"
 *       '400':
 *         description: Invalid body, missing _id, or validation failed.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object to update not found.
 */
router
  .route("/")
  .patch(auth.checkJwt, controller.patchUpdate)
  .post(auth.checkJwt, (req, res, next) => {
    if (rest.checkPatchOverrideSupport(req, res)) {
      controller.patchUpdate(req, res, next);
    } else {
      res.statusMessage = "Improper request method for updating, please use PATCH to alter the existing keys this object.";
      res.status(405);
      next(res);
    }
  })
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for updating, please use PATCH to alter existing keys on this object.";
    res.status(405);
    next(res);
  });

export default router;
