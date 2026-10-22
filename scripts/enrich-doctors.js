#!/usr/bin/env node
// Adds director names to public (HIRA) clinics from each clinic's own homepage.
// Names are stored with the page they came from and the check date, and shown on the site as
// "홈페이지 기준". Clinics that asked to be left out (doctor_opt_out) and platform pages (Naver,
// Instagram, …) are skipped, and robots.txt is respected.
//
// Usage:
//   node scripts/enrich-doctors.js --dry-run        # scrape only, write scripts/doctor-preview.json
//   node scripts/enrich-doctors.js                  # scrape and save to Supabase
//   node scripts/enrich-doctors.js --from-preview   # save scripts/doctor-preview.json without re-scraping
//   node scripts/enrich-doctors.js --recheck-days=30 --limit=50 --concurrency=4
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read from the shell, .env.local or .env)

const fs = require('fs');
const path = require('path');
const { findDoctorNames } = require('./lib/doctor-names');

const PREVIEW = path.join(__dirname, 'doctor-preview.json');

function loadEnvFiles() {
    for (const file of ['.env.local', '.env']) {
        const full = path.join(__dirname, '..', file);
        if (!fs.existsSync(full)) continue;
        for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
            if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}

function parseArgs(argv) {
    const args = { dryRun: false, fromPreview: false, recheckDays: 30, limit: Infinity, concurrency: 4 };
    for (const arg of argv) {
        if (arg === '--dry-run') args.dryRun = true;
        else if (arg === '--from-preview') args.fromPreview = true;
        else if (arg.startsWith('--recheck-days=')) args.recheckDays = Number(arg.slice(15));
        else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.slice(8), 10);
        else if (arg.startsWith('--concurrency=')) args.concurrency = Math.max(1, Math.min(8, parseInt(arg.slice(14), 10)));
        else throw new Error(`Unknown option: ${arg}`);
    }
    return args;
}

function supabaseClient() {
    const { createClient } = require('@supabase/supabase-js');
    const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function loadTargets(supabase, recheckDays, dryRun) {
    try {
        return await loadTargetsWith(supabase, recheckDays, 'id,name,homepage,doctor_checked_at,doctor_opt_out');
    } catch (e) {
        // A dry run can scrape before the 5-4 columns exist; saving cannot
        if (dryRun && /5-4/.test(e.message)) return loadTargetsWith(supabase, recheckDays, 'id,name,homepage');
        throw e;
    }
}

async function loadTargetsWith(supabase, recheckDays, columns) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from('clinics')
            .select(columns)
            .eq('source', 'hira').eq('active', true).not('homepage', 'is', null)
            .order('id').range(from, from + 999);
        if (error) {
            if (error.code === '42703' || error.code === 'PGRST204') {
                throw new Error(`${error.message}\nRun the "5-4" block of supabase_schema.sql in the Supabase SQL Editor first.`);
            }
            throw error;
        }
        rows.push(...data);
        if (data.length < 1000) break;
    }
    const cutoff = Date.now() - recheckDays * 86400000;
    return rows.filter(r => !r.doctor_opt_out && (!r.doctor_checked_at || Date.parse(r.doctor_checked_at) < cutoff));
}

async function scrape(targets, concurrency) {
    const results = [];
    let next = 0, done = 0;
    const worker = async () => {
        while (next < targets.length) {
            const clinic = targets[next++];
            const found = await findDoctorNames(clinic.homepage);
            results.push({ id: clinic.id, name: clinic.name, homepage: clinic.homepage, ...found });
            done++;
            process.stdout.write(`\rchecked ${done}/${targets.length} (names found: ${results.filter(r => r.names.length).length})`);
        }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    process.stdout.write('\n');
    return results;
}

// Chain clinics share one site listing every branch's doctors, so a name found at 3+ clinics can't
// be tied to a branch; drop it rather than show the wrong director
function dropNetworkNames(results) {
    const count = new Map();
    results.forEach(r => r.names.forEach(n => count.set(n, (count.get(n) || 0) + 1)));
    let dropped = 0;
    for (const r of results) {
        const kept = r.names.filter(n => count.get(n) <= 2);
        dropped += r.names.length - kept.length;
        if (kept.length !== r.names.length) {
            r.names = kept;
            if (!kept.length) { r.reason = 'names shared across a clinic chain'; delete r.sourceUrl; }
        }
    }
    if (dropped) console.log(`dropped ${dropped} names that appear at 3+ clinics (chain websites)`);
}

async function save(supabase, results) {
    const checkedAt = new Date().toISOString();
    let saved = 0;
    for (const r of results) {
        // A clinic with no name found is still marked as checked, so it waits recheck-days before retrying
        const update = r.names.length
            ? { doctor_names: r.names, doctor_source_url: r.sourceUrl, doctor_checked_at: checkedAt }
            : { doctor_checked_at: checkedAt };
        const { error } = await supabase.from('clinics').update(update).eq('id', r.id).eq('source', 'hira').eq('doctor_opt_out', false);
        if (error) throw error;
        saved++;
    }
    return saved;
}

async function main() {
    loadEnvFiles();
    const args = parseArgs(process.argv.slice(2));
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }
    const supabase = supabaseClient();

    let results;
    if (args.fromPreview) {
        results = JSON.parse(fs.readFileSync(PREVIEW, 'utf8'));
        console.log(`loaded ${results.length} results from ${path.relative(process.cwd(), PREVIEW)}`);
    } else {
        const targets = (await loadTargets(supabase, args.recheckDays, args.dryRun)).slice(0, args.limit);
        console.log(`clinics to check: ${targets.length}`);
        results = await scrape(targets, args.concurrency);
    }
    dropNetworkNames(results);
    const found = results.filter(r => r.names.length);
    console.log(`names found for ${found.length}/${results.length}`);

    if (args.dryRun) {
        fs.writeFileSync(PREVIEW, JSON.stringify(results, null, 2));
        console.log(`dry run: wrote ${path.relative(process.cwd(), PREVIEW)}, nothing saved`);
        return;
    }
    const saved = await save(supabase, results);
    console.log(`saved ${saved} clinics`);
}

if (require.main === module) {
    main().catch(err => {
        console.error(`\nenrich failed: ${err.message}`);
        process.exit(1);
    });
}
