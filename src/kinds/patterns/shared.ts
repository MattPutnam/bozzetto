/** Helpers shared by several patterns kinds. */
import { el, type Point, type Rand } from "../../draw/core";

/** A repeating tile of the given size, offset so the seams fall somewhere different each seed. */
export const tile = (g: Rand, id: string, size: number, ...children: string[]): string =>
  el(
    "pattern",
    { id, width: size, height: size, x: g.f(0, size), y: g.f(0, size), patternUnits: "userSpaceOnUse" },
    ...children,
  );

/** Numbers for path data, rounded to whole pixels and run together where a minus sign allows. */
export const nums = (values: readonly number[]): string =>
  values.map((v, k) => (k > 0 && v >= 0 ? " " : "") + Math.round(v)).join("");

/**
 * A smooth curve through the midpoints of a run of points, using the points as controls, in
 * compact relative path data. An open curve runs from the first point to the last.
 */
export function curve(raw: readonly Point[], closed = false): string {
  const points = raw.map(([x, y]): Point => [Math.round(x), Math.round(y)]);
  const count = points.length;
  const mid = (p: Point, q: Point): Point => [Math.round((p[0] + q[0]) / 2), Math.round((p[1] + q[1]) / 2)];
  let at = closed ? mid(points[count - 1], points[0]) : points[0];
  let d = "M" + nums(at);
  const last = closed ? count : count - 1;
  for (let k = closed ? 0 : 1; k < last; k++) {
    const control = points[k];
    const end = closed || k < count - 2 ? mid(control, points[(k + 1) % count]) : points[count - 1];
    d += "q" + nums([control[0] - at[0], control[1] - at[1], end[0] - at[0], end[1] - at[1]]);
    at = end;
  }
  if (!closed && count === 2) d += "L" + nums(points[1]);
  return closed ? d + "z" : d;
}
