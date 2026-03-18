import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido" });

  req.user = user;
  next();
};

// Save progress for a lesson
router.post("/", requireAuth, async (req, res) => {
  try {
    const { course_id, unit_index, lesson_index, score } = req.body;

    const { data, error } = await supabase
      .from("course_progress")
      .upsert({
        user_id: req.user.id,
        course_id,
        unit_index,
        lesson_index,
        completed: true,
        score: score || null,
        completed_at: new Date().toISOString()
      }, {
        onConflict: "user_id,course_id,unit_index,lesson_index"
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error guardando progreso" });
  }
});

// Get progress for a course
router.get("/:courseId", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course_progress")
      .select("*")
      .eq("course_id", req.params.courseId)
      .eq("user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo progreso" });
  }
});

export default router;
