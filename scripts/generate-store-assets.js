/**
 * Generates the Google Play Console listing graphics from the master logo:
 *   play-store/icon-512.png            512x512, 32-bit PNG, no transparency
 *   play-store/feature-graphic-1024x500.png
 *
 * Screenshots must be captured from a real device/emulator — see
 * PLAY_STORE_RELEASE.md for the required sizes.
 *
 * Run: node scripts/generate-store-assets.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const LOGO = process.env.LOGO_SOURCE || "D:/Downloads/ThoughtDrop.png";
const OUT = path.join(__dirname, "..", "play-store");
const BG = "#000000";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  await sharp(LOGO)
    .resize(512, 512, { fit: "cover" })
    .flatten({ background: BG })
    .png()
    .toFile(path.join(OUT, "icon-512.png"));

  const graphicW = 1024;
  const graphicH = 500;
  const logoH = 440;
  const logo = await sharp(LOGO)
    .resize(logoH, logoH, { fit: "cover" })
    .flatten({ background: BG })
    .png()
    .toBuffer();

  await sharp({
    create: { width: graphicW, height: graphicH, channels: 3, background: BG },
  })
    .composite([
      {
        input: logo,
        top: Math.round((graphicH - logoH) / 2),
        left: Math.round((graphicW - logoH) / 2),
      },
    ])
    .png()
    .toFile(path.join(OUT, "feature-graphic-1024x500.png"));

  console.log("play store assets written to play-store/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
