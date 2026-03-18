import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jcoyvyvezztoukaavnyb.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb3l2eXZlenp0b3VrYWF2bnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTA4MDYsImV4cCI6MjA4OTM2NjgwNn0.6tcczIgSaU47VbdsUfRbdZWGrASFwlyrKBiyLaNRhmM";

export const supabase = createClient(supabaseUrl, supabaseKey);
