CREATE TABLE workspace_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
CREATE POLICY "Los usuarios pueden ver mensajes de sus proyectos" ON workspace_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = workspace_messages.application_id
        AND (ja.user_id = auth.uid() OR jp.employer_id = auth.uid())
    )
  );

CREATE POLICY "Los involucrados pueden enviar mensajes" ON workspace_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = workspace_messages.application_id
        AND (ja.user_id = auth.uid() OR jp.employer_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- Activar Supabase Realtime para notificaciones en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_messages;
