// Writes media/gallery.svg, the contact sheet shown in the README: two seeds of every kind.
// Run with `npm run gallery` (it builds first, since this imports the built package).
import { writeFileSync } from "node:fs";
import { kinds, toSvg } from "../dist/index.js";

const cols = 8;
const w = 200;
const h = 150;
const gap = 6;
const cells = kinds.flatMap((kind, k) =>
  [11, 48].map((seed, j) => {
    const idx = k * 2 + j;
    const x = (idx % cols) * (w + gap);
    const y = Math.floor(idx / cols) * (h + gap);
    return toSvg(kind, { size: `${w}x${h}`, seed }).replace("<svg ", `<svg x="${x}" y="${y}" `);
  }),
);
const rows = Math.ceil(cells.length / cols);
const width = cols * (w + gap) - gap;
const height = rows * (h + gap) - gap;
writeFileSync(
  new URL("../media/gallery.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells.join("")}</svg>\n`,
);
console.log(`media/gallery.svg: ${kinds.length} kinds, ${cells.length} pictures`);
