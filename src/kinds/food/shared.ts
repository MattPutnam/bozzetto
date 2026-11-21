/** Helpers shared by several food kinds. */
import { el, type Point, type Rand, s } from "../../draw/core";

export const SPRINKLES = ["#f25c78", "#4fb4e6", "#f2c14e", "#7bd389", "#ffffff", "#9b6bd6"];

/** A plate seen at an angle: shadow, rim and a faint well. */
export function sidePlate(cx: number, cy: number, rx: number, ry: number, color = "#ffffff"): string {
  let out = el("ellipse", { cx, cy: cy + ry * 0.12, rx, ry, fill: "#000", opacity: "0.08" });
  out += el("ellipse", { cx, cy, rx, ry, fill: color });
  out += el("ellipse", { cx, cy, rx: rx * 0.75, ry: ry * 0.72, fill: "#000", opacity: "0.05" });
  return out;
}

/** A plate seen from above: shadow, rim and a faint well. */
export function topPlate(cx: number, cy: number, r: number, color = "#ffffff"): string {
  let out = el("circle", { cx: cx + r * 0.02, cy: cy + r * 0.04, r, fill: "#000", opacity: "0.1" });
  out += el("circle", { cx, cy, r, fill: color });
  out += el("circle", { cx, cy, r: r * 0.78, fill: "#000", opacity: "0.04" });
  return out;
}

/** `count` points spread evenly over a disc (a jittered sunflower), so toppings don't clump. */
export function spread(g: Rand, cx: number, cy: number, radius: number, count: number, squash = 1): Point[] {
  const phase = g.f(0, Math.PI * 2);
  const out: Point[] = [];
  for (let k = 0; k < count; k++) {
    const dist = radius * Math.sqrt((k + g.f(0.3, 0.7)) / count);
    const angle = phase + k * 2.39996 + g.f(-0.25, 0.25);
    out.push([cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist * squash]);
  }
  return out;
}

/**
 * A fork's outline, flat, in its own frame: `u` runs from the end of the handle (-len/2) to the
 * tips of the tines (len/2), and `v` across it.
 */
export function forkOutline(len: number, width: number, tines: number): Point[] {
  const hw = width * 0.2;
  const tw = width / (tines * 2 - 1);
  const slot = len * 0.3;
  const out: Point[] = [
    [-len / 2, -hw],
    [len * 0.08, -hw * 0.7],
    [len * 0.2, -width / 2],
  ];
  for (let k = 0; k < tines; k++) {
    const v0 = -width / 2 + k * 2 * tw;
    out.push([len / 2, v0], [len / 2, v0 + tw]);
    if (k < tines - 1) out.push([slot, v0 + tw], [slot, v0 + 2 * tw]);
  }
  out.push([len * 0.2, width / 2], [len * 0.08, hw * 0.7], [-len / 2, hw], [-len / 2 - hw * 0.7, 0]);
  return out;
}

export const BOARDS = ["#d9b07a", "#c8955c", "#e3c290", "#b98250"];

/**
 * A glass's outline from its rim at rimY to its bottom at botY, `half(t)` wide at t (0 at the rim,
 * 1 at the bottom), with its rim and bottom seen as ellipses squashed by `tilt`.
 */
export function vessel(cx: number, rimY: number, botY: number, half: (t: number) => number, tilt: number): string {
  const side: Point[] = [];
  for (let k = 0; k <= 12; k++) side.push([half(k / 12), rimY + ((botY - rimY) * k) / 12]);
  const rb = half(1);
  const rr = half(0);
  let d = s`M ${cx - rr} ${rimY}`;
  for (const [hw, y] of side) d += s` L ${cx - hw} ${y}`;
  d += s` A ${rb} ${rb * tilt} 0 0 0 ${cx + rb} ${botY}`;
  for (const [hw, y] of [...side].reverse()) d += s` L ${cx + hw} ${y}`;
  return d + s` A ${rr} ${rr * tilt} 0 0 0 ${cx - rr} ${rimY} Z`;
}

export const CITRUS: [string, string][] = [
  ["#f2c94c", "#f7e08a"],
  ["#7cb342", "#c5e17a"],
  ["#f39a3d", "#f9c37a"],
  ["#f06a5a", "#f7a89a"],
];

/** A wheel of citrus, or of kiwi, seen face on. */
export function fruitWheel(x: number, y: number, r: number, rind: string, flesh: string, kiwi = false): string {
  let out = el("circle", { cx: x, cy: y, r, fill: rind });
  out += el("circle", { cx: x, cy: y, r: r * 0.88, fill: kiwi ? flesh : "#fbf3d6" });
  if (kiwi) {
    let d = "";
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5;
      d += s`M${x + Math.cos(a) * r * 0.42} ${y + Math.sin(a) * r * 0.42}h0.01`;
    }
    out += el("circle", { cx: x, cy: y, r: r * 0.3, fill: "#eef2c8" });
    return out + el("path", { d, stroke: "#2b2b2b", "stroke-width": r * 0.1, "stroke-linecap": "round" });
  }
  out += el("circle", { cx: x, cy: y, r: r * 0.8, fill: flesh });
  let d = "";
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    d += s`M${x} ${y}l${Math.cos(a) * r * 0.8} ${Math.sin(a) * r * 0.8}`;
  }
  return out + el("path", { d, stroke: "#fbf3d6", "stroke-width": r * 0.07 });
}
