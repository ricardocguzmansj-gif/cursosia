import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  console.log("Webhook recibido:", req.body);
  res.sendStatus(200);
});

export default router;
