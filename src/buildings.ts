import { defineKind, el, hsl, lin, n, pts, s, type AttrValue, type Point, type Rand } from "./core";
import { andList } from "./words";

type Time = "day" | "dusk" | "night";

const timeOfDay = (g: Rand): Time => g.pick(["day", "day", "day", "dusk", "dusk", "night"] as const);

/** How much to darken scenery at each time of day. */
const shade = (time: Time): number => (time === "night" ? 0.55 : time === "dusk" ? 0.85 : 1);

/** Words for the time of day, to end an alt sentence. */
const when = (time: Time): string => (time === "night" ? " at night" : time === "dusk" ? " at dusk" : "");

/** The sky down to `horizon`: a gradient, then the sun and a cloud, or the moon and stars. */
function skyAt(g: Rand, w: number, h: number, time: Time, horizon: number): string {
  const id = g.id("sky");
  const hue = g.f(-12, 12);
  const stops =
    time === "day"
      ? [hsl(205 + hue, 62, g.f(58, 68)), hsl(198 + hue, 60, 88)]
      : time === "dusk"
        ? [hsl(250 + hue, 35, 36), hsl(330 + hue, 45, 62), hsl(28 + hue, 90, 74)]
        : [hsl(228 + hue, 50, 8), hsl(238 + hue, 40, 25)];
  let out = el("defs", {}, lin(id, stops));
  out += el("rect", { width: w, height: horizon + 2, fill: `url(#${id})` });
  const unit = Math.min(w, h);
  const x = w * g.f(0.08, 0.92);
  const r = unit * g.f(0.045, 0.065);
  if (time === "night") {
    const stars: Point[] = [];
    for (let k = g.i(14, 26); k > 0; k--) stars.push([w * g.f(0, 1), horizon * g.f(0, 0.8)]);
    out += el("g", { opacity: 0.8 }, dots(stars.slice(0, 6), 1.3, "#ffffff"), dots(stars.slice(6), 0.7, "#ffffff"));
    out += el("circle", { cx: x, cy: horizon * g.f(0.12, 0.35), r, fill: hsl(50, 70, 92) });
  } else if (time === "dusk") {
    out += el("circle", { cx: x, cy: horizon - r * g.f(0.4, 2.5), r: r * 1.3, fill: hsl(32, 95, 80) });
  } else {
    if (g.chance(0.7)) out += el("circle", { cx: x, cy: horizon * g.f(0.15, 0.4), r, fill: hsl(48, 95, 90) });
    if (g.chance(0.7)) out += cloud(w * g.f(0.1, 0.9), horizon * g.f(0.2, 0.45), unit * g.f(0.06, 0.1));
  }
  return out;
}

/** A puffy cloud with a flat base, centered on x with its base at y. */
const cloud = (x: number, y: number, size: number): string =>
  el(
    "g",
    { fill: "#ffffff", opacity: 0.85 },
    el("rect", { x: x - size, y: y - size * 0.32, width: size * 2, height: size * 0.32, rx: size * 0.16 }),
    el("circle", { cx: x - size * 0.45, cy: y - size * 0.32, r: size * 0.36 }),
    el("circle", { cx: x + size * 0.08, cy: y - size * 0.48, r: size * 0.48 }),
    el("circle", { cx: x + size * 0.6, cy: y - size * 0.28, r: size * 0.3 }),
  );

/** A wash over the whole picture that dims it for dusk or night. Lights are drawn after it. */
const veil = (w: number, h: number, time: Time): string =>
  time === "night"
    ? el("rect", { width: w, height: h, fill: hsl(232, 55, 12), opacity: 0.35 })
    : time === "dusk"
      ? el("rect", { width: w, height: h, fill: hsl(15, 70, 45), opacity: 0.1 })
      : "";

/** A gentle hill line across the picture, filled down to the bottom. */
const hill = (g: Rand, w: number, h: number, y: number, rise: number, paint: string): string =>
  el("path", {
    d: s`M0 ${y + rise * g.f(-0.3, 0.5)}
         Q ${w * g.f(0.2, 0.8)} ${y - rise} ${w} ${y + rise * g.f(-0.3, 0.5)}
         V ${h} H0Z`,
    fill: paint,
  });

/** A round-topped tree whose trunk stands at (x, y). */
const tree = (x: number, y: number, ht: number, leaf: string, trunk: string): string =>
  el("rect", { x: x - ht * 0.05, y: y - ht * 0.5, width: ht * 0.1, height: ht * 0.5 + 1, fill: trunk }) +
  el("circle", { cx: x, cy: y - ht * 0.68, r: ht * 0.32, fill: leaf });

/** Path data for a filled dot, to gather dots of different sizes into one path. */
const dot = (x: number, y: number, r: number): string =>
  s`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const FLOWERS = ["#e8505b", "#f9d56e", "#f3a6c8", "#f4f1ea", "#b48ede", "#f08a5d"];

/** Round dots of radius r at the given spots, as one path of round-capped zero-length strokes. */
const dots = (spots: readonly Point[], r: number, paint: string): string =>
  spots.length
    ? el("path", {
        d: spots.map(([x, y]) => s`M${x} ${y}h0`).join(""),
        stroke: paint,
        "stroke-width": 2 * r,
        "stroke-linecap": "round",
      })
    : "";

/** Dots of flowers at the given spots, one path per color. */
function blossoms(g: Rand, spots: readonly Point[], r: number, colors: readonly string[]): string {
  const byColor = new Map<string, Point[]>();
  for (const spot of spots) {
    const color = g.pick(colors);
    byColor.set(color, [...(byColor.get(color) ?? []), spot]);
  }
  return [...byColor].map(([color, list]) => dots(list, r, color)).join("");
}

/**
 * Drawing in local units: (0, 0) maps to (ox, oy) and one unit to k px. Path data uses absolute
 * commands only, with spaces between every token.
 */
function local(ox: number, oy: number, k: number) {
  const x = (v: number) => ox + v * k;
  const y = (v: number) => oy + v * k;
  // Written compactly: a space only between two numbers, and none before a minus sign.
  const path = (d: string): string => {
    let out = "";
    let cmd = "";
    let index = 0;
    for (const token of d.trim().split(/\s+/)) {
      if (/^[A-Z]$/.test(token)) {
        cmd = token;
        index = 0;
        out += token;
        continue;
      }
      const v = Number(token);
      let px: number;
      if (cmd === "A") {
        const slot = index % 7;
        px = slot < 2 ? v * k : slot < 5 ? v : slot === 5 ? x(v) : y(v);
      } else if (cmd === "H") px = x(v);
      else if (cmd === "V") px = y(v);
      else px = index % 2 === 0 ? x(v) : y(v);
      const text = String(n(px));
      out += /[\d.]$/.test(out) && text[0] !== "-" ? " " + text : text;
      index++;
    }
    return out;
  };
  return {
    x,
    y,
    k: (v: number) => v * k,
    d: path,
    path: (d: string, attrs: Record<string, AttrValue> = {}) => el("path", { d: path(d), ...attrs }),
    poly: (points: readonly Point[], attrs: Record<string, AttrValue>) =>
      el("path", { d: path(`M ${points.map(([px, py]) => `${px} ${py}`).join(" L ")} Z`), ...attrs }),
    circle: (cx: number, cy: number, r: number, attrs: Record<string, AttrValue>) =>
      el("circle", { cx: x(cx), cy: y(cy), r: r * k, ...attrs }),
    ellipse: (cx: number, cy: number, rx: number, ry: number, attrs: Record<string, AttrValue>) =>
      el("ellipse", { cx: x(cx), cy: y(cy), rx: rx * k, ry: ry * k, ...attrs }),
    rect: (rx0: number, ry0: number, rw: number, rh: number, attrs: Record<string, AttrValue>) =>
      el("rect", { x: x(rx0), y: y(ry0), width: rw * k, height: rh * k, ...attrs }),
  };
}

type Local = ReturnType<typeof local>;

const GLASS = "#cfe2ec";
const UNLIT = hsl(222, 25, 26);
const LIT = hsl(44, 95, 72);
const BAR = hsl(25, 25, 22);

/** A window with a cross of glazing bars, its top left at (x, y) in local units. */
const pane = (u: Local, x: number, y: number, pw: number, ph: number, glass: string, bar: string): string =>
  u.rect(x, y, pw, ph, { fill: glass }) +
  u.path(`M ${x + pw / 2} ${y} V ${y + ph} M ${x} ${y + ph * 0.45} H ${x + pw}`, {
    stroke: bar,
    "stroke-width": u.k(Math.min(pw, ph) * 0.09),
  });

/** A darker color for scenery at dusk or night: lightness scaled by `dark`. */
const tone = (hue: number, sat: number, light: number, dark: number) => hsl(hue, sat, light * dark);

/** A small country cottage with a smoking chimney, a garden path and flowers or a fence. */
export const cottage = defineKind("cottage", "Country cottage", { roof: ["tiled", "thatched"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const roof = g.option("roof", g.pick(["tiled", "thatched"] as const));
  const ground = h * g.f(0.68, 0.75);
  const size = Math.min(unit * 0.62, w * 0.44, (ground - h * 0.05) / 1.3);
  const cx = w * g.f(0.42, 0.58);
  const grass = g.f(85, 125);
  let out = skyAt(g, w, h, time, ground);
  out += hill(g, w, h, ground - h * g.f(0.06, 0.14), h * g.f(0.03, 0.08), tone(grass + 12, 26, 62, dark));
  out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 40, 46, dark) });
  // Trees standing behind, to either side.
  const leaf = tone(grass + 10, 38, 32, dark);
  const trunk = tone(25, 30, 28, dark);
  for (const dir of [-1, 1])
    if (g.chance(0.6)) out += tree(cx + dir * size * g.f(0.85, 1.3), ground + 1, size * g.f(0.75, 1.05), leaf, trunk);
  const u = local(cx, ground, size);
  const lit = time !== "day";
  let lights = "";
  // The chimney, behind the roof, and its smoke.
  const side = g.pick([-1, 1]);
  const chx = side * g.f(0.18, 0.3);
  const smoke = lit || g.chance(0.7);
  if (smoke) {
    const drift = g.f(0.04, 0.1) * g.pick([-1, 1]);
    for (let k = 0; k < 3; k++)
      out += u.circle(chx + drift * (k + 0.5), -1.17 - k * 0.12, 0.04 + 0.025 * k, {
        fill: hsl(220, 10, 88),
        opacity: 0.7 - k * 0.15,
      });
  }
  const brick = tone(g.f(5, 25), 35, 42, dark);
  out += u.rect(chx - 0.055, -1.1, 0.11, 0.45, { fill: brick });
  out += u.rect(chx - 0.07, -1.12, 0.14, 0.04, { fill: tone(20, 15, 30, dark) });
  // The walls.
  const wall = g.pick([
    [40, 35, 90],
    [30, 30, 84],
    [45, 45, 80],
    [15, 35, 84],
    [200, 20, 86],
    [35, 12, 72],
  ] as const);
  out += u.rect(-0.5, -0.52, 1, 0.52, { fill: tone(wall[0], wall[1], wall[2], dark) });
  // The roof.
  if (roof === "thatched") {
    const straw = g.f(34, 44);
    out += u.path(
      "M -0.63 -0.44 C -0.68 -0.72 -0.48 -0.99 -0.28 -0.99 H 0.28 C 0.48 -0.99 0.68 -0.72 0.63 -0.44 Q 0 -0.4 -0.63 -0.44 Z",
      { fill: tone(straw, 45, 58, dark) },
    );
    let strokes = "";
    for (let k = 0; k <= 8; k++) {
      const x = -0.52 + k * 0.13;
      strokes += `M ${x * 0.55} -0.95 L ${x} -0.47 `;
    }
    out += u.path(strokes, { stroke: "#000", opacity: 0.12, "stroke-width": u.k(0.012) });
    out += u.path("M -0.63 -0.44 Q 0 -0.4 0.63 -0.44", {
      fill: "none",
      stroke: tone(straw - 6, 40, 38, dark),
      "stroke-width": u.k(0.03),
    });
    out += u.rect(-0.3, -1.01, 0.6, 0.06, { rx: u.k(0.03), fill: tone(straw - 4, 40, 46, dark) });
  } else {
    const tile = g.pick([
      [12, 55, 45],
      [215, 15, 36],
      [22, 35, 34],
      [5, 45, 38],
    ] as const);
    out += u.poly(
      [
        [-0.6, -0.47],
        [-0.38, -0.96],
        [0.38, -0.96],
        [0.6, -0.47],
      ],
      { fill: tone(tile[0], tile[1], tile[2], dark) },
    );
    let rows = "";
    for (let k = 1; k < 4; k++) {
      const y = -0.47 - k * 0.12;
      const t = k * 0.12;
      rows += `M ${-0.6 + 0.449 * t} ${y} H ${0.6 - 0.449 * t} `;
    }
    out += u.path(rows, { stroke: "#000", opacity: 0.15, "stroke-width": u.k(0.012) });
    out += u.rect(-0.4, -0.98, 0.8, 0.035, { rx: u.k(0.015), fill: tone(tile[0], tile[1], tile[2] - 10, dark) });
    out += u.rect(-0.5, -0.47, 1, 0.035, { fill: "#000", opacity: 0.12 });
  }
  // The door, with windows either side of it or beside it.
  const doorX = g.pick([0, 0, -0.27, 0.27]);
  const windows = doorX === 0 ? [-0.29, 0.29] : [-doorX, 0];
  const paint = g.pick([
    [205, 45, 40],
    [150, 30, 35],
    [0, 50, 42],
    [45, 70, 50],
    [270, 20, 42],
    [20, 40, 30],
  ] as const);
  const door = tone(paint[0], paint[1], paint[2], dark);
  out += u.rect(doorX - 0.11, -0.02, 0.22, 0.03, { fill: tone(30, 8, 60, dark) });
  out += u.path(`M ${doorX - 0.085} 0 V -0.22 A 0.085 0.085 0 0 1 ${doorX + 0.085} -0.22 V 0 Z`, { fill: door });
  out += u.circle(doorX + 0.05, -0.13, 0.012, { fill: hsl(45, 60, 60) });
  const shutters = g.chance(0.4);
  const boxes = g.chance(0.5);
  const trim = tone(40, 20, 94, dark);
  for (const x of windows) {
    if (shutters) {
      out += u.rect(x - 0.14, -0.39, 0.055, 0.18, { fill: door });
      out += u.rect(x + 0.085, -0.39, 0.055, 0.18, { fill: door });
    }
    out += u.rect(x - 0.095, -0.4, 0.19, 0.2, { fill: trim });
    const glass = pane(u, x - 0.075, -0.38, 0.15, 0.16, lit ? LIT : GLASS, BAR);
    if (lit) lights += glass;
    else out += glass;
    if (boxes) {
      out += u.rect(x - 0.11, -0.2, 0.22, 0.045, { fill: tone(25, 40, 32, dark) });
      const spots: Point[] = [];
      for (let k = 0; k < 6; k++) spots.push([u.x(x - 0.09 + k * 0.036), u.y(-0.205 - (k % 2) * 0.015)]);
      out += blossoms(g, spots, size * 0.018, FLOWERS);
    }
  }
  // Flower bushes along the foot of the wall, kept clear of the door.
  const bush = tone(grass + 15, 40, 30, dark);
  const flowerSpots: Point[] = [];
  let bushes = "";
  for (let x = -0.44; x < 0.46; x += g.f(0.12, 0.18)) {
    if (Math.abs(x - doorX) < 0.16) continue;
    const r = g.f(0.05, 0.07);
    bushes += dot(u.x(x), u.y(-0.02), size * r);
    for (let k = 0; k < 3; k++) flowerSpots.push([u.x(x + g.f(-r, r) * 0.8), u.y(-0.02 - g.f(0, r) * 0.9)]);
  }
  out += el("path", { d: bushes, fill: bush });
  out += blossoms(g, flowerSpots, size * 0.015, FLOWERS);
  // The garden path from the door to the front of the picture.
  const top = u.x(doorX);
  const foot = top + size * g.f(-0.35, 0.35);
  const bend = size * g.f(-0.2, 0.2);
  const wide = size * 0.28;
  out += el("path", {
    d: s`M${top - size * 0.08} ${ground}
         Q ${(top + foot) / 2 + bend - wide * 0.6} ${(ground + h) / 2} ${foot - wide} ${h}
         H ${foot + wide}
         Q ${(top + foot) / 2 + bend + wide * 0.6} ${(ground + h) / 2} ${top + size * 0.08} ${ground}Z`,
    fill: tone(35, 20, 74, dark),
  });
  // A picket fence across the front garden, with a gap for the path; or flowers along the path.
  const fence = g.chance(0.6);
  if (fence) {
    const fy = ground + (h - ground) * g.f(0.4, 0.55);
    const gap = (top + foot) / 2 + bend * 0.5;
    const gapW = wide * 0.9;
    const ph = size * 0.13;
    const pw = size * 0.035;
    const step = size * 0.07;
    const wood = g.chance(0.6) ? tone(40, 20, 92, dark) : tone(30, 25, 55, dark);
    // One pointed picket in a tile repeated along the fence.
    const id = g.id("picket");
    out += el(
      "defs",
      {},
      el(
        "pattern",
        { id, width: step, height: ph, patternUnits: "userSpaceOnUse", x: gap + gapW, y: fy - ph },
        el("path", { d: s`M0 ${ph}V${pw / 2}L${pw / 2} 0L${pw} ${pw / 2}V${ph}Z`, fill: wood }),
      ),
    );
    // The tiles start at the right side of the gap; the left run stops at the last whole picket.
    const left = gap + gapW + Math.floor((-2 * gapW - pw) / step) * step + pw;
    let rails = "";
    for (const ry of [fy - ph * 0.75, fy - ph * 0.35]) {
      rails += s`M0 ${ry}H${left}v${size * 0.02}H0Z`;
      rails += s`M${gap + gapW} ${ry}H${w}v${size * 0.02}H${gap + gapW}Z`;
    }
    out += el("path", { d: rails, fill: wood });
    out += el("rect", { y: fy - ph, width: Math.max(0, left), height: ph, fill: `url(#${id})` });
    out += el("rect", {
      x: gap + gapW,
      y: fy - ph,
      width: Math.max(0, w - gap - gapW),
      height: ph,
      fill: `url(#${id})`,
    });
  } else {
    const spots: Point[] = [];
    const far: Point[] = [];
    const near: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const t = (k + g.f(0.2, 0.8)) / 10;
      const yy = ground + (h - ground) * t;
      const half = size * 0.08 + (wide - size * 0.08) * t;
      const mid = top + (foot - top) * t + bend * 2 * t * (1 - t);
      for (const dir of [-1, 1]) {
        const x = mid + dir * (half + size * (0.04 + 0.04 * t));
        (k < 5 ? far : near).push([x, yy]);
        spots.push([x, yy - size * 0.01]);
      }
    }
    out += dots(far, size * 0.032, bush) + dots(near, size * 0.048, bush);
    out += blossoms(g, spots, size * 0.022, FLOWERS);
  }
  out += veil(w, h, time) + lights;
  const kind = roof === "thatched" ? "A thatched cottage" : "A country cottage";
  const extras = andList([smoke && "chimney smoke", "a garden path", fence ? "a picket fence" : "flowers"]);
  note.alt(`${kind} with ${extras}${when(time)}${lit ? ", windows lit" : ""}`);
  note.focus(cx, ground - size * 0.45);
  return out;
});

/** Four lattice sails around a hub at (hx, hy), `len` long, turned by `angle` radians. */
function sails(g: Rand, hx: number, hy: number, len: number, angle: number, frame: string, cloth: string): string {
  const stock = len * 0.035;
  const width = len * 0.21;
  const r0 = len * 0.16;
  const covered = g.chance(0.55) ? g.f(0.4, 1) : 0;
  let stocks = "";
  let lattice = "";
  let cloths = "";
  for (let k = 0; k < 4; k++) {
    const theta = angle + (k * Math.PI) / 2;
    const at = (along: number, across: number): string =>
      s`${hx + Math.sin(theta) * along + Math.cos(theta) * across} ${hy - Math.cos(theta) * along + Math.sin(theta) * across}`;
    const near = stock / 2;
    const far = stock / 2 + width;
    stocks += `M${at(-len * 0.08, 0)}L${at(len, 0)}`;
    lattice += `M${at(r0, near)}L${at(len, near)}L${at(len, far)}L${at(r0, far)}Z`;
    lattice += `M${at(r0, (near + far) / 2)}L${at(len, (near + far) / 2)}`;
    for (let j = 1; j < 7; j++) {
      const along = r0 + ((len - r0) * j) / 7;
      lattice += `M${at(along, near)}L${at(along, far)}`;
    }
    if (covered) {
      const from = len - (len - r0) * covered;
      cloths += `M${at(from, near)}L${at(len, near)}L${at(len, far)}L${at(from, far)}Z`;
    }
  }
  let out = el("path", { d: lattice, fill: "none", stroke: frame, "stroke-width": len * 0.014 });
  if (cloths) out += el("path", { d: cloths, fill: cloth, opacity: 0.9 });
  out += el("path", { d: stocks, stroke: frame, "stroke-width": stock, "stroke-linecap": "round" });
  return out;
}

const TULIPS = ["#e8505b", "#f9d56e", "#f3a6c8", "#f08a5d", "#b48ede", "#f4f1ea", "#d6453d"];

/** A traditional windmill with four sails, among tulip fields or beside a canal. */
export const windmill = defineKind("windmill", "Windmill", { setting: ["tulips", "canal"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const setting = g.option("setting", g.pick(["tulips", "canal"] as const));
  const ground = h * (setting === "canal" ? g.f(0.6, 0.66) : g.f(0.63, 0.7));
  const horizon = ground - h * g.f(0.02, 0.05);
  const size = Math.min(unit * 0.55, (w * 0.46) / 0.9, (ground - h * 0.03) / 1.9);
  const mx = Math.max(size * 0.95, Math.min(w - size * 0.95, w * g.f(0.38, 0.62)));
  const grass = g.f(85, 120);
  let out = skyAt(g, w, h, time, horizon);
  // Flat land to the horizon, with a far windmill and trees along it.
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: tone(grass, 38, 48, dark) });
  const far = tone(grass + 20, 15, 52, dark);
  let trees = "";
  for (let k = g.i(2, 5); k > 0; k--) {
    const x = w * g.f(0, 1);
    if (Math.abs(x - mx) < size * 0.4) continue;
    const r = unit * g.f(0.015, 0.03);
    trees += dot(x, horizon - r * 0.4, r) + dot(x + r * 1.1, horizon - r * 0.2, r * 0.8);
  }
  out += el("path", { d: trees, fill: far });
  if (g.chance(0.6)) {
    const fx = mx + (mx < w / 2 ? 1 : -1) * Math.min(w * 0.35, size * g.f(1.4, 2.2));
    const fs = size * g.f(0.18, 0.25);
    const v = local(fx, horizon + 1, fs);
    out += v.poly(
      [
        [-0.25, 0],
        [-0.15, -1],
        [0.15, -1],
        [0.25, 0],
      ],
      { fill: far },
    );
    const a = g.f(0, Math.PI / 2);
    let x = "";
    for (const t of [a, a + Math.PI / 2])
      x += `M ${Math.sin(t) * 0.8} ${-1.05 - Math.cos(t) * 0.8} L ${-Math.sin(t) * 0.8} ${-1.05 + Math.cos(t) * 0.8} `;
    out += v.path(x, { stroke: far, "stroke-width": v.k(0.08) });
  }
  // The near ground: a canal, or tulip fields in stripes running toward the horizon.
  const waterTop = ground + size * 0.04;
  if (setting === "canal") {
    out += el("rect", { y: ground - size * 0.01, width: w, height: h - ground, fill: tone(grass - 5, 42, 40, dark) });
    out += el("rect", {
      y: waterTop,
      width: w,
      height: h - waterTop,
      fill: time === "night" ? hsl(225, 35, 22) : time === "dusk" ? hsl(300, 25, 50) : hsl(205, 45, 62),
    });
  } else {
    out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 42, 40, dark) });
    const vx = w * g.f(0.3, 0.7);
    const vy = ground - (h - ground) * 0.7;
    const f = (ground - vy) / (h - vy);
    const band = unit * g.f(0.1, 0.15);
    const hues = [...TULIPS].sort(() => g.next() - 0.5).slice(0, g.i(2, 4));
    const byColor = new Map<string, string>();
    const reach = Math.max(vx, w - vx) / f + band;
    for (let k = Math.floor(-reach / band); k * band < reach; k++) {
      const a = vx + k * band;
      const b = a + band * 0.72;
      if (vx + (b - vx) * f < 0 || vx + (a - vx) * f > w) continue;
      const color = hues[((k % hues.length) + hues.length) % hues.length];
      byColor.set(
        color,
        (byColor.get(color) ?? "") +
          s`M${vx + (a - vx) * f} ${ground}L${vx + (b - vx) * f} ${ground}L${b} ${h}L${a} ${h}Z`,
      );
    }
    for (const [color, d] of byColor) out += el("path", { d, fill: color, opacity: dark < 1 ? 0.75 : 1 });
  }
  // The mill: a tapering tower on a brick base, a gallery, a cap and the sails.
  const u = local(mx, ground, size);
  const tower = g.pick([
    [30, 22, 32],
    [150, 15, 26],
    [5, 40, 40],
    [40, 18, 86],
    [210, 12, 40],
  ] as const);
  const body = tone(tower[0], tower[1], tower[2], dark);
  const wood = tone(25, 30, 22, dark);
  let mill = u.ellipse(0, 0, 0.36, 0.035, { fill: "#000", opacity: 0.15 });
  mill += u.poly(
    [
      [-0.27, 0],
      [-0.16, -1],
      [0.16, -1],
      [0.27, 0],
    ],
    { fill: body },
  );
  const gallery = g.chance(0.6);
  if (gallery) {
    mill += u.poly(
      [
        [-0.27, 0],
        [-0.226, -0.4],
        [0.226, -0.4],
        [0.27, 0],
      ],
      { fill: tone(g.f(5, 20), 40, 42, dark) },
    );
    mill += u.rect(-0.4, -0.42, 0.8, 0.03, { fill: wood });
    let rail = "M -0.4 -0.5 H 0.4 ";
    for (let k = 0; k <= 8; k++) rail += `M ${-0.4 + k * 0.1} -0.5 V -0.42 `;
    mill += u.path(rail, { stroke: wood, "stroke-width": u.k(0.012) });
  }
  mill += u.poly(
    [
      [0, 0],
      [0, -1],
      [0.16, -1],
      [0.27, 0],
    ],
    { fill: "#000", opacity: 0.12 },
  );
  mill += u.path("M -0.07 0 V -0.14 A 0.07 0.07 0 0 1 0.07 -0.14 V 0 Z", { fill: wood });
  const lit = time !== "day";
  let lights = "";
  const panes = [
    u.rect(-0.04, -0.72, 0.08, 0.1, { rx: u.k(0.04) }),
    u.rect(-0.035, gallery ? -0.3 : -0.5, 0.07, 0.09, {}),
  ];
  const glass = el("g", { fill: lit ? LIT : UNLIT }, ...panes);
  if (lit) lights += glass;
  else mill += glass;
  const capPaint = tone(g.pick([20, 30, 200]), 20, 25, dark);
  mill += u.path("M -0.21 -0.98 Q -0.21 -1.2 0 -1.23 Q 0.21 -1.2 0.21 -0.98 Z", { fill: capPaint });
  const frame = g.chance(0.5) ? tone(40, 15, 92, dark) : tone(25, 30, 28, dark);
  const angle = g.f(0, Math.PI / 2);
  mill += sails(g, u.x(0), u.y(-1.06), size * 0.82, angle, frame, tone(40, 30, 88, dark));
  mill += u.circle(0, -1.06, 0.045, { fill: wood });
  if (setting === "canal") {
    const id = g.id("mill");
    const clip = g.id("clip");
    out += el("defs", {}, el("clipPath", { id: clip }, el("rect", { y: waterTop, width: w, height: h - waterTop })));
    out += el("g", { id }, mill);
    out += el(
      "g",
      { "clip-path": `url(#${clip})`, opacity: 0.3 },
      el("use", { href: `#${id}`, transform: s`translate(0 ${2 * waterTop}) scale(1 -1)` }),
    );
    let ripples = "";
    for (let k = g.i(5, 9); k > 0; k--) {
      const x = w * g.f(0, 1);
      const y = waterTop + (h - waterTop) * g.f(0.1, 0.95);
      ripples += s`M${x} ${y}h${unit * g.f(0.04, 0.1)}`;
    }
    out += el("path", { d: ripples, stroke: "#ffffff", opacity: 0.35, "stroke-width": unit * 0.006 });
    out += el("rect", { y: waterTop, width: w, height: size * 0.012, fill: "#000", opacity: 0.15 });
  } else out += mill;
  out += veil(w, h, time) + lights;
  const place = setting === "canal" ? "beside a canal" : "among striped tulip fields";
  note.alt(`A windmill with four sails ${place}${when(time)}`);
  note.focus(mx, ground - size * 0.8);
  return out;
});

/** Battlements along the top of a wall from x0 to x1 at y: merlons `mh` tall, as local path data. */
function merlons(x0: number, x1: number, y: number, mh: number): string {
  const count = Math.max(2, Math.round((x1 - x0) / (mh * 2.2)));
  const step = (x1 - x0) / (count * 2 - 1);
  let d = "";
  for (let k = 0; k < count; k++)
    d += `M ${x0 + k * 2 * step} ${y + 0.002} V ${y - mh} H ${x0 + (k * 2 + 1) * step} V ${y + 0.002} Z `;
  return d;
}

/** A storybook castle on a hill, with towers, battlements, flags and a gate. */
export const castle = defineKind("castle", "Storybook castle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const top = h * g.f(0.56, 0.62);
  const size = Math.min((top - h * 0.04) / 1.5, (w * 0.84) / 1.75, unit * 0.75);
  const cx = w * g.f(0.42, 0.58);
  const grass = g.f(85, 125);
  let out = skyAt(g, w, h, time, top + (h - top) * 0.4);
  out += hill(g, w, h, top + (h - top) * 0.3, h * g.f(0.04, 0.1), tone(grass + 15, 24, 62, dark));
  out += el("rect", { y: top + (h - top) * 0.6, width: w, height: h, fill: tone(grass + 5, 34, 50, dark) });
  // The castle hill: flat on top, falling away to either side.
  const flat = size * 0.9;
  const fall = size * 1.4;
  const hillY = (x: number) => {
    const d = Math.max(0, Math.abs(x - cx) - flat);
    return top + (d * d) / fall;
  };
  const reach = flat + Math.sqrt((h - top) * fall);
  const ridge: Point[] = [];
  for (let k = 0; k <= 24; k++) {
    const x = cx - reach + (2 * reach * k) / 24;
    ridge.push([x, hillY(x)]);
  }
  const hillPaint = tone(grass, 40, 44, dark);
  const hillShape = (dy: number) =>
    el("polygon", {
      points: pts([[cx - reach, h + 1], ...ridge.map(([x, y]): Point => [x, y + dy]), [cx + reach, h + 1]]),
      fill: hillPaint,
    });
  out += hillShape(0);
  // Trees on the slopes.
  const leaf = tone(grass + 10, 38, 30, dark);
  const trunk = tone(25, 30, 26, dark);
  for (const dir of [-1, 1])
    for (let k = g.i(0, 2); k > 0; k--) {
      const x = cx + dir * (flat + size * g.f(0.1, 0.9));
      out += tree(x, hillY(x) + size * 0.04, size * g.f(0.28, 0.4), leaf, trunk);
    }
  const u = local(cx, top, size);
  const stone = g.pick([
    [35, 15, 82],
    [30, 25, 74],
    [210, 8, 72],
    [15, 20, 80],
    [45, 25, 86],
  ] as const);
  const wall = tone(stone[0], stone[1], stone[2], dark);
  const back = tone(stone[0], stone[1], stone[2] - 10, dark);
  const roofPaint = g.pick([
    [215, 45, 40],
    [0, 50, 42],
    [175, 35, 36],
    [265, 30, 42],
    [20, 45, 38],
  ] as const);
  const roof = tone(roofPaint[0], roofPaint[1], roofPaint[2], dark);
  const flagHue = g.pick(FLOWERS);
  const flagSide = g.pick([-1, 1]);
  const lit = time !== "day";
  let glass = "";
  const shadow = (x0: number, y0: number, ww: number, hh: number) =>
    u.rect(x0, y0, ww, hh, { fill: "#000", opacity: 0.1 });
  const flag = (x: number, y: number) =>
    u.path(`M ${x} ${y} V ${y - 0.2}`, { stroke: tone(30, 10, 30, dark), "stroke-width": u.k(0.012) }) +
    u.path(
      `M ${x} ${y - 0.2} Q ${x + flagSide * 0.07} ${y - 0.22} ${x + flagSide * 0.15} ${y - 0.17} Q ${x + flagSide * 0.07} ${y - 0.16} ${x} ${y - 0.12} Z`,
      { fill: flagHue },
    );
  const cone = (x: number, y: number, half: number, tall: number) =>
    u.poly(
      [
        [x - half, y],
        [x, y - tall],
        [x + half, y],
      ],
      { fill: roof },
    ) + flag(x, y - tall + 0.01);
  const roofs = g.chance(0.65);
  // The keep, behind the curtain wall.
  const keepTop = -g.f(0.78, 0.92);
  out += u.rect(-0.24, keepTop, 0.48, -keepTop + 0.12, { fill: back });
  out += shadow(0.08, keepTop, 0.16, -keepTop + 0.12);
  if (roofs)
    out += u.poly(
      [
        [-0.28, keepTop],
        [-0.2, keepTop - 0.18],
        [0.2, keepTop - 0.18],
        [0.28, keepTop],
      ],
      { fill: roof },
    );
  else out += u.path(merlons(-0.24, 0.24, keepTop, 0.06), { fill: back });
  for (const x of [-0.12, 0.12])
    glass += u.path(
      `M ${x - 0.04} ${keepTop + 0.28} V ${keepTop + 0.18} A 0.04 0.04 0 0 1 ${x + 0.04} ${keepTop + 0.18} V ${keepTop + 0.28} Z`,
      {},
    );
  // A slim turret on one corner of the keep.
  const turret = g.chance(0.6);
  if (turret) {
    const tx = g.pick([-1, 1]) * 0.22;
    const tt = keepTop - g.f(0.12, 0.2);
    out += u.rect(tx - 0.07, tt, 0.14, keepTop - tt + 0.2, { fill: back });
    out += shadow(tx + 0.02, tt, 0.05, keepTop - tt + 0.2);
    out += cone(tx, tt, 0.1, 0.24);
    glass += u.rect(tx - 0.015, tt + 0.08, 0.03, 0.08, {});
  } else if (roofs) out += flag(0, keepTop - 0.18);
  else out += flag(0, keepTop - 0.06);
  // The curtain wall and its battlements.
  const wallTop = -0.38;
  out += u.rect(-0.62, wallTop, 1.24, 0.5, { fill: wall });
  out += u.path(merlons(-0.62, 0.62, wallTop, 0.06), { fill: wall });
  out += u.rect(-0.62, wallTop, 1.24, 0.03, { fill: "#000", opacity: 0.08 });
  // Towers at either end, and sometimes a pair flanking the gate.
  const tower = (x: number, half: number, tt: number, coned: boolean) => {
    let t = u.rect(x - half, tt, half * 2, 0.12 - tt, { fill: wall });
    t += shadow(x + half * 0.3, tt, half * 0.7, 0.12 - tt);
    if (coned) t += cone(x, tt, half * 1.25, half * 2.6);
    else {
      t += u.rect(x - half * 1.15, tt - 0.03, half * 2.3, 0.05, { fill: wall });
      t += u.path(merlons(x - half * 1.15, x + half * 1.15, tt - 0.03, 0.05), { fill: wall });
      t += flag(x, tt - 0.08);
    }
    glass += u.rect(x - 0.012, tt + 0.1, 0.024, 0.08, {});
    return t;
  };
  const sideTop = -g.f(0.62, 0.74);
  out += tower(-0.62, 0.13, sideTop, roofs) + tower(0.62, 0.13, sideTop, roofs);
  const gateTowers = g.chance(0.45);
  if (gateTowers) out += tower(-0.17, 0.08, -0.5, false) + tower(0.17, 0.08, -0.5, false);
  // The gate, with its portcullis.
  out += u.path("M -0.085 0.12 V -0.12 A 0.085 0.085 0 0 1 0.085 -0.12 V 0.12 Z", { fill: tone(25, 25, 18, dark) });
  if (g.chance(0.6)) {
    let bars = "";
    for (let k = -2; k <= 2; k++) bars += `M ${k * 0.032} -0.2 V 0.04 `;
    bars += "M -0.085 -0.1 H 0.085 M -0.085 -0.02 H 0.085 ";
    out += u.path(bars, { stroke: tone(30, 10, 45, dark), "stroke-width": u.k(0.01) });
  }
  const windows = el("g", { fill: lit ? LIT : UNLIT }, glass);
  if (!lit) out += windows;
  // The hill again, a little lower, to bury the castle's foot; then the track up to the gate.
  out += hillShape(size * 0.035);
  const foot = cx + g.pick([-1, 1]) * Math.min(reach * 0.5, w * 0.3);
  out += el("path", {
    d: s`M${cx} ${top + size * 0.04}
         C ${cx + (foot - cx) * 1.4} ${top + (h - top) * 0.3} ${foot - (foot - cx) * 0.8} ${top + (h - top) * 0.6} ${foot} ${h + 2}`,
    fill: "none",
    stroke: tone(38, 25, 70, dark),
    "stroke-width": size * 0.06,
  });
  out += veil(w, h, time);
  if (lit) out += windows;
  const towers = gateTowers ? "four towers" : "two towers";
  const tops = roofs ? "pointed roofs" : "battlements";
  note.alt(`A storybook castle with ${towers}, ${tops} and flags on a hill${when(time)}`);
  note.focus(cx, top - size * 0.4);
  return out;
});

/** A stone arch bridge over a river, or a suspension bridge across a bay. */
export const bridge = defineKind("bridge", "Bridge", { style: ["stone", "suspension"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const style = g.option("style", g.pick(["stone", "suspension"] as const));
  const lit = time !== "day";
  const grass = g.f(85, 125);
  const waterPaint = time === "night" ? hsl(225, 35, 22) : time === "dusk" ? hsl(310, 22, 48) : hsl(205, 45, 60);
  let out = "";
  let lights = "";
  if (style === "stone") {
    const waterY = h * g.f(0.6, 0.66);
    const tall = Math.min(h * 0.3, unit * g.f(0.3, 0.36));
    const deckTop = waterY - tall;
    const parapet = tall * 0.12;
    const apex = deckTop + parapet + tall * 0.1;
    const spring = waterY - tall * 0.12;
    const ry = spring - apex;
    const rx = ry * g.f(0.95, 1.2);
    const pier = rx * g.f(0.3, 0.45);
    const arches = Math.max(1, Math.min(7, Math.floor((w * 0.8 + pier) / (2 * rx + pier))));
    const span = arches * 2 * rx + (arches - 1) * pier;
    const start = (w - span) / 2;
    const horizon = deckTop - h * g.f(0.04, 0.1);
    const shore = apex + ry * g.f(0.35, 0.55);
    out += skyAt(g, w, h, time, horizon);
    out += hill(g, w, h, horizon, h * g.f(0.03, 0.08), tone(grass + 15, 24, 60, dark));
    out += el("rect", { y: shore, width: w, height: h - shore, fill: waterPaint });
    // Trees along the far bank, their tops showing over the bridge.
    const leaf = tone(grass + 10, 36, 32, dark);
    let crowns = "";
    for (let x = g.f(-0.05, 0.05) * w; x < w; x += unit * g.f(0.08, 0.2)) {
      const r = unit * g.f(0.04, 0.07);
      crowns += dot(x, shore - (shore - deckTop) - r * g.f(-0.6, 0.6), r);
    }
    out += el("path", { d: crowns, fill: leaf });
    out += el("rect", { y: horizon + h * 0.02, width: w, height: shore - horizon - h * 0.02, fill: leaf });
    out += el("rect", { y: shore - unit * 0.01, width: w, height: unit * 0.012, fill: "#000", opacity: 0.15 });
    // The bridge: one body with the arches cut out, arch rings, and the parapet.
    const stonePaint = g.pick([
      [35, 15, 70],
      [28, 25, 62],
      [210, 6, 64],
      [15, 18, 66],
    ] as const);
    const body = tone(stonePaint[0], stonePaint[1], stonePaint[2], dark);
    let d = s`M-1 ${deckTop + parapet}H${w + 1}V${waterY + 1}H-1Z`;
    let rings = "";
    for (let k = 0; k < arches; k++) {
      const x0 = start + k * (2 * rx + pier);
      d += s`M${x0} ${waterY + 1}V${spring}A${rx} ${ry} 0 0 1 ${x0 + 2 * rx} ${spring}V${waterY + 1}Z`;
      const t = ry * 0.09;
      rings += s`M${x0 - t} ${spring}A${rx + t} ${ry + t} 0 0 1 ${x0 + 2 * rx + t} ${spring}`;
    }
    let bridge = el("path", { d, fill: body, "fill-rule": "evenodd" });
    bridge += el("path", {
      d: rings,
      fill: "none",
      stroke: tone(stonePaint[0], stonePaint[1], stonePaint[2] + 10, dark),
      "stroke-width": ry * 0.18,
      "stroke-dasharray": s`${ry * 0.08} ${ry * 0.04}`,
    });
    bridge += el("rect", { x: -1, y: deckTop, width: w + 2, height: parapet, fill: body });
    bridge += el("rect", {
      x: -1,
      y: deckTop - parapet * 0.15,
      width: w + 2,
      height: parapet * 0.3,
      fill: tone(stonePaint[0], stonePaint[1], stonePaint[2] + 12, dark),
    });
    bridge += el("rect", {
      x: -1,
      y: deckTop + parapet,
      width: w + 2,
      height: parapet * 0.25,
      fill: "#000",
      opacity: 0.12,
    });
    // Lamps along the parapet.
    const lamps = g.chance(lit ? 0.85 : 0.4);
    if (lamps) {
      let posts = "";
      for (let k = 0; k <= arches; k++) {
        const x = start + k * (2 * rx + pier) - pier / 2;
        if (x < 0 || x > w) continue;
        posts += s`M${x - unit * 0.004} ${deckTop}v${-tall * 0.28}h${unit * 0.008}v${tall * 0.28}Z`;
        lights += el("circle", {
          cx: x,
          cy: deckTop - tall * 0.3,
          r: unit * 0.012,
          fill: lit ? LIT : hsl(45, 20, 88),
        });
        if (lit) lights += el("circle", { cx: x, cy: deckTop - tall * 0.3, r: unit * 0.035, fill: LIT, opacity: 0.25 });
      }
      bridge += el("path", { d: posts, fill: tone(220, 10, 25, dark) });
    }
    // The bridge and its reflection.
    const id = g.id("bridge");
    const clip = g.id("clip");
    out += el("defs", {}, el("clipPath", { id: clip }, el("rect", { y: waterY, width: w, height: h - waterY })));
    out += el("g", { id }, bridge);
    out += el(
      "g",
      { "clip-path": `url(#${clip})`, opacity: 0.3 },
      el("use", { href: `#${id}`, transform: s`translate(0 ${2 * waterY}) scale(1 -1)` }),
    );
    let ripples = "";
    for (let k = g.i(5, 9); k > 0; k--)
      ripples += s`M${w * g.f(0, 1)} ${waterY + (h - waterY) * g.f(0.1, 0.95)}h${unit * g.f(0.04, 0.1)}`;
    out += el("path", { d: ripples, stroke: "#ffffff", opacity: 0.35, "stroke-width": unit * 0.006 });
    // The banks the bridge runs into, sloping from the road down to the water and the near corners.
    let banks = "";
    const edge = start - pier * 0.4;
    for (const dir of [-1, 1]) {
      const x0 = dir < 0 ? 0 : w;
      const toe = x0 - dir * Math.max(edge, unit * 0.06);
      banks += s`M${x0} ${deckTop + parapet}
                 Q${toe + dir * (toe - x0) * -0.1} ${deckTop + parapet} ${toe} ${waterY}
                 Q${toe - dir * unit * g.f(0, 0.1)} ${(waterY + h) / 2} ${x0 - dir * w * g.f(0.02, 0.12)} ${h}
                 H${x0}Z`;
    }
    out += el("path", { d: banks, fill: tone(grass, 40, 40, dark) });
    out += veil(w, h, time) + lights;
    const count =
      arches === 1 ? "a single arch" : arches < 4 ? `${["", "", "two", "three"][arches]} arches` : "many arches";
    note.alt(`A stone bridge with ${count} reflected in a calm river${when(time)}${lamps && lit ? ", lamps lit" : ""}`);
    note.focus(w / 2, apex);
    return out;
  }
  // A suspension bridge: far headlands, the bay, two towers and the cables.
  const horizon = h * g.f(0.52, 0.6);
  const deckY = horizon - unit * g.f(0.02, 0.08);
  const base = horizon + (h - horizon) * g.f(0.2, 0.35);
  const span = Math.min(w * g.f(0.45, 0.6), unit * g.f(1.1, 1.4));
  const t1 = w / 2 - span / 2 + w * g.f(-0.05, 0.05);
  const t2 = t1 + span;
  const towerH = Math.min(deckY - h * 0.08, unit * g.f(0.38, 0.5));
  const peak = deckY - towerH;
  out += skyAt(g, w, h, time, horizon);
  const land = tone(grass + 20, 20, 55, dark);
  out += el("path", {
    d: s`M0 ${horizon - h * g.f(0.04, 0.12)} Q ${w * g.f(0.05, 0.2)} ${horizon - h * g.f(0.1, 0.18)} ${w * g.f(0.3, 0.45)} ${horizon} H0Z`,
    fill: land,
  });
  out += el("path", {
    d: s`M${w} ${horizon - h * g.f(0.03, 0.1)} Q ${w * g.f(0.8, 0.95)} ${horizon - h * g.f(0.08, 0.15)} ${w * g.f(0.55, 0.7)} ${horizon} H${w}Z`,
    fill: tone(grass + 25, 16, 62, dark),
  });
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: waterPaint });
  const paint = g.pick([
    [210, 8, 70],
    [40, 15, 88],
    [180, 30, 40],
    [220, 25, 35],
  ] as const);
  const steel = tone(paint[0], paint[1], paint[2], dark);
  // Reflections of the towers.
  for (const tx of [t1, t2])
    out += el("rect", {
      x: tx - unit * 0.03,
      y: base,
      width: unit * 0.06,
      height: (h - base) * 0.8,
      fill: steel,
      opacity: 0.18,
    });
  const cableY = (x: number) => {
    if (x >= t1 && x <= t2) {
      const t = (x - t1) / span;
      const low = deckY - towerH * 0.06;
      const c = 2 * low - (peak + peak) / 2;
      return (1 - t) ** 2 * peak + 2 * t * (1 - t) * c + t * t * peak;
    }
    // The side spans fall to the deck half a span out.
    const t = Math.min(1, Math.abs(x < t1 ? t1 - x : x - t2) / (span / 2));
    const c = (peak + deckY) / 2 + towerH * 0.12;
    return (1 - t) ** 2 * peak + 2 * t * (1 - t) * c + t * t * deckY;
  };
  let cable = "";
  for (let k = 0; k <= 40; k++) {
    const x = t1 - span / 2 + (2 * span * k) / 40;
    cable += s`${k ? "L" : "M"}${x} ${cableY(x)}`;
  }
  let hangers = "";
  for (let x = t1 - span / 2; x < t2 + span / 2; x += unit * 0.025)
    if (Math.abs(x - t1) > unit * 0.02 && Math.abs(x - t2) > unit * 0.02) hangers += s`M${x} ${cableY(x)}V${deckY}`;
  out += el("path", { d: hangers, stroke: steel, "stroke-width": unit * 0.003 });
  out += el("path", { d: cable, fill: "none", stroke: steel, "stroke-width": unit * 0.008 });
  // Piers holding the approaches.
  const deck = unit * 0.03;
  let piers = "";
  for (const dir of [-1, 1])
    for (let x = (dir < 0 ? t1 : t2) + dir * span * 0.25; x > -unit * 0.1 && x < w + unit * 0.1; x += dir * span * 0.25)
      piers += s`M${x - unit * 0.012} ${deckY}h${unit * 0.024}V${base}h${-unit * 0.024}Z`;
  out += el("path", { d: piers, fill: tone(paint[0], paint[1] * 0.4, paint[2] * 0.8, dark) });
  out += el("rect", { x: -1, y: deckY, width: w + 2, height: deck, fill: tone(220, 8, 34, dark) });
  out += el("rect", { x: -1, y: deckY - deck * 0.2, width: w + 2, height: deck * 0.45, fill: steel });
  // The towers: two legs joined by cross beams.
  let towers = "";
  const legW = unit * 0.016;
  const gap = unit * 0.045;
  for (const tx of [t1, t2]) {
    for (const dir of [-1, 1])
      towers += s`M${tx + (dir * gap) / 2 - legW / 2} ${peak - unit * 0.01}h${legW}V${base}h${-legW}Z`;
    for (const y of [peak, peak + (deckY - peak) * 0.35, peak + (deckY - peak) * 0.7, deckY + deck])
      towers += s`M${tx - gap / 2} ${y}h${gap}v${unit * 0.014}h${-gap}Z`;
  }
  out += el("path", { d: towers, fill: steel });
  out += el("rect", {
    x: t1 - gap,
    y: base - unit * 0.01,
    width: gap * 2,
    height: unit * 0.02,
    fill: tone(30, 8, 45, dark),
  });
  out += el("rect", {
    x: t2 - gap,
    y: base - unit * 0.01,
    width: gap * 2,
    height: unit * 0.02,
    fill: tone(30, 8, 45, dark),
  });
  if (lit) {
    const beads: Point[] = [];
    for (let x = g.f(0, unit * 0.05); x < w; x += unit * 0.05) beads.push([x, deckY + deck * 0.3]);
    lights += dots(beads, unit * 0.005, LIT);
    let glints = "";
    for (let x = g.f(0, unit * 0.1); x < w; x += unit * g.f(0.08, 0.14))
      glints += s`M${x} ${base + (h - base) * g.f(0.1, 0.6)}h${unit * g.f(0.02, 0.05)}`;
    lights += el("path", { d: glints, stroke: LIT, opacity: 0.4, "stroke-width": unit * 0.005 });
    lights += el("circle", { cx: t1, cy: peak - unit * 0.012, r: unit * 0.006, fill: hsl(0, 90, 60) });
    lights += el("circle", { cx: t2, cy: peak - unit * 0.012, r: unit * 0.006, fill: hsl(0, 90, 60) });
  }
  out += veil(w, h, time) + lights;
  note.alt(`A suspension bridge across a bay${when(time)}${lit ? ", its deck lights glowing" : ""}`);
  note.focus((t1 + t2) / 2, (peak + deckY) / 2);
  return out;
});

/** A terrace of narrow townhouses side by side, of varied heights, with doors up front steps. */
export const rowHouses = defineKind("row-houses", "Row houses", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const lit = time !== "day";
  const street = h * g.f(0.84, 0.88);
  const floor = Math.min(h * 0.17, unit * 0.16);
  let out = skyAt(g, w, h, time, street);
  const maxFloors = Math.max(2, Math.min(4, Math.floor((street - h * 0.14 - floor * 0.6) / floor)));
  const style = g.pick(["mixed", "gable", "cornice"] as const);
  const trim = tone(40, 20, 94, dark);
  // Windows, sills, doors and steps are gathered into a few paths, drawn after the fronts, with
  // whole-pixel corners to keep the markup short.
  const r = Math.round;
  const box = (x: number, y: number, bw: number, bh: number) => `M${r(x)} ${r(y)}h${r(bw)}v${r(bh)}h${-r(bw)}Z`;
  const cross = (x: number, y: number, bw: number, bh: number) =>
    `M${r(x + bw / 2)} ${r(y)}v${r(bh)}M${r(x)} ${r(y + bh * 0.45)}h${r(bw)}`;
  const glass = { day: "", dim: "", lit: "" };
  const bars = { trim: "", lit: "" };
  let trims = "";
  let doors = "";
  let stairs = "";
  let seams = "";
  const knobs: Point[] = [];
  let litCount = 0;
  const window = (x: number, y: number, bw: number, bh: number, chance: number) => {
    const on = lit && g.chance(chance);
    if (on) litCount++;
    if (on) glass.lit += box(x, y, bw, bh);
    else if (lit) glass.dim += box(x, y, bw, bh);
    else glass.day += box(x, y, bw, bh);
    if (on) bars.lit += cross(x, y, bw, bh);
    else bars.trim += cross(x, y, bw, bh);
  };
  // Upper-floor windows repeat in a tile, one column wide and one floor tall, filled over each
  // house's upper floors. Houses are whole numbers of tiles wide, so the tiles line up in every one.
  const tile = floor * 0.42 * Math.min(1.3, Math.max(1, w / h / 2.5));
  const ww = floor * 0.25;
  let x = -tile * g.f(0, 1.5);
  const tiles = g.id("windows");
  const tileGlass = (paint: string, bar: string) =>
    el("rect", { x: (tile - ww) / 2, y: floor * 0.22, width: ww, height: floor * 0.52, fill: paint }) +
    el("path", {
      d: s`M${tile / 2} ${floor * 0.22}v${floor * 0.52}M${(tile - ww) / 2} ${floor * 0.454}h${ww}`,
      stroke: bar,
      "stroke-width": floor * 0.03,
    });
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id: tiles, width: tile, height: floor, patternUnits: "userSpaceOnUse", x: x + tile / 2, y: street },
      tileGlass(lit ? UNLIT : GLASS, trim),
      el("rect", {
        x: (tile - ww) / 2 - tile * 0.04,
        y: floor * 0.74,
        width: ww + tile * 0.08,
        height: floor * 0.05,
        fill: trim,
      }),
    ),
  );
  let grids = "";
  let hue = g.f(0, 360);
  let houses = 0;
  let middle: Point = [w / 2, street - floor * 2];
  while (x < w) {
    houses++;
    // Two or three columns of windows; more often three in wide pictures, to keep the count down.
    const cols = g.chance(w > h * 2 ? 0.85 : 0.5) ? 3 : 2;
    const hw = (cols + 1) * tile;
    const floors = g.i(Math.max(2, maxFloors - 1), maxFloors);
    const top = street - floors * floor;
    hue = (hue + g.f(50, 140)) % 360;
    const body = tone(hue, g.f(35, 55), g.f(64, 78), dark);
    const roofKind = style === "mixed" ? g.pick(["gable", "cornice", "step"] as const) : style;
    // The front, with a gable, stepped gable or a cornice (and maybe a chimney) on top.
    let front = s`M${x} ${street}V${top}`;
    if (roofKind === "gable") {
      front += s`L${x + hw / 2} ${top - hw * 0.42}L${x + hw} ${top}`;
      window(x + hw * 0.42, top - hw * 0.25, hw * 0.16, hw * 0.16, 0.3);
    } else if (roofKind === "step") {
      const st = hw / 6;
      const rise = floor * 0.18;
      front += s`v${-rise}h${st}v${-rise}h${st}v${-rise}h${st * 2}v${rise}h${st}v${rise}h${st}`;
    } else {
      front += s`H${x + hw}`;
      trims += box(x - hw * 0.02, top - floor * 0.1, hw * 1.04, floor * 0.16);
      if (g.chance(0.5))
        out += el("rect", {
          x: x + hw * g.f(0.1, 0.6),
          y: top - floor * 0.35,
          width: hw * 0.16,
          height: floor * 0.4,
          fill: tone(15, 30, 40, dark),
        });
    }
    out += el("path", { d: front + s`V${street}Z`, fill: body });
    seams += s`M${x + hw} ${top}V${street}`;
    // Windows on the upper floors, some lit over the tiles at dusk.
    grids += box(x + tile / 2, top, cols * tile, (floors - 1) * floor);
    if (lit)
      for (let f = 1; f < floors; f++)
        for (let c = 0; c < cols; c++)
          if (g.chance(0.4)) {
            litCount++;
            const wx = x + tile / 2 + c * tile + (tile - ww) / 2;
            const wy = street - (f + 1) * floor + floor * 0.22;
            glass.lit += box(wx, wy, ww, floor * 0.52);
            bars.lit += cross(wx, wy, ww, floor * 0.52);
          }
    // The front door up a few steps, and a window beside it.
    const left = g.chance(0.5);
    const steps = g.i(1, 3);
    const stepH = floor * 0.06;
    const dw = hw * 0.26;
    const dx = left ? x + hw * 0.12 : x + hw * 0.88 - dw;
    const dh = floor * 0.68;
    const sill = street - steps * stepH;
    trims += box(dx - hw * 0.04, sill - dh - floor * 0.04, dw + hw * 0.08, dh + floor * 0.04);
    doors += el("path", {
      d: box(dx, sill - dh, dw, dh),
      fill: tone(g.pick([0, 45, 140, 210, 270, 20]), g.f(40, 60), g.f(28, 42), dark),
    });
    knobs.push([left ? dx + dw * 0.78 : dx + dw * 0.22, sill - dh * 0.45]);
    for (let k = 0; k < steps; k++) {
      const grow = (steps - k) * hw * 0.03;
      stairs += box(dx - hw * 0.03 - grow, street - (k + 1) * stepH, dw + hw * 0.06 + grow * 2, stepH);
    }
    const gw = hw * 0.32;
    const gx = left ? x + hw * 0.88 - gw : x + hw * 0.12;
    trims += box(gx - hw * 0.02, street - floor * 0.3, gw + hw * 0.04, floor * 0.05);
    window(gx, street - floor * 0.78, gw, floor * 0.48, 0.6);
    if (Math.abs(x + hw / 2 - w / 2) < hw / 2) middle = [x + hw / 2, (top + street) / 2];
    x += hw;
  }
  const barWidth = floor * 0.03;
  out += el("path", { d: seams, stroke: "#000", opacity: 0.12, "stroke-width": 1.5 });
  out +=
    el("path", { d: grids, fill: `url(#${tiles})` }) +
    el("path", { d: trims, fill: trim }) +
    doors +
    dots(knobs, floor * 0.025, hsl(45, 60, 60));
  out += el("path", { d: stairs, fill: tone(30, 8, 72, dark), stroke: tone(30, 8, 55, dark), "stroke-width": 0.6 });
  if (glass.day) out += el("path", { d: glass.day, fill: GLASS });
  if (glass.dim) out += el("path", { d: glass.dim, fill: UNLIT });
  if (bars.trim) out += el("path", { d: bars.trim, stroke: trim, "stroke-width": barWidth });
  // The pavement and the road.
  const kerb = street + (h - street) * 0.5;
  out += el("rect", { y: street, width: w, height: kerb - street, fill: tone(30, 6, 70, dark) });
  out += el("rect", { y: kerb, width: w, height: h - kerb, fill: tone(220, 8, 32, dark) });
  out += el("rect", { y: kerb, width: w, height: unit * 0.008, fill: tone(30, 6, 82, dark) });
  out += veil(w, h, time);
  if (glass.lit) out += el("path", { d: glass.lit, fill: LIT });
  if (bars.lit) out += el("path", { d: bars.lit, stroke: BAR, "stroke-width": barWidth });
  const many = houses > 8 ? "A long terrace of" : "A terrace of";
  const kind =
    style === "gable"
      ? "gabled townhouses"
      : style === "cornice"
        ? "townhouses with cornices"
        : "townhouses of varied heights";
  const windows = lit ? (litCount ? ", some windows lit" : "") : "";
  note.alt(`${many} narrow ${kind} with front steps${when(time)}${windows}`);
  note.focus(middle[0], middle[1]);
  return out;
});

/** A glass greenhouse full of plants, in a garden with beds and a path. */
export const greenhouse = defineKind("greenhouse", "Greenhouse", { roof: ["gable", "arched"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const lit = time !== "day";
  const roof = g.option("roof", g.pick(["gable", "arched"] as const));
  const ground = h * g.f(0.66, 0.72);
  const size = Math.min(unit * 0.7, w * 0.5, (ground - h * 0.07) / 0.88);
  const cx = w * g.f(0.42, 0.58);
  const grass = g.f(85, 125);
  let out = skyAt(g, w, h, time, ground);
  out += hill(g, w, h, ground - h * g.f(0.05, 0.12), h * g.f(0.02, 0.06), tone(grass + 12, 26, 60, dark));
  // A hedge behind, then the lawn.
  const hedge = tone(grass + 10, 36, 30, dark);
  const bumps: Point[] = [];
  for (let x = -unit * 0.02; x < w + unit * 0.05; x += unit * g.f(0.05, 0.08))
    bumps.push([x, ground - unit * g.f(0.045, 0.055)]);
  out += dots(bumps, unit * 0.05, hedge);
  out += el("rect", { y: ground - unit * 0.05, width: w, height: unit * 0.05 + 1, fill: hedge });
  out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 40, 46, dark) });
  out += veil(w, h, time);
  const u = local(cx, ground, size);
  const shape =
    roof === "gable"
      ? "M -0.5 0 V -0.5 L 0 -0.84 L 0.5 -0.5 V 0 Z"
      : "M -0.5 0 V -0.45 A 0.5 0.4 0 0 1 0.5 -0.45 V 0 Z";
  const roofAt = (x: number) =>
    roof === "gable" ? -0.5 - 0.34 * (1 - Math.abs(x) / 0.5) : -0.45 - 0.4 * Math.sqrt(Math.max(0, 1 - (x / 0.5) ** 2));
  const clip = g.id("glass");
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: u.d(shape) })));
  out += u.ellipse(0, 0, 0.62, 0.04, { fill: "#000", opacity: 0.15 });
  // Inside: the far glass, tall plants, a bench of potted plants.
  const shadeIn = lit ? 0.6 : dark;
  let inside = el("path", { d: u.d(shape), fill: lit ? hsl(44, 80, 78) : tone(185, 30, 86, dark) });
  const leafHue = grass + g.f(-10, 20);
  // A pointed leaf from base (bx, by) to tip (tx, ty), `wd` wide, arched sideways by `bend`.
  const leaf = (bx: number, by: number, tx: number, ty: number, wd: number, bend = 0) => {
    const len = Math.hypot(tx - bx, ty - by);
    const nx = -(ty - by) / len;
    const ny = (tx - bx) / len;
    const mx = (bx + tx) / 2;
    const my = (by + ty) / 2;
    return u.d(
      `M ${bx} ${by} Q ${mx + nx * (bend + wd)} ${my + ny * (bend + wd)} ${tx} ${ty} Q ${mx + nx * (bend - wd)} ${my + ny * (bend - wd)} ${bx} ${by} Z`,
    );
  };
  // Two or three tall plants growing up behind the bench: tomatoes on canes, fronds or broad leaves.
  const count = g.i(2, 3);
  const kinds: string[] = [];
  const fruits: Point[] = [];
  let canes = "";
  for (let k = 0; k < count; k++) {
    const x = (count === 2 ? -0.25 + k * 0.5 : -0.33 + k * 0.33) + g.f(-0.04, 0.04);
    const kind = g.pick(["tomato", "fronds", "broad"] as const);
    kinds.push(kind);
    let d = "";
    if (kind === "tomato") {
      const top = -g.f(0.55, 0.68);
      canes += `M ${x} -0.14 V ${top} `;
      for (let j = 0; j < 6; j++) {
        const y = -0.2 + ((top + 0.06 + 0.2) * j) / 5;
        const side = j % 2 ? 1 : -1;
        d += leaf(x, y, x + side * 0.11, y - 0.05, 0.03, side * 0.01);
        if (j % 2 === 0 && j < 5) fruits.push([u.x(x - side * 0.03), u.y(y + 0.03)]);
      }
    } else if (kind === "fronds") {
      const fronds = g.i(5, 7);
      const reach = g.f(0.28, 0.38);
      for (let j = 0; j < fronds; j++) {
        const angle = Math.PI * (1.1 + (0.8 * (j + 0.5)) / fronds);
        const tx = x + Math.cos(angle) * reach;
        const ty = -0.2 + Math.sin(angle) * reach;
        d += leaf(x, -0.2, tx, ty, 0.03, (Math.cos(angle) < 0 ? 1 : -1) * 0.05);
      }
    } else {
      const leaves = g.i(4, 5);
      for (let j = 0; j < leaves; j++) {
        const angle = Math.PI * (1.15 + (0.7 * (j + 0.5)) / leaves);
        const sx = x + Math.cos(angle) * 0.1;
        const sy = -0.22 + Math.sin(angle) * 0.14;
        canes += `M ${x} -0.18 L ${sx} ${sy} `;
        d += leaf(sx, sy, sx + Math.cos(angle) * 0.2, sy + Math.sin(angle) * 0.2, 0.065);
      }
    }
    inside += el("path", { d, fill: tone(leafHue + k * 10, 40, 32 + (k % 2) * 8, shadeIn) });
  }
  if (canes) inside += u.path(canes, { stroke: tone(30, 30, 40, shadeIn), "stroke-width": u.k(0.012) });
  if (fruits.length) inside += dots(fruits, size * 0.02, tone(g.pick([4, 12]), 75, 52, shadeIn / dark));
  // The bench and its pots, each with a few small leaves.
  inside += u.rect(-0.5, -0.24, 1, 0.025, { fill: tone(28, 35, 34, shadeIn) });
  let pots = "";
  let sprigs = "";
  for (let x = -0.42; x < 0.42; x += g.f(0.13, 0.17)) {
    if (Math.abs(x) < 0.14) continue;
    pots += u.d(`M ${x - 0.035} -0.31 H ${x + 0.035} L ${x + 0.027} -0.24 H ${x - 0.027} Z`);
    sprigs += leaf(x, -0.31, x - 0.06, -0.37, 0.018) + leaf(x, -0.31, x + 0.06, -0.37, 0.018);
    sprigs += leaf(x, -0.31, x + g.f(-0.01, 0.01), -0.4, 0.02);
  }
  inside += el("path", { d: sprigs, fill: tone(leafHue + 20, 42, 42, shadeIn) });
  inside += el("path", { d: pots, fill: tone(16, 50, 48, shadeIn) });
  out += el("g", { "clip-path": `url(#${clip})` }, inside);
  // The glass over it, with a highlight.
  out += el("path", { d: u.d(shape), fill: hsl(190, 40, 92), opacity: lit ? 0.12 : 0.25 });
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    u.path("M -0.42 0 L -0.02 -0.9 L 0.08 -0.9 L -0.32 0 Z M -0.22 0 L 0.18 -0.9 L 0.22 -0.9 L -0.18 0 Z", {
      fill: "#ffffff",
      opacity: 0.18,
    }),
  );
  // The low brick wall, split by the door.
  const brick = tone(g.f(5, 22), 40, 46, dark);
  out += u.rect(-0.52, -0.14, 0.41, 0.14, { fill: brick });
  out += u.rect(0.11, -0.14, 0.41, 0.14, { fill: brick });
  out += u.path("M -0.52 -0.07 H -0.11 M 0.11 -0.07 H 0.52", {
    stroke: "#000",
    opacity: 0.15,
    "stroke-width": u.k(0.006),
  });
  // The frame: outline, glazing bars, the door.
  const metal = g.chance(0.6) ? tone(40, 15, 95, dark) : tone(150, 20, 24, dark);
  const bays = g.i(3, 4) * 2;
  let bars = "M -0.5 -0.14 H 0.5 ";
  bars += roof === "gable" ? "M -0.5 -0.5 H 0.5 " : "M -0.5 -0.45 H 0.5 ";
  for (let k = 1; k < bays; k++) {
    const x = -0.5 + k / bays;
    bars += `M ${x} -0.14 V ${roofAt(x)} `;
  }
  bars += "M -0.11 0 V -0.4 H 0.11 V 0 M -0.11 -0.2 H 0.11 ";
  out += u.path(bars, { fill: "none", stroke: metal, "stroke-width": u.k(0.014) });
  out += u.path(shape, { fill: "none", stroke: metal, "stroke-width": u.k(0.024), "stroke-linejoin": "round" });
  out += u.circle(0.08, -0.2, 0.012, { fill: hsl(45, 60, 60) });
  if (roof === "gable") out += u.rect(-0.015, -0.9, 0.03, 0.07, { fill: metal });
  // Glow spilling from the open door at dusk.
  if (lit) out += u.path("M -0.11 0 H 0.11 L 0.2 0.2 H -0.2 Z", { fill: LIT, opacity: 0.2 });
  // The path to the door, and beds either side of it.
  const top = u.x(0);
  const foot = top + size * g.f(-0.2, 0.2);
  const wide = size * 0.22;
  out += el("path", {
    d: s`M${top - size * 0.1} ${ground}L${foot - wide} ${h}H${foot + wide}L${top + size * 0.1} ${ground}Z`,
    fill: g.chance(0.5) ? tone(18, 35, 55, dark) : tone(35, 20, 74, dark),
  });
  const veg = g.chance(0.5);
  let beds = "";
  const rows: Point[][] = [[], []];
  const flowerSpots: Point[] = [];
  for (const dir of [-1, 1]) {
    const y0 = ground + (h - ground) * 0.3;
    const y1 = ground + (h - ground) * g.f(0.7, 0.85);
    const near = (y: number) =>
      top +
      (foot - top) * ((y - ground) / (h - ground)) +
      dir * (size * 0.1 + (wide - size * 0.1) * ((y - ground) / (h - ground)) + size * 0.06);
    const bw = size * g.f(0.45, 0.6);
    const a0 = near(y0);
    const a1 = near(y1);
    beds += s`M${a0} ${y0}L${a0 + dir * bw} ${y0}L${a1 + dir * bw * 1.15} ${y1}L${a1} ${y1}Z`;
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.5) / 3;
      const y = y0 + (y1 - y0) * t;
      const x0 = a0 + (a1 - a0) * t;
      const span = bw * (1 + 0.15 * t);
      for (let j = 0; j < 6; j++) {
        const xx = x0 + dir * span * ((j + 0.5) / 6);
        rows[k < 1 ? 0 : 1].push([xx, y]);
        if (!veg) flowerSpots.push([xx + g.f(-1, 1), y - size * 0.02]);
      }
    }
  }
  out += el("path", { d: beds, fill: tone(25, 35, 28, dark) });
  const leafy = tone(grass + 15, 45, 38, dark);
  out += dots(rows[0], size * 0.024, leafy) + dots(rows[1], size * 0.03, leafy);
  if (flowerSpots.length) out += blossoms(g, flowerSpots, size * 0.02, FLOWERS);
  note.alt(
    `A ${roof === "arched" ? "round-roofed " : ""}glass greenhouse full of ${kinds.includes("tomato") ? "tomato vines and potted plants" : "leafy plants"}, with ${veg ? "vegetable" : "flower"} beds by the path${when(time)}${lit ? ", lit from inside" : ""}`,
  );
  note.focus(cx, ground - size * 0.4);
  return out;
});
