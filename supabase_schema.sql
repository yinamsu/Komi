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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 9. Insert Initial 5 Boutique Partner Clinics
INSERT INTO public.clinics (name, location, rating, description, specialties, doctor_name, doctor_avatar, doctor_title, doctor_bio, hours, map_iframe, slots_tag, doctor_type, sleep_anesthesia, anesthesiologist_resident, foreign_attraction_registered, foreigner_insurance, excellent_aftercare)
VALUES 
(
    'Cheongdam Barrier Lab', 
    '📍 Cheongdam-dong, Gangnam', 
    '⭐ 4.9 (120+ verified reviews)', 
    'Specialized in non-invasive skin barrier recovery and pigmentation lasers for sensitive skin types. Known for ultra-conservative energy calibration and genuine, certified tips.', 
    ARRAY['Nd:YAG Laser Calibrations', 'Skin Barrier Reconstruction', 'Pico Toning', 'Rejuran Healer', 'Laser Toning'], 
    'Dr. Ji-Yeon Lee', 
    'JY', 
    'Board-Certified Dermatologist | Nd:YAG Specialist', 
    'Dr. Lee has over 12 years of clinical dermatology experience, specializing in lasers for thin and reactive skin barriers. She is a recognized speaker on Nd:YAG customization.', 
    'Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr',
    'Max 3 Bookings/Hr',
    'dermatologist',
    false,
    false,
    true,
    true,
    true
),
(
    'Myeongdong Forest Dermatology', 
    '📍 Myeong-dong, Jung-gu', 
    '⭐ 4.8 (94+ verified reviews)', 
    'A tranquil sanctuary clinic in the heart of Myeongdong, prioritizing barrier safety over factory treatments. Enforces a strict maximum of 2 patient bookings per hour.', 
    ARRAY['Vascular Laser Calibration', 'Rosacea & Redness Recovery', 'Ultrasonic Rejuvenation', 'Laser Toning'], 
    'Dr. Minji Kim', 
    'MK', 
    'Board-Certified Dermatologist | Barrier Recovery', 
    'Dr. Kim founded Myeongdong Forest to offer custom medical treatments for international travelers who frequently experience barrier breakdown due to travel and climate changes.', 
    'Mon, Wed, Thu: 10:00 AM - 8:00 PM (Night Clinic) | Tue, Fri: 10:00 AM - 7:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr',
    'Max 2 Bookings/Hr',
    'dermatologist',
    false,
    false,
    true,
    true,
    true
),
(
    'Hannam Aesthetic & Laser House', 
    '📍 Hannam-dong, Yongsan', 
    '⭐ 4.9 (78+ verified reviews)', 
    'Boutique clinic catering to embassies and expats in Hannam. Equipped with premium dual-cooling laser systems and offering customized wavelength diagnostics.', 
    ARRAY['1:1 Wavelength Tuning', 'Dual-Cooling Safety Protocols', 'High-Fluence Pigment Management', 'Nose Filler', 'Square Jaw Botox'], 
    'Dr. Tae-Young Park', 
    'TP', 
    'Board-Certified Dermatologist | Custom Wavelengths', 
    'Dr. Park completed his fellowship at Seoul National University Hospital. He speaks fluent English and is dedicated to making laser treatments safe for diverse Fitzpatrick skin types.', 
    'Tue - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 5:00 PM | Sun, Mon: Closed', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d127.00693597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sHannam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035200000!5m2!1sen!2skr',
    'Max 3 Bookings/Hr',
    'specialist',
    true,
    true,
    true,
    true,
    false
),
(
    'Sinsa Glow Dermatology', 
    '📍 Sinsa-dong, Gangnam', 
    '⭐ 4.7 (112+ verified reviews)', 
    'Specializing in advanced anti-aging treatments with verified genuine consumables logging. We provide every patient with their single-use tip certificate and serial code.', 
    ARRAY['Genuine Consumables Logged', 'Ultherapy & Shurink custom setups', 'Epidermal Thickness Diagnostic', 'Ulthera', 'Shurink'], 
    'Dr. Seo-Jun Choi', 
    'SC', 
    'Board-Certified Dermatologist | Anti-Aging Specialist', 
    'Dr. Choi is an expert in non-surgical lifting. He developed Sinsa Glow''s ''Barrier First'' lifting protocol to prevent post-treatment nerve complications and excessive swelling.', 
    'Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr',
    'Max 2 Bookings/Hr',
    'dermatologist',
    true,
    false,
    true,
    false,
    false
),
(
    'Hongdae Calm Skin Clinic', 
    '📍 Seokyo-dong, Mapo-gu', 
    '⭐ 4.8 (85+ verified reviews)', 
    'A trendy but medically rigorous clinic in Hongdae. Focuses on laser toning and vascular treatments for younger global patients with absolute physician presence.', 
    ARRAY['Nd:YAG & Pico Laser Certified', '100% Physician Consultation', 'Youth Acne Barrier Healing', 'Laser Hair Removal', 'Fraxel', 'Square Jaw Botox'], 
    'Dr. Eun-Ji Song', 
    'ES', 
    'Board-Certified Dermatologist | Pigmentation Expert', 
    'Dr. Song is highly recognized for her gentle, layered laser approach. She rejects rapid ''one-size-fits-all'' laser protocols, allocating 30+ minutes per patient treatment.', 
    'Mon, Tue, Fri: 10:00 AM - 7:00 PM | Thu: 10:00 AM - 9:00 PM (Night Clinic) | Sat: 10:00 AM - 4:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.91929527646698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sSeogyo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035400000!5m2!1sen!2skr',
    'Max 4 Bookings/Hr',
    'gp',
    false,
    false,
    false,
    true,
    false
),
(
    'Gangnam Eye & Youth Center', 
    '📍 Gangnam-daero, Gangnam', 
    '⭐ 4.9 (142+ verified reviews)', 
    'A premier eye-focused surgery center in Gangnam, specializing in natural double eyelids, non-incisional ptosis corrections, and delicate under-eye fat relocations.', 
    ARRAY['Natural Adhesion Double Eyelid', 'Non-incisional Ptosis Correction', 'Under-Eye Fat Relocation', '매몰/자연유착 쌍꺼풀', '비절개 눈매교정', '눈밑지방재배치'], 
    'Dr. Min-Seok Song', 
    'MS', 
    'Board-Certified Plastic Surgeon | Eye Specialist', 
    'Dr. Song is a leading eye rejuvenation specialist with 15+ years of experience, renowned for natural double eyelid and delicate fat redistribution.', 
    'Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.8384950669147!2d127.02752537646513!3d37.502011972054235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca15a31a54727%3A0x6b6df7d6b8b0e8c0!2sGangnam-daero%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035500000!5m2!1sen!2skr',
    'Max 2 Bookings/Hr',
    'specialist',
    true,
    true,
    true,
    true,
    true
),
(
    'Prestige Rhinoplasty House', 
    '📍 Sinsa-dong, Gangnam', 
    '⭐ 4.8 (89+ verified reviews)', 
    'Specialized in structural rhinoplasty and functional nose surgeries. Resolves nasal breathing issues while simultaneously optimizing nasal aesthetic contours.', 
    ARRAY['Silicone Rhinoplasty', 'Functional Rhinoplasty (Rhinitis/Septal Deviation)', 'Alar Reduction', '기능코 성형 (비염/비중격만곡증 개선)', '콧볼 축소'], 
    'Dr. Jae-Hee Park', 
    'JP', 
    'Board-Certified Plastic Surgeon | Rhinoplasty Specialist', 
    'Dr. Park completed his residency at Yonsei Severance Hospital, specializing in functional rhinoplasty that cures breathing issues while enhancing nasal aesthetics.', 
    'Mon - Fri: 10:30 AM - 7:30 PM | Sat: 10:00 AM - 5:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr',
    'Max 1 Booking/Hr',
    'specialist',
    true,
    true,
    true,
    true,
    true
),
(
    'Cheongdam Line Breast Clinic', 
    '📍 Cheongdam-dong, Gangnam', 
    '⭐ 4.9 (97+ verified reviews)', 
    'An internationally recognized boutique clinic for premium breast augmentations and lifts, focusing on natural breast kinetics and verified safe implant tip logs.', 
    ARRAY['Motiva Breast Augmentation', 'Autologous Fat Breast Augmentation', '모티바 가슴 확대', '자가지방 가슴 확대'], 
    'Dr. Sang-Woo Nam', 
    'SN', 
    'Board-Certified Plastic Surgeon | Breast Specialist', 
    'Dr. Nam is an internationally recognized speaker on Motiva Ergonomix implants, prioritizing tissue safety and natural kinetics.', 
    'Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 3:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr',
    'Max 2 Bookings/Hr',
    'specialist',
    true,
    true,
    true,
    true,
    true
),
(
    'Sinsa Top Dental House', 
    '📍 Sinsa-dong, Gangnam', 
    '⭐ 4.7 (104+ verified reviews)', 
    'Specializing in aesthetic dentistry, minimum-prep laminates, and clear orthodontics. We design natural-looking smiles based on computer-guided tooth thickness models.', 
    ARRAY['Laminate', 'Clear Aligners', 'Teeth Whitening', '라미네이트', '투명교정', '치아 미백'], 
    'Dr. Soo-Hyun Kim', 
    'SK', 
    'Chief Dentist | Orthodontic Specialist', 
    'Dr. Kim focuses on ultra-thin laminate veneers and digital clear aligner planning with minimal tooth prep.', 
    'Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 2:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr',
    'Max 3 Bookings/Hr',
    'specialist',
    false,
    false,
    true,
    false,
    true
),
(
    'Kyunghee Diet Herbal Clinic', 
    '📍 Myeong-dong, Jung-gu', 
    '⭐ 4.8 (115+ verified reviews)', 
    'Provides medical herbal weight management programs and facial cosmetic acupuncture designed by certified Korean Traditional Medicine Doctors.', 
    ARRAY['Herbal Diet Medicine', 'Acupuncture Thread Lifting', '다이어트 한약', '매선 침', 'Scalp Mesotherapy', 'Diet Herbal Injection'], 
    'Dr. Jin-Woo Lee', 
    'JL', 
    'Korean Medicine Doctor | Diet Specialist', 
    'Dr. Lee graduated from Kyunghee University Korean Medicine College and developed custom herbal diet formulas with high compliance and low rebound rate.', 
    'Mon - Fri: 09:30 AM - 6:30 PM | Sat: 09:30 AM - 1:00 PM', 
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr',
    'Max 4 Bookings/Hr',
    'specialist',
    false,
    false,
    true,
    true,
    true
)
ON CONFLICT DO NOTHING;

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_clinic_id ON public.bookings(clinic_id);

