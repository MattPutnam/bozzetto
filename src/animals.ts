import { defineKind, facing, fill, hsl, lin, mix, pts, s, type Point } from "./core";

const COATS = [
  ["#e89a4b", "#f7d3a6"],
  ["#8c8c94", "#d9d9de"],
  ["#2b2b30", "#4a4a52"],
  ["#efe9df", "#ffffff"],
  ["#b4865e", "#ead7c0"],
  ["#5b4636", "#9c8067"],
] as const;

/** A cat's face and shoulders. Coat, eyes, tabby stripes and muzzle vary. */
export const cat = defineKind("cat", "Cat", "animal", (g, w, h) => {
  const [fur, light] = g.pick(COATS), whisker = fur === "#efe9df" ? "#555" : "#f4f1ea";
  const u = Math.min(w, h), cx = w / 2, cy = h * 0.5, rx = u * g.f(0.24, 0.29), ry = rx * g.f(0.8, 0.92);
  let out = fill(w, h, hsl(g.f(0, 360), 30, 84));
  out += s`<ellipse cx="${cx}" cy="${cy + ry * 1.7}" rx="${rx * 1.3}" ry="${ry * 1.1}" fill="${fur}"/>`;
  const tip = g.f(0.62, 0.8), up = g.f(1.25, 1.5);
  for (const side of [-1, 1]) {
    const ear: Point[] = [[cx + side * rx * 0.88, cy - ry * 0.3], [cx + side * rx * tip, cy - ry * up], [cx + side * rx * 0.18, cy - ry * 0.85]];
    const mx = (ear[0][0] + ear[1][0] + ear[2][0]) / 3, my = (ear[0][1] + ear[1][1] + ear[2][1]) / 3;
    const inner = ear.map(([x, y]): Point => [mx + (x - mx) * 0.55, my + (y - my) * 0.55 - ry * 0.03]);
    out += `<polygon points="${pts(ear)}" fill="${fur}"/><polygon points="${pts(inner)}" fill="#f2a8a8" opacity="0.85"/>`;
  }
  out += s`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fur}"/>`;
  if (g.chance(0.35)) out += s`<path d="M ${cx} ${cy - ry * 0.98} v ${ry * 0.3} M ${cx - rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22} M ${cx + rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22}" stroke="#000" stroke-opacity="0.18" stroke-width="${rx * 0.08}" stroke-linecap="round"/>`;
  if (g.chance(0.5)) out += s`<ellipse cx="${cx}" cy="${cy + ry * 0.42}" rx="${rx * 0.42}" ry="${ry * 0.3}" fill="${light}"/>`;
  const eye = g.pick(["#9bc53d", "#f2c14e", "#6fb7e0", "#d98c2b"]), slit = g.chance(0.6);
  for (const side of [-1, 1]) {
    out += s`<ellipse cx="${cx + side * rx * 0.4}" cy="${cy - ry * 0.05}" rx="${rx * 0.17}" ry="${ry * 0.2}" fill="${eye}"/>`;
    out += s`<ellipse cx="${cx + side * rx * 0.4}" cy="${cy - ry * 0.05}" rx="${rx * (slit ? 0.045 : 0.1)}" ry="${ry * (slit ? 0.17 : 0.12)}" fill="#111"/>`;
  }
  out += s`<polygon points="${cx - rx * 0.08},${cy + ry * 0.24} ${cx + rx * 0.08},${cy + ry * 0.24} ${cx},${cy + ry * 0.35}" fill="#e07a7a"/>`;
  out += s`<path d="M ${cx} ${cy + ry * 0.35} v ${ry * 0.1} M ${cx - rx * 0.14} ${cy + ry * 0.5} Q ${cx - rx * 0.07} ${cy + ry * 0.56} ${cx} ${cy + ry * 0.45} Q ${cx + rx * 0.07} ${cy + ry * 0.56} ${cx + rx * 0.14} ${cy + ry * 0.5}" stroke="#3a2a2a" stroke-width="${rx * 0.035}" fill="none" stroke-linecap="round"/>`;
  let whiskers = "";
  for (const side of [-1, 1]) for (const k of [-1, 0, 1]) whiskers += s`M ${cx + side * rx * 0.25} ${cy + ry * 0.38 + k * ry * 0.06} L ${cx + side * rx * 1.05} ${cy + ry * 0.3 + k * ry * 0.16} `;
  out += s`<path d="${whiskers.trim()}" stroke="${whisker}" stroke-width="${rx * 0.02}" opacity="0.8"/>`;
  return out;
});

/** A round songbird on a leafy branch, facing either way. */
export const bird = defineKind("bird", "Bird on a branch", "animal", (g, w, h) => {
  const hue = g.f(0, 360), body = hsl(hue, g.f(45, 70), g.f(40, 58)), belly = hsl(hue + g.f(20, 50), g.f(50, 80), g.f(70, 82)), wing = hsl(hue, 45, 28);
  const by = h * g.f(0.68, 0.76), dir = g.pick([1, -1]), cx = w * g.f(0.4, 0.6), sz = Math.min(w, h) * g.f(0.14, 0.19);
  let out = fill(w, h, hsl(g.f(160, 220), 40, 86));
  out += s`<path d="M -10 ${by + h * 0.04} Q ${w * 0.5} ${by - h * 0.03} ${w + 10} ${by + h * g.f(-0.02, 0.06)}" stroke="#6b4a32" stroke-width="${h * 0.035}" stroke-linecap="round" fill="none"/>`;
  for (let k = g.i(2, 4); k > 0; k--) {
    const lx = w * g.f(0.05, 0.95), ly = by + g.f(-4, 4);
    out += s`<ellipse cx="${lx}" cy="${ly - h * 0.03}" rx="${h * 0.05}" ry="${h * 0.022}" fill="${hsl(g.f(90, 140), 40, g.f(35, 50))}" transform="rotate(${g.f(-60, 60)} ${lx} ${ly})"/>`;
  }
  const bx = cx, yy = by - sz * 0.95, hx = bx + sz * 0.7, hy = yy - sz * 0.6;
  out += facing(cx, dir);
  out += s`<polygon points="${bx - sz * 0.7},${yy + sz * 0.1} ${bx - sz * 1.8},${yy + sz * 0.5} ${bx - sz * 1.6},${yy + sz * 0.85}" fill="${wing}"/>`;
  out += s`<path d="M ${bx - sz * 0.15} ${yy + sz * 0.75} l ${-sz * 0.05} ${sz * 0.3} M ${bx + sz * 0.18} ${yy + sz * 0.75} l ${sz * 0.02} ${sz * 0.3}" stroke="#5a3d2b" stroke-width="${sz * 0.07}" stroke-linecap="round"/>`;
  out += s`<ellipse cx="${bx}" cy="${yy}" rx="${sz * 1.05}" ry="${sz * 0.85}" fill="${body}"/><ellipse cx="${bx + sz * 0.25}" cy="${yy + sz * 0.25}" rx="${sz * 0.62}" ry="${sz * 0.5}" fill="${belly}"/>`;
  out += s`<ellipse cx="${bx - sz * 0.25}" cy="${yy}" rx="${sz * 0.75}" ry="${sz * 0.42}" fill="${wing}" transform="rotate(-14 ${bx - sz * 0.25} ${yy})"/>`;
  if (g.chance(0.35)) out += s`<polygon points="${hx - sz * 0.25},${hy - sz * 0.4} ${hx - sz * 0.45},${hy - sz * 0.95} ${hx + sz * 0.1},${hy - sz * 0.5}" fill="${body}"/>`;
  out += s`<circle cx="${hx}" cy="${hy}" r="${sz * 0.55}" fill="${body}"/>`;
  out += s`<polygon points="${hx + sz * 0.48},${hy - sz * 0.1} ${hx + sz * g.f(0.8, 0.95)},${hy + sz * 0.03} ${hx + sz * 0.48},${hy + sz * 0.15}" fill="#f0a23a"/>`;
  out += s`<circle cx="${hx + sz * 0.2}" cy="${hy - sz * 0.08}" r="${sz * 0.085}" fill="#111"/><circle cx="${hx + sz * 0.23}" cy="${hy - sz * 0.11}" r="${sz * 0.025}" fill="#fff"/>`;
  return out + "</g>";
});

/** A fish among weeds and bubbles. Color, stripes and direction vary. */
export const fish = defineKind("fish", "Fish", "animal", (g, w, h) => {
  const waterHue = g.f(180, 215), hue = g.f(0, 360), dir = g.pick([1, -1]), water = g.id("water"), clip = g.id("body");
  const cx = w * g.f(0.42, 0.55), cy = h * g.f(0.4, 0.55), L = Math.min(w, (h * 4) / 3) * g.f(0.2, 0.28), H = L * g.f(0.45, 0.7);
  const bodyD = s`M ${cx - L} ${cy} Q ${cx - L * 0.2} ${cy - H * 1.1} ${cx + L * 0.8} ${cy} Q ${cx - L * 0.2} ${cy + H * 1.1} ${cx - L} ${cy} Z`;
  const fin = hsl(hue + 20, 70, 42);
  let out = `<defs>${lin(water, [hsl(waterHue, 55, 64), hsl(waterHue + 15, 60, 30)])}<clipPath id="${clip}"><path d="${bodyD}"/></clipPath></defs>` + fill(w, h, `url(#${water})`);
  for (let k = g.i(2, 3); k > 0; k--) {
    const x = w * g.f(0.05, 0.95);
    out += s`<path d="M ${x} ${h + 5} C ${x + g.f(-25, 25)} ${h * 0.78} ${x + g.f(-25, 25)} ${h * 0.6} ${x + g.f(-15, 15)} ${h * g.f(0.38, 0.62)}" stroke="${hsl(g.f(100, 150), 40, g.f(25, 40))}" stroke-width="${g.f(5, 10)}" stroke-linecap="round" fill="none"/>`;
  }
  out += facing(cx, dir);
  out += s`<polygon points="${cx + L * 0.7},${cy} ${cx + L * 1.15},${cy - H * 0.62} ${cx + L * 1.02},${cy} ${cx + L * 1.15},${cy + H * 0.62}" fill="${fin}"/>`;
  out += s`<path d="M ${cx - L * 0.35} ${cy - H * 0.45} Q ${cx - L * 0.05} ${cy - H * 1.05} ${cx + L * 0.35} ${cy - H * 0.32} Z" fill="${fin}"/>`;
  out += `<path d="${bodyD}" fill="${hsl(hue, 72, 56)}"/>`;
  if (g.chance(0.65)) {
    const stripe = g.chance(0.5) ? "#fff" : hsl(hue + 20, 60, 28);
    out += `<g clip-path="url(#${clip})" fill="${stripe}" opacity="0.85">`;
    for (let k = 0, count = g.i(2, 3); k < count; k++) out += s`<rect x="${cx - L * 0.45 + k * L * 0.42}" y="${cy - H}" width="${L * 0.12}" height="${H * 2}"/>`;
    out += "</g>";
  }
  out += s`<circle cx="${cx - L * 0.62}" cy="${cy - H * 0.1}" r="${H * 0.14}" fill="#fff"/><circle cx="${cx - L * 0.65}" cy="${cy - H * 0.1}" r="${H * 0.07}" fill="#111"/>`;
  out += "</g>";
  const mouthX = cx - dir * L * 1.1;
  for (let k = 0, count = g.i(2, 4); k < count; k++) {
    out += s`<circle cx="${mouthX - dir * g.f(0, 10)}" cy="${cy - H * 0.3 - k * h * 0.09}" r="${g.f(3, 7)}" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>`;
  }
  return out;
});

/** An owl on a branch at dusk, sometimes with the moon. Plumage, eyes and gaze vary. */
export const owl = defineKind("owl", "Owl", "animal", (g, w, h) => {
  const hue = g.f(200, 290), feather = g.pick(["#8a6a4f", "#6e6a66", "#b08a5e", "#d9d2c5", "#5a4636"]);
  const light = mix(feather, "#ffffff", 0.45), dark = mix(feather, "#000000", 0.28), sky = g.id("sky");
  const u = Math.min(w, h), by = h * 0.84, cx = w / 2, bw = u * g.f(0.19, 0.24), bh = u * g.f(0.29, 0.34), bcy = by - bh * 0.85;
  let out = `<defs>${lin(sky, [hsl(hue, 40, 30), hsl(hue + 30, 45, 62)])}</defs>` + fill(w, h, `url(#${sky})`);
  if (g.chance(0.6)) out += s`<circle cx="${w * g.pick([g.f(0.12, 0.3), g.f(0.7, 0.88)])}" cy="${h * g.f(0.18, 0.32)}" r="${u * 0.08}" fill="hsl(50 60% 92%)"/>`;
  out += s`<path d="M -10 ${by + 4} Q ${w / 2} ${by - h * 0.02} ${w + 10} ${by + h * 0.03}" stroke="#4b3426" stroke-width="${h * 0.04}" stroke-linecap="round" fill="none"/>`;
  for (const side of [-1, 1]) out += s`<polygon points="${cx + side * bw * 0.78},${bcy - bh * 0.55} ${cx + side * bw * g.f(0.8, 0.95)},${bcy - bh * 1.12} ${cx + side * bw * 0.25},${bcy - bh * 0.78}" fill="${feather}"/>`;
  out += s`<ellipse cx="${cx}" cy="${bcy}" rx="${bw}" ry="${bh}" fill="${feather}"/><ellipse cx="${cx}" cy="${bcy + bh * 0.32}" rx="${bw * 0.62}" ry="${bh * 0.58}" fill="${light}"/>`;
  for (const side of [-1, 1]) out += s`<ellipse cx="${cx + side * bw * 0.86}" cy="${bcy + bh * 0.15}" rx="${bw * 0.3}" ry="${bh * 0.6}" fill="${dark}"/>`;
  const iris = g.pick(["#f2c14e", "#f08a24", "#e9d758"]), gx = g.f(-0.06, 0.06) * bw, gy = g.f(-0.04, 0.05) * bw;
  for (const side of [-1, 1]) {
    const ex = cx + side * bw * 0.42, ey = bcy - bh * 0.4;
    out += s`<circle cx="${ex}" cy="${ey}" r="${bw * 0.4}" fill="${light}"/><circle cx="${ex}" cy="${ey}" r="${bw * 0.25}" fill="${iris}"/><circle cx="${ex + gx}" cy="${ey + gy}" r="${bw * 0.13}" fill="#111"/>`;
  }
  out += s`<polygon points="${cx - bw * 0.1},${bcy - bh * 0.25} ${cx + bw * 0.1},${bcy - bh * 0.25} ${cx},${bcy - bh * 0.06}" fill="#e0a43a"/>`;
  out += s`<path d="M ${cx - bw * 0.3} ${by - 2} v 8 M ${cx - bw * 0.18} ${by - 2} v 8 M ${cx + bw * 0.18} ${by - 2} v 8 M ${cx + bw * 0.3} ${by - 2} v 8" stroke="#e0a43a" stroke-width="${bw * 0.06}" stroke-linecap="round"/>`;
  return out;
});
