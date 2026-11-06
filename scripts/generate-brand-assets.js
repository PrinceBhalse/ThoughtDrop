/**
 * Generates the Android launcher icon, adaptive icon layers and splash screens
 * from the master logo at D:\Downloads\ThoughtDrop.png (lightbulb + wordmark in
 * white on a black square canvas).
 *
 * Run: node scripts/generate-brand-assets.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const LOGO = process.env.LOGO_SOURCE || "D:/Downloads/ThoughtDrop.png";
const OUT = path.join(__dirname, "..", "assets");
const PUBLIC = path.join(__dirname, "..", "public");

const BG = "#000000";
const CANVAS = 1024;
const SPLASH = 2732;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PUBLIC, { recursive: true });

  const logo = sharp(LOGO);
  const meta = await logo.metadata();
  console.log(`source logo: ${meta.width}x${meta.height}`);

  // --- Launcher icon (legacy, square, full bleed) ---
  await sharp(LOGO).resize(CANVAS, CANVAS, { fit: "cover" }).png().toFile(path.join(OUT, "icon-only.png"));

  // --- Adaptive icon foreground: artwork kept inside the 66% safe zone ---
  const fgSize = Math.round(CANVAS * 0.72);
  const fgBuffer = await sharp(LOGO)
    .resize(fgSize, fgSize, { fit: "cover" })
    .png()
    .toBuffer();
  await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: fgBuffer, top: Math.round((CANVAS - fgSize) / 2), left: Math.round((CANVAS - fgSize) / 2) }])
    .png()
    .toFile(path.join(OUT, "icon-foreground.png"));

  // --- Adaptive icon background ---
  await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: BG } })
    .png()
    .toFile(path.join(OUT, "icon-background.png"));

  // --- Splash screens: logo centred on the black canvas ---
  const logoWidth = Math.round(SPLASH * 0.34);
  const splashLogo = await sharp(LOGO).resize(logoWidth, logoWidth, { fit: "cover" }).png().toBuffer();
  for (const name of ["splash.png", "splash-dark.png"]) {
    await sharp({ create: { width: SPLASH, height: SPLASH, channels: 4, background: BG } })
      .composite([{ input: splashLogo, top: Math.round((SPLASH - logoWidth) / 2), left: Math.round((SPLASH - logoWidth) / 2) }])
      .png()
      .toFile(path.join(OUT, name));
  }

  // --- Web assets: the real logo for the site favicon + a proper OG card ---
  await sharp(LOGO).resize(512, 512, { fit: "cover" }).png().toFile(path.join(PUBLIC, "logo.png"));
  await sharp(LOGO).resize(192, 192, { fit: "cover" }).png().toFile(path.join(PUBLIC, "favicon-192.png"));
  await sharp(LOGO).resize(512, 512, { fit: "cover" }).png().toFile(path.join(PUBLIC, "favicon-512.png"));

  const ogLogoWidth = 300;
  const ogLogo = await sharp(LOGO).resize(ogLogoWidth, ogLogoWidth, { fit: "cover" }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#0b0d12" } })
    .composite([{ input: ogLogo, top: Math.round((630 - ogLogoWidth) / 2), left: Math.round((1200 - ogLogoWidth) / 2) }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));

  console.log("brand assets written to assets/ and public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
