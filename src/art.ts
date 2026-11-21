import { defineKind, el, fill, hsl, s, type Point, type Rand } from "./core";

/** Two or three soft-edged bands on a dark ground, after the color-field painters. */
export const field = defineKind("field", "Color field", (g, w, h) => {
  const hue = g.f(0, 360);
  const margin = w * 0.08;
  const gap = h * 0.05;
  const count = g.i(2, 3);
  const blur = g.id("blur");
  // A soft blur for the band edges.
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: "-10%", y: "-10%", width: "120%", height: "120%" },
      el("feGaussianBlur", { stdDeviation: Math.min(w, h) * 0.012 }),
    ),
  );
  // The dark ground.
  out += fill(w, h, hsl(hue, g.f(35, 60), g.f(22, 42)));
  // The bands share the height left over after margins and gaps, in proportion to their weights.
  const weights = Array.from({ length: count }, () => g.f(0.6, 1.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const avail = h - 2 * margin - (count - 1) * gap;
  let y = margin;
  for (const weight of weights) {
    const bandH = (avail * weight) / total;
    out += el("rect", {
      x: margin,
      y,
      width: w - 2 * margin,
      height: bandH,
      fill: hsl(hue + g.f(-45, 45), g.f(40, 78), g.f(30, 70)),
      filter: `url(#${blur})`,
      opacity: "0.94",
    });
    y += bandH + gap;
  }
  return out;
});

const OFF_WHITE = "#f3f0e6";

/** The canvas split again and again into rectangles, a few of them filled with primaries. */
export const grid = defineKind("grid", "Primary grid", (g, w, h) => {
  type Cell = { x: number; y: number; w: number; h: number };
  const cells: Cell[] = [{ x: 0, y: 0, w, h }];
  // Repeatedly split one of the largest cells across its longer side.
  const splits = g.i(5, 9);
  for (let k = 0; k < splits; k++) {
    cells.sort((a, b) => b.w * b.h - a.w * a.h);
    const cell = cells.splice(g.chance(0.7) ? 0 : Math.min(1, cells.length - 1), 1)[0];
    const t = g.f(0.28, 0.72);
    if (cell.w / cell.h > g.f(0.7, 1.5))
      cells.push({ ...cell, w: cell.w * t }, { ...cell, x: cell.x + cell.w * t, w: cell.w * (1 - t) });
    else cells.push({ ...cell, h: cell.h * t }, { ...cell, y: cell.y + cell.h * t, h: cell.h * (1 - t) });
  }
  const palette = g.pick([
    ["#d23a2a", "#1f4fa0", "#f2c230", "#17171c"],
    ["#c8553d", "#2d5d7b", "#e9b44c", "#2b2b2b"],
    ["#e4572e", "#29335c", "#f3a712", "#669bbc"],
  ]);
  // Most cells stay off-white, but at least one gets a color.
  const fills: string[] = cells.map(() => (g.chance(0.32) ? g.pick(palette) : OFF_WHITE));
  if (!fills.some(f => f !== OFF_WHITE)) fills[g.i(0, fills.length - 1)] = palette[0];
  // The cells, outlined in thick dark lines.
  const strokeWidth = Math.min(w, h) * 0.02;
  return cells
    .map((cell, k) =>
      el("rect", {
        x: cell.x,
        y: cell.y,
        width: cell.w,
        height: cell.h,
        fill: fills[k],
        stroke: "#15151a",
        "stroke-width": strokeWidth,
      }),
    )
    .join("");
});

/** Squares nested low in the frame in neighboring colors, after Albers. */
export const squares = defineKind("squares", "Nested squares", (g, w, h) => {
  const hue = g.f(0, 360);
  const dir = g.pick([-1, 1]);
  const step = g.f(5, 18);
  const sat = g.f(35, 75);
  const baseLight = g.f(28, 62);
  // Each square steps lighter on dark grounds and darker on light ones.
  const lightStep = g.f(7, 13) * (baseLight > 50 ? -1 : 1);
  const count = g.i(3, 4);
  // The outermost square is the ground.
  let out = fill(w, h, hsl(hue, sat, baseLight));
  const size = Math.min(w, h);
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  for (let k = 1; k < count; k++) {
    const side = size * (1 - k * (count === 4 ? 0.22 : 0.28));
    const margin = (size - side) / 2;
    // Margins run 1 : 2 : 3 from bottom to sides to top.
    out += el("rect", {
      x: ox + margin,
      y: oy + margin * 1.5,
      width: side,
      height: side,
      fill: hsl(hue + dir * step * k, sat + g.f(-8, 8), baseLight + lightStep * k),
    });
  }
  return out;
});

/** A large haloed circle among small circles, rings and thin lines. */
export const orbits = defineKind("orbits", "Orbiting circles", (g, w, h) => {
  const dark = g.chance(0.55);
  const ink = dark ? "#efe7d6" : "#1c1c22";
  const palette = ["#d9473b", "#f0b62e", "#2f6db5", "#1f9e89", "#7a3e9d", "#e57ea1", ink];
  let out = fill(w, h, dark ? hsl(g.f(200, 250), 30, 14) : hsl(g.f(30, 50), 35, 88));
  // Thin lines across the picture.
  for (let k = g.i(2, 3); k > 0; k--) {
    out += el("line", {
      x1: w * g.f(-0.1, 0.5),
      y1: h * g.f(0, 1),
      x2: w * g.f(0.5, 1.1),
      y2: h * g.f(0, 1),
      stroke: ink,
      "stroke-width": g.f(1, 3),
      opacity: "0.7",
    });
  }
  // The big circle and its halo.
  const cx = w * g.f(0.3, 0.7);
  const cy = h * g.f(0.35, 0.62);
  const radius = Math.min(w, h) * g.f(0.2, 0.3);
  out += el("circle", { cx, cy, r: radius * 1.22, fill: g.pick(palette), opacity: "0.35" });
  out += el("circle", { cx, cy, r: radius, fill: g.pick(palette), opacity: "0.92" });
  // Small circles, some of them rings.
  for (let k = g.i(5, 9); k > 0; k--) {
    const r = Math.min(w, h) * g.f(0.02, 0.1);
    const paint = g.pick(palette);
    out += g.chance(0.25)
      ? el("circle", {
          cx: w * g.f(0.05, 0.95),
          cy: h * g.f(0.08, 0.92),
          r,
          fill: "none",
          stroke: paint,
          "stroke-width": r * 0.3,
        })
      : el("circle", { cx: w * g.f(0.05, 0.95), cy: h * g.f(0.08, 0.92), r, fill: paint, opacity: "0.88" });
  }
  return out;
});

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
export const cutouts = defineKind("cutouts", "Paper cutouts", (g, w, h) => {
  const palette = g.pick([
    ["#1d4e89", "#e8563f", "#f2c14e", "#2a9d8f", "#111111"],
    ["#264653", "#e76f51", "#f4a261", "#8ab17d", "#ffffff"],
    ["#3b1f5c", "#ff7b54", "#ffd56b", "#4ecdc4", "#f7f4ea"],
  ]);
  let out = fill(w, h, g.pick(["#f6efe2", "#e9eef2", "#f3e1d8", "#1d4e89", "#f0e6c8"]));
  const unit = Math.min(w, h);
  // The cut shapes.
  for (let k = g.i(3, 6); k > 0; k--) {
    out += el("path", {
      d: blob(g, w * g.f(0.1, 0.9), h * g.f(0.15, 0.85), unit * g.f(0.1, 0.24), g.i(3, 7), g.f(0.18, 0.45)),
      fill: g.pick(palette),
    });
  }
  return out;
});

/** A grid of tiles, each holding a circle, half circle, quarter circle or triangle. */
export const bauhaus = defineKind("bauhaus", "Bauhaus tiles", (g, w, h) => {
  const palette = g.pick([
    ["#e63946", "#f1c453", "#1d3557", "#f1faee"],
    ["#d1495b", "#edae49", "#00798c", "#30638e"],
    ["#222222", "#e9e3d5", "#c44536", "#e0a458"],
    ["#3d405b", "#e07a5f", "#f2cc8f", "#81b29a"],
  ]);
  const cell = Math.min(w, h) / 3;
  const rows = Math.ceil(h / cell);
  const cols = Math.ceil(w / cell);
  let out = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cell;
      const y = row * cell;
      // Two different colors: one for the tile, one for its shape.
      const ground = g.pick(palette);
      let paint = g.pick(palette);
      while (paint === ground) paint = g.pick(palette);
      // A quarter-turn rotation about the tile center, used by the shapes that have a direction.
      const transform = s`rotate(${90 * g.i(0, 3)} ${x + cell / 2} ${y + cell / 2})`;
      // The tile, slightly oversized so no seams show.
      out += el("rect", { x, y, width: cell + 0.5, height: cell + 0.5, fill: ground });
      switch (g.i(0, 4)) {
        case 0:
          // A large circle.
          out += el("circle", { cx: x + cell / 2, cy: y + cell / 2, r: cell * 0.42, fill: paint });
          break;
        case 1:
          // A half circle.
          out += el("path", {
            d: s`M${x} ${y + cell / 2}
                 A ${cell / 2} ${cell / 2} 0 0 1 ${x + cell} ${y + cell / 2}Z`,
            fill: paint,
            transform,
          });
          break;
        case 2:
          // A quarter circle.
          out += el("path", {
            d: s`M${x} ${y}
                 L${x + cell} ${y}
                 A ${cell} ${cell} 0 0 1 ${x} ${y + cell}Z`,
            fill: paint,
            transform,
          });
          break;
        case 3:
          // A right triangle.
          out += el("polygon", { points: s`${x},${y} ${x + cell},${y} ${x},${y + cell}`, fill: paint, transform });
          break;
        default:
          // A small circle.
          out += el("circle", { cx: x + cell / 2, cy: y + cell / 2, r: cell * 0.22, fill: paint });
      }
    }
  }
  return out;
});
