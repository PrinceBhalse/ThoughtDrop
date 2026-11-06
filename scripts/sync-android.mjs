import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

/**
 * Prepares the Android project for a build:
 *   1. reads the public site URL from the environment
 *   2. injects it into the native loader page (capacitor-web/index.html)
 *   3. copies web assets + plugins into the native project
 *
 * Usage: node scripts/sync-android.js
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, "utf8").split(/\r?\n/).reduce((acc, line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) acc[match[1]] = match[2].replace(/^["']|["']$/g, "");
    return acc;
  }, {});
}

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  readEnv().NEXT_PUBLIC_SITE_URL ||
  "https://thoughtdrop.app"
).replace(/\/$/, "");

const loaderPath = path.join(root, "capacitor-web", "index.html");
const loader = fs.readFileSync(loaderPath, "utf8");
const updated = loader.replace(/var APP_URL = "[^"]*";/, `var APP_URL = "${siteUrl}";`);

if (updated !== loader) {
  fs.writeFileSync(loaderPath, updated);
  console.log(`[android] loader target set to ${siteUrl}`);
} else {
  console.log(`[android] loader already targets ${siteUrl}`);
}

// Mirror the site URL into the https App Link filters only. The custom-scheme
// OAuth filter (com.thoughtdrop.app://login-callback) is tied to the package
// name and must not change with the domain.
const manifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, "utf8");
  const host = new URL(siteUrl).host;
  const patched = manifest.replace(
    /(android:scheme="https"\s+android:host=")[^"]*(")/g,
    `$1${host}$2`
  );
  if (patched !== manifest) {
    fs.writeFileSync(manifestPath, patched);
    console.log(`[android] deep link host set to ${host}`);
  }
}

execSync("npx cap sync android", { cwd: root, stdio: "inherit" });
