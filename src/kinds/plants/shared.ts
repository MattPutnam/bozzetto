/** Helpers shared by several plants kinds. */
import { el, fill, hsl, lin, mix, type Point, type Rand, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { capitalize, numberWord } from "../../draw/words";

// A bloom is laid out in its own space and projected onto the picture. In that space `a` runs
// out from the flower's axis, `b` up the axis (toward the viewer for a face-on flower) and `c`
// sideways; each petal sits at an angle `theta` around the axis.
export type V3 = readonly [number, number, number];

/** Where a bloom sits and how it is turned: tilt 0 is side on, PI/2 faces the viewer; roll spins it. */
export interface View {
  x: number;
  y: number;
  tilt: number;
  roll: number;
}

/** A point of a bloom, projected onto the picture. */
export function at(v: View, theta: number, p: V3): Point {
  const x = p[0] * Math.cos(theta) - p[2] * Math.sin(theta);
  const z = p[0] * Math.sin(theta) + p[2] * Math.cos(theta);
  const y = -p[1] * Math.cos(v.tilt) + z * Math.sin(v.tilt);
  return [v.x + x * Math.cos(v.roll) - y * Math.sin(v.roll), v.y + x * Math.sin(v.roll) + y * Math.cos(v.roll)];
}

/** How near the viewer a point of a bloom is, and how much of that comes from leaning toward them. */
export function nearness(v: View, theta: number, p: V3): { z: number; lean: number } {
  const z = p[0] * Math.sin(theta) + p[2] * Math.cos(theta);
  return { z: p[1] * Math.sin(v.tilt) + z * Math.cos(v.tilt), lean: z * Math.cos(v.tilt) };
}

/** A drawn petal: its path, and where it falls in drawing order. */
export interface Part {
  d: string;
  z: number;
  lean: number;
}

export interface PetalShape {
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
export function petalFrame(p: PetalShape): (u: number, across: number, up: number) => V3 {
  const from = p.from ?? 0;
  const ca = Math.cos(p.lift);
  const sa = Math.sin(p.lift);
  return (u, across, up) => [from + u * ca - up * sa, u * sa + up * ca, across];
}

/** A petal with smooth sides, pointed or round at the tip. */
export function petal(v: View, theta: number, p: PetalShape): Part {
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
export function flatRays(
  g: Rand,
  count: number,
  from: number,
  len: number,
  wid: number,
  tip: number,
  offset: number,
): string {
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
export function flatSpiral(r: number, count: number, size: number, paint: string, from = 0): string {
  let d = "";
  for (let k = Math.round(count * from); k < count; k++) {
    const dist = r * Math.sqrt((k + 0.5) / count);
    d += s`M${dist * Math.cos(k * 2.39996)} ${dist * Math.sin(k * 2.39996)}h.1`;
  }
  return el("path", { d, stroke: paint, "stroke-width": size, "stroke-linecap": "round" });
}

/** The transform that lays a drawing made at radius 100 onto a bloom of radius `r`, spun by `spin` and raised `b`. */
export function onFace(v: View, r: number, spin: number, b = 0): string {
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
export function fan(g: Rand, v: View, theta: number, p: PetalShape & { spread: number; wobble: number }): Part {
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
export function disc(v: View, b: number, r: number, paint: string): string {
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

/** A pointed leaf from (x, y) toward `angle`; `base` near 0 makes it broad at the stalk, `bend` curves it. */
export function leaf(x: number, y: number, angle: number, len: number, wid: number, base = 0.25, bend = 0) {
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
export function leafEl(shape: { d: string; rib: string }, paint: string, rib: number): string {
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
export function stem(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bow: number,
  width: number,
  paint: string,
): string {
  return el("path", {
    d: s`M${x0} ${y0}Q${(x0 + x1) / 2 + bow} ${(y0 + y1) / 2} ${x1} ${y1}`,
    stroke: paint,
    "stroke-width": width,
    fill: "none",
    "stroke-linecap": "round",
  });
}

/** Like `hsl`, but as `#rrggbb`, for colors that `mix` will lighten or darken. */
export function hexHsl(h: number, sat: number, light: number): string {
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

export type Look = "garden" | "sky" | "warm" | "dusk";

export const SETTING: Record<Look, string> = {
  garden: "in a garden",
  sky: "against the sky",
  warm: "in soft light",
  dusk: "at dusk",
};

/** An out-of-focus background: a gradient and a few big soft circles of light and leaf. */
export function backdrop(g: Rand, w: number, h: number, look: Look, tint?: number): string {
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
export function layered(parts: (Part & { paint: string })[], middle: string, unit: number): string {
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

export const countWord = (count: number, one: string, many: string) =>
  count === 1 ? `A ${one}` : `${capitalize(numberWord(count))} ${many}`;
