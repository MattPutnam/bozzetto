import { defineKind, fill, hsl, lin, pts, qpt, s, type Point } from "./core";

/** Soft hills under a gradient sky and a sun, sometimes with a lone tree. */
export const hills = defineKind("hills", "Rolling hills", "landscape", (g, w, h) => {
  const hue = g.f(0, 360), sky = g.id("sky");
  const a = g.f(0.42, 0.58), b = g.f(0.56, 0.68), c = g.f(0.48, 0.62);
  const y0 = h * g.f(0.76, 0.86), y1 = h * g.f(0.56, 0.7), y2 = h * g.f(0.72, 0.84), qx = w * g.f(0.3, 0.6);
  let out = `<defs>${lin(sky, [hsl(hue, 55, 78), "#fff"])}</defs>` + fill(w, h, `url(#${sky})`);
  out += s`<circle cx="${w * g.f(0.2, 0.8)}" cy="${h * g.f(0.22, 0.38)}" r="${h * g.f(0.07, 0.12)}" fill="${hsl(hue + 180, 80, 88)}"/>`;
  out += s`<path d="M0 ${h * b + h * 0.08} Q ${w * 0.3} ${h * a} ${w * 0.6} ${h * b} T ${w} ${h * c} V ${h} H 0Z" fill="${hsl(hue + 15, 35, 62)}"/>`;
  if (g.chance(0.45)) {
    const [tx, ty] = qpt([0, y0], [qx, y1], [w, y2], g.f(0.2, 0.8)), th = h * g.f(0.1, 0.16);
    out += s`<rect x="${tx - th * 0.05}" y="${ty - th}" width="${th * 0.1}" height="${th + 6}" fill="${hsl(hue + 20, 30, 30)}"/>`;
    out += s`<circle cx="${tx}" cy="${ty - th}" r="${th * g.f(0.35, 0.5)}" fill="${hsl(hue + 40, 38, 36)}"/>`;
  }
  out += s`<path d="M0 ${y0} Q ${qx} ${y1} ${w} ${y2} V ${h} H 0Z" fill="${hsl(hue + 30, 40, 45)}"/>`;
  return out;
});

/** Three jagged ranges fading into the distance. */
export const mountains = defineKind("mountains", "Mountain ranges", "landscape", (g, w, h) => {
  const hue = g.f(180, 260), shift = g.f(-35, 30), sky = g.id("sky");
  let out = `<defs>${lin(sky, [hsl(hue + shift, 45, 70), hsl(hue + shift + 30, 55, 92)])}</defs>` + fill(w, h, `url(#${sky})`);
  if (g.chance(0.7)) out += s`<circle cx="${w * g.f(0.15, 0.85)}" cy="${h * g.f(0.18, 0.32)}" r="${h * g.f(0.05, 0.09)}" fill="${hsl(hue + shift + 180, 70, 92)}"/>`;
  for (let k = 0; k < 3; k++) {
    const base = h * (0.52 + 0.15 * k), amp = h * (0.34 - 0.08 * k), steps = g.i(4, 6) + k;
    const ridge: Point[] = [[0, base - g.f(0, amp * 0.5)]];
    for (let i = 1; i < steps; i++) {
      const x = (w * i) / steps + g.f(-0.3, 0.3) * (w / steps);
      ridge.push([x, i % 2 ? base - amp * g.f(0.55, 1) : base - amp * g.f(0, 0.35)]);
    }
    ridge.push([w, base - g.f(0, amp * 0.6)], [w, h], [0, h]);
    out += `<polygon points="${pts(ridge)}" fill="${hsl(hue + shift + 10, 16 + 8 * k, 64 - 17 * k)}"/>`;
  }
  return out;
});

/** A low sun over the sea, with its reflection broken into streaks. */
export const sea = defineKind("sea", "Sunset sea", "landscape", (g, w, h) => {
  const hue = g.f(-15, 45), hz = h * g.f(0.55, 0.68), cx = w * g.f(0.25, 0.75), r = h * g.f(0.08, 0.14), cy = hz - r * g.f(-0.2, 0.7);
  const sun = hsl(hue + 10, 95, g.f(72, 86)), sky = g.id("sky"), water = g.id("water");
  let out = `<defs>${lin(sky, [hsl(hue + 240, 35, g.f(35, 50)), hsl(hue + 320, 50, 66), hsl(hue, 90, 78)])}${lin(water, [hsl(hue + 220, 35, 40), hsl(hue + 225, 45, 17)])}</defs>` + fill(w, h, `url(#${sky})`);
  out += s`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${sun}"/>`;
  if (g.chance(0.4)) {
    const ix = w * g.f(0, 0.8), iw = w * g.f(0.12, 0.3);
    out += s`<path d="M${ix} ${hz} Q ${ix + iw * 0.4} ${hz - h * g.f(0.04, 0.09)} ${ix + iw} ${hz}Z" fill="${hsl(hue + 250, 30, 25)}"/>`;
  }
  out += s`<rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#${water})"/>`;
  const streaks = g.i(4, 7);
  for (let i = 0; i < streaks; i++) {
    const y = hz + (h - hz) * Math.pow((i + 0.6) / (streaks + 1), 1.3), ww = 2 * r * (1 - (0.6 * i) / streaks) * g.f(0.7, 1.1);
    out += s`<rect x="${cx - ww / 2 + g.f(-4, 4)}" y="${y}" width="${ww}" height="${g.f(1.5, 3.5)}" rx="1.5" fill="${sun}" opacity="${0.75 - i * 0.08}"/>`;
  }
  return out;
});

/** Layered sand ridges under a pale sun. */
export const dunes = defineKind("dunes", "Desert dunes", "landscape", (g, w, h) => {
  const sand = g.f(16, 40), skyHue = g.f(185, 220), sky = g.id("sky");
  let out = `<defs>${lin(sky, [hsl(skyHue, 55, 68), hsl(skyHue - 20, 60, 92)])}</defs>` + fill(w, h, `url(#${sky})`);
  out += s`<circle cx="${w * g.f(0.15, 0.85)}" cy="${h * g.f(0.18, 0.3)}" r="${h * g.f(0.05, 0.08)}" fill="hsl(48 95% 94%)"/>`;
  for (let k = 0; k < 3; k++) {
    const y0 = h * (0.5 + 0.14 * k + g.f(-0.04, 0.04));
    out += s`<path d="M0 ${y0} C ${w * g.f(0.15, 0.4)} ${y0 - h * g.f(0.05, 0.16)} ${w * g.f(0.5, 0.8)} ${y0 + h * g.f(0.02, 0.12)} ${w} ${y0 + h * g.f(-0.1, 0.06)} V ${h} H 0Z" fill="${hsl(sand + k * 4, 58 - 4 * k, 74 - 10 * k)}"/>`;
  }
  return out;
});

const PINE: readonly Point[] = [[0, -1], [0.3, -0.62], [0.17, -0.62], [0.42, -0.3], [0.27, -0.3], [0.5, 0], [-0.5, 0], [-0.27, -0.3], [-0.42, -0.3], [-0.17, -0.62], [-0.3, -0.62]];
const pine = (x: number, y: number, ht: number, wd: number, paint: string) =>
  `<polygon points="${pts(PINE.map(([px, py]): Point => [x + px * wd, y + py * ht]))}" fill="${paint}"/>`;

/** A pale back row of pines and a dark, scattered front row. */
export const forest = defineKind("forest", "Pine forest", "landscape", (g, w, h) => {
  const hue = g.f(90, 165), skyHue = g.f(180, 235), gy = h * g.f(0.66, 0.76), sky = g.id("sky");
  let out = `<defs>${lin(sky, [hsl(skyHue, 45, 76), hsl(skyHue - 30, 50, 93)])}</defs>` + fill(w, h, `url(#${sky})`);
  const back = g.i(9, 14);
  for (let i = 0; i < back; i++) {
    const ht = h * g.f(0.14, 0.26);
    out += pine((w * (i + g.f(0, 1))) / back, gy + g.f(-2, 3), ht, ht * g.f(0.45, 0.6), hsl(hue, 22, g.f(52, 60)));
  }
  out += s`<rect y="${gy}" width="${w}" height="${h - gy}" fill="${hsl(hue, 30, 36)}"/>`;
  const front = Array.from({ length: g.i(4, 8) }, () => ({ x: w * g.f(-0.05, 1.05), y: gy + (h - gy) * g.f(0.15, 0.9) })).sort((a, b) => a.y - b.y);
  for (const t of front) {
    const ht = h * g.f(0.32, 0.55);
    out += pine(t.x, t.y, ht, ht * g.f(0.45, 0.58), hsl(hue + g.f(-10, 10), 35, g.f(18, 28)));
  }
  return out;
});

/** Stars, a full or crescent moon, and dark hills. */
export const night = defineKind("night", "Night sky", "landscape", (g, w, h) => {
  const hue = g.f(210, 285), mx = w * g.f(0.2, 0.8), my = h * g.f(0.18, 0.35), r = h * g.f(0.07, 0.11), crescent = g.chance(0.6), dir = g.pick([-1, 1]);
  const sky = g.id("sky"), bite = g.id("bite");
  let out = `<defs>${lin(sky, [hsl(hue, 50, 9), hsl(hue + 20, 45, 30)])}`;
  if (crescent) out += s`<mask id="${bite}"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="${mx + dir * r * 0.5}" cy="${my - r * 0.25}" r="${r * 0.92}" fill="#000"/></mask>`;
  out += `</defs>` + fill(w, h, `url(#${sky})`);
  const stars = g.i(14, 28);
  for (let i = 0; i < stars; i++) out += s`<circle cx="${w * g.f(0, 1)}" cy="${h * g.f(0, 0.68)}" r="${g.f(0.5, 1.6)}" fill="#fff" opacity="${g.f(0.35, 1)}"/>`;
  out += s`<circle cx="${mx}" cy="${my}" r="${r}" fill="hsl(50 60% 92%)"${crescent ? ` mask="url(#${bite})"` : ""}/>`;
  out += s`<path d="M0 ${h * g.f(0.66, 0.76)} Q ${w * g.f(0.2, 0.5)} ${h * g.f(0.52, 0.66)} ${w} ${h * g.f(0.64, 0.76)} V ${h} H0Z" fill="${hsl(hue, 30, 15)}"/>`;
  out += s`<path d="M0 ${h * g.f(0.8, 0.9)} Q ${w * g.f(0.5, 0.8)} ${h * g.f(0.68, 0.8)} ${w} ${h * g.f(0.82, 0.9)} V ${h} H0Z" fill="${hsl(hue, 25, 8)}"/>`;
  return out;
});

/** Two rows of buildings against a dusk sky; some windows are lit. */
export const city = defineKind("city", "City at dusk", "landscape", (g, w, h) => {
  const hue = g.f(0, 360), sky = g.id("sky"), win = g.id("win");
  let out = `<defs>${lin(sky, [hsl(hue + 220, 40, 28), hsl(hue, 60, 72)])}<pattern id="${win}" width="9" height="12" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="3" height="5" fill="hsl(45 90% 76%)"/></pattern></defs>` + fill(w, h, `url(#${sky})`);
  out += s`<circle cx="${w * g.f(0.15, 0.85)}" cy="${h * g.f(0.3, 0.5)}" r="${h * g.f(0.06, 0.1)}" fill="${hsl(hue + 20, 90, 88)}"/>`;
  for (let x = -5; x < w; ) {
    const bw = w * g.f(0.06, 0.13), bh = h * g.f(0.28, 0.58);
    out += s`<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" fill="${hsl(hue + 230, 18, 42)}"/>`;
    x += bw + g.f(-2, 3);
  }
  for (let x = -5; x < w; ) {
    const bw = w * g.f(0.08, 0.16), bh = h * g.f(0.16, 0.45);
    out += s`<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" fill="${hsl(hue + 230, 22, 18)}"/>`;
    if (g.chance(0.6)) out += s`<rect x="${x + 3}" y="${h - bh + 6}" width="${bw - 6}" height="${bh - 6}" fill="url(#${win})" opacity="${g.f(0.35, 0.9)}"/>`;
    x += bw + g.f(0, 4);
  }
  return out;
});
