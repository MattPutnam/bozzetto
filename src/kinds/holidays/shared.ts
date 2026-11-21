/** Helpers shared by several holidays kinds. */
import { el, hsl, type Point, pts, type Rand, s } from "../../draw/core";

/** A soft round glow: `color` fading out from the center. */
export const glow = (id: string, color: string, strength = 0.7): string =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": String(strength) }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": "0" }),
  );

/** A gentle curve across the picture: a straight line plus a bump. `d` draws it as one quadratic. */
export function curve(w: number, y0: number, y2: number, bump: number) {
  const c = (y0 + y2) / 2 + 2 * bump;
  return {
    at: (x: number) => y0 + ((y2 - y0) * x) / w + (4 * bump * x * (w - x)) / (w * w),
    d: () => s`M0 ${y0} Q ${w / 2} ${c} ${w} ${y2}`,
  };
}

/** Path data without the spaces it doesn't need, around commands and before minus signs. */
export const tight = (d: string): string => d.replace(/\s*([A-Za-z])\s*/g, "$1").replace(/ -/g, "-");

/** Markup with every path's data made tight, to keep pictures small. */
export const compact = (svg: string): string => svg.replace(/ d="([^"]*)"/g, (_, d: string) => ` d="${tight(d)}"`);

/** Round dots as one path: each a zero-length round-capped stroke. */
export const dots = (points: readonly Point[], r: number, paint: string, opacity = "1"): string =>
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
export function oval(cx: number, cy: number, rx: number, ry: number, deg = 0): string {
  const dx = Math.cos((deg * Math.PI) / 180) * rx;
  const dy = Math.sin((deg * Math.PI) / 180) * rx;
  return s`M${cx - dx} ${cy - dy}a${rx} ${ry} ${deg} 1 0 ${dx * 2} ${dy * 2}a${rx} ${ry} ${deg} 1 0 ${-dx * 2} ${-dy * 2}`;
}

/** Paths of the same fill gathered into one element each: `add(color, d)`, then `out()`. */
export function byColor() {
  const groups = new Map<string, string>();
  return {
    add: (color: string, d: string) => void groups.set(color, (groups.get(color) ?? "") + d),
    groups,
    out: () => [...groups].map(([fill, d]) => el("path", { d, fill })).join(""),
  };
}

export type Paper = { base: string; accent: string; style: "plain" | "stripes" | "dots" | "diagonal"; ribbon: string };

/** Wrapping paper: a base color, a pattern and a contrasting ribbon. */
export function paper(g: Rand): Paper {
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
export function bowKnot(bx: number, by: number, br: number, ribbon: string): string {
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
export const bowDef = (id: string): string => bowKnot(0, 0, 10, "#000").replace(/ fill="#000"/, ` id="${id}"`);

/**
 * A wrapped box seen from the front and a little above: front face from (x, base - bh) to (x + bw, base),
 * its top and right side going back by `d`. Returns the pattern it needs, its shadow's path data and the box.
 */
export function giftBox(
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

/**
 * Path data written with relative moves, which keep numbers short. `M`, `L` and `Q` take absolute
 * points; each is written relative to the last point (or, for a move, absolute when that's shorter),
 * measured from the rounded values so the error never builds up. Numbers are rounded to tenths, or to
 * whole pixels when `whole`.
 */
export function pen(whole = false) {
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
export const penDots = (points: readonly Point[], r: number, paint: string, opacity = "1", whole = true): string => {
  const p = pen(whole);
  for (const [x, y] of points) p.dot(x, y);
  return points.length
    ? el("path", { d: p.d, stroke: paint, "stroke-width": r * 2, "stroke-linecap": "round", opacity })
    : "";
};

/** Spreads circles over the frame: each new one at the best of several tries, clear of the others. */
export function spread(
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

/** Where a picture places one thing: translate, turn and scale, rounded to keep the markup short. */
export const place = (x: number, y: number, deg: number, scale: number): string =>
  `translate(${Math.round(x)} ${Math.round(y)})rotate(${Math.round(deg)})scale(${Math.round(scale * 100) / 100})`;
