
-- Interview sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL, -- technical, hr, behavioral, system_design
  job_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed
  total_score NUMERIC(4,1),
  communication_score NUMERIC(4,1),
  technical_score NUMERIC(4,1),
  confidence_score NUMERIC(4,1),
  problem_solving_score NUMERIC(4,1),
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  recommended_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Interview questions/answers table
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  score NUMERIC(3,1),
  feedback JSONB, -- { strengths, improvements, suggested_answer }
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.interview_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.interview_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own questions" ON public.interview_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can insert own questions" ON public.interview_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can update own questions" ON public.interview_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
