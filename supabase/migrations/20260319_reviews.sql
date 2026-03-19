-- Añadir columnas a profiles para agregación
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating_avg float DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- Crear tabla de reseñas
CREATE TABLE IF NOT EXISTS public.job_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.job_applications(id) NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) NOT NULL,
  reviewee_id uuid REFERENCES public.profiles(id) NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, reviewer_id)
);

-- Habilitar RLS
ALTER TABLE public.job_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Anyone can read reviews"
  ON public.job_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert reviews for their applications"
  ON public.job_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = application_id
      AND (ja.user_id = auth.uid() OR jp.employer_id = auth.uid())
    )
  );

-- Función del disparador para recalcular el promedio
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM public.job_reviews WHERE reviewee_id = NEW.reviewee_id),
    rating_count = (SELECT COUNT(*) FROM public.job_reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador
DROP TRIGGER IF EXISTS on_review_insert ON public.job_reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT OR UPDATE OR DELETE ON public.job_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rating();
