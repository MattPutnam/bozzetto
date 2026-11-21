import { defineKind, el, fill, hsl, lin, pts, qpt, s, type Point, type Rand } from "./core";
import { table } from "./shapes";
import { capitalize, numberWord } from "./words";

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
