const { createClient } = require('@supabase/supabase-js');
const { isSafeMapEmbedUrl } = require('./_lib/security');

// Google Maps embed for public entries, built from HIRA coordinates (no API key needed)
function coordinateMapUrl(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

function mapPublicClinic(item) {
    return {
        id: item.id,
        source: 'hira',
        name: item.name,
        location: item.location,
        address: item.address,
        phone: item.phone,
        homepage: item.homepage,
        departments: item.departments || [],
        specialties: item.specialties || item.departments || [],
        clinic_type: item.clinic_type,
        doctor_count: item.doctor_count,
        specialist_count: item.specialist_count,
        map_iframe: coordinateMapUrl(item.latitude, item.longitude),
        synced_at: item.synced_at,
        translations: item.translations || {}
    };
}

function mapPartnerClinic(item) {
    return {
        id: item.id,
        source: 'partner',
        name: item.name,
        location: item.location,
        rating: item.rating,
        description: item.description,
        specialties: item.specialties || [],
        doctor_name: item.doctor_name,
        doctor_avatar: item.doctor_avatar,
        doctor_title: item.doctor_title,
        doctor_bio: item.doctor_bio,
        hours: item.hours,
        map_iframe: isSafeMapEmbedUrl(item.map_iframe) ? item.map_iframe : '',
        slots_tag: item.slots_tag,
        doctor_type: item.doctor_type,
        sleep_anesthesia: item.sleep_anesthesia,
        anesthesiologist_resident: item.anesthesiologist_resident,
        foreign_attraction_registered: item.foreign_attraction_registered,
        foreigner_insurance: item.foreigner_insurance,
        excellent_aftercare: item.excellent_aftercare,
        experience_years: item.experience_years,
        translations: item.translations || {}
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
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
            // No sample clinics: the directory only ever shows real partners or public-data entries
            console.warn("WARNING: Supabase URL or Service Key missing. Returning an empty clinic list.");
            return res.status(200).json({ success: true, clinics: [], isSimulation: true });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Supabase returns at most 1,000 rows per request, so page through all active clinics
        const data = [];
        for (let from = 0; ; from += 1000) {
            const { data: page, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('active', true)
                .order('id', { ascending: true })
                .range(from, from + 999);
            if (error) throw error;
            data.push(...page);
            if (page.length < 1000) break;
        }

        // Partner clinics first, then unverified public directory entries
        const partners = data.filter(item => (item.source || 'partner') !== 'hira').map(mapPartnerClinic);
        const publicEntries = data.filter(item => item.source === 'hira').map(mapPublicClinic);
        return res.status(200).json({ success: true, clinics: [...partners, ...publicEntries] });

    } catch (err) {
        console.error("API error fetching clinics:", err);
        return res.status(500).json({ success: false, error: 'Failed to load clinics.' });
    }
};
