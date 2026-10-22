// Finds a clinic director's name on the clinic's own public homepage.
// Reads the homepage plus up to 3 linked "doctor / director / about" pages, respects robots.txt,
// and only accepts names written next to a director title ("대표원장 홍길동", "홍길동 원장").

const UA = 'KomicareBot/1.0 (+clinic directory; contact via site)';
const TIMEOUT_MS = 10000;
const MAX_SUBPAGES = 4;

// Common Korean surnames (covers the vast majority of the population)
const SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예봉경사부황보남궁제갈선우독고';
// Surname + two-syllable given name; 2-syllable matches were mostly ordinary words ("주요", "경력")
const NAME = `[${SURNAMES}][가-힣]{2}`;
const TITLE = '(?:대표\\s*원장|병원장|원장|대표\\s*의사)';
const PATTERNS = [
    new RegExp(`${TITLE}\\s*[:：]?\\s*(${NAME})(?![가-힣])`, 'g'),          // 대표원장 홍길동
    new RegExp(`(?<![가-힣])(${NAME})\\s*${TITLE}(?![가-힣]{2,})`, 'g')      // 홍길동 원장
];
// Words that look like names next to "원장" but are not
const STOPWORDS = new Set(['원장님', '대표님', '이사장', '전문의', '피부과', '성형외', '병원장', '진료과', '의료진', '소개합', '인사말', '대표원', '우리원', '본원장', '진료원', '부원장', '공동대', '전원장', '임원장', '이원장', '김원장', '박원장', '최원장',
    '대표이', '주요경', '경력사', '학력사', '진료분', '전문분', '상담실', '시술전', '시술후', '고객님', '여러분', '안녕하', '반갑습', '감사합', '정성을', '최선을', '책임지', '직접시', '모든시', '정확한', '안전한', '건강한', '아름다', '자연스', '만족도', '노하우', '이벤트', '공지사', '오시는', '진료시', '예약하', '문의하', '전화상', '온라인', '카카오', '네이버', '인스타', '유튜브', '블로그', '정회원', '준회원', '평생회', '대한민']);

function withTimeout(ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function fetchText(url, allowHttpsRetry = true) {
    const t = withTimeout(TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: t.signal, redirect: 'follow', headers: { 'User-Agent': UA, 'Accept-Language': 'ko' } });
        if (!res.ok) return null;
        const type = res.headers.get('content-type') || '';
        if (!/html|text/.test(type)) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        // Many Korean clinic sites still serve EUC-KR
        const head = buf.slice(0, 2048).toString('latin1');
        const charset = (type.match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
        let text;
        try { text = new TextDecoder(/euc-?kr|ks_c_5601/i.test(charset) ? 'euc-kr' : 'utf-8').decode(buf); } catch (e) { text = buf.toString('utf8'); }
        return { url: res.url || url, html: text };
    } catch (e) {
        // Many listed homepages are http:// while the site now only answers on https://
        if (allowHttpsRetry && url.startsWith('http://')) return fetchText('https://' + url.slice(7), false);
        return null;
    } finally {
        t.done();
    }
}

// Minimal robots.txt check for our user agent / "*" (Disallow prefixes only)
async function robotsAllows(url) {
    try {
        const u = new URL(url);
        const res = await fetchText(`${u.origin}/robots.txt`);
        if (!res) return true;
        let applies = false, disallowed = [];
        for (const raw of res.html.split(/\r?\n/)) {
            const line = raw.replace(/#.*/, '').trim();
            const m = line.match(/^(user-agent|disallow)\s*:\s*(.*)$/i);
            if (!m) continue;
            if (m[1].toLowerCase() === 'user-agent') applies = m[2] === '*' || /komicare/i.test(m[2]);
            else if (applies && m[2]) disallowed.push(m[2]);
        }
        return !disallowed.some(prefix => prefix === '/' || u.pathname.startsWith(prefix));
    } catch (e) {
        return true;
    }
}

function htmlToText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ');
}

function doctorLinks(html, baseUrl) {
    const links = [];
    const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html))) {
        const label = htmlToText(m[2]);
        const href = m[1];
        if (!/의료진|원장|대표원장|doctor|staff|about|intro|소개|인사말/i.test(label + ' ' + href)) continue;
        try {
            const abs = new URL(href, baseUrl);
            if (abs.hostname !== new URL(baseUrl).hostname || !/^https?:$/.test(abs.protocol)) continue;
            if (!links.includes(abs.href)) links.push(abs.href);
        } catch (e) {}
    }
    // Prefer pages that look like doctor introductions
    return links.sort((a, b) => /의료진|원장|doctor/i.test(b) - /의료진|원장|doctor/i.test(a)).slice(0, MAX_SUBPAGES);
}

function extractNames(text) {
    const counts = new Map();
    for (const re of PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text))) {
            const name = m[1];
            if (STOPWORDS.has(name) || /원장|의사|병원/.test(name)) continue;
            // Particles and place/branch endings mean it's a phrase, not a person ("변화를", "강남점")
            if (/[을를이가은는의에도로와과점관실팀센층동구시]$/.test(name)) continue;
            counts.set(name, (counts.get(name) || 0) + 1);
        }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// Returns { names: [...], sourceUrl } or { names: [], reason }
async function findDoctorNames(homepage) {
    let start;
    try { start = new URL(homepage); } catch (e) { return { names: [], reason: 'bad url' }; }
    if (/(^|\.)(naver|instagram|facebook|kakao|daum|modoo|tistory|youtube)\./i.test(start.hostname)) {
        return { names: [], reason: 'platform site (not scraped)' };
    }
    if (!(await robotsAllows(start.href))) return { names: [], reason: 'robots.txt disallows' };
    const home = await fetchText(start.href);
    if (!home) return { names: [], reason: 'homepage unreachable' };

    const pages = [home];
    for (const link of doctorLinks(home.html, home.url)) {
        if (!(await robotsAllows(link))) continue;
        const page = await fetchText(link);
        if (page) pages.push(page);
    }
    let best = null;
    for (const page of pages) {
        const found = extractNames(htmlToText(page.html));
        if (found.length && (!best || found[0][1] > best.found[0][1])) best = { found, url: page.url };
    }
    if (!best) return { names: [], reason: 'no director name found' };
    // Keep the clear leaders only: names mentioned at least half as often as the top one, max 3
    const top = best.found[0][1];
    const names = best.found.filter(([, n]) => n >= Math.max(1, top / 2)).slice(0, 3).map(([name]) => name);
    return { names, sourceUrl: best.url };
}

module.exports = { findDoctorNames, extractNames, doctorLinks, htmlToText };
