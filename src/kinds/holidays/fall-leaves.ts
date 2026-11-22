import { defineKind, el, hex, lin, type Point, type Rand, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { compact, place } from "./shared";

/** A closed polygon as path data. */
const poly = (points: readonly Point[]): string => "M" + points.map(([x, y]) => s`${x} ${y}`).join("L") + "Z";

/** A right half outline mirrored into a whole one, from the tip round to the base and back. */
const mirrored = (half: readonly Point[]): Point[] => [
  ...half,
  ...half
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Point => [-x, y]),
];

/**
 * Scattered spots for things of the given radii, biggest first: each spot is the best of a few
 * random tries, the one farthest from what's already there, so the scatter fills evenly.
 */
function scatter(g: Rand, w: number, h: number, radii: readonly number[], margin: number): Point[] {
  const placed: [number, number, number][] = [];
  return radii.map(r => {
    let best: [number, number] = [w / 2, h / 2];
    let score = -Infinity;
    for (let k = 0; k < 14; k++) {
      const x = g.f(Math.min(r * margin, w / 2), Math.max(w - r * margin, w / 2));
      const y = g.f(Math.min(r * margin, h / 2), Math.max(h - r * margin, h / 2));
      const room = Math.min(1e9, ...placed.map(([px, py, pr]) => Math.hypot(px - x, py - y) / (pr + r)));
      if (room > score) {
        score = room;
        best = [x, y];
      }
    }
    placed.push([best[0], best[1], r]);
    return best;
  });
}

/*
 * Leaves are drawn about 100 units long, pointing up: the tip near y = -50, the blade's base near
 * y = 30 and the end of the stem below it. Each has a blade (with its stem), a lit half and veins.
 */

type Leaf = { blade: string; half: string; veins: string };

/** A maple leaf: five pointed, toothed lobes and veins fanning out from the stem. */
function maple(): Leaf {
  const half: Point[] = [
    [0, -50],
    [4, -39],
    [9, -42],
    [8, -29],
    [11, -16],
    [23, -27],
    [25, -35],
    [31, -30],
    [46, -32],
    [38, -21],
    [43, -15],
    [30, -7],
    [20, 2],
    [30, 9],
    [37, 20],
    [25, 17],
    [17, 24],
    [7, 26],
    [0, 23],
  ];
  return {
    blade: poly(mirrored(half)) + "M-1.2 22Q0 40 3 56L5 55Q2 40 1.6 22Z",
    half: poly([...half, [1, 23]]),
    veins:
      "M2 54Q1 38 0 23L0 -46M0 23L40 -30M0 23L33 18M0 23L-40 -30M0 23L-33 18" +
      "M0 -18L8 -33M0 -18L-8 -33M17 -8L24 -24M-17 -8L-24 -24",
  };
}

/** An oak leaf: a long blade with rounded lobes down each side of the midrib. */
function oak(): Leaf {
  const half: Point[] = [
    [0, -52],
    [14, -47],
    [8, -36],
    [25, -32],
    [11, -20],
    [32, -15],
    [12, -3],
    [31, 6],
    [11, 15],
    [21, 26],
    [5, 30],
    [0, 33],
  ];
  const ring = mirrored(half);
  return {
    blade: smoothClosed(ring) + "M-1.2 30Q0 44 2 56L4 55Q2 44 1.6 30Z",
    half: smoothClosed([...half, [0, 33]]),
    veins:
      "M3 55Q1 44 0 31L0 -44M0 -33L19 -38M0 -20L26 -27M0 -5L27 -11M0 10L26 6M0 -33L-19 -38M0 -20L-26 -27M0 -5L-27 -11M0 10L-26 6",
  };
}

/** A birch or elm leaf: a toothed birchLeaf with a pointed tip and straight veins in pairs. */
function birchLeaf(): Leaf {
  const half: Point[] = [];
  const steps = 16;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const y = -50 + t * 80;
    // Widest a little below the middle, pointed at the tip and rounded at the base.
    const width = 27 * Math.sin(Math.PI * t ** 0.85) ** 0.8;
    half.push([width + (k % 2 && k < steps ? 2.2 : 0), y]);
  }
  half[0] = [0, -50];
  half[steps] = [0, 30];
  return {
    blade: poly(mirrored(half)) + "M-1.2 28Q0 40 2.5 54L4.5 53Q2 40 1.6 28Z",
    half: poly(half),
    veins:
      "M3 53Q1 40 0 29L0 -45" +
      [-32, -20, -8, 4, 15]
        .map(y => s`M0 ${y}L${y < -25 ? 12 : 20} ${y - 11}M0 ${y}L${y < -25 ? -12 : -20} ${y - 11}`)
        .join(""),
  };
}

/** A ginkgo leaf: a broad fan with a notch in the middle of its edge, and fine veins spreading from the stem. */
function ginkgo(): Leaf {
  const right = "L2 -31Q6 -37 15 -35Q36 -30 39 -6Q16 4 0 16";
  let veins = "M3 56Q1 38 0 16";
  for (const a of [-50, -36, -22, -9, 9, 22, 36, 50]) {
    const rad = ((a - 90) * Math.PI) / 180;
    veins += s`M0 16L${Math.cos(rad) * 44} ${16 + Math.sin(rad) * 44}`;
  }
  return {
    blade: "M0 16Q-16 4 -39 -6Q-36 -30 -15 -35Q-6 -37 -2 -31L0 -25" + right + "ZM-1 14Q0 36 2 56L4 55Q2 36 1.4 14Z",
    half: "M0 16L0 -25" + right + "Z",
    veins,
  };
}

const SPECIES = {
  maple: { draw: maple, name: "maple", id: "m" },
  oak: { draw: oak, name: "oak", id: "o" },
  birch: { draw: birchLeaf, name: "birch", id: "r" },
  ginkgo: { draw: ginkgo, name: "ginkgo", id: "k" },
} as const;

type Species = keyof typeof SPECIES;

/** Fall colors as hue, saturation and lightness, by name. */
const FALL: Record<string, [number, number, number]> = {
  red: [4, 70, 44],
  crimson: [352, 62, 36],
  orange: [22, 82, 50],
  amber: [34, 85, 50],
  gold: [44, 85, 52],
  yellow: [50, 82, 58],
  rust: [16, 60, 36],
  tan: [32, 45, 44],
  brown: [24, 42, 30],
  green: [78, 42, 40],
};

const MOODS: readonly (readonly string[])[] = [
  ["red", "orange", "gold", "rust", "brown", "green"],
  ["red", "crimson", "orange", "amber", "gold"],
  ["gold", "yellow", "amber", "tan", "green", "orange"],
  ["rust", "brown", "tan", "orange", "amber", "red"],
];

/** The surface the leaves have fallen on, and how to say it. */
function ground(g: Rand, w: number, h: number, unit: number, id: string): [string, string, boolean] {
  const kind = g.pick(["deck", "deck", "grass", "pavement", "soil"] as const);
  if (kind === "deck") {
    // Weathered boards, all one way, with gaps between and staggered butt joints.
    const across = g.chance(0.6);
    const hue = g.f(22, 38);
    const sat = g.f(8, 26);
    const light = g.f(46, 62);
    const span = across ? h : w;
    const long = across ? w : h;
    const count = Math.max(3, Math.round(span / (unit * g.f(0.17, 0.23))));
    const board = span / count;
    let out = el("rect", { width: w, height: h, fill: hex(hue, sat, light) });
    let gaps = "";
    let grain = "";
    const shades: Record<string, string> = {};
    for (let k = 0; k < count; k++) {
      const a = k * board;
      // Each board a little lighter or darker than its neighbours.
      const tone = hex(hue + g.f(-4, 4), sat + g.f(-4, 4), light + g.f(-6, 5));
      shades[tone] =
        (shades[tone] ?? "") + (across ? s`M0 ${a}h${w}v${board}h${-w}Z` : s`M${a} 0v${h}h${board}v${-h}Z`);
      if (k) gaps += across ? s`M0 ${a}h${w}` : s`M${a} 0v${h}`;
      // A joint somewhere along most boards.
      if (g.chance(0.6)) {
        const at = long * g.f(0.15, 0.85);
        gaps += across ? s`M${at} ${a}v${board}` : s`M${a} ${at}h${board}`;
      }
      // A grain line.
      for (let j = 0; j < 1; j++) {
        const off = a + board * g.f(0.2, 0.8);
        const start = long * g.f(-0.1, 0.5);
        const len = long * g.f(0.3, 0.7);
        grain += across ? s`M${start} ${off}h${len}` : s`M${off} ${start}v${len}`;
      }
    }
    out += Object.entries(shades)
      .map(([fill, d]) => el("path", { d, fill }))
      .join("");
    out += el("path", {
      d: grain,
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": Math.max(1, unit * 0.004),
      fill: "none",
    });
    out += el("path", {
      d: gaps,
      stroke: hex(hue, sat, light * 0.35),
      "stroke-width": Math.max(1.5, unit * 0.012),
      fill: "none",
    });
    return [
      out.replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v)),
      "a weathered wooden deck",
      false,
    ];
  }
  // The other grounds are a flat color with a fine repeating texture.
  const q = unit * 0.09;
  let base: string;
  let marks: string;
  let where: string;
  let dark = true;
  if (kind === "grass") {
    base = hex(g.f(85, 110), g.f(28, 42), g.f(32, 40));
    const blades: string[] = [];
    for (let k = 0; k < 9; k++) {
      const x = g.f(0, q);
      const y = g.f(0, q);
      blades.push(s`M${x} ${y}l${g.f(-0.08, 0.08) * q} ${-q * g.f(0.18, 0.3)}`);
    }
    marks =
      el("path", {
        d: blades.slice(0, 5).join(""),
        stroke: "#fff",
        "stroke-opacity": "0.14",
        "stroke-width": q * 0.035,
        "stroke-linecap": "round",
      }) +
      el("path", {
        d: blades.slice(5).join(""),
        stroke: "#000",
        "stroke-opacity": "0.14",
        "stroke-width": q * 0.035,
        "stroke-linecap": "round",
      });
    where = "the grass";
    dark = false;
  } else {
    base =
      kind === "pavement" ? hex(g.f(200, 230), g.f(4, 10), g.f(24, 32)) : hex(g.f(18, 30), g.f(20, 32), g.f(16, 22));
    const specks: string[] = [];
    for (let k = 0; k < 7; k++) specks.push(s`M${g.f(0, q)} ${g.f(0, q)}h0`);
    marks =
      el("path", {
        d: specks.slice(0, 4).join(""),
        stroke: "#fff",
        "stroke-opacity": "0.12",
        "stroke-width": q * 0.06,
        "stroke-linecap": "round",
      }) +
      el("path", {
        d: specks.slice(4).join(""),
        stroke: "#000",
        "stroke-opacity": "0.25",
        "stroke-width": q * 0.08,
        "stroke-linecap": "round",
      });
    where = kind === "pavement" ? "damp pavement" : "dark damp ground";
  }
  const pattern = el(
    "pattern",
    { id, width: q, height: q, patternUnits: "userSpaceOnUse", patternTransform: `rotate(${Math.round(g.f(0, 90))})` },
    marks,
  );
  let out = el("defs", {}, pattern) + el("rect", { width: w, height: h, fill: base });
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // A soft wet sheen across damp ground.
  if (dark) {
    const sheen = el(
      "linearGradient",
      { id: id + "s", x1: 0, y1: 0, x2: 0.4, y2: 1 },
      el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": "0.12" }),
      el("stop", { offset: 1, "stop-color": "#ffffff", "stop-opacity": "0" }),
    );
    out = el("defs", {}, sheen) + out + el("rect", { width: w, height: h, fill: `url(#${id}s)` });
  }
  return [out.replace(/-?\d+\.\d+/g, v => (Math.abs(+v) >= 2 ? String(Math.round(+v)) : v)), where, dark];
}

/**
 * Fallen autumn leaves of a few kinds, scattered and overlapping on a deck, grass or damp ground.
 *
 * @category Holidays
 */
export const fallLeaves = /* @__PURE__ */ defineKind("fall-leaves", "Fall leaves", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const [floor, where, dark] = ground(g, w, h, unit, g.id("tex"));
  let out = floor;

  // Two or three kinds of leaf, one of them the most common.
  const kinds = Object.keys(SPECIES) as Species[];
  const order = kinds.map(k => [k, g.next()] as const).sort((a, b) => a[1] - b[1]);
  const used = order.slice(0, g.i(2, 3)).map(([k]) => k);
  const weights = used.map((_, k) => (k ? g.f(0.5, 1) : 2));

  // Colors from one mood, each varied a little.
  const mood = g.pick(MOODS);
  const colors = mood.map(name => {
    const [hue, sat, light] = FALL[name];
    return hex(hue + g.f(-5, 5), sat + g.f(-8, 6), light + g.f(-5, 5));
  });
  const defs: string[] = [];
  // A couple of blends, from one color at the tip to another at the stem.
  const blends = [0, 1].map(k => {
    const id = g.id(`b${k}`);
    defs.push(lin(id, [g.pick(colors), g.pick(colors), hex(g.f(60, 85), g.f(40, 55), g.f(40, 48))]));
    return `url(#${id})`;
  });
  // Some maple leaves have dark spots: a second maple with them drawn on.
  const spotted = g.id("n");
  if (used.includes("maple"))
    defs.push(
      el(
        "g",
        { id: spotted },
        el("use", { href: `#${g.id("m")}` }),
        el("path", {
          d: "M-12 -14h0M9 -5h0M-5 4h0M15 -22h0M-20 2h0M3 -30h0",
          stroke: "#3a2414",
          "stroke-opacity": "0.45",
          "stroke-width": 3.2,
          "stroke-linecap": "round",
        }),
      ),
    );
  // Each kind's leaf drawn once, in whole units, for every leaf of that kind to reuse.
  const whole = (d: string) => d.replace(/-?\d+\.\d+/g, v => String(Math.round(+v)));
  for (const sp of used) {
    const leaf = SPECIES[sp].draw();
    defs.push(
      el(
        "g",
        { id: g.id(SPECIES[sp].id) },
        el("path", { d: whole(leaf.blade) }),
        el("path", { d: whole(leaf.half), fill: "#fff", "fill-opacity": "0.12" }),
        el("path", {
          d: whole(leaf.veins),
          fill: "none",
          stroke: "#000",
          "stroke-opacity": "0.2",
          "stroke-width": 1.4,
        }),
      ),
    );
  }
  // Soft shadows, cast by each layer of the pile onto the ground and the leaves below.
  const shadowId = g.id("sh");
  defs.push(
    el(
      "filter",
      { id: shadowId, x: -0.1, y: -0.1, width: 1.2, height: 1.2 },
      el("feDropShadow", {
        dx: unit * 0.01,
        dy: unit * 0.014,
        stdDeviation: unit * 0.006,
        "flood-color": "#000000",
        "flood-opacity": dark ? "0.45" : "0.3",
      }),
    ),
  );

  // Enough leaves to cover most of the ground. Long frames get bigger leaves rather than
  // proportionally more of them, to keep the markup small.
  const pile = g.chance(0.5);
  const ratio = (w * h) / (unit * unit);
  const count = Math.round(ratio ** 0.3 * g.f(pile ? 17 : 11, pile ? 20 : 13));
  const sizes = Array.from({ length: count }, () => unit * ratio ** 0.2 * g.f(0.32, 0.52)).sort((a, b) => b - a);
  const spots = scatter(
    g,
    w,
    h,
    sizes.map(size => size * 0.4),
    0.3,
  );
  const leaves: string[] = [];
  const tally: Record<string, number> = {};
  for (let k = 0; k < count; k++) {
    // Pick a kind by weight.
    let roll = g.f(
      0,
      weights.reduce((a, b) => a + b),
    );
    let at = 0;
    while (roll > weights[at] && at < used.length - 1) roll -= weights[at++];
    const sp = used[at];
    tally[sp] = (tally[sp] ?? 0) + 1;
    const id = sp === "maple" && g.chance(0.25) ? spotted : g.id(SPECIES[sp].id);
    const [x, y] = spots[k];
    const turn = g.f(0, 360);
    // Ginkgo fans are smaller than the rest.
    const scale = (sizes[k] / 100) * (sp === "ginkgo" ? 0.8 : 1);
    const paint = g.chance(0.22) ? g.pick(blends) : g.pick(colors);
    leaves.push(el("use", { href: `#${id}`, fill: paint, transform: place(x, y, turn, scale) }));
  }
  // Smallest drawn first, so the big ones lie on top, in three layers each casting a shadow.
  leaves.reverse();
  for (let k = 0; k < 3; k++)
    out += el(
      "g",
      { filter: `url(#${shadowId})` },
      ...leaves.slice(Math.round((k * count) / 3), Math.round(((k + 1) * count) / 3)),
    );
  out = el("defs", {}, ...defs) + out;

  const names = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([sp]) => SPECIES[sp as Species].name);
  const lead = andList(names);
  note.alt(`${lead.charAt(0).toUpperCase() + lead.slice(1)} leaves ${pile ? "piled" : "fallen"} on ${where}`);
  note.focus(spots[0][0], spots[0][1]);
  return compact(out);
});
