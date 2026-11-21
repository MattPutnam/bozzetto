import { defineKind, el, fill, hex, hsl, lin, pts, qpt, s, type Point, type Rand } from "./core";
import { smoothClosed, table } from "./shapes";
import { andList, capitalize, numberWord } from "./words";

/** A soft round glow: `color` fading out from the center. */
const glow = (id: string, color: string, strength = 0.7): string =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": String(strength) }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": "0" }),
  );

/** A gentle curve across the picture: a straight line plus a bump. `d` draws it as one quadratic. */
function curve(w: number, y0: number, y2: number, bump: number) {
  const c = (y0 + y2) / 2 + 2 * bump;
  return {
    at: (x: number) => y0 + ((y2 - y0) * x) / w + (4 * bump * x * (w - x)) / (w * w),
    d: () => s`M0 ${y0} Q ${w / 2} ${c} ${w} ${y2}`,
  };
}

/** Path data without the spaces it doesn't need, around commands and before minus signs. */
const tight = (d: string): string => d.replace(/\s*([A-Za-z])\s*/g, "$1").replace(/ -/g, "-");

/** Markup with every path's data made tight, to keep pictures small. */
const compact = (svg: string): string => svg.replace(/ d="([^"]*)"/g, (_, d: string) => ` d="${tight(d)}"`);

/** Round dots as one path: each a zero-length round-capped stroke. */
const dots = (points: readonly Point[], r: number, paint: string, opacity = "1"): string =>
  points.length
    ? el("path", {
        d: points.map(([x, y]) => s`M${x} ${y}h0`).join(""),
        stroke: paint,
        "stroke-width": r * 2,
        "stroke-linecap": "round",
        opacity,
      })
    : "";

/** Path data for an ellipse, optionally turned by `deg` degrees. */
function oval(cx: number, cy: number, rx: number, ry: number, deg = 0): string {
  const dx = Math.cos((deg * Math.PI) / 180) * rx;
  const dy = Math.sin((deg * Math.PI) / 180) * rx;
  return s`M${cx - dx} ${cy - dy}a${rx} ${ry} ${deg} 1 0 ${dx * 2} ${dy * 2}a${rx} ${ry} ${deg} 1 0 ${-dx * 2} ${-dy * 2}`;
}

/** Paths of the same fill gathered into one element each: `add(color, d)`, then `out()`. */
function byColor() {
  const groups = new Map<string, string>();
  return {
    add: (color: string, d: string) => void groups.set(color, (groups.get(color) ?? "") + d),
    groups,
    out: () => [...groups].map(([fill, d]) => el("path", { d, fill })).join(""),
  };
}

/** A five-pointed star centered at (cx, cy). */
const star = (cx: number, cy: number, r: number, paint: string): string =>
  el("polygon", {
    points: pts(
      Array.from({ length: 10 }, (_, k): Point => {
        const a = (k * Math.PI) / 5 - Math.PI / 2;
        const rr = k % 2 ? r * 0.45 : r;
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      }),
    ),
    fill: paint,
  });

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
export const pumpkins = defineKind("pumpkins", "Pumpkins", (g, w, h, note) => {
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

/** A snowman in a snowy yard: three snowballs, a hat and scarf, a carrot nose and stick arms. */
export const snowman = defineKind("snowman", "Snowman", { hat: ["top-hat", "beanie", "bowler"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = g.pick(["day", "overcast", "evening"] as const);
  const hue = time === "evening" ? g.f(245, 275) : g.f(200, 222);
  const skyId = g.id("sky");
  const stops =
    time === "day"
      ? [hsl(hue, 55, 66), hsl(hue - 5, 50, 92)]
      : time === "overcast"
        ? [hsl(hue, 12, 70), hsl(hue, 15, 88)]
        : [hsl(hue, 32, 36), hsl(g.f(300, 330), 30, 62), hsl(g.f(20, 35), 60, 80)];
  const snow = (light: number) => hsl(hue, time === "evening" ? 25 : 30, light);
  let out = el("defs", {}, lin(skyId, stops));
  out += fill(w, h, `url(#${skyId})`);
  const groundY = h * g.f(0.58, 0.66);
  const far = curve(w, groundY - h * g.f(0.04, 0.1), groundY - h * g.f(0.04, 0.1), -h * g.f(0.02, 0.06));
  out += el("path", { d: far.d() + s`V${h}H0Z`, fill: snow(84) });
  const back = g.pick(["pines", "fence"] as const);
  const green = hsl(g.f(140, 170), 25, time === "evening" ? 26 : 32);
  if (back === "pines") {
    // Snowy pines along the far slope.
    let d = "";
    let caps = "";
    for (let x = g.f(0, 0.1) * w; x < w; x += unit * g.f(0.1, 0.2)) {
      const ht = unit * g.f(0.14, 0.22);
      const wd = ht * 0.32;
      const y = far.at(x) + ht * 0.05;
      d += s`M${x} ${y - ht}L${x + wd} ${y}H${x - wd}Z`;
      caps += s`M${x} ${y - ht}L${x + wd * 0.35} ${y - ht * 0.65}Q${x} ${y - ht * 0.58} ${x - wd * 0.35} ${y - ht * 0.65}Z`;
    }
    out += el("path", { d, fill: green });
    out += el("path", { d: caps, fill: snow(97) });
  }
  const near = curve(w, groundY + h * g.f(-0.03, 0.03), groundY + h * g.f(-0.03, 0.03), -h * g.f(0, 0.04));
  out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(96) });
  if (back === "fence") {
    // A picket fence across the yard, snow on each picket.
    const wood = time === "evening" ? hsl(25, 20, 40) : hsl(g.f(20, 35), g.f(10, 30), g.f(45, 70));
    const ph = unit * g.f(0.1, 0.14);
    const pw = unit * 0.03;
    let d = "";
    let caps = "";
    const step = pw * 2.2;
    for (let x = g.f(0, step); x < w + pw; x += step) {
      const y = near.at(x) - unit * 0.02;
      d += s`M${x - pw / 2} ${y}v${-ph}l${pw / 2} ${-pw * 0.5}l${pw / 2} ${pw * 0.5}v${ph}Z`;
      caps += s`M${x - pw * 0.6} ${y - ph + pw * 0.1}l${pw * 0.6} ${-pw * 0.65}l${pw * 0.6} ${pw * 0.65}Z`;
    }
    let rails = "";
    for (const t of [0.3, 0.75]) {
      const y0 = near.at(0) - unit * 0.02 - ph * t;
      const y1 = near.at(w) - unit * 0.02 - ph * t;
      const ym = near.at(w / 2) - unit * 0.02 - ph * t;
      rails += s`M0 ${y0}Q${w / 2} ${2 * ym - (y0 + y1) / 2} ${w} ${y1}`;
    }
    out += el("path", { d: rails, stroke: wood, "stroke-width": pw * 0.6, fill: "none" });
    out += el("path", { d, fill: wood });
    out += el("path", { d: caps, fill: snow(98) });
    // Snow piled along the foot of the fence.
    out += el("path", {
      d: s`M0 ${near.at(0) - unit * 0.035}Q${w / 2} ${2 * near.at(w / 2) - (near.at(0) + near.at(w)) / 2 - unit * 0.035} ${w} ${near.at(w) - unit * 0.035}V${h}H0Z`,
      fill: snow(96),
    });
  }
  // The snowman: bottom, middle and head, each resting on the one below.
  const x = w * g.f(0.38, 0.62);
  const base = Math.min(h * g.f(0.86, 0.9), h - unit * 0.06);
  const r0 = Math.min((base - h * 0.06) / 4.75, unit * 0.2) * g.f(0.92, 1);
  const r1 = r0 * g.f(0.7, 0.76);
  const r2 = r0 * g.f(0.5, 0.56);
  const y0 = base - r0 * 0.95;
  const y1 = y0 - (r0 + r1) * 0.82;
  const y2 = y1 - (r1 + r2) * 0.84;
  const dir = g.pick([-1, 1]);
  // A soft shadow, and a few snow bumps around the yard.
  let bumps = "";
  for (let k = g.i(2, 4); k > 0; k--) {
    const bx = w * g.f(0, 1);
    if (Math.abs(bx - x) < r0 * 2) continue;
    const by = near.at(bx) + (h - near.at(bx)) * g.f(0.3, 0.8);
    const br = unit * g.f(0.04, 0.08);
    bumps += s`M${bx - br} ${by}a${br} ${br * 0.45} 0 0 1 ${br * 2} 0Z`;
  }
  if (bumps) out += el("path", { d: bumps, fill: snow(90) });
  out += el("ellipse", { cx: x + r0 * 0.2, cy: base, rx: r0 * 1.25, ry: r0 * 0.16, fill: "#000", opacity: "0.12" });
  // Stick arms, behind the middle snowball.
  const bark = hsl(g.f(15, 30), 35, 28);
  let arms = "";
  for (const side of [-1, 1]) {
    const sx = x + side * r1 * 0.7;
    const sy = y1 - r1 * 0.15;
    const ex = x + side * r1 * g.f(1.9, 2.2);
    const ey = y1 - r1 * g.f(0.4, 1.2);
    const mx = sx + (ex - sx) * 0.65;
    const my = sy + (ey - sy) * 0.65;
    arms += s`M${sx} ${sy}L${ex} ${ey}M${mx} ${my}l${side * r1 * 0.25} ${-r1 * 0.35}`;
    arms += s`M${ex} ${ey}l${side * r1 * 0.12} ${-r1 * 0.18}M${ex} ${ey}l${side * r1 * 0.2} ${r1 * 0.02}`;
  }
  out += el("path", {
    d: arms,
    stroke: bark,
    "stroke-width": unit * 0.012,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Each ball in shade, then lit from the upper left.
  for (const [cy, r] of [
    [y0, r0],
    [y1, r1],
    [y2, r2],
  ]) {
    out += el("circle", { cx: x, cy, r, fill: snow(84) });
    out += el("circle", { cx: x - r * 0.1, cy: cy - r * 0.1, r: r * 0.9, fill: snow(98) });
  }
  // Coal buttons, eyes and smile, and a carrot nose.
  const coal = "#2d2b2e";
  const buttons: Point[] = [];
  for (let k = 0; k < 3; k++) buttons.push([x + dir * r1 * 0.05, y1 - r1 * 0.4 + k * r1 * 0.38]);
  if (g.chance(0.5)) buttons.push([x, y0 - r0 * 0.4]);
  out += dots(buttons, r1 * 0.08, coal);
  const eyes: Point[] = [
    [x - r2 * 0.32 + dir * r2 * 0.1, y2 - r2 * 0.2],
    [x + r2 * 0.32 + dir * r2 * 0.1, y2 - r2 * 0.2],
  ];
  out += dots(eyes, r2 * 0.1, coal);
  const smile: Point[] = [];
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.25 + (0.5 * k) / 4);
    smile.push([x + dir * r2 * 0.1 + Math.cos(a) * r2 * 0.45, y2 + Math.sin(a) * r2 * 0.5]);
  }
  out += dots(smile, r2 * 0.055, coal);
  out += el("polygon", {
    points: pts([
      [x + dir * r2 * 0.05, y2 - r2 * 0.06],
      [x + dir * r2 * g.f(0.75, 0.95), y2 + r2 * 0.1],
      [x + dir * r2 * 0.05, y2 + r2 * 0.14],
    ]),
    fill: hsl(g.f(20, 30), 90, 55),
  });
  // The scarf: a band at the neck and a tail hanging down one side.
  const scarfHue = g.f(0, 360);
  const scarf = hsl(scarfHue, g.f(55, 75), g.f(45, 55));
  const stripe = g.chance(0.5) ? hsl(scarfHue + g.pick([0, 40, 180]), 40, 88) : "";
  const ny = y2 + r2 * 0.88;
  const nw = r2 * 1.05;
  const nh = r2 * 0.3;
  const ts = -dir * g.pick([1, 1, -1]);
  const tx = x + ts * r2 * 0.5;
  const tl = r1 * g.f(0.8, 1.1);
  out += el("path", {
    d: s`M${tx - r2 * 0.18} ${ny}L${tx - r2 * 0.18 + ts * r2 * 0.12} ${ny + tl}h${r2 * 0.38}L${tx + r2 * 0.2} ${ny}Z`,
    fill: scarf,
  });
  out += el("path", {
    d: s`M${tx - r2 * 0.18 + ts * r2 * 0.12} ${ny + tl}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}`,
    stroke: scarf,
    "stroke-width": r2 * 0.05,
  });
  if (stripe)
    out += el("path", {
      d: s`M${tx - r2 * 0.16 + ts * r2 * 0.1} ${ny + tl * 0.78}h${r2 * 0.38}M${tx - r2 * 0.17 + ts * r2 * 0.07} ${ny + tl * 0.55}h${r2 * 0.38}`,
      stroke: stripe,
      "stroke-width": r2 * 0.08,
    });
  out += el("path", {
    d: s`M${x - nw} ${ny - nh / 2} Q ${x} ${ny + nh * 0.6} ${x + nw} ${ny - nh / 2}
           L ${x + nw * 0.95} ${ny + nh / 2} Q ${x} ${ny + nh * 1.6} ${x - nw * 0.95} ${ny + nh / 2}Z`,
    fill: scarf,
  });
  if (stripe)
    out += el("path", {
      d: s`M${x - nw * 0.97} ${ny} Q ${x} ${ny + nh * 1.1} ${x + nw * 0.97} ${ny}`,
      stroke: stripe,
      "stroke-width": r2 * 0.08,
      fill: "none",
    });
  // The hat.
  const hat = g.option("hat", g.pick(["top-hat", "top-hat", "beanie", "bowler"] as const));
  const hatHue = g.f(0, 360);
  const crown = y2 - r2 * 0.72;
  if (hat === "top-hat") {
    const felt = g.chance(0.6) ? "#2b2a30" : hsl(hatHue, 35, 30);
    out += el("rect", { x: x - r2 * 0.6, y: crown - r2 * 1.05, width: r2 * 1.2, height: r2 * 1.1, fill: felt });
    out += el("rect", {
      x: x - r2 * 0.6,
      y: crown - r2 * 0.32,
      width: r2 * 1.2,
      height: r2 * 0.22,
      fill: scarf,
    });
    out += el("rect", {
      x: x - r2 * 0.95,
      y: crown - r2 * 0.06,
      width: r2 * 1.9,
      height: r2 * 0.16,
      rx: r2 * 0.08,
      fill: felt,
    });
  } else if (hat === "bowler") {
    const felt = hsl(hatHue, 30, 28);
    out += el("path", {
      d: s`M${x - r2 * 0.6} ${crown}a${r2 * 0.6} ${r2 * 0.62} 0 0 1 ${r2 * 1.2} 0Z`,
      fill: felt,
    });
    out += el("rect", {
      x: x - r2 * 0.6,
      y: crown - r2 * 0.18,
      width: r2 * 1.2,
      height: r2 * 0.14,
      fill: scarf,
    });
    out += el("ellipse", { cx: x, cy: crown, rx: r2 * 0.88, ry: r2 * 0.1, fill: felt });
  } else {
    // A knit beanie with a cuff and a pompom.
    const knit = g.chance(0.5) ? scarf : hsl(hatHue, 55, 50);
    const by = y2 - r2 * 0.45;
    out += el("path", {
      d: s`M${x - r2 * 0.88} ${by}C${x - r2 * 0.9} ${by - r2 * 1.05} ${x + r2 * 0.9} ${by - r2 * 1.05} ${x + r2 * 0.88} ${by}Z`,
      fill: knit,
    });
    out += el("rect", {
      x: x - r2 * 0.94,
      y: by - r2 * 0.12,
      width: r2 * 1.88,
      height: r2 * 0.28,
      rx: r2 * 0.12,
      fill: stripe || hsl(hatHue + 30, 40, 85),
    });
    out += el("circle", { cx: x, cy: by - r2 * 0.8, r: r2 * 0.2, fill: stripe || hsl(hatHue + 30, 40, 88) });
  }
  // Falling snow.
  const flakes = time === "overcast" ? g.i(20, 30) : g.chance(0.45) ? g.i(12, 22) : 0;
  const fl: Point[] = [];
  for (let k = 0; k < flakes; k++) fl.push([w * g.f(0, 1), h * g.f(0, 1)]);
  out += dots(fl, unit * 0.007, "#fff", "0.85");
  const hats = { "top-hat": "a top hat", beanie: "a knit hat", bowler: "a bowler hat" };
  const when = time === "day" ? "on a clear day" : time === "overcast" ? "in falling snow" : "at dusk";
  note.alt(
    `A snowman in ${hats[hat]} and a scarf in a snowy yard${back === "fence" ? " by a picket fence" : " among pines"} ${flakes && time !== "overcast" ? "as snow falls" : when}`,
  );
  note.focus(x, y2);
  note.frame(x - r2 * 1.25, crown - r2 * 1.2, r2 * 2.5, y2 + r2 * 1.1 - (crown - r2 * 1.2));
  return compact(out);
});

type Paper = { base: string; accent: string; style: "plain" | "stripes" | "dots" | "diagonal"; ribbon: string };

/** Wrapping paper: a base color, a pattern and a contrasting ribbon. */
function paper(g: Rand): Paper {
  const hue = g.f(0, 360);
  const style = g.pick(["plain", "stripes", "dots", "diagonal"] as const);
  return {
    base: hsl(hue, g.f(45, 70), g.f(45, 62)),
    accent: g.chance(0.6) ? hsl(hue, 40, 90) : hsl(hue + g.pick([40, 180, -40]), 60, 70),
    style,
    ribbon: g.pick([hsl(g.f(40, 50), 80, 62), hsl(0, 0, 97), hsl(hue + 180, 60, 50), hsl(g.f(340, 360), 65, 52)]),
  };
}

/** A ribbon bow tied at (bx, by): two loops, two tails and a knot, as one shape. */
function bowKnot(bx: number, by: number, br: number, ribbon: string): string {
  // Every part winds the same way, so where they overlap stays filled.
  let d = "";
  for (const sd of [-1, 1]) {
    d += oval(bx + sd * br * 0.7, by - br * 0.3, br * 0.75, br * 0.42, sd * -25);
    const tail: Point[] = [
      [bx + sd * br * 0.6, by + br * 0.7],
      [bx + sd * br * 0.25, by + br * 0.75],
    ];
    if (sd > 0) tail.reverse();
    d += `M${pts([[bx, by], ...tail])}Z`;
  }
  return el("path", { d: d + oval(bx, by - br * 0.05, br * 0.26, br * 0.26), fill: ribbon });
}

/** A bow 10 units across at the origin, kept in `<defs>` for every box to reuse. */
const bowDef = (id: string): string => bowKnot(0, 0, 10, "#000").replace(/ fill="#000"/, ` id="${id}"`);

/**
 * A wrapped box seen from the front and a little above: front face from (x, base - bh) to (x + bw, base),
 * its top and right side going back by `d`. Returns the pattern it needs, its shadow's path data and the box.
 */
function giftBox(
  id: string,
  x: number,
  base: number,
  bw: number,
  bh: number,
  d: number,
  p: Paper,
  scale: number,
  bow: string | false,
): [string, string, string] {
  const dy = d * 0.55;
  const y = base - bh;
  let def = "";
  let paint = p.base;
  if (p.style !== "plain") {
    const q = scale;
    def = el(
      "pattern",
      {
        id,
        width: q,
        height: q,
        patternUnits: "userSpaceOnUse",
        patternTransform: p.style === "diagonal" ? "rotate(45)" : undefined,
      },
      el("rect", { width: q, height: q, fill: p.base }),
      p.style === "dots"
        ? el("path", {
            d: s`M${q * 0.25} ${q * 0.25}h0M${q * 0.75} ${q * 0.75}h0`,
            stroke: p.accent,
            "stroke-width": q * 0.28,
            "stroke-linecap": "round",
          })
        : el("rect", { width: q * 0.4, height: q, fill: p.accent }),
    );
    paint = `url(#${id})`;
  }
  const shadow = oval(x + (bw + d) / 2, base - dy * 0.3, (bw + d) * 0.6, dy * 0.7 + bh * 0.04);
  let out = el("path", { d: s`M${x} ${base}V${y}l${d} ${-dy}h${bw}V${base - dy}l${-d} ${dy}Z`, fill: paint });
  // The ribbon: down the front, crossing on top, down the side.
  const rw = Math.min(bw, bh) * 0.14;
  const mx = x + bw / 2;
  const q = 0.13;
  let ribbon = s`M${mx - rw / 2} ${base}V${y}l${d} ${-dy}h${rw}L${mx + rw / 2} ${y}V${base}Z`;
  ribbon += s`M${x + d * (0.5 - q)} ${y - dy * (0.5 - q)}H${x + bw + d * (0.5 - q)}V${base - dy * (0.5 - q)}
              l${d * q * 2} ${-dy * q * 2}V${y - dy * (0.5 + q)}H${x + d * (0.5 + q)}Z`;
  out += el("path", { d: ribbon, fill: p.ribbon });
  // Light on the top, shade on the side.
  out += el("path", { d: s`M${x} ${y}l${d} ${-dy}h${bw}l${-d} ${dy}Z`, fill: "#fff", opacity: "0.25" });
  out += el("path", { d: s`M${x + bw} ${y}l${d} ${-dy}V${base - dy}l${-d} ${dy}Z`, fill: "#000", opacity: "0.25" });
  if (bow)
    out += el("use", {
      href: `#${bow}`,
      // Two decimals for the scale: rounding it to one would visibly change small bows.
      transform:
        s`translate(${mx + d / 2} ${y - dy / 2})` +
        ` scale(${(Math.max(rw * 1.6, Math.min(bw, bh) * 0.2) / 10).toFixed(2)})`,
      fill: p.ribbon,
    });
  return [def, shadow, out];
}

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

/** A pile of wrapped presents with ribbons and bows, in different sizes and papers. */
export const gifts = defineKind("gifts", "Wrapped gifts", (g, w, h, note) => {
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

/** A decorated evergreen by a window in a cozy room: baubles, string lights, a topper and gifts underneath. */
export const holidayTree = defineKind("holiday-tree", "Holiday tree", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallHue = g.pick([g.f(-20, 45), g.f(-20, 45), g.f(190, 235), g.f(250, 285)]);
  const floorY = h * g.f(0.8, 0.84);
  const glowId = g.id("glow");
  const nightId = g.id("night");
  const nightHue = g.f(215, 240);
  const bowId = g.id("bow");
  let defs =
    bowDef(bowId) + glow(glowId, "#ffd98a", 0.45) + lin(nightId, [hsl(nightHue, 45, 16), hsl(nightHue + 10, 40, 34)]);
  let out = table(g, w, h, floorY, hsl(wallHue, g.f(15, 28), g.f(34, 46)), hsl(g.f(18, 35), g.f(30, 40), g.f(26, 36)));
  out += el("rect", { y: floorY - unit * 0.025, width: w, height: unit * 0.025, fill: "#000", opacity: "0.15" });
  // The tree's size and place, the window beside it.
  const side = g.pick([-1, 1]);
  const starR = unit * g.f(0.045, 0.055);
  const apex = h * 0.05 + starR * 1.5;
  const potH = unit * 0.08;
  const potBase = floorY + unit * 0.03;
  const bottom = potBase - potH - unit * 0.02;
  const th = bottom - apex;
  const tw = Math.min(th * g.f(0.62, 0.72), w * 0.75);
  const tx = w / 2 - side * Math.min(w * g.f(0.08, 0.16), (w - tw) / 2 - unit * 0.02);
  const ww = unit * g.f(0.28, 0.34);
  const wh = Math.min(ww * 1.3, floorY - h * 0.2);
  const wx = Math.max(ww * 0.6, Math.min(w - ww * 0.6, tx + side * (tw / 2 + ww * 0.6 + unit * 0.04)));
  const wy = h * 0.12;
  // The window: snow falling on a night garden, behind a frame and sill.
  const frame = g.chance(0.6) ? hsl(40, 25, 92) : hsl(g.f(20, 35), 35, 32);
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.015,
    y: wy - unit * 0.015,
    width: ww + unit * 0.03,
    height: wh + unit * 0.03,
    fill: frame,
  });
  out += el("rect", { x: wx - ww / 2, y: wy, width: ww, height: wh, fill: `url(#${nightId})` });
  out += el("path", {
    d: s`M${wx - ww / 2} ${wy + wh * 0.82}Q${wx} ${wy + wh * 0.72} ${wx + ww / 2} ${wy + wh * 0.8}V${wy + wh}H${wx - ww / 2}Z`,
    fill: hsl(nightHue, 25, 82),
  });
  const flakes: Point[] = [];
  for (let k = 0; k < 9; k++) flakes.push([wx + ww * g.f(-0.45, 0.45), wy + wh * g.f(0.05, 0.75)]);
  out += dots(flakes, unit * 0.006, "#fff", "0.85");
  out += el("path", {
    d: s`M${wx} ${wy}v${wh}M${wx - ww / 2} ${wy + wh * 0.45}h${ww}`,
    stroke: frame,
    "stroke-width": unit * 0.014,
  });
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.035,
    y: wy + wh,
    width: ww + unit * 0.07,
    height: unit * 0.025,
    fill: frame,
  });
  out += el("rect", {
    x: wx - ww / 2 - unit * 0.035,
    y: wy + wh + unit * 0.025,
    width: ww + unit * 0.07,
    height: unit * 0.01,
    fill: "#000",
    opacity: "0.15",
  });
  // A warm glow around the tree.
  out += el("ellipse", { cx: tx, cy: apex + th * 0.55, rx: tw * 1.1, ry: th * 0.75, fill: `url(#${glowId})` });
  // The trunk and its pot or crate.
  const bark = hsl(g.f(18, 30), 35, 26);
  out += el("rect", {
    x: tx - unit * 0.02,
    y: bottom - unit * 0.04,
    width: unit * 0.04,
    height: unit * 0.08,
    fill: bark,
  });
  const potW = unit * g.f(0.13, 0.17);
  out += el("ellipse", { cx: tx, cy: potBase, rx: potW * 0.75, ry: unit * 0.015, fill: "#000", opacity: "0.2" });
  const potPaint = g.chance(0.5) ? hsl(g.f(0, 360), 40, 45) : hsl(g.f(20, 35), 40, 40);
  out += el("polygon", {
    points: pts([
      [tx - potW / 2, potBase - potH],
      [tx + potW / 2, potBase - potH],
      [tx + potW * 0.4, potBase],
      [tx - potW * 0.4, potBase],
    ]),
    fill: potPaint,
  });
  out += el("rect", {
    x: tx - potW * 0.53,
    y: potBase - potH,
    width: potW * 1.06,
    height: potH * 0.2,
    fill: "#000",
    opacity: "0.15",
  });
  // Tiers of branches, lowest first so each tier above overlaps the one below.
  const tiers = g.i(3, 4);
  const green = g.f(130, 160);
  const half = (y: number) => ((y - apex) / th) * (tw / 2);
  for (let k = tiers - 1; k >= 0; k--) {
    const yb = apex + (th * (k + 1)) / tiers;
    const yt = k === 0 ? apex : apex + ((th * k) / tiers) * 0.55;
    const hw = (tw / 2) * (0.35 + (0.65 * (k + 1)) / tiers);
    const scallops = 2 + k;
    let d = s`M${tx} ${yt}L${tx + hw} ${yb}`;
    for (let j = 0; j < scallops; j++) {
      const x0 = tx + hw - (2 * hw * j) / scallops;
      const x1 = tx + hw - (2 * hw * (j + 1)) / scallops;
      d += s`Q${(x0 + x1) / 2} ${yb + th * 0.04} ${x1} ${yb}`;
    }
    out += el("path", { d: d + "Z", fill: hsl(green, 38, 24 + (tiers - k) * 3) });
  }
  // String lights draped across the tree.
  const strands = g.i(2, 4);
  const lightHue = g.f(0, 360);
  const warm = g.chance(0.35);
  let wire = "";
  const bulbs: [Point, string][] = [];
  for (let k = 0; k < strands; k++) {
    const y = apex + th * (0.22 + (0.68 * (k + g.f(0.3, 0.7))) / strands);
    const y2 = y + th * 0.08;
    const a: Point = [tx - half(y) * 0.92, y];
    const b: Point = [tx + half(y2) * 0.92, y2];
    const c: Point = [tx, (y + y2) / 2 + th * 0.07];
    wire += s`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
    const count = Math.max(4, Math.round((b[0] - a[0]) / (unit * 0.05)));
    for (let j = 0; j < count; j++)
      bulbs.push([qpt(a, c, b, (j + 0.5) / count), warm ? "#ffe6a8" : hsl(lightHue + (bulbs.length % 4) * 90, 85, 68)]);
  }
  out += el("path", { d: wire, stroke: "#000", opacity: "0.25", "stroke-width": unit * 0.004, fill: "none" });
  // Baubles hung among the branches.
  const baubleHue = g.f(0, 360);
  const baubles: Point[] = [];
  const baubleR = unit * g.f(0.017, 0.022);
  const want = Math.round(g.f(8, 13) * (tw / (unit * 0.5)));
  for (let tries = 0; tries < want * 6 && baubles.length < want; tries++) {
    const y = apex + th * g.f(0.22, 0.95);
    const x = tx + half(y) * g.f(-0.8, 0.8);
    if (baubles.some(([bx, by]) => Math.hypot(bx - x, by - y) < baubleR * 3.2)) continue;
    baubles.push([x, y]);
  }
  const balls = byColor();
  for (const [x, y] of baubles) balls.add(hsl(baubleHue + g.pick([0, 0, 120, 200]), 65, 55), s`M${x} ${y}h0`);
  for (const [color, d] of balls.groups)
    out += el("path", { d, stroke: color, "stroke-width": baubleR * 2, "stroke-linecap": "round" });
  out += dots(
    baubles.map(([x, y]): Point => [x - baubleR * 0.35, y - baubleR * 0.35]),
    unit * 0.006,
    "#fff",
    "0.5",
  );
  out += dots(
    bulbs.map(([p]) => p),
    unit * 0.016,
    "#fff2c8",
    "0.3",
  );
  for (const color of new Set(bulbs.map(([, c]) => c)))
    out += dots(
      bulbs.filter(([, c]) => c === color).map(([p]) => p),
      unit * 0.008,
      color,
    );
  // The topper.
  const topper = g.chance(0.75) ? "star" : "bow";
  if (topper === "star") {
    out += el("circle", { cx: tx, cy: apex - starR * 0.2, r: starR * 2, fill: `url(#${glowId})` });
    out += star(tx, apex - starR * 0.2, starR, hsl(g.f(42, 50), 90, 62));
  } else {
    out += bowKnot(tx, apex + starR * 0.3, starR * 0.8, paper(g).ribbon);
  }
  // Presents on the floor under the branches.
  const presents = g.i(2, 3);
  const rows = ["", ""];
  let shadows = "";
  const span = Math.min(tw * 1.1, w * 0.9);
  const sizes = Array.from({ length: presents }, () => unit * g.f(0.09, 0.15));
  const sum = sizes.reduce((a, b) => a + b * 1.3, 0);
  let x = tx - Math.min(span, sum) / 2;
  for (let k = 0; k < presents; k++) {
    const bw = sizes[k];
    const b = potBase + unit * (k % 2 ? 0.05 : 0.02);
    const [def, shadow, box] = giftBox(
      g.id(`p${k}`),
      x,
      b,
      bw,
      bw * g.f(0.6, 1),
      bw * 0.28,
      paper(g),
      unit * 0.035,
      g.chance(0.75) && bowId,
    );
    defs += def;
    shadows += shadow;
    rows[k % 2] += box;
    x += (Math.min(span, sum) / sum) * bw * 1.3;
  }
  out += el("path", { d: shadows, fill: "#000", opacity: "0.15" }) + rows.join("");
  note.alt(
    `A decorated tree with ${topper === "star" ? "a star" : "a bow"} on top and string lights beside a snowy window, ${numberWord(presents)} presents underneath`,
  );
  note.focus(tx, apex + th * 0.4);
  return compact(el("defs", {}, defs) + out);
});

/** An egg drawn around (0, 0), `ry` tall each way: rounder at the bottom. */
const eggPath = (rx: number, ry: number): string =>
  s`M0 ${-ry}C${rx * 0.62} ${-ry} ${rx} ${-ry * 0.3} ${rx} ${ry * 0.2}C${rx} ${ry * 0.72} ${rx * 0.55} ${ry} 0 ${ry}
    C${-rx * 0.55} ${ry} ${-rx} ${ry * 0.72} ${-rx} ${ry * 0.2}C${-rx} ${-ry * 0.3} ${-rx * 0.62} ${-ry} 0 ${-ry}Z`;

/** The painted decoration for one egg, in the egg's own coordinates. */
function eggDecor(g: Rand, rx: number, ry: number, accent: string, second: string): string {
  const style = g.pick(["stripes", "zigzag", "dots", "halves", "plain"] as const);
  if (style === "plain") return "";
  if (style === "stripes") {
    let d = "";
    const count = g.i(2, 3);
    for (let k = 0; k < count; k++) {
      const y = -ry * 0.55 + (ry * 1.15 * (k + 0.5)) / count;
      d += s`M${-rx} ${y}h${rx * 2}`;
    }
    return el("path", { d, stroke: accent, "stroke-width": ry * g.f(0.1, 0.16) });
  }
  if (style === "zigzag") {
    let out = "";
    const rows = g.i(1, 2);
    for (let r = 0; r < rows; r++) {
      const y = rows === 1 ? ry * 0.05 : -ry * 0.3 + r * ry * 0.6;
      const teeth = 6;
      let d = s`M${-rx} ${y}`;
      for (let k = 1; k <= teeth; k++) d += s`L${-rx + (2 * rx * k) / teeth} ${y + (k % 2 ? -ry * 0.12 : ry * 0.12)}`;
      out += el("path", {
        d,
        stroke: r ? second : accent,
        "stroke-width": ry * 0.09,
        fill: "none",
        "stroke-linejoin": "round",
      });
    }
    return out;
  }
  if (style === "dots") {
    const spots: Point[] = [];
    for (let k = 0; k < 14 && spots.length < 7; k++) {
      const p: Point = [rx * g.f(-0.75, 0.75), ry * g.f(-0.7, 0.75)];
      if (spots.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > ry * 0.35)) spots.push(p);
    }
    return dots(spots, ry * 0.1, accent);
  }
  // Two tones meeting at a zigzag, and a thin band above.
  let d = s`M${-rx} ${ry * 0.1}`;
  for (let k = 1; k <= 6; k++) d += s`L${-rx + (rx * k) / 3} ${ry * (k % 2 ? -0.05 : 0.1)}`;
  return (
    el("path", { d: d + s`V${ry}H${-rx}Z`, fill: accent }) +
    el("path", { d: s`M${-rx} ${-ry * 0.35}h${rx * 2}`, stroke: second, "stroke-width": ry * 0.08 })
  );
}

/** A woven basket of painted eggs on the grass. */
export const eggBasket = defineKind("egg-basket", "Basket of eggs", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const clip = g.id("egg");
  const shape = g.id("shape");
  const weave = g.id("weave");
  const gloss = g.id("gloss");
  const hue = g.f(190, 215);
  const groundY = h * g.f(0.46, 0.56);
  const bw = Math.min(unit * g.f(0.52, 0.6), w * 0.62);
  const bh = bw * g.f(0.38, 0.44);
  const cx = w / 2 + w * g.f(-0.06, 0.06);
  const bottom = h * g.f(0.85, 0.89);
  const rimY = bottom - bh;
  const rimRy = bw * 0.12;
  const er = bw * g.f(0.125, 0.14);
  const erx = er * 0.76;
  // The body: the rim's front arc on top, tapering to a rounded base.
  const body = s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${rimY}
                 L${cx + bw * 0.36} ${bottom - bh * 0.15}Q${cx + bw * 0.33} ${bottom} ${cx + bw * 0.25} ${bottom}
                 H${cx - bw * 0.25}Q${cx - bw * 0.33} ${bottom} ${cx - bw * 0.36} ${bottom - bh * 0.15}Z`;
  let out = el(
    "defs",
    {},
    lin(skyId, [hsl(hue, 55, 72), hsl(hue - 10, 45, 92)]),
    el("path", { id: shape, d: eggPath(erx, er) }),
    el("clipPath", { id: clip }, el("path", { d: eggPath(erx, er) })),
    el("clipPath", { id: weave }, el("path", { d: body })),
    // Shade on the egg's lower right and a glint on its upper left, shared by every egg.
    el(
      "g",
      { id: gloss },
      el(
        "g",
        { "clip-path": `url(#${clip})` },
        el("ellipse", { cx: erx * 0.5, cy: er * 0.35, rx: erx * 0.8, ry: er, fill: "#000", opacity: "0.08" }),
      ),
      el("ellipse", { cx: -erx * 0.4, cy: -er * 0.45, rx: erx * 0.16, ry: er * 0.22, fill: "#fff", opacity: "0.5" }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  // Soft clouds of hedges on the horizon, then the meadow with a few flowers.
  const hill = curve(w, groundY - h * g.f(0, 0.05), groundY - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
  const grassHue = g.f(85, 120);
  out += el("path", { d: hill.d() + s`V${h}H0Z`, fill: hsl(grassHue + 10, 30, 64) });
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(grassHue, 42, 58) });
  const flowerHue = g.f(0, 360);
  const blossoms: Point[] = [];
  for (let k = 0; k < 20; k++) {
    const x = w * g.f(0, 1);
    const y = groundY + (h - groundY) * g.f(0.08, 0.98);
    if (Math.abs(x - cx) < bw * 0.6 && y > rimY - bh) continue;
    blossoms.push([x, y]);
  }
  out += dots(blossoms.slice(0, 10), unit * 0.008, "#fff", "0.9");
  out += dots(blossoms.slice(10), unit * 0.008, hsl(flowerHue, 70, 75));
  // The basket's shadow, inside and back rim, and handle.
  const wicker = hsl(g.f(28, 40), g.f(40, 55), g.f(52, 62));
  const darker = hsl(g.f(25, 35), 40, 32);
  const rim = hsl(g.f(30, 40), 45, 66);
  out += el("ellipse", { cx, cy: bottom, rx: bw * 0.5, ry: bw * 0.06, fill: "#000", opacity: "0.15" });
  const hh = bw * g.f(0.45, 0.58);
  out += el("path", {
    d: s`M${cx - bw * 0.45} ${rimY}C${cx - bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY}`,
    stroke: wicker,
    "stroke-width": bw * 0.045,
    fill: "none",
  });
  out += el("path", {
    d: s`M${cx - bw * 0.45} ${rimY}C${cx - bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY}`,
    stroke: "#000",
    opacity: "0.15",
    "stroke-width": bw * 0.045,
    "stroke-dasharray": `${Math.round(bw * 0.03)} ${Math.round(bw * 0.03)}`,
    fill: "none",
  });
  out += el("ellipse", { cx, cy: rimY, rx: bw / 2, ry: rimRy, fill: darker });
  out += el("path", {
    d: s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 1 ${cx + bw / 2} ${rimY}`,
    stroke: rim,
    "stroke-width": bw * 0.035,
    fill: "none",
  });
  // Eggs heaped in the basket: a back row higher up, a front row tucked behind the rim.
  const eggHue = g.f(0, 360);
  const egg = (x: number, y: number, tilt: number, scale: number) => {
    const k = g.i(0, 5);
    const base = hsl(eggHue + k * 60 + g.f(-10, 10), g.f(55, 75), g.f(72, 82));
    const accent = g.chance(0.3) ? "#fff" : hsl(eggHue + k * 60 + g.pick([120, 180, 240]), 60, 58);
    const second = hsl(eggHue + k * 60 + g.pick([60, 200]), 55, 62);
    const decor = eggDecor(g, erx, er, accent, second);
    return el(
      "g",
      { transform: s`translate(${x} ${y}) rotate(${tilt}) scale(${scale})` },
      el("use", { href: `#${shape}`, fill: base }),
      decor && el("g", { "clip-path": `url(#${clip})` }, decor),
      el("use", { href: `#${gloss}` }),
    );
  };
  const inner = bw * 0.82;
  const backs = Math.min(4, Math.max(2, Math.floor(inner / (erx * 1.9))));
  let eggs = 0;
  for (let k = 0; k < backs; k++) {
    const x = cx - inner / 2 + (inner * (k + 0.5)) / backs;
    const lift = Math.cos(((k + 0.5) / backs - 0.5) * Math.PI) * er * 0.35;
    out += egg(x + g.f(-0.1, 0.1) * erx, rimY - er * 0.4 - lift, g.f(-18, 18), g.f(0.92, 1.05));
    eggs++;
  }
  const fronts = backs - 1;
  for (let k = 0; k < fronts; k++) {
    const x = cx - inner / 2 + (inner * (k + 1)) / backs;
    out += egg(x, rimY + rimRy * 0.25, g.f(-22, 22), g.f(0.95, 1.05));
    eggs++;
  }
  // The basket's front, woven, with a thick rim.
  out += el("path", { d: body, fill: wicker });
  let d = "";
  for (let k = 1; k <= 4; k++) {
    const y = rimY + (bh * k) / 5;
    d += s`M${cx - bw / 2} ${y}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${y}`;
  }
  const ribs = 8;
  for (let k = 1; k < ribs; k++) {
    const t = k / ribs - 0.5;
    d += s`M${cx + t * bw} ${rimY}L${cx + t * bw * 0.66} ${bottom}`;
  }
  out += el(
    "g",
    { "clip-path": `url(#${weave})` },
    el("path", { d, stroke: "#000", opacity: "0.16", "stroke-width": bw * 0.012, fill: "none" }),
  );
  out += el("path", {
    d: s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${rimY}`,
    stroke: rim,
    "stroke-width": bw * 0.05,
    "stroke-linecap": "round",
    fill: "none",
  });
  // An egg or two resting on the grass beside the basket.
  const loose = g.i(0, 2);
  const used: number[] = [];
  for (let k = 0; k < loose; k++) {
    const sd = used.includes(-1) ? 1 : used.includes(1) ? -1 : g.pick([-1, 1]);
    used.push(sd);
    const x = cx + sd * (bw / 2 + er * g.f(1.2, 2));
    if (x < er * 1.2 || x > w - er * 1.2) continue;
    const y = Math.min(bottom + unit * g.f(0, 0.04), h - erx - unit * 0.02);
    out += el("ellipse", { cx: x, cy: y, rx: er * 1.05, ry: er * 0.18, fill: "#000", opacity: "0.15" });
    out += egg(x, y - erx * 0.95, sd * g.f(70, 100), 1);
    eggs++;
  }
  // Tufts of grass at the foot of the basket.
  let tufts = "";
  for (let k = 0; k < 5; k++) {
    const x = cx + bw * g.f(-0.45, 0.45);
    const y = bottom + unit * g.f(0, 0.02);
    const t = unit * g.f(0.025, 0.045);
    tufts += s`M${x - t * 0.4} ${y - t}L${x} ${y}L${x + t * 0.3} ${y - t * 1.1}M${x} ${y}V${y - t * 1.2}`;
  }
  out += el("path", {
    d: tufts,
    stroke: hsl(grassHue, 45, 40),
    "stroke-width": unit * 0.006,
    "stroke-linecap": "round",
    fill: "none",
  });
  note.alt(`A woven basket of ${numberWord(eggs)} painted eggs on the grass`);
  note.focus(cx, rimY);
  return compact(out);
});

/**
 * Path data written with relative moves, which keep numbers short. `M`, `L` and `Q` take absolute
 * points; each is written relative to the last point (or, for a move, absolute when that's shorter),
 * measured from the rounded values so the error never builds up. Numbers are rounded to tenths, or to
 * whole pixels when `whole`.
 */
function pen(whole = false) {
  let d = "";
  let at: Point = [0, 0];
  const r = (v: number) => (whole ? Math.round(v) : Math.round(v * 10) / 10);
  const pair = (x: number, y: number) => `${x}${y < 0 ? "" : " "}${y}`;
  const rel = (x: number, y: number) => pair(r(r(x) - at[0]), r(r(y) - at[1]));
  return {
    M(x: number, y: number) {
      const abs = "M" + pair(r(x), r(y));
      const move = "m" + rel(x, y);
      d += d && move.length < abs.length ? move : abs;
      at = [r(x), r(y)];
      return this;
    },
    L(x: number, y: number) {
      d += "l" + rel(x, y);
      at = [r(x), r(y)];
      return this;
    },
    Q(cx: number, cy: number, x: number, y: number) {
      const end = rel(x, y);
      d += "q" + rel(cx, cy) + (end.startsWith("-") ? "" : " ") + end;
      at = [r(x), r(y)];
      return this;
    },
    dot(x: number, y: number) {
      this.M(x, y);
      d += "h0";
      return this;
    },
    get d() {
      return d;
    },
  };
}

/** Round dots as one path: each a zero-length round-capped stroke. */
const penDots = (points: readonly Point[], r: number, paint: string, opacity = "1", whole = true): string => {
  const p = pen(whole);
  for (const [x, y] of points) p.dot(x, y);
  return points.length
    ? el("path", { d: p.d, stroke: paint, "stroke-width": r * 2, "stroke-linecap": "round", opacity })
    : "";
};

/** Round-capped strokes as one path. */
const strokes = (d: string, paint: string, width: number, opacity = "1"): string =>
  d ? el("path", { d, stroke: paint, "stroke-width": width, "stroke-linecap": "round", fill: "none", opacity }) : "";

/** Spreads circles over the frame: each new one at the best of several tries, clear of the others. */
function spread(
  g: Rand,
  placed: [number, number, number][],
  r: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  tries: number,
): [number, number] {
  let best: [number, number] = [g.f(x0, x1), g.f(y0, y1)];
  let score = -Infinity;
  for (let k = 0; k < tries; k++) {
    const x = g.f(x0, x1);
    const y = g.f(y0, y1);
    let gap = Number.MAX_VALUE;
    for (const [px, py, pr] of placed) gap = Math.min(gap, Math.hypot(px - x, py - y) - pr - r);
    if (gap > score) {
      score = gap;
      best = [x, y];
    }
  }
  placed.push([best[0], best[1], r]);
  return best;
}

type Style = "peony" | "willow" | "ring" | "crossette" | "crackle";

/**
 * One burst, drawn around the origin, `r` across each way, in its main and second colors. Smaller,
 * farther bursts have fewer sparks (`detail` below 1), which keeps the markup small.
 */
function burst(g: Rand, style: Style, r: number, main: string, second: string, detail: number): string {
  const some = (lo: number, hi: number) => Math.round(g.f(lo, hi) * detail);
  const gold = hex(g.f(38, 48), 90, 66);
  const spark = hex(50, 100, 94);
  // Sparks fall a little as they fly, more the farther they go.
  const fall = r * g.f(0.08, 0.16);
  const at = (a: number, d: number): Point => [Math.cos(a) * d, Math.sin(a) * d + fall * (d / r) ** 2];
  let out = "";
  if (style === "peony") {
    const count = some(16, 26);
    const streaks = g.chance(0.6);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const tips: Point[] = [];
    const inner: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2 + g.f(-0.08, 0.08);
      const len = r * g.f(0.82, 1);
      if (streaks) {
        const [x0, y0] = at(a, len * 0.3);
        const [x1, y1] = at(a, len * 0.9);
        d.M(x0, y0).L(x1, y1);
      } else for (const t of [0.45, 0.68]) inner.push(at(a, len * t));
      tips.push(at(a, len));
    }
    out += strokes(d.d, main, r * 0.03, "0.75");
    out += penDots(inner, r * 0.025, main, "0.8");
    out += penDots(tips, r * 0.04, g.chance(0.4) ? second : main);
    // A small bright heart of another color, sometimes.
    if (g.chance(0.5)) {
      const heart: Point[] = [];
      for (let k = 0; k < 9; k++) heart.push(at(turn + (k / 9) * Math.PI * 2, r * 0.26));
      out += penDots(heart, r * 0.03, second);
    }
  } else if (style === "willow") {
    // Long trails arching out and hanging down, with glitter at their ends.
    const count = some(12, 18);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const ends: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2 + g.f(-0.1, 0.1);
      const len = r * g.f(0.75, 0.95);
      const cx = Math.cos(a) * len;
      const cy = Math.sin(a) * len * 0.8 - r * 0.15;
      const ex = cx * 0.85;
      const ey = cy * 0.5 + r * g.f(0.55, 0.8);
      d.M(0, 0).Q(cx, cy, ex, ey);
      ends.push([ex, ey], [(cx + ex) / 2, (cy + ey) / 2 + r * 0.05]);
    }
    out += strokes(d.d, gold, r * 0.022, "0.7");
    out += penDots(ends, r * 0.022, spark, "0.9");
  } else if (style === "ring") {
    const count = some(22, 32);
    const ry = g.f(0.4, 1);
    const tilt = g.f(0, Math.PI);
    const ring: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2;
      const x = Math.cos(a) * r * 0.9;
      const y = Math.sin(a) * r * 0.9 * ry;
      ring.push([x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    out += penDots(ring, r * 0.04, main);
    // A little peony at its middle.
    const core: Point[] = [];
    for (let k = 0; k < 8; k++) core.push(at((k / 8) * Math.PI * 2, r * 0.22));
    out += penDots(core, r * 0.03, second);
  } else if (style === "crossette") {
    // Stars that fly out and split into crosses.
    const count = g.i(5, 7);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const split = pen(true);
    const tips: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2;
      const [x0, y0] = at(a, r * 0.1);
      const [x1, y1] = at(a, r * 0.55);
      d.M(x0, y0).L(x1, y1);
      // Four short pieces, drawn as two vees through the split point.
      const ends = [-0.8, -0.27, 0.27, 0.8].map((b): Point => [
        x1 + Math.cos(a + b) * r * 0.4,
        y1 + Math.sin(a + b) * r * 0.4 + fall * 0.5,
      ]);
      split
        .M(...ends[0])
        .L(x1, y1)
        .L(...ends[1])
        .M(...ends[2])
        .L(x1, y1)
        .L(...ends[3]);
      tips.push(...ends);
    }
    out += strokes(d.d, main, r * 0.025, "0.6");
    out += strokes(split.d, second, r * 0.02, "0.75");
    out += penDots(tips, r * 0.032, spark);
  } else {
    // Glitter crackling all through a loose round cloud.
    const count = some(30, 44);
    const glitter: Point[] = [];
    const big: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = g.f(0, Math.PI * 2);
      const p = at(a, r * Math.sqrt(g.f(0.04, 1)));
      (k % 3 ? glitter : big).push(p);
    }
    out += penDots(glitter, r * 0.022, spark, "0.9");
    out += penDots(big, r * 0.04, main);
  }
  return out;
}

/** Fireworks bursting in a night sky over a city skyline, a harbor or wooded hills. */
export const fireworks = defineKind("fireworks", "Fireworks", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(222, 262);
  const skyId = g.id("sky");
  const place = g.pick(["city", "harbor", "hills", "lake"] as const);
  const water = place === "harbor" || place === "lake";
  // Colors: a set of three that agree, or a mix of bright hues.
  const set = g.pick(["mixed", "mixed", "trio", "gold", "near"] as const);
  const startHue = g.f(0, 360);
  const colors =
    set === "trio"
      ? [hex(g.f(350, 362), 85, 62), hex(0, 0, 96), hex(g.f(212, 226), 85, 66)]
      : set === "gold"
        ? [hex(g.f(40, 48), 90, 64), hex(48, 70, 90), hex(g.f(28, 36), 90, 62)]
        : set === "near"
          ? [0, 1, 2].map(k => hex(startHue + k * 35, 85, 64))
          : [0, 1, 2, 3].map(k => hex(startHue + k * g.f(70, 110), 85, 64));
  const glows = colors.map((c, k) => glow(g.id(`glow${k}`), c, 0.35));
  const night = hex(skyHue, 45, 8);
  let defs = lin(skyId, [night, hex(skyHue, 40, 16), hex(skyHue + 15, 35, 26)]) + glows.join("");
  let out = fill(w, h, `url(#${skyId})`);

  // The ground or waterline, and how high the skyline or hills reach above it.
  const line = water ? h - unit * g.f(0.17, 0.23) : h - unit * g.f(0.02, 0.05);
  const rise = unit * (place === "city" || place === "harbor" ? 0.2 : 0.14);
  // A few faint stars.
  const stars: Point[] = [];
  for (let k = Math.round((w / unit) ** 0.6 * g.f(6, 10)); k > 0; k--) stars.push([g.f(0, w), g.f(0, line - rise)]);
  out += penDots(stars, unit * 0.004, hex(skyHue, 40, 90), "0.6");

  // The bursts, biggest first so they get the best places, then drawn far to near.
  const count = Math.min(6, Math.round((w / unit) * g.f(1.3, 1.7) + 1.4));
  type B = { x: number; y: number; r: number; style: Style; main: number; second: number };
  const bursts: B[] = [];
  const placed: [number, number, number][] = [];
  const top = unit * 0.04;
  const bottom = line - rise * 0.9;
  const styles: Style[] = ["peony", "peony", "willow", "ring", "crossette", "crackle"];
  for (let k = 0; k < count; k++) {
    const big = k === 0 ? g.f(0.27, 0.33) : k < Math.max(3, count / 2) ? g.f(0.16, 0.24) : g.f(0.1, 0.15);
    const r = Math.min(unit * big, (bottom - top) * 0.48);
    const [x, y] = spread(g, placed, r * 0.8, r, w - r, top + r, Math.max(top + r, bottom - r), 14);
    const main = g.i(0, colors.length - 1);
    bursts.push({
      x,
      y,
      r,
      // Crackle reads best small: a big one is just a cloud of dots.
      style: r > unit * 0.2 ? g.pick(styles.slice(0, -1)) : g.pick(styles),
      main,
      second: g.chance(0.6) ? (main + 1) % colors.length : main,
    });
  }
  bursts.sort((a, b) => a.r - b.r);
  // Long pictures have more bursts, each with a few fewer sparks.
  const spare = Math.min(1, 1.1 * (unit / Math.max(w, h)) ** 0.3);
  // Faint smoke drifting behind them.
  let smoke = "";
  for (const b of bursts.slice(-3)) {
    const sx = Math.round(b.x + b.r * g.f(-0.6, 0.6));
    const sy = Math.round(b.y + b.r * g.f(0.3, 0.8));
    const sr = Math.round(b.r * g.f(0.6, 1));
    const sh = Math.round(sr * 0.4);
    smoke += `M${sx - sr} ${sy}a${sr} ${sh} 0 1 0 ${sr * 2} 0a${sr} ${sh} 0 1 0 ${-sr * 2} 0`;
  }
  let show = el("path", { d: smoke, fill: hex(skyHue, 20, 60), opacity: "0.08" });
  for (const b of bursts) {
    const far = b.r < unit * 0.15;
    const color = colors[b.main];
    // The glow behind it, fainter for far bursts so they don't turn to smudges.
    show += el("circle", {
      cx: Math.round(b.x),
      cy: Math.round(b.y),
      r: Math.round(b.r * (far ? 1.1 : 1.3)),
      fill: `url(#${g.id(`glow${b.main}`)})`,
      opacity: far ? "0.6" : false,
    });
    const inner = burst(g, b.style, b.r, color, colors[b.second], Math.min(1, 0.3 + b.r / (unit * 0.4)) * spare);
    show += el(
      "g",
      { transform: `translate(${Math.round(b.x)} ${Math.round(b.y)})`, opacity: far ? "0.75" : false },
      inner,
    );
  }
  // A rocket or two still climbing, a faint trail below each.
  let trail = "";
  const heads: Point[] = [];
  for (let k = g.i(1, 2); k > 0; k--) {
    const x0 = g.f(0.1, 0.9) * w;
    const x1 = x0 + unit * g.f(-0.06, 0.06);
    const y1 = g.f(line - rise - unit * 0.25, line - rise - unit * 0.05);
    const len = unit * g.f(0.25, 0.4);
    trail += s`M${x0} ${y1 + len}Q${x0} ${y1 + len * 0.4} ${x1} ${y1}`;
    heads.push([x1, y1]);
  }
  show += strokes(trail, hex(40, 80, 70), unit * 0.006, "0.5");
  show += penDots(heads, unit * 0.008, hex(50, 100, 94));
  const showId = g.id("show");
  out += el("g", { id: showId }, show);

  // The water, with the show mirrored in it and broken up by ripples.
  if (water) {
    const waterId = g.id("water");
    const clipId = g.id("clip");
    defs += lin(waterId, [hex(skyHue, 40, 18), hex(skyHue, 45, 8)]);
    defs += el("clipPath", { id: clipId }, el("rect", { y: line, width: w, height: h - line }));
    out += el("rect", { y: line, width: w, height: h - line, fill: `url(#${waterId})` });
    const k = 0.45;
    out += el(
      "g",
      { "clip-path": `url(#${clipId})`, opacity: "0.45" },
      el("use", { href: `#${showId}`, transform: s`translate(0 ${line * (1 + k)})scale(1 -${k})` }),
    );
    // Each row is one dashed line, started at a different place so the dashes don't line up.
    let ripples = "";
    for (let y = line + unit * 0.012; y < h; y += unit * g.f(0.014, 0.026))
      ripples += s`M${-unit * g.f(0, 0.4)} ${y}H${w}`;
    const dash = [0.09, 0.05, 0.14, 0.04, 0.05, 0.07].map(v => Math.round(unit * v * g.f(0.7, 1.3))).join(" ");
    out += el("path", {
      d: ripples,
      stroke: hex(skyHue, 40, 10),
      "stroke-width": unit * 0.008,
      "stroke-dasharray": dash,
      opacity: "0.6",
    });
  }

  // The skyline or hills, dark against the sky.
  const dark = hex(skyHue, 30, 6);
  let what: string;
  if (place === "city" || place === "harbor") {
    // Written as relative steps in whole pixels, to keep it short.
    let cx = 0;
    let cy = Math.round(line);
    let d = `M0 ${cy}`;
    const V = (y: number) => {
      d += `v${Math.round(y) - cy}`;
      cy = Math.round(y);
    };
    const H = (x: number) => {
      d += `h${Math.round(x) - cx}`;
      cx = Math.round(x);
    };
    const lit: Point[] = [];
    for (let x = -g.f(0, unit * 0.05); x < w;) {
      const bw = unit * g.f(0.05, 0.11);
      const bh = rise * g.f(0.3, 1);
      const y = line - bh;
      V(y);
      if (g.chance(0.15)) {
        // A spire or a stepped top.
        H(x + bw * 0.4);
        V(y - bh * 0.25);
        H(x + bw * 0.6);
        V(y);
      }
      H(x + bw);
      // Some lit windows in rows.
      for (let wy = y + unit * 0.02; wy < line - unit * 0.015; wy += unit * 0.025)
        for (let wx = x + bw * 0.25; wx < x + bw * 0.8; wx += bw * 0.25) if (g.chance(0.08)) lit.push([wx, wy]);
      x += bw + (g.chance(0.2) ? unit * g.f(0.01, 0.03) : 0);
      if (x < w && g.chance(0.2)) V(line - rise * 0.15);
    }
    d += s`V${water ? line : h}H0Z`;
    out += el("path", { d, fill: dark });
    out += penDots(lit, unit * 0.005, hex(42, 80, 72), "0.75");
    what = water ? "over a harbor, reflected in the water" : "over a city skyline at night";
  } else {
    // A rolling hill, with a row of pines in front of it.
    const far = hex(skyHue, 28, 11);
    const ya = line - rise * g.f(0.4, 0.7);
    const yb = line - rise * g.f(0.4, 0.7);
    out += el("path", {
      d: s`M0 ${ya}Q${w * g.f(0.3, 0.7)} ${line - rise * 1.1} ${w} ${yb}V${water ? line : h}H0Z`,
      fill: far,
    });
    const pines = pen(true).M(0, line);
    for (let x = 0; x < w;) {
      const pw = unit * g.f(0.025, 0.045);
      const ph = rise * g.f(0.3, 0.75);
      pines.L(x + pw, line - ph).L(x + pw * 2, line - rise * 0.12);
      x += pw * 2;
    }
    out += el("path", { d: pines.d + s`L${w} ${line}V${water ? line : h}H0Z`, fill: dark });
    what = water ? "over a lake below a line of pines, reflected in the water" : "over wooded hills at night";
  }

  const main = bursts[bursts.length - 1];
  const willow = bursts.some(b => b.style === "willow" && b.r > unit * 0.15);
  note.alt(`${willow && g.chance(0.5) ? "A fireworks show with a drooping willow" : "Fireworks bursting"} ${what}`);
  note.focus(main.x, main.y);
  return compact(el("defs", {}, defs) + out);
});

/**
 * One arm of a snowflake, pointing up from the center to (0, -10): its stroked lines and any filled
 * plates. Six turned copies make the flake.
 */
function arm(g: Rand, style: "dendrite" | "fern" | "plate" | "stellar" | "simple"): [string, string] {
  let lines = "M0 0V-10";
  let plates = "";
  const sin = Math.sin(Math.PI / 3);
  const cos = Math.cos(Math.PI / 3);
  // A pair of branches leaving the spine at y = -t, `len` long, angled out toward the tip.
  const pair = (t: number, len: number) => {
    lines += s`M${-len * sin} ${-t - len * cos}L0 ${-t}L${len * sin} ${-t - len * cos}`;
  };
  // A hexagon ring at radius r: one side per arm.
  const ring = (r: number) => {
    lines += s`M0 ${-r}L${r * sin} ${-r * cos}`;
  };
  if (style === "dendrite") {
    const count = g.i(2, 3);
    for (let k = 0; k < count; k++) {
      const t = 3 + k * (5 / count) + g.f(-0.4, 0.4);
      const len = (10 - t) * g.f(0.45, 0.6);
      pair(t, len);
      // Twigs on the bigger branches.
      if (len > 2.6 && g.chance(0.7)) {
        const m = len * 0.55;
        for (const side of [-1, 1]) {
          const bx = side * m * sin;
          const by = -t - m * cos;
          lines += s`M${bx + side * 0.9} ${by + 0.3}L${bx} ${by}l0 ${-1.1}`;
        }
      }
    }
    if (g.chance(0.5)) ring(g.f(1.8, 2.6));
  } else if (style === "fern") {
    for (let t = 2.2; t < 9.2; t += g.f(1, 1.4)) pair(t, (10 - t) * 0.35 + 0.4);
  } else if (style === "plate") {
    // A hexagonal plate, with the arm reaching on past it.
    const p = g.f(3.5, 5);
    plates += s`M0 0L0 ${-p}L${p * sin} ${-p * cos}Z`;
    ring(p);
    if (g.chance(0.6)) ring(p * 0.55);
    pair(p + (10 - p) * 0.45, (10 - p) * 0.4);
  } else if (style === "stellar") {
    // A broad pointed arm, like a star's point, with notches near its end.
    const wd = g.f(1, 1.6);
    plates += s`M0 0L${wd} ${-3}L0 ${-9.6}L${-wd} ${-3}Z`;
    pair(g.f(5.5, 7), g.f(1.4, 2.2));
    if (g.chance(0.5)) ring(g.f(1.5, 2.2));
  } else {
    pair(g.f(5, 6.5), g.f(2, 3));
    if (g.chance(0.6)) pair(8.2, 1.2);
  }
  // Now and then a little diamond at the tip.
  if (style !== "stellar" && g.chance(0.35)) plates += "M0 -9L0.8 -10.2L0 -11.4L-0.8 -10.2Z";
  return [lines, plates];
}

/** A scattering of six-fold snowflakes of different sizes and designs on a wintry sky. */
export const snowflakes = defineKind("snowflakes", "Snowflakes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const mood = g.pick(["icy", "twilight", "pale"] as const);
  const hue = g.f(198, 228);
  const skyId = g.id("sky");
  const stops =
    mood === "icy"
      ? [hex(hue, 50, g.f(62, 70)), hex(hue - 8, 45, 86)]
      : mood === "twilight"
        ? [hex(hue + g.f(15, 35), 40, 18), hex(hue, 40, 38)]
        : [hex(hue, 35, 95), hex(hue, 40, 84)];
  const ink = mood === "pale" ? hex(hue, 55, 58) : hex(hue, 70, 98);
  let defs = lin(skyId, stops);
  let out = fill(w, h, `url(#${skyId})`);

  // A few designs, each one arm turned six times.
  const styles = ["dendrite", "dendrite", "fern", "plate", "stellar", "simple"] as const;
  const design = (name: string, thick: number) => {
    const style = g.pick(styles);
    const [lines, plates] = arm(g, style);
    const armId = g.id(`${name}a`);
    const trioId = g.id(`${name}t`);
    // Three arms make a trio, and the trio turned a sixth of the way round makes the six.
    const trio = el(
      "g",
      { id: trioId },
      el(
        "g",
        { id: armId },
        el("path", { d: lines, fill: "none" }),
        plates ? el("path", { d: plates, "fill-opacity": style === "plate" ? "0.45" : false }) : "",
      ),
      el("use", { href: `#${armId}`, transform: "rotate(120)" }),
      el("use", { href: `#${armId}`, transform: "rotate(240)" }),
    );
    defs += el(
      "g",
      { id: g.id(name), "stroke-width": thick },
      trio,
      el("use", { href: `#${trioId}`, transform: "rotate(60)" }),
    );
    return g.id(name);
  };
  const area = (w * h) / (unit * unit);
  const front = Math.min(5, Math.round(1.5 + area * 0.7));
  const mid = Math.round(3 * area ** 0.7 + 2);
  const back = Math.round(5 * area ** 0.7 + 3);
  const frontIds = Array.from({ length: front }, (_, k) => design(`f${k}`, g.f(0.6, 0.8)));
  const midIds = [0, 1, 2].map(k => design(`m${k}`, g.f(0.8, 1)));
  const backIds = [0, 1].map(k => design(`b${k}`, 1.3));

  // Places the flakes, biggest first, each clear of the others and `edge` radii in from the sides.
  const placed: [number, number, number][] = [];
  const layer = (n: number, ids: string[], lo: number, hi: number, edge: number) => {
    let uses = "";
    const spots: Point[] = [];
    for (let k = 0; k < n; k++) {
      const r = unit * g.f(lo, hi);
      const [x, y] = spread(g, placed, r * 1.08, r * edge, w - r * edge, r * edge, h - r * edge, 24);
      spots.push([x, y]);
      uses += el("use", {
        href: `#${ids[k % ids.length]}`,
        transform: `translate(${Math.round(x)} ${Math.round(y)})rotate(${g.i(0, 59)})` + s`scale(${r / 10.5})`,
      });
    }
    return [uses, spots] as const;
  };
  const [frontUses, frontSpots] = layer(front, frontIds, 0.13, 0.2, 1.05);
  const [midUses] = layer(mid, midIds, 0.06, 0.1, 0.8);
  const [backUses] = layer(back, backIds, 0.025, 0.045, 0.5);
  const paint = { fill: ink, stroke: ink, "stroke-linecap": "round", "stroke-linejoin": "round" };
  out += el("g", { ...paint, opacity: mood === "pale" ? "0.4" : "0.5" }, backUses);
  // Tiny falling snow between them.
  const snow: Point[] = [];
  for (let k = Math.round(area ** 0.5 * g.f(14, 20)); k > 0; k--) snow.push([g.f(0, w), g.f(0, h)]);
  out += penDots(snow, unit * 0.005, ink, "0.55");
  out += el("g", { ...paint, opacity: "0.8" }, midUses);
  out += el("g", paint, frontUses);

  note.alt(
    mood === "twilight"
      ? "Snowflakes of many shapes falling through a twilight sky"
      : mood === "icy"
        ? "Snowflakes of many shapes drifting on a wintry sky"
        : "Delicate snowflake crystals scattered over a frosty background",
  );
  note.focus(frontSpots[0][0], frontSpots[0][1]);
  return compact(el("defs", {}, defs) + out);
});

/** A closed polygon as path data. */
const poly = (points: readonly Point[]): string => "M" + points.map(([x, y]) => s`${x} ${y}`).join("L") + "Z";

/** A right half outline mirrored into a whole one, from the tip round to the base and back. */
const mirrored = (half: readonly Point[]): Point[] => [
  ...half,
  ...half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Point => [-x, y]),
];

/** Where a picture places one thing: translate, turn and scale, rounded to keep the markup short. */
const place = (x: number, y: number, deg: number, scale: number): string =>
  `translate(${Math.round(x)} ${Math.round(y)})rotate(${Math.round(deg)})scale(${Math.round(scale * 100) / 100})`;

/**
 * Scattered spots for things of the given radii, biggest first: each spot is the best of a few
 * random tries, the one farthest from what's already there, so the scatter fills evenly.
 */
function scatter(g: Rand, w: number, h: number, radii: readonly number[], margin: number): Point[] {
  const placed: [number, number, number][] = [];
  return radii.map(r => {
    let best: [number, number] = [w / 2, h / 2];
    let score = -Infinity;
    for (let k = 0; k < 14; k++) {
      const x = g.f(Math.min(r * margin, w / 2), Math.max(w - r * margin, w / 2));
      const y = g.f(Math.min(r * margin, h / 2), Math.max(h - r * margin, h / 2));
      const room = Math.min(1e9, ...placed.map(([px, py, pr]) => Math.hypot(px - x, py - y) / (pr + r)));
      if (room > score) {
        score = room;
        best = [x, y];
      }
    }
    placed.push([best[0], best[1], r]);
    return best;
  });
}

/*
 * Leaves are drawn about 100 units long, pointing up: the tip near y = -50, the blade's base near
 * y = 30 and the end of the stem below it. Each has a blade (with its stem), a lit half and veins.
 */

type Leaf = { blade: string; half: string; veins: string };

/** A maple leaf: five pointed, toothed lobes and veins fanning out from the stem. */
function maple(): Leaf {
  const half: Point[] = [
    [0, -50],
    [4, -39],
    [9, -42],
    [8, -29],
    [11, -16],
    [23, -27],
    [25, -35],
    [31, -30],
    [46, -32],
    [38, -21],
    [43, -15],
    [30, -7],
    [20, 2],
    [30, 9],
    [37, 20],
    [25, 17],
    [17, 24],
    [7, 26],
    [0, 23],
  ];
  return {
    blade: poly(mirrored(half)) + "M-1.2 22Q0 40 3 56L5 55Q2 40 1.6 22Z",
    half: poly([...half, [1, 23]]),
    veins:
      "M2 54Q1 38 0 23L0 -46M0 23L40 -30M0 23L33 18M0 23L-40 -30M0 23L-33 18" +
      "M0 -18L8 -33M0 -18L-8 -33M17 -8L24 -24M-17 -8L-24 -24",
  };
}

/** An oak leaf: a long blade with rounded lobes down each side of the midrib. */
function oak(): Leaf {
  const half: Point[] = [
    [0, -52],
    [14, -47],
    [8, -36],
    [25, -32],
    [11, -20],
    [32, -15],
    [12, -3],
    [31, 6],
    [11, 15],
    [21, 26],
    [5, 30],
    [0, 33],
  ];
  const ring = mirrored(half);
  return {
    blade: smoothClosed(ring) + "M-1.2 30Q0 44 2 56L4 55Q2 44 1.6 30Z",
    half: smoothClosed([...half, [0, 33]]),
    veins:
      "M3 55Q1 44 0 31L0 -44M0 -33L19 -38M0 -20L26 -27M0 -5L27 -11M0 10L26 6M0 -33L-19 -38M0 -20L-26 -27M0 -5L-27 -11M0 10L-26 6",
  };
}

/** A birch or elm leaf: a toothed birchLeaf with a pointed tip and straight veins in pairs. */
function birchLeaf(): Leaf {
  const half: Point[] = [];
  const steps = 16;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const y = -50 + t * 80;
    // Widest a little below the middle, pointed at the tip and rounded at the base.
    const width = 27 * Math.sin(Math.PI * t ** 0.85) ** 0.8;
    half.push([width + (k % 2 && k < steps ? 2.2 : 0), y]);
  }
  half[0] = [0, -50];
  half[steps] = [0, 30];
  return {
    blade: poly(mirrored(half)) + "M-1.2 28Q0 40 2.5 54L4.5 53Q2 40 1.6 28Z",
    half: poly(half),
    veins:
      "M3 53Q1 40 0 29L0 -45" +
      [-32, -20, -8, 4, 15]
        .map(y => s`M0 ${y}L${y < -25 ? 12 : 20} ${y - 11}M0 ${y}L${y < -25 ? -12 : -20} ${y - 11}`)
        .join(""),
  };
}

/** A ginkgo leaf: a broad fan with a notch in the middle of its edge, and fine veins spreading from the stem. */
function ginkgo(): Leaf {
  const right = "L2 -31Q6 -37 15 -35Q36 -30 39 -6Q16 4 0 16";
  let veins = "M3 56Q1 38 0 16";
  for (const a of [-50, -36, -22, -9, 9, 22, 36, 50]) {
    const rad = ((a - 90) * Math.PI) / 180;
    veins += s`M0 16L${Math.cos(rad) * 44} ${16 + Math.sin(rad) * 44}`;
  }
  return {
    blade: "M0 16Q-16 4 -39 -6Q-36 -30 -15 -35Q-6 -37 -2 -31L0 -25" + right + "ZM-1 14Q0 36 2 56L4 55Q2 36 1.4 14Z",
    half: "M0 16L0 -25" + right + "Z",
    veins,
  };
}

const SPECIES = {
  maple: { draw: maple, name: "maple", id: "m" },
  oak: { draw: oak, name: "oak", id: "o" },
  birch: { draw: birchLeaf, name: "birch", id: "r" },
  ginkgo: { draw: ginkgo, name: "ginkgo", id: "k" },
} as const;

type Species = keyof typeof SPECIES;

/** Fall colors as hue, saturation and lightness, by name. */
const FALL: Record<string, [number, number, number]> = {
  red: [4, 70, 44],
  crimson: [352, 62, 36],
  orange: [22, 82, 50],
  amber: [34, 85, 50],
  gold: [44, 85, 52],
  yellow: [50, 82, 58],
  rust: [16, 60, 36],
  tan: [32, 45, 44],
  brown: [24, 42, 30],
  green: [78, 42, 40],
};

const MOODS: readonly (readonly string[])[] = [
  ["red", "orange", "gold", "rust", "brown", "green"],
  ["red", "crimson", "orange", "amber", "gold"],
  ["gold", "yellow", "amber", "tan", "green", "orange"],
  ["rust", "brown", "tan", "orange", "amber", "red"],
];

/** The surface the leaves have fallen on, and how to say it. */
function ground(g: Rand, w: number, h: number, unit: number, id: string): [string, string, boolean] {
  const kind = g.pick(["deck", "deck", "grass", "pavement", "soil"] as const);
  if (kind === "deck") {
    // Weathered boards, all one way, with gaps between and staggered butt joints.
    const across = g.chance(0.6);
    const hue = g.f(22, 38);
    const sat = g.f(8, 26);
    const light = g.f(46, 62);
    const span = across ? h : w;
    const long = across ? w : h;
    const count = Math.max(3, Math.round(span / (unit * g.f(0.17, 0.23))));
    const board = span / count;
    let out = el("rect", { width: w, height: h, fill: hex(hue, sat, light) });
    let gaps = "";
    let grain = "";
    const shades: Record<string, string> = {};
    for (let k = 0; k < count; k++) {
      const a = k * board;
      // Each board a little lighter or darker than its neighbours.
      const tone = hex(hue + g.f(-4, 4), sat + g.f(-4, 4), light + g.f(-6, 5));
      shades[tone] =
        (shades[tone] ?? "") + (across ? s`M0 ${a}h${w}v${board}h${-w}Z` : s`M${a} 0v${h}h${board}v${-h}Z`);
      if (k) gaps += across ? s`M0 ${a}h${w}` : s`M${a} 0v${h}`;
      // A joint somewhere along most boards.
      if (g.chance(0.6)) {
        const at = long * g.f(0.15, 0.85);
        gaps += across ? s`M${at} ${a}v${board}` : s`M${a} ${at}h${board}`;
      }
      // A grain line.
      for (let j = 0; j < 1; j++) {
        const off = a + board * g.f(0.2, 0.8);
        const start = long * g.f(-0.1, 0.5);
        const len = long * g.f(0.3, 0.7);
        grain += across ? s`M${start} ${off}h${len}` : s`M${off} ${start}v${len}`;
      }
    }
    out += Object.entries(shades)
      .map(([fill, d]) => el("path", { d, fill }))
      .join("");
    out += el("path", {
      d: grain,
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": Math.max(1, unit * 0.004),
      fill: "none",
    });
    out += el("path", {
      d: gaps,
      stroke: hex(hue, sat, light * 0.35),
      "stroke-width": Math.max(1.5, unit * 0.012),
      fill: "none",
    });
    return [
      out.replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v)),
      "a weathered wooden deck",
      false,
    ];
  }
  // The other grounds are a flat color with a fine repeating texture.
  const q = unit * 0.09;
  let base: string;
  let marks: string;
  let where: string;
  let dark = true;
  if (kind === "grass") {
    base = hex(g.f(85, 110), g.f(28, 42), g.f(32, 40));
    const blades: string[] = [];
    for (let k = 0; k < 9; k++) {
      const x = g.f(0, q);
      const y = g.f(0, q);
      blades.push(s`M${x} ${y}l${g.f(-0.08, 0.08) * q} ${-q * g.f(0.18, 0.3)}`);
    }
    marks =
      el("path", {
        d: blades.slice(0, 5).join(""),
        stroke: "#fff",
        "stroke-opacity": "0.14",
        "stroke-width": q * 0.035,
        "stroke-linecap": "round",
      }) +
      el("path", {
        d: blades.slice(5).join(""),
        stroke: "#000",
        "stroke-opacity": "0.14",
        "stroke-width": q * 0.035,
        "stroke-linecap": "round",
      });
    where = "the grass";
    dark = false;
  } else {
    base =
      kind === "pavement" ? hex(g.f(200, 230), g.f(4, 10), g.f(24, 32)) : hex(g.f(18, 30), g.f(20, 32), g.f(16, 22));
    const specks: string[] = [];
    for (let k = 0; k < 7; k++) specks.push(s`M${g.f(0, q)} ${g.f(0, q)}h0`);
    marks =
      el("path", {
        d: specks.slice(0, 4).join(""),
        stroke: "#fff",
        "stroke-opacity": "0.12",
        "stroke-width": q * 0.06,
        "stroke-linecap": "round",
      }) +
      el("path", {
        d: specks.slice(4).join(""),
        stroke: "#000",
        "stroke-opacity": "0.25",
        "stroke-width": q * 0.08,
        "stroke-linecap": "round",
      });
    where = kind === "pavement" ? "damp pavement" : "dark damp ground";
  }
  const pattern = el(
    "pattern",
    { id, width: q, height: q, patternUnits: "userSpaceOnUse", patternTransform: `rotate(${Math.round(g.f(0, 90))})` },
    marks,
  );
  let out = el("defs", {}, pattern) + el("rect", { width: w, height: h, fill: base });
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // A soft wet sheen across damp ground.
  if (dark) {
    const sheen = el(
      "linearGradient",
      { id: id + "s", x1: 0, y1: 0, x2: 0.4, y2: 1 },
      el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": "0.12" }),
      el("stop", { offset: 1, "stop-color": "#ffffff", "stop-opacity": "0" }),
    );
    out = el("defs", {}, sheen) + out + el("rect", { width: w, height: h, fill: `url(#${id}s)` });
  }
  return [out.replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v)), where, dark];
}

/** Fallen autumn leaves of a few kinds, scattered and overlapping on a deck, grass or damp ground. */
export const fallLeaves = defineKind("fall-leaves", "Fall leaves", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const [floor, where, dark] = ground(g, w, h, unit, g.id("tex"));
  let out = floor;

  // Two or three kinds of leaf, one of them the most common.
  const kinds = Object.keys(SPECIES) as Species[];
  const order = kinds.map(k => [k, g.next()] as const).sort((a, b) => a[1] - b[1]);
  const used = order.slice(0, g.i(2, 3)).map(([k]) => k);
  const weights = used.map((_, k) => (k ? g.f(0.5, 1) : 2));

  // Colors from one mood, each varied a little.
  const mood = g.pick(MOODS);
  const colors = mood.map(name => {
    const [hue, sat, light] = FALL[name];
    return hex(hue + g.f(-5, 5), sat + g.f(-8, 6), light + g.f(-5, 5));
  });
  const defs: string[] = [];
  // A couple of blends, from one color at the tip to another at the stem.
  const blends = [0, 1].map(k => {
    const id = g.id(`b${k}`);
    defs.push(lin(id, [g.pick(colors), g.pick(colors), hex(g.f(60, 85), g.f(40, 55), g.f(40, 48))]));
    return `url(#${id})`;
  });
  // Some maple leaves have dark spots: a second maple with them drawn on.
  const spotted = g.id("n");
  if (used.includes("maple"))
    defs.push(
      el(
        "g",
        { id: spotted },
        el("use", { href: `#${g.id("m")}` }),
        el("path", {
          d: "M-12 -14h0M9 -5h0M-5 4h0M15 -22h0M-20 2h0M3 -30h0",
          stroke: "#3a2414",
          "stroke-opacity": "0.45",
          "stroke-width": 3.2,
          "stroke-linecap": "round",
        }),
      ),
    );
  // Each kind's leaf drawn once, in whole units, for every leaf of that kind to reuse.
  const whole = (d: string) => d.replace(/-?\d+\.\d+/g, v => String(Math.round(+v)));
  for (const sp of used) {
    const leaf = SPECIES[sp].draw();
    defs.push(
      el(
        "g",
        { id: g.id(SPECIES[sp].id) },
        el("path", { d: whole(leaf.blade) }),
        el("path", { d: whole(leaf.half), fill: "#fff", "fill-opacity": "0.12" }),
        el("path", {
          d: whole(leaf.veins),
          fill: "none",
          stroke: "#000",
          "stroke-opacity": "0.2",
          "stroke-width": 1.4,
        }),
      ),
    );
  }
  // Soft shadows, cast by each layer of the pile onto the ground and the leaves below.
  const shadowId = g.id("sh");
  defs.push(
    el(
      "filter",
      { id: shadowId, x: -0.1, y: -0.1, width: 1.2, height: 1.2 },
      el("feDropShadow", {
        dx: unit * 0.01,
        dy: unit * 0.014,
        stdDeviation: unit * 0.006,
        "flood-color": "#000000",
        "flood-opacity": dark ? "0.45" : "0.3",
      }),
    ),
  );

  // Enough leaves to cover most of the ground. Long frames get bigger leaves rather than
  // proportionally more of them, to keep the markup small.
  const pile = g.chance(0.5);
  const ratio = (w * h) / (unit * unit);
  const count = Math.round(ratio ** 0.3 * g.f(pile ? 17 : 11, pile ? 20 : 13));
  const sizes = Array.from({ length: count }, () => unit * ratio ** 0.2 * g.f(0.32, 0.52)).sort((a, b) => b - a);
  const spots = scatter(
    g,
    w,
    h,
    sizes.map(size => size * 0.4),
    0.3,
  );
  const leaves: string[] = [];
  const tally: Record<string, number> = {};
  for (let k = 0; k < count; k++) {
    // Pick a kind by weight.
    let roll = g.f(
      0,
      weights.reduce((a, b) => a + b),
    );
    let at = 0;
    while (roll > weights[at] && at < used.length - 1) roll -= weights[at++];
    const sp = used[at];
    tally[sp] = (tally[sp] ?? 0) + 1;
    const id = sp === "maple" && g.chance(0.25) ? spotted : g.id(SPECIES[sp].id);
    const [x, y] = spots[k];
    const turn = g.f(0, 360);
    // Ginkgo fans are smaller than the rest.
    const scale = (sizes[k] / 100) * (sp === "ginkgo" ? 0.8 : 1);
    const paint = g.chance(0.22) ? g.pick(blends) : g.pick(colors);
    leaves.push(el("use", { href: `#${id}`, fill: paint, transform: place(x, y, turn, scale) }));
  }
  // Smallest drawn first, so the big ones lie on top, in three layers each casting a shadow.
  leaves.reverse();
  for (let k = 0; k < 3; k++)
    out += el(
      "g",
      { filter: `url(#${shadowId})` },
      ...leaves.slice(Math.round((k * count) / 3), Math.round(((k + 1) * count) / 3)),
    );
  out = el("defs", {}, ...defs) + out;

  const names = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([sp]) => SPECIES[sp as Species].name);
  const lead = andList(names);
  note.alt(`${lead.charAt(0).toUpperCase() + lead.slice(1)} leaves ${pile ? "piled" : "fallen"} on ${where}`);
  note.focus(spots[0][0], spots[0][1]);
  return compact(out);
});

/** A heart 100 units across, centered on the origin. */
const HEART =
  "M0 44C-20 28 -50 8 -50 -16C-50 -34 -37 -44 -25 -44C-13 -44 -5 -36 0 -27C5 -36 13 -44 25 -44C37 -44 50 -34 50 -16C50 8 20 28 0 44Z";

type HeartStyle = "solid" | "outline" | "puffy" | "pattern" | "candy";

/** Hearts of many sizes and styles, solid, outlined, glossy, patterned and candy, scattered for Valentine's Day. */
export const hearts = defineKind("hearts", "Hearts", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // The background: blush, cream, a deep wine or a pale pastel.
  const mood = g.pick(["blush", "blush", "cream", "wine", "pastel"] as const);
  const back =
    mood === "blush"
      ? hex(g.f(345, 365), g.f(45, 70), g.f(89, 93))
      : mood === "cream"
        ? hex(g.f(30, 45), g.f(50, 70), g.f(91, 95))
        : mood === "wine"
          ? hex(g.f(335, 352), g.f(35, 50), g.f(17, 24))
          : hex(g.pick([g.f(150, 200), g.f(250, 290), g.f(40, 55)]), g.f(30, 45), g.f(90, 94));
  // A few colors that agree: reds, pinks and cream, or candy pastels.
  const pastel = mood === "pastel" || g.chance(0.2);
  const inks = pastel
    ? [340, 50, 150, 270, 20, 195].map(hue => hex(hue + g.f(-8, 8), g.f(60, 75), g.f(78, 85)))
    : [
        hex(g.f(348, 358), g.f(68, 78), g.f(44, 50)),
        hex(g.f(340, 350), g.f(60, 72), g.f(56, 62)),
        hex(g.f(335, 345), g.f(65, 80), g.f(72, 78)),
        hex(g.f(340, 355), g.f(70, 85), g.f(85, 90)),
        mood === "cream" ? hex(g.f(348, 356), g.f(55, 65), g.f(32, 38)) : hex(g.f(30, 42), g.f(60, 75), g.f(90, 94)),
      ];
  const candyInks = [340, 50, 150, 270, 20, 195].map(hue => hex(hue + g.f(-6, 6), g.f(65, 78), g.f(80, 86)));
  const defs: string[] = [];
  let out = el("rect", { width: w, height: h, fill: back });

  // Now and then a faint pattern on the background: dots or diagonal stripes.
  const backPattern = g.pick(["none", "none", "dots", "stripes"] as const);
  if (backPattern !== "none") {
    const id = g.id("bg");
    const q = unit * g.f(0.05, 0.08);
    const ink = mood === "wine" ? "#ffffff" : hex(g.f(340, 360), 60, 50);
    defs.push(
      el(
        "pattern",
        {
          id,
          width: q,
          height: q,
          patternUnits: "userSpaceOnUse",
          patternTransform: backPattern === "stripes" ? "rotate(45)" : undefined,
        },
        backPattern === "dots"
          ? el("path", {
              d: s`M${q / 4} ${q / 4}h0M${(q * 3) / 4} ${(q * 3) / 4}h0`,
              stroke: ink,
              "stroke-opacity": "0.1",
              "stroke-width": q * 0.16,
              "stroke-linecap": "round",
            })
          : el("rect", { width: q / 2, height: q, fill: ink, "fill-opacity": "0.06" }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  }

  const heartId = g.id("h");
  // One soft shadow for all the hearts, as if cut from paper and laid down.
  const shadowId = g.id("hs");
  defs.push(
    el("path", { id: heartId, d: HEART }),
    el(
      "filter",
      { id: shadowId, x: -0.1, y: -0.1, width: 1.2, height: 1.2 },
      el("feDropShadow", {
        dx: unit * 0.008,
        dy: unit * 0.011,
        stdDeviation: unit * 0.005,
        "flood-color": "#000000",
        "flood-opacity": mood === "wine" ? "0.35" : "0.14",
      }),
    ),
  );
  // Glossy hearts: soft shading over the fill and a highlight on the upper left.
  const puffyId = g.id("p");
  const shadeId = g.id("sh");
  // Candy hearts: a raised rim round a flat, paler face.
  const candyId = g.id("c");
  const made = new Set<string>();
  const need = (key: string) => {
    if (made.has(key)) return;
    made.add(key);
    if (key === "puffy")
      defs.push(
        el(
          "radialGradient",
          { id: shadeId, cx: 0.38, cy: 0.3, r: 0.8 },
          el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": "0.3" }),
          el("stop", { offset: 0.45, "stop-color": "#ffffff", "stop-opacity": "0" }),
          el("stop", { offset: 1, "stop-color": "#000000", "stop-opacity": "0.28" }),
        ),
        el(
          "g",
          { id: puffyId },
          el("use", { href: `#${heartId}` }),
          el("path", { d: HEART, fill: `url(#${shadeId})` }),
          el("path", {
            d: "M-38 -18C-40 -30 -32 -37 -24 -36C-30 -33 -34 -26 -34 -16ZM-14 -36h0",
            fill: "#fff",
            "fill-opacity": "0.7",
            stroke: "#fff",
            "stroke-opacity": "0.7",
            "stroke-width": 5,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          }),
        ),
      );
    if (key === "candy")
      defs.push(
        el(
          "g",
          { id: candyId },
          el("use", { href: `#${heartId}` }),
          el("use", { href: `#${heartId}`, fill: "#000", "fill-opacity": "0.08" }),
          el("use", { href: `#${heartId}`, transform: "translate(-1 -3)scale(0.8)" }),
          el("use", {
            href: `#${heartId}`,
            transform: "translate(-1 -3)scale(0.8)",
            fill: "#fff",
            "fill-opacity": "0.25",
          }),
        ),
      );
  };
  // One or two patterned papers: stripes or dots in two of the colors.
  let firstDotty = false;
  const patterns = Array.from({ length: g.i(1, 2) }, (_, k) => {
    const id = g.id(`pt${k}`);
    const base = g.pick(inks);
    let accent = g.pick(inks);
    if (accent === base) accent = mood === "wine" || pastel ? "#ffffff" : inks[inks.length - 1];
    if (accent === base) accent = "#ffffff";
    const dotty = k ? !firstDotty : g.chance(0.5);
    firstDotty = dotty;
    const q = 16;
    defs.push(
      el(
        "pattern",
        {
          id,
          width: q,
          height: q,
          patternUnits: "userSpaceOnUse",
          patternTransform: dotty ? undefined : "rotate(-35)",
        },
        el("rect", { width: q, height: q, fill: base }),
        dotty
          ? el("path", {
              d: "M4 4h0M12 12h0",
              stroke: accent,
              "stroke-width": 5,
              "stroke-linecap": "round",
            })
          : el("rect", { width: q / 2, height: q, fill: accent }),
      ),
    );
    return `url(#${id})`;
  });

  // A string of little hearts sagging across the top, sometimes.
  const garland = g.chance(0.3);
  let top = 0;
  if (garland) {
    const y0 = h * 0.02 - unit * 0.02;
    const sag = unit * g.f(0.12, 0.18);
    const loops = Math.max(1, Math.round(w / (unit * 1.4)));
    const span = w / loops;
    let wire = "";
    // The little hearts alternate between two colors, each color in one group.
    const small = ["", ""];
    const step = Math.round(span / (unit * 0.15) / 2) * 2 + 1;
    for (let k = 0; k < loops; k++) {
      const a: Point = [k * span, y0];
      const c: Point = [(k + 0.5) * span, y0 + sag * 2];
      const b: Point = [(k + 1) * span, y0];
      wire += s`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
      for (let j = 1; j < step; j++) {
        const t = j / step;
        const x = (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0];
        const y = (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1];
        // Each hangs just under the string, turned a little with its slope.
        const slope = (Math.atan2(2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]), span) * 180) / Math.PI;
        small[(k * step + j) % 2] += el("use", {
          href: `#${heartId}`,
          transform: place(x, y + unit * 0.026, slope * 0.5, unit * 0.0006),
        });
      }
      top = Math.max(top, y0 + sag + unit * 0.06);
    }
    out += el("path", {
      d: wire,
      fill: "none",
      stroke: mood === "wine" ? "#ffffff" : "#000",
      "stroke-opacity": "0.3",
      "stroke-width": Math.max(1, unit * 0.005),
    });
    out += el("g", { fill: inks[0] }, small[0]) + el("g", { fill: inks[2] }, small[1]);
  }

  // The scattered hearts, biggest first so the small ones fill the gaps.
  const count = Math.round(((w * (h - top)) / (unit * unit)) ** 0.55 * g.f(13, 17));
  const sizes = Array.from({ length: count }, (_, k) => unit * (k < 2 ? g.f(0.26, 0.34) : g.f(0.09, 0.24))).sort(
    (a, b) => b - a,
  );
  const placed: [number, number, number][] = [];
  const styles: HeartStyle[] = [];
  let shown = "";
  for (const size of sizes) {
    const r = size * 0.5;
    let best: Point | undefined;
    let score = 0.95;
    for (let k = 0; k < 24; k++) {
      const x = g.f(r * 1.05, w - r * 1.05);
      const y = g.f(top + r * 1.05, h - r * 1.05);
      const room = Math.min(9, ...placed.map(([px, py, pr]) => Math.hypot(px - x, py - y) / (pr + r)));
      if (room > score) {
        score = room;
        best = [x, y];
      }
    }
    if (!best) continue;
    placed.push([best[0], best[1], r]);
    const roll = g.next();
    const style: HeartStyle =
      roll < (pastel ? 0.4 : 0.15)
        ? "candy"
        : roll < 0.5
          ? "solid"
          : roll < 0.68
            ? "outline"
            : roll < 0.84 && size > unit * 0.14
              ? "puffy"
              : size > unit * 0.12
                ? "pattern"
                : "solid";
    styles.push(style);
    const turn = g.f(-28, 28);
    const scale = size / 100;
    const at = place(best[0], best[1], turn, scale);
    const ink = g.pick(inks);
    if (style === "solid") shown += el("use", { href: `#${heartId}`, fill: ink, transform: at });
    else if (style === "outline")
      shown += el("use", {
        href: `#${heartId}`,
        fill: "none",
        stroke: ink,
        "stroke-width": g.pick([6, 8, 10]),
        transform: at,
      });
    else if (style === "puffy") {
      need("puffy");
      shown += el("use", { href: `#${puffyId}`, fill: inks[g.i(0, 1)], transform: at });
    } else if (style === "pattern") shown += el("use", { href: `#${heartId}`, fill: g.pick(patterns), transform: at });
    else {
      need("candy");
      shown += el("use", { href: `#${candyId}`, fill: g.pick(candyInks), transform: at });
    }
  }
  out = el("defs", {}, ...defs) + out + el("g", { filter: `url(#${shadowId})` }, shown);

  const candies = styles.filter(st => st === "candy").length;
  const subject = candies > 2 ? "Candy hearts among hearts of many sizes" : "Hearts of many sizes and styles";
  const where = garland
    ? "under a little garland of hearts"
    : backPattern !== "none"
      ? `scattered across a softly ${backPattern === "dots" ? "dotted" : "striped"} background`
      : `scattered across a ${mood === "wine" ? "deep" : "soft"} background`;
  note.alt(`${subject} ${where}`);
  note.focus(placed[0]?.[0] ?? w / 2, placed[0]?.[1] ?? h / 2);
  return compact(out);
});
