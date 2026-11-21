/** Birds of farmyard, rainforest, lagoon and garden. They join the animals category. */
import { defineKind, el, facing, fill, hsl, lin, mix, pts, qpt, s, type Point, type Rand } from "./core";
import { atLeast } from "./shapes";
import { numberWord } from "./words";

/** Where x lands once a figure drawn facing right around cx is turned to face `dir`. */
const turn = (cx: number, dir: number, x: number): number => cx + dir * (x - cx);

/** The left edge of a box of width `bw` starting at x, after turning about cx. */
const turnBox = (cx: number, dir: number, x: number, bw: number): number => (dir > 0 ? x : 2 * cx - x - bw);

/** A sky gradient filling the picture, from `top` down to `bottom`. */
function sky(g: Rand, w: number, h: number, top: string, bottom: string): string {
  const id = g.id("sky");
  return el("defs", {}, lin(id, [top, bottom])) + fill(w, h, `url(#${id})`);
}

/** A point on a cubic Bézier curve, and its direction there. */
function cubic(p: readonly Point[], t: number): [Point, Point] {
  const u = 1 - t;
  const at = (k: 0 | 1): number =>
    u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k];
  const dt = (k: 0 | 1): number =>
    3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]);
  return [
    [at(0), at(1)],
    [dt(0), dt(1)],
  ];
}

/** A filled neck along a cubic curve, tapering from width w0 to w1. */
function neck(p: readonly Point[], w0: number, w1: number, paint: string): string {
  const left: Point[] = [];
  const right: Point[] = [];
  const steps = 8;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const [[x, y], [dx, dy]] = cubic(p, t);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * half, y + (dx / len) * half]);
    right.push([x + (dy / len) * half, y - (dx / len) * half]);
  }
  return el("polygon", { points: pts([...left, ...right.reverse()]), fill: paint });
}

/** A dark eye with a small highlight. */
const eye = (x: number, y: number, r: number): string =>
  el("circle", { cx: x, cy: y, r, fill: "#1a1a1e" }) +
  el("circle", { cx: x + r * 0.35, cy: y - r * 0.35, r: r * 0.35, fill: "#fff" });

interface Hen {
  body: string;
  wing: string;
  tail: string;
  neck?: string;
}

const HENS: readonly Hen[] = [
  { body: "#b5562a", wing: "#8e3f1c", tail: "#6e2f16" },
  { body: "#f4efe4", wing: "#e2dacb", tail: "#d8cfbd" },
  { body: "#34303a", wing: "#25222a", tail: "#1d1b22" },
  { body: "#d9a25e", wing: "#c08544", tail: "#9c6a34" },
  { body: "#8a6a52", wing: "#6e523e", tail: "#4e3a2c" },
];

const ROOSTERS: readonly Hen[] = [
  { body: "#b8462a", wing: "#7a2e1a", tail: "#1f3a34", neck: "#e8a33c" },
  { body: "#f4efe4", wing: "#e2dacb", tail: "#e9e3d6", neck: "#fbf7ee" },
  { body: "#2e2b33", wing: "#7a3a22", tail: "#1b2e2a", neck: "#d98c3a" },
];

const COMB = "#d93a2b";
const SHANK = "#e8b04a";

/** A hen or rooster standing on the ground at gy, facing right, its body half as long as S. */
function chickenFigure(x: number, gy: number, S: number, c: Hen, rooster: boolean): string {
  const by = gy - S * 1.05;
  const hx = x + S * 0.75;
  const hy = by - S * 0.88;
  // Legs and toes.
  let legs = "";
  for (const lx of [x - S * 0.2, x + S * 0.18])
    legs += s`M ${lx} ${by + S * 0.5} L ${lx + S * 0.02} ${gy}
              M ${lx - S * 0.12} ${gy} L ${lx + S * 0.22} ${gy}`;
  let out = el("path", {
    d: legs,
    stroke: SHANK,
    "stroke-width": S * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Tail: a rooster's long sickle feathers, or a hen's rounded tuft.
  if (rooster) {
    let sickles = "";
    for (let k = 0; k < 5; k++)
      sickles += s`M ${x - S * 0.55} ${by - S * 0.3}
                   Q ${x - S * (0.9 + k * 0.12)} ${by - S * (1.85 - k * 0.3)}
                     ${x - S * (1.45 + k * 0.1)} ${by - S * (0.55 - k * 0.25)}`;
    out += el("path", {
      d: sickles,
      stroke: c.tail,
      "stroke-width": S * 0.13,
      "stroke-linecap": "round",
      fill: "none",
    });
  } else
    out += el("path", {
      d: s`M ${x - S * 0.45} ${by - S * 0.3}
           Q ${x - S * 0.85} ${by - S * 1.35} ${x - S * 1.2} ${by - S * 1.05}
           Q ${x - S * 1.3} ${by - S * 0.25} ${x - S * 0.65} ${by + S * 0.35} Z`,
      fill: c.tail,
    });
  // Body, plump in front.
  out += el("ellipse", {
    cx: x,
    cy: by,
    rx: S,
    ry: S * 0.68,
    fill: c.body,
    transform: s`rotate(-10 ${x} ${by})`,
  });
  // Neck, with a rooster's hackles hanging over the shoulders.
  out += el("ellipse", {
    cx: hx - S * 0.12,
    cy: by - S * 0.45,
    rx: S * (rooster ? 0.38 : 0.3),
    ry: S * 0.55,
    fill: c.neck ?? c.body,
    transform: s`rotate(25 ${hx - S * 0.12} ${by - S * 0.45})`,
  });
  // Wing.
  out += el("ellipse", {
    cx: x - S * 0.12,
    cy: by + S * 0.02,
    rx: S * 0.62,
    ry: S * 0.36,
    fill: c.wing,
    transform: s`rotate(-12 ${x - S * 0.12} ${by + S * 0.02})`,
  });
  // Comb, behind the head, then the head.
  const lobes = rooster ? 4 : 3;
  const lobeR = S * (rooster ? 0.13 : 0.09);
  let comb = "";
  for (let k = 0; k < lobes; k++) {
    const a = Math.PI * (1.2 + (k / (lobes - 1)) * 0.55);
    comb += el("circle", {
      cx: hx + Math.cos(a) * S * 0.25,
      cy: hy + Math.sin(a) * S * 0.25 - lobeR * 0.4,
      r: lobeR,
    });
  }
  out += el("g", { fill: COMB }, comb);
  out += el("circle", { cx: hx, cy: hy, r: S * 0.27, fill: c.neck ?? c.body });
  // Beak, wattle and eye.
  out += el("polygon", {
    points: pts([
      [hx + S * 0.2, hy - S * 0.08],
      [hx + S * 0.48, hy + S * 0.03],
      [hx + S * 0.2, hy + S * 0.11],
    ]),
    fill: SHANK,
  });
  out += el("ellipse", {
    cx: hx + S * 0.2,
    cy: hy + S * (rooster ? 0.3 : 0.25),
    rx: S * (rooster ? 0.09 : 0.07),
    ry: S * (rooster ? 0.17 : 0.12),
    fill: COMB,
  });
  out += eye(hx + S * 0.08, hy - S * 0.06, S * 0.055);
  return out;
}

/** A fluffy chick standing at gy, facing right, r across its body. */
function chick(x: number, gy: number, r: number, pecking: boolean): string {
  const hx = x + r * (pecking ? 0.95 : 0.6);
  const hy = gy - r * (pecking ? 0.75 : 1.85);
  let out = el("path", {
    d: s`M ${x - r * 0.25} ${gy - r * 0.4} V ${gy} M ${x + r * 0.2} ${gy - r * 0.4} V ${gy}`,
    stroke: SHANK,
    "stroke-width": r * 0.14,
    "stroke-linecap": "round",
  });
  out += el("ellipse", { cx: x, cy: gy - r * 1.05, rx: r, ry: r * 0.85, fill: "#f7d154" });
  out += el("circle", { cx: hx, cy: hy, r: r * 0.6, fill: "#f7d154" });
  out += el("ellipse", { cx: x - r * 0.15, cy: gy - r, rx: r * 0.5, ry: r * 0.3, fill: "#e8b93a" });
  out += el("polygon", {
    points: pts([
      [hx + r * 0.5, hy - r * 0.12],
      [hx + r * 0.85, hy + r * 0.05],
      [hx + r * 0.5, hy + r * 0.18],
    ]),
    fill: "#f08a24",
  });
  out += el("circle", { cx: hx + r * 0.2, cy: hy - r * 0.12, r: r * 0.11, fill: "#1a1a1e" });
  return out;
}

/** A hen or a rooster in a farmyard by a fence, sometimes with chicks and a barn. */
export const chicken = defineKind("chicken", "Chicken", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rooster = g.chance(0.35);
  const c = g.pick(rooster ? ROOSTERS : HENS);
  const dir = g.pick([1, -1]);
  const S = unit * g.f(0.16, 0.19);
  const gy = h * g.f(0.78, 0.85);
  const hz = gy - unit * g.f(0.16, 0.22);
  const back = rooster ? 1.75 : 1.35;
  // Chicks in front of and behind the parent, as many as fit.
  const wanted = rooster ? 0 : g.chance(0.6) ? g.i(1, 4) : 0;
  let chicks = wanted;
  const ahead = (n: number): number => (n > 0 ? 1.55 + Math.min(n, 2) * 0.7 : 1.05) * S;
  const behind = (n: number): number => (n > 2 ? 1.9 + (n - 2) * 0.7 : back) * S;
  while (chicks > 0 && ahead(chicks) + behind(chicks) > w * 0.94) chicks--;
  const cx = w / 2 - (dir * (ahead(chicks) - behind(chicks))) / 2;
  const skyHue = g.f(190, 215);
  let out = sky(g, w, h, hsl(skyHue, 50, 74), hsl(skyHue - 15, 50, 92));
  // Rolling fields on the horizon, and the yard.
  out += el("path", {
    d: s`M -5 ${hz} Q ${w * g.f(0.2, 0.8)} ${hz - unit * g.f(0.06, 0.14)} ${w + 5} ${hz} V ${h} H -5 Z`,
    fill: hsl(g.f(85, 115), 35, g.f(52, 60)),
  });
  const yard = g.pick(["#c9a877", "#b99a6a", "#9cb86a", "#8fae5e"]);
  out += el("path", {
    d: s`M -5 ${hz + (gy - hz) * 0.5} Q ${w / 2} ${hz + (gy - hz) * 0.35} ${w + 5} ${hz + (gy - hz) * 0.5} V ${h} H -5 Z`,
    fill: yard,
  });
  const fenceY = hz + (gy - hz) * 0.42;
  const barn = g.chance(0.5);
  if (barn) {
    // A barn off to the side the chicken faces away from.
    const bw = unit * g.f(0.32, 0.4);
    const bh = bw * 0.62;
    const bx = dir > 0 ? w * g.f(0.03, 0.12) : w * g.f(0.88, 0.97) - bw;
    const red = g.pick(["#a8432f", "#b5503a", "#8e3b2c", "#c2683e"]);
    out += el("polygon", {
      points: pts([
        [bx, fenceY],
        [bx, fenceY - bh],
        [bx + bw * 0.2, fenceY - bh - bw * 0.28],
        [bx + bw * 0.8, fenceY - bh - bw * 0.28],
        [bx + bw, fenceY - bh],
        [bx + bw, fenceY],
      ]),
      fill: red,
    });
    out += el("path", {
      d: s`M ${bx - bw * 0.03} ${fenceY - bh + bw * 0.02} L ${bx + bw * 0.2} ${fenceY - bh - bw * 0.28}
           H ${bx + bw * 0.8} L ${bx + bw * 1.03} ${fenceY - bh + bw * 0.02}`,
      stroke: "#5a4a44",
      "stroke-width": bw * 0.05,
      "stroke-linejoin": "round",
      fill: "none",
    });
    // The door, with its cross brace.
    const dx = bx + bw * 0.32;
    const dh = bh * 0.62;
    out += el("rect", { x: dx, y: fenceY - dh, width: bw * 0.36, height: dh, fill: mix(red, "#000000", 0.25) });
    out += el("path", {
      d: s`M ${dx} ${fenceY - dh} L ${dx + bw * 0.36} ${fenceY} M ${dx + bw * 0.36} ${fenceY - dh} L ${dx} ${fenceY}
           M ${dx} ${fenceY - dh} H ${dx + bw * 0.36} V ${fenceY} H ${dx} Z`,
      stroke: "#f4efe4",
      "stroke-width": bw * 0.025,
      fill: "none",
    });
  }
  // A wooden fence along the back of the yard.
  const wood = g.pick(["#a07850", "#8b6a4a", "#c9b79a", "#e9e3d6"]);
  const fh = unit * g.f(0.11, 0.14);
  const gap = unit * g.f(0.16, 0.22);
  let posts = "";
  for (let px = g.f(0, gap); px < w + gap; px += gap) posts += s`M ${px} ${fenceY + unit * 0.01} V ${fenceY - fh}`;
  out += el("path", { d: posts, stroke: wood, "stroke-width": unit * 0.022, fill: "none" });
  out += el("path", {
    d: s`M 0 ${fenceY - fh * 0.8} H ${w} M 0 ${fenceY - fh * 0.38} H ${w}`,
    stroke: wood,
    "stroke-width": unit * 0.016,
  });
  // Shadow and scattered grain on the ground.
  out += el("ellipse", { cx, cy: gy, rx: S * 1.2, ry: S * 0.12, fill: "#000", opacity: "0.12" });
  let grain = "";
  for (let k = g.i(6, 12); k > 0; k--) {
    const gx = cx + dir * S * g.f(0.6, 2.4);
    const gyy = gy + (h - gy) * g.f(0.05, 0.7);
    grain += s`M ${gx} ${gyy} h ${unit * 0.008}`;
  }
  out += el("path", {
    d: grain,
    stroke: "#e8c66a",
    "stroke-width": unit * 0.012,
    "stroke-linecap": "round",
  });
  out += facing(cx, dir);
  out += chickenFigure(cx, gy, S, c, rooster);
  // The chicks: up to two ahead, the rest behind.
  for (let k = 0; k < chicks; k++) {
    const front = k < 2;
    const x = front ? cx + S * (1.45 + k * 0.7) : cx - S * (1.75 + (k - 2) * 0.7);
    const cy = gy + S * g.f(0.08, 0.2);
    const r = S * 0.24;
    const away = front && g.chance(0.3);
    out += el("ellipse", { cx: x, cy, rx: r * 1.1, ry: r * 0.15, fill: "#000", opacity: "0.12" });
    out += away ? facing(x, -1) + chick(x, cy, r, g.chance(0.5)) + "</g>" : chick(x, cy, r, g.chance(0.4));
  }
  out += "</g>";
  const bird = rooster ? "rooster" : "hen";
  const brood = chicks ? ` with ${numberWord(chicks)} chick${chicks > 1 ? "s" : ""}` : "";
  note.alt(
    `A ${bird}${brood} in a farmyard by a ${barn ? "barn" : "wooden fence"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  const by = gy - S * 1.05;
  const hx = cx + S * 0.75;
  const hy = by - S * 0.88;
  note.focus(turn(cx, dir, hx + S * 0.08), hy);
  // Comb, head, beak and wattle.
  note.frame(turnBox(cx, dir, hx - S * 0.45, S * 1.0), hy - S * 0.6, S * 1.0, S * 1.1);
  return out;
});

interface Parrot {
  name: string;
  body: string;
  head: string;
  wing: string;
  flight: string;
  tail: string;
  beak: string;
  jaw: string;
  belly?: string;
  crown?: string;
  /** Bare skin around the eye: a macaw's face patch or a smaller ring. */
  face?: string;
  macaw?: boolean;
}

const PARROTS: readonly Parrot[] = [
  {
    name: "macaw",
    macaw: true,
    body: "#d8352a",
    head: "#d8352a",
    wing: "#f2c14e",
    flight: "#2f64b5",
    tail: "#c8302a",
    beak: "#efe6d6",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#2f7fc1",
    head: "#2f7fc1",
    belly: "#f2bf3a",
    crown: "#4f9e4a",
    wing: "#2f7fc1",
    flight: "#24589a",
    tail: "#2a6fb0",
    beak: "#2b2b30",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#5f9e3a",
    head: "#5f9e3a",
    crown: "#d8352a",
    wing: "#5f9e3a",
    flight: "#2f64b5",
    tail: "#b5462a",
    beak: "#3a3a40",
    jaw: "#2b2b30",
    face: "#f6f1e8",
  },
  {
    name: "macaw",
    macaw: true,
    body: "#2e4fa3",
    head: "#2e4fa3",
    wing: "#2a4693",
    flight: "#223b80",
    tail: "#2a4693",
    beak: "#26262c",
    jaw: "#26262c",
    face: "#f2c14e",
  },
  {
    name: "parrot",
    body: "#4f9e3c",
    head: "#4f9e3c",
    crown: "#f0cf4a",
    wing: "#3e8030",
    flight: "#2f64b5",
    tail: "#7bb84a",
    beak: "#b9aa98",
    jaw: "#8f8274",
  },
  {
    name: "lovebird",
    body: "#5fae4a",
    head: "#f08a5d",
    wing: "#3f8a32",
    flight: "#3f7f34",
    tail: "#4f86c6",
    beak: "#e0483a",
    jaw: "#c23a2e",
    face: "#f6f1e8",
  },
  {
    name: "budgie",
    body: "#8cc63e",
    head: "#f3e04f",
    wing: "#6f9a32",
    flight: "#3c4a2a",
    tail: "#2f5f8a",
    beak: "#e8c88a",
    jaw: "#c8a86a",
  },
  {
    name: "parrot",
    body: "#9a9ca3",
    head: "#a6a8ae",
    wing: "#82848c",
    flight: "#5e6068",
    tail: "#d8352a",
    beak: "#2b2b30",
    jaw: "#2b2b30",
    face: "#e9e7e2",
  },
];

/** A long pointed leaf from (x, y), reaching `len` at angle `a` (degrees), with a midrib. */
function bigLeaf(x: number, y: number, a: number, len: number, wide: number, paint: string): string {
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${a})` },
    el("path", {
      d: s`M 0 0 Q ${len * 0.35} ${-wide} ${len} 0 Q ${len * 0.35} ${wide} 0 0 Z`,
      fill: paint,
    }),
    el("path", {
      d: s`M 0 0 L ${len * 0.92} 0`,
      stroke: "#000",
      "stroke-width": Math.max(1, wide * 0.06),
      opacity: "0.15",
    }),
  );
}

/** A macaw or a smaller parrot perched on a branch among big tropical leaves. */
export const parrot = defineKind("parrot", "Parrot", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const p = g.pick(PARROTS);
  const macaw = !!p.macaw;
  const dir = g.pick([1, -1]);
  // Head to tail tip runs about 7.4 body widths for a macaw, 5 for the others.
  const span = macaw ? 7.6 : 5.2;
  const S = Math.min(unit * (macaw ? g.f(0.1, 0.115) : g.f(0.1, 0.12)), (h * 0.9) / span);
  const tailLen = macaw ? S * 3.4 : S * 1.5;
  const cx = w * g.f(0.44, 0.56);
  const skyHue = g.f(165, 205);
  let out = sky(g, w, h, hsl(skyHue, 50, g.f(68, 76)), hsl(skyHue + 20, 55, 90));
  // Big leaves from the edges, darker ones first.
  const leaves = g.i(4, 7);
  for (let k = 0; k < leaves; k++) {
    const side = k % 2 ? 1 : -1;
    const lx = side < 0 ? -unit * 0.05 : w + unit * 0.05;
    const ly = h * g.f(-0.05, 1.05);
    const a = (side < 0 ? 0 : 180) + side * -1 * g.f(-40, 40);
    out += bigLeaf(lx, ly, a, unit * g.f(0.35, 0.6), unit * g.f(0.08, 0.13), hsl(g.f(95, 150), 45, 28 + k * 4));
  }
  // The branch, its top at py where the bird sits.
  const headTop = S * 3.85;
  const bY = Math.min(h * g.f(0.55, 0.62), h - tailLen - S * 0.4);
  const by = Math.max(bY, headTop + h * 0.04);
  const ends: [Point, Point, Point] = [
    [-10, by + h * g.f(-0.03, 0.05)],
    [w / 2, by - h * g.f(0, 0.05)],
    [w + 10, by + h * g.f(-0.03, 0.05)],
  ];
  const thick = unit * 0.045;
  out += el("path", {
    d: s`M ${ends[0][0]} ${ends[0][1]} Q ${ends[1][0]} ${ends[1][1]} ${ends[2][0]} ${ends[2][1]}`,
    stroke: "#6b4a32",
    "stroke-width": thick,
    "stroke-linecap": "round",
    fill: "none",
  });
  const py = qpt(ends[0], ends[1], ends[2], (cx + 10) / (w + 20))[1] - thick * 0.45;
  // A few small leaves along the branch.
  for (let k = g.i(2, 4); k > 0; k--) {
    const t = g.chance(0.5) ? g.f(0.02, 0.3) : g.f(0.7, 0.98);
    const [lx, ly] = qpt(ends[0], ends[1], ends[2], t);
    out += bigLeaf(lx, ly, g.f(25, 155), unit * 0.13, unit * 0.035, hsl(g.f(95, 135), 45, g.f(34, 44)));
  }
  const hx = cx + S * 0.45;
  const hy = py - S * 2.95;
  out += facing(cx, dir);
  // Tail, hanging past the branch.
  out += el("polygon", {
    points: pts([
      [cx - S * 0.75, py - S * 0.9],
      [cx + S * 0.15, py - S * 0.5],
      [cx - S * 0.5 + tailLen * 0.08, py + tailLen],
      [cx - S * 0.75 + tailLen * 0.06, py + tailLen - S * 0.15],
    ]),
    fill: p.tail,
  });
  if (macaw)
    out += el("polygon", {
      points: pts([
        [cx - S * 0.45, py - S * 0.6],
        [cx - S * 0.15, py - S * 0.5],
        [cx - S * 0.55 + tailLen * 0.08, py + tailLen * 0.97],
      ]),
      fill: p.flight,
    });
  // Flight feathers peeking below the wing, then the body.
  out += el("ellipse", {
    cx: cx - S * 0.5,
    cy: py - S * 0.55,
    rx: S * 0.42,
    ry: S * 0.85,
    fill: p.flight,
    transform: s`rotate(22 ${cx - S * 0.5} ${py - S * 0.55})`,
  });
  out += el("ellipse", {
    cx,
    cy: py - S * 1.35,
    rx: S,
    ry: S * 1.5,
    fill: p.body,
    transform: s`rotate(14 ${cx} ${py - S * 1.35})`,
  });
  if (p.belly)
    out += el("ellipse", {
      cx: cx + S * 0.35,
      cy: py - S * 1.05,
      rx: S * 0.6,
      ry: S * 1.15,
      fill: p.belly,
      transform: s`rotate(14 ${cx + S * 0.35} ${py - S * 1.05})`,
    });
  // Wing folded along the back.
  out += el("ellipse", {
    cx: cx - S * 0.3,
    cy: py - S * 1.35,
    rx: S * 0.6,
    ry: S * 1.2,
    fill: p.wing,
    transform: s`rotate(18 ${cx - S * 0.3} ${py - S * 1.35})`,
  });
  // Head, crown and face.
  out += el("circle", { cx: hx, cy: hy, r: S * 0.8, fill: p.head });
  if (p.crown)
    out += el("ellipse", {
      cx: hx + S * 0.2,
      cy: hy - S * 0.42,
      rx: S * 0.48,
      ry: S * 0.3,
      fill: p.crown,
      transform: s`rotate(15 ${hx + S * 0.2} ${hy - S * 0.42})`,
    });
  const ex = hx + S * 0.3;
  const ey = hy - S * 0.1;
  if (p.face)
    out += macaw
      ? el("ellipse", { cx: ex + S * 0.05, cy: ey + S * 0.12, rx: S * 0.4, ry: S * 0.34, fill: p.face })
      : el("circle", { cx: ex, cy: ey, r: S * 0.2, fill: p.face });
  // Hooked beak: the lower half, then the curved upper half over it.
  out += el("path", {
    d: s`M ${hx + S * 0.6} ${hy + S * 0.2} Q ${hx + S * 1.0} ${hy + S * 0.15} ${hx + S * 0.95} ${hy + S * 0.4}
         Q ${hx + S * 0.8} ${hy + S * 0.55} ${hx + S * 0.55} ${hy + S * 0.45} Z`,
    fill: p.jaw,
  });
  const big = macaw ? 1.15 : 0.9;
  out += el("path", {
    d: s`M ${hx + S * 0.5} ${hy - S * 0.4}
         Q ${hx + S * (0.5 + 0.7 * big)} ${hy - S * 0.45} ${hx + S * (0.55 + 0.6 * big)} ${hy + S * 0.55 * big}
         Q ${hx + S * (0.5 + 0.35 * big)} ${hy + S * 0.15} ${hx + S * 0.6} ${hy + S * 0.25}
         Q ${hx + S * 0.45} ${hy - S * 0.05} ${hx + S * 0.5} ${hy - S * 0.4} Z`,
    fill: p.beak,
  });
  out += eye(ex, ey, S * 0.1);
  // Toes curled over the front of the branch.
  for (const tx of [cx - S * 0.25, cx + S * 0.25])
    out += el("ellipse", { cx: tx, cy: py + thick * 0.15, rx: S * 0.2, ry: S * 0.13, fill: "#6f6a68" });
  out += "</g>";
  const who = p.name === "macaw" ? "A long-tailed macaw" : `A ${p.name}`;
  note.alt(`${who} perched on a branch among tropical leaves, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(turn(cx, dir, ex), ey);
  // Head and beak.
  note.frame(turnBox(cx, dir, hx - S * 0.9, S * 2.2), hy - S * 0.95, S * 2.2, S * 1.85);
  return out;
});

/** A flamingo standing in water at sy, facing right, its body B long from middle to end. */
function flamingoFigure(x: number, sy: number, B: number, pink: number, oneLeg: boolean, reach: number): string {
  const body = hsl(pink, 72, 74);
  const deep = hsl(pink - 4, 68, 66);
  const leg = hsl(pink, 50, 64);
  const legTop = sy - B * 2.4;
  const by = legTop - B * 0.3;
  // Legs, bending backward at the ankle, or one folded up under the body.
  let legs = s`M ${x + B * 0.08} ${legTop} L ${x + B * 0.14} ${sy - B * 1.15} L ${x + B * 0.08} ${sy}`;
  legs += oneLeg
    ? s`M ${x - B * 0.08} ${legTop} L ${x - B * 0.02} ${legTop + B * 0.95} L ${x - B * 0.55} ${legTop + B * 0.5}`
    : s`M ${x - B * 0.12} ${legTop} L ${x - B * 0.04} ${sy - B * 1.12} L ${x - B * 0.16} ${sy + B * 0.02}`;
  let out = el("path", {
    d: legs,
    stroke: leg,
    "stroke-width": B * 0.075,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  // Dark flight feathers at the tail end, then the body and wing.
  out += el("ellipse", {
    cx: x - B * 0.82,
    cy: by + B * 0.1,
    rx: B * 0.38,
    ry: B * 0.17,
    fill: "#2b2730",
    transform: s`rotate(14 ${x - B * 0.82} ${by + B * 0.1})`,
  });
  out += el("ellipse", { cx: x, cy: by, rx: B, ry: B * 0.56, fill: body, transform: s`rotate(-6 ${x} ${by})` });
  out += el("ellipse", {
    cx: x - B * 0.2,
    cy: by - B * 0.06,
    rx: B * 0.72,
    ry: B * 0.36,
    fill: deep,
    transform: s`rotate(-4 ${x - B * 0.2} ${by - B * 0.06})`,
  });
  // The S-shaped neck and the head.
  const top: Point = [x + B * 0.6, by - B * 2.45 * reach];
  out += neck(
    [[x + B * 0.62, by - B * 0.2], [x + B * 1.4, by - B * 0.8 * reach], [x - B * 0.1, by - B * 1.55 * reach], top],
    B * 0.28,
    B * 0.17,
    body,
  );
  const [hx, hy] = [top[0] + B * 0.05, top[1]];
  out += el("ellipse", { cx: hx, cy: hy, rx: B * 0.25, ry: B * 0.2, fill: body });
  // Beak, bent down, black at the tip.
  out += el("path", {
    d: s`M ${hx + B * 0.12} ${hy - B * 0.15} Q ${hx + B * 0.5} ${hy - B * 0.17} ${hx + B * 0.6} ${hy + B * 0.05}
         L ${hx + B * 0.6} ${hy + B * 0.4} Q ${hx + B * 0.47} ${hy + B * 0.12} ${hx + B * 0.12} ${hy + B * 0.08} Z`,
    fill: "#2b2730",
  });
  out += el("path", {
    d: s`M ${hx + B * 0.12} ${hy - B * 0.15} Q ${hx + B * 0.4} ${hy - B * 0.17} ${hx + B * 0.49} ${hy - B * 0.08}
         L ${hx + B * 0.47} ${hy + B * 0.1} Q ${hx + B * 0.33} ${hy + B * 0.08} ${hx + B * 0.12} ${hy + B * 0.08} Z`,
    fill: "#f3e2dc",
  });
  out += el("circle", { cx: hx + B * 0.02, cy: hy - B * 0.05, r: B * 0.05, fill: "#f2d34e" });
  out += el("circle", { cx: hx + B * 0.02, cy: hy - B * 0.05, r: B * 0.028, fill: "#1a1a1e" });
  return out;
}

/** Where a flamingo's head is, for the figure above. */
const flamingoHead = (x: number, sy: number, B: number, reach: number): Point => [
  x + B * 0.65,
  sy - B * 2.7 - B * 2.45 * reach,
];

/** A flamingo wading in a shallow lagoon, sometimes on one leg, sometimes with others behind. */
export const flamingo = defineKind("flamingo", "Flamingo", { oneLeg: [true, false] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const reach = g.f(0.88, 1.05);
  const sy = h * g.f(0.8, 0.86);
  // Feet to the top of the head is about 5.4 body lengths.
  const B = Math.min(unit * g.f(0.11, 0.13), (sy - h * 0.06) / (2.95 + 2.45 * reach + 0.2), w * 0.16);
  const cx = w * g.f(0.42, 0.55);
  const pink = g.f(345, 365);
  const oneLeg = g.option("oneLeg", g.chance(0.45));
  const hz = h * g.f(0.42, 0.5);
  const dawn = g.chance(0.45);
  const skyHue = dawn ? g.f(15, 35) : g.f(190, 210);
  let out = sky(
    g,
    w,
    h,
    hsl(skyHue + (dawn ? 200 : 0), dawn ? 35 : 50, dawn ? 72 : 72),
    hsl(skyHue, dawn ? 70 : 50, 88),
  );
  if (dawn)
    // A low sun.
    out += el("circle", {
      cx: w * g.pick([g.f(0.12, 0.3), g.f(0.7, 0.88)]),
      cy: hz - unit * g.f(0.04, 0.12),
      r: unit * 0.07,
      fill: hsl(40, 85, 90),
    });
  // A far shore with low trees, then the water.
  out += el("path", {
    d: s`M -5 ${hz} Q ${w * g.f(0.2, 0.8)} ${hz - unit * g.f(0.04, 0.1)} ${w + 5} ${hz} Z`,
    fill: hsl(g.f(95, 140), 25, 50),
  });
  const water = g.id("water");
  const waterHue = g.f(180, 200);
  out += el("defs", {}, lin(water, [hsl(waterHue, 40, 70), hsl(waterHue + 10, 45, 52)]));
  out += el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${water})` });
  // Flamingos farther off, smaller and higher up the water.
  const others = g.chance(0.5) ? g.i(1, 3) : 0;
  let flock = 0;
  for (let k = 0; k < others; k++) {
    const fb = B * g.f(0.32, 0.45);
    const fsy = hz + (sy - hz) * g.f(0.2, 0.4);
    const fx = w * g.f(0.05, 0.95);
    if (Math.abs(fx - cx) < B * 2 || fsy - fb * 5.4 < h * 0.03) continue;
    flock++;
    const fd = g.pick([1, -1]);
    out += el("ellipse", { cx: fx, cy: fsy, rx: fb * 0.6, ry: fb * 0.08, fill: "#fff", opacity: "0.35" });
    out += facing(fx, fd) + flamingoFigure(fx, fsy, fb, pink + g.f(-6, 6), g.chance(0.4), g.f(0.85, 1.05)) + "</g>";
  }
  // The main bird drawn once and used twice: upright, and flipped as its reflection.
  const bird = g.id("bird");
  out += el(
    "defs",
    {},
    el("g", { id: bird }, facing(cx, dir) + flamingoFigure(cx, sy, B, pink, oneLeg, reach) + "</g>"),
  );
  out += el("use", { href: `#${bird}`, transform: s`matrix(1 0 0 -1 0 ${2 * sy})`, opacity: "0.25" });
  // Ripples where its feet stand, then the bird.
  out += el("path", {
    d: s`M ${cx - B * 0.75} ${sy + B * 0.02} q ${B * 0.75} ${B * 0.14} ${B * 1.5} 0
         M ${cx - B * 1.2} ${sy + B * 0.25} q ${B * 0.4} ${B * 0.08} ${B * 0.8} 0
         M ${cx + B * 0.5} ${sy + B * 0.32} q ${B * 0.4} ${B * 0.08} ${B * 0.8} 0`,
    stroke: "#fff",
    "stroke-width": Math.max(1, B * 0.05),
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.55",
  });
  out += el("use", { href: `#${bird}` });
  const pose = oneLeg ? "standing on one leg" : "wading";
  const crowd = flock ? ` with ${flock > 1 ? "others" : "another"} behind` : "";
  note.alt(`A flamingo ${pose} in a shallow lagoon${crowd}${dawn ? " at dawn" : ""}`);
  const [hx, hy] = flamingoHead(cx, sy, B, reach);
  note.focus(turn(cx, dir, hx), hy);
  // Head and the bent beak.
  // The head is small in the scene, so the frame grows about its center to a size an avatar can crop.
  const [fx, fy, fw, fh] = atLeast([hx - B * 0.45, hy - B * 0.4, B * 1.15, B * 0.95], Math.min(w, h) * 0.26);
  note.frame(turnBox(cx, dir, fx, fw), fy, fw, fh);
  return out;
});

/** A tubular flower with its mouth at (x, y), its tube running `len` back at angle `a` (degrees). */
function trumpet(x: number, y: number, a: number, len: number, r: number, petal: string, throat: string): string {
  return el(
    "g",
    { transform: s`translate(${x} ${y}) rotate(${a})` },
    el("path", {
      d: s`M ${len} ${-r * 0.2} Q ${len * 0.5} ${-r * 0.25} ${r * 0.35} ${-r * 0.45} Q ${r * 0.1} ${-r * 0.6} 0 ${-r}
           L 0 ${r} Q ${r * 0.1} ${r * 0.6} ${r * 0.35} ${r * 0.45} Q ${len * 0.5} ${r * 0.25} ${len} ${r * 0.2} Z`,
      fill: petal,
    }),
    el("ellipse", { cx: r * 0.04, cy: 0, rx: r * 0.14, ry: r * 0.75, fill: throat, opacity: "0.45" }),
    el("ellipse", { cx: len, cy: 0, rx: r * 0.35, ry: r * 0.3, fill: "#5a9a40" }),
  );
}

/** A hummingbird hovering to sip from a tubular flower, its wings a blur. */
export const hummingbird = defineKind("hummingbird", "Hummingbird", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const S = Math.min(unit * g.f(0.12, 0.135), (h * 0.86) / 4.2);
  const a = g.f(-14, 10);
  const len = S * g.f(1.4, 1.8);
  // The flower's mouth, where the bill tip goes.
  const mx = w / 2 + S * g.f(0.6, 1.0);
  const my = Math.min(Math.max(h * g.f(0.4, 0.5), S * 1.95 + h * 0.04), h - S * 2.1);
  const rad = (a * Math.PI) / 180;
  const at = (lx: number, ly: number): Point => [
    mx + lx * Math.cos(rad) - ly * Math.sin(rad),
    my + lx * Math.sin(rad) + ly * Math.cos(rad),
  ];
  const hue = g.f(0, 360);
  let out = sky(g, w, h, hsl(hue, 30, 86), hsl(hue + 40, 35, 78));
  // Soft blurred foliage behind.
  let bokeh = "";
  for (let k = g.i(6, 10); k > 0; k--)
    bokeh += el("circle", { cx: w * g.f(0, 1), cy: h * g.f(0, 1), r: unit * g.f(0.05, 0.16) });
  out += el("g", { fill: hsl(g.f(90, 150), 35, 55), opacity: "0.25" }, bokeh);
  const rufous = g.chance(0.25);
  const back = rufous ? "#c8743a" : hsl(g.f(110, 170), 50, g.f(36, 44));
  const gorget = g.pick(["#d6304a", "#c2388f", "#7a4fc9", "#e8683a", "#2f9fb5"]);
  const belly = rufous ? "#f2dcc4" : "#eef0e6";
  const blur = mix(rufous ? "#c8743a" : "#9aa8a0", "#ffffff", 0.35);
  const petal = hsl(g.pick([352, 8, 22, 300, 325, 270]), g.f(65, 80), g.f(52, 60));
  out += facing(w / 2, dir);
  // The bird, drawn with its bill tip at the flower's mouth.
  let bird = "";
  // Tail fanned down and back.
  bird += el("polygon", {
    points: pts([
      [-S * 2.2, S * 1.05],
      [-S * 2.95, S * 1.75],
      [-S * 2.55, S * 1.95],
      [-S * 2.0, S * 1.2],
    ]),
    fill: rufous ? "#b0602a" : "#2e3a36",
  });
  // The far wing's blur.
  bird += el("ellipse", {
    cx: -S * 2.65,
    cy: -S * 0.25,
    rx: S * 0.25,
    ry: S * 0.95,
    fill: blur,
    opacity: "0.45",
    transform: s`rotate(-60 ${-S * 2.65} ${-S * 0.25})`,
  });
  // Body, slanting down to the tail, with its pale belly.
  bird += el("ellipse", {
    cx: -S * 1.95,
    cy: S * 0.6,
    rx: S * 0.92,
    ry: S * 0.43,
    fill: back,
    transform: s`rotate(-50 ${-S * 1.95} ${S * 0.6})`,
  });
  bird += el("ellipse", {
    cx: -S * 1.85,
    cy: S * 0.78,
    rx: S * 0.62,
    ry: S * 0.22,
    fill: belly,
    transform: s`rotate(-50 ${-S * 1.85} ${S * 0.78})`,
  });
  // Head, throat, bill and eye.
  bird += el("circle", { cx: -S * 1.45, cy: 0, r: S * 0.36, fill: back });
  bird += el("ellipse", {
    cx: -S * 1.38,
    cy: S * 0.26,
    rx: S * 0.28,
    ry: S * 0.17,
    fill: gorget,
    transform: s`rotate(-25 ${-S * 1.38} ${S * 0.26})`,
  });
  bird += el("polygon", {
    points: pts([
      [-S * 1.14, -S * 0.07],
      [S * 0.08, 0],
      [-S * 1.14, S * 0.05],
    ]),
    fill: "#26262c",
  });
  bird += eye(-S * 1.4, -S * 0.08, S * 0.07);
  // The near wing: a blur of two strokes and a fan between them.
  bird += el("path", {
    d: s`M ${-S * 1.9} ${S * 0.2} L ${-S * 2.0} ${-S * 1.55} Q ${-S * 2.8} ${-S * 1.4} ${-S * 3.0} ${-S * 0.6} Z`,
    fill: blur,
    opacity: "0.3",
  });
  bird += el("ellipse", {
    cx: -S * 2.05,
    cy: -S * 0.75,
    rx: S * 0.18,
    ry: S * 0.85,
    fill: blur,
    opacity: "0.65",
    transform: s`rotate(-12 ${-S * 2.05} ${-S * 0.75})`,
  });
  out += el("g", { transform: s`translate(${mx} ${my}) rotate(${a})` }, bird);
  // The flower stalk: it rises from below, through the feeding flower's base, and on up.
  const base = at(len, 0);
  const sway = S * g.f(-0.6, 0.6);
  const tip: Point = [base[0] + S * g.f(-0.3, 0.5), Math.max(h * 0.04, base[1] - S * g.f(2.2, 3))];
  const green = hsl(g.f(95, 130), 40, g.f(32, 40));
  out += el("path", {
    d: s`M ${base[0] + sway} ${h + 5} Q ${base[0] + sway * 1.5} ${(h + base[1]) / 2} ${base[0]} ${base[1]}
         T ${tip[0]} ${tip[1]}`,
    stroke: green,
    "stroke-width": Math.max(1.5, S * 0.12),
    fill: "none",
  });
  // Leaves low on the stalk.
  for (let k = g.i(1, 3); k > 0; k--) {
    const ly = base[1] + (h - base[1]) * g.f(0.25, 0.8);
    const side = g.pick([-1, 1]);
    out += el("ellipse", {
      cx: base[0] + sway + side * S * 0.45,
      cy: ly,
      rx: S * 0.5,
      ry: S * 0.18,
      fill: green,
      transform: s`rotate(${side * -30} ${base[0] + sway + side * S * 0.45} ${ly})`,
    });
  }
  // Other flowers hanging from the upper stalk, then the one the bird drinks from.
  const r = S * 0.48;
  const blooms = g.i(2, 4);
  const first = g.pick([1, -1]);
  for (let k = 0; k < blooms; k++) {
    // Spread up the stalk, alternately hanging away from the bird and reaching up the other way.
    const t = 0.35 + (0.65 * (k + g.f(0.2, 0.8))) / blooms;
    const ax = base[0] + (tip[0] - base[0]) * t;
    const ay = base[1] + (tip[1] - base[1]) * t;
    const down = g.f(15, 60);
    const up = g.f(-150, -115);
    const fl = len * g.f(0.7, 0.9);
    // Reaching up only where there's room below the top edge.
    const p = (k % 2 ? -first : first) > 0 || ay - fl * 0.8 - r < h * 0.03 ? down : up;
    const pr = (p * Math.PI) / 180;
    out += trumpet(ax + Math.cos(pr) * fl, ay + Math.sin(pr) * fl, p + 180, fl, r, petal, "#000");
  }
  out += trumpet(mx, my, a, len, r, petal, "#000");
  out += "</g>";
  const [hx, hy] = at(-S * 1.45, 0);
  note.alt(`A hummingbird hovering to sip from a tubular flower, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(turn(w / 2, dir, hx), hy);
  // The head, with the start of the bill.
  // The head is small in the scene, so the frame grows about its center to a size an avatar can crop.
  const [fx, fy, fw, fh] = atLeast([hx - S * 0.55, hy - S * 0.6, S * 1.3, S * 1.2], Math.min(w, h) * 0.26);
  note.frame(turnBox(w / 2, dir, fx, fw), fy, fw, fh);
  return out;
});
