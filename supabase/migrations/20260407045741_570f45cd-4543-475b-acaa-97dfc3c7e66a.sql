
-- Create table for storing authenticated user analysis history
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  ats_score INTEGER NOT NULL,
  keyword_match INTEGER NOT NULL DEFAULT 0,
  skills_match INTEGER NOT NULL DEFAULT 0,
  formatting_score INTEGER NOT NULL DEFAULT 0,
  readability_score INTEGER NOT NULL DEFAULT 0,
  section_completeness INTEGER NOT NULL DEFAULT 0,
  matched_skills TEXT[] NOT NULL DEFAULT '{}',
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  suggestions TEXT[] NOT NULL DEFAULT '{}',
  job_description_title TEXT NOT NULL DEFAULT 'Unknown Role',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own history
CREATE POLICY "Users can view own history"
  ON public.analysis_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own history"
  ON public.analysis_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user queries
CREATE INDEX idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON public.analysis_history(created_at DESC);
