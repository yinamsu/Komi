const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Enable CORS (for preflight and cross-origin in development)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
        const { email, fitzpatrickType } = req.body;

        // Validation
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Valid email is required.' });
        }

        const typeNum = parseInt(fitzpatrickType);
        if (isNaN(typeNum) || typeNum < 1 || typeNum > 6) {
            return res.status(400).json({ error: 'Valid skin type (1-6) is required.' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Fallback for PoC/Preview when env variables are not yet configured on Vercel
        if (!supabaseUrl || !supabaseKey) {
            console.warn("WARNING: Supabase URL or Service Key environment variables are missing.");
            return res.status(200).json({
                success: true,
                message: "Subscribed successfully (Simulation Mode: Environment variables not configured yet).",
                isDemo: true
            });
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert into the database
        const { error } = await supabase
            .from('leads')
            .insert([
                { 
                    email: email, 
                    fitzpatrick_type: typeNum,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            // Check for Postgres Unique Constraint Violation (Code '23505')
            if (error.code === '23505') {
                return res.status(409).json({ error: 'You are already registered on the waitlist!' });
            }
            throw error;
        }

        return res.status(200).json({ success: true, message: 'Successfully added to waitlist!' });

    } catch (err) {
        console.error("API error details:", err);
        return res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
};
