// Shared server-side security helpers (files under api/_lib are not exposed as routes by Vercel)
const crypto = require('crypto');

// Constant-time comparison so the invite code cannot be guessed via response timing
function isValidInviteCode(input) {
    const expected = process.env.PARTNER_INVITE_CODE;
    if (!expected || typeof input !== 'string') return false;
    const a = crypto.createHash('sha256').update(input).digest();
    const b = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

// Only Google Maps embed URLs may be stored and rendered as iframe src
function isSafeMapEmbedUrl(value) {
    if (!value) return true;
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.hostname !== 'www.google.com') return false;
        return url.pathname.startsWith('/maps/embed') || (url.pathname === '/maps' && url.searchParams.get('output') === 'embed');
    } catch (e) {
        return false;
    }
}

// Partner-entered translations: only known languages/fields, trimmed strings with length caps
const TRANSLATION_LANGS = ['ko', 'ja', 'zh'];
const TRANSLATION_FIELDS = {
    name: 120, location: 120, doctor_name: 80, doctor_title: 160,
    hours: 200, description: 2000, doctor_bio: 2000
};

function sanitizeTranslations(input) {
    const out = {};
    if (!input || typeof input !== 'object') return out;
    for (const lang of TRANSLATION_LANGS) {
        const src = input[lang];
        if (!src || typeof src !== 'object') continue;
        const fields = {};
        for (const [field, max] of Object.entries(TRANSLATION_FIELDS)) {
            if (typeof src[field] !== 'string') continue;
            const value = src[field].trim().slice(0, max);
            if (value) fields[field] = value;
        }
        if (Object.keys(fields).length) out[lang] = fields;
    }
    return out;
}

module.exports = { isValidInviteCode, isSafeMapEmbedUrl, sanitizeTranslations };
