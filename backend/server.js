import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import auth from "./routes/auth.js";
import courses from "./routes/courses.js";
import progress from "./routes/progress.js";
import webhook from "./routes/webhook.js";

const app = express();

// Security
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

// Routes
app.use("/api/auth", auth);
app.use("/api/courses", courses);
app.use("/api/progress", progress);
app.use("/api/webhook", webhook);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CursosIA API corriendo en puerto ${PORT}`);
});
