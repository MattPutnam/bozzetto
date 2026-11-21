/** Helpers shared by several space kinds. */
import { el, hsl, type Rand, s } from "../../draw/core";
import { blob } from "../../draw/shapes";

/** Stars as round dots on two paths, small and faint or larger and bright. */
export function starDots(g: Rand, w: number, h: number, count: number, unit: number): string {
  const d = ["", ""];
  for (let k = 0; k < count; k++) d[g.chance(0.75) ? 0 : 1] += s`M${w * g.f(0, 1)} ${h * g.f(0, 1)}h0`;
  return d
    .map((dots, k) =>
      el("path", {
        d: dots,
        stroke: "#fff",
        "stroke-width": unit * (0.005 + 0.004 * k),
        "stroke-linecap": "round",
        opacity: 0.6 + 0.3 * k,
      }),
    )
    .join("");
}

/** A star count that grows with the picture's area but stays cheap. */
export const starCount = (g: Rand, w: number, h: number) =>
  Math.round(g.i(26, 40) * Math.min(1.8, Math.sqrt((w * h) / 120000)));

/**
 * A radial shadow that darkens a sphere away from its light. One gradient serves every sphere,
 * since it works in each shape's own bounding box. `lx` is -1 for light from the left, 1 from the right.
 */
export const shadeDef = (id: string, lx: number, strength: number) =>
  el(
    "radialGradient",
    { id, cx: 0.5 + lx * 0.22, cy: 0.32, r: 0.78 },
    el("stop", { offset: 0.35, "stop-color": "#000", "stop-opacity": 0 }),
    el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": strength }),
  );

export const clipCircle = (id: string, cx: number, cy: number, r: number) =>
  el("clipPath", { id }, el("circle", { cx, cy, r }));

/** A gas giant's stripes: each band covers everything below its wavy top edge. */
export function bands(g: Rand, cx: number, cy: number, r: number, hue: number, clip: string): string {
  const count = g.i(4, 7);
  const tones = [g.f(70, 82), g.f(52, 64), g.f(62, 74), g.f(44, 56)];
  let out = el("circle", { cx, cy, r, fill: hsl(hue, g.f(35, 55), tones[0]) });
  for (let k = 1; k <= count; k++) {
    const top = cy - r + (2 * r * (k + g.f(-0.3, 0.3))) / (count + 1);
    const amp = r * g.f(0.01, 0.05);
    let d = s`M${cx - r} ${top}`;
    for (let q = 0; q < 4; q++) {
      const x0 = cx - r + (q * r) / 2;
      d += s`Q${x0 + r / 4} ${top + (q % 2 ? amp : -amp)} ${x0 + r / 2} ${top}`;
    }
    d += s`V${cy + r}H${cx - r}Z`;
    out += el("path", {
      d,
      fill: hsl(hue + g.f(-18, 18), g.f(30, 55), tones[k % 4] + g.f(-4, 4)),
      "clip-path": `url(#${clip})`,
    });
  }
  // Sometimes a great storm, an oval on one band.
  if (g.chance(0.5)) {
    const sy = cy + r * g.f(-0.1, 0.45);
    const sx = cx + r * g.f(-0.45, 0.35);
    out += el("ellipse", { cx: sx, cy: sy, rx: r * 0.16, ry: r * 0.08, fill: hsl(hue + 20, 55, 40), opacity: 0.85 });
    out += el("ellipse", { cx: sx, cy: sy, rx: r * 0.09, ry: r * 0.04, fill: hsl(hue + 25, 60, 65) });
  }
  return out;
}

/** A rocky body with craters, each a dark bowl with a lit rim on the side toward the light. */
export function craters(
  g: Rand,
  cx: number,
  cy: number,
  r: number,
  paint: string,
  lx: number,
  clip: string,
  count: number,
): string {
  let out = el("circle", { cx, cy, r, fill: paint });
  let dark = "";
  let lit = "";
  for (let k = 0; k < count; k++) {
    const a = g.f(0, Math.PI * 2);
    const dist = r * Math.sqrt(g.f(0, 0.8));
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    const cr = r * g.f(0.06, 0.18);
    const off = cr * 0.18;
    lit += s`M${x - cr - off * lx} ${y + off}a${cr} ${cr} 0 1 0 ${cr * 2} 0a${cr} ${cr} 0 1 0 ${-cr * 2} 0`;
    dark += s`M${x - cr} ${y}a${cr} ${cr} 0 1 0 ${cr * 2} 0a${cr} ${cr} 0 1 0 ${-cr * 2} 0`;
  }
  out += el("path", { d: lit, fill: "#fff", opacity: 0.18, "clip-path": `url(#${clip})` });
  out += el("path", { d: dark, fill: "#000", opacity: 0.16, "clip-path": `url(#${clip})` });
  return out;
}

/** The Earth seen from space: ocean, a few continents, wisps of cloud, and a thin glowing air. */
export function earth(g: Rand, cx: number, cy: number, r: number, clip: string, shade: string, unit: number): string {
  const ocean = hsl(g.f(200, 215), g.f(55, 70), g.f(42, 50));
  let out = el("circle", { cx, cy, r: r * 1.04, fill: hsl(200, 80, 75), opacity: 0.25 });
  out += el("circle", { cx, cy, r, fill: ocean });
  let land = "";
  for (let k = g.i(3, 4); k > 0; k--) {
    const a = g.f(0, Math.PI * 2);
    const dist = r * g.f(0.1, 0.75);
    const lr = r * g.f(0.18, 0.34);
    land += blob(g, cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, lr, lr * g.f(0.6, 1), 2, 0.25, 0.25);
  }
  out += el("path", { d: land, fill: hsl(g.f(90, 125), g.f(30, 45), g.f(40, 48)), "clip-path": `url(#${clip})` });
  let cloud = "";
  for (let k = g.i(3, 5); k > 0; k--) {
    const y = cy + r * g.f(-0.85, 0.85);
    const x = cx + r * g.f(-0.8, 0.3);
    const len = r * g.f(0.4, 0.9);
    cloud += s`M${x} ${y}q${len / 2} ${-r * g.f(0.04, 0.12)} ${len} 0`;
  }
  out += el("path", {
    d: cloud,
    stroke: "#fff",
    "stroke-width": Math.max(1, r * 0.06),
    "stroke-linecap": "round",
    fill: "none",
    opacity: 0.7,
    "clip-path": `url(#${clip})`,
  });
  out += el("circle", { cx, cy, r, fill: `url(#${shade})` });
  out += el("circle", {
    cx,
    cy,
    r,
    fill: "none",
    stroke: hsl(195, 90, 82),
    "stroke-width": Math.max(1, unit * 0.006),
    opacity: 0.6,
  });
  return out;
}

/** Is (x, y) outside the ellipse around (cx, cy) with half-axes rx, ry? */
export const outside = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1;

/** A radial gradient in the shape's own box, from `stops` as [offset, color, opacity]. */
export const radial = (
  id: string,
  stops: readonly [number, string, number][],
  attrs: Record<string, number | string> = {},
) =>
  el(
    "radialGradient",
    { id, ...attrs },
    ...stops.map(([offset, color, alpha]) =>
      el("stop", { offset, "stop-color": color, "stop-opacity": alpha === 1 ? undefined : alpha }),
    ),
  );

/** The half-extents of an ellipse with half-axes rx, ry turned by `deg` degrees. */
export function extents(rx: number, ry: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.hypot(rx * Math.cos(a), ry * Math.sin(a)), Math.hypot(rx * Math.sin(a), ry * Math.cos(a))];
}
