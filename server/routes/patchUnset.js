import express from "express";
const router = express.Router();
//This controller will handle all MongoDB interactions.
import controller from "../db-controller.js";
import auth from "../auth/index.js";
import rest from "../rest.js";

/**
 * @swagger
 * /api/unset:
 *   patch:
 *     summary: Remove properties (keys) from an existing object.
 *     description: |
 *       INTERNAL ENDPOINT (JWT required).
 *
 *       Removes specified keys from the object identified by _id. Keys listed in the request body will no longer exist in the resulting object. Use to strip sensitive, obsolete, or unwanted fields from records.
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
 *               removeFields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["obsolete_property", "temporary_value"]
 *             required:
 *               - _id
 *               - removeFields
 *           example:
 *             _id: "abc123456"
 *             removeFields:
 *               - obsolete_property
 *               - temporary_value
 *     responses:
 *       '200':
 *         description: The object after keys are removed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               _id: "abc123456"
 *               label: "Still present"
 *       '400':
 *         description: Bad request, missing _id or removeFields, or cannot process removal.
 *       '401':
 *         description: Unauthorized—JWT required or invalid.
 *       '404':
 *         description: Object to update not found.
 */
router
  .route("/")
  .patch(auth.checkJwt, controller.patchUnset)
  .post(auth.checkJwt, (req, res, next) => {
    if (rest.checkPatchOverrideSupport(req, res)) {
      controller.patchUnset(req, res, next);
    } else {
      res.statusMessage = "Improper request method for updating, please use PATCH to remove keys from this object.";
      res.status(405);
      next(res);
    }
  })
  .all((req, res, next) => {
    res.statusMessage = "Improper request method for updating, please use PATCH to remove keys from this object.";
    res.status(405);
    next(res);
  });

export default router;
