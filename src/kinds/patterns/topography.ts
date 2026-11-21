import { defineKind, el, fill, type Point } from "../../draw/core";
import { curve } from "./shared";

/** Contour lines around a few hills and hollows, like a topographic map. */
export const topography = /* @__PURE__ */ defineKind("topography", "Topographic map", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#f2ede1", line: "#b59f7f" },
    { ground: "#eef2ea", line: "#8fa58c" },
    { ground: "#eaf0f3", line: "#86a0ae" },
    { ground: "#f4eeea", line: "#bf9a8c" },
    { ground: "#efedf3", line: "#9a94b0" },
    { ground: "#29313a", line: "#6e7e8c" },
  ]);
  let out = fill(w, h, scheme.ground);
  // The height field: a few round hills and hollows, spread along the frame, plus a gentle tilt.
  const hills: { x: number; y: number; r: number; z: number }[] = [];
  const count = Math.round(((w * h) / (unit * unit)) * 1.4) + g.i(1, 2);
  for (let k = 0; k < count; k++) {
    hills.push({
      x: ((k + g.f(0.15, 0.85)) / count) * w,
      y: g.f(0.1, 0.9) * h,
      r: unit * g.f(0.25, 0.5),
      z: g.chance(0.8) ? g.f(0.7, 1.2) : -g.f(0.4, 0.8),
    });
  }
  const tx = g.f(-0.3, 0.3) / unit;
  const ty = g.f(-0.3, 0.3) / unit;
  const height = (x: number, y: number) =>
    hills.reduce((sum, p) => sum + p.z * Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (p.r * p.r)), 0) +
    tx * x +
    ty * y;
  // Sample on a grid reaching a little past the edges; coarser on wide frames to keep the size down.
  const cell = Math.max(unit / 12, Math.sqrt(w * h) / 16);
  const cols = Math.ceil(w / cell) + 2;
  const rows = Math.ceil(h / cell) + 2;
  const at = (c: number, r: number): Point => [(c - 1) * cell, (r - 1) * cell];
  const grid: number[][] = [];
  for (let r = 0; r <= rows; r++) {
    grid.push([]);
    for (let c = 0; c <= cols; c++) grid[r].push(height(...at(c, r)));
  }
  const low = Math.min(...grid.flat());
  const high = Math.max(...grid.flat());
  // About the same number of contours whatever the terrain; fewer on wide frames, where each is long.
  const step = (high - low) / (g.i(11, 15) - (w * h > unit * unit * 2.5 ? 3 : 0));
  // Marching squares: each cell crossing a level gives a segment between edge points, keyed by edge
  // so segments can be chained into lines.
  const lines: { d: string; index: boolean }[] = [];
  const first = Math.ceil(low / step);
  for (let level = first; level * step < high; level++) {
    const v0 = level * step + 1e-6;
    const edgePoint = (key: string): Point => {
      const [kind, cs, rs] = key.split(",");
      const c = Number(cs);
      const r = Number(rs);
      const [c2, r2] = kind === "h" ? [c + 1, r] : [c, r + 1];
      const a = grid[r][c];
      const b = grid[r2][c2];
      const t = (v0 - a) / (b - a);
      const p = at(c, r);
      const q = at(c2, r2);
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    };
    const links = new Map<string, string[]>();
    const link = (a: string, b: string) => {
      links.set(a, [...(links.get(a) ?? []), b]);
      links.set(b, [...(links.get(b) ?? []), a]);
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const above = [grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]].map(v => v > v0);
        // Edges in order: top, right, bottom, left.
        const edges = [`h,${c},${r}`, `v,${c + 1},${r}`, `h,${c},${r + 1}`, `v,${c},${r}`];
        const crossed = [0, 1, 2, 3].filter(k => above[k] !== above[(k + 1) % 4]);
        if (crossed.length === 2) link(edges[crossed[0]], edges[crossed[1]]);
        else if (crossed.length === 4) {
          // A saddle: pair edges by the center value.
          const mid = (grid[r][c] + grid[r][c + 1] + grid[r + 1][c + 1] + grid[r + 1][c]) / 4 > v0;
          const pairs = mid === above[0] ? [0, 1, 2, 3] : [0, 3, 1, 2];
          link(edges[pairs[0]], edges[pairs[1]]);
          link(edges[pairs[2]], edges[pairs[3]]);
        }
      }
    }
    // Chain segments, starting from loose ends first so open lines come out whole.
    const used = new Set<string>();
    const starts = [...links.keys()].sort(
      (a, b) => (links.get(a)!.length === 1 ? 0 : 1) - (links.get(b)!.length === 1 ? 0 : 1),
    );
    for (const start of starts) {
      if (used.has(start)) continue;
      const chain = [start];
      used.add(start);
      let current = start;
      for (;;) {
        const next = links.get(current)!.find(key => !used.has(key));
        if (!next) break;
        used.add(next);
        chain.push(next);
        current = next;
      }
      const closed = chain.length > 2 && links.get(current)!.includes(start);
      const points = chain.map(edgePoint);
      // Tiny rings around a summit come out angular, so they're left off.
      if (points.length < (closed ? 8 : 3)) continue;
      const d = curve(points, closed);
      lines.push({ d, index: level % 5 === 0 });
    }
  }
  const stroke = (index: boolean) =>
    el("path", {
      d: lines
        .filter(l => l.index === index)
        .map(l => l.d)
        .join(""),
      fill: "none",
      stroke: scheme.line,
      "stroke-width": unit * (index ? 0.006 : 0.003),
      opacity: index ? "0.8" : "0.65",
    });
  out += stroke(false) + stroke(true);
  note.focus(w / 2, h / 2);
  note.alt(`Topographic contour lines circling ${count > 2 ? "several hills" : "a pair of hills"}, like a map`);
  return out;
});
