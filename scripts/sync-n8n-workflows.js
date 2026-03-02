/**
 * sync-n8n-workflows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Upserts all workflow JSON files from /n8n-workflows/ into n8n and syncs
 * Variables so workflows can use $vars.BACKEND_PUBLIC_URL etc.
 *
 * Usage:
 *   node scripts/sync-n8n-workflows.js
 *   npm run n8n:sync
 *
 * Auth (tried in order):
 *   1. N8N_API_KEY  — preferred (create in n8n UI: Settings → n8n API)
 *   2. Basic auth   — fallback (N8N_USER / N8N_PASSWORD from .env)
 *
 * Env source (first found wins, no external deps):
 *   .env → apps/backend/.env → process.env
 *
 * What it does:
 *   1. Wait for n8n to be ready (up to 90s)
 *   2. Sync n8n Variables: BACKEND_PUBLIC_URL, N8N_WEBHOOK_SECRET
 *      → these become $vars.BACKEND_PUBLIC_URL in workflow expressions
 *   3. For each *.json in n8n-workflows/ (alphabetical order):
 *      a. Find by name  →  PUT (update) or POST (create)
 *      b. Activate schedule-trigger workflows automatically
 *      c. Leave Telegram/Webhook-trigger workflows inactive (need credentials)
 *
 * Idempotent — safe to run multiple times.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Load .env files without external deps ────────────────────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    // Remove surrounding quotes, strip inline comments (# preceded by whitespace)
    let val = trimmed.slice(eqIdx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    val = val.replace(/(?<=\S)\s+#.*$/, '');  // only strip # if preceded by a non-space char
    if (!(key in process.env)) process.env[key] = val;
  }
}

const ROOT = path.resolve(__dirname, '..');
loadEnvFile(path.join(ROOT, '.env'));
loadEnvFile(path.join(ROOT, 'apps', 'backend', '.env'));

// ── Config ───────────────────────────────────────────────────────────────────
const N8N_URL      = (process.env.N8N_URL || process.env.N8N_BASE_URL || 'http://localhost:5678').replace(/\/$/, '');
const API_KEY      = process.env.N8N_API_KEY || '';
const BASIC_USER   = process.env.N8N_USER     || process.env.N8N_BASIC_AUTH_USER     || 'admin';
const BASIC_PASS   = process.env.N8N_PASSWORD || process.env.N8N_BASIC_AUTH_PASSWORD || 'admin123';
const WORKFLOWS_DIR = path.join(ROOT, 'n8n-workflows');

// ── Terminal colours ─────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m',  blue: '\x1b[34m',  cyan: '\x1b[36m', bold: '\x1b[1m',
};
const ok   = (m) => console.log(`${c.green}  [OK]${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}  [!!]${c.reset} ${m}`);
const fail = (m) => console.log(`${c.red}  [ERR]${c.reset} ${m}`);
const step = (m) => console.log(`\n${c.yellow}>>${c.reset} ${m}`);
const info = (m) => console.log(`${c.cyan}      ${m}${c.reset}`);

// ── HTTP helper (Node 18+ native fetch) ──────────────────────────────────────
async function request(method, endpoint, body) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };

  if (API_KEY) {
    headers['X-N8N-API-KEY'] = API_KEY;
  } else {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString('base64');
  }

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${N8N_URL}${endpoint}`, opts);
  } catch (e) {
    return { status: 0, ok: false, data: { error: String(e) } };
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  return { status: res.status, ok: res.ok, data };
}

// ── Wait for n8n ─────────────────────────────────────────────────────────────
async function waitForN8n(maxSecs = 90) {
  const interval = 3;
  let waited = 0;
  process.stdout.write(`  Connecting to ${N8N_URL} `);

  while (waited < maxSecs) {
    const r = await request('GET', '/api/v1/workflows?limit=1');
    // 200 = up + auth ok, 401 = up + wrong auth, both mean n8n is running
    if (r.status === 200 || r.status === 401) {
      console.log(` ${c.green}✓${c.reset} (${waited}s)`);
      return true;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, interval * 1000));
    waited += interval;
  }
  console.log('');
  return false;
}

// ── Verify auth and get n8n version ─────────────────────────────────────────
async function verifyAuth() {
  const r = await request('GET', '/api/v1/workflows?limit=1');
  if (r.status === 401) {
    fail('Authentication failed.');
    if (!API_KEY) {
      warn('No N8N_API_KEY found. Using basic auth fallback.');
      warn('For reliable auth: create an API key in n8n UI → Settings → n8n API');
      warn(`Then add to .env:  N8N_API_KEY=n8n_api_xxxx`);
    } else {
      warn('Check your N8N_API_KEY — it may have expired or been deleted.');
    }
    return false;
  }
  if (!r.ok && r.status !== 403) {
    fail(`n8n API error ${r.status}. Is n8n running? Try: docker compose up -d n8n`);
    return false;
  }
  return true;
}

// ── Sync n8n Variables  ($vars.KEY in workflow expressions) ──────────────────
// n8n Variables are the correct way to inject config into workflows.
// They are available in all Community edition n8n >= 1.0.
// Workflows use: $vars.BACKEND_PUBLIC_URL  (NOT $env.* which is disabled by default)
async function syncVariables() {
  const varsToSync = [
    {
      key:   'BACKEND_PUBLIC_URL',
      value: process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001',
      note:  'Base URL of the backend API (http://localhost:3001 in dev)',
    },
    {
      key:   'N8N_WEBHOOK_SECRET',
      value: process.env.N8N_WEBHOOK_SECRET || '',
      note:  'Shared secret for backend↔n8n webhook validation',
    },
  ];

  // Fetch existing variables
  const listRes = await request('GET', '/api/v1/variables?limit=100');

  // Variables API might not exist in very old n8n or could return 403 on Community
  if (listRes.status === 403 || listRes.status === 404) {
    warn('n8n Variables API not available (requires n8n >= 1.0 Community).');
    warn('Workflows will need manual variable configuration.');
    warn('Alternative: set BACKEND_PUBLIC_URL directly in each HTTP node URL.');
    return;
  }

  if (!listRes.ok) {
    warn(`Could not fetch n8n Variables (${listRes.status}). Skipping variable sync.`);
    return;
  }

  const existing = Array.isArray(listRes.data)
    ? listRes.data
    : (listRes.data?.data ?? []);

  for (const v of varsToSync) {
    if (!v.value) {
      warn(`Variable ${v.key} is empty — skipping (set ${v.key} in .env)`);
      continue;
    }
    const found = existing.find((e) => e.key === v.key);
    if (found) {
      const r = await request('PATCH', `/api/v1/variables/${found.id}`, { value: v.value });
      if (r.ok) {
        ok(`Updated  $vars.${v.key} = ${v.value}`);
      } else {
        warn(`Failed to update $vars.${v.key} (${r.status}) — update manually in n8n UI → Settings → Variables`);
      }
    } else {
      const r = await request('POST', '/api/v1/variables', { key: v.key, value: v.value });
      if (r.ok) {
        ok(`Created  $vars.${v.key} = ${v.value}`);
      } else {
        warn(`Failed to create $vars.${v.key} (${r.status})`);
        if (r.status === 400) {
          info('This may be a plan limitation. Try: n8n UI → Settings → Variables → Add manually');
        }
      }
    }
  }
}

// ── Find workflow by exact name ───────────────────────────────────────────────
async function findWorkflowByName(name) {
  const r = await request('GET', '/api/v1/workflows?limit=250');
  if (!r.ok) return null;
  const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
  return list.find((w) => w.name === name) ?? null;
}

// ── Build the workflow payload n8n accepts ───────────────────────────────────
function buildPayload(wf) {
  return {
    name:        wf.name,
    nodes:       wf.nodes       ?? [],
    connections: wf.connections ?? {},
    settings:    wf.settings    ?? { executionOrder: 'v1' },
    staticData:  wf.staticData  ?? null,
  };
}

// ── Determine if a workflow needs manual activation (has webhook triggers) ────
function needsManualActivation(wf) {
  const manualTriggerTypes = [
    'n8n-nodes-base.telegramTrigger',
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.formTrigger',
  ];
  return (wf.nodes ?? []).some((n) => manualTriggerTypes.includes(n.type));
}

// ── Upsert one workflow ───────────────────────────────────────────────────────
async function upsertWorkflow(filePath) {
  const filename = path.basename(filePath);
  let wf;
  try {
    wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fail(`Invalid JSON in ${filename}: ${e.message}`);
    return false;
  }

  const name    = wf.name;
  const payload = buildPayload(wf);
  const existing = await findWorkflowByName(name);

  let workflowId;
  if (existing) {
    const r = await request('PUT', `/api/v1/workflows/${existing.id}`, payload);
    if (!r.ok) {
      fail(`Update failed for "${name}" (HTTP ${r.status}): ${JSON.stringify(r.data).slice(0, 200)}`);
      return false;
    }
    workflowId = existing.id;
    ok(`Updated  "${name}" (id: ${workflowId})`);
  } else {
    const r = await request('POST', '/api/v1/workflows', payload);
    if (!r.ok) {
      fail(`Create failed for "${name}" (HTTP ${r.status}): ${JSON.stringify(r.data).slice(0, 200)}`);
      return false;
    }
    workflowId = r.data.id;
    ok(`Created  "${name}" (id: ${workflowId})`);
  }

  // Activate or warn
  if (needsManualActivation(wf)) {
    warn(`"${name}" — activate manually after adding Telegram credentials in n8n`);
  } else {
    const actRes = await request('POST', `/api/v1/workflows/${workflowId}/activate`);
    if (actRes.ok) {
      ok(`Activated "${name}"`);
    } else {
      warn(`Could not auto-activate "${name}" (${actRes.status}) — activate manually in n8n UI`);
    }
  }

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.blue}══════════════════════════════${c.reset}`);
  console.log(`${c.bold}${c.blue}  n8n Workflow Sync${c.reset}`);
  console.log(`${c.bold}${c.blue}══════════════════════════════${c.reset}`);
  console.log(`  ${c.cyan}n8n URL :${c.reset} ${N8N_URL}`);
  console.log(`  ${c.cyan}Auth    :${c.reset} ${API_KEY ? `API Key (${API_KEY.slice(0, 12)}...)` : `Basic (${BASIC_USER})`}`);

  // 1. Wait for n8n
  step('Waiting for n8n to be ready...');
  const ready = await waitForN8n(90);
  if (!ready) {
    fail('n8n did not respond within 90s.');
    fail('Check: docker compose ps   and   docker compose logs n8n');
    process.exit(1);
  }

  // 2. Verify auth
  const authed = await verifyAuth();
  if (!authed) process.exit(1);
  ok(`Authenticated with n8n`);

  // 3. Sync Variables
  step('Syncing n8n Variables ($vars.* in workflow expressions)...');
  await syncVariables();

  // 4. Sync Workflows
  const files = fs.readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map((f) => path.join(WORKFLOWS_DIR, f));

  if (files.length === 0) {
    warn('No workflow JSON files found in n8n-workflows/');
    process.exit(0);
  }

  step(`Syncing ${files.length} workflow(s)...`);

  let synced = 0;
  let failed = 0;
  for (const f of files) {
    const result = await upsertWorkflow(f);
    result ? synced++ : failed++;
  }

  // 5. Summary
  const allOk = failed === 0;
  console.log(`\n${c.bold}${allOk ? c.green : c.yellow}──────────────────────────────────────${c.reset}`);
  console.log(`${c.bold}${allOk ? c.green : c.yellow}  Result: ${synced}/${files.length} workflows synced${c.reset}`);
  if (failed > 0) warn(`${failed} workflow(s) failed — check output above`);

  console.log(`\n  ${c.bold}Next steps:${c.reset}`);
  console.log(`  1. Open ${c.cyan}${N8N_URL}${c.reset}`);
  console.log(`  2. Add credentials:`);
  console.log(`     • Credentials → New → HTTP Header Auth → name: "Backend Webhook Secret"`);
  console.log(`       Header: x-webhook-secret   Value: (your N8N_WEBHOOK_SECRET)`);
  console.log(`     • Credentials → New → Telegram → name: "Telegram Bot"`);
  console.log(`       Token: (your TELEGRAM_BOT_TOKEN)`);
  console.log(`  3. Open "02 - Telegram Responses" → assign credentials → toggle ON`);
  console.log(`  4. See ${c.cyan}n8n-workflows/SETUP.md${c.reset} for full instructions\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  fail(`Unexpected error: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
