-- 1. Create Replay Tables
CREATE TABLE IF NOT EXISTS public.replay_seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., '2026 FIRST DRIVE'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.replay_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    season_id UUID REFERENCES public.replay_seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'ARAGO 01'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.replay_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES public.replay_classes(id) ON DELETE CASCADE,
    week_number INT NOT NULL, -- e.g., 1, 2, 3...
    title TEXT NOT NULL, -- e.g., '수특 심화독해'
    date_range TEXT NOT NULL, -- e.g., '3/16 - 3/21'
    password TEXT NOT NULL, -- folder password
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.replay_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_id UUID REFERENCES public.replay_weeks(id) ON DELETE CASCADE, -- NULL if is_sample is true
    is_sample BOOLEAN DEFAULT false,
    youtube_url TEXT NOT NULL,
    description TEXT,
    quiz_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.replay_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_videos ENABLE ROW LEVEL SECURITY;

-- Allows all operations from the frontend using the Anon key
-- (Since admin authentication is handled via app logic password)
CREATE POLICY "Allow public all on replay_seasons" ON public.replay_seasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on replay_classes" ON public.replay_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on replay_weeks" ON public.replay_weeks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on replay_videos" ON public.replay_videos FOR ALL USING (true) WITH CHECK (true);

-- 3. Initial Seed Data (Optional, for testing)
INSERT INTO public.replay_seasons (name, is_active) VALUES ('2026 FIRST DRIVE', true);
