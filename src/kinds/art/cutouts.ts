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
    // Whole pixels keep the path data short.
    ring.push([Math.round(cx + Math.cos(angle) * radius), Math.round(cy + Math.sin(angle) * radius)]);
  }
  // A quadratic curve through each ring point, joining the midpoints between neighbors.
  const mid = (a: Point, b: Point): Point => [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)];
  const start = mid(ring[count - 1], ring[0]);
  let d = s`M ${start[0]} ${start[1]}`;
  for (let k = 0; k < count; k++) {
    const point = ring[k];
    const next = mid(point, ring[(k + 1) % count]);
    d += s` Q ${point[0]} ${point[1]} ${next[0]} ${next[1]}`;
  }
  return d + " Z";
}

/** How far apart two #rrggbb colors are, 0 (same) to about 440. */
function distance(a: string, b: string): number {
  const parse = (x: string) => [1, 3, 5].map(k => parseInt(x.slice(k, k + 2), 16));
  const p = parse(a);
  const q = parse(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/**
 * Flat, lobed shapes in bold colors, like cut paper.
 *
 * @category Art
 */
export const cutouts = /* @__PURE__ */ defineKind("cutouts", "Paper cutouts", (g, w, h, note) => {
  const palette = g.pick([
    ["#1d4e89", "#e8563f", "#f2c14e", "#2a9d8f", "#111111"],
    ["#264653", "#e76f51", "#f4a261", "#8ab17d", "#ffffff"],
    ["#3b1f5c", "#ff7b54", "#ffd56b", "#4ecdc4", "#f7f4ea"],
  ]);
  const ground = g.pick(["#f6efe2", "#e9eef2", "#f3e1d8", "#1d4e89", "#f0e6c8"]);
  let out = fill(w, h, ground);
  // Only colors that stand out from the ground.
  const colors = palette.filter(c => distance(c, ground) > 90);
  // The shapes sit one to a cell of a loose grid, its cells near square whatever the frame's shape,
  // so they spread over the whole picture and only touch or overlap a little at their edges.
  const aspect = Math.max(w, h) / Math.min(w, h);
  const wanted = Math.min(12, Math.max(3, Math.round((g.i(3, 6) * aspect) / 1.33)));
  let cols = Math.max(1, Math.round(Math.sqrt((wanted * w) / h)));
  let rows = Math.max(1, Math.round(wanted / cols));
  while (cols * rows > 12) {
    if (cols >= rows) cols--;
    else rows--;
  }
  const cw = w / cols;
  const ch = h / rows;
  const cells: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  // Now and then a cell is left empty, for a little breathing room.
  if (cells.length >= 6 && g.chance(0.5)) cells.splice(g.i(0, cells.length - 1), 1);
  // Shapes are drawn in a shuffled order, so overlaps fall either way.
  for (let k = cells.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [cells[k], cells[j]] = [cells[j], cells[k]];
  }
  const placed: { c: number; r: number; color: string }[] = [];
  let biggest = 0;
  for (const [c, r] of cells) {
    const outer = (Math.min(cw, ch) / 2) * g.f(0.78, 1);
    const amp = g.f(0.18, 0.4);
    const slackX = Math.max(cw * 0.08, (cw / 2 - outer) * 0.9);
    const slackY = Math.max(ch * 0.08, (ch / 2 - outer) * 0.9);
    const x = (c + 0.5) * cw + g.f(-slackX, slackX);
    const y = (r + 0.5) * ch + g.f(-slackY, slackY);
    // Neighbors get different colors, so touching shapes never merge.
    const near = placed.filter(p => Math.abs(p.c - c) <= 1 && Math.abs(p.r - r) <= 1).map(p => p.color);
    const choices = colors.filter(color => !near.includes(color));
    const color = g.pick(choices.length > 0 ? choices : colors);
    placed.push({ c, r, color });
    out += el("path", { d: blob(g, x, y, outer / (1 + amp), g.i(3, 7), amp), fill: color });
    // Focus on the largest shape.
    if (outer > biggest) {
      biggest = outer;
      note.focus(x, y);
    }
  }
  note.alt(
    `${capitalize(numberWord(cells.length))} lobed paper cutout shapes scattered on a plain ground, after Matisse`,
  );
  return out;
});
