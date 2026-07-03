const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const {
            inviteCode,
            name,
            location,
            description,
            specialties,
            doctor_name,
            doctor_avatar,
            doctor_title,
            doctor_bio,
            hours,
            map_iframe,
            slots_tag,
            doctor_type,
            sleep_anesthesia,
            anesthesiologist_resident,
            foreign_attraction_registered,
            foreigner_insurance,
            excellent_aftercare,
            experience_years
        } = req.body || {};

        // Validate passcode
        if (inviteCode !== 'KOMIPARTNER2026') {
            return res.status(401).json({ success: false, error: 'Invalid invitation code' });
        }

        // Validate basic inputs
        if (!name || !location || !doctor_name) {
            return res.status(400).json({ success: false, error: 'Missing required fields (name, location, doctor_name)' });
        }

        // Default rating for newly registered clinic
        const rating = "⭐ 5.0 (New registration)";

        // Set up Supabase
        let supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl) {
            if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
            if (supabaseUrl.endsWith('/rest/v1')) supabaseUrl = supabaseUrl.slice(0, -8);
            if (supabaseUrl.endsWith('/')) supabaseUrl = supabaseUrl.slice(0, -1);
        }

        // Fallback simulation mode
        if (!supabaseUrl || !supabaseKey) {
            console.warn("WARNING: Supabase URL or Service Key missing. Simulating successful insert.");
            const simulatedId = Math.floor(Math.random() * 1000) + 1000;
            return res.status(200).json({
                success: true,
                message: "Simulation: Clinic submitted successfully",
                id: simulatedId,
                clinic: {
                    id: simulatedId,
                    name,
                    location,
                    rating,
                    description: description || "No description provided.",
                    specialties: specialties || [],
                    doctor_name,
                    doctor_avatar: doctor_avatar || doctor_name.charAt(0),
                    doctor_title: doctor_title || "Practitioner",
                    doctor_bio: doctor_bio || "",
                    hours: hours || "Not specified",
                    map_iframe: map_iframe || "",
                    slots_tag: slots_tag || "Max 2 Bookings/Hr",
                    doctor_type: doctor_type || "gp",
                    sleep_anesthesia: !!sleep_anesthesia,
                    anesthesiologist_resident: !!anesthesiologist_resident,
                    foreign_attraction_registered: !!foreign_attraction_registered,
                    foreigner_insurance: !!foreigner_insurance,
                    excellent_aftercare: !!excellent_aftercare,
                    experience_years: experience_years ? parseInt(experience_years) : 7
                }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const newClinic = {
            name,
            location,
            rating,
            description: description || "No description provided.",
            specialties: specialties || [],
            doctor_name,
            doctor_avatar: doctor_avatar || doctor_name.charAt(0),
            doctor_title: doctor_title || "Practitioner",
            doctor_bio: doctor_bio || "",
            hours: hours || "Not specified",
            map_iframe: map_iframe || "",
            slots_tag: slots_tag || "Max 2 Bookings/Hr",
            doctor_type: doctor_type || "gp",
            sleep_anesthesia: !!sleep_anesthesia,
            anesthesiologist_resident: !!anesthesiologist_resident,
            foreign_attraction_registered: !!foreign_attraction_registered,
            foreigner_insurance: !!foreigner_insurance,
            excellent_aftercare: !!excellent_aftercare,
            experience_years: experience_years ? parseInt(experience_years) : 7,
            active: true
        };

        let { data, error } = await supabase
            .from('clinics')
            .insert([newClinic])
            .select();

        if (error) {
            // Handle missing column gracefully by removing experience_years and retrying
            if (error.code === '42703' || (error.message && error.message.includes('experience_years'))) {
                delete newClinic.experience_years;
                const retry = await supabase
                    .from('clinics')
                    .insert([newClinic])
                    .select();

                if (retry.error) {
                    throw retry.error;
                }
                return res.status(200).json({
                    success: true,
                    message: "Clinic registered successfully (Note: database table does not support experience_years, fell back to default)",
                    id: retry.data[0].id,
                    clinic: retry.data[0]
                });
            }
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Clinic registered successfully",
            id: data[0].id,
            clinic: data[0]
        });

    } catch (err) {
        console.error("API Error registering clinic:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
