const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(455).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, fitzpatrickType } = req.body;

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Valid email is required.' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(200).json({ success: true, message: "Simulation success mode active." });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('leads')
            .insert([{ email, fitzpatrick_type: parseInt(fitzpatrickType), created_at: new Date().toISOString() }]);

        if (error) {
            // OWASP 가이드라인 준수: 가입 여부 탐지 공격 차단을 위해 중복 가입이 발생하더라도 해커에게 내부 데이터 유무를 누설하지 않고 200 성공 메시지로 래핑 처리
            if (error.code === '23505') {
                return res.status(200).json({ success: true, message: 'Successfully added to waitlist!' });
            }
            throw error;
        }

        return res.status(200).json({ success: true, message: 'Successfully added to waitlist!' });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error.' });
    }
};