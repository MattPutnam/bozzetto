/** Helpers shared by several sports kinds. */
import { el, hash, hex, mix, type Point, type Rand, s } from "../../draw/core";
import { andList } from "../../draw/words";

/** A rectangle between two corners given in any order. */
export function box(x1: number, y1: number, x2: number, y2: number, attrs: Record<string, string | number>): string {
  return el("rect", {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    ...attrs,
  });
}

export const WALLS = ["plaster", "brick", "wood", "concrete"] as const;

export type Wall = (typeof WALLS)[number];

/** A plain wall filling the picture, with a little texture. Returns the markup and what to call it. */
export function wall(g: Rand, type: Wall, w: number, h: number): { out: string; name: string } {
  const big = Math.max(w, h);
  const unit = Math.min(w, h);
  if (type === "brick") {
    const painted = g.chance(0.4);
    const hue = painted ? g.f(0, 360) : g.f(6, 22);
    const face = painted ? hex(hue, g.f(8, 25), g.f(80, 88)) : hex(hue, g.f(38, 50), g.f(44, 52));
    const mortar = painted ? mix(face, "#000000", 0.08) : hex(30, 12, 74);
    const bh = big * g.f(0.03, 0.04);
    const bw = bh * g.f(2.4, 2.8);
    const joint = bh * 0.14;
    const x0 = -g.f(0, bw);
    let out = el("rect", { width: w, height: h, fill: face });
    // A few bricks a shade off.
    let dark = "";
    let light = "";
    for (let k = g.i(8, 14); k > 0; k--) {
      const row = g.i(0, Math.ceil(h / bh));
      const x = x0 + g.i(0, Math.ceil(w / bw)) * bw - (row % 2) * (bw / 2);
      const d = s`M${x} ${row * bh}h${bw}v${bh}h${-bw}Z`;
      if (g.chance(0.5)) dark += d;
      else light += d;
    }
    out +=
      el("path", { d: dark, fill: "#000", opacity: "0.07" }) + el("path", { d: light, fill: "#fff", opacity: "0.08" });
    // The mortar, as a tile two courses tall: bed joints along both, and a head joint in each.
    const id = g.id("brick");
    out += el(
      "defs",
      {},
      el(
        "pattern",
        { id, patternUnits: "userSpaceOnUse", x: x0, width: bw, height: bh * 2 },
        el("path", {
          d: s`M0 0H${bw}M0 ${bh}H${bw}M0 ${bh * 2}H${bw}M0 0V${bh}M${bw / 2} ${bh}V${bh * 2}M${bw} 0V${bh}`,
          stroke: mortar,
          "stroke-width": joint,
        }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: `url(#${id})`, opacity: painted ? 0.7 : 0.85 });
    return { out, name: painted ? "painted brick wall" : "brick wall" };
  }
  if (type === "wood") {
    const painted = g.chance(0.3);
    const face = painted ? hex(g.f(0, 360), g.f(12, 28), g.f(76, 86)) : hex(g.f(24, 40), g.f(28, 45), g.f(56, 70));
    const upright = g.chance(0.6);
    const across = upright ? w : h;
    const pw = big * g.f(0.05, 0.075);
    let out = el("rect", { width: w, height: h, fill: face });
    let tone = "";
    let seams = "";
    for (let k = 0; k * pw < across; k++) {
      const a = k * pw;
      if (g.chance(0.45)) tone += upright ? s`M${a} 0h${pw}V${h}h${-pw}Z` : s`M0 ${a}v${pw}H${w}v${-pw}Z`;
      if (k) seams += upright ? s`M${a} 0V${h}` : s`M0 ${a}H${w}`;
    }
    out += el("path", { d: tone, fill: "#000", opacity: "0.05" });
    out += el("path", { d: seams, stroke: "#000", opacity: 0.16, "stroke-width": Math.max(1, unit * 0.005) });
    return { out, name: painted ? "painted wooden wall" : "wooden wall" };
  }
  if (type === "concrete") {
    const face = hex(g.f(20, 215), g.f(3, 9), g.f(70, 80));
    let out = el("rect", { width: w, height: h, fill: face });
    for (let k = 0; k < 3; k++)
      out += el("ellipse", {
        cx: w * g.f(0, 1),
        cy: h * g.f(0, 1),
        rx: big * g.f(0.15, 0.3),
        ry: unit * g.f(0.1, 0.25),
        fill: g.chance(0.5) ? "#000" : "#fff",
        opacity: "0.04",
      });
    // Form panels, with two rows of tie holes in each.
    const cols = Math.max(2, Math.round(w / (unit * 0.8)));
    const rows = Math.max(1, Math.round(h / (unit * 0.55)));
    const pw = w / cols;
    const ph = h / rows;
    let seams = "";
    for (let k = 1; k < cols; k++) seams += s`M${k * pw} 0V${h}`;
    for (let k = 1; k < rows; k++) seams += s`M0 ${k * ph}H${w}`;
    out += el("path", { d: seams, stroke: "#000", opacity: 0.12, "stroke-width": Math.max(1, unit * 0.006) });
    let holes = "";
    for (let k = 0; k < rows; k++) for (const t of [0.25, 0.75]) holes += s`M${pw * 0.25} ${k * ph + ph * t}H${w}`;
    out += el("path", {
      d: holes,
      stroke: "#000",
      opacity: 0.16,
      "stroke-width": unit * 0.016,
      "stroke-linecap": "round",
      "stroke-dasharray": s`0 ${pw / 2}`,
    });
    return { out, name: "concrete wall" };
  }
  // Plaster: a soft wash of light from above, and a few faint patches.
  const hue = g.f(0, 360);
  const sat = g.f(12, 35);
  const light = g.f(78, 88);
  const id = g.id("wall");
  let out = el(
    "defs",
    {},
    el(
      "linearGradient",
      { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hex(hue, sat, light + 4) }),
      el("stop", { offset: 1, "stop-color": hex(hue, sat, light - 4) }),
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  for (let k = 0; k < 3; k++)
    out += el("ellipse", {
      cx: w * g.f(0, 1),
      cy: h * g.f(0, 1),
      rx: big * g.f(0.12, 0.25),
      ry: unit * g.f(0.1, 0.2),
      fill: "#fff",
      opacity: 0.1,
    });
  return { out, name: "plaster wall" };
}

/** Where the boards go: their turn (0 upright, ±90 on their sides), their length and their centers. */
export interface Layout {
  kind: "up" | "stack" | "row";
  rot: number;
  len: number;
  spots: Point[];
}

/**
 * Picks among the ways 1 to 3 boards fit the picture (upright side by side, on their sides one
 * above another, or on their sides end to end) one that fills it well. Boards are `ratio` as wide
 * as they are long, plus `extra` of that width for things that stick out, like wheels.
 */
export function arrange(
  g: Rand,
  w: number,
  h: number,
  ratio: number,
  extra: number,
  side: number,
  kinds: readonly Layout["kind"][],
  counts: readonly number[] = [1, 2, 3],
): Layout {
  const options: Layout[] = [];
  const at = (n: number, pitch: number) => Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * pitch);
  for (const n of counts) {
    const up = Math.min(h * 0.8, (w * 0.9) / (ratio * (n * (1 + extra) + (n - 1) * 0.45)));
    options.push({
      kind: "up",
      rot: 0,
      len: up,
      spots: at(n, up * ratio * (1.45 + extra)).map((dx): Point => [w / 2 + dx, h / 2]),
    });
    // On their sides, leaving room below each for its rack.
    const flat = Math.min(w * 0.86, (h * 0.8) / (ratio * (n * (1 + extra) + (n - 1) * 0.45)));
    const lift = flat * ratio * 0.12;
    options.push({
      kind: "stack",
      rot: side,
      len: flat,
      spots: at(n, flat * ratio * (1.45 + extra)).map((dy): Point => [w / 2, h / 2 - lift + dy]),
    });
    if (n > 1) {
      const row = Math.min((w * 0.9) / (n + (n - 1) * 0.08), (h * 0.7) / (ratio * (1 + extra)));
      options.push({
        kind: "row",
        rot: side,
        len: row,
        spots: at(n, row * 1.08).map((dx): Point => [w / 2 + dx, h / 2 - row * ratio * 0.12]),
      });
    }
  }
  const allowed = options.filter(o => kinds.includes(o.kind));
  const area = (o: Layout) => o.spots.length * o.len ** 2;
  const best = Math.max(...allowed.map(area));
  return g.pick(allowed.filter(o => area(o) >= best * 0.55));
}

/** A vector in the picture turned into a board's own coordinates, for a board turned by rot degrees. */
export function unturn(dx: number, dy: number, rot: number): Point {
  const a = (rot * Math.PI) / 180;
  return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
}

/** The parts of a bracket: what sits behind the board, what wraps in front of it, and its shadow. */
export interface Mount {
  back: string;
  front: string;
  shade: string;
}

/** A rack arm under a board lying on its side: its edge at x, reaching out along side, at y along it. */
export function rackArm(x: number, y: number, side: number, aw: number, paint: string): Mount {
  const shade = s`M${x - side * aw * 0.24} ${y - aw / 2}H${x + side * aw * 0.42}V${y + aw / 2}H${x - side * aw * 0.24}Z`;
  return {
    shade,
    back: "",
    // The arm's end below the board, and its padded tip turned up in front of the rail.
    front:
      box(x - side * aw * 0.05, y - aw * 0.4, x + side * aw * 0.42, y + aw * 0.4, {
        rx: aw * 0.1,
        fill: mix(paint, "#000000", 0.2),
      }) + box(x - side * aw * 0.24, y - aw / 2, x + side * aw * 0.12, y + aw / 2, { rx: aw * 0.12, fill: paint }),
  };
}

/** A soft shadow of `shape` on the wall: the shape drawn twice, offset by (dx, dy) and a little further. */
export function softShadow(g: Rand, shape: string, dx: number, dy: number): string {
  // The id comes from the shape (less the picture's id prefix, which fixed options change), so boards
  // with the same shadow give the same markup and can share it.
  const id = g.id(`shade${hash(shape.replaceAll(g.id(""), "")).toString(36)}`);
  const layer = (f: number, opacity: number) =>
    el("use", { href: `#${id}`, fill: "#000", opacity, transform: s`translate(${dx * f} ${dy * f})` });
  return el("defs", {}, el("g", { id }, shape)) + layer(1.8, 0.1) + layer(1, 0.14);
}

/** Names each graphic once, in the plural when more than one board has it: "flames and a checkerboard". */
export function graphics<T extends string>(styles: readonly T[], words: Record<T, [string, string]>): string {
  const unique = [...new Set(styles)];
  return andList(unique.map(st => words[st][styles.filter(x => x === st).length > 1 ? 1 : 0]));
}

/** Writes markup in full the first time it's seen and as a `<use>` of it after that, for parts boards share. */
export function sharer(g: Rand, name: string): (markup: string) => string {
  const seen = new Map<string, string>();
  return markup => {
    const id = seen.get(markup);
    if (id) return el("use", { href: `#${id}` });
    const fresh = g.id(`${name}${seen.size}`);
    seen.set(markup, fresh);
    return el("g", { id: fresh }, markup);
  };
}

export const MOUNT_PAINTS = ["#b9bec4", "#2e2f35", "#a87b4f", "#e9e6df", "#c9a46a"];

/** A board's colors: a ground, two accents, and a light and a dark for details. */
export interface Pal {
  base: string;
  a: string;
  b: string;
  light: string;
  ink: string;
}

export function palette(g: Rand, hue: number): Pal {
  const sat = g.f(50, 72);
  const turn = g.pick([30, 150, 180, 120, -40]);
  const c1 = hex(hue, sat, g.f(48, 60));
  const c2 = hex(hue + turn, sat, g.f(55, 66));
  const c3 = hex(hue - 25, sat - 8, g.f(30, 40));
  const light = g.pick(["#f5efe2", "#fbf7ee", hex(hue + turn, 55, 88)]);
  const ink = g.pick(["#2a2930", hex(hue + 190, 28, 20)]);
  const [base, a, b] = g.pick([
    [c1, c2, light],
    [light, c1, c2],
    [ink, c1, c2],
    [c3, c2, light],
    [c1, light, ink],
    [c2, c3, light],
  ]);
  return { base, a, b, light, ink };
}

export const darker = (c: string, t: number): string => mix(c, "#000000", t);

export const lighter = (c: string, t: number): string => mix(c, "#ffffff", t);

/** A transform placing design units at (x, y), scaled and turned; mirrored left to right when flip. */
export const place = (x: number, y: number, k: number, turn = 0, flip = false): string =>
  `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(1)}) scale(${(flip ? -k : k).toFixed(4)} ${k.toFixed(4)})`;

/** A circle in path data, so several can share one element. */
export const dot = (x: number, y: number, r: number): string =>
  s`M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Something to lay out: its center and a radius that holds it, in design units. */
export interface Spot {
  x: number;
  y: number;
  r: number;
}

/** Scales and centers a set of spots to fill the picture, leaving a margin. */
export function fit(spots: readonly Spot[], w: number, h: number, margin: number) {
  const x0 = Math.min(...spots.map(p => p.x - p.r));
  const x1 = Math.max(...spots.map(p => p.x + p.r));
  const y0 = Math.min(...spots.map(p => p.y - p.r));
  const y1 = Math.max(...spots.map(p => p.y + p.r));
  const k = Math.min((w - margin * 2) / (x1 - x0), (h - margin * 2) / (y1 - y0));
  const at = (x: number, y: number): Point => [w / 2 + (x - (x0 + x1) / 2) * k, h / 2 + (y - (y0 + y1) / 2) * k];
  return { k, at };
}
