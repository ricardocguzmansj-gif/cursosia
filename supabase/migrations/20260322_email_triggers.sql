-- Migration: 20260322_email_triggers.sql
-- Enables pg_net and creates a trigger to send welcome emails on user sign up

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    v_email text;
    v_req_id bigint;
BEGIN
    -- Obtenemos el email directamente de la tabla segura auth.users
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
    
    IF v_email IS NOT NULL THEN
        -- pg_net encola la petición de manera asíncrona (no bloquea el registro del usuario)
        SELECT net.http_post(
            url := 'https://jcoyvyvezztoukaavnyb.supabase.co/functions/v1/send-email',
            headers := '{"Content-Type": "application/json"}',
            body := json_build_object(
                'to', v_email,
                'template', 'welcome',
                'data', json_build_object('name', NEW.full_name)
            )::jsonb
        ) INTO v_req_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_welcome_email();
