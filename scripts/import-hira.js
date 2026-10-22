#!/usr/bin/env node
// Imports clinic basics (name, address, phone, departments, doctor counts, coordinates) from the
// HIRA hospital information open API (건강보험심사평가원 병원정보서비스, data.go.kr) into public.clinics
// as unverified directory entries (source = 'hira'). Nothing here is shown as a verified partner.
//
// Usage:
//   node scripts/import-hira.js --dry-run            # fetch only, print a summary and write scripts/hira-preview.json
//   node scripts/import-hira.js                      # fetch and upsert into Supabase
//   node scripts/import-hira.js --sido=110000 --depts=14,08 --limit=50
//   node scripts/import-hira.js --scope=all          # every clinic offering the departments
//   node scripts/import-hira.js --deactivate-missing --summary=data/hira-sync.json   # monthly job
//
// Scopes (HIRA lists every clinic that merely offers a department, ~5,500 in Seoul):
//   aesthetic  (default) specialist-named clinics, plus 의원/병원 offering the departments whose name
//              does not point to another specialty or a general/charity clinic. Keeps aesthetic clinics
//              named like "아이필유의원" that carry no specialty in their name.
//   specialist only names containing 피부과/성형외과
//   all        everything, including internal medicine clinics and general hospitals
// aesthetic/all also scan every Seoul 의원/병원 for aesthetic names that list no matching department
// (hair transplant clinics and the like); --no-name-scan skips that.
// --deactivate-missing hides (active = false) public entries that were not in this run, e.g. closed
// clinics. It is skipped when the run returned under half of the currently active entries, which
// points to an API problem rather than mass closures. --summary writes a small JSON report.
//
// Korean medical law lets only board-certified specialists put a specialty in the clinic name,
// which is what "specialist" relies on.
//
// Env (read from the shell, then .env.local, then .env):
//   HIRA_SERVICE_KEY            data.go.kr service key (Encoding or Decoding key both work)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   required unless --dry-run

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';
const DEPARTMENTS = { '14': '피부과', '08': '성형외과' };
const PAGE_SIZE = 100;

function loadEnvFiles() {
    for (const file of ['.env.local', '.env']) {
        const full = path.join(__dirname, '..', file);
        if (!fs.existsSync(full)) continue;
        for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (!m || process.env[m[1]] !== undefined) continue;
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

function parseArgs(argv) {
    const args = { dryRun: false, sido: '110000', depts: Object.keys(DEPARTMENTS), limit: Infinity, scope: 'aesthetic', deactivateMissing: false, summary: null, nameScan: true };
    for (const arg of argv) {
        if (arg === '--dry-run') args.dryRun = true;
        else if (arg.startsWith('--sido=')) args.sido = arg.slice(7);
        else if (arg.startsWith('--depts=')) args.depts = arg.slice(8).split(',').map(s => s.trim()).filter(Boolean);
        else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.slice(8), 10);
        else if (arg.startsWith('--scope=')) args.scope = arg.slice(8);
        else if (arg === '--deactivate-missing') args.deactivateMissing = true;
        else if (arg === '--no-name-scan') args.nameScan = false;
        else if (arg.startsWith('--summary=')) args.summary = arg.slice(10);
        else throw new Error(`Unknown option: ${arg}`);
    }
    return args;
}

// data.go.kr issues an already URL-encoded key and a raw one; encode only the raw one
function serviceKeyParam(key) {
    return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

async function fetchPage({ key, sido, dept, clCd, pageNo }) {
    const filters = (dept ? `&dgsbjtCd=${dept}` : '') + (clCd ? `&clCd=${clCd}` : '');
    const query = `ServiceKey=${serviceKeyParam(key)}&pageNo=${pageNo}&numOfRows=${PAGE_SIZE}&sidoCd=${sido}${filters}&_type=json`;
    const res = await fetch(`${ENDPOINT}?${query}`);
    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        // Key or quota errors come back as XML even when JSON is requested
        const msg = (text.match(/<(?:returnAuthMsg|resultMsg)>([^<]+)</) || [])[1] || text.slice(0, 200);
        throw new Error(`HIRA API error (HTTP ${res.status}): ${msg}`);
    }
    const header = json.response && json.response.header;
    if (!header || header.resultCode !== '00') {
        throw new Error(`HIRA API error: ${header ? `${header.resultCode} ${header.resultMsg}` : 'unexpected response'}`);
    }
    const body = json.response.body || {};
    const raw = body.items && body.items.item;
    const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return { items, totalCount: Number(body.totalCount) || 0 };
}

function toDate(value) {
    const s = String(value || '');
    return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null;
}

function toNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function toHomepage(value) {
    const s = String(value || '').trim();
    if (!s) return null;
    const url = /^https?:\/\//i.test(s) ? s : `http://${s}`;
    try { return new URL(url).toString(); } catch (e) { return null; }
}

function isSpecialistClinic(row) {
    return /피부과|성형외과/.test(row.name);
}

// Names that point to another specialty or a general/charity clinic. "365" stays allowed for the
// 365mc liposuction chain, and "편한의원" (gastro clinics) is not a 한의원.
const NON_AESTHETIC_NAME = /내과|가정|이비인후|정형외과|신경외과|신경과|소아|산부인과|여성|비뇨|안과|재활|영상의학|마취|통증|정신|치과|(?<!편)한의원|한방|요양|외과의원|검진|건강|재단|협회|부설|보건|의료원|통합|365(?!\s*(?:mc|엠씨))|연합|열린의원/i;
// 병원-type names that are clearly not aesthetic (children's, joints/spine, elderly care)
const GENERAL_HOSPITAL_NAME = /어린이|아이들|조인트|관절|척추|마디|튼튼|노인/;
// Names that suggest an aesthetic clinic even when no dermatology/plastic surgery department is listed
const AESTHETIC_NAME = /피부|스킨|skin|뷰티|beauty|에스테틱|aesthetic|미용|레이저|laser|성형|더마|derma|리프팅|안티에이징|모발|헤어|hair|탈모/i;

function isAestheticClinic(row) {
    if (isSpecialistClinic(row)) return true;
    if (NON_AESTHETIC_NAME.test(row.name)) return false;
    if (row.clinic_type === '의원') return true;
    // Hospitals only when they offer plastic surgery or are named like an aesthetic clinic (e.g. 아이디병원)
    if (row.clinic_type === '병원') {
        return !GENERAL_HOSPITAL_NAME.test(row.name) && ((row.departments || []).includes('성형외과') || AESTHETIC_NAME.test(row.name));
    }
    return false;
}

const SCOPES = { aesthetic: isAestheticClinic, specialist: isSpecialistClinic, all: () => true };

function toRow(item, departments, syncedAt) {
    const area = [item.sgguCdNm, item.emdongNm].filter(Boolean).join(' ');
    return {
        source: 'hira',
        hira_ykiho: item.ykiho,
        name: String(item.yadmNm || '').trim(),
        location: area ? `📍 ${area}` : '📍 서울',
        address: item.addr || null,
        phone: item.telno || null,
        homepage: toHomepage(item.hospUrl),
        departments,
        specialties: departments,
        clinic_type: item.clCdNm || null,
        doctor_count: toNumber(item.drTotCnt),
        specialist_count: toNumber(item.mdeptSdrCnt),
        latitude: toNumber(item.YPos),
        longitude: toNumber(item.XPos),
        opened_on: toDate(item.estbDd),
        synced_at: syncedAt,
        active: true
    };
}

async function collect({ key, sido, depts, limit, nameScan = false }) {
    const byId = new Map();
    for (const dept of depts) {
        const label = DEPARTMENTS[dept] || dept;
        let pageNo = 1, total = 0, fetched = 0;
        do {
            const { items, totalCount } = await fetchPage({ key, sido, dept, pageNo });
            total = totalCount;
            for (const item of items) {
                if (!item.ykiho || !item.yadmNm) continue;
                const existing = byId.get(item.ykiho);
                if (existing) existing.departments.add(label);
                else byId.set(item.ykiho, { item, departments: new Set([label]) });
            }
            fetched += items.length;
            pageNo++;
            process.stdout.write(`\r${label}: ${fetched}/${total}`);
            if (byId.size >= limit || !items.length) break;
            await new Promise(r => setTimeout(r, 150));
        } while (fetched < total);
        process.stdout.write('\n');
        if (byId.size >= limit) break;
    }
    // Clinics that do aesthetics but registered no dermatology/plastic surgery department (e.g. hair
    // transplant clinics): scan every 의원 and 병원 and keep aesthetic-looking names
    if (nameScan && byId.size < limit) {
        for (const [clCd, label] of [['31', '의원'], ['21', '병원']]) {
            let pageNo = 1, total = 0, fetched = 0, added = 0;
            do {
                const { items, totalCount } = await fetchPage({ key, sido, clCd, pageNo });
                total = totalCount;
                for (const item of items) {
                    if (!item.ykiho || !item.yadmNm || byId.has(item.ykiho) || !AESTHETIC_NAME.test(item.yadmNm)) continue;
                    byId.set(item.ykiho, { item, departments: new Set() });
                    added++;
                }
                fetched += items.length;
                pageNo++;
                process.stdout.write(`\rname scan ${label}: ${fetched}/${total} (+${added})`);
                if (!items.length) break;
                await new Promise(r => setTimeout(r, 120));
            } while (fetched < total);
            process.stdout.write('\n');
        }
    }
    const syncedAt = new Date().toISOString();
    return [...byId.values()].slice(0, limit).map(({ item, departments }) => toRow(item, [...departments], syncedAt));
}

function supabaseClient() {
    const { createClient } = require('@supabase/supabase-js');
    const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function countActivePublic(supabase) {
    const { count, error } = await supabase.from('clinics').select('*', { count: 'exact', head: true })
        .eq('source', 'hira').eq('active', true);
    if (error) throw error;
    return count || 0;
}

// Hides public entries this run did not see (synced_at older than this run)
async function deactivateMissing(supabase, rows, activeBefore) {
    if (rows.length < activeBefore * 0.5) {
        console.warn(`skipping deactivation: this run returned ${rows.length} clinics but ${activeBefore} are active (possible API problem)`);
        return { skipped: true, deactivated: 0 };
    }
    const { data, error } = await supabase.from('clinics').update({ active: false })
        .eq('source', 'hira').eq('active', true).lt('synced_at', rows[0].synced_at).select('id');
    if (error) throw error;
    console.log(`deactivated ${data.length} clinics no longer in the public data`);
    return { skipped: false, deactivated: data.length };
}

async function upsert(rows, supabase = supabaseClient()) {
    for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from('clinics').upsert(chunk, { onConflict: 'hira_ykiho' });
        if (error) {
            if (error.code === '42703' || error.code === 'PGRST204') {
                throw new Error(`${error.message}\nRun the "5-2" block of supabase_schema.sql in the Supabase SQL Editor first.`);
            }
            if (error.code === '23505' && /clinics_name_key/.test(error.message)) {
                throw new Error(`${error.message}\nSeveral real clinics share a name. Run the "5-3" block of supabase_schema.sql (drops the UNIQUE constraint on name), then import again.`);
            }
            throw error;
        }
        console.log(`upserted ${Math.min(i + 500, rows.length)}/${rows.length}`);
    }
}

async function main() {
    loadEnvFiles();
    const args = parseArgs(process.argv.slice(2));
    const key = process.env.HIRA_SERVICE_KEY;
    if (!key) throw new Error('HIRA_SERVICE_KEY is not set (data.go.kr 건강보험심사평가원_병원정보서비스 key).');
    if (!args.dryRun && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or use --dry-run).');
    }

    if (!SCOPES[args.scope]) throw new Error(`--scope must be one of: ${Object.keys(SCOPES).join(', ')}`);
    if (args.deactivateMissing && Number.isFinite(args.limit)) throw new Error('--deactivate-missing cannot be combined with --limit');
    // The name scan adds ~110 API calls; the narrow specialist scope does not need it
    const collected = await collect({ key, ...args, nameScan: args.scope !== 'specialist' && args.nameScan });
    const rows = collected.filter(SCOPES[args.scope]);
    console.log(`scope=${args.scope}: kept ${rows.length} of ${collected.length}`);
    const withCoords = rows.filter(r => r.latitude && r.longitude).length;
    console.log(`collected ${rows.length} clinics (${withCoords} with coordinates)`);

    if (args.dryRun) {
        const out = path.join(__dirname, 'hira-preview.json');
        fs.writeFileSync(out, JSON.stringify(rows, null, 2));
        console.log(`dry run: wrote ${out}, nothing saved to Supabase`);
        return;
    }
    const supabase = supabaseClient();
    const activeBefore = await countActivePublic(supabase);
    await upsert(rows, supabase);
    const cleanup = args.deactivateMissing ? await deactivateMissing(supabase, rows, activeBefore) : null;
    const activeAfter = await countActivePublic(supabase);
    console.log(`done: ${activeAfter} active public clinics (was ${activeBefore})`);

    if (args.summary) {
        const summary = {
            synced_at: rows[0] ? rows[0].synced_at : new Date().toISOString(),
            scope: args.scope,
            fetched: collected.length,
            imported: rows.length,
            active_before: activeBefore,
            active_after: activeAfter,
            deactivated: cleanup ? cleanup.deactivated : 0,
            deactivation_skipped: cleanup ? cleanup.skipped : null
        };
        const out = path.resolve(process.cwd(), args.summary);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
        console.log(`summary written to ${args.summary}`);
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error(`\nimport failed: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { toRow, serviceKeyParam, fetchPage, collect, isSpecialistClinic, isAestheticClinic, deactivateMissing, AESTHETIC_NAME };
