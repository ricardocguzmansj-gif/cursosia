-- MIGRATION: JOB PLACEMENT & BUSINESS RULES
-- Description: Adds skills tracking, job postings, and enrollment limits.

-- 1. SKILLS TRACKING
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('Hard', 'Soft', 'Tool')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_skills (
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.user_skills (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency INTEGER DEFAULT 0 CHECK (proficiency >= 0 AND proficiency <= 100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, skill_id)
);

-- 2. JOB POSTINGS
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT,
    required_skills JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    salary_range TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'interview', 'hired', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 3. BUSINESS RULES ENFORCEMENT
-- Add certificate payment flag
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS paid_certificate BOOLEAN DEFAULT false;

-- Function to check free enrollment eligibility
CREATE OR REPLACE FUNCTION public.can_enroll_free(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    enrollments_this_month INTEGER;
BEGIN
    SELECT COUNT(*) INTO enrollments_this_month
    FROM public.course_enrollments e
    JOIN public.courses c ON e.course_id = c.id
    WHERE e.user_id = p_user_id
      AND c.level = 'Principiante'
      AND e.source = 'free'
      AND e.enrolled_at > (NOW() - INTERVAL '1 month');
    
    RETURN enrollments_this_month < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anonymous can view skills and jobs
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view jobs" ON public.job_postings FOR SELECT USING (is_active = true);

-- Users can view their own skills
CREATE POLICY "Users can manage their skills" ON public.user_skills
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can apply for jobs
CREATE POLICY "Users can manage applications" ON public.job_applications
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
