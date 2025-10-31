import express from "express";
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Home page for the API.
 *     responses:
 *       200:
 *         description: Returns the public index.html file.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: "public" });
});

export default router;
