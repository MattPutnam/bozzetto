import { defineKind, el, hsl, type Point, qpt, type Rand, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { numberWord } from "../../draw/words";
import { bowDef, byColor, compact, dots, giftBox, paper } from "./shared";

/** A drooping string of lights across the top of a wall. */
function wallLights(g: Rand, w: number, h: number, unit: number): string {
  const loops = Math.min(5, Math.max(2, Math.round(w / (unit * 0.45))));
  const span = w / loops;
  const y = h * g.f(0.06, 0.1);
  const sag = unit * g.f(0.06, 0.1);
  let wire = "";
  const bulbs: [Point, string][] = [];
  const hue = g.f(0, 360);
  const multi = g.chance(0.6);
  for (let k = 0; k < loops; k++) {
    const a: Point = [k * span, y];
    const c: Point = [(k + 0.5) * span, y + sag * 2];
    const b: Point = [(k + 1) * span, y];
    wire += s`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
    for (const t of [0.2, 0.4, 0.6, 0.8])
      bulbs.push([qpt(a, c, b, t), multi ? hsl(hue + (bulbs.length % 4) * 90, 80, 66) : "#ffe3a0"]);
  }
  let out = el("path", { d: wire, stroke: "#000", opacity: "0.3", "stroke-width": unit * 0.005, fill: "none" });
  const r = unit * 0.011;
  out += dots(
    bulbs.map(([p]) => p),
    r * 2.4,
    "#fff2c8",
    "0.25",
  );
  // Each bulb is a short round-capped stroke, a little taller than wide.
  const lit = byColor();
  for (const [p, color] of bulbs) lit.add(color, s`M${p[0]} ${p[1] + r * 0.5}v${r * 0.8}`);
  for (const [color, d] of lit.groups)
    out += el("path", { d, stroke: color, "stroke-width": r * 2, "stroke-linecap": "round" });
  return out;
}

/**
 * A pile of wrapped presents with ribbons and bows, in different sizes and papers.
 *
 * @category Holidays
 */
export const gifts = /* @__PURE__ */ defineKind("gifts", "Wrapped gifts", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallHue = g.f(0, 360);
  const top = h * g.f(0.66, 0.72);
  let out = table(g, w, h, top, hsl(wallHue, g.f(15, 35), g.f(78, 88)), hsl(g.f(18, 38), g.f(20, 35), g.f(44, 58)));
  if (g.chance(0.5)) out += wallLights(g, w, h, unit);
  const base = h - (h - top) * g.f(0.3, 0.4);
  const bowId = g.id("bow");
  let defs = bowDef(bowId);
  let boxes = "";
  let count = 0;
  // Each layer of the pile: its boxes, after their shadows.
  let shadows = "";
  let layer = "";
  // A few wrapping papers, shared among the boxes.
  const scale = unit * g.f(0.035, 0.05);
  const papers = Array.from({ length: g.i(3, 4) }, (_, k) => ({ p: paper(g), id: g.id(`p${k}`), used: false }));
  let last = -1;
  const add = (x: number, b: number, bw: number, bh: number, bow: boolean) => {
    // Neighbours get different papers.
    let k = g.i(0, papers.length - 2);
    if (k >= last) k++;
    last = k;
    const wrap = papers[k];
    const [def, shadow, box] = giftBox(wrap.id, x, b, bw, bh, bw * 0.28, wrap.p, scale, bow && bowId);
    if (!wrap.used) defs += def;
    wrap.used = true;
    shadows += shadow;
    layer += box;
    count++;
  };
  const flush = () => {
    if (shadows) boxes += el("path", { d: shadows, fill: "#000", opacity: "0.15" });
    boxes += layer;
    shadows = layer = "";
  };
  // The bottom row, side by side.
  const n = Math.min(4, Math.max(2, Math.round((w / unit) * g.f(1.2, 1.6)) + 1));
  // Bigger boxes in a tall picture, which has room above them.
  const grow = Math.min(1.3, Math.max(1, h / w));
  const row = Array.from({ length: n }, () => {
    const bw = unit * g.f(0.2, 0.3) * grow;
    return { bw, bh: Math.min(unit * 0.3 * grow, bw * g.f(0.6, 1.15)), x: 0, stacked: g.chance(0.45) };
  });
  const gap = unit * 0.015;
  let total = row.reduce((sum, b) => sum + b.bw, 0) + gap * (n - 1) + row[n - 1].bw * 0.28;
  const shrink = Math.min(1, (w * 0.9) / total);
  total *= shrink;
  let cursor = (w - total) / 2;
  for (const b of row) {
    b.bw *= shrink;
    b.bh *= shrink;
    b.x = cursor;
    cursor += b.bw + gap * shrink;
  }
  // At least one box carries another on top.
  if (!row.some(b => b.stacked)) row.reduce((a, b) => (b.bw > a.bw ? b : a)).stacked = true;
  const upper: { x: number; b: number; bw: number; bh: number; stacked: boolean }[] = [];
  for (const b of row) {
    add(b.x, base, b.bw, b.bh, !b.stacked);
    if (!b.stacked) continue;
    const d = b.bw * 0.28;
    const bw = b.bw * g.f(0.5, 0.75);
    upper.push({
      x: b.x + d * 0.25 + (b.bw - bw) * g.f(0.15, 0.85),
      b: base - b.bh - d * 0.55 * 0.25,
      bw,
      bh: Math.min(unit * 0.18, bw * g.f(0.5, 0.9)),
      stacked: g.chance(0.25),
    });
  }
  flush();
  const third: [number, number, number, number][] = [];
  for (const u of upper) {
    add(u.x, u.b, u.bw, u.bh, !u.stacked);
    if (!u.stacked) continue;
    const d = u.bw * 0.28;
    const bw = u.bw * g.f(0.55, 0.7);
    third.push([u.x + d * 0.25 + (u.bw - bw) * g.f(0.2, 0.8), u.b - u.bh - d * 0.14, bw, bw * g.f(0.5, 0.8)]);
  }
  flush();
  for (const [x, b, bw, bh] of third) add(x, b, bw, bh, true);
  flush();
  // A small present or two in front of the pile.
  const front = g.i(0, n > 3 ? 2 : 1);
  for (let k = 0; k < front; k++) {
    const bw = unit * g.f(0.11, 0.15);
    const x = (w - total) / 2 + (total - bw * 1.3) * ((k + g.f(0.1, 0.9)) / front);
    add(x, base + (h - base) * g.f(0.45, 0.6), bw, bw * g.f(0.6, 0.9), true);
  }
  flush();
  out = el("defs", {}, defs) + out + boxes;
  note.alt(`A pile of ${count > 12 ? "many" : numberWord(count)} wrapped presents with ribbons and bows`);
  note.focus(w / 2, base - unit * 0.2);
  return compact(out);
});
