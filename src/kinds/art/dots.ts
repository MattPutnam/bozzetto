import { defineKind, el, fill, type Point, s } from "../../draw/core";

/**
 * A field of dots: an even polka-dot grid, a halftone screen, or a loose scatter.
 *
 * @category Art
 */
export const dots = /* @__PURE__ */ defineKind(
  "dots",
  "Dots",
  { pattern: ["polka", "halftone", "scattered"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const pattern = g.option("pattern", g.pick(["polka", "halftone", "scattered"] as const));
    const palette = g.pick([
      ["#f5efe3", "#e4572e", "#29335c", "#f3a712"],
      ["#fdf6ec", "#d1495b", "#00798c", "#edae49"],
      ["#1d2a3a", "#f2c14e", "#f78154", "#4d9de0"],
      ["#f3ece2", "#2a9d8f", "#e76f51", "#264653"],
      ["#ffe9e3", "#c9184a", "#ff8fa3", "#590d22"],
    ]);
    let out = fill(w, h, palette[0]);
    const inks = palette.slice(1);
    // Dots of one size share a path: each is a zero-length stroke with round caps.
    const dotPath = (points: Point[], diameter: number, paint: string): string =>
      points.length
        ? el("path", {
            d: points.map(([x, y]) => s`M${x} ${y}h0`).join(""),
            stroke: paint,
            "stroke-width": diameter,
            "stroke-linecap": "round",
          })
        : "";
    if (pattern === "polka") {
      // A staggered grid of equal dots, in one or two colors.
      const step = unit * g.f(0.12, 0.2);
      const size = step * g.f(0.35, 0.55);
      const two = g.chance(0.5);
      const first = g.pick(inks);
      const second = inks.find(c => c !== first)!;
      const sets: [Point[], Point[]] = [[], []];
      const rows = Math.ceil(h / (step * 0.866)) + 1;
      const cols = Math.ceil(w / step) + 1;
      const ox = g.f(0, step);
      for (let row = 0; row <= rows; row++) {
        for (let col = -1; col <= cols; col++) {
          const x = ox + col * step + (row % 2 ? step / 2 : 0);
          sets[two && row % 2 ? 1 : 0].push([x, row * step * 0.866]);
        }
      }
      out += dotPath(sets[0], size, first) + dotPath(sets[1], size, second);
      note.alt(two ? "Rows of polka dots in two alternating colors" : "Evenly spaced polka dots on a plain ground");
    } else if (pattern === "halftone") {
      // A halftone screen: dots swell toward a bright spot and shrink away from it.
      const step = unit * g.f(0.075, 0.1);
      const cx = w * g.f(0.2, 0.8);
      const cy = h * g.f(0.2, 0.8);
      const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * g.f(0.8, 1.1);
      const levels = 6;
      const sets: Point[][] = Array.from({ length: levels }, () => []);
      const rows = Math.ceil(h / (step * 0.866)) + 1;
      const cols = Math.ceil(w / step) + 1;
      for (let row = 0; row <= rows; row++) {
        for (let col = -1; col <= cols; col++) {
          const x = col * step + (row % 2 ? step / 2 : 0);
          const y = row * step * 0.866;
          const t = Math.max(0, 1 - Math.hypot(x - cx, y - cy) / reach);
          const level = Math.min(levels - 1, Math.floor(t * levels));
          sets[level].push([x, y]);
        }
      }
      const ink = g.pick(inks);
      out += sets.map((set, k) => dotPath(set, step * (0.18 + (0.92 * (k + 1)) / levels), ink)).join("");
      note.focus(cx, cy);
      note.alt("A halftone screen of dots that grow larger toward one bright spot");
    } else {
      // A loose scatter of dots in several sizes, spread by a jittered grid so none clump.
      const cell = unit * g.f(0.18, 0.24);
      const rows = Math.ceil(h / cell);
      const cols = Math.ceil(w / cell);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const count = g.chance(0.3) ? 2 : 1;
          for (let k = 0; k < count; k++) {
            const r = cell * (g.chance(0.2) ? g.f(0.3, 0.45) : g.f(0.06, 0.22));
            out += el("circle", {
              cx: (col + g.f(0.15, 0.85)) * cell * (w / (cols * cell)),
              cy: (row + g.f(0.15, 0.85)) * cell * (h / (rows * cell)),
              r,
              fill: g.pick(inks),
              opacity: g.chance(0.3) ? "0.8" : undefined,
            });
          }
        }
      }
      note.alt("Dots of many sizes scattered loosely across a plain ground");
    }
    return out;
  },
);
