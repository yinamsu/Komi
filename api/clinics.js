const { createClient } = require('@supabase/supabase-js');

const fallbackClinics = [
    {
        id: 1,
        name: "Cheongdam Barrier Lab",
        location: "📍 Cheongdam-dong, Gangnam",
        rating: "⭐ 4.9 (120+ verified reviews)",
        description: "Specialized in non-invasive skin barrier recovery and pigmentation lasers for sensitive skin types. Known for ultra-conservative energy calibration and genuine, certified tips.",
        specialties: ["Nd:YAG Laser Calibrations", "Skin Barrier Reconstruction", "Pico Toning", "Rejuran Healer", "Laser Toning", "Skin Booster", "Lifting", "Pigmentation"],
        doctor_name: "Dr. Ji-Yeon Lee",
        doctor_avatar: "JY",
        doctor_title: "Board-Certified Dermatologist | Nd:YAG Specialist",
        doctor_bio: "Dr. Lee has over 12 years of clinical dermatology experience, specializing in lasers for thin and reactive skin barriers. She is a recognized speaker on Nd:YAG customization.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 2,
        name: "Myeongdong Forest Dermatology",
        location: "📍 Myeong-dong, Jung-gu",
        rating: "⭐ 4.8 (94+ verified reviews)",
        description: "A tranquil sanctuary clinic in the heart of Myeongdong, prioritizing barrier safety over factory treatments. Enforces a strict maximum of 2 patient bookings per hour.",
        specialties: ["Vascular Laser Calibration", "Rosacea & Redness Recovery", "Ultrasonic Rejuvenation", "Laser Toning", "Acne", "Pigmentation", "Hair Removal"],
        doctor_name: "Dr. Minji Kim",
        doctor_avatar: "MK",
        doctor_title: "Board-Certified Dermatologist | Barrier Recovery",
        doctor_bio: "Dr. Kim founded Myeongdong Forest to offer custom medical treatments for international travelers who frequently experience barrier breakdown due to travel and climate changes.",
        hours: "Mon, Wed, Thu: 10:00 AM - 8:00 PM (Night Clinic) | Tue, Fri: 10:00 AM - 7:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 3,
        name: "Hannam Aesthetic & Laser House",
        location: "📍 Hannam-dong, Yongsan",
        rating: "⭐ 4.9 (78+ verified reviews)",
        description: "Boutique clinic catering to embassies and expats in Hannam. Equipped with premium dual-cooling laser systems and offering customized wavelength diagnostics.",
        specialties: ["1:1 Wavelength Tuning", "Dual-Cooling Safety Protocols", "High-Fluence Pigment Management", "Nose Filler", "Square Jaw Botox", "Filler", "Botox", "Lifting"],
        doctor_name: "Dr. Tae-Young Park",
        doctor_avatar: "TP",
        doctor_title: "Board-Certified Dermatologist | Custom Wavelengths",
        doctor_bio: "Dr. Park completed his fellowship at Seoul National University Hospital. He speaks fluent English and is dedicated to making laser treatments safe for diverse Fitzpatrick skin types.",
        hours: "Tue - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 5:00 PM | Sun, Mon: Closed",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d127.00693597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sHannam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035200000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    {
        id: 4,
        name: "Sinsa Glow Dermatology",
        location: "📍 Sinsa-dong, Gangnam",
        rating: "⭐ 4.7 (112+ verified reviews)",
        description: "Specializing in advanced anti-aging treatments with verified genuine consumables logging. We provide every patient with their single-use tip certificate and serial code.",
        specialties: ["Genuine Consumables Logged", "Ultherapy & Shurink custom setups", "Epidermal Thickness Diagnostic", "Ulthera", "Shurink", "Skin Booster", "Lifting"],
        doctor_name: "Dr. Seo-Jun Choi",
        doctor_avatar: "SC",
        doctor_title: "Board-Certified Dermatologist | Anti-Aging Specialist",
        doctor_bio: "Dr. Choi is an expert in non-surgical lifting. He developed Sinsa Glow's 'Barrier First' lifting protocol to prevent post-treatment nerve complications and excessive swelling.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: true,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: false,
        excellent_aftercare: false
    },
    {
        id: 5,
        name: "Hongdae Calm Skin Clinic",
        location: "📍 Seokyo-dong, Mapo-gu",
        rating: "⭐ 4.8 (85+ verified reviews)",
        description: "A trendy but medically rigorous clinic in Hongdae. Focuses on laser toning and vascular treatments for younger global patients with absolute physician presence.",
        specialties: ["Nd:YAG & Pico Laser Certified", "100% Physician Consultation", "Youth Acne Barrier Healing", "Laser Hair Removal", "Fraxel", "Square Jaw Botox", "Acne", "Hair Removal"],
        doctor_name: "Dr. Eun-Ji Song",
        doctor_avatar: "ES",
        doctor_title: "Board-Certified Dermatologist | Pigmentation Expert",
        doctor_bio: "Dr. Song is highly recognized for her gentle, layered laser approach. She rejects rapid 'one-size-fits-all' laser protocols, allocating 30+ minutes per patient treatment.",
        hours: "Mon, Tue, Fri: 10:00 AM - 7:00 PM | Thu: 10:00 AM - 9:00 PM (Night Clinic) | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.91929527646698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sSeogyo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035400000!5m2!1sen!2skr",
        slots_tag: "Max 4 Bookings/Hr",
        doctor_type: "gp",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    {
        id: 6,
        name: "Gangnam Eye & Youth Center",
        location: "📍 Gangnam-daero, Gangnam",
        rating: "⭐ 4.9 (142+ verified reviews)",
        description: "A premier eye-focused surgery center in Gangnam, specializing in natural double eyelids, non-incisional ptosis corrections, and delicate under-eye fat relocations.",
        specialties: ["Natural Adhesion Double Eyelid", "Non-incisional Ptosis Correction", "Under-Eye Fat Relocation", "매몰/자연유착 쌍꺼풀", "비절개 눈매교정", "눈밑지방재배치"],
        doctor_name: "Dr. Min-Seok Song",
        doctor_avatar: "MS",
        doctor_title: "Board-Certified Plastic Surgeon | Eye Specialist",
        doctor_bio: "Dr. Song is a leading eye rejuvenation specialist with 15+ years of experience, renowned for natural double eyelid and delicate fat redistribution.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.8384950669147!2d127.02752537646513!3d37.502011972054235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca15a31a54727%3A0x6b6df7d6b8b0e8c0!2sGangnam-daero%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035500000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 7,
        name: "Prestige Rhinoplasty House",
        location: "📍 Sinsa-dong, Gangnam",
        rating: "⭐ 4.8 (89+ verified reviews)",
        description: "Specialized in structural rhinoplasty and functional nose surgeries. Resolves nasal breathing issues while simultaneously optimizing nasal aesthetic contours.",
        specialties: ["Silicone Rhinoplasty", "Functional Rhinoplasty (Rhinitis/Septal Deviation)", "Alar Reduction", "기능코 성형 (비염/비중격만곡증 개선)", "콧볼 축소"],
        doctor_name: "Dr. Jae-Hee Park",
        doctor_avatar: "JP",
        doctor_title: "Board-Certified Plastic Surgeon | Rhinoplasty Specialist",
        doctor_bio: "Dr. Park completed his residency at Yonsei Severance Hospital, specializing in functional rhinoplasty that cures breathing issues while enhancing nasal aesthetics.",
        hours: "Mon - Fri: 10:30 AM - 7:30 PM | Sat: 10:00 AM - 5:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr",
        slots_tag: "Max 1 Booking/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 8,
        name: "Cheongdam Line Breast Clinic",
        location: "📍 Cheongdam-dong, Gangnam",
        rating: "⭐ 4.9 (97+ verified reviews)",
        description: "An internationally recognized boutique clinic for premium breast augmentations and lifts, focusing on natural breast kinetics and verified safe implant tip logs.",
        specialties: ["Motiva Breast Augmentation", "Autologous Fat Breast Augmentation", "모티바 가슴 확대", "자가지방 가슴 확대"],
        doctor_name: "Dr. Sang-Woo Nam",
        doctor_avatar: "SN",
        doctor_title: "Board-Certified Plastic Surgeon | Breast Specialist",
        doctor_bio: "Dr. Nam is an internationally recognized speaker on Motiva Ergonomix implants, prioritizing tissue safety and natural kinetics.",
        hours: "Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.04277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sCheongdam-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035000000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 9,
        name: "Sinsa Top Dental House",
        location: "📍 Sinsa-dong, Gangnam",
        rating: "⭐ 4.7 (104+ verified reviews)",
        description: "Specializing in aesthetic dentistry, minimum-prep laminates, and clear orthodontics. We design natural-looking smiles based on computer-guided tooth thickness models.",
        specialties: ["Laminate", "Clear Aligners", "Teeth Whitening", "라미네이트", "투명교정", "치아 미백"],
        doctor_name: "Dr. Soo-Hyun Kim",
        doctor_avatar: "SK",
        doctor_title: "Chief Dentist | Orthodontic Specialist",
        doctor_bio: "Dr. Kim focuses on ultra-thin laminate veneers and digital clear aligner planning with minimal tooth prep.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 2:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.01859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sSinsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035300000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: false,
        excellent_aftercare: true
    },
    {
        id: 10,
        name: "Kyunghee Diet Herbal Clinic",
        location: "📍 Myeong-dong, Jung-gu",
        rating: "⭐ 4.8 (115+ verified reviews)",
        description: "Provides medical herbal weight management programs and facial cosmetic acupuncture designed by certified Korean Traditional Medicine Doctors.",
        specialties: ["Herbal Diet Medicine", "Acupuncture Thread Lifting", "다이어트 한약", "매선 침", "Scalp Mesotherapy", "Diet Herbal Injection"],
        doctor_name: "Dr. Jin-Woo Lee",
        doctor_avatar: "JL",
        doctor_title: "Korean Medicine Doctor | Diet Specialist",
        doctor_bio: "Dr. Lee graduated from Kyunghee University Korean Medicine College and developed custom herbal diet formulas with high compliance and low rebound rate.",
        hours: "Mon - Fri: 09:30 AM - 6:30 PM | Sat: 09:30 AM - 1:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9805952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sMyeong-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719035100000!5m2!1sen!2skr",
        slots_tag: "Max 4 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 12,
        name: "Dongdaemun Glow Laser",
        location: "📍 Euljiro, Jung-gu",
        rating: "⭐ 4.8 (74+ verified reviews)",
        description: "Focuses on clearing pigmentation, freckles, and sun spots for diverse nationalities with custom laser settings.",
        specialties: ["Pigmentation", "Acne"],
        doctor_name: "Dr. Nam-gyu Park",
        doctor_avatar: "NP",
        doctor_title: "Board-Certified Dermatologist | Pigment Laser Specialist",
        doctor_bio: "Dr. Park completed his medical degree at Yonsei University. He has extensive experience adjusting laser wavelengths for Western and South Asian skin profiles.",
        hours: "Mon - Fri: 11:00 AM - 8:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d127.0065952764673!3d37.56152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sEuljiro%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036100000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: false,
        excellent_aftercare: false
    },
    {
        id: 13,
        name: "Suyu Relief Dermatology",
        location: "📍 Suyu-dong, Gangbuk-gu",
        rating: "⭐ 4.7 (91+ verified reviews)",
        description: "A friendly community-oriented specialist dermatology office focused on acne healing and premium laser hair removal.",
        specialties: ["Acne", "Hair Removal", "Botox"],
        doctor_name: "Dr. Bo-Min Choi",
        doctor_avatar: "BC",
        doctor_title: "Board-Certified Dermatologist | Clinical Dermatology",
        doctor_bio: "Dr. Choi focuses on safe medical treatments with zero exaggeration, dedicating ample time to explain diagnostic results.",
        hours: "Mon - Fri: 9:30 AM - 7:00 PM | Sat: 9:30 AM - 2:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3160.7766579299496!2d127.0265952764673!3d37.63152017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357cb0f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sSuyu-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036200000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    {
        id: 14,
        name: "Jamsil Aesthetic",
        location: "📍 Jamsil-dong, Songpa-gu",
        rating: "⭐ 4.8 (104+ verified reviews)",
        description: "Specialized in high-tech lifting (Ulthera, Thermage) and fat dissolving body injections. Located next to Lotte World Tower.",
        specialties: ["Lifting", "Obesity Injection"],
        doctor_name: "Dr. Jae-Hee Song",
        doctor_avatar: "JS",
        doctor_title: "Board-Certified Dermatologist | Body Sculpting",
        doctor_bio: "Dr. Song is an expert in non-invasive skin tightening and body line design, with certified safety credentials.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.09877717646549!3d37.5119169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sJamsil-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036300000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: true,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 15,
        name: "Insadong Skin Healing",
        location: "📍 Insa-dong, Jongno-gu",
        rating: "⭐ 4.8 (64+ verified reviews)",
        description: "Focused on natural skin barrier recovery and herbal-infused calming booster therapies for exhausted travelers.",
        specialties: ["Skin Booster", "Acne"],
        doctor_name: "Dr. Seo-Yeon Jung",
        doctor_avatar: "SJ",
        doctor_title: "Board-Certified Dermatologist | Natural Skin Restoration",
        doctor_bio: "Dr. Jung blends classic dermatological laser care with soothing, skin barrier-friendly moisture boosters for immediate traveler recovery.",
        hours: "Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 2:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.7766579299496!2d126.9855952764673!3d37.57452017203678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f42a59e9a9%3A0x6b6df7d6b8b0e8c0!2sInsa-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036400000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 16,
        name: "Seocho Skin Balance",
        location: "📍 Seocho-dong, Seocho-gu",
        rating: "⭐ 4.7 (96+ verified reviews)",
        description: "Customized aesthetic clinics that specialize in face balancing fillers, botox, and fat dissolving line treatments.",
        specialties: ["Obesity Injection", "Filler", "Botox"],
        doctor_name: "Dr. Dong-Hyun Shin",
        doctor_avatar: "DS",
        doctor_title: "Board-Certified Dermatologist | Aesthetic Balance",
        doctor_bio: "Dr. Shin provides careful and proportion-accurate injections to enhance features while ensuring safety first.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.5702213797686!2d127.01277717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sSeocho-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036500000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: false,
        excellent_aftercare: false
    },
    {
        id: 17,
        name: "Itaewon Global Skin Clinic",
        location: "📍 Itaewon-dong, Yongsan-gu",
        rating: "⭐ 4.8 (110+ verified reviews)",
        description: "With a fully English-speaking medical staff, this clinic is designed for international visitors seeking skin treatments, pigment laser, and hair loss solutions.",
        specialties: ["Hair Removal", "Hair Loss", "Pigmentation"],
        doctor_name: "Dr. Sarah Miller",
        doctor_avatar: "SM",
        doctor_title: "Board-Certified Dermatologist | Global Skin Specialist",
        doctor_bio: "Dr. Miller finished her medical education in the US and Korea, focusing on pigmentary responses in skin of color (Types IV-VI).",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.7854653738096!2d126.99293597646618!3d37.53429397204558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3b98d24ebf5%3A0xefdf5a3c94248a0!2sItaewon-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036600000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 18,
        name: "Mapo Clear Hair Clinic",
        location: "📍 Mapo-dong, Mapo-gu",
        rating: "⭐ 4.8 (69+ verified reviews)",
        description: "Specialized in hair-loss diagnostics, offering premium growth factor infusions and professional laser hair removal packages.",
        specialties: ["Hair Loss", "Hair Removal"],
        doctor_name: "Dr. Sung-Min Ryu",
        doctor_avatar: "SR",
        doctor_title: "Specialist | Hair Loss & Scalp Science",
        doctor_bio: "Dr. Ryu has written several papers on micro-needle therapy systems for alopecia and is a board member of the Hair Restoration Society.",
        hours: "Mon - Fri: 10:00 AM - 6:30 PM | Sat: 10:00 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.0903332467554!2d126.94295276466698!3d37.5541201720392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c98da5f87b8b5%3A0x6b6df7d6b8b0e8c0!2sMapo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036700000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "specialist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    {
        id: 19,
        name: "Yeongdeungpo Laser Center",
        location: "📍 Yeongdeungpo-dong, Yeongdeungpo-gu",
        rating: "⭐ 4.7 (76+ verified reviews)",
        description: "Equipped with advanced dual-wavelength pigment toning lasers, focusing on skin tone equalization and laser hair removal.",
        specialties: ["Pigmentation", "Hair Removal"],
        doctor_name: "Dr. Tae-Jin Yoon",
        doctor_avatar: "TY",
        doctor_title: "Board-Certified Dermatologist | Laser Specialist",
        doctor_bio: "Dr. Yoon has over 10 years of laser clinical experience, calibrating settings based on individual pigment thickness.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 2:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.5702213797686!2d126.90427717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f187a59df7d%3A0xe54ebad41a5d6f1!2sYeongdeungpo-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036800000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: false
    },
    {
        id: 20,
        name: "Gangnam V-line Clinic",
        location: "📍 Nonhyeon-dong, Gangnam",
        rating: "⭐ 4.9 (148+ verified reviews)",
        description: "Specialized in advanced facial lifting and fat dissolution to create the perfect V-line, using combination lifting therapies.",
        specialties: ["Lifting", "Botox", "Filler", "Obesity Injection"],
        doctor_name: "Dr. Young-Ho Koh",
        doctor_avatar: "YK",
        doctor_title: "Board-Certified Dermatologist | Facial Contouring",
        doctor_bio: "Dr. Koh is an expert in non-invasive lifting. He designed a proprietary protocol that guarantees maximum lift with minimal swelling.",
        hours: "Mon - Fri: 10:00 AM - 8:00 PM | Sat: 10:00 AM - 4:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.282583827618!2d127.02859527646562!3d37.518698972050546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7e00dfb39%3A0xf675dfb3c58b0e8c!2sNonhyeon-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719036900000!5m2!1sen!2skr",
        slots_tag: "Max 2 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: true,
        anesthesiologist_resident: true,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 21,
        name: "Bundang Grace Skin Lab",
        location: "📍 Jeongja-dong, Seongnam",
        rating: "⭐ 4.8 (98+ verified reviews)",
        description: "Premium aesthetic clinic focusing on custom skin boosters and facial lifting, catering to residents in southern Seoul areas.",
        specialties: ["Skin Booster", "Lifting", "Botox"],
        doctor_name: "Dr. Hye-Jin Lim",
        doctor_avatar: "HL",
        doctor_title: "Board-Certified Dermatologist | Skincare Specialist",
        doctor_bio: "Dr. Lim is famous for her detailed consultation. She customizes combination therapies of boosters and non-invasive lasers.",
        hours: "Mon - Fri: 10:00 AM - 7:00 PM | Sat: 10:00 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3167.5702213797686!2d127.10877717646549!3d37.3639169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca40f2f3d6dbf%3A0xe54ebad41a5d6f1!2sJeongja-dong%2C%20Seongnam!5e0!3m2!1sen!2skr!4v1719037000000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: true,
        foreigner_insurance: true,
        excellent_aftercare: true
    },
    {
        id: 22,
        name: "Mokdong Pure Skin Clinic",
        location: "📍 Mok-dong, Yangcheon-gu",
        rating: "⭐ 4.8 (89+ verified reviews)",
        description: "Focused on acne scars, vascular clearing, and painless laser hair removal, providing comfortable clinical environments.",
        specialties: ["Acne", "Pigmentation", "Hair Removal"],
        doctor_name: "Dr. Kyu-Hyun Hwang",
        doctor_avatar: "KH",
        doctor_title: "Board-Certified Dermatologist | Laser & Acne Therapy",
        doctor_bio: "Dr. Hwang completed his residency at Severance Hospital. He emphasizes restoring skin barriers and using safe, certified consumables.",
        hours: "Mon - Fri: 9:30 AM - 7:00 PM | Sat: 9:30 AM - 3:00 PM",
        map_iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.5702213797686!2d126.87427717646549!3d37.5239169720489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1s0x357c9f187a59df7d%3A0xe54ebad41a5d6f1!2sMok-dong%2C%20Seoul!5e0!3m2!1sen!2skr!4v1719037100000!5m2!1sen!2skr",
        slots_tag: "Max 3 Bookings/Hr",
        doctor_type: "dermatologist",
        sleep_anesthesia: false,
        anesthesiologist_resident: false,
        foreign_attraction_registered: false,
        foreigner_insurance: true,
        excellent_aftercare: true
    }
];

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(455).json({ error: 'Method Not Allowed' });
    }

    try {
        let supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl) {
            if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
            if (supabaseUrl.endsWith('/rest/v1')) supabaseUrl = supabaseUrl.slice(0, -8);
            if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
        }

        // Fallback simulation mode
        if (!supabaseUrl || !supabaseKey) {
            console.warn("WARNING: Supabase URL or Service Key missing. Serving fallback mock clinics.");
            return res.status(200).json({ success: true, clinics: fallbackClinics, isSimulation: true });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch active clinics ordered by id ascending
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true });

        if (error) {
            throw error;
        }

        const mappedClinics = data.map(item => ({
            id: item.id,
            name: item.name,
            location: item.location,
            rating: item.rating,
            description: item.description,
            specialties: item.specialties,
            doctor_name: item.doctor_name,
            doctor_avatar: item.doctor_avatar,
            doctor_title: item.doctor_title,
            doctor_bio: item.doctor_bio,
            hours: item.hours,
            map_iframe: item.map_iframe,
            slots_tag: item.slots_tag,
            doctor_type: item.doctor_type,
            sleep_anesthesia: item.sleep_anesthesia,
            anesthesiologist_resident: item.anesthesiologist_resident,
            foreign_attraction_registered: item.foreign_attraction_registered,
            foreigner_insurance: item.foreigner_insurance,
            excellent_aftercare: item.excellent_aftercare
        }));

        return res.status(200).json({ success: true, clinics: mappedClinics });

    } catch (err) {
        console.error("API error fetching clinics:", err);
        return res.status(200).json({ 
            success: true, 
            clinics: fallbackClinics, 
            errorMsg: err.message,
            isSimulationFallback: true 
        });
    }
};
