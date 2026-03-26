-- Migration: 20260322_learning_paths.sql

-- La tabla learning_paths ya existe, vamos a extenderla
ALTER TABLE public.learning_paths
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS badge_icon TEXT;

-- Añadir restricción UNIQUE al slug si no existe y si slug tiene datos (o para nuevos)
-- Usamos un DO block genérico o lo aplicamos si controlamos el entorno.
-- Si está vacía o podemos llenar, es seguro. Asumiremos que el slug debe ser unique.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_paths_slug_key') THEN
        ALTER TABLE public.learning_paths ADD CONSTRAINT learning_paths_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Tabla puente para los cursos secuenciales de una ruta
CREATE TABLE IF NOT EXISTS public.path_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    UNIQUE(path_id, course_id)
);

-- RLS Policies para learning_paths
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read paths" ON public.learning_paths;
CREATE POLICY "Public read paths" ON public.learning_paths FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Creators manage own paths" ON public.learning_paths;
CREATE POLICY "Creators manage own paths" ON public.learning_paths FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies para path_courses
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read path_courses" ON public.path_courses;
CREATE POLICY "Public read path_courses" ON public.path_courses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.learning_paths WHERE id = path_courses.path_id AND is_published = true)
);

DROP POLICY IF EXISTS "Creators manage own path_courses" ON public.path_courses;
CREATE POLICY "Creators manage own path_courses" ON public.path_courses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.learning_paths WHERE id = path_courses.path_id AND creator_id = auth.uid())
);
