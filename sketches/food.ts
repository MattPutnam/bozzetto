import { fill, hsl, mix, pts, s, type Point } from "../src/core";
import { blob, sketch, sprinkles, table } from "./shared";

const SPRINKLES = ["#f25c78", "#4fb4e6", "#f2c14e", "#7bd389", "#ffffff", "#9b6bd6"];

/** A glazed donut from above, with sprinkles on some. */
export const donut = sketch("donut", "Donut", "food", (g, w, h) => {
  const u = Math.min(w, h), cx = w / 2 + w * g.f(-0.05, 0.05), cy = h / 2 + h * g.f(-0.04, 0.04), R = u * g.f(0.32, 0.38), hole = R * g.f(0.28, 0.34);
  const bg = hsl(g.f(0, 360), g.f(30, 55), g.f(82, 90));
  const glaze = g.pick(["#f49ac1", "#6b3e2e", "#fbf4e8", "#8fd3f4", "#f6d365", "#c9a7eb"]);
  let out = fill(w, h, bg);
  if (g.chance(0.5)) out += s`<circle cx="${cx}" cy="${cy + u * 0.015}" r="${R * 1.28}" fill="#fff" opacity="0.85"/><circle cx="${cx}" cy="${cy + u * 0.015}" r="${R * 1.08}" fill="#000" opacity="0.04"/>`;
  out += s`<circle cx="${cx}" cy="${cy + R * 0.04}" r="${R}" fill="#000" opacity="0.08"/>`;
  out += s`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#d99a5b"/>`;
  out += `<path d="${blob(g, cx, cy, R * 0.86, R * 0.86, g.i(7, 11), 0.07, 0.05)}" fill="${glaze}"/>`;
  out += s`<circle cx="${cx}" cy="${cy}" r="${hole * 1.35}" fill="#d99a5b"/>`;
  out += s`<circle cx="${cx}" cy="${cy}" r="${hole}" fill="${bg}"/>`;
  if (g.chance(0.7)) out += sprinkles(g, cx, cy, hole * 1.5, R * 0.78, g.i(22, 40), R * 0.09, glaze === "#fbf4e8" ? SPRINKLES.slice(0, 4) : SPRINKLES, R * 0.035);
  out += s`<path d="M ${cx - R * 0.55} ${cy - R * 0.45} Q ${cx - R * 0.2} ${cy - R * 0.72} ${cx + R * 0.15} ${cy - R * 0.68}" stroke="#fff" stroke-width="${R * 0.05}" stroke-linecap="round" fill="none" opacity="0.4"/>`;
  return out;
});

/** A whole pizza from above, cut into slices, with toppings. */
export const pizza = sketch("pizza", "Pizza", "food", (g, w, h) => {
  const u = Math.min(w, h), cx = w / 2, cy = h / 2, R = u * g.f(0.38, 0.43), slices = g.pick([6, 8]);
  let out = fill(w, h, g.pick(["#e9dccb", "#d9e4dc", "#e7d5d0", "#2f3a3a"]));
  out += s`<circle cx="${cx}" cy="${cy}" r="${R * 1.08}" fill="#b98a5a"/>`;
  out += s`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#e3a857"/>`;
  out += s`<circle cx="${cx}" cy="${cy}" r="${R * 0.86}" fill="#c7442e"/>`;
  out += `<path d="${blob(g, cx, cy, R * 0.8, R * 0.8, g.i(5, 8), 0.06, 0.08)}" fill="#f6d27a"/>`;
  const kind = g.pick(["pepperoni", "veg", "margherita"]);
  // Toppings sit on two jittered rings (and sometimes the center), so they cover the pie evenly.
  const spots: Point[] = [];
  if (g.chance(0.7)) spots.push([cx + R * g.f(-0.04, 0.04), cy + R * g.f(-0.04, 0.04)]);
  for (const [ringR, count] of [[0.34, g.i(5, 6)], [0.63, g.i(9, 11)]] as const) {
    const a0 = g.f(0, Math.PI * 2), step = (Math.PI * 2) / count;
    for (let k = 0; k < count; k++) {
      const a = a0 + k * step + g.f(-0.18, 0.18) * step, r = R * (ringR + g.f(-0.04, 0.04));
      spots.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  for (const [x, y] of spots) {
    if (kind === "pepperoni") {
      out += s`<circle cx="${x}" cy="${y}" r="${R * g.f(0.085, 0.105)}" fill="#a8322a"/>`;
    } else if (kind === "margherita") {
      out += g.chance(0.55)
        ? s`<ellipse cx="${x}" cy="${y}" rx="${R * g.f(0.08, 0.11)}" ry="${R * g.f(0.065, 0.085)}" fill="#fbf7ec" transform="rotate(${g.f(0, 180)} ${x} ${y})"/>`
        : s`<ellipse cx="${x}" cy="${y}" rx="${R * 0.075}" ry="${R * 0.04}" fill="#3f8a3a" transform="rotate(${g.f(0, 180)} ${x} ${y})"/>`;
    } else {
      out += g.chance(0.5)
        ? s`<circle cx="${x}" cy="${y}" r="${R * 0.05}" fill="none" stroke="#2b2b2b" stroke-width="${R * 0.03}"/>`
        : s`<rect x="${x - R * 0.065}" y="${y - R * 0.025}" width="${R * 0.13}" height="${R * 0.05}" rx="${R * 0.02}" fill="${g.pick(["#4caf50", "#d64545", "#f2c14e"])}" transform="rotate(${g.f(0, 180)} ${x} ${y})"/>`;
    }
  }
  let cuts = "";
  const off = g.f(0, Math.PI);
  for (let k = 0; k < slices / 2; k++) { const a = off + (k * Math.PI * 2) / slices; cuts += s`M ${cx - Math.cos(a) * R} ${cy - Math.sin(a) * R} L ${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} `; }
  out += s`<path d="${cuts.trim()}" stroke="#8a5a2b" stroke-width="${R * 0.018}" opacity="0.55"/>`;
  return out;
});

const SCOOPS = ["#f7c6d0", "#7b4a35", "#fff4dd", "#b8e0b0", "#f6d365", "#c9a7eb", "#f28b66"];

/** One to three scoops on a waffle cone, maybe with a cherry. */
export const iceCream = sketch("ice-cream", "Ice cream", "food", (g, w, h) => {
  const u = Math.min(w, h), cx = w / 2 + w * g.f(-0.04, 0.04), scoops = g.i(1, 3), scale = g.f(1.05, 1.2), clip = g.id("cone");
  // Size the cone so the whole stack fits: cone 3 units tall, each scoop adds about 1.2 scoop radii.
  const units = 3 + scale * (1.85 + 1.25 * (scoops - 1)), cw = Math.min(u * 0.18, (h * 0.84) / units);
  const tipY = h * 0.93, topY = tipY - cw * 3, sr = cw * scale;
  let out = `<defs><clipPath id="${clip}"><polygon points="${pts([[cx - cw, topY], [cx + cw, topY], [cx, tipY]])}"/></clipPath></defs>` + fill(w, h, hsl(g.f(0, 360), g.f(40, 60), g.f(84, 90)));
  out += `<polygon points="${pts([[cx - cw, topY], [cx + cw, topY], [cx, tipY]])}" fill="#e2a65c"/>`;
  let hatch = "";
  for (let k = -6; k <= 6; k++) { const x = cx + k * cw * 0.32; hatch += s`M ${x - cw} ${topY - cw * 0.2} L ${x + cw} ${tipY} M ${x + cw} ${topY - cw * 0.2} L ${x - cw} ${tipY} `; }
  out += s`<path d="${hatch.trim()}" stroke="#b97b36" stroke-width="${cw * 0.05}" clip-path="url(#${clip})"/>`;
  let y = topY;
  for (let k = 0; k < scoops; k++) {
    const r = sr * (1 - k * 0.08), color = g.pick(SCOOPS), sy = y - r * (k === 0 ? 0.8 : 0.75);
    out += s`<circle cx="${cx + g.f(-0.08, 0.08) * r}" cy="${sy}" r="${r}" fill="${color}"/>`;
    if (k === 0) {
      // A scalloped skirt where the first scoop melts over the rim of the cone.
      let d = s`M ${cx - r * 1.05} ${y - r * 0.25}`;
      const bumps = g.i(4, 6);
      for (let b = 0; b < bumps; b++) { const x0 = cx - r * 1.05 + ((b + 1) * r * 2.1) / bumps, dy = r * g.f(0.25, 0.55); d += s` Q ${x0 - r * 1.05 / bumps} ${y + dy} ${x0} ${y}`; }
      out += `<path d="${d} L ${cx + r * 1.05} ${y - r * 0.25} Z" fill="${color}"/>`;
    }
    y = sy - r * 0.5;
  }
  if (g.chance(0.5)) out += s`<path d="M ${cx} ${y + sr * 0.1} q ${sr * 0.1} ${-sr * 0.45} ${sr * 0.35} ${-sr * 0.55}" stroke="#4b7a2a" stroke-width="${sr * 0.06}" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${y + sr * 0.12}" r="${sr * 0.2}" fill="#d62839"/>`;
  return out;
});

/** Nigiri and maki on a dark plate, with chopsticks. */
export const sushi = sketch("sushi", "Sushi", "food", (g, w, h) => {
  const u = Math.min(w, h), bg = g.pick(["#d9cbb5", "#c9d6d0", "#e6ddd0", "#3a3f3a"]);
  let out = fill(w, h, bg);
  const pw = w * 0.82, ph = h * 0.5, px = (w - pw) / 2, py = h * 0.3;
  out += s`<rect x="${px + 4}" y="${py + 6}" width="${pw}" height="${ph}" rx="${ph * 0.12}" fill="#000" opacity="0.12"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${ph * 0.12}" fill="${g.pick(["#1f2328", "#5a2e2a", "#f2efe8"])}"/>`;
  const count = g.i(3, 4), slot = pw / count;
  for (let k = 0; k < count; k++) {
    const x = px + slot * (k + 0.5), y = py + ph * 0.55, kind = g.pick(["salmon", "tuna", "egg", "maki", "maki"]);
    if (kind === "maki") {
      const r = Math.min(slot, ph) * 0.34;
      out += s`<circle cx="${x}" cy="${y}" r="${r}" fill="#1e2b22"/><circle cx="${x}" cy="${y}" r="${r * 0.82}" fill="#fbfaf4"/><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="${g.pick(["#f28b66", "#d94a4a", "#7bc96f", "#f6d365"])}"/>`;
    } else {
      const rw = slot * 0.4, rh = ph * 0.2, fish = { salmon: "#f4895f", tuna: "#c8334a", egg: "#f6cd4c" }[kind]!;
      out += s`<rect x="${x - rw}" y="${y - rh * 0.2}" width="${rw * 2}" height="${rh * 1.4}" rx="${rh * 0.6}" fill="#fbfaf4"/>`;
      out += s`<path d="M ${x - rw * 1.12} ${y} Q ${x - rw * 1.1} ${y - rh * 1.2} ${x} ${y - rh * 1.1} Q ${x + rw * 1.15} ${y - rh * 1.1} ${x + rw * 1.12} ${y + rh * 0.05} Z" fill="${fish}"/>`;
      if (kind === "salmon") out += s`<path d="M ${x - rw * 0.6} ${y - rh * 0.95} q ${rw * 0.15} ${rh * 0.4} ${rw * 0.05} ${rh * 0.85} M ${x} ${y - rh * 1.05} q ${rw * 0.15} ${rh * 0.4} ${rw * 0.05} ${rh * 0.95} M ${x + rw * 0.6} ${y - rh * 0.95} q ${rw * 0.15} ${rh * 0.4} ${rw * 0.05} ${rh * 0.9}" stroke="#ffd2bd" stroke-width="${rh * 0.12}" fill="none" stroke-linecap="round"/>`;
      if (kind === "egg") out += s`<rect x="${x - rw * 0.25}" y="${y - rh * 1.15}" width="${rw * 0.5}" height="${rh * 2.4}" fill="#1e2b22"/>`;
    }
  }
  const cy0 = py + ph + h * 0.08;
  out += s`<path d="M ${w * 0.1} ${cy0} L ${w * 0.88} ${cy0 - h * 0.05} M ${w * 0.1} ${cy0 + u * 0.045} L ${w * 0.88} ${cy0 - h * 0.02}" stroke="${g.pick(["#8b5a3c", "#c23b22", "#2b2b2b"])}" stroke-width="${u * 0.022}" stroke-linecap="round"/>`;
  return out;
});

const SPONGE = ["#f3d9a4", "#7b4a35", "#f7e7c6", "#e9b872"];
const CREAM = ["#fbf4e8", "#f7c6d0", "#f6d365", "#6b3e2e"];

/** A layered slice of cake on a plate, with a berry on top. */
export const cake = sketch("cake", "Slice of cake", "food", (g, w, h) => {
  const u = Math.min(w, h), sponge = g.pick(SPONGE), cream = g.pick(CREAM.filter(c => c !== sponge)), frost = g.chance(0.5) ? cream : g.pick(CREAM);
  let out = table(g, w, h, h * 0.72, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  // The plate is sized to the slice's footprint, and the slice sits centered on it:
  // the front edge in the near half of the plate, the back corner in the far half.
  const cx = w / 2, plateY = h * 0.8, fw = u * g.f(0.3, 0.38), dx = fw * g.f(0.45, 0.6), fh = u * g.f(0.28, 0.34);
  const prx = Math.max(u * 0.46, (fw + dx) * 0.72), pry = prx * 0.22, dy = pry * g.f(0.65, 0.85);
  const x0 = cx - (fw + dx) / 2, yb = plateY + pry * 0.4, yt = yb - fh;
  out += s`<ellipse cx="${cx}" cy="${plateY + pry * 0.12}" rx="${prx}" ry="${pry}" fill="#000" opacity="0.08"/><ellipse cx="${cx}" cy="${plateY}" rx="${prx}" ry="${pry}" fill="#fff"/><ellipse cx="${cx}" cy="${plateY}" rx="${prx * 0.75}" ry="${pry * 0.72}" fill="#000" opacity="0.05"/>`;
  out += `<polygon points="${pts([[x0 + fw, yb], [x0 + fw + dx, yb - dy], [x0 + fw + dx, yt - dy], [x0 + fw, yt]])}" fill="${mix(sponge, "#000000", 0.18)}"/>`;
  const layers = g.i(2, 3) * 2 + 1;
  for (let k = 0; k < layers; k++) {
    const y0 = yt + (fh * k) / layers, isCream = k % 2 === 1;
    out += s`<rect x="${x0}" y="${y0}" width="${fw}" height="${fh / layers + 0.5}" fill="${isCream ? cream : sponge}"/>`;
  }
  out += `<polygon points="${pts([[x0, yt], [x0 + fw, yt], [x0 + fw + dx, yt - dy], [x0 + dx * 0.15, yt - dy * 0.12]])}" fill="${frost}"/>`;
  out += s`<rect x="${x0}" y="${yt}" width="${fw}" height="${fh * 0.06}" fill="${frost}"/>`;
  const tx = x0 + fw * 0.55 + dx * 0.4, ty = yt - dy * 0.45;
  if (g.chance(0.5)) out += s`<path d="M ${tx} ${ty - u * 0.08} C ${tx - u * 0.07} ${ty - u * 0.07} ${tx - u * 0.06} ${ty + u * 0.01} ${tx} ${ty + u * 0.01} C ${tx + u * 0.06} ${ty + u * 0.01} ${tx + u * 0.07} ${ty - u * 0.07} ${tx} ${ty - u * 0.08} Z" fill="#e0384f"/><path d="M ${tx - u * 0.03} ${ty - u * 0.085} L ${tx} ${ty - u * 0.06} L ${tx + u * 0.03} ${ty - u * 0.085}" stroke="#4b8a2a" stroke-width="${u * 0.018}" fill="none" stroke-linecap="round"/>`;
  else out += s`<circle cx="${tx}" cy="${ty - u * 0.03}" r="${u * 0.045}" fill="${frost === "#fbf4e8" ? "#f7c6d0" : "#fbf4e8"}"/><circle cx="${tx}" cy="${ty - u * 0.09}" r="${u * 0.035}" fill="#c1121f"/>`;
  return out;
});

/** A fried egg in a pan or on a plate, sometimes with bacon. */
export const egg = sketch("egg", "Fried egg", "food", (g, w, h) => {
  const u = Math.min(w, h), cx = w / 2, cy = h / 2, pan = g.chance(0.5), R = u * 0.42;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 50), g.f(80, 88)));
  if (pan) out += s`<rect x="${cx + R * 0.8}" y="${cy - R * 0.1}" width="${w}" height="${R * 0.2}" rx="${R * 0.1}" fill="#2b2b2b" transform="rotate(${g.f(-30, 30)} ${cx} ${cy})"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="#3a3a3a"/><circle cx="${cx}" cy="${cy}" r="${R * 0.88}" fill="#2b2b2b"/>`;
  else out += s`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${R * 0.78}" fill="#000" opacity="0.04"/>`;
  if (g.chance(0.45)) for (let k = 0; k < 2; k++) {
    const by = cy + R * (0.25 + k * 0.22), bx = cx - R * 0.5;
    out += s`<path d="M ${bx} ${by} q ${R * 0.12} ${-R * 0.08} ${R * 0.24} 0 t ${R * 0.24} 0 t ${R * 0.24} 0 t ${R * 0.24} 0" stroke="#b5452f" stroke-width="${R * 0.12}" fill="none" stroke-linecap="round"/><path d="M ${bx} ${by} q ${R * 0.12} ${-R * 0.08} ${R * 0.24} 0 t ${R * 0.24} 0 t ${R * 0.24} 0 t ${R * 0.24} 0" stroke="#f2b8a2" stroke-width="${R * 0.035}" fill="none" stroke-linecap="round"/>`;
  }
  const ex = cx + R * g.f(-0.12, 0.12), ey = cy - R * g.f(0.05, 0.2);
  out += `<path d="${blob(g, ex, ey, R * 0.55, R * 0.5, g.i(4, 6), 0.12, 0.08)}" fill="#fbfbf6"/>`;
  const yx = ex + R * g.f(-0.12, 0.12), yy = ey + R * g.f(-0.1, 0.05);
  out += s`<circle cx="${yx}" cy="${yy}" r="${R * 0.2}" fill="#f6a21a"/><circle cx="${yx - R * 0.06}" cy="${yy - R * 0.07}" r="${R * 0.05}" fill="#fff" opacity="0.6"/>`;
  return out;
});

export const food = [donut, pizza, iceCream, sushi, cake, egg];
