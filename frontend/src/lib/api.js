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
  },

  getLastPosition: async (courseId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .rpc('get_last_position', { p_user_id: user.id, p_course_id: courseId });
    if (error) throw error;
    return data?.[0] || null;
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data;
  },

  getPublishedCourses: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, topic, level, profile, price, currency, language, slug, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  publishCourse: async (id, slug) => {
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: true, slug })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  unpublishCourse: async (id) => {
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: false })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  enrollInCourse: async (courseId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_enrollments")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        source: 'free'
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  isEnrolled: async (courseId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId);
    if (error) throw error;
    return data?.length > 0;
  },

  // ========== GAMIFICATION ==========
  awardXP: async (amount, reason, courseId = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: reason,
      p_course_id: courseId
    });
    if (error) throw error;
    return data;
  },

  getGamificationProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("total_xp, current_streak, longest_streak, last_study_date, badges, onboarding_completed, full_name")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data;
  },

  getBadgeDefinitions: async () => {
    const { data, error } = await supabase
      .from("badge_definitions")
      .select("*");
    if (error) throw error;
    return data;
  },

  getLeaderboard: async (limit = 10) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, total_xp, current_streak, badges")
      .order("total_xp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  setOnboardingCompleted: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);
    if (error) throw error;
  },

  // ========== REVIEWS ==========
  submitReview: async (courseId, rating, comment) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_reviews")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        rating,
        comment
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getCourseReviews: async (courseId) => {
    const { data, error } = await supabase
      .from("course_reviews")
      .select("*, profiles(full_name)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  // ========== LEARNING PATHS ==========
  getLearningPaths: async () => {
    const { data, error } = await supabase
      .from("learning_paths")
      .select("*, learning_path_courses(course_id, position, courses(id, title, level))")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  // ========== CERTIFICATES ==========
  requestCertificate: async (courseId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(EDGE_FUNCTION_URL + "/generate-certificate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token
      },
      body: JSON.stringify({ course_id: courseId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error generando certificado");
    return data;
  },

  // ========== EXPORT ==========
  exportCoursePDF: async (courseId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(EDGE_FUNCTION_URL + "/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token
      },
      body: JSON.stringify({ course_id: courseId })
    });
    if (!res.ok) throw new Error("Error exportando");
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curso.html";
    a.click();
    URL.revokeObjectURL(url);
  },
};
