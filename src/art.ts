import { defineKind, el, fill, hsl, pts, s, type Point, type Rand } from "./core";
import { blob as softBlob } from "./shapes";
import { andList, capitalize, numberWord } from "./words";

/** Two or three soft-edged bands on a dark ground, after the color-field painters. */
export const field = defineKind("field", "Color field", (g, w, h, note) => {
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
  note.alt(`${capitalize(numberWord(count))} soft-edged bands of color, in the style of a color-field painting`);
  return out;
});

const OFF_WHITE = "#f3f0e6";

/** The canvas split again and again into rectangles, a few of them filled with primaries. */
export const grid = defineKind("grid", "Primary grid", (g, w, h, note) => {
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
  const colored = cells.filter((_, k) => fills[k] !== OFF_WHITE);
  note.alt(
    `${capitalize(numberWord(cells.length))} rectangles divided by thick lines, ${numberWord(colored.length)} filled with color, after Mondrian`,
  );
  // Focus on the largest colored cell.
  const main = colored.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
  note.focus(main.x + main.w / 2, main.y + main.h / 2);
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
export const squares = defineKind("squares", "Nested squares", (g, w, h, note) => {
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
    // The innermost square, set low in the frame.
    note.focus(ox + margin + side / 2, oy + margin * 1.5 + side / 2);
  }
  note.alt(`${capitalize(numberWord(count))} nested squares set low in the frame, after Josef Albers`);
  return out;
});

/** A large haloed circle among small circles, rings and thin lines. */
export const orbits = defineKind("orbits", "Orbiting circles", (g, w, h, note) => {
  const dark = g.chance(0.55);
  const ink = dark ? "#efe7d6" : "#1c1c22";
  const palette = ["#d9473b", "#f0b62e", "#2f6db5", "#1f9e89", "#7a3e9d", "#e57ea1", ink];
  let out = fill(w, h, dark ? hsl(g.f(200, 250), 30, 14) : hsl(g.f(30, 50), 35, 88));
  // Thin lines across the picture.
  const lines = g.i(2, 3);
  for (let k = lines; k > 0; k--) {
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
  note.focus(cx, cy);
  const smalls = g.i(5, 9);
  let rings = 0;
  for (let k = smalls; k > 0; k--) {
    const r = Math.min(w, h) * g.f(0.02, 0.1);
    const paint = g.pick(palette);
    const ring = g.chance(0.25);
    if (ring) rings++;
    out += ring
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
  const solids = smalls - rings;
  const plural = (k: number, one: string, many: string): string => `${numberWord(k)} ${k === 1 ? one : many}`;
  const parts = [solids && plural(solids, "small circle", "small circles"), rings && plural(rings, "ring", "rings")];
  note.alt(`A large haloed circle among ${parts.filter(Boolean).join(" and ")}, crossed by ${numberWord(lines)} lines`);
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
export const cutouts = defineKind("cutouts", "Paper cutouts", (g, w, h, note) => {
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

/** A grid of tiles, each holding a circle, half circle, quarter circle or triangle. */
export const bauhaus = defineKind("bauhaus", "Bauhaus tiles", (g, w, h, note) => {
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
  const used = new Set<number>();
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
      const shape = g.i(0, 4);
      used.add(shape);
      switch (shape) {
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
  // Name the shapes that appear, in a fixed order; both circle sizes read as "circles".
  const names = [
    used.has(0) || used.has(4) ? "circles" : "",
    used.has(1) ? "half circles" : "",
    used.has(2) ? "quarter circles" : "",
    used.has(3) ? "triangles" : "",
  ].filter(Boolean);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  note.alt(`A grid of ${numberWord(rows * cols)} Bauhaus-style tiles with ${list}`);
  return out;
});

/** Parallel wavy bands whose ripples swell and drift from one band to the next, in the style of op art. */
export const waves = defineKind("waves", "Op-art waves", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f4f1ea", "#17171b"],
    ["#f2ede4", "#1f3a5f"],
    ["#f6efe0", "#c8442f", "#1d2b44"],
    ["#efe9dc", "#2b6f6a", "#e2a33b", "#7b2e4f"],
    ["#1a1a20", "#e9e2d0"],
    ["#f7f3ea", "#3a5a98", "#e46c4c"],
  ]);
  let out = fill(w, h, palette[0]);
  const inks = palette.slice(1);
  // Spacing between band centers; each band is about half of it, so ground and ink alternate.
  const spacing = unit * g.f(0.07, 0.11);
  const thick = spacing * g.f(0.45, 0.55);
  const wavelength = unit * g.f(0.35, 0.7);
  // Capped so the slopes never get so steep that the bands pinch thin.
  const amp = Math.min(spacing * g.f(0.7, 1.6), wavelength * 0.18);
  const count = Math.ceil(h / spacing) + 6;
  // The ripples either swell and fade down the frame or grow steadily, and their crests drift
  // sideways a little per band. Both change slowly enough that neighboring bands never touch.
  const swell = g.chance(0.5);
  const flip = g.chance(0.5);
  const drift = g.f(0.004, 0.009) * g.pick([-1, 1]) * wavelength;
  const halves = Math.ceil((w + wavelength * 4) / (wavelength / 2));
  for (let k = 0; k < count; k++) {
    const y = (k - 3) * spacing;
    const t = flip ? 1 - k / count : k / count;
    const a = amp * (swell ? 0.15 + 0.85 * Math.sin(t * Math.PI) : 0.1 + 0.9 * t);
    // A sine wave made of quadratic half-waves, starting well off the left edge.
    const x0 = -wavelength * 1.5 + drift * (k - count / 2);
    let d = s`M${x0} ${y}Q${x0 + wavelength / 4} ${y - 2 * a} ${x0 + wavelength / 2} ${y}`;
    for (let j = 1; j < halves; j++) d += s`T${x0 + ((j + 1) * wavelength) / 2} ${y}`;
    out += el("path", {
      d,
      fill: "none",
      stroke: inks[k % inks.length],
      "stroke-width": thick,
    });
  }
  note.alt("Parallel wavy bands rippling across the frame, in the style of op art");
  return out;
});

/** A field of dots: an even polka-dot grid, a halftone screen, or a loose scatter. */
export const dots = defineKind("dots", "Dots", { pattern: ["polka", "halftone", "scattered"] }, (g, w, h, note) => {
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
});

/** Rainbow arches of nested bands standing on the ground, in mid-century colors. */
export const arches = defineKind("arches", "Rainbow arches", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#c4673f", "#e3a54a", "#9aa77f", "#e8c4b0", "#5e7b78"],
    ["#b5523b", "#f0b45c", "#6d8f88", "#f2d4c2", "#2f4858"],
    ["#d9824b", "#efc66b", "#a7b89a", "#c77c78", "#56596e"],
    ["#a0522d", "#dda15e", "#606c38", "#fefae0", "#bc6c25"],
  ]);
  let out = fill(w, h, g.pick(["#f4ebdd", "#f1e4d3", "#eee3cf", "#f6eee6"]));
  // A low ground strip, sometimes.
  const ground = g.chance(0.5) ? h * g.f(0.06, 0.12) : 0;
  const base = h - ground;
  // Enough arches to span a wide frame; their outer radii fit both the width and the height.
  const count = Math.max(1, Math.min(4, Math.round((w / h) * g.f(0.9, 1.3))));
  const slot = w / count;
  const sun = g.chance(0.45);
  let biggest: [number, number, number] = [0, 0, 0];
  const bands = g.i(3, 5);
  const archs: string[] = [];
  const outers = new Set<string>();
  for (let k = 0; k < count; k++) {
    const outer = Math.min(slot * g.f(0.36, 0.46), base * g.f(0.5, 0.64));
    const cx = slot * (k + 0.5) + slot * g.f(-0.06, 0.06);
    // Legs lift the round top above the ground; taller frames get longer legs.
    const legs = Math.max(0, base - outer - h * g.f(0.12, 0.22)) * g.f(0.5, 1);
    const cy = base - legs;
    const band = outer / (bands + g.f(0.4, 1.4));
    const start = g.i(0, palette.length - 1);
    outers.add(palette[start]);
    let arch = "";
    for (let j = 0; j < bands; j++) {
      // Each band is a thick stroke along the middle of its ring.
      const r = outer - band * (j + 0.5);
      arch += el("path", {
        d: s`M${cx - r} ${base + 1}V${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}V${base + 1}`,
        fill: "none",
        stroke: palette[(start + j) % palette.length],
        "stroke-width": band + 0.6,
      });
    }
    archs.push(arch);
    if (outer > biggest[2]) biggest = [cx, cy, outer];
  }
  // A sun in the sky behind, placed in a gap above the arches.
  if (sun) {
    const r = unit * g.f(0.07, 0.11);
    const x = count > 1 ? slot * g.i(1, count - 1) : w * g.pick([0.2, 0.8]);
    out += el("circle", { cx: x, cy: Math.max(r * 1.6, h * g.f(0.15, 0.25)), r, fill: g.pick(palette) });
  }
  out += archs.join("");
  // The ground takes a color no arch's outer band uses, so the arches stand out against it.
  const soil = palette.find(c => !outers.has(c)) ?? palette[0];
  if (ground) out += el("rect", { y: base, width: w, height: ground + 1, fill: soil });
  note.focus(biggest[0], biggest[1] - biggest[2] / 2);
  note.alt(
    `${count === 1 ? "A rainbow arch" : `${capitalize(numberWord(count))} rainbow arches`} of ${numberWord(bands)} nested bands${sun ? " under a round sun" : ""}, in mid-century style`,
  );
  return out;
});

/** A playful scatter of squiggles, zigzags, triangles and dots, in 1980s Memphis style. */
export const confetti = defineKind("confetti", "Memphis confetti", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#ff6b9a", "#ffd23f", "#3ec1d3", "#6a4c93", "#1b1b1f"],
    ["#f25f5c", "#ffe066", "#247ba0", "#70c1b3", "#1b1b1f"],
    ["#ff8fab", "#fcbf49", "#2ec4b6", "#3a0ca3", "#1b1b1f"],
    ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"],
  ]);
  let out = fill(w, h, g.pick(["#fdf8ef", "#fff3e6", "#f2f7f5", "#fdeef4", "#fff8d6"]));
  // One shape per cell of a jittered grid, so the scatter stays even.
  const cell = unit * g.f(0.24, 0.3);
  const rows = Math.max(2, Math.round(h / cell));
  const cols = Math.max(2, Math.round(w / cell));
  const cw = w / cols;
  const ch = h / rows;
  const size = Math.min(cw, ch);
  const stroke = unit * 0.022;
  const made = new Set<string>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + g.f(0.3, 0.7)) * cw;
      const y = (row + g.f(0.3, 0.7)) * ch;
      const paint = g.pick(palette);
      const turn = s`rotate(${g.f(0, 360)} ${x} ${y})`;
      const len = size * g.f(0.5, 0.75);
      const shape = g.pick(["squiggle", "zigzag", "triangle", "dot", "ring", "bar"] as const);
      made.add(shape);
      const line = { fill: "none", stroke: paint, "stroke-width": stroke, "stroke-linecap": "round" } as const;
      if (shape === "squiggle") {
        // Three quick humps.
        const step = len / 3;
        const a = size * 0.12;
        out += el("path", {
          d: s`M${x - len / 2} ${y}q${step / 2} ${-a * 2} ${step} 0t${step} 0t${step} 0`,
          ...line,
          "stroke-linejoin": "round",
          transform: turn,
        });
      } else if (shape === "zigzag") {
        const step = len / 4;
        const a = size * 0.1;
        out += el("path", {
          d: s`M${x - len / 2} ${y + a}l${step} ${-2 * a} ${step} ${2 * a} ${step} ${-2 * a} ${step} ${2 * a}`,
          ...line,
          "stroke-linejoin": "miter",
          transform: turn,
        });
      } else if (shape === "triangle") {
        const r = size * g.f(0.2, 0.3);
        const corners: Point[] = [0, 1, 2].map(k => [
          x + r * Math.cos(((k * 2) / 3) * Math.PI - Math.PI / 2),
          y + r * Math.sin(((k * 2) / 3) * Math.PI - Math.PI / 2),
        ]);
        out += el("polygon", {
          points: pts(corners),
          ...(g.chance(0.6) ? { fill: paint } : { ...line, "stroke-linejoin": "round" }),
          transform: turn,
        });
      } else if (shape === "dot") {
        out += el("circle", { cx: x, cy: y, r: size * g.f(0.08, 0.16), fill: paint });
      } else if (shape === "ring") {
        out += el("circle", { cx: x, cy: y, r: size * g.f(0.12, 0.2), ...line });
      } else {
        // A short, fat bar.
        out += el("rect", {
          x: x - len / 2,
          y: y - stroke * 1.2,
          width: len,
          height: stroke * 2.4,
          fill: paint,
          transform: turn,
        });
      }
    }
  }
  // A few tiny dots in the gaps.
  const specks: Point[] = [];
  for (let k = g.i(cols, cols * 2); k > 0; k--) specks.push([g.f(0, w), g.f(0, h)]);
  out += el("path", {
    d: specks.map(([x, y]) => s`M${x} ${y}h0`).join(""),
    stroke: palette[palette.length - 1],
    "stroke-width": stroke * 1.2,
    "stroke-linecap": "round",
  });
  const names = ["squiggle", "zigzag", "triangle", "dot", "ring"]
    .filter(name => made.has(name))
    .map(name => name + "s");
  note.alt(`A playful scatter of ${andList(names.length ? names : ["bars"])}, in 1980s Memphis style`);
  return out;
});

/** A tiling of triangles in a few colors, shading from one side of the frame to the other. */
export const triangles = defineKind("triangles", "Triangle tiling", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"],
    ["#1d3557", "#457b9d", "#a8dadc", "#f1faee", "#e63946"],
    ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
    ["#0b3954", "#087e8b", "#bfd7ea", "#ff5a5f", "#c81d25"],
    ["#3d405b", "#81b29a", "#f2cc8f", "#e07a5f", "#f4f1de"],
  ]);
  const colors = g.chance(0.5) ? palette : [...palette].reverse();
  const side = unit * g.f(0.2, 0.3);
  const tall = side * 0.866;
  // Colors run in order along a random direction, with noise so the steps break up.
  const angle = g.f(0, Math.PI * 2);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const span = Math.abs(dx) * w + Math.abs(dy) * h;
  const lo = Math.min(0, dx * w) + Math.min(0, dy * h);
  const noise = g.f(0.25, 0.5);
  const paths: string[] = colors.map(() => "");
  let out = fill(w, h, colors[0]);
  const rows = Math.ceil(h / tall);
  const cols = Math.ceil(w / (side / 2)) + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      // Triangles alternate pointing up and down along each row.
      const up = (col + row) % 2 === 0;
      const x = (col * side) / 2;
      const y = row * tall;
      const t = ((x + side / 2) * dx + (y + tall / 2) * dy - lo) / span + g.f(-noise, noise);
      const index = Math.max(0, Math.min(colors.length - 1, Math.floor(t * colors.length)));
      // Each triangle is nudged a hair larger so no seams show.
      paths[index] += up
        ? s`M${x + side / 2} ${y - 0.3}l${side / 2 + 0.5} ${tall + 0.6}h${-side - 1}z`
        : s`M${x - 0.5} ${y - 0.3}h${side + 1}l${-side / 2 - 0.5} ${tall + 0.6}z`;
    }
  }
  out += paths.map((d, k) => (d ? el("path", { d, fill: colors[k] }) : "")).join("");
  note.alt(`A tiling of triangles in ${numberWord(colors.length)} colors, shading across the frame`);
  return out;
});

/** Rays fanning out from a point, often around a round sun, like a 1960s sunburst. */
export const sunburst = defineKind("sunburst", "Sunburst", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f6c453", "#f08a4b", "#d1495b"],
    ["#f4e3c1", "#e9b872", "#c0603d"],
    ["#1f3b57", "#2c5f7c", "#f2c14e"],
    ["#fde2c4", "#f7b2a1", "#e6676b"],
    ["#2b2d42", "#3f4363", "#ef8354"],
    ["#e8f1e4", "#9cc5a1", "#2f6f62"],
  ]);
  // Where the rays start: the middle, low on the bottom edge, or a lower corner.
  const where = g.pick(["center", "bottom", "bottom", "corner"] as const);
  const side = g.pick([-1, 1]);
  const ox = where === "center" ? w * g.f(0.4, 0.6) : where === "bottom" ? w * g.f(0.35, 0.65) : side < 0 ? 0 : w;
  const oy = where === "center" ? h * g.f(0.4, 0.6) : h * g.f(0.92, 1);
  const reach = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)) * 1.1;
  let out = fill(w, h, palette[0]);
  // Rays alternate with the ground; a tapered spread leaves a gap at the hub.
  const count = g.i(9, 18) * (where === "center" ? 2 : 1);
  const span = where === "center" ? Math.PI * 2 : where === "bottom" ? Math.PI : Math.PI / 2;
  const first = where === "center" ? g.f(0, Math.PI) : where === "bottom" ? Math.PI : side < 0 ? -Math.PI / 2 : Math.PI;
  const step = span / count;
  const share = g.f(0.35, 0.55);
  const rays: Point[] = [];
  let d = "";
  for (let k = 0; k < count; k++) {
    const a = first + step * (k + (1 - share) / 2);
    const b = a + step * share;
    rays.push([ox + Math.cos(a) * reach, oy + Math.sin(a) * reach]);
    d += s`M${ox} ${oy}L${ox + Math.cos(a) * reach} ${oy + Math.sin(a) * reach}L${ox + Math.cos(b) * reach} ${oy + Math.sin(b) * reach}Z`;
  }
  out += el("path", { d, fill: palette[1] });
  // The sun at the hub, with a ring around it.
  const sun = g.chance(0.8);
  if (sun) {
    const r = unit * (where === "corner" ? g.f(0.3, 0.42) : g.f(0.16, 0.26));
    out += el("circle", { cx: ox, cy: oy, r: r * g.f(1.2, 1.35), fill: palette[0] });
    out += el("circle", { cx: ox, cy: oy, r, fill: palette[2] });
  }
  note.focus(ox === 0 ? unit * 0.15 : ox === w ? w - unit * 0.15 : ox, Math.min(oy, h - unit * 0.15));
  const from = where === "center" ? "" : where === "bottom" ? " from the bottom edge" : " from a lower corner";
  note.alt(
    `${count > 12 ? "Rays" : `${capitalize(numberWord(count))} rays`} fanning out${from}${sun ? " around a round sun" : ""}, like a retro sunburst`,
  );
  return out;
});

/** Smooth rounded stones laid out on a plain ground, after the biomorphic sculptors. */
export const pebbles = defineKind("pebbles", "Pebbles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#ece6da", stones: ["#3f4447", "#8a8d8f", "#b9b2a6", "#c98a62", "#d9d2c3"] },
    { ground: "#e3ddd0", stones: ["#2e3a3f", "#6f7d6b", "#a3a58b", "#d8cfc0", "#b5714f"] },
    { ground: "#2f3437", stones: ["#d9d2c3", "#a89f91", "#c47a53", "#7b8a7e", "#ece6da"] },
    { ground: "#efe4d2", stones: ["#d36b3f", "#e9b35f", "#3b5b6d", "#a9b7a0", "#1f2326"] },
    { ground: "#d8e0dc", stones: ["#3a4a4f", "#f1ece2", "#c58b6b", "#8fa39a", "#d7b56d"] },
  ]);
  let out = fill(w, h, scheme.ground);
  // Place stones largest first, keeping a gap between their rough bounding circles.
  const placed: { x: number; y: number; r: number }[] = [];
  const target = Math.min(18, Math.round(((w * h) / (unit * unit)) * g.f(5, 8)));
  const gap = unit * g.f(0.02, 0.035);
  for (let tries = 0; tries < 600 && placed.length < target; tries++) {
    const r = unit * g.f(0.1, 0.24) * (1 - (0.6 * tries) / 600);
    const x = g.f(r + gap, w - r - gap);
    const y = g.f(r + gap, h - r - gap);
    if (placed.every(p => Math.hypot(p.x - x, p.y - y) > p.r + r + gap)) placed.push({ x, y, r });
  }
  const drop = unit * 0.018;
  let holed = g.chance(0.4);
  let biggest = placed[0];
  for (const { x, y, r } of placed) {
    if (r > biggest.r) biggest = { x, y, r };
    // An oval a little smaller than the bounding circle, with gentle lobes.
    const rx = r * 0.92;
    const ry = rx * g.f(0.6, 0.9);
    const d = softBlob(g, x, y, rx, ry, 2, g.f(0.04, 0.1), 0.05);
    const angle = g.f(-50, 50);
    const turn = s`rotate(${angle} ${x} ${y})`;
    // A soft shadow below (a plain oval is close enough), then the stone.
    out += el("ellipse", {
      cx: x + drop * 0.5,
      cy: y + drop,
      rx,
      ry,
      fill: "#000",
      opacity: "0.16",
      transform: s`rotate(${angle} ${x + drop * 0.5} ${y + drop})`,
    });
    out += el("path", { d, fill: g.pick(scheme.stones), transform: turn });
    // One large stone may be pierced, after Hepworth.
    if (holed && r > unit * 0.13) {
      holed = false;
      out += el("ellipse", {
        cx: x + r * g.f(-0.15, 0.15),
        cy: y,
        rx: r * 0.26,
        ry: ry * 0.32,
        fill: scheme.ground,
        transform: turn,
      });
    }
  }
  if (biggest) note.focus(biggest.x, biggest.y);
  note.alt(
    `${placed.length > 12 ? "Many" : capitalize(numberWord(placed.length))} smooth rounded stones laid out on a plain ground`,
  );
  return out;
});

/** Hard-edged stripes of varied widths, tilted across the frame. */
export const stripes = defineKind("stripes", "Hard-edge stripes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f3ead8", "#e4572e", "#29335c", "#f3a712", "#669bbc"],
    ["#f6f1e7", "#2a9d8f", "#e9c46a", "#e76f51", "#264653"],
    ["#1e1e24", "#f2c14e", "#f78154", "#4d9de0", "#e8e1d4"],
    ["#f4efe6", "#c1121f", "#003049", "#fdf0d5", "#669bbc"],
    ["#ede7f6", "#5e548e", "#9f86c0", "#e0b1cb", "#231942"],
  ]);
  const angle = g.pick([0, 90, 30, -30, 45, -45, 60, -60, 20, -20]);
  const diag = Math.hypot(w, h);
  let out = fill(w, h, palette[0]);
  // Widths come in a few multiples of one module, so the rhythm reads as designed.
  const module = unit * g.f(0.03, 0.05);
  const widths = [1, 1, 2, 3, 4, 6];
  let x = w / 2 - diag / 2;
  let last = palette[0];
  let bands = "";
  while (x < w / 2 + diag / 2) {
    const width = module * g.pick(widths);
    let paint = g.pick(palette);
    while (paint === last) paint = g.pick(palette);
    last = paint;
    if (paint !== palette[0]) {
      bands += el("rect", { x, y: h / 2 - diag / 2, width: width + 0.4, height: diag, fill: paint });
    }
    x += width;
  }
  out += el("g", { transform: angle ? `rotate(${angle} ${w / 2} ${h / 2})` : undefined }, bands);
  const tilt = angle === 0 ? "Upright" : angle === 90 ? "Level" : "Slanting";
  note.alt(`${tilt} hard-edged stripes of varied widths, in the style of hard-edge painting`);
  return out;
});
