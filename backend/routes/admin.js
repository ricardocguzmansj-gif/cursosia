import express from "express";

const router = express.Router();

router.get("/stats", (req, res) => {
  res.json({
    users: 10,
    courses: 5,
    revenue: 1000
  });
});

export default router;
