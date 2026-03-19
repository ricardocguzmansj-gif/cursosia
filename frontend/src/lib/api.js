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
    if (!res.ok) {
      const errorMsg = result.error || "Error generando curso";
      const detailsMsg = result.details ? ` Detalles: ${JSON.stringify(result.details)}` : "";
      throw new Error(errorMsg + detailsMsg);
    }
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

  updateCourseData: async (courseId, updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autorizado");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("No autorizado");

    const { data, error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", courseId)
      .select()
      .single();
    if (error) throw error;
    return data;
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

  updateUserProfile: async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getPublicProfile: async (profileId) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, headline, bio, skills, location, portfolio_url, hourly_rate, total_xp, badges")
      .eq("id", profileId)
      .single();
    if (profileError) throw profileError;

    // Get earned certificates (where completed is true and final score >= 70 theoretically, but we use completed for now)
    const { data: certificates, error: certError } = await supabase
      .from("course_progress")
      .select("course_id, completed_at, score")
      .eq("user_id", profileId)
      .eq("completed", true);
    if (certError) throw certError;

    return { ...profile, certificates };
  },

  getPublishedCourses: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, topic, level, profile, objective, price, currency, language, slug, content, created_at,
        course_reviews (rating)
      `)
      .eq("is_published", true)
      .eq("is_approved", true)
      .eq("is_blocked", false)
      .order("topic", { ascending: true })
      .order("title", { ascending: true });
    
    if (error) throw error;

    // Process ratings
    return (data || []).map(course => {
      const ratings = course.course_reviews || [];
      const avg = ratings.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      return {
        ...course,
        avg_rating: avg,
        review_count: ratings.length
      };
    });
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

  canEnrollFree: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true; // Let them try and fail at login
    const { data, error } = await supabase.rpc('can_enroll_free', { p_user_id: user.id });
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

  enrollInCourse: async (courseId, source = 'free') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_enrollments")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        source: source
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  saveFinalScore: async (courseId, score) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_enrollments")
      .update({ final_score: score })
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCertificatePayment: async (courseId, paidStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("course_enrollments")
      .update({ paid_certificate: paidStatus })
      .eq("user_id", user.id)
      .eq("course_id", courseId)
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

  // ========== JOBS & BIDDING ==========
  createJobPosting: async (jobData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('job_postings')
      .insert({
         ...jobData,
         employer_id: user?.id,
         status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  createJobApplication: async (jobId, coverLetter, bidAmount, estimatedDays) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Debes iniciar sesión para postularte");
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        user_id: user.id,
        cover_letter: coverLetter,
        bid_amount: bidAmount ? parseFloat(bidAmount) : null,
        estimated_days: estimatedDays ? parseInt(estimatedDays) : null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') throw new Error('Ya te has postulado a esta oferta');
      throw error;
    }
    return data;
  },

  getEmployerJobs: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getJobApplicationsForEmployer: async (jobId) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, profiles(full_name, headline, hourly_rate, total_xp, rating_avg, rating_count)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  updateApplicationStatus: async (appId, status) => {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', appId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  analyzeCandidateWithAI: async (applicationId) => {
    const { data, error } = await supabase.functions.invoke('ai-matcher', {
      body: { applicationId }
    });
    if (error) {
       console.error("AI Matcher Error:", error);
       throw new Error("No se pudo analizar al candidato. Intenta más tarde.");
    }
    return data;
  },

  getDashboardData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Get Profile (XP, Streak, Badges)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Get Enrolled Courses with their progress
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("*, courses(id, title, content, level, topic), final_score")
      .eq("user_id", user.id);

    // 3. Get detailed progress counts
    const { data: progress } = await supabase
      .from("course_progress")
      .select("course_id, unit_index, lesson_index, completed, completed_at")
      .eq("user_id", user.id);

    return { profile, enrollments, progress };
  },

  // ========== PAYMENTS (MercadoPago) ==========
  createPayment: async (courseId, type) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No autorizado");

    const res = await fetch(EDGE_FUNCTION_URL + "/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token
      },
      body: JSON.stringify({ course_id: courseId, type })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Error creando pago");
    return result; // { init_point, preference_id, order_id }
  },

  getPaymentOrder: async (orderId) => {
    const { data, error } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (error) throw error;
    return data;
  },

  upgradeToAIVideo: async (courseId) => {
    // Redirects to MercadoPago for real payment
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("courses")
      .update({ is_ai_video_enabled: true })
      .eq("id", courseId)
      .eq("user_id", user.id);
    
    if (error) throw error;
    return data;
  },

  generateAIVideoScript: async (_courseId) => {
    // Placeholder — AI video generation will be a future feature
    return "Próximamente: Profesor IA con video personalizado.";
  },

  // ========== ADMIN ==========
  getUserRole: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (error) return null;
    return data?.role || 'alumno';
  },

  adminListUsers: async () => {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) throw error;
    return data;
  },

  adminSetUserRole: async (targetUserId, newRole) => {
    const { data, error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: targetUserId,
      new_role: newRole
    });
    if (error) throw error;
    return data;
  },

  adminGetStats: async () => {
    const { data, error } = await supabase.rpc('admin_platform_stats');
    if (error) throw error;
    return data;
  },

  adminListCourses: async () => {
    const { data, error } = await supabase.rpc('admin_list_courses');
    if (error) throw error;
    return data;
  },

  adminApproveCourse: async (courseId, status) => {
    const { data, error } = await supabase.rpc('admin_approve_course', {
      target_course_id: courseId,
      status: status
    });
    if (error) throw error;
    return data;
  },

  adminToggleCourseStatus: async (courseId, status) => {
    const { data, error } = await supabase.rpc('admin_toggle_course_status', {
      target_course_id: courseId,
      status: status
    });
    if (error) throw error;
    return data;
  },

  adminToggleUserStatus: async (userId, status) => {
    const { data, error } = await supabase.rpc('admin_toggle_user_status', {
      target_user_id: userId,
      status: status
    });
    if (error) throw error;
    return data;
  },

  acceptProposalEscrow: async (applicationId) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("No estás autenticado");

    const res = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ type: "escrow", application_id: applicationId })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al generar link de pago Escrow");
    }

    const { init_point } = await res.json();
    return init_point;
  },

  getWalletStats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { escrow: 0, available: 0 };
    
    // Available
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
    
    // Escrow (in_progress apps)
    const { data: apps } = await supabase
      .from('job_applications')
      .select('talent_earnings')
      .eq('user_id', user.id)
      .eq('status', 'in_progress');
      
    const escrow = apps?.reduce((sum, app) => sum + (Number(app.talent_earnings) || 0), 0) || 0;
    
    return {
      available: Number(profile?.wallet_balance) || 0,
      escrow: escrow
    };
  },

  getMyApplications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job_postings(*, employer_profiles:profiles!job_postings_employer_id_fkey(full_name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // --- WORKSPACE (FASE 5) ---
  getWorkspaceMessages: async (applicationId) => {
    const { data, error } = await supabase
      .from('workspace_messages')
      .select('*, sender:profiles!workspace_messages_sender_id_fkey(full_name)')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  sendMessage: async (applicationId, content, isDelivery = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('workspace_messages')
      .insert([
        { application_id: applicationId, sender_id: user.id, content, is_delivery: isDelivery }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  approveDelivery: async (applicationId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/release-escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ applicationId })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al liberar fondos");
    }
    return res.json();
  },

  // --- REVIEWS (FASE 6) ---
  submitReview: async (applicationId, rating, comment) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Requerimos saber quién es el Reviewee.
    const { data: app } = await supabase
      .from('job_applications')
      .select('*, job_postings(*)')
      .eq('id', applicationId)
      .single();

    if (!app) throw new Error("Postulación no encontrada");

    const isEmployer = user.id === app.job_postings.employer_id;
    const revieweeId = isEmployer ? app.user_id : app.job_postings.employer_id;

    const { data, error } = await supabase
      .from('job_reviews')
      .insert([{
        application_id: applicationId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: parseInt(rating),
        comment: comment.trim()
      }]);

    if (error) throw error;
    return data;
  },

  getReviews: async (userId) => {
    const { data, error } = await supabase
      .from('job_reviews')
      .select('*, reviewer:profiles!job_reviews_reviewer_id_fkey(full_name)')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // --- DISPUTES (FASE 7) ---
  openDispute: async (applicationId, reason) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from('job_disputes')
      .insert([{
        application_id: applicationId,
        created_by: user.id,
        reason: reason.trim(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getDisputes: async () => {
    const { data, error } = await supabase
      .from('job_disputes')
      .select('*, application:job_applications(*, profiles(full_name))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  resolveDispute: async (disputeId, resolutionNote, newStatus) => {
    const { data, error } = await supabase
      .from('job_disputes')
      .update({ status: newStatus, resolution_note: resolutionNote })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateApplicationStatus: async (applicationId, status) => {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
