import { defineKind, el, hex, mix, type Point, type Rand, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";
import {
  arrange,
  box,
  graphics,
  type Mount,
  MOUNT_PAINTS,
  type Pal,
  palette,
  rackArm,
  sharer,
  softShadow,
  unturn,
  wall,
  WALLS,
} from "./shared";

/** An end clip for an upright board, at its end y, reaching outward in direction e (−1 up, 1 down). */
function endClip(y: number, e: number, cw: number, paint: string): Mount {
  const shade = s`M${-cw / 2} ${y - e * cw * 0.25}H${cw / 2}V${y + e * cw * 0.3}H${-cw / 2}Z`;
  return {
    shade,
    back: box(-cw / 2, y - e * cw * 0.25, cw / 2, y + e * cw * 0.3, {
      rx: cw * 0.1,
      fill: mix(paint, "#000000", 0.18),
    }),
    front:
      box(-cw * 0.44, y - e * cw * 0.3, cw * 0.44, y + e * cw * 0.05, { rx: cw * 0.1, fill: paint }) +
      box(-cw * 0.44, y - e * cw * 0.3, cw * 0.44, y - e * cw * 0.22, { fill: "#fff", opacity: 0.25 }),
  };
}

const SURF_ART = ["rails", "stripes", "racing", "swirl", "fade", "panels", "wood", "clear"] as const;

type SurfArt = (typeof SURF_ART)[number];

const SURF_WORDS: Record<SurfArt, [string, string]> = {
  rails: ["painted rails", "painted rails"],
  stripes: ["stripes", "stripes"],
  racing: ["racing stripes", "racing stripes"],
  swirl: ["resin swirls", "resin swirls"],
  fade: ["a fade", "fades"],
  panels: ["resin panels", "resin panels"],
  wood: ["a wood finish", "wood finishes"],
  clear: ["a clear finish", "clear finishes"],
};

/** A surfboard's plan: how wide for its length, how full its nose, where it's widest, its tail. */
interface SurfShape {
  name: string;
  ratio: number;
  /** How full the nose is: higher is fuller. */
  nose: number;
  round: boolean;
  wide: number;
  tail: "squash" | "round" | "pin";
}

function surfShape(g: Rand): SurfShape {
  const type = g.pick(["shortboard", "shortboard", "fish", "longboard", "longboard", "gun"] as const);
  if (type === "fish") return { name: "fish", ratio: 0.31, nose: 2.6, round: false, wide: 0.45, tail: "squash" };
  if (type === "longboard")
    return { name: "longboard", ratio: 0.23, nose: 2.4, round: true, wide: 0.5, tail: g.pick(["round", "squash"]) };
  if (type === "gun") return { name: "gun", ratio: 0.22, nose: 1.9, round: false, wide: 0.55, tail: "pin" };
  return {
    name: "shortboard",
    ratio: 0.26,
    nose: g.f(2.1, 2.5),
    round: false,
    wide: g.f(0.48, 0.54),
    tail: g.pick(["squash", "round", "pin"]),
  };
}

/** Half a surfboard's width at t (0 at the tail, 1 at the nose), as a share of its full width. */
function surfHalf(t: number, shape: SurfShape): number {
  const c = shape.wide;
  const tailWidth = { squash: 0.42, round: 0.32, pin: 0.1 }[shape.tail];
  const cap = { squash: 0.01, round: 0.07, pin: 0.04 }[shape.tail];
  const nose = Math.max(0, 1 - ((t - c) / (1 - c)) ** shape.nose);
  const body = t < c ? 1 - (1 - tailWidth) * ((c - t) / c) ** 1.7 : shape.round ? Math.sqrt(nose) : nose;
  const end = t < cap ? Math.sqrt(Math.max(0, 1 - ((cap - t) / cap) ** 2)) : 1;
  return 0.5 * body * end;
}

/** A surfboard's outline centered on (0, 0), nose toward −y. */
function surfPath(wid: number, len: number, shape: SurfShape): string {
  const right: Point[] = [];
  const steps = 12;
  for (let k = 0; k <= steps; k++) {
    // Closer samples at both ends, where the outline turns fastest.
    const t = (1 - Math.cos((Math.PI * k) / steps)) / 2;
    right.push([surfHalf(t, shape) * wid, len / 2 - t * len]);
  }
  const left = right.map(([x, y]): Point => [-x, y]).reverse();
  // A smooth curve through the midpoints, in whole pixels, which are plenty here and keep the markup short.
  const ring = [...right, ...left.slice(1, -1)];
  const xy = ([x, y]: Point) => `${Math.round(x)} ${Math.round(y)}`;
  const mid = (k: number): Point => {
    const [a, b] = [ring[k % ring.length], ring[(k + 1) % ring.length]];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  return `M${xy(mid(ring.length - 1))}${ring.map((p, k) => `Q${xy(p)} ${xy(mid(k))}`).join("")}Z`;
}

/** A surfboard's deck graphic over the area of a board `wid` by `len`, clipped by the caller. */
function surfArt(g: Rand, style: SurfArt, wid: number, len: number, outline: string, p: Pal, id: string): string {
  const top = -len / 2;
  const fillAll = (paint: string) => el("rect", { x: -wid, y: top - 2, width: wid * 2, height: len + 4, fill: paint });
  const stringer = el("path", {
    d: s`M0 ${-top}V${top}`,
    stroke: "#000",
    opacity: 0.3,
    "stroke-width": Math.max(0.8, wid * 0.016),
  });
  if (style === "wood") {
    const wood = hex(g.f(26, 38), g.f(35, 55), g.f(50, 64));
    let out = fillAll(wood);
    let grain = "";
    for (let k = 0; k < 7; k++) {
      const x = wid * (-0.42 + k * 0.14 + g.f(-0.03, 0.03));
      grain += s`M${x} ${-top}Q${x + wid * g.f(-0.08, 0.08)} 0 ${x * 0.3} ${top}`;
    }
    out += el("path", {
      d: grain,
      fill: "none",
      stroke: mix(wood, "#000000", 0.35),
      opacity: 0.3,
      "stroke-width": wid * 0.012,
    });
    if (g.chance(0.5)) out += el("use", { href: outline, fill: "none", stroke: p.a, "stroke-width": wid * 0.12 });
    return out + stringer;
  }
  if (style === "clear") {
    let out = fillAll(g.pick(["#f1ecdd", "#f4f1ea", "#ece4d0"]));
    out += el("use", { href: outline, fill: "none", stroke: p.a, opacity: 0.45, "stroke-width": wid * 0.34 });
    return out + stringer;
  }
  let out = fillAll(p.base);
  if (style === "rails") {
    out += el("use", { href: outline, fill: "none", stroke: p.a, "stroke-width": wid * 0.24 });
    out += el("use", {
      href: outline,
      fill: "none",
      stroke: p.light === p.base ? p.ink : p.light,
      "stroke-width": wid * 0.018,
      transform: "scale(0.76 0.9)",
    });
  } else if (style === "stripes") {
    const y = top + len * g.f(0.18, 0.32);
    const bands = g.i(1, 3);
    let d = "";
    let y1 = y;
    for (let k = 0; k < bands; k++) {
      const t = wid * (k === 0 ? g.f(0.2, 0.35) : g.f(0.06, 0.12));
      d += s`M${-wid} ${y1}h${wid * 2}v${t}h${-wid * 2}Z`;
      y1 += t + wid * 0.07;
    }
    const tilt = g.f(-12, 12);
    out += el("path", { d, fill: p.a, transform: s`rotate(${tilt} 0 ${y})` });
    if (g.chance(0.5))
      out += el("rect", {
        x: -wid,
        y: -top - len * g.f(0.15, 0.25),
        width: wid * 2,
        height: wid * 0.1,
        fill: p.b,
        transform: s`rotate(${-tilt} 0 ${-top - len * 0.2})`,
      });
  } else if (style === "racing") {
    const off = g.chance(0.4) ? wid * 0.14 : 0;
    out += el("rect", { x: off - wid * 0.09, y: top, width: wid * 0.18, height: len, fill: p.a });
    out += el("path", {
      d: s`M${off - wid * 0.16} ${top}V${-top}M${off + wid * 0.16} ${top}V${-top}`,
      stroke: p.b,
      "stroke-width": wid * 0.035,
    });
  } else if (style === "swirl") {
    const colors = [p.a, p.b, p.light].filter(c => c !== p.base);
    let swirls = "";
    for (let k = g.i(4, 6); k > 0; k--) {
      const y0 = top + len * g.f(-0.1, 0.8);
      const seg = len * g.f(0.1, 0.18);
      const xs = [0, 1, 2, 3].map(() => wid * g.f(-0.55, 0.55));
      const mid: Point = [(xs[1] + xs[2]) / 2, y0 + seg * 1.5];
      swirls += el("path", {
        d: s`M${xs[0]} ${y0}Q${xs[1]} ${y0 + seg} ${mid[0]} ${mid[1]}T${xs[3]} ${y0 + seg * 3}`,
        stroke: g.pick(colors),
        "stroke-width": wid * g.f(0.1, 0.26),
      });
    }
    out += el("g", { fill: "none", "stroke-linecap": "round" }, swirls);
  } else if (style === "fade") {
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        el("stop", { offset: 0, "stop-color": p.a }),
        el("stop", { offset: 0.5, "stop-color": p.b }),
        el("stop", { offset: 1, "stop-color": p.base }),
      ),
    );
    out += el("use", { href: outline, fill: `url(#${id})` });
  } else {
    // Panels of tinted resin at the nose and the tail, with a pinline where they meet the middle.
    const y1 = top + len * g.f(0.2, 0.33);
    const y2 = -top - len * g.f(0.15, 0.28);
    const bow = wid * g.f(-0.35, 0.35);
    const nose = s`M${-wid} ${y1 + bow}Q0 ${y1 - bow} ${wid} ${y1 + bow}`;
    const tail = s`M${-wid} ${y2 - bow}Q0 ${y2 + bow} ${wid} ${y2 - bow}`;
    out += el("path", { d: nose + s`V${top - 2}H${-wid}Z`, fill: p.a });
    out += el("path", { d: tail + s`V${-top + 2}H${-wid}Z`, fill: p.b });
    out += el("path", {
      d: nose + tail,
      fill: "none",
      stroke: p.light === p.base ? p.ink : p.light,
      "stroke-width": wid * 0.03,
    });
  }
  return out;
}

/** Surfboards on a wall, deck side out: on rack arms one above another, or hung upright in a row. */
export const surfboard = /* @__PURE__ */ defineKind("surfboard", "Surfboard", { wall: WALLS }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallType = g.option("wall", g.pick(WALLS));
  const backdrop = wall(g.fork("wall"), wallType, w, h);
  let out = backdrop.out;
  // Surfboards lie on racks one above another on wide pictures, and hang upright on tall ones.
  const aspect = w / h;
  const kinds =
    aspect > 2
      ? (["stack", "row"] as const)
      : aspect > 1.15
        ? (["stack"] as const)
        : aspect < 0.87
          ? (["up"] as const)
          : (["up", "stack"] as const);
  const plan = arrange(g, w, h, 0.27, 0, g.pick([90, -90]), kinds);
  const count = plan.spots.length;
  const slot = plan.len * 0.27;
  // A matched set in turning colors, or a quiver of different boards.
  const series = g.chance(0.5);
  const hue = g.f(0, 360);
  const step = g.pick([25, 40, 60, 180]);
  const shape0 = surfShape(g);
  const style0 = g.pick(SURF_ART);
  // Each distinct outline is written once, and boards of the same shape share it.
  const outlines = new Map<string, string>();
  let defs = "";
  const boards = plan.spots.map((spot, k) => {
    const shape = series || k === 0 ? shape0 : surfShape(g);
    const style = series || k === 0 ? style0 : g.pick(SURF_ART);
    const len = Math.min(plan.len, slot / shape.ratio) * (series ? 1 : g.f(0.9, 1));
    const wid = len * shape.ratio;
    const pal = palette(g, series ? hue + k * step : g.f(0, 360));
    const path = surfPath(wid, len, shape);
    if (!outlines.has(path)) {
      outlines.set(path, g.id(`surf${k}`));
      defs += el("path", { id: outlines.get(path)!, d: path });
    }
    return { spot, shape, style, len, wid, pal, outline: `#${outlines.get(path)}` };
  });
  out += el("defs", {}, defs);
  const mountPaint = g.pick(MOUNT_PAINTS);
  const down = plan.rot === 90 ? 1 : -1;
  const mounts = boards.map(({ shape, len, wid }) => {
    if (plan.rot === 0) {
      const cw = Math.min(wid * 0.38, unit * 0.06);
      return [endClip(-len / 2 + len * 0.03, -1, cw, mountPaint), endClip(len / 2, 1, cw, mountPaint)];
    }
    return [0.25, 0.75].map(t =>
      rackArm(down * surfHalf(t, shape) * wid, len / 2 - t * len, down, Math.min(wid * 0.3, unit * 0.06), mountPaint),
    );
  });
  const place = (spot: Point) => s`translate(${spot[0]} ${spot[1]}) rotate(${plan.rot})`;
  const [dx, dy] = unturn(unit * 0.012, unit * 0.022, plan.rot);
  const share = sharer(g, "surfpart");
  for (const [k, board] of boards.entries()) {
    const shade = mounts[k].map(m => m.shade).join("");
    const shadow = softShadow(g, el("use", { href: board.outline }) + el("path", { d: shade }), dx, dy);
    out += el("g", { transform: place(board.spot) }, share(shadow + mounts[k].map(m => m.back).join("")));
  }
  const clips = new Map<string, string>();
  for (const [k, board] of boards.entries()) {
    const { wid, len, outline } = board;
    const art = surfArt(g, board.style, wid, len, outline, board.pal, g.id(`surffade${k}`));
    let markup = "";
    if (!clips.has(outline)) {
      clips.set(outline, g.id(`surfclip${k}`));
      markup += el("defs", {}, el("clipPath", { id: clips.get(outline)! }, el("use", { href: outline })));
    }
    markup += el(
      "g",
      { "clip-path": `url(#${clips.get(outline)})` },
      art,
      // A soft shine down one rail.
      share(
        el("path", {
          d: s`M${-wid * 0.26} ${len * 0.32}Q${-wid * 0.34} 0 ${-wid * 0.14} ${-len * 0.34}`,
          fill: "none",
          stroke: "#fff",
          opacity: 0.25,
          "stroke-width": wid * 0.06,
          "stroke-linecap": "round",
        }),
      ),
    );
    markup += share(
      el("use", {
        href: outline,
        fill: "none",
        stroke: "#000",
        opacity: 0.12,
        "stroke-width": Math.max(0.8, wid * 0.012),
      }) + mounts[k].map(m => m.front).join(""),
    );
    out += el("g", { transform: place(board.spot) }, markup);
  }
  // Alt text.
  const words = graphics(
    boards.map(b => b.style),
    SURF_WORDS,
  );
  const longboards = boards.every(b => b.shape.name === "longboard");
  const noun = longboards ? "longboard" : "surfboard";
  const subject = count === 1 ? `A ${noun}` : `${capitalize(numberWord(count))} ${noun}s`;
  const hung =
    plan.kind === "up"
      ? `hung upright on a ${backdrop.name}`
      : `resting on ${count === 1 ? "a rack" : plan.kind === "stack" ? "racks one above another" : "racks side by side"} on a ${backdrop.name}`;
  note.alt(`${subject} with ${words}, ${hung}`);
  const middle = boards[Math.floor(count / 2)].spot;
  note.focus(middle[0], middle[1]);
  return out;
});
