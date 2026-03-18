import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { course_id } = await req.json();
    if (!course_id) {
      return new Response(JSON.stringify({ error: "course_id requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ certificate: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get course data
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .eq("id", course_id)
      .single();
    if (courseErr || !course) {
      return new Response(JSON.stringify({ error: "Curso no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get progress
    const { data: progress } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .eq("completed", true);

    const completedLessons = progress?.length || 0;
    const totalLessons = course.content?.curso?.unidades?.reduce(
      (acc: number, u: any) => acc + (u.lecciones?.length || 0), 0
    ) || 0;

    if (totalLessons === 0 || completedLessons < totalLessons) {
      return new Response(JSON.stringify({
        error: "Curso no completado",
        completed: completedLessons,
        total: totalLessons
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate average score
    const scores = progress?.filter((p: any) => p.score != null).map((p: any) => p.score) || [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 100;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Create certificate
    const { data: cert, error: certErr } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        course_id,
        score: avgScore,
      })
      .select()
      .single();

    if (certErr) {
      return new Response(JSON.stringify({ error: "Error creando certificado", detail: certErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track event
    await supabase.from("events").insert({
      user_id: user.id,
      event_type: "certificate_issued",
      course_id,
      metadata: { score: avgScore, verification_code: cert.verification_code },
    });

    return new Response(JSON.stringify({
      certificate: cert,
      student_name: profile?.full_name || user.email,
      course_title: course.content?.curso?.titulo || course.title,
      score: avgScore,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
