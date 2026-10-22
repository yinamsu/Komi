const { createClient } = require('@supabase/supabase-js');
const { isValidInviteCode, isSafeMapEmbedUrl, sanitizeTranslations } = require('./_lib/security');

module.exports = async (req, res) => {
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
            experience_years,
            translations,
            verifyOnly
        } = req.body || {};
        const cleanTranslations = sanitizeTranslations(translations);

        // Validate passcode against the server-side secret
        if (!process.env.PARTNER_INVITE_CODE) {
            console.error("PARTNER_INVITE_CODE is not configured. Partner registration is disabled.");
            return res.status(503).json({ success: false, error: 'Partner registration is not available right now' });
        }
        if (!isValidInviteCode(inviteCode)) {
            return res.status(401).json({ success: false, error: 'Invalid invitation code' });
        }
        if (verifyOnly) {
            return res.status(200).json({ success: true });
        }

        // Validate basic inputs
        if (!name || !location || !doctor_name) {
            return res.status(400).json({ success: false, error: 'Missing required fields (name, location, doctor_name)' });
        }
        if (!isSafeMapEmbedUrl(map_iframe)) {
            return res.status(400).json({ success: false, error: 'Map URL must be a Google Maps embed link (https://www.google.com/maps/embed?...)' });
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
                    experience_years: experience_years ? parseInt(experience_years) : 7,
                    translations: cleanTranslations
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
            translations: cleanTranslations,
            active: true
        };

        let { data, error } = await supabase
            .from('clinics')
            .insert([newClinic])
            .select();

        // Older databases may lack optional columns; drop the ones the error names and retry
        const droppedColumns = [];
        while (error && (error.code === '42703' || error.code === 'PGRST204')) {
            const missing = ['experience_years', 'translations'].find(col =>
                !droppedColumns.includes(col) && error.message && error.message.includes(col));
            if (!missing) break;
            delete newClinic[missing];
            droppedColumns.push(missing);
            ({ data, error } = await supabase.from('clinics').insert([newClinic]).select());
        }
        if (error) {
            throw error;
        }
        if (droppedColumns.length) {
            console.warn("clinics table is missing columns, saved without:", droppedColumns.join(', '));
            return res.status(200).json({
                success: true,
                message: `Clinic registered, but the database is missing: ${droppedColumns.join(', ')}. Run supabase_schema.sql step 5-1 to store them.`,
                droppedColumns,
                id: data[0].id,
                clinic: data[0]
            });
        }

        return res.status(200).json({
            success: true,
            message: "Clinic registered successfully",
            id: data[0].id,
            clinic: data[0]
        });

    } catch (err) {
        console.error("API Error registering clinic:", err);
        return res.status(500).json({ success: false, error: 'Internal Server Error. Failed to register clinic.' });
    }
};
