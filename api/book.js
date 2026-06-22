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
        return res.status(455).json({ error: 'Method Not Allowed' });
    }

    try {
        const { clinicId, clientName, clientEmail, bookingDate, bookingTime, treatment } = req.body;

        // Validation
        if (!clinicId || isNaN(parseInt(clinicId))) {
            return res.status(400).json({ error: 'Valid Clinic ID is required.' });
        }
        if (!clientName || clientName.trim() === '') {
            return res.status(400).json({ error: 'Client Name is required.' });
        }
        if (!clientEmail || !/^\S+@\S+\.\S+$/.test(clientEmail)) {
            return res.status(400).json({ error: 'Valid Client Email is required.' });
        }
        if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
            return res.status(400).json({ error: 'Valid booking date (YYYY-MM-DD) is required.' });
        }
        if (!bookingTime || bookingTime.trim() === '') {
            return res.status(400).json({ error: 'Booking time slot is required.' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Fallback simulation mode
        if (!supabaseUrl || !supabaseKey) {
            console.warn("WARNING: Supabase URL or Service Key missing. Serving fallback mock booking.");
            return res.status(200).json({
                success: true,
                message: "Booking confirmed (Simulation Mode: Environment variables not configured yet).",
                bookingId: "demo-bk-" + Math.random().toString(36).substring(2, 9),
                isDemo: true
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert booking record into database
        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    clinic_id: parseInt(clinicId),
                    client_name: clientName,
                    client_email: clientEmail,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    treatment: treatment || 'Consultation Only'
                }
            ])
            .select();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Your premium safety consultation booking is successfully locked!",
            bookingId: data[0]?.id
        });

    } catch (err) {
        console.error("API error booking slot:", err);
        return res.status(500).json({ error: 'Internal Server Error. Failed to secure booking. Please try again.' });
    }
};
