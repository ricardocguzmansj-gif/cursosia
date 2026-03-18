import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jcoyvyvezztoukaavnyb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Please set SUPABASE_ANON_KEY env var");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  let { data, error } = await supabase.auth.signInWithPassword({
    email: 'test_user_ai_5544@gmail.com',
    password: 'password123'
  });

  if (error) {
     const res = await supabase.auth.signUp({
      email: 'test_user_ai_5544@gmail.com',
      password: 'password123'
    });
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  const token = data.session.access_token;
  console.log("Logged in. Token retrieved.");

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-course`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tema: 'React Testing',
      nivel: 'avanzado',
      perfil: 'Developer',
      objetivo: 'Test',
      tiempo: '1 week',
      formato: 'mixto'
    })
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

test();
