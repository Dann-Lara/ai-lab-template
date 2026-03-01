/**
 * sync-n8n-workflows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Upserts all JSON files from /n8n-workflows/ into the running n8n instance
 * using the n8n REST API v1.
 *
 * Usage:
 *   node scripts/sync-n8n-workflows.js              # uses .env values
 *   N8N_URL=http://localhost:5678 node scripts/sync-n8n-workflows.js
 *
 * Requires:
 *   N8N_API_KEY  — API key created in n8n UI (Settings → API → Create)
 *                  OR N8N_BASIC_AUTH_USER + N8N_BASIC_AUTH_PASSWORD for basic auth
 *   N8N_URL      — defaults to http://localhost:5678
 *
 * What it does per workflow file:
 *   1. GET  /api/v1/workflows?name=<name>   → find if exists
 *   2. POST /api/v1/workflows               → create (if not found)
 *      PUT  /api/v1/workflows/:id           → update (if found)
 *   3. POST /api/v1/workflows/:id/activate  → enable it
 *
 * Idempotent: safe to run multiple times.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Load .env files (root + backend) without external deps ──────────────────
function loadEnv() {
  const files = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', 'apps', 'backend', '.env'),
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnv();

// ── Config ───────────────────────────────────────────────────────────────────
const N8N_URL      = (process.env.N8N_URL || process.env.N8N_BASE_URL || 'http://localhost:5678').replace(/\/$/, '');
const API_KEY      = process.env.N8N_API_KEY || '';
const BASIC_USER   = process.env.N8N_USER  || process.env.N8N_BASIC_AUTH_USER  || 'admin';
const BASIC_PASS   = process.env.N8N_PASSWORD || process.env.N8N_BASIC_AUTH_PASSWORD || 'admin123';
const WORKFLOWS_DIR = path.resolve(__dirname, '..', 'n8n-workflows');

// ANSI colours (disabled on Windows CI if needed)
const c = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};
const ok   = (m) => console.log(`${c.green}  [OK]${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}  [!!]${c.reset} ${m}`);
const err  = (m) => console.log(`${c.red}  [ERR]${c.reset} ${m}`);
const step = (m) => console.log(`\n${c.yellow}>>${c.reset} ${m}`);

// ── HTTP helper (pure Node, no fetch polyfill needed for Node 18+) ───────────
async function request(method, endpoint, body) {
  const url = new URL(`${N8N_URL}${endpoint}`);
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (API_KEY) {
    headers['X-N8N-API-KEY'] = API_KEY;
  } else {
    // Fall back to basic auth (n8n default in docker-compose)
    headers['Authorization'] = 'Basic ' + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString('base64');
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  const text = await res.text();

  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  return { status: res.status, ok: res.ok, data: json };
}

// ── Wait for n8n to be ready ─────────────────────────────────────────────────
async function waitForN8n(maxWaitSecs = 90) {
  const interval = 3;
  let waited = 0;
  process.stdout.write(`  Waiting for n8n at ${N8N_URL} `);

  while (waited < maxWaitSecs) {
    try {
      const r = await request('GET', '/api/v1/workflows?limit=1');
      if (r.status === 200 || r.status === 401) {
        // 401 = n8n up but wrong auth — still up
        console.log(` ${c.green}ready${c.reset} (${waited}s)`);
        return true;
      }
    } catch { /* not up yet */ }

    process.stdout.write('.');
    await new Promise((res) => setTimeout(res, interval * 1000));
    waited += interval;
  }

  console.log('');
  return false;
}

// ── Find existing workflow by exact name ─────────────────────────────────────
async function findByName(name) {
  // n8n API supports ?name= filter since v1.x
  const r = await request('GET', `/api/v1/workflows?limit=100`);
  if (!r.ok) return null;
  const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
  return list.find((w) => w.name === name) ?? null;
}

// ── Build the payload n8n expects ────────────────────────────────────────────
function buildPayload(wf) {
  // Strip keys n8n doesn't accept on create/update
  return {
    name:        wf.name,
    nodes:       wf.nodes       ?? [],
    connections: wf.connections ?? {},
    settings:    wf.settings    ?? {},
    staticData:  wf.staticData  ?? null,
  };
}

// ── Upsert one workflow ───────────────────────────────────────────────────────
async function upsertWorkflow(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let wf;
  try { wf = JSON.parse(raw); } catch (e) {
    err(`Invalid JSON in ${path.basename(file)}: ${e.message}`);
    return false;
  }

  const name    = wf.name;
  const payload = buildPayload(wf);
  const existing = await findByName(name);

  let workflowId;
  if (existing) {
    // UPDATE
    const r = await request('PUT', `/api/v1/workflows/${existing.id}`, payload);
    if (!r.ok) {
      err(`Update failed for "${name}" (${r.status}): ${JSON.stringify(r.data).slice(0, 120)}`);
      return false;
    }
    workflowId = existing.id;
    ok(`Updated  "${name}" (id: ${workflowId})`);
  } else {
    // CREATE
    const r = await request('POST', '/api/v1/workflows', payload);
    if (!r.ok) {
      err(`Create failed for "${name}" (${r.status}): ${JSON.stringify(r.data).slice(0, 120)}`);
      return false;
    }
    workflowId = r.data.id;
    ok(`Created  "${name}" (id: ${workflowId})`);
  }

  // ACTIVATE (skip webhook-trigger ones since they need credentials first;
  // schedule triggers are safe to activate immediately)
  const hasWebhookTrigger = (wf.nodes ?? []).some(
    (n) => n.type === 'n8n-nodes-base.telegramTrigger' ||
           n.type === 'n8n-nodes-base.webhook'
  );

  if (!hasWebhookTrigger) {
    const act = await request('POST', `/api/v1/workflows/${workflowId}/activate`);
    if (act.ok) {
      ok(`Activated "${name}"`);
    } else {
      warn(`Could not activate "${name}" — activate manually after adding credentials`);
    }
  } else {
    warn(`"${name}" has Telegram/Webhook trigger — activate manually after adding credentials`);
  }

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.blue}n8n Workflow Sync${c.reset}`);
  console.log(`${c.cyan}  URL : ${N8N_URL}${c.reset}`);
  console.log(`${c.cyan}  Auth: ${API_KEY ? 'API Key' : 'Basic (' + BASIC_USER + ')'}${c.reset}`);

  // Check n8n is up
  step('Waiting for n8n...');
  const ready = await waitForN8n(90);
  if (!ready) {
    err('n8n did not start in 90s. Make sure Docker is running: docker compose up -d n8n');
    process.exit(1);
  }

  // Verify auth
  const authCheck = await request('GET', '/api/v1/workflows?limit=1');
  if (authCheck.status === 401) {
    err('Authentication failed. Check N8N_API_KEY or N8N_USER/N8N_PASSWORD in your .env');
    warn('To create an API key: n8n UI → Settings → n8n API → Create API Key');
    warn('Then add to apps/backend/.env:  N8N_API_KEY=your-key-here');
    process.exit(1);
  }
  if (!authCheck.ok && authCheck.status !== 403) {
    err(`n8n API returned ${authCheck.status}. Is n8n running?`);
    process.exit(1);
  }

  // Find workflow files
  const files = fs.readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => path.join(WORKFLOWS_DIR, f));

  if (files.length === 0) {
    warn('No workflow JSON files found in n8n-workflows/');
    process.exit(0);
  }

  step(`Syncing ${files.length} workflow(s)...`);
  let success = 0;
  let failed  = 0;

  for (const file of files) {
    const result = await upsertWorkflow(file);
    result ? success++ : failed++;
  }

  // Summary
  console.log(`\n${c.bold}${success === files.length ? c.green : c.yellow}Sync complete: ${success}/${files.length} workflows synced${c.reset}`);
  if (failed > 0) {
    warn(`${failed} workflow(s) failed. Check output above.`);
  }

  console.log(`\n  ${c.cyan}Next steps:${c.reset}`);
  console.log(`  1. Open ${N8N_URL} and add credentials (Telegram Bot + Backend Webhook Secret)`);
  console.log(`  2. Activate workflows that require credentials manually`);
  console.log(`  3. See n8n-workflows/SETUP.md for detailed instructions\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { err(String(e)); process.exit(1); });
