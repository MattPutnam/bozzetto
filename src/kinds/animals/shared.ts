/** Helpers shared by several animals kinds. */
import { el, fill, hsl, lin, type Notes, type Point, pts, qpt, type Rand, s } from "../../draw/core";

// Scenery and shapes shared by the larger mammals below.

/** Where an x drawn inside `facing(cx, dir)` ends up. */
export const flipX = (cx: number, dir: number, x: number): number => cx + dir * (x - cx);

/** Reports a head frame measured inside `facing(cx, dir)`, flipped the same way. */
export function flipFrame(note: Notes, cx: number, dir: number, x: number, y: number, fw: number, fh: number): void {
  note.frame(dir > 0 ? x : 2 * cx - x - fw, y, fw, fh);
}

/** A straight limb: a thick line with round ends. */
export const limb = (x1: number, y1: number, x2: number, y2: number, width: number, paint: string): string =>
  el("path", { d: s`M ${x1} ${y1} L ${x2} ${y2}`, stroke: paint, "stroke-width": width, "stroke-linecap": "round" });

/** A bent limb from (x1, y1) through control (qx, qy) to (x2, y2), with a round paw at the end. */
export function arm(
  x1: number,
  y1: number,
  qx: number,
  qy: number,
  x2: number,
  y2: number,
  width: number,
  paint: string,
): string {
  return (
    el("path", {
      d: s`M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`,
      stroke: paint,
      "stroke-width": width,
      "stroke-linecap": "round",
      fill: "none",
    }) + el("ellipse", { cx: x2, cy: y2, rx: width * 0.62, ry: width * 0.55, fill: paint })
  );
}

/**
 * Path data for a tube along a quadratic curve, `w0` wide at p0 and `w1` at p2, with round ends.
 * Fewer `steps` keep straight or gently bent tubes small.
 */
export function tube(p0: Point, p1: Point, p2: Point, w0: number, w1: number, steps = 8): string {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const [x, y] = qpt(p0, p1, p2, t);
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * t) / 2;
    left.push([x - (dy / len) * half, y + (dx / len) * half]);
    right.push([x + (dy / len) * half, y - (dx / len) * half]);
  }
  const line = (ps: Point[]) => ps.map(p => s`L ${p[0]} ${p[1]}`).join(" ");
  const end = right[steps];
  return (
    s`M ${left[0][0]} ${left[0][1]} ${line(left.slice(1))}` +
    s` A ${w1 / 2} ${w1 / 2} 0 0 0 ${end[0]} ${end[1]} ${line(right.reverse().slice(1))}` +
    s` A ${w0 / 2} ${w0 / 2} 0 0 0 ${left[0][0]} ${left[0][1]} Z`
  );
}

/** Path data for a narrow leaf from its stem at (x, y), pointing `angle` degrees, `len` long. */
export function leafShape(x: number, y: number, angle: number, len: number, thin: number): string {
  const ux = Math.cos((angle * Math.PI) / 180);
  const uy = Math.sin((angle * Math.PI) / 180);
  const mx = x + ux * len * 0.5;
  const my = y + uy * len * 0.5;
  const nx = -uy * len * thin;
  const ny = ux * len * thin;
  return s`M ${x} ${y} Q ${mx + nx} ${my + ny} ${x + ux * len} ${y + uy * len} Q ${mx - nx} ${my - ny} ${x} ${y} Z `;
}

/** Path data for a woolly outline: arcs bulging out between points around an ellipse. */
export function fluff(cx: number, cy: number, rx: number, ry: number, bumps: number, phase: number): string {
  const ring: Point[] = [];
  for (let k = 0; k < bumps; k++) {
    const angle = phase + (k / bumps) * Math.PI * 2;
    ring.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  let d = s`M ${ring[0][0]} ${ring[0][1]}`;
  for (let k = 0; k < bumps; k++) {
    const [x0, y0] = ring[k];
    const [x1, y1] = ring[(k + 1) % bumps];
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.6;
    d += s` A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  }
  return d + " Z";
}

/** A sky over a far hill, and level ground from the horizon down. `ground` is [hue, saturation, lightness]. */
export function field(
  g: Rand,
  w: number,
  h: number,
  hz: number,
  skyHue: number,
  ground: readonly number[],
  behind = "",
): string {
  const sky = g.id("sky");
  const [gh, gs, gl] = ground;
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 76), hsl(skyHue - 15, 50, 93)])) + fill(w, h, `url(#${sky})`);
  out += behind;
  // A far hill on the horizon
  out += el("ellipse", {
    cx: w * g.f(0.1, 0.9),
    cy: hz,
    rx: w * g.f(0.4, 0.7),
    ry: hz * g.f(0.12, 0.25),
    fill: hsl(gh, gs - 8, gl + (gl > 80 ? -5 : 9)),
  });
  // Ground
  out += el("rect", { y: hz, width: w, height: h - hz, fill: hsl(gh, gs, gl) });
  return out;
}

/** A pine tree standing at (x, base). */
export function pine(x: number, base: number, tall: number, paint: string): string {
  const half = tall * 0.24;
  const top = base - tall;
  const right: Point[] = [
    [x, top],
    [x + half * 0.5, top + tall * 0.3],
    [x + half * 0.25, top + tall * 0.3],
    [x + half * 0.8, top + tall * 0.58],
    [x + half * 0.4, top + tall * 0.58],
    [x + half, top + tall * 0.86],
  ];
  const left = right
    .slice(1)
    .reverse()
    .map(([px, py]): Point => [2 * x - px, py]);
  return (
    el("rect", { x: x - half * 0.1, y: top + tall * 0.8, width: half * 0.2, height: tall * 0.2, fill: "#5a4030" }) +
    el("polygon", { points: pts([...right, ...left]), fill: paint })
  );
}

/** A flat-topped acacia tree standing at (x, base). */
export function acacia(x: number, base: number, tall: number, leaves: string): string {
  return (
    el("path", {
      d: s`M ${x} ${base} L ${x} ${base - tall * 0.55} L ${x - tall * 0.28} ${base - tall * 0.86}
           M ${x} ${base - tall * 0.55} L ${x + tall * 0.3} ${base - tall * 0.88}`,
      stroke: "#5a4632",
      "stroke-width": tall * 0.05,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "none",
    }) +
    el("ellipse", { cx: x, cy: base - tall * 0.9, rx: tall * 0.55, ry: tall * 0.12, fill: leaves }) +
    el("ellipse", { cx: x + tall * 0.08, cy: base - tall * 0.98, rx: tall * 0.34, ry: tall * 0.08, fill: leaves })
  );
}

/** Golden grassland under a sun, with a far acacia tree. */
export function savanna(g: Rand, w: number, h: number, hz: number, dusk: boolean): string {
  const size = Math.min(w, h);
  const sun = el("circle", {
    cx: w * g.f(0.1, 0.9),
    cy: hz * g.f(0.3, 0.7),
    r: size * g.f(0.06, 0.09),
    fill: dusk ? "#f6a04e" : "#fff4c8",
    opacity: "0.9",
  });
  let out = field(g, w, h, hz, dusk ? g.f(25, 40) : g.f(190, 210), [g.f(38, 50), 45, g.f(58, 66)], sun);
  // A far acacia
  out += acacia(w * g.f(0.05, 0.95), hz + (h - hz) * 0.06, size * g.f(0.22, 0.3), hsl(g.f(80, 110), 30, 38));
  return out;
}

/** A rail fence across the picture, its posts standing on y. */
export function fence(w: number, y: number, tall: number, paint: string): string {
  let d = "";
  for (let x = tall * 0.4; x < w; x += tall * 1.6) d += s`M ${x} ${y} v ${-tall} h ${tall * 0.14} v ${tall} Z `;
  d += s`M 0 ${y - tall * 0.8} h ${w} v ${tall * 0.1} h ${-w} Z M 0 ${y - tall * 0.45} h ${w} v ${tall * 0.1} h ${-w} Z`;
  return el("path", { d, fill: paint });
}

// Shapes shared by the hoofed animals below.

/**
 * Points on a head that runs from the poll `p` toward the muzzle at `a` degrees from straight down
 * (90 is level, pointing forward): `t` along the head and `k` out toward the forehead side.
 */
export function headAxis(p: Point, a: number): (t: number, k: number) => Point {
  const ux = Math.sin((a * Math.PI) / 180);
  const uy = Math.cos((a * Math.PI) / 180);
  return (t, k) => [p[0] + ux * t + uy * k, p[1] + uy * t - ux * k];
}

/** The bounds of some points, padded by `pad`, as [x, y, width, height]. */
export function bounds(points: readonly Point[], pad: number): [number, number, number, number] {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return [x, y, Math.max(...xs) + pad - x, Math.max(...ys) + pad - y];
}

/**
 * A hoofed leg: a tapering upper leg from `top` to the knee or hock, a slim lower leg to `foot`,
 * then a hoof. `sock` paints the lower part (`sockLen` of it, from the hoof up) in another color.
 */
export function hoofLeg(
  top: Point,
  knee: Point,
  foot: Point,
  w0: number,
  w1: number,
  paint: string,
  hoof: string,
  hoofLen: number,
  sock = "",
  sockLen = 0.5,
): string {
  const dx = foot[0] - knee[0];
  const dy = foot[1] - knee[1];
  const len = Math.hypot(dx, dy) || 1;
  // The upper leg: a quad tapering from w0 at the top to the lower leg's width at the knee
  const ul = Math.hypot(knee[0] - top[0], knee[1] - top[1]) || 1;
  const nx = (knee[1] - top[1]) / ul;
  const ny = -(knee[0] - top[0]) / ul;
  const a0 = w0 / 2;
  const a1 = (w1 * 1.2) / 2;
  let out = el("polygon", {
    points: pts([
      [top[0] + nx * a0, top[1] + ny * a0],
      [knee[0] + nx * a1, knee[1] + ny * a1],
      [knee[0] - nx * a1, knee[1] - ny * a1],
      [top[0] - nx * a0, top[1] - ny * a0],
    ]),
    fill: paint,
  });
  out += el("circle", { cx: knee[0], cy: knee[1], r: a1, fill: paint });
  out += limb(knee[0], knee[1], foot[0], foot[1], w1, paint);
  if (sock) out += limb(foot[0] - dx * sockLen, foot[1] - dy * sockLen, foot[0], foot[1], w1 * 1.04, sock);
  out += el("path", {
    d: s`M ${foot[0]} ${foot[1]} L ${foot[0] + (dx / len) * hoofLen} ${foot[1] + (dy / len) * hoofLen}`,
    stroke: hoof,
    "stroke-width": w1 * 1.2,
  });
  return out;
}

/** Grass flowers scattered over the ground below the horizon. */
export function meadowFlowers(g: Rand, w: number, h: number, hz: number, size: number): string {
  let out = "";
  for (let k = g.i(4, 9); k > 0; k--)
    out += el("circle", {
      cx: w * g.f(0, 1),
      cy: hz + (h - hz) * g.f(0.3, 1),
      r: size * 0.008,
      fill: g.pick(["#ffffff", "#f6d25c", "#f4a3c0"]),
    });
  return out;
}

/** Where x lands once a figure drawn facing right around cx is turned to face `dir`. */
export const turn = (cx: number, dir: number, x: number): number => cx + dir * (x - cx);

/** The left edge of a box of width `bw` starting at x, after turning about cx. */
export const turnBox = (cx: number, dir: number, x: number, bw: number): number => (dir > 0 ? x : 2 * cx - x - bw);

/** A sky gradient filling the picture, light at the bottom. */
export function sky(g: Rand, w: number, h: number, hue: number): string {
  const id = g.id("sky");
  return el("defs", {}, lin(id, [hsl(hue, 50, 76), hsl(hue - 15, 55, 93)])) + fill(w, h, `url(#${id})`);
}

/** A flower on a stem, its face tipped up toward the sky. Returns the markup. */
export function flower(
  g: Rand,
  x: number,
  base: number,
  top: number,
  r: number,
  petal: string,
  middle: string,
): string {
  const bend = g.f(-1, 1) * r * 0.6;
  const leafY = base - (base - top) * g.f(0.3, 0.5);
  const leafSide = g.pick([-1, 1]);
  const green = hsl(g.f(95, 130), 40, g.f(32, 42));
  // Stem and a leaf.
  let out = el("path", {
    d: s`M ${x} ${base} Q ${x + bend} ${(base + top) / 2} ${x} ${top}`,
    stroke: green,
    "stroke-width": Math.max(1.5, r * 0.14),
    fill: "none",
  });
  out += el("ellipse", {
    cx: x + bend * 0.5 + leafSide * r * 0.45,
    cy: leafY,
    rx: r * 0.5,
    ry: r * 0.17,
    fill: green,
    transform: s`rotate(${leafSide * -30} ${x + bend * 0.5 + leafSide * r * 0.45} ${leafY})`,
  });
  // Petals and middle, squashed so the face tips up.
  const count = g.i(5, 8);
  const turnBy = g.f(0, Math.PI);
  let petals = "";
  for (let k = 0; k < count; k++) {
    const a = turnBy + (k / count) * Math.PI * 2;
    const px = x + Math.cos(a) * r * 0.55;
    const py = top + Math.sin(a) * r * 0.55;
    petals += el("ellipse", {
      cx: px,
      cy: py,
      rx: r * 0.5,
      ry: r * 0.27,
      transform: s`rotate(${(a * 180) / Math.PI} ${px} ${py})`,
    });
  }
  out += el("g", { fill: petal, transform: s`translate(0 ${top}) scale(1 0.55) translate(0 ${-top})` }, petals);
  out += el("ellipse", { cx: x, cy: top, rx: r * 0.32, ry: r * 0.2, fill: middle });
  return out;
}

export const PETALS = ["#f6a6c1", "#ffffff", "#f7d154", "#c9a7f2", "#ff9f80", "#f48fb1"] as const;

/** Path data written in units of a figure's length: every number is multiplied by `L`. */
export const scaled = (L: number, d: string): string =>
  d.replace(/-?\d*\.?\d+/g, v => String(Math.round(+v * L * 10) / 10));

/**
 * Places a figure drawn facing right around (0, 0), `L` long: at (cx, cy), turned to face `dir`
 * and tilted by `tilt` degrees (nose up when negative). Returns the group's opening tag and a
 * function from figure units to picture px.
 */
export function pose(
  cx: number,
  cy: number,
  L: number,
  dir: number,
  tilt: number,
): [string, (x: number, y: number) => Point] {
  const a = (dir * tilt * Math.PI) / 180;
  const at = (x: number, y: number): Point => [
    cx + Math.cos(a) * dir * x * L - Math.sin(a) * y * L,
    cy + Math.sin(a) * dir * x * L + Math.cos(a) * y * L,
  ];
  return [s`<g transform="translate(${cx} ${cy}) rotate(${dir * tilt}) scale(${dir} 1)">`, at];
}

/** The box around some figure points, as [x, y, width, height]. */
export function boxAround(points: readonly Point[]): [number, number, number, number] {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}

/** Open water with light falling from the surface. */
export function underwater(g: Rand, w: number, h: number): string {
  const hue = g.f(185, 210);
  const water = g.id("water");
  let out = el("defs", {}, lin(water, [hsl(hue, 55, 62), hsl(hue + 15, 60, 30)])) + fill(w, h, `url(#${water})`);
  // Shimmer at the surface, and rays slanting down from it.
  out += el("rect", { width: w, height: h * 0.04, fill: "#fff", opacity: "0.12" });
  const slant = g.f(-0.25, 0.25) * h;
  let rays = "";
  for (let k = g.i(3, 4); k > 0; k--) {
    const x = w * g.f(0, 1);
    const spread = w * g.f(0.04, 0.1);
    rays += s`M ${x} 0 L ${x + spread} 0 L ${x + spread * 2.2 + slant} ${h} L ${x + slant} ${h} Z `;
  }
  out += el("path", { d: rays, fill: "#fff", opacity: "0.08" });
  return out;
}

/** A few bubbles rising around (x, y). */
export function bubbles(g: Rand, x: number, y: number, spread: number, r: number): string {
  let out = "";
  for (let k = g.i(2, 4); k > 0; k--)
    out += el("circle", { cx: x + g.f(-0.5, 0.5) * spread, cy: y - k * r * 4.5, r: r * g.f(0.6, 1.2) });
  return el("g", { fill: "none", stroke: "#fff", "stroke-width": "1.5", opacity: "0.6" }, out);
}

/** A sky gradient filling the picture, from `top` down to `bottom`. */
export function skyFade(g: Rand, w: number, h: number, top: string, bottom: string): string {
  const id = g.id("sky");
  return el("defs", {}, lin(id, [top, bottom])) + fill(w, h, `url(#${id})`);
}

/** A dark eye with a small highlight. */
export const eye = (x: number, y: number, r: number): string =>
  el("circle", { cx: x, cy: y, r, fill: "#1a1a1e" }) +
  el("circle", { cx: x + r * 0.35, cy: y - r * 0.35, r: r * 0.35, fill: "#fff" });
