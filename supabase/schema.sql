-- ========================================================
-- CivicLens Supabase Database Schema (with Auth & Storage)
-- Run this script in your Supabase Project -> SQL Editor
-- ========================================================

-- 1. Create the civic_reports table with user auth references
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT,
    user_email TEXT,
    tracking_id TEXT,
    ai_provider TEXT,
    photo_url TEXT,
    photo_name TEXT,
    location_provided TEXT NOT NULL,
    detected_category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    confidence_note TEXT,
    photo_clarity TEXT NOT NULL,
    is_insufficient_evidence BOOLEAN DEFAULT false,
    visible_observations JSONB DEFAULT '[]'::jsonb,
    uncertain_details JSONB DEFAULT '[]'::jsonb,
    draft_subject TEXT,
    draft_body TEXT,
    draft_closing TEXT,
    full_draft_text TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_progress', 'resolved')),
    user_notes TEXT
);

-- If table already existed without user columns or tracking columns, add them safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'civic_reports' AND column_name = 'user_id') THEN
        ALTER TABLE public.civic_reports ADD COLUMN user_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'civic_reports' AND column_name = 'user_email') THEN
        ALTER TABLE public.civic_reports ADD COLUMN user_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'civic_reports' AND column_name = 'tracking_id') THEN
        ALTER TABLE public.civic_reports ADD COLUMN tracking_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'civic_reports' AND column_name = 'ai_provider') THEN
        ALTER TABLE public.civic_reports ADD COLUMN ai_provider TEXT;
    END IF;
END $$;

-- 2. Create the civic_users table for database-backed authentication & resident profiles
CREATE TABLE IF NOT EXISTS public.civic_users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'citizen',
    auth_provider TEXT DEFAULT 'supabase_database'
);

CREATE INDEX IF NOT EXISTS idx_civic_users_email ON public.civic_users(email);
ALTER TABLE public.civic_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view civic_users" ON public.civic_users;
CREATE POLICY "Public can view civic_users" ON public.civic_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert civic_users" ON public.civic_users;
CREATE POLICY "Public can insert civic_users" ON public.civic_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update civic_users" ON public.civic_users;
CREATE POLICY "Public can update civic_users" ON public.civic_users FOR UPDATE USING (true);

-- 3. Create indices for fast querying
CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON public.civic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_user_id ON public.civic_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON public.civic_reports(detected_category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON public.civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_tracking_id ON public.civic_reports(tracking_id);

-- 4. Enable Row Level Security (RLS) on civic_reports
ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for civic_reports
DROP POLICY IF EXISTS "Anyone can view civic reports" ON public.civic_reports;
CREATE POLICY "Anyone can view civic reports"
    ON public.civic_reports
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert civic reports" ON public.civic_reports;
CREATE POLICY "Users can insert civic reports"
    ON public.civic_reports
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update civic reports" ON public.civic_reports;
CREATE POLICY "Users can update civic reports"
    ON public.civic_reports
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can delete civic reports" ON public.civic_reports;
CREATE POLICY "Users can delete civic reports"
    ON public.civic_reports
    FOR DELETE
    USING (true);

-- 6. Storage Bucket Setup for 'civic-photos'
INSERT INTO storage.buckets (id, name, public)
VALUES ('civic-photos', 'civic-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view civic photos" ON storage.objects;
CREATE POLICY "Anyone can view civic photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'civic-photos');

DROP POLICY IF EXISTS "Authenticated and anonymous users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated and anonymous users can upload photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'civic-photos');

DROP POLICY IF EXISTS "Users can update their photos" ON storage.objects;
CREATE POLICY "Users can update their photos"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'civic-photos');

DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;
CREATE POLICY "Users can delete photos"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'civic-photos');
