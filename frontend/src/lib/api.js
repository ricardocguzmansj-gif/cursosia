import { supabase } from "./supabase";

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || "https://jcoyvyvezztoukaavnyb.supabase.co/functions/v1";

export const api = {
  // Auth (direct Supabase)
  register: async (email, password, full_name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    });
    if (error) throw error;
    return data;
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Courses (direct Supabase with RLS)
  generateCourse: async (params) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No autorizado");

    // Call Edge Function for AI generation
    const res = await fetch(EDGE_FUNCTION_URL + "/generate-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token
      },
      body: JSON.stringify(params)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Error generando curso");
    return result;
  },

  getCourses: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, topic, level, profile, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  getCourse: async (id) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  deleteCourse: async (id) => {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Curso eliminado" };
  },

  // Progress (direct Supabase with RLS)
  saveProgress: async (course_id, unit_index, lesson_index, score) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
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
    if (error) throw error;
    return data;
  },

  getProgress: async (courseId) => {
    const { data, error } = await supabase
      .from("course_progress")
      .select("*")
      .eq("course_id", courseId);
    if (error) throw error;
    return data;
  }
};
