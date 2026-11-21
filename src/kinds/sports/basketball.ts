import { defineKind, el, hex, type Point, pts, type Rand, s } from "../../draw/core";
import { darker, lighter, place } from "./shared";

/** A smooth closed path rounding off the corners of a polygon: curves between edge midpoints. */
function smooth(p: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${pts([mid(p[p.length - 1], p[0])])}`;
  for (let i = 0; i < p.length; i++) d += `Q${pts([p[i], mid(p[i], p[(i + 1) % p.length])])}`;
  return d + "Z";
}

/** Turns a point by `deg` degrees about the origin. */
function turned([x, y]: Point, deg: number): Point {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Maple boards seen from above, with a little grain, and part of a painted court line sometimes. */
function floor(g: Rand, w: number, h: number, k: number): { out: string; court: boolean } {
  const unit = Math.min(w, h);
  const hue = g.f(28, 38);
  const lightness = g.f(60, 70);
  const base = hex(hue, g.f(45, 58), lightness);
  let out = el("rect", { width: w, height: h, fill: base });
  // A tile of six boards, each its own shade, with an end joint somewhere along it.
  const bw = Math.max(7, 16 * k);
  const len = bw * g.f(9, 13);
  const id = g.id("boards");
  let tile = "";
  let light = "";
  let dark = "";
  let seams = "";
  let grain = "";
  for (let j = 0; j < 6; j++) {
    const x = j * bw;
    const board = s`M${x} 0h${bw}V${len}h${-bw}Z`;
    const tint = g.i(0, 2);
    if (tint === 1) light += board;
    if (tint === 2) dark += board;
    const joint = g.f(0, len);
    seams += s`M${x} 0V${len}M${x} ${joint}h${bw}`;
    const gx = x + bw * g.f(0.2, 0.8);
    grain += s`M${gx} ${g.f(0, len * 0.5)}q${bw * g.f(-0.3, 0.3)} ${len * 0.2} 0 ${len * g.f(0.3, 0.45)}`;
  }
  tile +=
    el("path", { d: light, fill: "#ffffff", opacity: 0.1 }) + el("path", { d: dark, fill: "#5a3410", opacity: 0.1 });
  const thin = Math.max(0.6, bw * 0.06);
  tile += el("path", { d: grain, stroke: "#6b3f15", opacity: 0.16, fill: "none", "stroke-width": thin });
  tile += el("path", { d: seams, stroke: "#4a2a0c", opacity: 0.3, "stroke-width": thin * 1.3 });
  const across = g.chance(0.5);
  out += el(
    "defs",
    {},
    el(
      "pattern",
      {
        id,
        width: bw * 6,
        height: len,
        patternUnits: "userSpaceOnUse",
        patternTransform: across ? "rotate(90)" : undefined,
      },
      tile,
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // The edge of a painted line, near one side so it runs behind the gear, not through its middle.
  const court = g.chance(0.55);
  if (court) {
    const paint = g.pick(["#f6f3ea", "#f6f3ea", hex(g.f(0, 360), 55, 45), "#2b2b2e"]);
    const lw = Math.max(4, 16 * k);
    const along = g.chance(0.5);
    const at = g.pick([g.f(0.04, 0.14), g.f(0.86, 0.96)]);
    const arc = g.chance(0.35);
    let d: string;
    if (arc) {
      // A sweep of a big circle, as the three-point line or the center circle.
      const r = unit * g.f(1.6, 2.4);
      const cx = w * g.f(0.2, 0.8);
      const top = at < 0.5;
      const cy = top ? h * at - r : h * at + r;
      d = s`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
    } else d = along ? s`M${w * at} 0V${h}` : s`M0 ${h * at}H${w}`;
    // Sometimes the area beyond the line is painted too.
    if (!arc && g.chance(0.4)) {
      const zone = hex(g.f(0, 360), g.f(35, 55), g.f(38, 50));
      const r = along
        ? at < 0.5
          ? { x: 0, y: 0, width: w * at, height: h }
          : { x: w * at, y: 0, width: w * (1 - at), height: h }
        : at < 0.5
          ? { x: 0, y: 0, width: w, height: h * at }
          : { x: 0, y: h * at, width: w, height: h * (1 - at) };
      out += el("rect", { ...r, fill: zone, opacity: 0.8 });
    }
    out += el("path", { d, fill: "none", stroke: paint, opacity: 0.88, "stroke-width": lw });
  }
  return { out, court };
}

/** A basketball seen from above at (0, 0), radius 40, with its channels and a shadow. */
function ball(g: Rand): string {
  const r = 40;
  const leather = g.chance(0.8)
    ? hex(g.f(16, 28), g.f(66, 80), g.f(44, 53))
    : hex(g.f(28, 36), g.f(40, 55), g.f(50, 58));
  const channel = darker(leather, g.f(0.7, 0.8));
  const t = g.f(0.15, 0.35);
  const u = g.f(0.1, 0.3);
  let out = el("circle", { cx: 0, cy: 0, r, fill: leather });
  out += el("path", {
    d: s`M${-r} 0A${r} ${r * t} 0 0 0 ${r} 0M0 ${-r}A${r * u} ${r} 0 0 1 0 ${r}
         M${-r * 0.62} ${-r * 0.78}Q${-r * 0.18} 0 ${-r * 0.62} ${r * 0.78}
         M${r * 0.62} ${-r * 0.78}Q${r * 0.18} 0 ${r * 0.62} ${r * 0.78}`,
    transform: s`rotate(${g.f(0, 360)})`,
    fill: "none",
    stroke: channel,
    "stroke-width": r * 0.055,
    "stroke-linecap": "round",
  });
  // Shade on the side away from the light, and a soft highlight.
  out += el("path", {
    d: s`M${-r * 0.75} ${r * 0.66}A${r} ${r} 0 0 0 ${r * 0.75} ${-r * 0.66}A${r * 1.15} ${r * 1.15} 0 0 1 ${-r * 0.75} ${r * 0.66}Z`,
    fill: "#000",
    opacity: 0.16,
  });
  out += el("circle", { cx: -r * 0.36, cy: -r * 0.38, r: r * 0.3, fill: "#ffffff", opacity: 0.16 });
  return out;
}

/** The upper of a right high-top seen from above, toe toward -y, outer side toward +x. */
const UPPER: Point[] = [
  [3, -55],
  [15, -50],
  [20, -38],
  [21, -22],
  [18, -6],
  [17, 12],
  [18, 30],
  [15, 47],
  [6, 55],
  [-5, 55],
  [-14, 48],
  [-17, 32],
  [-14, 14],
  [-15, -2],
  [-19, -20],
  [-17, -40],
  [-10, -51],
];

/** The sole peeks out around the upper, most at the toe. */
const SOLE: Point[] = /* @__PURE__ */ UPPER.map(([x, y]) => [Math.round(x * 1.13), Math.round(y * 1.05 + 0.5)]);

const STRIPES = ["band", "double", "panel"] as const;

/**
 * A pair of high-top sneakers seen from above, each about 116 long and 46 wide. Returns the markup,
 * the outline of both shoes for layout, and the right shoe drawn once in defs to keep it short.
 */
function sneakers(g: Rand): { out: string; shade: string; hull: Point[] } {
  const hue = g.f(0, 360);
  const style = g.i(0, 2);
  const color = hex(hue, g.f(50, 72), g.f(40, 52));
  const contrast = hex(hue + g.pick([150, 180, 210]), g.f(50, 70), g.f(45, 58));
  const white = "#f3f1ec";
  // Mostly white with color, bold color with white, or dark with a bright stripe.
  const upper = style === 0 ? white : style === 1 ? color : hex(hue, 12, 20);
  const toe = style === 0 ? "#fbfaf7" : style === 1 ? (g.chance(0.5) ? white : darker(color, 0.3)) : hex(hue, 10, 28);
  const stripePaint = style === 0 ? color : style === 1 ? (g.chance(0.5) ? white : contrast) : color;
  const collar = style === 0 ? (g.chance(0.5) ? color : white) : style === 1 ? darker(color, 0.25) : hex(hue, 10, 14);
  const sole = style === 2 && g.chance(0.4) ? "#c8955a" : style === 2 || g.chance(0.85) ? "#fbfaf6" : "#2d2c2e";
  const laces = style === 2 ? g.pick([white, color]) : g.pick([white, white, darker(upper, 0.5)]);
  const stripe = g.pick(STRIPES);
  const soleId = g.id("sole");
  const upperId = g.id("vamp");
  const upperUse = (attrs: Record<string, string | number>): string => el("use", { href: `#${upperId}`, ...attrs });
  const shoe = g.id("shoe");
  const clip = g.id("upper");
  // The shoe itself.
  let body = el("use", { href: `#${soleId}`, fill: sole });
  body += upperUse({ fill: upper });
  // Everything printed or stitched on the upper stays inside its outline.
  let on = el("ellipse", { cx: 0, cy: -46, rx: 27, ry: 20, fill: toe });
  on += el("path", {
    d: "M-24 -36Q0 -18 24 -36",
    fill: "none",
    stroke: darker(toe, 0.25),
    "stroke-width": 1,
    "stroke-dasharray": "2 1.6",
  });
  let holes = "";
  for (let j = -2; j <= 2; j++) holes += s`M${j * 5 - 0.9} ${-42 + Math.abs(j) * 1.2}h1.8`;
  on += el("path", { d: holes, stroke: darker(toe, 0.3), "stroke-width": 1.6, "stroke-linecap": "round" });
  if (stripe === "band") on += el("path", { d: "M30 22L6 -14M-30 22L-6 -14", stroke: stripePaint, "stroke-width": 8 });
  else if (stripe === "double")
    on += el("path", {
      d: "M30 16L8 -14M30 28L8 -4M-30 16L-8 -14M-30 28L-8 -4",
      stroke: stripePaint,
      "stroke-width": 3.6,
    });
  else on += el("path", { d: "M-24 2Q0 -6 24 2V30H-24Z", fill: stripePaint });
  // A heel counter, and shade along the inner edge so the upper looks rounded.
  on += el("ellipse", { cx: 0, cy: 54, rx: 20, ry: 9, fill: darker(collar, 0.1) });
  on += upperUse({ fill: "none", stroke: "#000", opacity: 0.12, "stroke-width": 3 });
  body += el("clipPath", { id: clip }, upperUse({})) + el("g", { "clip-path": `url(#${clip})` }, on);
  // The tongue and the lacing panel.
  const tongue = lighter(upper === white ? "#d9d5cc" : upper, 0.12);
  body += el("rect", { x: -11, y: -26, width: 22, height: 50, rx: 7, fill: darker(upper, 0.1) });
  body += el("rect", { x: -7, y: -24, width: 14, height: 50, rx: 5, fill: tongue });
  // The padded ankle collar, its opening, and the top of the tongue standing up in it.
  // It stands up toward us, so it looks a little wider than the heel below it.
  body += el("rect", { x: -4, y: 48, width: 8, height: 12, rx: 2.5, fill: stripePaint });
  body += el("ellipse", { cx: 0, cy: 34, rx: 19.5, ry: 20, fill: collar });
  body += el("ellipse", {
    cx: 0,
    cy: 34,
    rx: 15,
    ry: 15.5,
    fill: "none",
    stroke: darker(collar, 0.2),
    "stroke-width": 0.9,
    "stroke-dasharray": "2 1.5",
  });
  body += el("ellipse", { cx: 0, cy: 37, rx: 10, ry: 11.5, fill: "#211d1b" });
  body += el("ellipse", { cx: 0, cy: 42, rx: 6.5, ry: 5.5, fill: "#3a3330" });
  body += el("path", { d: "M-7 24Q0 18 7 24L6 30Q0 27 -6 30Z", fill: tongue });
  // Laces crossing between two rows of eyelets, tied in a bow near the collar.
  const lace = "M-9.5 -20L9.5 -13L-9.5 -6L9.5 1L-9.5 8L9.5 15M9.5 -20L-9.5 -13L9.5 -6L-9.5 1L9.5 8L-9.5 15";
  body += el("path", {
    d: "M-9.8 -20V15M9.8 -20V15",
    stroke: darker(upper, 0.45),
    "stroke-width": 3,
    "stroke-linecap": "round",
    "stroke-dasharray": "0 7",
  });
  body += el("path", {
    d: lace,
    fill: "none",
    stroke: laces,
    "stroke-width": 2.4,
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  });
  body += el("path", {
    d: "M0 17C-5 12 -11 14 -8 18C-6 21 -2 19 0 17C5 12 11 14 8 18C6 21 2 19 0 17M0 17L-4 27M0 17L5 26",
    fill: "none",
    stroke: laces,
    "stroke-width": 2,
    "stroke-linecap": "round",
  });
  // Light along the outer side of the toe.
  body += el("path", { d: "M-12 -46Q-2 -54 10 -48", fill: "none", stroke: "#ffffff", opacity: 0.3, "stroke-width": 3 });
  // The pair, a little apart and not quite in line, toes turned slightly out or in.
  const stagger = g.f(-12, 12);
  const apart = g.f(26, 31);
  const splay = g.f(-7, 9);
  const right = { x: apart, y: stagger / 2, turn: splay };
  const left = { x: -apart, y: -stagger / 2, turn: -splay + g.f(-4, 4) };
  let out = el(
    "defs",
    {},
    el("path", { id: soleId, d: smooth(SOLE) }),
    el("path", { id: upperId, d: smooth(UPPER) }),
    el("g", { id: shoe }, body),
  );
  let shade = "";
  const hull: Point[] = [];
  for (const [p, flip] of [
    [left, true],
    [right, false],
  ] as const) {
    const tf = s`translate(${p.x} ${p.y}) rotate(${p.turn})${flip ? " scale(-1 1)" : ""}`;
    shade += el("use", { href: `#${soleId}`, transform: tf });
    out += el("use", { href: `#${shoe}`, transform: tf });
    for (const q of SOLE) {
      const [x, y] = turned([flip ? -q[0] : q[0], q[1]], p.turn);
      hull.push([x + p.x, y + p.y]);
    }
  }
  return { out, shade, hull };
}

/** A tank-top jersey's outline laid flat, about 150 wide and 180 tall, neck toward -y. */
const JERSEY = "M-22 -88Q0 -36 22 -88H42C43 -58 49 -34 66 -28L70 86Q0 94 -70 86L-66 -28C-49 -34 -43 -58 -42 -88Z";

const NECK = "M-22 -88Q0 -36 22 -88";

const ARMS = "M42 -88C43 -58 49 -34 66 -28M-42 -88C-43 -58 -49 -34 -66 -28";

/** Which of the seven segments (top, upper right, lower right, bottom, lower left, upper left, middle) light up each digit. */
const DIGITS = [
  "1111110",
  "0110000",
  "1101101",
  "1111001",
  "0110011",
  "1011011",
  "1011111",
  "1110000",
  "1111111",
  "1111011",
];

/** A number as blocky seven-segment strokes, centered on (0, cy), each digit dw wide and dh tall. */
function numberPath(n: number, cy: number, dw: number, dh: number): string {
  const digits = String(n).split("").map(Number);
  const gap = dw * 0.55;
  const total = digits.length * dw + (digits.length - 1) * gap;
  let d = "";
  for (const [j, digit] of digits.entries()) {
    const x = -total / 2 + j * (dw + gap);
    const y = cy - dh / 2;
    const segs = [
      s`M${x} ${y}h${dw}`,
      s`M${x + dw} ${y}v${dh / 2}`,
      s`M${x + dw} ${y + dh / 2}v${dh / 2}`,
      s`M${x} ${y + dh}h${dw}`,
      s`M${x} ${y + dh / 2}v${dh / 2}`,
      s`M${x} ${y}v${dh / 2}`,
      s`M${x} ${y + dh / 2}h${dw}`,
    ];
    for (const [i, on] of DIGITS[digit].split("").entries()) if (on === "1") d += segs[i];
  }
  return d;
}

/** A basketball jersey laid flat, seen from above: trim round the neck and arms, side panels and a big number. */
function jersey(g: Rand): { out: string; number: number } {
  const hue = g.f(0, 360);
  const home = g.chance(0.3);
  const paint = home ? "#f4f2ec" : hex(hue, g.f(50, 72), g.f(36, 52));
  const trim = home
    ? hex(hue, g.f(55, 70), g.f(36, 48))
    : g.pick(["#f4f2ec", hex(hue + g.pick([150, 180, 40]), 65, 58)]);
  const edge = g.pick([trim, home ? darker(trim, 0.35) : "#f4f2ec"]);
  const number = g.chance(0.25) ? g.i(0, 9) : g.i(10, 99);
  let out = el("path", { d: JERSEY, fill: paint });
  // Side panels from the underarms down.
  if (g.chance(0.6))
    out += el("path", { d: "M-66 -28L-70 86H-58L-56 -26ZM66 -28L70 86H58L56 -26Z", fill: trim, opacity: 0.9 });
  // The number, with an outline in a second color sometimes.
  const nd = numberPath(number, 4, 22, 46);
  if (edge !== trim)
    out += el("path", { d: nd, stroke: edge, "stroke-width": 13, "stroke-linecap": "square", fill: "none" });
  out += el("path", { d: nd, stroke: trim, "stroke-width": 8, "stroke-linecap": "square", fill: "none" });
  // A short bar where a team name would go, above the number.
  out += el("path", {
    d: "M-24 -38Q0 -44 24 -38",
    stroke: trim,
    "stroke-width": 4,
    fill: "none",
    "stroke-linecap": "round",
    opacity: 0.85,
  });
  // Ribbed trim round the neck and arms, and the hem.
  out += el("path", { d: NECK + ARMS, stroke: trim, "stroke-width": 7, fill: "none" });
  out += el("path", { d: "M-70 82Q0 90 70 82", stroke: "#000", opacity: 0.1, "stroke-width": 2, fill: "none" });
  // Soft folds in the fabric.
  out += el("path", {
    d: s`M${g.f(-50, -30)} ${g.f(20, 50)}Q${g.f(-20, 0)} ${g.f(40, 60)} ${g.f(10, 30)} ${g.f(60, 75)}M${g.f(30, 50)} ${g.f(-20, 0)}Q${g.f(40, 55)} ${g.f(20, 30)} ${g.f(35, 50)} ${g.f(50, 70)}`,
    stroke: "#000",
    opacity: 0.08,
    "stroke-width": 5,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("path", { d: "M-60 -20Q-62 30 -62 78", stroke: "#ffffff", opacity: 0.12, "stroke-width": 6, fill: "none" });
  return { out, number };
}

type Piece = "ball" | "shoes" | "jersey";

/** A basketball, a pair of high-tops and a jersey laid out on a court floor. */
export const basketball = /* @__PURE__ */ defineKind("basketball", "Basketball", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const pieces = ["ball", "shoes", "jersey"] as const;
  const shoes = sneakers(g);
  const shirt = jersey(g);
  // Each piece's outline about its own center, before it is turned, and its shadow's shape.
  const ring: Point[] = [];
  for (let a = 0; a < 16; a++) ring.push([Math.cos((a / 8) * Math.PI) * 40, Math.sin((a / 8) * Math.PI) * 40]);
  const hulls: Record<Piece, Point[]> = {
    ball: ring,
    shoes: shoes.hull,
    jersey: [
      [-42, -88],
      [42, -88],
      [70, -28],
      [70, 90],
      [-70, 90],
      [-70, -28],
    ],
  };
  const shades: Record<Piece, string> = {
    ball: el("circle", { r: 40 }),
    shoes: shoes.shade,
    jersey: el("path", { d: JERSEY }),
  };
  // How each piece might lie: shoes toes up or toward a side, the bottle and towel either way round.
  const turns: Record<Piece, number[]> = {
    ball: [0],
    shoes: [g.f(-12, 12), g.pick([90, -90]) + g.f(-10, 10)],
    jersey: [g.f(-8, 8)],
  };
  const order = pieces.map(p => ({ p, key: g.f(0, 1) })).sort((m, n) => m.key - n.key);
  const nudge = order.map(() => g.f(-1, 1));
  const margin = unit * 0.05;
  const gap = 12;
  // Try rows, columns and two by two, each piece either way round; keep a layout that fills the picture.
  type Layout = { k: number; at: { p: Piece; x: number; y: number; turn: number }[] };
  const layouts: Layout[] = [];
  for (let mask = 0; mask < 1 << order.length; mask++) {
    const boxes = order.map(({ p }, j) => {
      const choice = turns[p][(mask >> j) & 1] ?? turns[p][0];
      if (turns[p].length === 1 && (mask >> j) & 1) return null;
      const q = hulls[p].map(pt => turned(pt, choice));
      const xs = q.map(v => v[0]);
      const ys = q.map(v => v[1]);
      return { p, turn: choice, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
    if (boxes.some(b => b === null)) continue;
    const bs = boxes as NonNullable<(typeof boxes)[number]>[];
    for (const shape of ["row", "column", "grid"] as const) {
      if (shape === "grid" && bs.length < 3) continue;
      const rows: (typeof bs)[] =
        shape === "row" ? [bs] : shape === "column" ? bs.map(b => [b]) : [bs.slice(0, 2), bs.slice(2)];
      const at: Layout["at"] = [];
      let y = 0;
      let x0 = Infinity;
      let x1 = -Infinity;
      for (const line of rows) {
        const tall = Math.max(...line.map(b => b.y1 - b.y0));
        const wide = line.reduce((sum, b) => sum + b.x1 - b.x0, 0) + gap * (line.length - 1);
        let x = -wide / 2;
        for (const b of line) {
          const slack = tall - (b.y1 - b.y0);
          const j = bs.indexOf(b);
          const cy = y + slack / 2 + (slack / 2) * nudge[j] - b.y0;
          at.push({ p: b.p, x: x - b.x0, y: cy, turn: b.turn });
          x += b.x1 - b.x0 + gap;
        }
        x0 = Math.min(x0, -wide / 2);
        x1 = Math.max(x1, wide / 2);
        y += tall + gap;
      }
      const total = y - gap;
      const k = Math.min((w - margin * 2) / (x1 - x0), (h - margin * 2) / total);
      layouts.push({ k, at: at.map(a => ({ ...a, y: a.y - total / 2 })) });
    }
  }
  const best = Math.max(...layouts.map(l => l.k));
  const good = layouts.filter(l => l.k >= best * 0.93);
  const { k, at } = g.pick(good);
  const ground = floor(g, w, h, k);
  let out = ground.out;
  let focus: Point = [w / 2, h / 2];
  for (const { p, x, y, turn } of at) {
    const px = w / 2 + x * k;
    const py = h / 2 + y * k;
    const body = p === "ball" ? ball(g) : p === "shoes" ? shoes.out : shirt.out;
    // Shadows fall down and to the right whichever way a piece is turned.
    const soft = p === "ball" ? 6 : 4;
    out += el(
      "g",
      { transform: place(px + soft * k, py + (soft + 1) * k, k, turn), fill: "#000", opacity: 0.26 },
      shades[p],
    );
    out += el("g", { transform: place(px, py, k, turn) }, body);
    if (p === "ball") focus = [px, py];
  }
  note.alt(
    `A basketball, a pair of high-top sneakers and a jersey with the number ${shirt.number} on a hardwood ${ground.court ? "court" : "floor"}`,
  );
  note.focus(...focus);
  return out;
});
