import { hsl, mix, pts, s } from "../src/core";
import { blob, sketch, table } from "./shared";

/** A bowl of apples, oranges, pears and bananas on a table. */
export const fruitBowl = sketch("fruit-bowl", "Fruit bowl", "object", (g, w, h) => {
  const u = Math.min(w, h), top = h * g.f(0.6, 0.68), cx = w / 2, bw = u * g.f(0.42, 0.5), rimY = h * g.f(0.6, 0.66), depth = u * 0.22;
  const bowl = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f4f4f", "#d9b44a"]);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(80, 88)), hsl(g.f(15, 40), g.f(25, 40), g.f(45, 62)));
  out += s`<ellipse cx="${cx}" cy="${rimY + depth * 1.02}" rx="${bw * 0.85}" ry="${u * 0.035}" fill="#000" opacity="0.12"/>`;
  // The bowl's opening, drawn before the fruit: a rim, and the shadowed inside seen past it.
  const rimRy = u * 0.045, rim = mix(bowl, "#ffffff", 0.25);
  out += s`<ellipse cx="${cx}" cy="${rimY}" rx="${bw}" ry="${rimRy}" fill="${rim}"/><ellipse cx="${cx}" cy="${rimY + rimRy * 0.08}" rx="${bw * 0.95}" ry="${rimRy * 0.78}" fill="${mix(bowl, "#000000", 0.35)}"/>`;
  // Fruit sits in two rows, sunk into the bowl. The front row is spread across the bowl with some jitter;
  // the back row sits higher, only in the gaps between front fruits, so nothing hides directly behind another.
  type Fruit = { x: number; y: number; draw: (x: number, y: number) => string };
  const fruits: Fruit[] = [];
  const front = g.i(3, 4), slot = (bw * 1.5) / front, place: { x: number; row: number }[] = [];
  for (let k = 0; k < front; k++) place.push({ x: cx - bw * 0.75 + slot * (k + 0.5) + g.f(-0.12, 0.12) * slot, row: 0 });
  for (let k = 0; k < front - 1; k++) {
    if (front === 4 && g.chance(0.3)) continue;
    const gap = (place[k].x + place[k + 1].x) / 2;
    place.push({ x: gap + g.f(-0.1, 0.1) * slot, row: 1 });
  }
  for (const p of place) {
    const kind = g.pick(["apple", "apple", "orange", "pear", "lemon", "banana"]), r = u * g.f(0.08, 0.105);
    // Every fruit's lowest point lands about r below its y, so rows line up whatever the shape:
    // pears and lemons are shorter below their center than an apple, so they sit a little lower.
    // The back row sits only slightly higher than the front, so its bottoms stay below the near rim.
    const drop = kind === "pear" ? r * 0.28 : kind === "lemon" ? r * 0.1 : 0;
    const x = p.x, y = (p.row === 0 ? rimY - r * g.f(0.05, 0.35) : rimY - r * g.f(0.38, 0.58)) + drop;
    fruits.push({ x, y, draw: (fx, fy) => {
      switch (kind) {
        case "apple": { const c = g.pick(["#d62839", "#8cc63f", "#e8573f", "#b5172b"]); return s`<circle cx="${fx}" cy="${fy}" r="${r}" fill="${c}"/><path d="M ${fx} ${fy - r * 0.8} q ${r * 0.05} ${-r * 0.35} ${r * 0.15} ${-r * 0.45}" stroke="#5a3d2b" stroke-width="${r * 0.12}" fill="none" stroke-linecap="round"/><ellipse cx="${fx + r * 0.35}" cy="${fy - r * 1.1}" rx="${r * 0.3}" ry="${r * 0.13}" fill="#4caf50" transform="rotate(-25 ${fx + r * 0.35} ${fy - r * 1.1})"/>`; }
        case "orange": return s`<circle cx="${fx}" cy="${fy}" r="${r * 1.05}" fill="#f28c28"/><circle cx="${fx + r * 0.2}" cy="${fy - r * 0.55}" r="${r * 0.08}" fill="#6b8e23"/>`;
        case "lemon": return s`<ellipse cx="${fx}" cy="${fy}" rx="${r * 1.15}" ry="${r * 0.85}" fill="#f6d33c" transform="rotate(${g.f(-20, 20)} ${fx} ${fy})"/>`;
        case "pear": return s`<path d="M ${fx} ${fy - r * 1.4} C ${fx + r * 0.5} ${fy - r * 1.4} ${fx + r * 0.35} ${fy - r * 0.5} ${fx + r * 0.95} ${fy + r * 0.2} C ${fx + r * 1.2} ${fy + r * 0.9} ${fx - r * 1.2} ${fy + r * 0.9} ${fx - r * 0.95} ${fy + r * 0.2} C ${fx - r * 0.35} ${fy - r * 0.5} ${fx - r * 0.5} ${fy - r * 1.4} ${fx} ${fy - r * 1.4} Z" fill="${g.pick(["#b5c94a", "#d9b44a", "#a0b83a"])}"/><path d="M ${fx} ${fy - r * 1.35} l ${r * 0.08} ${-r * 0.3}" stroke="#5a3d2b" stroke-width="${r * 0.1}" stroke-linecap="round"/>`;
        default: {
          // A banana is flatter than round fruit, so it sits lower to rest on the same surface.
          const by = fy + r * 0.45;
          return s`<path d="M ${fx - r * 1.6} ${by - r * 0.6} Q ${fx} ${by + r * 1.2} ${fx + r * 1.6} ${by - r * 0.7} Q ${fx} ${by + r * 0.4} ${fx - r * 1.6} ${by - r * 0.6} Z" fill="#f4d03f" stroke="#c9a227" stroke-width="${r * 0.06}"/>`;
        }
      }
    } });
  }
  fruits.sort((a, b) => a.y - b.y);
  for (const f of fruits) out += f.draw(f.x, f.y);
  // The bowl's body in front of the fruit: its top edge is the near half of the rim, so fruit shows above it.
  out += s`<path d="M ${cx - bw} ${rimY} A ${bw} ${rimRy} 0 0 0 ${cx + bw} ${rimY} Q ${cx + bw * 0.95} ${rimY + depth} ${cx} ${rimY + depth} Q ${cx - bw * 0.95} ${rimY + depth} ${cx - bw} ${rimY} Z" fill="${bowl}"/>`;
  out += s`<path d="M ${cx - bw} ${rimY} A ${bw} ${rimRy} 0 0 0 ${cx + bw} ${rimY}" stroke="${rim}" stroke-width="${u * 0.014}" fill="none"/>`;
  out += s`<path d="M ${cx - bw * 0.7} ${rimY + depth * 0.35} Q ${cx - bw * 0.5} ${rimY + depth * 0.75} ${cx - bw * 0.2} ${rimY + depth * 0.82}" stroke="#fff" stroke-width="${u * 0.012}" fill="none" opacity="0.35" stroke-linecap="round"/>`;
  return out;
});

/** A vase of round flowers on a table. */
export const flowers = sketch("flowers", "Vase of flowers", "object", (g, w, h) => {
  const u = Math.min(w, h), top = h * g.f(0.74, 0.8), cx = w / 2 + w * g.f(-0.05, 0.05), vw = u * g.f(0.1, 0.14), vh = u * g.f(0.24, 0.3), vy = top + u * 0.02;
  const vase = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f6b58", "#e8b04b", "#7a5c9e"]), petalHue = g.f(0, 360);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  const count = g.i(3, 6), heads: { x: number; y: number; r: number }[] = [];
  let stems = "";
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1), x = cx + (t - 0.5) * u * g.f(0.45, 0.6), y = vy - vh - u * g.f(0.12, 0.3) * (1 - Math.abs(t - 0.5));
    heads.push({ x, y, r: u * g.f(0.06, 0.09) });
    stems += s`M ${cx + (t - 0.5) * vw * 0.6} ${vy - vh * 0.8} Q ${cx + (t - 0.5) * vw} ${(y + vy - vh) / 2} ${x} ${y} `;
  }
  out += s`<path d="${stems.trim()}" stroke="#4b7a2a" stroke-width="${u * 0.012}" fill="none"/>`;
  for (let k = g.i(1, 3); k > 0; k--) { const lx = cx + g.f(-1, 1) * u * 0.12, ly = vy - vh - u * g.f(0.03, 0.1); out += s`<ellipse cx="${lx}" cy="${ly}" rx="${u * 0.055}" ry="${u * 0.02}" fill="#5e9c3a" transform="rotate(${g.f(-50, 50)} ${lx} ${ly})"/>`; }
  for (const f of heads) {
    const hue = petalHue + g.f(-40, 40), lobes = g.i(5, 8);
    out += `<path d="${blob(g, f.x, f.y, f.r, f.r, lobes, 0.28, 0.04)}" fill="${hsl(hue, g.f(60, 85), g.f(60, 75))}"/>`;
    out += s`<circle cx="${f.x}" cy="${f.y}" r="${f.r * 0.35}" fill="${g.pick(["#f6c945", "#5a3d2b", "#fff4dd"])}"/>`;
  }
  const shape = g.pick(["round", "tall", "jar"]);
  const vt = vy - vh, neck = vw * (shape === "jar" ? 0.9 : 0.45);
  const d = shape === "round"
    ? s`M ${cx - neck} ${vt} C ${cx - neck} ${vt + vh * 0.25} ${cx - vw * 1.5} ${vt + vh * 0.35} ${cx - vw * 1.2} ${vy - vh * 0.1} Q ${cx - vw * 1.05} ${vy} ${cx} ${vy} Q ${cx + vw * 1.05} ${vy} ${cx + vw * 1.2} ${vy - vh * 0.1} C ${cx + vw * 1.5} ${vt + vh * 0.35} ${cx + neck} ${vt + vh * 0.25} ${cx + neck} ${vt} Z`
    : shape === "tall"
      ? s`M ${cx - neck} ${vt} Q ${cx - vw * 1.1} ${vt + vh * 0.6} ${cx - vw * 0.75} ${vy} H ${cx + vw * 0.75} Q ${cx + vw * 1.1} ${vt + vh * 0.6} ${cx + neck} ${vt} Z`
      : s`M ${cx - neck} ${vt + vh * 0.25} Q ${cx - vw} ${vy} ${cx - vw * 0.6} ${vy} H ${cx + vw * 0.6} Q ${cx + vw} ${vy} ${cx + neck} ${vt + vh * 0.25} Z`;
  out += s`<ellipse cx="${cx}" cy="${vy}" rx="${vw * 1.3}" ry="${u * 0.02}" fill="#000" opacity="0.12"/>`;
  out += `<path d="${d}" fill="${vase}"/>`;
  out += s`<rect x="${cx - neck * 1.15}" y="${(shape === "jar" ? vt + vh * 0.25 : vt) - u * 0.015}" width="${neck * 2.3}" height="${u * 0.025}" rx="${u * 0.01}" fill="${mix(vase, "#000000", 0.15)}"/>`;
  return out;
});

/** A cactus or succulent in a terracotta pot. */
export const cactus = sketch("cactus", "Potted cactus", "object", (g, w, h) => {
  const u = Math.min(w, h), top = h * g.f(0.78, 0.84), cx = w / 2, pw = u * g.f(0.16, 0.2), ph = u * g.f(0.2, 0.25), py = top + u * 0.02;
  const pot = g.pick(["#c4572f", "#d97b4f", "#e9e3d5", "#3e6d8e", "#2b2b2b", "#e8b04b"]), green = hsl(g.f(95, 150), g.f(30, 50), g.f(38, 50));
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  const rimY = py - ph;
  if (g.chance(0.6)) {
    const cw = pw * g.f(0.55, 0.7), ch = u * g.f(0.3, 0.42), cTop = rimY - ch;
    const arms: string[] = [];
    for (const sd of [-1, 1]) if (g.chance(0.7)) {
      const ay = rimY - ch * g.f(0.35, 0.6), reach = cw * g.f(1.1, 1.5), rise = ch * g.f(0.2, 0.4);
      arms.push(s`M ${cx} ${ay} H ${cx + sd * reach} V ${ay - rise}`);
    }
    if (arms.length) out += s`<path d="${arms.join(" ")}" stroke="${green}" stroke-width="${cw * 0.75}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    out += s`<rect x="${cx - cw / 2}" y="${cTop}" width="${cw}" height="${ch + u * 0.02}" rx="${cw / 2}" fill="${green}"/>`;
    out += s`<path d="M ${cx - cw * 0.18} ${cTop + cw * 0.3} V ${rimY} M ${cx + cw * 0.18} ${cTop + cw * 0.3} V ${rimY}" stroke="#000" stroke-opacity="0.12" stroke-width="${cw * 0.06}" stroke-linecap="round"/>`;
    if (g.chance(0.5)) out += `<path d="${blob(g, cx, cTop + cw * 0.05, cw * 0.28, cw * 0.22, 5, 0.3, 0.03)}" fill="${hsl(g.f(320, 380), 75, 68)}"/>`;
  } else {
    const leaves = g.i(7, 11), rr = pw * g.f(1.1, 1.4), cy = rimY - u * 0.05;
    for (let k = 0; k < leaves; k++) {
      const a = Math.PI + (k / (leaves - 1)) * Math.PI, lx = cx + Math.cos(a) * rr * 0.55, ly = cy + Math.sin(a) * rr * 0.55;
      out += s`<ellipse cx="${lx}" cy="${ly}" rx="${rr * 0.5}" ry="${rr * 0.17}" fill="${green}" transform="rotate(${(a * 180) / Math.PI} ${lx} ${ly})"/>`;
    }
    out += s`<ellipse cx="${cx}" cy="${cy}" rx="${rr * 0.32}" ry="${rr * 0.25}" fill="${hsl(g.f(95, 150), 40, 58)}"/>`;
  }
  out += s`<ellipse cx="${cx}" cy="${py}" rx="${pw * 1.1}" ry="${u * 0.018}" fill="#000" opacity="0.12"/>`;
  out += `<polygon points="${pts([[cx - pw, rimY], [cx + pw, rimY], [cx + pw * 0.75, py], [cx - pw * 0.75, py]])}" fill="${pot}"/>`;
  out += s`<rect x="${cx - pw * 1.1}" y="${rimY - u * 0.045}" width="${pw * 2.2}" height="${u * 0.055}" rx="${u * 0.008}" fill="${mix(pot, "#ffffff", 0.12)}"/>`;
  return out;
});

/** A cup of coffee on a saucer, or a mug, with steam. */
export const coffee = sketch("coffee", "Coffee", "object", (g, w, h) => {
  const u = Math.min(w, h), top = h * g.f(0.68, 0.76), cx = w / 2 - u * 0.03, cw = u * g.f(0.17, 0.21), ch = cw * g.f(0.9, 1.15), by = top + u * 0.06, mug = g.chance(0.4);
  const cup = g.pick(["#f4f1ea", "#3e6d8e", "#c4572f", "#e8b04b", "#2f6b58", "#e9a5b5"]), dark = mix(cup, "#000000", 0.15);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(48, 62)));
  if (!mug) out += s`<ellipse cx="${cx}" cy="${by}" rx="${cw * 1.7}" ry="${cw * 0.32}" fill="${dark}"/><ellipse cx="${cx}" cy="${by - cw * 0.05}" rx="${cw * 1.6}" ry="${cw * 0.27}" fill="${cup}"/>`;
  else out += s`<ellipse cx="${cx}" cy="${by}" rx="${cw * 1.2}" ry="${cw * 0.18}" fill="#000" opacity="0.12"/>`;
  const ty = by - ch;
  out += s`<path d="M ${cx + cw * 0.9} ${ty + ch * 0.25} c ${cw * 0.55} ${-ch * 0.05} ${cw * 0.6} ${ch * 0.55} ${cw * 0.02} ${ch * 0.6}" stroke="${cup}" stroke-width="${cw * 0.16}" fill="none" stroke-linecap="round"/>`;
  out += mug
    ? s`<path d="M ${cx - cw} ${ty} V ${by - cw * 0.12} Q ${cx - cw} ${by} ${cx - cw * 0.85} ${by} H ${cx + cw * 0.85} Q ${cx + cw} ${by} ${cx + cw} ${by - cw * 0.12} V ${ty} Z" fill="${cup}"/>`
    : s`<path d="M ${cx - cw} ${ty} Q ${cx - cw} ${by} ${cx} ${by} Q ${cx + cw} ${by} ${cx + cw} ${ty} Z" fill="${cup}"/>`;
  out += s`<ellipse cx="${cx}" cy="${ty}" rx="${cw}" ry="${cw * 0.22}" fill="${dark}"/><ellipse cx="${cx}" cy="${ty + cw * 0.03}" rx="${cw * 0.88}" ry="${cw * 0.17}" fill="${g.pick(["#5a3622", "#7b4a2e", "#c69c6d"])}"/>`;
  if (g.chance(0.5)) out += s`<path d="M ${cx - cw * 0.25} ${ty + cw * 0.02} Q ${cx} ${ty - cw * 0.12} ${cx + cw * 0.25} ${ty + cw * 0.02} Q ${cx} ${ty + cw * 0.14} ${cx - cw * 0.25} ${ty + cw * 0.02} Z" fill="#f1dfc4" opacity="0.9"/>`;
  let steam = "";
  for (let k = -1; k <= 1; k++) { const sx = cx + k * cw * 0.35, len = ch * g.f(0.6, 0.9); steam += s`M ${sx} ${ty - cw * 0.15} q ${cw * 0.18} ${-len * 0.25} 0 ${-len * 0.5} t 0 ${-len * 0.5} `; }
  out += s`<path d="${steam.trim()}" stroke="#fff" stroke-width="${cw * 0.07}" fill="none" stroke-linecap="round" opacity="0.6"/>`;
  return out;
});

/** Books standing and leaning on a shelf, sometimes with a small plant. */
export const books = sketch("books", "Bookshelf", "object", (g, w, h) => {
  const u = Math.min(w, h), shelfY = h * g.f(0.74, 0.8), wall = hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90)), hue = g.f(0, 360);
  let out = s`<rect width="${w}" height="${h}" fill="${wall}"/>`;
  out += s`<rect y="${shelfY}" width="${w}" height="${h * 0.05}" fill="${hsl(g.f(20, 35), 35, 45)}"/><rect y="${shelfY + h * 0.05}" width="${w}" height="${h * 0.02}" fill="#000" opacity="0.1"/>`;
  let x = w * g.f(0.04, 0.12);
  const end = w * g.f(0.85, 0.96);
  const plantAt = g.chance(0.5) ? g.i(2, 5) : -1;
  for (let k = 0; x < end; k++) {
    if (k === plantAt) {
      const pr = u * 0.06;
      out += `<polygon points="${pts([[x, shelfY - pr * 1.6], [x + pr * 1.6, shelfY - pr * 1.6], [x + pr * 1.3, shelfY], [x + pr * 0.3, shelfY]])}" fill="#c4572f"/>`;
      out += `<path d="${blob(g, x + pr * 0.8, shelfY - pr * 2.6, pr * 1.1, pr * 1.0, 6, 0.25, 0.08)}" fill="#4f8a5a"/>`;
      x += pr * 1.6 + u * 0.03;
      continue;
    }
    const bw = u * g.f(0.04, 0.075), bh = h * g.f(0.28, 0.45), color = hsl(hue + g.f(-70, 70), g.f(30, 60), g.f(30, 65));
    const lean = x > w * 0.4 && g.chance(0.12) ? g.f(8, 18) : 0;
    const band = g.chance(0.6) ? s`<rect x="${x}" y="${shelfY - bh * g.f(0.75, 0.85)}" width="${bw}" height="${bh * 0.06}" fill="#fff" opacity="0.45"/>` : "";
    const book = s`<rect x="${x}" y="${shelfY - bh}" width="${bw}" height="${bh}" fill="${color}"/>${band}`;
    out += lean ? s`<g transform="rotate(${lean} ${x + bw} ${shelfY})">${book}</g>` : book;
    x += bw + (lean ? bh * Math.sin((lean * Math.PI) / 180) : u * 0.004);
  }
  return out;
});

const MORANDI = ["#c9b8a4", "#a89f91", "#8e9aa0", "#d7cbb7", "#b07d62", "#6f7d74", "#e3dccf", "#9c8b7a", "#7f8c9a"];

/** Bottles, jars and boxes in muted colors, after Morandi's still lifes. */
export const bottles = sketch("bottles", "Bottles", "object", (g, w, h) => {
  const u = Math.min(w, h), top = h * g.f(0.66, 0.72), base = h * g.f(0.8, 0.86);
  let out = s`<rect width="${w}" height="${h}" fill="${g.pick(["#e6ddd0", "#d9d4c7", "#e8e1d6", "#cfd3cc"])}"/><rect y="${top}" width="${w}" height="${h - top}" fill="${g.pick(["#cdbfa9", "#c3baa8", "#d4c7b0"])}"/>`;
  const count = g.i(3, 5), items: { x: number; draw: string; z: number }[] = [];
  for (let k = 0; k < count; k++) {
    const x = w * (0.2 + (0.6 * (k + g.f(0.2, 0.8))) / count), z = g.f(0, 1), y = base - z * (base - top) * 0.6, c = g.pick(MORANDI), sh = mix(c, "#000000", 0.12);
    const kind = g.pick(["bottle", "bottle", "jar", "box", "vase"]), bw = u * g.f(0.06, 0.1), bh = u * g.f(0.25, 0.5);
    let d: string;
    if (kind === "bottle") d = s`<path d="M ${x - bw} ${y} V ${y - bh * 0.6} Q ${x - bw} ${y - bh * 0.72} ${x - bw * 0.35} ${y - bh * 0.78} V ${y - bh} H ${x + bw * 0.35} V ${y - bh * 0.78} Q ${x + bw} ${y - bh * 0.72} ${x + bw} ${y - bh * 0.6} V ${y} Z" fill="${c}"/>`;
    else if (kind === "jar") d = s`<rect x="${x - bw * 1.3}" y="${y - bh * 0.5}" width="${bw * 2.6}" height="${bh * 0.5}" rx="${bw * 0.3}" fill="${c}"/><rect x="${x - bw * 1.1}" y="${y - bh * 0.56}" width="${bw * 2.2}" height="${bh * 0.08}" fill="${sh}"/>`;
    else if (kind === "box") d = s`<rect x="${x - bw * 1.2}" y="${y - bh * 0.42}" width="${bw * 2.4}" height="${bh * 0.42}" fill="${c}"/><polygon points="${x - bw * 1.2},${y - bh * 0.42} ${x + bw * 1.2},${y - bh * 0.42} ${x + bw * 1.5},${y - bh * 0.48} ${x - bw * 0.9},${y - bh * 0.48}" fill="${mix(c, "#ffffff", 0.2)}"/>`;
    else d = s`<path d="M ${x - bw * 0.4} ${y - bh * 0.8} Q ${x - bw * 1.6} ${y - bh * 0.35} ${x - bw * 0.7} ${y} H ${x + bw * 0.7} Q ${x + bw * 1.6} ${y - bh * 0.35} ${x + bw * 0.4} ${y - bh * 0.8} Z" fill="${c}"/>`;
    d += s`<rect x="${x - bw * 0.55}" y="${y - bh * 0.5}" width="${bw * 0.18}" height="${bh * 0.35}" rx="${bw * 0.09}" fill="#fff" opacity="0.18"/>`;
    items.push({ x, z, draw: d });
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) out += it.draw;
  return out;
});

export const objects = [fruitBowl, flowers, cactus, coffee, books, bottles];
