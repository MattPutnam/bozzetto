import { defineKind, el, fill, type Point, type Rand, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/** A smooth closed shape with `lobes` bulges, through points around a center. */
function blob(g: Rand, cx: number, cy: number, r: number, lobes: number, amp: number): string {
  const count = lobes * 4;
  const phase = g.f(0, Math.PI * 2);
  const ring: Point[] = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2;
    const radius = r * (1 + amp * Math.sin(lobes * angle + phase)) * g.f(0.88, 1.12);
    ring.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  // A quadratic curve through each ring point, joining the midpoints between neighbors.
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(ring[count - 1], ring[0]);
  let d = s`M ${start[0]} ${start[1]}`;
  for (let k = 0; k < count; k++) {
    const point = ring[k];
    const next = mid(point, ring[(k + 1) % count]);
    d += s` Q ${point[0]} ${point[1]} ${next[0]} ${next[1]}`;
  }
  return d + " Z";
}

/** Flat, lobed shapes in bold colors, like cut paper. */
export const cutouts = /* @__PURE__ */ defineKind("cutouts", "Paper cutouts", (g, w, h, note) => {
  const palette = g.pick([
    ["#1d4e89", "#e8563f", "#f2c14e", "#2a9d8f", "#111111"],
    ["#264653", "#e76f51", "#f4a261", "#8ab17d", "#ffffff"],
    ["#3b1f5c", "#ff7b54", "#ffd56b", "#4ecdc4", "#f7f4ea"],
  ]);
  let out = fill(w, h, g.pick(["#f6efe2", "#e9eef2", "#f3e1d8", "#1d4e89", "#f0e6c8"]));
  const unit = Math.min(w, h);
  // The cut shapes.
  const shapes = g.i(3, 6);
  let biggest = 0;
  for (let k = shapes; k > 0; k--) {
    const x = w * g.f(0.1, 0.9);
    const y = h * g.f(0.15, 0.85);
    const r = unit * g.f(0.1, 0.24);
    out += el("path", {
      d: blob(g, x, y, r, g.i(3, 7), g.f(0.18, 0.45)),
      fill: g.pick(palette),
    });
    // Focus on the largest shape.
    if (r > biggest) {
      biggest = r;
      note.focus(x, y);
    }
  }
  note.alt(`${capitalize(numberWord(shapes))} lobed paper cutout shapes scattered on a plain ground, after Matisse`);
  return out;
});
