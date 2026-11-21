import { defineKind, el, fill, hsl, lin, type Point, type Rand, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";
import { compact, curve, dots, glow, oval } from "./shared";

type Face = "none" | "lit" | "dark";

/** A ribbed pumpkin resting on `base`, `r` wide each side, sometimes carved with a friendly face. */
function pumpkin(
  g: Rand,
  cx: number,
  base: number,
  r: number,
  hue: number,
  pale: boolean,
  face: Face,
  dim: number,
): string {
  const ry = r * 0.78;
  const cy = base - ry;
  const tone = (light: number) => (pale ? hsl(hue + 15, 30, 84 + light + dim) : hsl(hue, 85, 52 + light + dim));
  // Outer ribs first, then the middle one over them.
  let out = el("path", {
    d: oval(cx - r * 0.5, cy, r * 0.5, ry) + oval(cx + r * 0.5, cy, r * 0.5, ry),
    fill: tone(-9),
  });
  out += el("path", {
    d: oval(cx - r * 0.24, cy, r * 0.5, ry * 1.01) + oval(cx + r * 0.24, cy, r * 0.5, ry * 1.01),
    fill: tone(-4),
  });
  out += el("ellipse", { cx, cy, rx: r * 0.4, ry: ry * 1.02, fill: tone(0) });
  out += el("ellipse", {
    cx: cx - r * 0.3,
    cy: cy - ry * 0.45,
    rx: r * 0.12,
    ry: ry * 0.2,
    fill: "#fff",
    opacity: "0.2",
  });
  // A curved stem.
  const sw = r * 0.08;
  const sh = r * g.f(0.25, 0.35);
  const top = cy - ry * 0.9;
  out += el("path", {
    d: s`M${cx - sw} ${top} Q ${cx - sw} ${top - sh * 0.8} ${cx + sw * 0.6} ${top - sh}
         L ${cx + sw * 1.8} ${top - sh * 0.8} Q ${cx + sw} ${top - sh * 0.5} ${cx + sw} ${top}Z`,
    fill: hsl(g.f(60, 95), 30, 32),
  });
  if (face === "none") return out;
  const paint = face === "lit" ? "#ffd66b" : hsl(hue + 5, 45, 18);
  const ey = cy - ry * 0.2;
  const ew = r * 0.13;
  const eh = r * 0.22;
  let d = "";
  const round = g.chance(0.35);
  for (const side of [-1, 1]) {
    const ex = cx + side * r * 0.3;
    d += round
      ? s`M${ex - ew} ${ey}a${ew} ${eh * 0.5} 0 1 0 ${ew * 2} 0a${ew} ${eh * 0.5} 0 1 0 ${-ew * 2} 0`
      : s`M${ex - ew} ${ey + eh * 0.5}L${ex} ${ey - eh * 0.5}L${ex + ew} ${ey + eh * 0.5}Z`;
  }
  // A small nose and a crescent smile.
  d += s`M${cx - ew * 0.5} ${cy + ry * 0.12}L${cx} ${cy}L${cx + ew * 0.5} ${cy + ry * 0.12}Z`;
  const mw = r * g.f(0.38, 0.48);
  const my = cy + ry * 0.24;
  d += s`M${cx - mw} ${my} Q ${cx} ${my + ry * 0.6} ${cx + mw} ${my} Q ${cx} ${my + ry * 0.24} ${cx - mw} ${my}Z`;
  out += el("path", { d, fill: paint });
  // A tooth or two left in the smile.
  if (g.chance(0.5))
    out += el("rect", {
      x: cx + r * g.f(-0.2, 0.08),
      y: my + ry * 0.09,
      width: r * 0.11,
      height: ry * 0.11,
      fill: tone(0),
    });
  return out;
}

/** A few pumpkins in a patch or on a hay bale, some carved with friendly faces, lit at dusk. */
export const pumpkins = /* @__PURE__ */ defineKind("pumpkins", "Pumpkins", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dusk = g.chance(0.45);
  const patch = g.chance(0.5);
  const dim = dusk ? -16 : 0;
  const skyId = g.id("sky");
  const glowId = g.id("glow");
  const hue = g.f(195, 220);
  const stops = dusk
    ? [hsl(g.f(240, 265), 35, 30), hsl(g.f(320, 345), 38, 56), hsl(g.f(24, 36), 85, 72)]
    : [hsl(hue, 55, 66), hsl(hue - 5, 50, 90)];
  let out = el("defs", {}, lin(skyId, stops), glow(glowId, "#ffc65a", 0.6));
  out += fill(w, h, `url(#${skyId})`);
  const groundY = h * g.f(0.5, 0.58);
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: dusk ? groundY - h * g.f(0.2, 0.26) : h * g.f(0.14, 0.24),
    r: unit * g.f(0.05, 0.07),
    fill: dusk ? hsl(35, 95, 84) : hsl(52, 100, 94),
  });
  // A far hill with a row of autumn trees.
  const hill = curve(w, groundY - h * g.f(0.02, 0.08), groundY - h * g.f(0.02, 0.08), -h * g.f(0.02, 0.06));
  // Each crown is a short round-capped stroke, its lower half hidden by the hill.
  let crowns = "";
  for (let x = g.f(0, 0.05) * w; x < w; x += Math.max(unit * g.f(0.08, 0.12), w / 16))
    crowns += s`M${x} ${hill.at(x) + unit * 0.05}v${-unit * g.f(0.005, 0.03)}`;
  out += el("path", {
    d: crowns,
    stroke: hsl(g.f(15, 40), 40, 52 + dim),
    "stroke-width": unit * 0.1,
    "stroke-linecap": "round",
  });
  out += el("path", { d: hill.d() + s`V${h}H0Z`, fill: hsl(g.f(70, 95), 25, 56 + dim) });
  const grass = hsl(g.f(45, 75), 40, 50 + dim);
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: grass });
  // A split-rail fence along the back of the field, sometimes.
  if (g.chance(0.6)) {
    const wood = hsl(g.f(20, 32), 25, 40 + dim);
    const fh = unit * 0.07;
    let posts = "";
    for (let x = g.f(0, 0.1) * w; x < w; x += Math.max(unit * 0.2, w / 12)) posts += s`M${x} ${groundY + 2}v${-fh}`;
    out += el("path", {
      d: posts + s`M0 ${groundY - fh * 0.35}H${w}M0 ${groundY - fh * 0.8}H${w}`,
      stroke: wood,
      "stroke-width": unit * 0.012,
    });
  }
  type P = { x: number; base: number; r: number; hue: number; pale: boolean; face: Face };
  const make = (x: number, base: number, r: number): P => ({
    x,
    base,
    r,
    hue: g.f(20, 32),
    pale: g.chance(0.12),
    face: g.chance(dusk ? 0.6 : 0.3) ? (dusk ? "lit" : "dark") : "none",
  });
  const items: P[] = [];
  let what: string;
  if (patch) {
    // Pumpkins scattered over the field, bigger nearer the front.
    const count = Math.min(6, Math.max(3, Math.round((w / unit) * g.f(2.4, 3.2)) + 1));
    const top = groundY + (h - groundY) * 0.3;
    const bottom = h - unit * 0.04;
    for (let k = 0; k < count; k++)
      for (let tries = 0; tries < 30; tries++) {
        const base = g.f(top, bottom);
        const r = unit * (0.055 + 0.06 * ((base - top) / (bottom - top)));
        const x = g.f(r * 1.3, w - r * 1.3);
        // Neighbors may overlap a little at the sides, but never stand one behind another.
        const clear = items.every(o => Math.abs(x - o.x) > (r + o.r) * 0.75);
        if (!clear) continue;
        items.push(make(x, base, r));
        break;
      }
    items.sort((a, b) => a.base - b.base);
    // Vines winding over the ground between them, with a few leaves.
    let vines = "";
    const leaves: Point[] = [];
    for (const p of items) {
      const dir = g.pick([-1, 1]);
      const ex = p.x + dir * p.r * g.f(1.4, 2.2);
      const ey = p.base - p.r * g.f(0.05, 0.3);
      vines += s`M${p.x} ${p.base - p.r * 0.4} Q ${(p.x + ex) / 2} ${p.base + p.r * 0.2} ${ex} ${ey}
                 q ${dir * p.r * 0.25} ${-p.r * 0.2} ${dir * p.r * 0.1} ${-p.r * 0.3}`;
      for (const t of [0.55, 0.95]) {
        leaves.push([p.x + (ex - p.x) * t, p.base + p.r * 0.05 - (t > 0.9 ? p.r * 0.25 : 0)]);
      }
    }
    const vine = hsl(g.f(95, 125), 35, 30 + dim / 2);
    out += el("path", { d: vines, stroke: vine, "stroke-width": unit * 0.008, fill: "none" });
    out += dots(leaves, unit * 0.016, vine);
    what = "in a pumpkin patch";
  } else {
    // A hay bale with pumpkins on top and beside it.
    const bw = Math.min(unit * g.f(0.42, 0.5), w * 0.55);
    const bh = bw * g.f(0.42, 0.5);
    const bx = w / 2 + w * g.f(-0.08, 0.08);
    const base = h * g.f(0.8, 0.86);
    const btop = base - bh;
    const straw = hsl(g.f(40, 50), 55, 66 + dim);
    out += el("ellipse", { cx: bx, cy: base, rx: bw * 0.58, ry: bh * 0.12, fill: "#000", opacity: "0.2" });
    out += el("rect", { x: bx - bw / 2, y: btop, width: bw, height: bh, rx: bh * 0.12, fill: straw });
    out += el("rect", {
      x: bx - bw / 2,
      y: btop,
      width: bw,
      height: bh * 0.18,
      rx: bh * 0.09,
      fill: "#fff",
      opacity: "0.2",
    });
    let tufts = "";
    for (let k = 0; k < 14; k++) {
      const x = bx + bw * g.f(-0.44, 0.38);
      const y = btop + bh * g.f(0.25, 0.92);
      tufts += s`M${x} ${y}h${bw * g.f(0.04, 0.08)}`;
    }
    for (const t of [0.28, 0.72]) tufts += s`M${bx - bw / 2 + bw * t} ${btop}v${bh}`;
    out += el("path", { d: tufts, stroke: "#000", opacity: "0.15", "stroke-width": unit * 0.006 });
    const onTop = g.i(1, 2);
    if (onTop === 1) items.push(make(bx + bw * g.f(-0.1, 0.1), btop + bh * 0.08, bw * g.f(0.24, 0.3)));
    else for (const side of [-1, 1]) items.push(make(bx + side * bw * 0.23, btop + bh * 0.08, bw * g.f(0.17, 0.21)));
    const sides = g.pick([[-1], [1], [-1, 1], [-1, 1]]);
    for (const side of sides) {
      const r = unit * g.f(0.08, 0.11);
      items.push(make(bx + side * (bw / 2 + r * g.f(0.2, 0.6)), base + unit * g.f(0.01, 0.03), r));
    }
    if (g.chance(0.4)) items.push(make(bx + bw * g.f(-0.15, 0.15), base + unit * 0.06, unit * g.f(0.06, 0.08)));
    what = "on and beside a hay bale";
  }
  // At dusk, the frontmost pumpkin is always carved and lit.
  if (dusk && !items.some(p => p.face === "lit")) items[items.length - 1].face = "lit";
  out += el("path", {
    d: items.map(p => oval(p.x, p.base, p.r * 1.05, p.r * 0.12)).join(""),
    fill: "#000",
    opacity: "0.2",
  });
  for (const p of items) {
    if (p.pale && p.face === "lit") p.face = "dark";
    if (p.face === "lit")
      out += el("circle", { cx: p.x, cy: p.base - p.r * 0.7, r: p.r * 2.2, fill: `url(#${glowId})` });
    out += pumpkin(g, p.x, p.base, p.r, p.hue, p.pale, p.face, dim / 2);
  }
  const carved = items.filter(p => p.face !== "none").length;
  const faces =
    carved === 0
      ? ""
      : carved === items.length
        ? `, all carved with friendly faces,`
        : `, ${carved === 1 ? "one" : numberWord(carved)} carved with ${carved === 1 ? "a friendly face" : "friendly faces"},`;
  note.alt(
    `${capitalize(numberWord(items.length))} pumpkins ${what}${faces}${dusk ? " glowing at dusk" : " on a sunny day"}`,
  );
  const main = items.reduce((a, b) => (b.r > a.r ? b : a));
  note.focus(main.x, main.base - main.r * 0.8);
  return compact(out);
});
