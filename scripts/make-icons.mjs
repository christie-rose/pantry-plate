// Regenerates the app icons from scripts/brand/icon-master.png (a 512px drawing of the brush "A" in cream on deep green).
// Usage: node scripts/make-icons.mjs
// Writes public/icons/*.png and src/app/favicon.ico. The "A" is centered by its shape, not its box.
import sharp from "sharp";
import fs from "node:fs";

const GREEN = { r: 43, g: 59, b: 47, alpha: 1 };
const master = "scripts/brand/icon-master.png";

// Find the glyph's bounding box (the pale pixels) and shift it to the middle.
const { data, info } = await sharp(master).raw().toBuffer({ resolveWithObject: true });
let minX = info.width, maxX = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels] > 120) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
}
const shift = Math.round((minX + maxX) / 2 - info.width / 2);
const centered = await sharp(master)
  .extract({ left: Math.max(shift, 0), top: 0, width: info.width - Math.abs(shift), height: info.height })
  .extend({ right: Math.max(shift, 0), left: Math.max(-shift, 0), background: GREEN })
  .png()
  .toBuffer();

const rounded = async (size) => {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#fff"/></svg>`,
  );
  return sharp(centered).resize(size, size).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
};

// Full-bleed for the home-screen and maskable icons (the phone applies its own corners); rounded for the rest.
await sharp(centered).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");
await sharp(centered).resize(180, 180).flatten({ background: GREEN }).png().toFile("public/icons/apple-touch-icon.png");
await sharp(await rounded(512)).toFile("public/icons/icon-512.png");
await sharp(await rounded(192)).toFile("public/icons/icon-192.png");

// favicon.ico with 16, 32 and 48 pixel PNGs inside.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(rounded));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log("Icons written");
