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
        return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/embed');
    } catch (e) {
        return false;
    }
}

module.exports = { isValidInviteCode, isSafeMapEmbedUrl };
