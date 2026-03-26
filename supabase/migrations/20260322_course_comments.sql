-- Migration: 20260322_course_comments.sql

CREATE TABLE IF NOT EXISTS public.course_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    unit_index INTEGER NOT NULL,
    lesson_index INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_ai_response BOOLEAN DEFAULT false,
    ai_prompt_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer los comentarios de un curso público
-- Para simplificar, permitimos lectura pública asumiendo que el curso es visible.
CREATE POLICY "Public read comments" ON public.course_comments FOR SELECT USING (true);

-- Usuarios autenticados pueden crear comentarios
CREATE POLICY "Users can create comments" ON public.course_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden borrar o editar sus propios comentarios
CREATE POLICY "Users can update own comments" ON public.course_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.course_comments FOR DELETE USING (auth.uid() = user_id);

-- Crear un índice para optimizar la búsqueda por lección
CREATE INDEX IF NOT EXISTS idx_course_comments_lesson ON public.course_comments(course_id, unit_index, lesson_index);
