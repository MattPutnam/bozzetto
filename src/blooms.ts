/** Close-up flowers, each drawn after a real species, against a soft out-of-focus background. */
import { defineKind, el, fill, hsl, lin, mix, s, type Point, type Rand } from "./core";
import { capitalize, numberWord } from "./words";
import { smoothClosed } from "./shapes";

// A bloom is laid out in its own space and projected onto the picture. In that space `a` runs
// out from the flower's axis, `b` up the axis (toward the viewer for a face-on flower) and `c`
// sideways; each petal sits at an angle `theta` around the axis.
type V3 = readonly [number, number, number];

/** Where a bloom sits and how it is turned: tilt 0 is side on, PI/2 faces the viewer; roll spins it. */
interface View {
  x: number;
  y: number;
  tilt: number;
  roll: number;
}

/** A point of a bloom, projected onto the picture. */
function at(v: View, theta: number, p: V3): Point {
  const x = p[0] * Math.cos(theta) - p[2] * Math.sin(theta);
  const z = p[0] * Math.sin(theta) + p[2] * Math.cos(theta);
  const y = -p[1] * Math.cos(v.tilt) + z * Math.sin(v.tilt);
  return [v.x + x * Math.cos(v.roll) - y * Math.sin(v.roll), v.y + x * Math.sin(v.roll) + y * Math.cos(v.roll)];
}

/** How near the viewer a point of a bloom is, and how much of that comes from leaning toward them. */
function nearness(v: View, theta: number, p: V3): { z: number; lean: number } {
  const z = p[0] * Math.sin(theta) + p[2] * Math.cos(theta);
  return { z: p[1] * Math.sin(v.tilt) + z * Math.cos(v.tilt), lean: z * Math.cos(v.tilt) };
}

/** A drawn petal: its path, and where it falls in drawing order. */
interface Part {
  d: string;
  z: number;
  lean: number;
}

interface PetalShape {
  /** How far out from the axis the petal starts. */
  from?: number;
  len: number;
  wid: number;
  /** Angle of the petal above the flower's plane: 0 lies flat, PI/2 stands up along the axis. */
  lift: number;
  /** How far the petal's edges curl inward, as a fraction of its length. */
  cup?: number;
  /** How far the tip curls inward. */
  bend?: number;
  /** How far the middle bulges outward. */
  belly?: number;
  /** 0 for a pointed tip, 1 for a round one. */
  tip?: number;
}

/** The petal's frame: a point `u` along it, `across` it, and `up` off its face. */
function petalFrame(p: PetalShape): (u: number, across: number, up: number) => V3 {
  const from = p.from ?? 0;
  const ca = Math.cos(p.lift);
  const sa = Math.sin(p.lift);
  return (u, across, up) => [from + u * ca - up * sa, u * sa + up * ca, across];
}

/** A petal with smooth sides, pointed or round at the tip. */
function petal(v: View, theta: number, p: PetalShape): Part {
  const local = petalFrame(p);
  const len = p.len;
  const wid = p.wid;
  const cup = (p.cup ?? 0) * len;
  const bend = (p.bend ?? 0) * len;
  const belly = (p.belly ?? 0) * len;
  const tip = p.tip ?? 0.5;
  const near = 0.8 + 0.2 * tip;
  const narrow = 0.2 + 0.45 * tip;
  const ring: V3[] = [
    local(0, 0, 0),
    local(len * 0.3, -wid * 0.62, cup - belly),
    local(len * near, -wid * narrow, cup * 0.8 + bend * 0.6 - belly * 0.3),
    local(len, 0, bend),
    local(len * near, wid * narrow, cup * 0.8 + bend * 0.6 - belly * 0.3),
    local(len * 0.3, wid * 0.62, cup - belly),
    local(0, 0, 0),
  ];
  const q = ring.map(point => at(v, theta, point));
  return {
    d: s`M${q[0][0]} ${q[0][1]}C${q[1][0]} ${q[1][1]} ${q[2][0]} ${q[2][1]} ${q[3][0]} ${q[3][1]}C${q[4][0]} ${q[4][1]} ${q[5][0]} ${q[5][1]} ${q[6][0]} ${q[6][1]}Z`,
    ...nearness(v, theta, local(len * 0.5, 0, cup * 0.5)),
  };
}

/**
 * A ring of rays for a flat flower head, drawn once at radius 100 around 0 0 and placed with `onFace`.
 * Whole numbers are plenty at that scale and keep the markup small.
 */
function flatRays(g: Rand, count: number, from: number, len: number, wid: number, tip: number, offset: number): string {
  const near = 0.8 + 0.2 * tip;
  const narrow = 0.2 + 0.45 * tip;
  let d = "";
  for (let k = 0; k < count; k++) {
    const theta = offset + (k * Math.PI * 2) / count + g.f(-0.05, 0.05);
    const l = len * g.f(0.88, 1.04);
    const bend = l * g.f(-0.06, 0.06);
    const c = Math.cos(theta);
    const sn = Math.sin(theta);
    const p = (u: number, across: number) =>
      `${Math.round((from + u) * c - across * sn)} ${Math.round((from + u) * sn + across * c)}`;
    d +=
      `M${p(0, 0)}C${p(l * 0.3, -wid * 0.62)} ${p(l * near, -wid * narrow + bend)} ${p(l, bend)}` +
      `C${p(l * near, wid * narrow + bend)} ${p(l * 0.3, wid * 0.62)} ${p(0, 0)}Z`;
  }
  return d;
}

/** Dots in the sunflower spiral on a disc of radius `r` around 0 0, as one path of round-capped specks. */
function flatSpiral(r: number, count: number, size: number, paint: string, from = 0): string {
  let d = "";
  for (let k = Math.round(count * from); k < count; k++) {
    const dist = r * Math.sqrt((k + 0.5) / count);
    d += s`M${dist * Math.cos(k * 2.39996)} ${dist * Math.sin(k * 2.39996)}h.1`;
  }
  return el("path", { d, stroke: paint, "stroke-width": size, "stroke-linecap": "round" });
}

/** The transform that lays a drawing made at radius 100 onto a bloom of radius `r`, spun by `spin` and raised `b`. */
function onFace(v: View, r: number, spin: number, b = 0): string {
  const k = r / 100;
  const st = Math.max(0.05, Math.sin(v.tilt));
  const cr = Math.cos(v.roll);
  const sr = Math.sin(v.roll);
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  const [x, y] = at(v, 0, [0, b, 0]);
  const m = [cr * cs - sr * st * ss, sr * cs + cr * st * ss, -cr * ss - sr * st * cs, -sr * ss + cr * st * cs];
  return `matrix(${m.map(value => (value * k).toFixed(3)).join(" ")} ${x.toFixed(1)} ${y.toFixed(1)})`;
}

/** A broad fan-shaped petal with a wavy outer edge, like a poppy's or a hibiscus's. */
function fan(g: Rand, v: View, theta: number, p: PetalShape & { spread: number; wobble: number }): Part {
  const local = petalFrame(p);
  const len = p.len;
  const cup = (p.cup ?? 0) * len;
  const lobes = 9;
  const ring: V3[] = [local(len * 0.02, -len * 0.08, 0)];
  for (let k = 0; k <= lobes; k++) {
    const phi = -p.spread + (2 * p.spread * k) / lobes;
    const r = len * (0.72 + 0.28 * Math.cos((phi / p.spread) * 1.45)) * g.f(1 - p.wobble, 1 + p.wobble);
    const across = r * Math.sin(phi);
    ring.push(local(r * Math.cos(phi), across, cup * (across / len) ** 2 * 3));
  }
  ring.push(local(len * 0.02, len * 0.08, 0), local(-len * 0.03, 0, 0));
  return { d: smoothClosed(ring.map(point => at(v, theta, point))), ...nearness(v, theta, local(len * 0.5, 0, cup)) };
}

/** A circle lying across the bloom at height `b`: a flat disc seen at the bloom's tilt. */
function disc(v: View, b: number, r: number, paint: string): string {
  const [cx, cy] = at(v, 0, [0, b, 0]);
  return el("ellipse", {
    cx,
    cy,
    rx: r,
    ry: r * Math.max(0.05, Math.sin(v.tilt)),
    fill: paint,
    transform: s`rotate(${(v.roll * 180) / Math.PI} ${cx} ${cy})`,
  });
}

/** Dots on a disc in the sunflower spiral, as one path of round-capped specks. */
function spiral(v: View, b: number, r: number, count: number, size: number, paint: string, from = 0): string {
  let d = "";
  for (let k = Math.round(count * from); k < count; k++) {
    const p = at(v, k * 2.39996, [r * Math.sqrt((k + 0.5) / count), b, 0]);
    d += s`M${p[0]} ${p[1]}h.1`;
  }
  return el("path", { d, stroke: paint, "stroke-width": size, "stroke-linecap": "round" });
}

/** A pointed leaf from (x, y) toward `angle`; `base` near 0 makes it broad at the stalk, `bend` curves it. */
function leaf(x: number, y: number, angle: number, len: number, wid: number, base = 0.25, bend = 0) {
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  const p = (u: number, across: number) => {
    const off = across + bend * len * (u / len) ** 2;
    return s`${x + u * c - off * sn} ${y + u * sn + off * c}`;
  };
  return {
    d: `M${p(0, 0)}C${p(len * base, -wid)} ${p(len * 0.7, -wid * 0.75)} ${p(len, 0)}C${p(len * 0.7, wid * 0.75)} ${p(len * base, wid)} ${p(0, 0)}Z`,
    rib: `M${p(0, 0)}Q${p(len * 0.5, 0)} ${p(len * 0.9, 0)}`,
  };
}

/** A leaf with its midrib drawn a shade lighter. */
function leafEl(shape: { d: string; rib: string }, paint: string, rib: number): string {
  return (
    el("path", { d: shape.d, fill: paint }) +
    el("path", {
      d: shape.rib,
      stroke: mix(paint, "#ffffff", 0.25),
      "stroke-width": rib,
      fill: "none",
      "stroke-linecap": "round",
    })
  );
}

/** A stem from (x0, y0) to (x1, y1), bowed sideways by `bow`. */
function stem(x0: number, y0: number, x1: number, y1: number, bow: number, width: number, paint: string): string {
  return el("path", {
    d: s`M${x0} ${y0}Q${(x0 + x1) / 2 + bow} ${(y0 + y1) / 2} ${x1} ${y1}`,
    stroke: paint,
    "stroke-width": width,
    fill: "none",
    "stroke-linecap": "round",
  });
}

/** Like `hsl`, but as `#rrggbb`, for colors that `mix` will lighten or darken. */
function hexHsl(h: number, sat: number, light: number): string {
  const sv = Math.max(0, Math.min(100, sat)) / 100;
  const lv = Math.max(0, Math.min(100, light)) / 100;
  const a = sv * Math.min(lv, 1 - lv);
  const channel = (k0: number) => {
    const k = (k0 + (((h % 360) + 360) % 360) / 30) % 12;
    const v = lv - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return "#" + channel(0) + channel(8) + channel(4);
}

type Look = "garden" | "sky" | "warm" | "dusk";
const SETTING: Record<Look, string> = {
  garden: "in a garden",
  sky: "against the sky",
  warm: "in soft light",
  dusk: "at dusk",
};

/** An out-of-focus background: a gradient and a few big soft circles of light and leaf. */
function backdrop(g: Rand, w: number, h: number, look: Look, tint?: number): string {
  const unit = Math.min(w, h);
  const id = g.id("bg");
  const hue =
    look === "garden" ? g.f(85, 135) : look === "sky" ? g.f(195, 215) : look === "warm" ? g.f(30, 50) : g.f(240, 280);
  const stops =
    look === "garden"
      ? [hsl(hue, 35, g.f(52, 62)), hsl(hue + 15, 40, g.f(28, 36))]
      : look === "sky"
        ? [hsl(hue, 60, g.f(60, 68)), hsl(hue - 10, 50, g.f(84, 90))]
        : look === "warm"
          ? [hsl(hue, 50, g.f(84, 90)), hsl(hue - 12, 40, g.f(66, 74))]
          : [hsl(hue, 30, g.f(38, 46)), hsl(hue + 70, 50, g.f(70, 78))];
  let out = el("defs", {}, lin(id, stops)) + fill(w, h, `url(#${id})`);
  for (let k = g.i(6, 9); k > 0; k--) {
    const leafy = look === "garden" && g.chance(0.5);
    out += el("circle", {
      cx: g.f(0, w),
      cy: g.f(0, h),
      r: unit * g.f(0.06, 0.22),
      fill: leafy ? hsl(hue + 10, 45, 24) : tint !== undefined && g.chance(0.5) ? hsl(tint, 70, 66) : "#ffffff",
      opacity: g.f(leafy ? 0.2 : 0.08, leafy ? 0.35 : 0.2).toFixed(2),
    });
  }
  return out;
}

/** Draws parts leaning away first, then `middle`, then those leaning toward the viewer, each nearest last. */
function layered(parts: (Part & { paint: string })[], middle: string, unit: number): string {
  const order = (list: (Part & { paint: string })[]) =>
    list
      .sort((a, b) => a.z - b.z)
      .map(part => el("path", { d: part.d, fill: part.paint }))
      .join("");
  return (
    order(parts.filter(part => part.lean <= unit * 0.04)) +
    middle +
    order(parts.filter(part => part.lean > unit * 0.04))
  );
}

const countWord = (count: number, one: string, many: string) =>
  count === 1 ? `A ${one}` : `${capitalize(numberWord(count))} ${many}`;

/** A sunflower head close up: two rings of rays around a seed head, on a leafy stem. */
export const sunflower = defineKind("sunflower", "Sunflower", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["sky", "sky", "garden", "warm"] as const);
  let out = backdrop(g, w, h, look);
  const hue = g.f(38, 50);
  const green = hexHsl(g.f(85, 110), g.f(40, 55), g.f(30, 40));
  const R = unit * g.f(0.36, 0.42);
  const faceOn = g.chance(0.6);
  const main: View = {
    x: w / 2 + unit * g.f(-0.08, 0.08),
    y: Math.max(h * 0.46, R + unit * 0.06),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.9, 1.15),
    roll: g.f(-0.3, 0.3),
  };
  // Smaller heads behind, when there is room beside the main one.
  const heads: { v: View; r: number }[] = [];
  const room = (w - R * 2) / 2;
  for (const side of g.chance(0.5) ? [-1, 1] : [1, -1]) {
    const r = R * g.f(0.5, 0.68);
    if (room < r * 1.6 || (heads.length && w < h * 2) || !g.chance(w > h * 1.6 ? 0.85 : 0.4)) continue;
    heads.push({
      v: {
        x: Math.max(r * 1.05, Math.min(w - r * 1.05, main.x + side * (R + r * g.f(0.55, 0.8)))),
        y: main.y + unit * g.f(-0.12, 0.05),
        tilt: g.f(0.95, 1.4),
        roll: side * g.f(0.1, 0.4),
      },
      r,
    });
  }
  heads.push({ v: main, r: R });
  // One head drawn in <defs>: two rings of rays, and the seed head's florets, seeds and spiral.
  const raysId = g.id("rays");
  const seedsId = g.id("seeds");
  const discR = g.f(38, 46);
  const count = g.i(18, 24);
  const len = 100 - discR * 0.8;
  out += el(
    "defs",
    {},
    el(
      "g",
      { id: raysId },
      el("path", { d: flatRays(g, count, discR * 0.8, len, len * 0.4, 0.15, 0), fill: hsl(hue - 8, 88, 46) }),
      el("path", {
        d: flatRays(g, count, discR * 0.8, len * 0.95, len * 0.38, 0.15, Math.PI / count),
        fill: hsl(hue, 92, 56),
      }),
    ),
    el(
      "g",
      { id: seedsId },
      el("circle", { r: discR, fill: "#6b4a1c" }),
      el("circle", { r: discR * 0.86, fill: "#3c2412" }),
      el("circle", { r: discR * 0.32, fill: "#5a4a1e" }),
      flatSpiral(discR * 0.84, 110, discR * 0.06, "#7a5426", 0.12),
    ),
  );
  for (const { v, r } of heads) {
    // Stem and leaves
    const foot = v.x + unit * g.f(-0.08, 0.08);
    out += stem(v.x, v.y, foot, h + unit * 0.05, unit * g.f(-0.06, 0.06), r * 0.13, green);
    if (r === R)
      for (const side of [-1, 1]) {
        if (!g.chance(0.75)) continue;
        const ly = Math.min(h * 0.94, v.y + R * g.f(0.75, 1.05));
        const lx = (v.x + foot) / 2;
        const angle = side > 0 ? g.f(-0.5, 0.2) : Math.PI - g.f(-0.5, 0.2);
        out += leafEl(
          leaf(lx, ly, angle, unit * g.f(0.3, 0.38), unit * g.f(0.13, 0.16), 0.06, side * 0.05),
          green,
          unit * 0.008,
        );
      }
    // The head, its rim, and the seed head raised a little above the rays.
    const spin = g.f(0, Math.PI * 2);
    out += el("use", { href: `#${raysId}`, transform: onFace(v, r, spin) });
    out += el("circle", { r: discR, fill: "#3a2212", transform: onFace(v, r, spin) });
    out += el("use", { href: `#${seedsId}`, transform: onFace(v, r, spin, r * 0.06) });
  }
  const other = heads.length - 1;
  note.alt(
    `${countWord(heads.length, "sunflower", "sunflowers")} ${faceOn ? "facing the viewer" : "turned partly aside"} ${SETTING[look]}`.replace(
      other ? "facing" : "\0",
      "the nearest facing",
    ),
  );
  note.focus(main.x, main.y);
  return out;
});

// Rose colors: hue, saturation, lightness of the outer petals, and a name for the alt text.
const ROSES: readonly (readonly [number, number, number])[] = [
  [352, 75, 46],
  [354, 72, 42],
  [345, 62, 34],
  [338, 58, 72],
  [348, 50, 82],
  [48, 82, 64],
  [42, 40, 93],
  [16, 75, 68],
];

/** A rose in bloom, seen from above or at three-quarters, with leaves and sometimes a bud. */
export const rose = defineKind("rose", "Rose", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "warm", "dusk"] as const);
  let out = backdrop(g, w, h, look);
  const [hue, sat, light] = g.pick(ROSES);
  const green = hexHsl(g.f(95, 130), g.f(35, 50), g.f(24, 34));
  const R = unit * g.f(0.3, 0.36);
  const above = g.chance(0.45);
  const v: View = {
    x: w / 2 + unit * g.f(-0.1, 0.1),
    y: above ? h / 2 + unit * g.f(-0.04, 0.04) : Math.max(h * 0.44, R * 0.95 + unit * 0.05),
    tilt: above ? g.f(1.25, 1.57) : g.f(0.55, 0.8),
    roll: g.f(-0.25, 0.25),
  };
  const budSide = g.chance(0.5) ? -1 : 1;
  const bud = g.chance(w > h * 1.5 ? 0.8 : 0.45);
  // A bud on its own stem, beside and behind the bloom.
  if (bud) {
    const br = R * g.f(0.32, 0.4);
    const bv: View = {
      x: Math.max(br * 2.2, Math.min(w - br * 2.2, v.x + budSide * (R + br * g.f(0.9, 1.3)))),
      y: v.y - R * g.f(0.1, 0.4),
      tilt: 0.25,
      roll: budSide * g.f(0.1, 0.35),
    };
    out += stem(bv.x, bv.y, v.x + budSide * R * 0.3, h + unit * 0.05, budSide * unit * 0.05, unit * 0.014, green);
    const parts: (Part & { paint: string })[] = [];
    for (let k = 0; k < 3; k++)
      parts.push({
        ...petal(bv, g.f(0, 1) + (k * Math.PI * 2) / 3, {
          len: br * 1.3,
          wid: br * 1.05,
          lift: 1.15,
          cup: 0.25,
          bend: 0.35,
          belly: 0.15,
          tip: 0.5,
        }),
        paint: hsl(hue, sat, light - 4 + k * 3),
      });
    // Sepals splaying out below the bud, then the bud's petals over them.
    let sepals = "";
    for (let k = 0; k < 5; k++)
      sepals += petal(bv, (k * Math.PI * 2) / 5 + 0.3, {
        len: br * 0.8,
        wid: br * 0.26,
        lift: 0.3,
        bend: -0.15,
        tip: 0,
      }).d;
    out += el("path", { d: sepals, fill: mix(green, "#ffffff", 0.1) });
    out += layered(parts, "", unit);
    out += disc(bv, -br * 0.05, br * 0.32, green);
  }
  // Leaves: from above they peek out around the bloom; from the side they grow from the stem.
  const leafLen = unit * g.f(0.17, 0.21);
  const leafWid = leafLen * 0.36;
  if (above) {
    const start = g.f(0, Math.PI * 2);
    for (let k = g.i(3, 4); k > 0; k--) {
      const angle = start + k * g.f(1.4, 1.9);
      const lx = v.x + Math.cos(angle) * R * 0.55;
      const ly = v.y + Math.sin(angle) * R * 0.55;
      out += leafEl(leaf(lx, ly, angle, leafLen * 1.15, leafWid, 0.3, g.f(-0.08, 0.08)), green, unit * 0.005);
    }
  } else {
    const [sx, sy] = at(v, 0, [0, -R * 0.1, 0]);
    out += stem(sx, sy, sx - budSide * unit * 0.05, h + unit * 0.05, unit * g.f(-0.05, 0.05), unit * 0.02, green);
    const ly = Math.min(h * 0.92, sy + R * 0.7);
    for (const side of [-1, 1]) {
      if (side === budSide && bud) continue;
      const angle = side > 0 ? g.f(-0.6, -0.1) : Math.PI + g.f(0.1, 0.6);
      out += leafEl(leaf(sx, ly, angle, leafLen, leafWid, 0.3, -0.05 * side), green, unit * 0.005);
      const [tx, ty] = [sx + Math.cos(angle) * leafLen * 1.1, ly + Math.sin(angle) * leafLen * 1.1];
      out += leafEl(leaf(tx, ty, angle - side * 0.2, leafLen * 0.8, leafWid * 0.9, 0.3), green, unit * 0.005);
    }
    // Sepals curling back under the bloom
    let sepals = "";
    for (let k = 0; k < 5; k++)
      sepals += petal(v, (k * Math.PI * 2) / 5 + 0.5, { len: R * 0.55, wid: R * 0.14, lift: -0.5, tip: 0 }).d;
    out += el("path", { d: sepals, fill: green });
  }
  // The bloom: rings of round petals, each ring smaller, more upright and deeper in shade.
  const rings = [
    { count: 5, len: 1, lift: 0.22, cup: 0.12, shade: 6 },
    { count: 5, len: 0.86, lift: 0.55, cup: 0.18, shade: 2 },
    { count: 5, len: 0.68, lift: 0.85, cup: 0.22, shade: -3 },
    { count: 4, len: 0.5, lift: 1.1, cup: 0.25, shade: -8 },
    { count: 3, len: 0.34, lift: 1.3, cup: 0.3, shade: -13 },
  ];
  const parts: (Part & { paint: string })[] = [];
  let turn = g.f(0, Math.PI * 2);
  rings.forEach((ring, index) => {
    turn += g.f(0.5, 0.8);
    for (let k = 0; k < ring.count; k++)
      parts.push({
        ...petal(v, turn + (k * Math.PI * 2) / ring.count + g.f(-0.1, 0.1), {
          from: R * 0.04 * (4 - index),
          len: R * ring.len * g.f(0.94, 1.04),
          wid: R * ring.len * 1.2,
          lift: ring.lift,
          cup: ring.cup,
          tip: 1,
        }),
        paint: hsl(hue, sat, light + ring.shade * (light > 80 ? 0.6 : 1) + (k % 2 ? 2 : -2)),
      });
  });
  // The tight heart: a curl of petal edge.
  const [hx, hy] = at(v, 0, [0, R * 0.3, 0]);
  const curl = R * 0.12;
  const heart =
    disc({ ...v, x: hx, y: hy }, 0, curl * 1.2, hsl(hue, sat, light - 18)) +
    el("path", {
      d: s`M${hx - curl} ${hy}A${curl} ${curl * 0.7} 0 1 1 ${hx + curl * 0.6} ${hy + curl * 0.4}A${curl * 0.5} ${curl * 0.35} 0 1 1 ${hx} ${hy - curl * 0.2}`,
      stroke: hsl(hue, sat, light + 8),
      "stroke-width": unit * 0.007,
      fill: "none",
      "stroke-linecap": "round",
    });
  out += layered(parts, heart, unit);
  note.alt(`A rose${bud ? " and a bud" : ""} ${above ? "seen from above" : "seen from the side"} ${SETTING[look]}`);
  note.focus(hx, hy);
  return out;
});

// Tulip colors: hue, saturation, lightness.
const TULIPS: readonly (readonly [number, number, number])[] = [
  [356, 80, 50],
  [350, 75, 46],
  [50, 90, 60],
  [335, 62, 70],
  [285, 40, 42],
  [22, 90, 57],
  [48, 30, 93],
  [320, 55, 50],
];

/** Tulips seen from the side: a cup of six tepals on a long stem, with long leaves. */
export const tulip = defineKind("tulip", "Tulip", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "sky", "warm", "garden"] as const);
  let out = backdrop(g, w, h, look);
  const mixed = g.chance(0.3);
  const base = g.pick(TULIPS);
  const green = hexHsl(g.f(100, 140), g.f(25, 40), g.f(38, 48));
  const count = Math.min(4, g.i(1, 2) + (g.chance(0.3) ? 1 : 0) + Math.floor(Math.max(0, w / h - 1.2) * 1.1));
  const H = unit * g.f(0.36, 0.42);
  // Spread the tulips across the picture, the middle ones nearest.
  const flowers: { v: View; size: number; color: readonly [number, number, number] }[] = [];
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const middle = 1 - Math.abs(t - 0.5) * 2;
    const size = H * (count === 1 ? 1 : 0.78 + 0.22 * middle) * g.f(0.92, 1.05);
    flowers.push({
      v: {
        x: w / 2 + (t - 0.5) * Math.min(w - unit * 0.4, size * 1.5 * (count - 1)) + unit * g.f(-0.03, 0.03),
        y: Math.max(size * 1.1 + unit * 0.05, h * g.f(0.42, 0.55) + (1 - middle) * unit * g.f(-0.08, 0.08)),
        tilt: g.f(0.15, 0.35),
        roll: (t - 0.5) * g.f(0, 0.35) + g.f(-0.1, 0.1),
      },
      size,
      color: mixed && k % 2 ? g.pick(TULIPS) : base,
    });
  }
  flowers.sort((a, b) => a.size - b.size);
  for (const { v, size, color } of flowers) {
    const [hue, sat, light] = color;
    // Stem, and two long leaves wrapping its foot.
    const foot = v.x - Math.sin(v.roll) * unit * 0.3;
    out += stem(v.x, v.y, foot, h + unit * 0.05, unit * g.f(-0.04, 0.04), unit * 0.022, green);
    for (const side of [-1, 1]) {
      const len = Math.max(unit * 0.38, (h - v.y) * g.f(0.7, 0.95));
      const angle = -Math.PI / 2 + side * g.f(0.15, 0.45);
      out += leafEl(
        leaf(
          foot + side * unit * 0.01,
          h + unit * 0.04,
          angle,
          len,
          unit * g.f(0.065, 0.085),
          0.3,
          side * g.f(0.04, 0.12),
        ),
        mix(green, "#ffffff", side > 0 ? 0.08 : 0),
        unit * 0.004,
      );
    }
    // Six tepals, three outer and three inner, the far ones showing their shaded insides.
    const parts: (Part & { paint: string })[] = [];
    const turn = Math.PI / 2 + g.f(-0.3, 0.3);
    for (let k = 0; k < 6; k++) {
      const outer = k % 2 === 0;
      const part = petal(v, turn + (k * Math.PI) / 3, {
        from: size * 0.08,
        len: size * (outer ? 1 : 0.96),
        wid: size * (outer ? 0.95 : 0.85),
        lift: outer ? 1.22 : 1.32,
        cup: 0.2,
        bend: 0.1,
        belly: 0.14,
        tip: 0.45,
      });
      parts.push({ ...part, paint: hsl(hue, sat, light + (part.lean > 0 ? 4 : -10) + (outer ? 0 : -3)) });
    }
    out += layered(parts, "", unit);
    // A soft shine down the front tepal
    const [ax, ay] = at(v, Math.PI / 2, [size * 0.3, size * 0.2, 0]);
    const [bx, by] = at(v, Math.PI / 2, [size * 0.34, size * 0.75, 0]);
    out += el("path", {
      d: s`M${ax} ${ay}Q${(ax + bx) / 2 - size * 0.05} ${(ay + by) / 2} ${bx} ${by}`,
      stroke: "#ffffff",
      "stroke-width": size * 0.05,
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.25",
    });
  }
  note.alt(
    `${countWord(count, "tulip", "tulips")} on long stems with ${count === 1 ? "two long leaves" : "long leaves"} ${SETTING[look]}`,
  );
  const lead = flowers[flowers.length - 1];
  note.focus(lead.v.x, lead.v.y - lead.size * 0.5);
  return out;
});

/** Oxeye daisies close up: many thin rays around a domed disc, sometimes a few together. */
export const daisy = defineKind("daisy", "Daisy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "dusk"] as const);
  let out = backdrop(g, w, h, look);
  const green = hexHsl(g.f(90, 125), g.f(35, 50), g.f(32, 42));
  const R = unit * g.f(0.32, 0.4);
  const faceOn = g.chance(0.55);
  const main: View = {
    x: w / 2 + unit * g.f(-0.12, 0.12),
    y: h / 2 + unit * g.f(-0.06, 0.04),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.75, 1.1),
    roll: g.f(-0.3, 0.3),
  };
  // Smaller daisies behind, set off to either side.
  const heads: { v: View; r: number }[] = [];
  const extra = g.i(0, 2) + (w > h * 1.6 ? 1 : 0) + (w > h * 3 ? 1 : 0);
  for (let k = 0; k < extra; k++) {
    const r = R * g.f(0.45, 0.65);
    const side = k % 2 ? -1 : 1;
    const x = main.x + side * (R + r * g.f(0.2, 0.9)) * (k > 1 ? 1.9 : 1);
    if (x < r * 0.9 || x > w - r * 0.9) continue;
    heads.push({
      v: {
        x,
        y: Math.min(h - r * 0.8, Math.max(r * 1.05, main.y + unit * g.f(-0.3, 0.25))),
        tilt: g.f(0.8, 1.5),
        roll: g.f(-0.5, 0.5),
      },
      r,
    });
  }
  heads.push({ v: main, r: R });
  // One head drawn in <defs>: two rings of rays, and the domed disc of tiny florets.
  const raysId = g.id("rays");
  const discId = g.id("disc");
  const discR = g.f(22, 27);
  const count = g.i(21, 30);
  const len = 100 - discR * 0.7;
  out += el(
    "defs",
    {},
    el(
      "g",
      { id: raysId },
      el("path", { d: flatRays(g, count, discR * 0.7, len, len * 0.22, 0.85, 0), fill: "#dfe0d8" }),
      el("path", {
        d: flatRays(g, count, discR * 0.7, len * 0.96, len * 0.21, 0.85, Math.PI / count),
        fill: "#fbfbf6",
      }),
    ),
    el(
      "g",
      { id: discId },
      el("circle", { r: discR * 0.95, fill: "#f2bd1d" }),
      flatSpiral(discR * 0.85, 46, discR * 0.12, "#e09f10"),
    ),
  );
  for (const { v, r } of heads) {
    const [sx, sy] = at(v, 0, [0, -r * 0.1, 0]);
    out += stem(sx, sy, sx + unit * g.f(-0.1, 0.1), h + unit * 0.05, unit * g.f(-0.05, 0.05), r * 0.06, green);
    if (r === R && g.chance(0.6)) {
      const side = g.chance(0.5) ? -1 : 1;
      const ly = Math.min(h * 0.95, sy + r * g.f(1.0, 1.4));
      out += leafEl(leaf(sx, ly, side > 0 ? -0.6 : Math.PI + 0.6, unit * 0.13, unit * 0.025, 0.4), green, unit * 0.003);
    }
    const spin = g.f(0, Math.PI * 2);
    out += el("use", { href: `#${raysId}`, transform: onFace(v, r, spin) });
    out += el("circle", { r: discR, fill: "#c98a0c", transform: onFace(v, r, spin) });
    out += el("use", { href: `#${discId}`, transform: onFace(v, r, spin, r * 0.07) });
  }
  const others = heads.length - 1;
  note.alt(
    others
      ? `A daisy close up with ${others === 1 ? "another" : `${numberWord(others)} more`} behind ${SETTING[look]}`
      : `A daisy ${faceOn ? "facing the viewer" : "turned partly aside"} ${SETTING[look]}`,
  );
  note.focus(main.x, main.y);
  return out;
});

// Poppy colors: hue, saturation, lightness. Field poppies first, then garden ones.
const POPPIES: readonly (readonly [number, number, number])[] = [
  [4, 88, 50],
  [2, 85, 47],
  [8, 90, 52],
  [22, 92, 56],
  [340, 60, 72],
  [40, 30, 94],
  [12, 75, 66],
];

/** A poppy close up: four crinkled papery petals around a seed pod ringed with stamens. */
export const poppy = defineKind("poppy", "Poppy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "warm"] as const);
  const [hue, sat, light] = g.pick(POPPIES.slice(0, g.chance(0.6) ? 3 : POPPIES.length));
  let out = backdrop(g, w, h, look, hue);
  const green = hexHsl(g.f(85, 110), g.f(25, 35), g.f(40, 48));
  const R = unit * g.f(0.32, 0.38);
  const faceOn = g.chance(0.5);
  const budSide = g.chance(0.5) ? -1 : 1;
  const v: View = {
    x: w / 2 - budSide * unit * g.f(0, 0.12),
    y: h / 2 + unit * g.f(-0.02, 0.06),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.8, 1.05),
    roll: g.f(-0.3, 0.3),
  };
  // A nodding bud on a hooked stem
  const bud = g.chance(0.55);
  if (bud) {
    const bx = Math.max(unit * 0.17, Math.min(w - unit * 0.17, v.x + budSide * (R + unit * g.f(0.12, 0.2))));
    const top = Math.max(unit * 0.08, v.y - R * g.f(0.6, 0.9));
    const br = unit * g.f(0.045, 0.06);
    out += el("path", {
      d: s`M${bx - budSide * unit * 0.05} ${h + unit * 0.05}Q${bx - budSide * unit * 0.06} ${(top + h) / 2} ${bx} ${top}Q${bx + budSide * br * 1.6} ${top - br * 0.4} ${bx + budSide * br * 1.4} ${top + br * 1.2}`,
      stroke: green,
      "stroke-width": unit * 0.012,
      fill: "none",
      "stroke-linecap": "round",
    });
    const cx = bx + budSide * br * 1.3;
    const cy = top + br * 2.3;
    out += el("ellipse", {
      cx,
      cy,
      rx: br,
      ry: br * 1.45,
      fill: green,
      transform: s`rotate(${-budSide * 15} ${cx} ${cy})`,
    });
    out += el("path", {
      d: s`M${cx} ${cy - br * 1.3}Q${cx + budSide * br * 0.3} ${cy} ${cx} ${cy + br * 1.4}`,
      stroke: "#000",
      "stroke-opacity": "0.15",
      "stroke-width": br * 0.12,
      fill: "none",
    });
  }
  // The flower's stem
  const [sx, sy] = at(v, 0, [0, -R * 0.05, 0]);
  out += stem(sx, sy, sx - budSide * unit * g.f(0, 0.1), h + unit * 0.05, unit * g.f(-0.06, 0.06), unit * 0.013, green);
  // Petals: the outer pair, then the inner pair across them, each with faint creases.
  const parts: (Part & { paint: string; crease?: string })[] = [];
  const blotch = g.chance(0.55) && light < 70;
  const turn = g.f(0, Math.PI);
  for (let k = 0; k < 4; k++) {
    const inner = k >= 2;
    const theta = turn + (k % 2) * Math.PI + (inner ? Math.PI / 2 : 0);
    const shape = {
      len: R * (inner ? 0.88 : 1) * g.f(0.95, 1.03),
      wid: 0,
      spread: inner ? 0.95 : 1.05,
      lift: inner ? 0.5 : 0.3,
      cup: 0.12,
      wobble: 0.07,
    };
    const part = fan(g, v, theta, shape);
    // Inner petals sit inside the outer ones: draw them later.
    part.z += inner ? R : 0;
    const local = petalFrame(shape);
    let crease = "";
    for (let c = 0; c < 4; c++) {
      const phi = g.f(-0.8, 0.8);
      const a = at(v, theta, local(shape.len * 0.3 * Math.cos(phi), shape.len * 0.3 * Math.sin(phi), 0));
      const b = at(
        v,
        theta,
        local(shape.len * 0.85 * Math.cos(phi), shape.len * 0.85 * Math.sin(phi), shape.len * 0.04),
      );
      crease += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    }
    parts.push({ ...part, paint: hsl(hue, sat, light + (inner ? -3 : 2) + g.f(-2, 2)), crease });
    if (blotch)
      parts.push({
        ...fan(g, v, theta, { ...shape, len: shape.len * 0.3, spread: 0.7, wobble: 0.05 }),
        z: part.z + 0.01,
        lean: part.lean,
        paint: "#22141a",
      });
  }
  // The middle: a ring of stamens around the seed pod and its ridged cap.
  const ring = 36;
  let filaments = "";
  let anthers = "";
  for (let k = 0; k < ring; k++) {
    const theta = (k / ring) * Math.PI * 2 + g.f(-0.05, 0.05);
    const a = at(v, theta, [R * 0.12, R * 0.04, 0]);
    const b = at(v, theta, [R * g.f(0.26, 0.34), R * 0.12, 0]);
    filaments += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    anthers += s`M${b[0]} ${b[1]}h.1`;
  }
  const [cx, cy] = at(v, 0, [0, R * 0.21, 0]);
  let rays = "";
  const rayCount = g.i(8, 11);
  for (let k = 0; k < rayCount; k++) {
    const [ax, ay] = at(v, (k / rayCount) * Math.PI * 2, [R * 0.1, R * 0.2, 0]);
    rays += s`M${cx} ${cy}L${ax} ${ay}`;
  }
  const middle =
    el("path", { d: filaments, stroke: "#2a1d24", "stroke-width": R * 0.012, fill: "none" }) +
    el("path", { d: anthers, stroke: "#1e1418", "stroke-width": R * 0.04, "stroke-linecap": "round" }) +
    disc(v, 0, R * 0.14, "#7f925a") +
    disc(v, R * 0.1, R * 0.13, "#93a66a") +
    disc(v, R * 0.2, R * 0.11, "#5f6b3e") +
    el("path", { d: rays, stroke: "#2c1f2e", "stroke-width": R * 0.022, "stroke-linecap": "round" });
  const draw = (list: typeof parts) =>
    list
      .sort((a, b) => a.z - b.z)
      .map(
        part =>
          el("path", { d: part.d, fill: part.paint }) +
          (part.crease
            ? el("path", {
                d: part.crease,
                stroke: "#000",
                "stroke-opacity": "0.13",
                "stroke-width": R * 0.012,
                fill: "none",
              })
            : ""),
      )
      .join("");
  out +=
    draw(parts.filter(part => part.lean <= unit * 0.04)) + middle + draw(parts.filter(part => part.lean > unit * 0.04));
  note.alt(
    `A poppy ${faceOn ? "open to the viewer" : "seen at an angle"}${bud ? " beside a nodding bud" : ""} ${SETTING[look]}`,
  );
  note.focus(v.x, v.y);
  return out;
});

// Hibiscus colors: petal hue, saturation, lightness, and whether a dark eye marks the middle.
const HIBISCUS: readonly (readonly [number, number, number])[] = [
  [355, 85, 48],
  [352, 80, 44],
  [335, 68, 68],
  [18, 90, 58],
  [48, 90, 62],
  [30, 30, 95],
  [8, 80, 64],
];

/** A hibiscus close up: five broad petals around a long column of stamens, among glossy leaves. */
export const hibiscus = defineKind("hibiscus", "Hibiscus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "warm"] as const);
  let out = backdrop(g, w, h, look);
  const [hue, sat, light] = g.pick(HIBISCUS);
  const green = hexHsl(g.f(110, 140), g.f(40, 55), g.f(22, 30));
  const R = unit * g.f(0.34, 0.4);
  const faceOn = g.chance(0.5);
  const v: View = {
    x: w / 2 + unit * g.f(-0.1, 0.1),
    y: h / 2 + unit * g.f(-0.03, 0.05),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.85, 1.1),
    roll: g.f(-0.4, 0.4),
  };
  // Glossy leaves behind the flower
  const start = g.f(0, Math.PI * 2);
  for (let k = g.i(2, 3); k > 0; k--) {
    const angle = start + k * g.f(1.6, 2.2);
    const lx = v.x + Math.cos(angle) * R * 0.5;
    const ly = v.y + Math.sin(angle) * R * 0.5;
    out += leafEl(leaf(lx, ly, angle, R * g.f(1.05, 1.25), R * 0.36, 0.3, g.f(-0.06, 0.06)), green, unit * 0.005);
  }
  // Five petals in a pinwheel, each overlapping the next.
  const parts: (Part & { paint: string })[] = [];
  const turn = g.f(0, Math.PI * 2);
  const eye = light > 55 || hue === 18 ? hsl(350, 75, 38) : hsl(hue, sat, light - 18);
  const eyeParts: Part[] = [];
  for (let k = 0; k < 5; k++) {
    const theta = turn + (k * Math.PI * 2) / 5;
    const shape = { len: R * g.f(0.95, 1.03), wid: 0, spread: 0.8, lift: 0.14, cup: 0.06, wobble: 0.06 };
    const part = fan(g, v, theta, shape);
    part.z += k * 0.001;
    parts.push({ ...part, paint: hsl(hue, sat, light + (k % 2 ? 2 : -1) + g.f(-2, 2)) });
    eyeParts.push(fan(g, v, theta, { ...shape, len: shape.len * g.f(0.3, 0.4), spread: 0.75, wobble: 0.03 }));
  }
  out += parts
    .sort((a, b) => a.z - b.z)
    .map(part =>
      el("path", { d: part.d, fill: part.paint, stroke: eye, "stroke-opacity": "0.25", "stroke-width": R * 0.008 }),
    )
    .join("");
  out += el("path", { d: eyeParts.map(part => part.d).join(""), fill: eye });
  // Veins fanning from the eye
  let veins = "";
  for (let k = 0; k < 20; k++) {
    const theta = turn + (k / 20) * Math.PI * 2;
    const a = at(v, theta, [R * 0.1, R * 0.02, 0]);
    const b = at(v, theta, [R * g.f(0.45, 0.65), R * 0.08, 0]);
    veins += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  out += el("path", { d: veins, stroke: eye, "stroke-width": R * 0.012, opacity: "0.5", fill: "none" });
  // The staminal column: a long tube rising from the middle, with anthers near the tip and five
  // stigma pads at its end.
  const lean = turn + g.f(0, Math.PI * 2);
  const reach = faceOn ? R * 0.85 : R * 0.55;
  const tipPoint = at(v, lean, [reach, R * 1.0, 0]);
  const midPoint = at(v, lean, [reach * 0.35, R * 0.5, 0]);
  const root = at(v, lean, [0, 0, 0]);
  const column = light > 55 ? mix(hexHsl(hue, sat, light), "#ffffff", 0.35) : hsl(hue, sat, light + 6);
  out += el("path", {
    d: s`M${root[0]} ${root[1]}Q${midPoint[0]} ${midPoint[1]} ${tipPoint[0]} ${tipPoint[1]}`,
    stroke: column,
    "stroke-width": R * 0.045,
    fill: "none",
    "stroke-linecap": "round",
  });
  let anthers = "";
  for (let k = 0; k < 16; k++) {
    const t = g.f(0.55, 0.92);
    const x = (1 - t) ** 2 * root[0] + 2 * t * (1 - t) * midPoint[0] + t * t * tipPoint[0];
    const y = (1 - t) ** 2 * root[1] + 2 * t * (1 - t) * midPoint[1] + t * t * tipPoint[1];
    anthers += s`M${x + g.f(-1, 1) * R * 0.05} ${y + g.f(-1, 1) * R * 0.05}h.1`;
  }
  out += el("path", { d: anthers, stroke: "#f2c43a", "stroke-width": R * 0.04, "stroke-linecap": "round" });
  let pads = "";
  for (let k = 0; k < 5; k++) {
    const angle = (k / 5) * Math.PI * 2 + lean;
    const px = tipPoint[0] + Math.cos(angle) * R * 0.05;
    const py = tipPoint[1] + Math.sin(angle) * R * 0.05;
    pads += s`M${tipPoint[0]} ${tipPoint[1]}L${px} ${py}M${px} ${py}h.1`;
  }
  out += el("path", { d: pads, stroke: "#9b1830", "stroke-width": R * 0.028, "stroke-linecap": "round" });
  note.alt(
    `A hibiscus ${faceOn ? "open to the viewer" : "seen at an angle"} with its long column of stamens ${SETTING[look]}`,
  );
  note.focus(v.x, v.y);
  return out;
});

/** A sacred lotus held above the water among round leaves, sometimes with a bud. */
export const lotus = defineKind("lotus", "Lotus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const water = g.id("water");
  const petalId = g.id("petal");
  const backId = g.id("back");
  const waterHue = g.f(160, 200);
  const white = g.chance(0.2);
  const hue = g.f(328, 345);
  const tipColor = white ? hsl(hue, 40, 92) : hsl(hue, g.f(60, 75), g.f(62, 70));
  const baseColor = white ? "#fdfcf6" : hsl(hue, 45, 93);
  let out = el(
    "defs",
    {},
    lin(water, [hsl(waterHue, 35, g.f(40, 48)), hsl(waterHue + 10, 40, g.f(24, 32))]),
    lin(petalId, [tipColor, baseColor]),
    lin(backId, white ? [hsl(hue, 25, 84), hsl(hue, 15, 80)] : [hsl(hue, 60, 56), hsl(hue, 40, 80)]),
  );
  out += fill(w, h, `url(#${water})`);
  // Glints and soft light on the water
  for (let k = g.i(5, 8); k > 0; k--)
    out += el("ellipse", {
      cx: g.f(0, w),
      cy: g.f(0, h),
      rx: unit * g.f(0.1, 0.3),
      ry: unit * g.f(0.015, 0.04),
      fill: "#ffffff",
      opacity: g.f(0.06, 0.14).toFixed(2),
    });
  const leafGreen = hexHsl(g.f(95, 125), g.f(35, 50), g.f(34, 42));
  const R = unit * g.f(0.4, 0.46);
  const v: View = {
    x: w / 2 + unit * g.f(-0.08, 0.08),
    y: Math.max(h * 0.56, R * 0.95 + unit * 0.04),
    tilt: g.f(0.3, 0.5),
    roll: g.f(-0.12, 0.12),
  };
  const surface = Math.min(h - unit * 0.06, v.y + R * g.f(0.45, 0.6));
  // A round leaf lying on the water, with a notch and veins.
  const pad = (cx: number, cy: number, r: number) => {
    const squash = 0.32;
    const notch = g.f(0, Math.PI * 2);
    const gap = 0.18;
    const a = [cx + Math.cos(notch + gap) * r, cy + Math.sin(notch + gap) * r * squash];
    const b = [cx + Math.cos(notch - gap) * r, cy + Math.sin(notch - gap) * r * squash];
    let veins = "";
    for (let k = 1; k < 9; k++) {
      const angle = notch + gap + (k / 9) * (Math.PI * 2 - gap * 2);
      veins += s`M${cx} ${cy}L${cx + Math.cos(angle) * r * 0.9} ${cy + Math.sin(angle) * r * squash * 0.9}`;
    }
    return (
      el("ellipse", { cx, cy: cy + r * 0.04, rx: r * 1.02, ry: r * squash, fill: "#000", opacity: "0.15" }) +
      el("path", { d: s`M${cx} ${cy}L${a[0]} ${a[1]}A${r} ${r * squash} 0 1 1 ${b[0]} ${b[1]}Z`, fill: leafGreen }) +
      el("path", { d: veins, stroke: mix(leafGreen, "#ffffff", 0.2), "stroke-width": r * 0.015, fill: "none" })
    );
  };
  // Leaves behind the flower
  const pads = g.i(1, 2) + (w > h * 1.6 ? 1 : 0);
  for (let k = 0; k < pads; k++) {
    const side = k % 2 ? -1 : 1;
    out += pad(
      v.x + side * unit * g.f(0.35, 0.6) * (k > 1 ? 1.8 : 1),
      surface - unit * g.f(0.05, 0.15),
      unit * g.f(0.2, 0.28),
    );
  }
  // A bud on its own stem
  const bud = g.chance(0.55);
  const budSide = g.chance(0.5) ? -1 : 1;
  if (bud) {
    const bx = Math.max(unit * 0.1, Math.min(w - unit * 0.1, v.x + budSide * (R + unit * g.f(0.12, 0.2))));
    const by = Math.max(unit * 0.16, v.y - R * g.f(0.3, 0.6));
    const bh = unit * g.f(0.12, 0.15);
    out += stem(
      bx,
      by,
      bx - budSide * unit * 0.02,
      surface + unit * 0.02,
      budSide * unit * 0.02,
      unit * 0.014,
      leafGreen,
    );
    out += el("path", {
      d: s`M${bx} ${by}C${bx - bh * 0.55} ${by - bh * 0.3} ${bx - bh * 0.25} ${by - bh * 0.85} ${bx} ${by - bh * 1.05}C${bx + bh * 0.25} ${by - bh * 0.85} ${bx + bh * 0.55} ${by - bh * 0.3} ${bx} ${by}Z`,
      fill: `url(#${petalId})`,
    });
    out += el("path", {
      d: s`M${bx} ${by}C${bx - bh * 0.15} ${by - bh * 0.4} ${bx - bh * 0.05} ${by - bh * 0.8} ${bx} ${by - bh * 1.05}`,
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": bh * 0.03,
      fill: "none",
    });
    out += el("ellipse", {
      cx: bx - budSide * unit * 0.02,
      cy: surface + unit * 0.02,
      rx: unit * 0.05,
      ry: unit * 0.012,
      fill: "#ffffff",
      opacity: "0.18",
    });
  }
  // The flower's stem and the ripple where it meets the water
  out += stem(v.x, v.y, v.x + unit * g.f(-0.02, 0.02), surface, 0, unit * 0.018, leafGreen);
  out += el("ellipse", {
    cx: v.x,
    cy: surface,
    rx: unit * 0.07,
    ry: unit * 0.016,
    fill: "none",
    stroke: "#ffffff",
    "stroke-width": unit * 0.005,
    opacity: "0.3",
  });
  // Three layers of pointed petals, the outer ones opening widest.
  const layers = [
    { count: 8, len: 1, lift: 0.5, shade: "out" },
    { count: 6, len: 0.9, lift: 0.95, shade: "mid" },
    { count: 5, len: 0.75, lift: 1.25, shade: "in" },
  ];
  const parts: (Part & { paint: string })[] = [];
  let turn = g.f(0, Math.PI);
  for (const layer of layers) {
    turn += Math.PI / layer.count;
    for (let k = 0; k < layer.count; k++) {
      const part = petal(v, turn + (k * Math.PI * 2) / layer.count + g.f(-0.08, 0.08), {
        from: R * 0.08,
        len: R * layer.len * g.f(0.93, 1.05),
        wid: R * layer.len * 0.72,
        lift: layer.lift + g.f(-0.08, 0.08),
        cup: 0.12,
        bend: 0.06,
        tip: 0.1,
      });
      parts.push({ ...part, paint: `url(#${part.lean > 0 ? petalId : backId})` });
    }
  }
  // The seed pod: a flat-topped cone ringed with stamens.
  const podR = R * 0.17;
  let stamens = "";
  for (let k = 0; k < 30; k++) {
    const theta = (k / 30) * Math.PI * 2;
    const a = at(v, theta, [podR * 0.9, R * 0.2, 0]);
    const b = at(v, theta, [podR * 1.5, R * 0.3, 0]);
    stamens += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  const middle =
    el("path", { d: stamens, stroke: "#f0c64a", "stroke-width": R * 0.02, "stroke-linecap": "round" }) +
    disc(v, R * 0.24, podR, "#d9c45a") +
    spiral(v, R * 0.245, podR * 0.75, 9, podR * 0.18, "#a99436");
  out += layered(parts, middle, unit);
  // A near leaf in front, low in the picture.
  if (g.chance(0.6)) {
    const side = budSide * -1;
    out += pad(
      v.x + side * unit * g.f(0.3, 0.45),
      Math.min(h - unit * 0.02, surface + unit * g.f(0.06, 0.12)),
      unit * g.f(0.18, 0.24),
    );
  }
  note.alt(`A lotus flower${bud ? " and a bud" : ""} above the water among round leaves`);
  note.focus(v.x, v.y - R * 0.3);
  return out;
});
