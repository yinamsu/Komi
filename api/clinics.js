const { createClient } = require('@supabase/supabase-js');

const fallbackClinics = [
    {
        id: 1,
        name: "Cheongdam Barrier Lab",
        location: "📍 Cheongdam-dong, Gangnam",
        rating: "⭐ 4.9 (120+ verified reviews)",
        description: "Specialized in non-invasive skin barrier recovery and pigmentation lasers for sensitive skin types. Known for ultra-conservative energy calibration and genuine, certified tips.",
        specialties: ["Nd:YAG Laser Calibrations", "Skin Barrier Reconstruction", "Pico Toning"],
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
        specialties: ["Vascular Laser Calibration", "Rosacea & Redness Recovery", "Ultrasonic Rejuvenation"],
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
        specialties: ["1:1 Wavelength Tuning", "Dual-Cooling Safety Protocols", "High-Fluence Pigment Management"],
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
        specialties: ["Genuine Consumables Logged", "Ultherapy & Shurink custom setups", "Epidermal Thickness Diagnostic"],
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
        specialties: ["Nd:YAG & Pico Laser Certified", "100% Physician Consultation", "Youth Acne Barrier Healing"],
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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

        // Map column names to front-end keys (matching CamelCase/snakes mapping if required, or let client read database schema values)
        // Since Supabase returns keys in snake_case (doctor_name, slots_tag, etc.),
        // let's transform the DB schema to match the javascript object property format so the front-end code remains clean!
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
        // Serve fallback on DB connection error to keep the platform resilient
        return res.status(200).json({ 
            success: true, 
            clinics: fallbackClinics, 
            errorMsg: err.message,
            isSimulationFallback: true 
        });
    }
};
