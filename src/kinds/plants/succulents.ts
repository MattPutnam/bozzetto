import { defineKind, el, hsl, n, pts, type Rand, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";
import { andList, capitalize, numberWord } from "../../draw/words";

type Succulent = "echeveria" | "haworthia" | "jade" | "pearls" | "aloe" | "cactus";

type SucculentPot = "terracotta" | "glazed" | "concrete" | "bowl";

const SUCCULENT_NAMES: Record<Succulent, string> = {
  echeveria: "an echeveria",
  haworthia: "a haworthia",
  jade: "a jade plant",
  pearls: "string of pearls",
  aloe: "an aloe",
  cactus: "a round cactus",
};

/** Shuffles a copy of `items`. */
function shuffled<T>(g: Rand, items: readonly T[]): T[] {
  const out = [...items];
  for (let k = out.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

/** Compact path data: commands as given, numbers rounded to whole pixels (tenths when small), spaced only where needed. */
function pathData(...items: (string | number)[]): string {
  let out = "";
  let number = false;
  for (const item of items) {
    if (typeof item === "number") {
      const v = Math.abs(item) < 10 ? n(item) : Math.round(item);
      out += (number && v >= 0 ? " " : "") + v;
      number = true;
    } else {
      out += item;
      number = false;
    }
  }
  return out;
}

/** An echeveria: rings of fleshy pointed leaves, seen a little from above. */
function echeveria(g: Rand, cx: number, cy: number, r: number): string {
  const hue = g.pick([150, 165, 175, 185, 300, 120]);
  const sat = g.f(18, 32);
  const light = g.f(52, 60);
  // A point at `angle` (0 is straight back) and `radius` from the heart, squashed by the view.
  const at = (angle: number, radius: number): [number, number] => [
    cx + Math.sin(angle) * radius,
    cy - Math.cos(angle) * radius * 0.55,
  ];
  let out = "";
  [1, 0.68, 0.4].forEach((size, k) => {
    const count = [g.i(8, 10), g.i(6, 8), 5][k];
    const step = (Math.PI * 2) / count;
    const offset = g.f(0, step);
    const radius = r * size;
    // Each leaf: out from a valley along a full belly to a sharp tip, and back in.
    const parts: (string | number)[] = ["M", ...at(offset - step / 2, radius * 0.4)];
    for (let j = 0; j < count; j++) {
      const a = offset + j * step;
      parts.push("Q", ...at(a - step * 0.45, radius * 0.8), ...at(a, radius));
      parts.push("Q", ...at(a + step * 0.45, radius * 0.8), ...at(a + step / 2, radius * 0.4));
    }
    if (k > 0)
      out += el("ellipse", {
        cx,
        cy: cy + radius * 0.06,
        rx: radius * 0.92,
        ry: radius * 0.52,
        fill: "#000",
        opacity: "0.1",
      });
    out += el("path", { d: pathData(...parts, "Z"), fill: hsl(hue + g.f(-5, 5), sat, light + k * 7) });
  });
  return out + el("ellipse", { cx, cy, rx: r * 0.12, ry: r * 0.08, fill: hsl(hue, sat, light + 24) });
}

/** A haworthia: a tight fan of upright spiky leaves with pale stripes. */
function haworthia(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const hue = g.f(120, 150);
  const stripe = hsl(g.f(90, 140), 15, 88);
  const count = g.i(7, 9);
  const wd = spread * g.f(0.17, 0.21);
  // Two layers, the outer leaves behind and the middle ones in front, each striped.
  const layers = [
    { leaves: [] as (string | number)[], stripes: [] as (string | number)[] },
    { leaves: [] as (string | number)[], stripes: [] as (string | number)[] },
  ];
  for (let k = 0; k < count; k++) {
    const t = k / (count - 1) - 0.5;
    const a = t * g.f(1.4, 1.7);
    const len = height * (1 - Math.abs(t) * 0.55) * g.f(0.85, 1);
    const bx = cx + t * spread * 0.6;
    const at = (along: number, side: number): [number, number] => [
      bx + Math.sin(a) * along + Math.cos(a) * side,
      base - Math.cos(a) * along + Math.sin(a) * side,
    ];
    const layer = layers[Math.abs(t) < 0.3 ? 1 : 0];
    layer.leaves.push("M", ...at(0, -wd), "Q", ...at(len * 0.45, -wd), ...at(len, 0));
    layer.leaves.push("Q", ...at(len * 0.45, wd), ...at(0, wd), "Z");
    for (let along = len * 0.3; along < len * 0.8; along += len * 0.13) {
      const half = wd * (1 - along / len);
      const [x0, y0] = at(along, -half);
      const [x1, y1] = at(along + len * 0.02, half);
      layer.stripes.push("M", x0, y0, "l", x1 - x0, y1 - y0);
    }
  }
  let out = "";
  layers.forEach((layer, k) => {
    out += el("path", { d: pathData(...layer.leaves), fill: hsl(hue, g.f(30, 45), 26 + k * 6) });
    out += el("path", {
      d: pathData(...layer.stripes),
      stroke: stripe,
      "stroke-width": wd * 0.18,
      "stroke-linecap": "round",
      opacity: "0.8",
    });
  });
  return out;
}

/** A jade plant: a thick branching trunk with round, fleshy paddle leaves. */
function jade(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const bark = hsl(g.f(25, 60), g.f(20, 32), g.f(36, 46));
  const hue = g.f(105, 140);
  const thick = spread * 0.16;
  const stems: (string | number)[][] = [[], [], []];
  const tips: { x: number; y: number; a: number; end: boolean }[] = [];
  const grow = (x: number, y: number, a: number, len: number, depth: number) => {
    const nx = x + Math.sin(a) * len;
    const ny = y - Math.cos(a) * len;
    stems[depth].push("M", x, y, "Q", x + Math.sin(a) * len * 0.4, y - Math.cos(a) * len * 0.6, nx, ny);
    if (depth === 2) {
      tips.push({ x: nx, y: ny, a, end: true });
      return;
    }
    const branches = depth === 0 ? g.i(2, 3) : g.i(1, 2);
    for (let k = 0; k < branches; k++) {
      const t = branches === 1 ? g.f(-0.5, 0.5) : k / (branches - 1) - 0.5;
      grow(nx, ny, a * 0.5 + t * g.f(1.1, 1.5), len * g.f(0.7, 0.85), depth + 1);
    }
    // A pair of leaves along the way
    if (depth > 0) tips.push({ x: (x + nx) / 2, y: (y + ny) / 2, a, end: false });
  };
  grow(cx + g.f(-0.1, 0.1) * spread, base, g.f(-0.15, 0.15), height * 0.26, 0);
  let out = "";
  stems.forEach((d, k) => {
    if (d.length)
      out += el("path", {
        d: pathData(...d),
        stroke: bark,
        "stroke-width": thick * (1 - k * 0.28),
        "stroke-linecap": "round",
        fill: "none",
      });
  });
  // Leaves as ellipses drawn with two arcs, in two shades
  const leaf = spread * g.f(0.27, 0.31);
  const shades: (string | number)[][] = [[], []];
  for (const tip of tips)
    for (const turn of tip.end ? [-0.9, 0, 0.9] : [-1.3, 1.3]) {
      const a = tip.a + turn + g.f(-0.15, 0.15);
      const dx = Math.sin(a) * leaf * 0.85;
      const dy = -Math.cos(a) * leaf * 0.85;
      const x = tip.x + dx * 0.9;
      const y = tip.y + dy * 0.9;
      const tilt = (Math.atan2(dy, dx) * 180) / Math.PI;
      const arc = ["A", leaf * 0.85, leaf * 0.55, tilt, 0, 1];
      shades[g.i(0, 1)].push("M", x - dx, y - dy, ...arc, x + dx, y + dy, ...arc, x - dx, y - dy);
    }
  shades.forEach((d, k) => {
    if (d.length)
      out += el("path", {
        d: pathData(...d),
        fill: hsl(hue + k * 6, g.f(38, 50), 36 + k * 6),
      });
  });
  return out;
}

/** A ball cactus: a round, ribbed body dotted with spines, sometimes with a flower. */
function ballCactus(g: Rand, cx: number, cy: number, r: number): string {
  const green = hsl(g.f(95, 140), g.f(30, 45), g.f(36, 46));
  let out = el("ellipse", { cx, cy, rx: r, ry: r * 0.92, fill: green });
  const ribs: (string | number)[] = [];
  for (let k = -2; k <= 2; k++) {
    const x = Math.sin(k * 0.55) * r;
    ribs.push("M", cx, cy - r * 0.92, "Q", cx + x * 1.3, cy, cx + x * 0.6, cy + r * 0.85);
  }
  const d = pathData(...ribs);
  out += el("path", { d, stroke: "#000", "stroke-opacity": "0.15", "stroke-width": r * 0.05, fill: "none" });
  // Spines: dots along the ribs, from a dashed stroke
  out += el("path", {
    d,
    stroke: "#f6f1e4",
    "stroke-width": r * 0.1,
    "stroke-linecap": "round",
    "stroke-dasharray": s`0 ${r * 0.24}`,
    "stroke-dashoffset": -r * 0.12,
    fill: "none",
  });
  out += el("ellipse", {
    cx: cx - r * 0.4,
    cy: cy - r * 0.35,
    rx: r * 0.18,
    ry: r * 0.3,
    fill: "#ffffff",
    opacity: "0.15",
  });
  if (g.chance(0.4))
    out += el("path", {
      d: blob(g, cx, cy - r * 0.92, r * 0.3, r * 0.2, 5, 0.3, 0.03),
      fill: hsl(g.f(320, 400), 75, 66),
    });
  return out;
}

/** An aloe: a rosette of long, tapering spears with toothed edges. */
function aloe(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const hue = g.f(95, 150);
  const count = g.i(6, 8);
  const order = Array.from({ length: count }, (_, k) => k).sort(
    (a, b) => Math.abs(b - (count - 1) / 2) - Math.abs(a - (count - 1) / 2),
  );
  let out = "";
  for (const k of order) {
    const t = k / (count - 1) - 0.5;
    const a = t * g.f(1.7, 2.1);
    const len = height * (1 - Math.abs(t) * 0.45) * g.f(0.85, 1);
    const wd = spread * g.f(0.15, 0.19);
    const bend = t * len * 0.35;
    const bx = cx + t * spread * 0.4;
    const at = (u: number, side: number): [number, number] => [
      bx + Math.sin(a) * len * u + Math.cos(a) * (side + bend * u * u),
      base - Math.cos(a) * len * u + Math.sin(a) * (side + bend * u * u),
    ];
    const steps = 7;
    const left: (string | number)[] = [];
    const right: (string | number)[] = [];
    for (let j = 0; j <= steps; j++) {
      const u = j / steps;
      // Every other edge point pokes out a little: the teeth.
      const half = wd * Math.pow(1 - u, 0.8) + (j % 2 && j < steps ? wd * 0.2 : 0);
      left.push(...at(u, -half));
      if (j < steps) right.unshift(...at(u, half));
    }
    out += el("path", {
      d: pathData("M", ...left, "L", ...right, "Z"),
      fill: hsl(hue + g.f(-6, 6), g.f(25, 40), g.f(38, 50)),
    });
  }
  return out;
}

/** String of pearls: a mound of beads with strands trailing over the pot's rim. */
function pearls(g: Rand, cx: number, rimY: number, potW: number, drop: number): string {
  const hue = g.f(90, 125);
  const bead = potW * g.f(0.11, 0.13);
  // Beads are the dots of a dashed stroke: rows over the mound, then the strands.
  const rows: (string | number)[] = [];
  for (let row = 0; row < 3; row++) {
    const half = potW * (1 - row * 0.28);
    const y = rimY - bead * (0.6 + row * 1.5);
    rows.push("M", cx - half, y, "Q", cx, y - bead * (2.4 - row * 0.5), cx + half, y);
  }
  const vines: (string | number)[] = [];
  const strands = g.i(3, 5);
  for (let k = 0; k < strands; k++) {
    const u = (k / (strands - 1) - 0.5) * 2;
    const x0 = cx + u * potW * g.f(0.8, 1.02);
    const len = drop * g.f(0.55, 1);
    const lean = u * potW * 0.18;
    const sway = g.f(-1, 1) * bead * 1.5;
    vines.push("M", x0, rimY - bead, "Q", x0 + lean + sway, rimY + len * 0.5, x0 + lean, rimY + len);
  }
  const strings = pathData(...vines);
  const beads = {
    "stroke-width": bead * 2,
    "stroke-linecap": "round",
    "stroke-dasharray": s`0 ${bead * 2.05}`,
    fill: "none",
  } as const;
  return (
    el("path", { d: strings, stroke: hsl(hue, 35, 30), "stroke-width": bead * 0.3, fill: "none" }) +
    el("path", { d: pathData(...rows), stroke: hsl(hue, g.f(35, 45), g.f(40, 46)), ...beads }) +
    el("path", { d: strings, stroke: hsl(hue, g.f(40, 50), g.f(46, 52)), ...beads })
  );
}

/** A color and a lighter version of it, for a pot and its rim. */
const tones = (hue: number, sat: number, light: number): [string, string] => [
  hsl(hue, sat, light),
  hsl(hue, sat, Math.min(96, light + 9)),
];

/** A pot of the given style, with its shadow, standing at `cx` on `base`. */
function succulentPot(
  g: Rand,
  style: SucculentPot,
  cx: number,
  base: number,
  pw: number,
  ph: number,
  unit: number,
): string {
  const rimY = base - ph;
  let out = el("ellipse", { cx, cy: base, rx: pw * 1.2, ry: unit * 0.014, fill: "#000", opacity: "0.14" });
  if (style === "terracotta") {
    const [clay, clayLight] = tones(g.f(12, 24), g.f(48, 60), g.f(46, 58));
    out += el("polygon", {
      points: pts([
        [cx - pw, rimY],
        [cx + pw, rimY],
        [cx + pw * 0.76, base],
        [cx - pw * 0.76, base],
      ]),
      fill: clay,
    });
    out += el("rect", {
      x: cx - pw * 1.08,
      y: rimY - ph * 0.04,
      width: pw * 2.16,
      height: ph * 0.24,
      rx: unit * 0.005,
      fill: clayLight,
    });
  } else if (style === "glazed") {
    const [glaze, glazeLight] = g.chance(0.3)
      ? tones(g.f(30, 50), g.f(20, 40), g.f(84, 90))
      : tones(g.f(170, 430) % 360, g.f(25, 42), g.f(45, 62));
    out += el("path", {
      d: s`M ${cx - pw} ${rimY} V ${base - ph * 0.3} Q ${cx - pw} ${base} ${cx - pw * 0.7} ${base}
           H ${cx + pw * 0.7} Q ${cx + pw} ${base} ${cx + pw} ${base - ph * 0.3} V ${rimY} Z`,
      fill: glaze,
    });
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph * 0.08, fill: glazeLight });
    out += el("rect", {
      x: cx - pw * 0.62,
      y: rimY + ph * 0.2,
      width: pw * 0.16,
      height: ph * 0.5,
      rx: pw * 0.08,
      fill: "#ffffff",
      opacity: "0.22",
    });
  } else if (style === "concrete") {
    const [grey, greyLight] = tones(g.f(25, 60), g.f(3, 8), g.f(62, 74));
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph, rx: unit * 0.004, fill: grey });
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph * 0.1, fill: greyLight });
    const dots: (string | number)[] = [];
    for (let k = 0; k < 6; k++) dots.push("M", cx + g.f(-0.85, 0.85) * pw, rimY + g.f(0.2, 0.9) * ph, "h0");
    out += el("path", {
      d: pathData(...dots),
      stroke: "#000",
      "stroke-width": unit * 0.006,
      "stroke-linecap": "round",
      opacity: "0.18",
    });
  } else {
    const [glaze, glazeLight] = g.chance(0.4)
      ? tones(g.f(20, 45), g.f(15, 35), g.f(82, 88))
      : tones(g.f(170, 430) % 360, g.f(25, 45), g.f(45, 65));
    out += el("path", {
      d: s`M ${cx - pw} ${rimY}
           C ${cx - pw} ${base - ph * 0.1} ${cx - pw * 0.7} ${base} ${cx - pw * 0.45} ${base}
           H ${cx + pw * 0.45}
           C ${cx + pw * 0.7} ${base} ${cx + pw} ${base - ph * 0.1} ${cx + pw} ${rimY} Z`,
      fill: glaze,
    });
    out += el("rect", {
      x: cx - pw,
      y: rimY - ph * 0.04,
      width: pw * 2,
      height: ph * 0.12,
      rx: ph * 0.06,
      fill: glazeLight,
    });
  }
  return out;
}

/** Two to four potted succulents side by side on a table or windowsill. */
export const succulents = /* @__PURE__ */ defineKind("succulents", "Succulents", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.78, 0.84);
  const base = top + unit * g.f(0.035, 0.05);
  const sill = g.chance(0.5);
  const wall = hsl(g.f(0, 360), g.f(12, 30), g.f(84, 92));
  let out = sill
    ? table(g, w, h, top, wall, hsl(g.f(30, 50), g.f(10, 25), g.f(86, 93)))
    : table(g, w, h, top, wall, hsl(g.f(18, 40), g.f(20, 35), g.f(46, 62)));
  if (sill) {
    // A window behind the sill
    const x0 = w * 0.07;
    const x1 = w * 0.93;
    const y0 = h * 0.07;
    const bar = unit * 0.028;
    const frame = hsl(g.f(30, 50), g.f(5, 15), g.f(92, 97));
    const glass = hsl(g.f(190, 215), g.f(40, 60), g.f(80, 88));
    const panes = w > h * 2 ? 3 : 2;
    const split = y0 + (top - y0) * g.f(0.35, 0.45);
    // Glass inside a frame, crossed by glazing bars
    out += el("rect", {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: top - y0,
      fill: glass,
      stroke: frame,
      "stroke-width": bar * 2,
    });
    const bars: (string | number)[] = ["M", x0, split, "H", x1];
    for (let k = 1; k < panes; k++) bars.push("M", x0 + ((x1 - x0) * k) / panes, y0, "V", top);
    out += el("path", { d: pathData(...bars), stroke: frame, "stroke-width": bar });
    out += el("rect", { y: top - unit * 0.012, width: w, height: unit * 0.024, fill: "#000", opacity: "0.06" });
  }
  // How many pots fit: fewer when narrow.
  const aspect = w / h;
  const count = aspect < 0.9 ? 2 : aspect < 1.1 ? g.i(2, 3) : aspect < 2 ? (g.chance(0.75) ? 3 : 2) : g.i(3, 4);
  const plants = shuffled(g, ["echeveria", "haworthia", "jade", "pearls", "aloe", "cactus"] as const).slice(0, count);
  const styles = shuffled(g, ["terracotta", "glazed", "concrete", "bowl", "terracotta", "glazed"] as const);
  const items = plants.map((plant: Succulent, k) => {
    let style: SucculentPot = styles[k];
    // Tall or trailing plants need a proper pot, not a shallow bowl.
    if (style === "bowl" && (plant === "jade" || plant === "pearls" || plant === "aloe")) style = "glazed";
    const bowl = style === "bowl";
    const pw = unit * g.f(0.13, 0.155) * (bowl ? 1.25 : 1);
    const ph = unit * (plant === "pearls" ? g.f(0.17, 0.21) : g.f(0.12, 0.19)) * (bowl ? 0.45 : 1);
    const size = g.f(0.9, 1.1);
    const reach = { echeveria: 1.35, haworthia: 1.15, jade: 1.8, pearls: 1.15, aloe: 1.9, cactus: 1 }[plant] * size;
    return { plant, style, pw, ph, size, reach, half: 0 };
  });
  // Fit the group across the width.
  const gap = unit * g.f(0.03, 0.06);
  for (const it of items) it.half = Math.max(it.pw * 1.1, it.pw * it.reach);
  const total = items.reduce((sum, it) => sum + it.half * 2, 0) + gap * (count - 1);
  const fit = Math.min(1, (w * 0.86) / total);
  let x = w / 2 - (total * fit) / 2 + w * g.f(-0.03, 0.03) * fit;
  let tallest = base;
  for (const it of items) {
    const pw = it.pw * fit;
    const ph = it.ph * fit;
    const half = it.half * fit;
    const cx = x + half;
    x += half * 2 + gap * fit;
    const rimY = base - ph;
    const grow = (it.style === "bowl" ? pw / 1.25 : pw) * it.size;
    let back = "";
    let front = "";
    if (it.plant === "echeveria") {
      const r = grow * 1.3;
      front = echeveria(g, cx, rimY - r * 0.12, r);
      tallest = Math.min(tallest, rimY - r * 0.7);
    } else if (it.plant === "haworthia") {
      const hh = grow * g.f(1.5, 2);
      back = haworthia(g, cx, rimY + ph * 0.1, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "jade") {
      const hh = grow * g.f(2.3, 3);
      back = jade(g, cx, rimY + ph * 0.1, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "aloe") {
      const hh = grow * g.f(2.2, 2.8);
      back = aloe(g, cx, rimY + ph * 0.15, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "pearls") {
      front = pearls(g, cx, rimY + ph * 0.05, pw, ph * 0.85);
      tallest = Math.min(tallest, rimY - pw * 0.5);
    } else {
      const r = grow * 0.85;
      back = ballCactus(g, cx, rimY - r * 0.55, r);
      tallest = Math.min(tallest, rimY - r * 1.5);
    }
    out += back + succulentPot(g, it.style, cx, base, pw, ph, unit) + front;
  }
  const names = andList(plants.map(plant => SUCCULENT_NAMES[plant]));
  note.alt(`${capitalize(numberWord(count))} potted succulents: ${names}, on a ${sill ? "windowsill" : "table"}`);
  note.focus(w / 2, (tallest + base) / 2);
  return out;
});
