/** Calm background textures meant to sit behind text: stone, cloth, maps and soft color. */
import { defineKind, el, fill, hsl, mix, s, type Point, type Rand } from "./core";

/** A repeating tile of the given size, offset so the seams fall somewhere different each seed. */
const tile = (g: Rand, id: string, size: number, ...children: string[]): string =>
  el(
    "pattern",
    { id, width: size, height: size, x: g.f(0, size), y: g.f(0, size), patternUnits: "userSpaceOnUse" },
    ...children,
  );

/** Numbers for path data, rounded to whole pixels and run together where a minus sign allows. */
const nums = (values: readonly number[]): string =>
  values.map((v, k) => (k > 0 && v >= 0 ? " " : "") + Math.round(v)).join("");

/**
 * A smooth curve through the midpoints of a run of points, using the points as controls, in
 * compact relative path data. An open curve runs from the first point to the last.
 */
function curve(raw: readonly Point[], closed = false): string {
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

/** Chips of stone in a few colors scattered thickly over a pale ground. */
export const terrazzo = defineKind("terrazzo", "Terrazzo", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#efebe4", chips: ["#c9b8a6", "#9aa5a0", "#d98b6a", "#5f6b6d"] },
    { ground: "#f3ede6", chips: ["#e3a48d", "#f1c9a8", "#8fb3a8", "#c95f4c"] },
    { ground: "#e9ece8", chips: ["#7f9c96", "#c7d3cc", "#d8b46a", "#4a5a5f"] },
    { ground: "#f2efe9", chips: ["#b7c4d6", "#e8b7a5", "#6c7f99", "#d6cfc2"] },
    { ground: "#ece4da", chips: ["#a3745a", "#d9b99b", "#6e7b72", "#efd6c0"] },
    { ground: "#f1eee8", chips: ["#2f3437", "#9c958a", "#c9c2b6", "#b85c38"] },
  ]);
  const colors = scheme.chips.slice(0, g.i(3, 4));
  const big = g.f(0.035, 0.06);
  // A square tile of chips, repeated. Chips near an edge are drawn again on the far side so the
  // tile wraps without seams.
  const layer = (name: string, size: number, count: number, low: number, high: number, extra = ""): string => {
    const paths = colors.map(() => "");
    const placed: Point[] = [];
    for (let tries = 0; tries < 300 && placed.length < count; tries++) {
      const x = g.f(0, size);
      const y = g.f(0, size);
      // Keep chips from piling up, wrapping distances around the tile.
      const near = placed.some(([px, py]) => {
        const dx = Math.min(Math.abs(px - x), size - Math.abs(px - x));
        const dy = Math.min(Math.abs(py - y), size - Math.abs(py - y));
        return Math.hypot(dx, dy) < unit * big * high * 2.2;
      });
      if (near) continue;
      placed.push([x, y]);
      // An angular chip: a few corners at uneven distances around its center.
      const r = unit * big * g.f(low, high);
      const corners = g.i(4, 6);
      const turn = g.f(0, Math.PI * 2);
      const ring: Point[] = [];
      for (let k = 0; k < corners; k++) {
        const a = turn + ((k + g.f(-0.3, 0.3)) / corners) * Math.PI * 2;
        const reach = r * g.f(0.6, 1.1);
        ring.push([Math.cos(a) * reach, Math.sin(a) * reach * g.f(0.6, 1)]);
      }
      const shape = (ox: number, oy: number) =>
        s`M${ox + ring[0][0]} ${oy + ring[0][1]}` +
        ring
          .slice(1)
          .map(([px, py], k) => s`l${px - ring[k][0]} ${py - ring[k][1]}`)
          .join("") +
        "z";
      const color = g.i(0, colors.length - 1);
      for (const ox of [x, x - size, x + size]) {
        if (ox !== x && Math.abs(ox - size / 2) > size / 2 + r) continue;
        for (const oy of [y, y - size, y + size]) {
          if (oy !== y && Math.abs(oy - size / 2) > size / 2 + r) continue;
          paths[color] += shape(ox, oy);
        }
      }
    }
    const id = g.id(name);
    defs += tile(g, id, size, ...paths.map((d, k) => (d ? el("path", { d, fill: colors[k] }) : "")), extra);
    return el("rect", { width: w, height: h, fill: `url(#${id})` });
  };
  // Fine specks between the chips.
  const small = unit * g.f(0.5, 0.65);
  const specks: string[] = [];
  for (let k = g.i(25, 35); k > 0; k--) specks.push(s`M${g.f(0, small)} ${g.f(0, small)}h0`);
  const specked = el("path", {
    d: specks.join(""),
    stroke: mix(scheme.ground, colors[colors.length - 1], 0.5),
    "stroke-width": unit * 0.008,
    "stroke-linecap": "round",
  });
  // Two tiles of different sizes laid over each other, so the repeat is hard to spot: large chips
  // on one, small chips and specks on the other.
  let defs = "";
  const large = layer("large", small * g.f(1.3, 1.45), g.i(10, 14), 0.8, 1.3);
  const fine = layer("fine", small, g.i(18, 24), 0.3, 0.6, specked);
  let out = el("defs", {}, defs);
  out += fill(w, h, scheme.ground);
  out += large + fine;
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "Terrazzo stone with angular chips scattered over a pale ground"
      : "A speckled terrazzo surface of small stone chips set in pale cement",
  );
  return out;
});

/** Soft, branching veins wandering across pale polished stone. */
export const marble = defineKind("marble", "Marble", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#f3f1ec", cloud: "#e2ded6", vein: "#8c8a86" },
    { ground: "#f2eee8", cloud: "#e7ddd0", vein: "#a98c6e" },
    { ground: "#eef1f0", cloud: "#dbe2e0", vein: "#6f8682" },
    { ground: "#f4efed", cloud: "#eadcd8", vein: "#a07c78" },
    { ground: "#e9e8ea", cloud: "#d9d7dc", vein: "#5e5c68" },
    { ground: "#f5f2ea", cloud: "#ebe3cf", vein: "#b39258" },
  ]);
  const blur = g.id("soft");
  const cloudBlur = g.id("cloud");
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: "-20%", y: "-20%", width: "140%", height: "140%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.012 }),
    ),
    el(
      "filter",
      { id: cloudBlur, x: "-50%", y: "-50%", width: "200%", height: "200%" },
      el("feGaussianBlur", { stdDeviation: unit * 0.09 }),
    ),
  );
  out += fill(w, h, scheme.ground);
  // Faint clouding in the stone, spread along the frame.
  const clouds = Math.round(w / unit) * 2 + 2;
  let cloudD = "";
  for (let k = 0; k < clouds; k++) {
    const x = ((k + g.f(0.1, 0.9)) / clouds) * w;
    const y = g.f(0.1, 0.9) * h;
    const r = unit * g.f(0.15, 0.3);
    cloudD += s`M${x - r} ${y}a${r} ${r * 0.6} 0 1 0 ${r * 2} 0a${r} ${r * 0.6} 0 1 0 ${-r * 2} 0`;
  }
  out += el("path", { d: cloudD, fill: scheme.cloud, opacity: "0.7", filter: `url(#${cloudBlur})` });
  // Veins share a general direction, each wandering from beyond one edge to beyond the other.
  const base = g.f(-0.6, 0.6) + (h > w * 1.2 ? Math.PI / 2 : 0);
  const diag = Math.hypot(w, h);
  const spread = Math.round((w + h) / unit) + g.i(0, 1);
  const veins: string[] = [];
  const twigs: string[] = [];
  const nx = -Math.sin(base);
  const ny = Math.cos(base);
  for (let k = 0; k < spread; k++) {
    // Start points spaced across the frame, perpendicular to the flow.
    const off = ((k + g.f(0.2, 0.8)) / spread - 0.5) * (Math.abs(nx) * w + Math.abs(ny) * h);
    const cx = w / 2 + nx * off;
    const cy = h / 2 + ny * off;
    let a = base + g.f(-0.25, 0.25);
    let x = cx - Math.cos(a) * diag * 0.6;
    let y = cy - Math.sin(a) * diag * 0.6;
    const step = unit * g.f(0.09, 0.14);
    const points: Point[] = [[x, y]];
    for (let j = 0; j < Math.ceil((diag * 1.2) / step); j++) {
      a += g.f(-0.45, 0.45);
      // Pulled back toward the shared direction so veins don't loop.
      a += (base - a) * 0.3;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      points.push([x, y]);
      // Now and then a thinner twig splits off and fades out.
      if (j > 1 && g.chance(0.12) && x > 0 && x < w && y > 0 && y < h) {
        let ta = a + g.pick([-1, 1]) * g.f(0.5, 0.9);
        let tx = x;
        let ty = y;
        const twig: Point[] = [[tx, ty]];
        for (let t = g.i(3, 5); t > 0; t--) {
          ta += g.f(-0.4, 0.4);
          tx += Math.cos(ta) * step * 0.7;
          ty += Math.sin(ta) * step * 0.7;
          twig.push([tx, ty]);
        }
        twigs.push(curve(twig));
      }
    }
    // Only the part over the frame is kept.
    const inside = ([px, py]: Point) => px > -step && px < w + step && py > -step && py < h + step;
    const from = points.findIndex(inside);
    let to = points.length;
    while (to > from + 1 && !inside(points[to - 1])) to--;
    if (from >= 0 && to - from > 1)
      veins.push(curve(points.slice(Math.max(0, from - 1), Math.min(points.length, to + 1))));
  }
  // Each set of paths is written once and drawn again with <use>: a wide soft haze, a medium line,
  // and a fine crisp thread.
  const veinId = g.id("veins");
  const twigId = g.id("twigs");
  out += el(
    "defs",
    {},
    el("path", { id: veinId, d: veins.join("") }),
    el("path", { id: twigId, d: twigs.join("") || "M0 0" }),
  );
  const line = (id: string, width: number, opacity: number, soft = false) =>
    el("use", {
      href: `#${id}`,
      fill: "none",
      stroke: scheme.vein,
      "stroke-width": width,
      "stroke-linecap": "round",
      opacity: String(opacity),
      filter: soft ? `url(#${blur})` : undefined,
    });
  out += line(veinId, unit * 0.035, 0.16, true);
  out += line(veinId, unit * 0.008, 0.28, true);
  out += line(twigId, unit * 0.008, 0.2, true);
  out += line(veinId, unit * 0.0035, 0.45);
  out += line(twigId, unit * 0.002, 0.35);
  note.focus(w / 2, h / 2);
  note.alt("Pale polished marble with soft branching veins running across it");
  return out;
});

/** A woven check of two crossing sets of translucent stripes. */
export const gingham = defineKind("gingham", "Gingham", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.pick([0, 12, 200, 215, 140, 165, 45, 280, 340, 25]);
  const ground = g.chance(0.8) ? "#fbfaf7" : hsl(hue + 30, 40, 94);
  const ink = hsl(hue + g.f(-8, 8), g.f(45, 65), g.f(60, 72));
  const size = unit * g.pick([0.08, 0.1, 0.12, 0.15]);
  const band = size / 2;
  const id = g.id("check");
  const weave = g.id("weave");
  // A fine diagonal twill inside the stripes, so the cloth reads as woven.
  const fine = size / 6;
  const twill = el(
    "pattern",
    { id: weave, width: fine, height: fine, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
    el("rect", { width: fine / 2, height: fine, fill: "#ffffff", opacity: "0.18" }),
  );
  const opacity = String(g.f(0.45, 0.55).toFixed(2));
  let out = el(
    "defs",
    {},
    twill,
    tile(
      g,
      id,
      size,
      el("rect", { width: size, height: band, fill: ink, opacity }),
      el("rect", { width: band, height: size, fill: ink, opacity }),
    ),
  );
  out += fill(w, h, ground);
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  out += el("rect", { width: w, height: h, fill: `url(#${weave})` });
  note.focus(w / 2, h / 2);
  note.alt(
    size > unit * 0.11
      ? "A woven gingham check with broad crossing stripes"
      : "A fine gingham check of crossing translucent stripes",
  );
  return out;
});

/** A tartan plaid: a mirrored run of stripes in several widths and colors, crossing itself. */
export const plaid = defineKind("plaid", "Plaid", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#3f5a4a", "#6d8a72", "#c9b98a", "#8c3b3b", "#e8dfc8"],
    ["#33415c", "#5c6f91", "#b9c4d6", "#c58f4e", "#efe9dd"],
    ["#7a3b3b", "#a85a50", "#d9b48f", "#3e4a3d", "#f0e6d6"],
    ["#5b4a6b", "#8c7ca3", "#d8cfe3", "#c2a04f", "#f2eef4"],
    ["#4a5d57", "#86a39a", "#e3d9b8", "#b5654a", "#f4efe3"],
    ["#6b5440", "#a2846a", "#e2d3bd", "#4f6475", "#f5efe6"],
  ]);
  // Calmer plaids lift every color toward the lightest one.
  const lift = g.f(0.25, 0.45);
  const colors = palette.map(c => mix(c, palette[4], lift));
  // Half a sett: stripes of a few widths; the other half mirrors it.
  const module = unit * g.f(0.012, 0.018);
  const half: { color: string; width: number }[] = [];
  let last = -1;
  for (let k = g.i(5, 7); k > 0; k--) {
    let pick = g.i(0, colors.length - 1);
    while (pick === last) pick = g.i(0, colors.length - 1);
    last = pick;
    half.push({ color: colors[pick], width: module * g.pick([1, 2, 4, 6, 8, 12]) });
  }
  const sett = [...half, ...[...half].reverse()];
  const size = sett.reduce((sum, stripe) => sum + stripe.width, 0);
  // Horizontal stripes are solid; vertical ones are half see-through, so crossings blend.
  let across = "";
  let down = "";
  let at = 0;
  for (const { color, width } of sett) {
    across += el("rect", { y: at, width: size, height: width + 0.2, fill: color });
    down += el("rect", { x: at, width: width + 0.2, height: size, fill: color });
    at += width;
  }
  const id = g.id("sett");
  const weave = g.id("twill");
  const fine = module * 1.2;
  let out = el(
    "defs",
    {},
    tile(g, id, size, across, el("g", { opacity: "0.5" }, down)),
    el(
      "pattern",
      { id: weave, width: fine, height: fine, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      el("rect", { width: fine / 2, height: fine, fill: "#000", opacity: "0.07" }),
    ),
  );
  out += fill(w, h, sett[0].color);
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  out += el("rect", { width: w, height: h, fill: `url(#${weave})` });
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "A soft tartan plaid of crossing stripes in several widths"
      : "A woven plaid with broad and narrow stripes crossing",
  );
  return out;
});

/** Contour lines around a few hills and hollows, like a topographic map. */
export const topography = defineKind("topography", "Topographic map", (g, w, h, note) => {
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

/** A soft mesh of colors melting into one another. */
export const gradient = defineKind("gradient", "Mesh gradient", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // Neighboring hues, soft and light, with the odd complementary accent.
  const hue = g.f(0, 360);
  const spread = g.f(30, 80);
  const sat = g.f(55, 80);
  const light = g.f(72, 84);
  const colors = [0, 1, 2, 3].map(k => hsl(hue + (k - 1.5) * (spread / 1.5), sat + g.f(-10, 10), light + g.f(-6, 6)));
  if (g.chance(0.3)) colors.push(hsl(hue + 180, sat * 0.8, light + 4));
  const blur = g.id("mesh");
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: -w * 0.5, y: -h * 0.5, width: w * 2, height: h * 2, filterUnits: "userSpaceOnUse" },
      el("feGaussianBlur", { stdDeviation: unit * g.f(0.18, 0.25) }),
    ),
  );
  out += fill(w, h, colors[0]);
  // Big blobs on a jittered grid, so color is spread across the whole frame.
  const cols = Math.max(2, Math.round((w / unit) * 2));
  const rows = Math.max(2, Math.round((h / unit) * 2));
  let blobs = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + g.f(0.1, 0.9)) / cols) * w;
      const y = ((r + g.f(0.1, 0.9)) / rows) * h;
      const rx = unit * g.f(0.3, 0.5);
      blobs += el("ellipse", {
        cx: x,
        cy: y,
        rx,
        ry: rx * g.f(0.6, 1),
        fill: g.pick(colors.slice(1)),
        opacity: String(g.f(0.6, 0.95).toFixed(2)),
      });
    }
  }
  out += el("g", { filter: `url(#${blur})` }, blobs);
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "A soft mesh gradient of colors melting into each other"
      : "Soft blended washes of color with no hard edges",
  );
  return out;
});
