import { defineKind, fill, hsl, s, type Point, type Rand } from "./core";

/** Two or three soft-edged bands on a dark ground, after the color-field painters. */
export const field = defineKind("field", "Color field", "art", (g, w, h) => {
  const hue = g.f(0, 360), m = w * 0.08, gap = h * 0.05, count = g.i(2, 3), blur = g.id("blur");
  let out = s`<defs><filter id="${blur}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.012}"/></filter></defs>`;
  out += fill(w, h, hsl(hue, g.f(35, 60), g.f(22, 42)));
  const weights = Array.from({ length: count }, () => g.f(0.6, 1.6));
  const total = weights.reduce((a, b) => a + b, 0), avail = h - 2 * m - (count - 1) * gap;
  let y = m;
  for (const wt of weights) {
    const bandH = (avail * wt) / total;
    out += s`<rect x="${m}" y="${y}" width="${w - 2 * m}" height="${bandH}" fill="${hsl(hue + g.f(-45, 45), g.f(40, 78), g.f(30, 70))}" filter="url(#${blur})" opacity="0.94"/>`;
    y += bandH + gap;
  }
  return out;
});

const OFF_WHITE = "#f3f0e6";

/** The canvas split again and again into rectangles, a few of them filled with primaries. */
export const grid = defineKind("grid", "Primary grid", "art", (g, w, h) => {
  type Cell = { x: number; y: number; w: number; h: number };
  const cells: Cell[] = [{ x: 0, y: 0, w, h }];
  const splits = g.i(5, 9);
  for (let k = 0; k < splits; k++) {
    cells.sort((a, b) => b.w * b.h - a.w * a.h);
    const c = cells.splice(g.chance(0.7) ? 0 : Math.min(1, cells.length - 1), 1)[0], t = g.f(0.28, 0.72);
    if (c.w / c.h > g.f(0.7, 1.5)) cells.push({ ...c, w: c.w * t }, { ...c, x: c.x + c.w * t, w: c.w * (1 - t) });
    else cells.push({ ...c, h: c.h * t }, { ...c, y: c.y + c.h * t, h: c.h * (1 - t) });
  }
  const palette = g.pick([
    ["#d23a2a", "#1f4fa0", "#f2c230", "#17171c"],
    ["#c8553d", "#2d5d7b", "#e9b44c", "#2b2b2b"],
    ["#e4572e", "#29335c", "#f3a712", "#669bbc"],
  ]);
  const fills: string[] = cells.map(() => (g.chance(0.32) ? g.pick(palette) : OFF_WHITE));
  if (!fills.some(f => f !== OFF_WHITE)) fills[g.i(0, fills.length - 1)] = palette[0];
  const sw = Math.min(w, h) * 0.02;
  return cells.map((c, k) => s`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${fills[k]}" stroke="#15151a" stroke-width="${sw}"/>`).join("");
});

/** Squares nested low in the frame in neighboring colors, after Albers. */
export const squares = defineKind("squares", "Nested squares", "art", (g, w, h) => {
  const hue = g.f(0, 360), dir = g.pick([-1, 1]), step = g.f(5, 18), sat = g.f(35, 75), L0 = g.f(28, 62);
  const dl = g.f(7, 13) * (L0 > 50 ? -1 : 1), count = g.i(3, 4);
  let out = fill(w, h, hsl(hue, sat, L0));
  const S = Math.min(w, h), ox = (w - S) / 2, oy = (h - S) / 2;
  for (let k = 1; k < count; k++) {
    const side = S * (1 - k * (count === 4 ? 0.22 : 0.28)), m = (S - side) / 2;
    // Margins run 1 : 2 : 3 from bottom to sides to top.
    out += s`<rect x="${ox + m}" y="${oy + m * 1.5}" width="${side}" height="${side}" fill="${hsl(hue + dir * step * k, sat + g.f(-8, 8), L0 + dl * k)}"/>`;
  }
  return out;
});

/** A large haloed circle among small circles, rings and thin lines. */
export const orbits = defineKind("orbits", "Orbiting circles", "art", (g, w, h) => {
  const dark = g.chance(0.55), ink = dark ? "#efe7d6" : "#1c1c22";
  const palette = ["#d9473b", "#f0b62e", "#2f6db5", "#1f9e89", "#7a3e9d", "#e57ea1", ink];
  let out = fill(w, h, dark ? hsl(g.f(200, 250), 30, 14) : hsl(g.f(30, 50), 35, 88));
  for (let k = g.i(2, 3); k > 0; k--) {
    out += s`<line x1="${w * g.f(-0.1, 0.5)}" y1="${h * g.f(0, 1)}" x2="${w * g.f(0.5, 1.1)}" y2="${h * g.f(0, 1)}" stroke="${ink}" stroke-width="${g.f(1, 3)}" opacity="0.7"/>`;
  }
  const cx = w * g.f(0.3, 0.7), cy = h * g.f(0.35, 0.62), R = Math.min(w, h) * g.f(0.2, 0.3);
  out += s`<circle cx="${cx}" cy="${cy}" r="${R * 1.22}" fill="${g.pick(palette)}" opacity="0.35"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="${g.pick(palette)}" opacity="0.92"/>`;
  for (let k = g.i(5, 9); k > 0; k--) {
    const r = Math.min(w, h) * g.f(0.02, 0.1), paint = g.pick(palette);
    out += g.chance(0.25)
      ? s`<circle cx="${w * g.f(0.05, 0.95)}" cy="${h * g.f(0.08, 0.92)}" r="${r}" fill="none" stroke="${paint}" stroke-width="${r * 0.3}"/>`
      : s`<circle cx="${w * g.f(0.05, 0.95)}" cy="${h * g.f(0.08, 0.92)}" r="${r}" fill="${paint}" opacity="0.88"/>`;
  }
  return out;
});

/** A smooth closed shape with `lobes` bulges, through points around a center. */
function blob(g: Rand, cx: number, cy: number, r: number, lobes: number, amp: number): string {
  const count = lobes * 4, phase = g.f(0, Math.PI * 2), ring: Point[] = [];
  for (let k = 0; k < count; k++) {
    const th = (k / count) * Math.PI * 2, rr = r * (1 + amp * Math.sin(lobes * th + phase)) * g.f(0.88, 1.12);
    ring.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
  }
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(ring[count - 1], ring[0]);
  let d = s`M ${start[0]} ${start[1]}`;
  for (let k = 0; k < count; k++) {
    const p = ring[k], m = mid(p, ring[(k + 1) % count]);
    d += s` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  }
  return d + " Z";
}

/** Flat, lobed shapes in bold colors, like cut paper. */
export const cutouts = defineKind("cutouts", "Paper cutouts", "art", (g, w, h) => {
  const palette = g.pick([
    ["#1d4e89", "#e8563f", "#f2c14e", "#2a9d8f", "#111111"],
    ["#264653", "#e76f51", "#f4a261", "#8ab17d", "#ffffff"],
    ["#3b1f5c", "#ff7b54", "#ffd56b", "#4ecdc4", "#f7f4ea"],
  ]);
  let out = fill(w, h, g.pick(["#f6efe2", "#e9eef2", "#f3e1d8", "#1d4e89", "#f0e6c8"]));
  const u = Math.min(w, h);
  for (let k = g.i(3, 6); k > 0; k--) {
    out += `<path d="${blob(g, w * g.f(0.1, 0.9), h * g.f(0.15, 0.85), u * g.f(0.1, 0.24), g.i(3, 7), g.f(0.18, 0.45))}" fill="${g.pick(palette)}"/>`;
  }
  return out;
});

/** A grid of tiles, each holding a circle, half circle, quarter circle or triangle. */
export const bauhaus = defineKind("bauhaus", "Bauhaus tiles", "art", (g, w, h) => {
  const palette = g.pick([
    ["#e63946", "#f1c453", "#1d3557", "#f1faee"],
    ["#d1495b", "#edae49", "#00798c", "#30638e"],
    ["#222222", "#e9e3d5", "#c44536", "#e0a458"],
    ["#3d405b", "#e07a5f", "#f2cc8f", "#81b29a"],
  ]);
  const c = Math.min(w, h) / 3, rows = Math.ceil(h / c), cols = Math.ceil(w / c);
  let out = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * c, y = row * c, a = g.pick(palette);
      let b = g.pick(palette);
      while (b === a) b = g.pick(palette);
      const rot = s` transform="rotate(${90 * g.i(0, 3)} ${x + c / 2} ${y + c / 2})"`;
      out += s`<rect x="${x}" y="${y}" width="${c + 0.5}" height="${c + 0.5}" fill="${a}"/>`;
      switch (g.i(0, 4)) {
        case 0: out += s`<circle cx="${x + c / 2}" cy="${y + c / 2}" r="${c * 0.42}" fill="${b}"/>`; break;
        case 1: out += s`<path d="M${x} ${y + c / 2} A ${c / 2} ${c / 2} 0 0 1 ${x + c} ${y + c / 2}Z" fill="${b}"${rot}/>`; break;
        case 2: out += s`<path d="M${x} ${y} L${x + c} ${y} A ${c} ${c} 0 0 1 ${x} ${y + c}Z" fill="${b}"${rot}/>`; break;
        case 3: out += s`<polygon points="${x},${y} ${x + c},${y} ${x},${y + c}" fill="${b}"${rot}/>`; break;
        default: out += s`<circle cx="${x + c / 2}" cy="${y + c / 2}" r="${c * 0.22}" fill="${b}"/>`;
      }
    }
  }
  return out;
});
