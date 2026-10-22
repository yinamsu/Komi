-- ========================================================
-- KOMICARE SUPABASE SCHEMA INITIALIZATION
-- Copy and run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================================

-- 1. Create the Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    fitzpatrick_type SMALLINT NOT NULL CHECK (fitzpatrick_type >= 1 AND fitzpatrick_type <= 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) to protect user emails from public reads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow service_role key (which is used by our serverless function) full read/write access
CREATE POLICY "Allow service_role full access" 
ON public.leads 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Deny all public read access to ensure user data secrecy
CREATE POLICY "Block public read access" 
ON public.leads 
FOR SELECT 
TO public 
USING (false);

-- 4. Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- 5. Create the Clinics Table
CREATE TABLE IF NOT EXISTS public.clinics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    rating TEXT NOT NULL,
    description TEXT NOT NULL,
    specialties TEXT[] NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_avatar TEXT NOT NULL,
    doctor_title TEXT NOT NULL,
    doctor_bio TEXT NOT NULL,
    hours TEXT NOT NULL,
    map_iframe TEXT NOT NULL,
    slots_tag TEXT NOT NULL,
    doctor_type TEXT DEFAULT 'gp' NOT NULL,
    sleep_anesthesia BOOLEAN DEFAULT false NOT NULL,
    anesthesiologist_resident BOOLEAN DEFAULT false NOT NULL,
    foreign_attraction_registered BOOLEAN DEFAULT false NOT NULL,
    foreigner_insurance BOOLEAN DEFAULT false NOT NULL,
    excellent_aftercare BOOLEAN DEFAULT false NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    translations JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5-1. Owner-entered translations from the partner portal, e.g.
-- {"ja": {"name": "...", "description": "..."}, "zh": {...}, "ko": {...}}
-- Run this once on databases created before the column existed.
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 5-2. Public directory entries imported from the HIRA open API (scripts/import-hira.js).
-- source = 'partner' for clinics registered through the partner portal, 'hira' for public data.
-- Public rows have no rating, doctor profile or booking, so those columns become optional.
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'partner' NOT NULL;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS hira_ykiho TEXT UNIQUE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS homepage TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS departments TEXT[];
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS clinic_type TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS doctor_count INTEGER;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS specialist_count INTEGER;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS opened_on DATE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clinics ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN doctor_name DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN doctor_avatar DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN doctor_title DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN doctor_bio DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN hours DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN map_iframe DROP NOT NULL;
ALTER TABLE public.clinics ALTER COLUMN slots_tag DROP NOT NULL;

-- 5-3. Different clinics can share a name (e.g. five separate "갤러리아피부과의원" in Seoul).
-- Some databases were created with a UNIQUE constraint on name; drop it if present.
ALTER TABLE public.clinics DROP CONSTRAINT IF EXISTS clinics_name_key;

-- 5-4. Director names found on clinics' own homepages (scripts/enrich-doctors.js), shown as
-- "홈페이지 기준" with the source page and check date. doctor_opt_out keeps a clinic's names out
-- for good after a removal request.
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS doctor_names TEXT[];
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS doctor_source_url TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS doctor_checked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS doctor_opt_out BOOLEAN DEFAULT false NOT NULL;
NOTIFY pgrst, 'reload schema';

-- 6. Enable Row Level Security (RLS) on Clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to clinics so we can display them
CREATE POLICY "Allow public read access to clinics" 
ON public.clinics 
FOR SELECT 
TO public 
USING (true);

-- Allow service_role full access to clinics
CREATE POLICY "Allow service_role full access to clinics" 
ON public.clinics 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 7. Create the Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INTEGER REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    treatment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Enable Row Level Security (RLS) on Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access to bookings
CREATE POLICY "Allow service_role full access to bookings" 
ON public.bookings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Block public read access to bookings to protect user privacy
CREATE POLICY "Block public read access to bookings" 
ON public.bookings 
FOR SELECT 
TO public 
USING (false);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_clinic_id ON public.bookings(clinic_id);

