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
