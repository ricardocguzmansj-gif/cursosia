import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the auth user to verify permissions
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('No Authorization header');

    const authSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await authSupabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not Authenticated');
    }

    const { application_id } = await req.json();

    if (!application_id) {
      throw new Error('Missing application_id');
    }

    // 1. Fetch application and verify the current user is the employer
    const { data: app, error: appError } = await supabaseClient
      .from('job_applications')
      .select('*, job_postings(employer_id)')
      .eq('id', application_id)
      .single();

    if (appError || !app) throw new Error('Application not found');
    
    // Authorization check
    // @ts-ignore
    if (app.job_postings.employer_id !== user.id) {
      throw new Error('Solo el reclutador (employer) puede liberar los fondos.');
    }

    if (app.status !== 'in_progress') {
      throw new Error('El proyecto no está en progreso, no se pueden liberar fondos.');
    }

    // 2. Mark application and job as completed
    await supabaseClient.from('job_applications').update({ status: 'completed' }).eq('id', application_id);
    await supabaseClient.from('job_postings').update({ status: 'completed' }).eq('id', app.job_id);

    // 3. Update Talent Wallet Balance
    const { data: talentProfile } = await supabaseClient
      .from('profiles')
      .select('wallet_balance')
      .eq('id', app.user_id)
      .single();

    const currentBalance = Number(talentProfile?.wallet_balance || 0);
    const earnings = Number(app.talent_earnings || 0);

    const newBalance = currentBalance + earnings;

    await supabaseClient
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', app.user_id);

    return new Response(
      JSON.stringify({ message: "Fondos liberados exitosamente", newBalance }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
