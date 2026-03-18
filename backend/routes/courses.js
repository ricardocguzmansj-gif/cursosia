import express from "express";
import { supabase } from "../lib/supabase.js";
import { generateCourse } from "../services/ai.js";

const router = express.Router();

// Middleware: verify auth token
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido" });

  req.user = user;
  next();
};

// Generate a new course via AI
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { tema, nivel, perfil, objetivo, duracion, tiempo } = req.body;

    if (!tema || !nivel || !perfil) {
      return res.status(400).json({ error: "Tema, nivel y perfil son requeridos" });
    }

    // Generate course with AI
    const courseData = await generateCourse({ tema, nivel, perfil, objetivo, duracion, tiempo });

    // Save to database
    const { data, error } = await supabase
      .from("courses")
      .insert({
        user_id: req.user.id,
        title: courseData.curso.titulo,
        topic: tema,
        level: nivel,
        profile: perfil,
        objective: objetivo || "",
        duration: duracion || "",
        daily_time: tiempo || "",
        content: courseData
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return res.status(500).json({ error: "Error guardando el curso" });
    }

    res.json(data);
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: err.message || "Error generando el curso" });
  }
});

// List my courses
router.get("/", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, topic, level, profile, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error listando cursos" });
  }
});

// Get a single course
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Curso no encontrado" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo el curso" });
  }
});

// Delete a course
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Curso eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando el curso" });
  }
});

export default router;
