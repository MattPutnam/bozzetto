import { s, type Draw, type Kind, type Point, type Rand } from "../src/core";

/** Sketch families go beyond the package's Family type until they are approved. */
export type SketchFamily = "animal" | "food" | "object";

export function sketch(id: string, name: string, family: SketchFamily, draw: Draw): Kind {
  return { id, name, family, draw } as unknown as Kind;
}

/** A smooth closed shape with `lobes` bulges, through points around a center. */
export function blob(g: Rand, cx: number, cy: number, rx: number, ry: number, lobes: number, amp: number, jitter = 0.12): string {
  const count = Math.max(8, lobes * 4), phase = g.f(0, Math.PI * 2), ring: Point[] = [];
  for (let k = 0; k < count; k++) {
    const th = (k / count) * Math.PI * 2, rr = (1 + amp * Math.sin(lobes * th + phase)) * g.f(1 - jitter, 1 + jitter);
    ring.push([cx + Math.cos(th) * rx * rr, cy + Math.sin(th) * ry * rr]);
  }
  return smoothClosed(ring);
}

/** A closed curve through the midpoints of a ring of points, using the points as controls. */
export function smoothClosed(ring: readonly Point[]): string {
  const count = ring.length, mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(ring[count - 1], ring[0]);
  let d = s`M ${start[0]} ${start[1]}`;
  for (let k = 0; k < count; k++) {
    const p = ring[k], m = mid(p, ring[(k + 1) % count]);
    d += s` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  }
  return d + " Z";
}

/** Short strokes scattered in an annulus (or disc when inner = 0), grouped into one path per color. */
export function sprinkles(g: Rand, cx: number, cy: number, inner: number, outer: number, count: number, len: number, colors: readonly string[], width: number, squash = 1): string {
  const byColor = new Map<string, string>();
  for (let k = 0; k < count; k++) {
    const a = g.f(0, Math.PI * 2), r = Math.sqrt(g.f(inner * inner, outer * outer)), t = g.f(0, Math.PI);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * squash, dx = (Math.cos(t) * len) / 2, dy = (Math.sin(t) * len) / 2;
    const c = g.pick(colors);
    byColor.set(c, (byColor.get(c) ?? "") + s`M${x - dx} ${y - dy}L${x + dx} ${y + dy}`);
  }
  return [...byColor].map(([c, d]) => s`<path d="${d}" stroke="${c}" stroke-width="${width}" stroke-linecap="round"/>`).join("");
}

/** A tabletop: wall above, table below, with a soft edge line. */
export function table(g: Rand, w: number, h: number, top: number, wall: string, wood: string): string {
  return s`<rect width="${w}" height="${h}" fill="${wall}"/><rect y="${top}" width="${w}" height="${h - top}" fill="${wood}"/><rect y="${top}" width="${w}" height="${Math.max(1.5, h * 0.008)}" fill="#000" opacity="0.08"/>`;
}
