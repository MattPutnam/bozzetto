/** Drawing helpers shared by several kinds. */
import { el, s, type Point, type Rand } from "./core";

/** A smooth closed shape with `lobes` bulges, through points around a center. */
export function blob(
  g: Rand,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lobes: number,
  amp: number,
  jitter = 0.12,
): string {
  const count = Math.max(8, lobes * 4);
  const phase = g.f(0, Math.PI * 2);
  const ring: Point[] = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    const scale = (1 + amp * Math.sin(lobes * angle + phase)) * g.f(1 - jitter, 1 + jitter);
    ring.push([cx + Math.cos(angle) * rx * scale, cy + Math.sin(angle) * ry * scale]);
  }
  return smoothClosed(ring);
}

/** A closed curve through the midpoints of a ring of points, using the points as controls. */
export function smoothClosed(ring: readonly Point[]): string {
  const count = ring.length;
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(ring[count - 1], ring[0]);
  let d = s`M ${start[0]} ${start[1]}`;
  for (let k = 0; k < count; k++) {
    const control = ring[k];
    const end = mid(control, ring[(k + 1) % count]);
    d += s` Q ${control[0]} ${control[1]} ${end[0]} ${end[1]}`;
  }
  return d + " Z";
}

/** Short strokes scattered in an annulus (or disc when inner = 0), grouped into one path per color. */
export function sprinkles(
  g: Rand,
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  count: number,
  len: number,
  colors: readonly string[],
  width: number,
  squash = 1,
): string {
  const byColor = new Map<string, string>();
  for (let k = 0; k < count; k++) {
    // Where the sprinkle sits, and which way it points.
    const angle = g.f(0, Math.PI * 2);
    const dist = Math.sqrt(g.f(inner * inner, outer * outer));
    const tilt = g.f(0, Math.PI);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * squash;
    const dx = (Math.cos(tilt) * len) / 2;
    const dy = (Math.sin(tilt) * len) / 2;
    const color = g.pick(colors);
    byColor.set(color, (byColor.get(color) ?? "") + s`M${x - dx} ${y - dy}L${x + dx} ${y + dy}`);
  }
  return [...byColor]
    .map(([color, d]) => el("path", { d, stroke: color, "stroke-width": width, "stroke-linecap": "round" }))
    .join("");
}

/** A tabletop: wall above, table below, with a soft edge line. */
export function table(g: Rand, w: number, h: number, top: number, wall: string, wood: string): string {
  // Wall
  let out = el("rect", { width: w, height: h, fill: wall });
  // Tabletop
  out += el("rect", { y: top, width: w, height: h - top, fill: wood });
  // Edge line
  out += el("rect", { y: top, width: w, height: Math.max(1.5, h * 0.008), fill: "#000", opacity: "0.08" });
  return out;
}
