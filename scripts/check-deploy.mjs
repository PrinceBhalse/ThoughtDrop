/**
 * Post-deploy smoke check. Verifies that every URL the Android app and Google
 * Play depend on is reachable and healthy, and that the database schema the
 * deployed code expects has actually been applied.
 *
 * Usage:
 *   node scripts/check-deploy.mjs                      # checks https://thoughtdrop.app
 *   node scripts/check-deploy.mjs https://your.domain
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const out = {};
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local is optional (CI may inject env vars directly).
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };

const site = (process.argv[2] || env.NEXT_PUBLIC_SITE_URL || "https://thoughtdrop.app")
  .replace(/\/$/, "");

const checks = [
  { path: "/", name: "home feed", expect: 200 },
  { path: "/api/feed?limit=1", name: "feed API", expect: 200, json: true },
  { path: "/api/events", name: "signal ingestion route", expect: 405 },
  { path: "/api/intent", name: "session intent route", expect: 405 },
  { path: "/api/people/suggest", name: "people suggestions", expect: 200, json: true },
  { path: "/login", name: "sign-in page", expect: 200 },
  { path: "/privacy", name: "privacy policy", expect: 200 },
  { path: "/terms", name: "terms", expect: 200 },
  { path: "/account/delete", name: "account deletion", expect: 200 },
  { path: "/.well-known/assetlinks.json", name: "App Links", expect: 200, json: true },
];

let failures = 0;

for (const check of checks) {
  const url = `${site}${check.path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "thoughtdrop-deploy-check" },
    });
    clearTimeout(timer);

    let problem = null;

    if (response.status !== check.expect) {
      problem = `expected ${check.expect}`;
    } else if (check.json) {
      const body = await response.text();
      try {
        const parsed = JSON.parse(body);
        if (parsed.error) problem = `server error: ${parsed.error}`;
      } catch {
        problem = "response is not JSON";
      }
    }

    if (problem) {
      failures += 1;
      console.log(`FAIL  ${check.path.padEnd(32)} ${response.status}  ${check.name} (${problem})`);
    } else {
      console.log(`PASS  ${check.path.padEnd(32)} ${response.status}  ${check.name}`);
    }
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${check.path.padEnd(32)} ----  ${check.name} (${error.message})`);
  }
}

// --- Schema checks ---------------------------------------------------------
// The code degrades gracefully when these tables are missing, so a green HTTP
// check does not prove the feature works. Verify the migration was applied.
const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const tables = [
  { table: "feed_events", migration: "0015_feed_signals.sql" },
  { table: "session_intents", migration: "0015_feed_signals.sql" },
];

if (!supabaseUrl || !supabaseKey) {
  console.log("\nSKIP  schema checks (no NEXT_PUBLIC_SUPABASE_URL / ANON_KEY available)");
} else {
  console.log("");
  for (const { table, migration } of tables) {
    const url = `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`;
    try {
      const response = await fetch(url, {
        headers: { apikey: supabaseKey, authorization: `Bearer ${supabaseKey}` },
      });
      if (response.status === 200) {
        console.log(`PASS  ${`table ${table}`.padEnd(32)} ${response.status}  schema applied`);
      } else {
        failures += 1;
        console.log(
          `FAIL  ${`table ${table}`.padEnd(32)} ${response.status}  not found — apply supabase/migrations/${migration}`
        );
      }
    } catch (error) {
      failures += 1;
      console.log(`FAIL  ${`table ${table}`.padEnd(32)} ----  ${error.message}`);
    }
  }
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed for ${site}.`);
  process.exit(1);
}

console.log(`\nAll checks passed for ${site}.`);
