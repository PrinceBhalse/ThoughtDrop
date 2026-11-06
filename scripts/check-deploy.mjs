/**
 * Post-deploy smoke check. Verifies that every URL the Android app and Google
 * Play depend on is reachable and healthy.
 *
 * Usage:
 *   node scripts/check-deploy.mjs                      # checks https://thoughtdrop.app
 *   node scripts/check-deploy.mjs https://your.domain
 */
const site = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://thoughtdrop.app")
  .replace(/\/$/, "");

const checks = [
  { path: "/", name: "home feed", expect: 200 },
  { path: "/api/feed?limit=1", name: "feed API", expect: 200, json: true },
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

if (failures > 0) {
  console.log(`\n${failures} check(s) failed for ${site}.`);
  process.exit(1);
}

console.log(`\nAll checks passed for ${site}.`);
