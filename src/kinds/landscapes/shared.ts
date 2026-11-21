/** Helpers shared by several landscapes kinds. */
import { el, fill, hsl, lin, type Point, pts, type Rand, s } from "../../draw/core";

export const PINE: readonly Point[] = [
  [0, -1],
  [0.3, -0.62],
  [0.17, -0.62],
  [0.42, -0.3],
  [0.27, -0.3],
  [0.5, 0],
  [-0.5, 0],
  [-0.27, -0.3],
  [-0.42, -0.3],
  [-0.17, -0.62],
  [-0.3, -0.62],
];

/** A three-tier pine whose trunk base sits at (x, y). */
export const pine = (x: number, y: number, ht: number, wd: number, paint: string) =>
  el("polygon", { points: pts(PINE.map(([px, py]): Point => [x + px * wd, y + py * ht])), fill: paint });

export type Time = "dawn" | "day" | "dusk";

export const TIMES: readonly Time[] = ["dawn", "day", "dusk"];

export const AT: Record<Time, string> = { dawn: "at dawn", day: "on a clear day", dusk: "at dusk" };

/** A sky for a time of day: gradient stops from the top down, the sun's color, and how much to darken the land. */
export function daySky(g: Rand, time: Time) {
  const hue = g.f(195, 222);
  if (time === "dawn")
    return { hue, stops: [hsl(hue + 10, 40, 70), hsl(g.f(15, 40), 85, 86)], sun: hsl(45, 100, 90), dim: -4 };
  if (time === "day") return { hue, stops: [hsl(hue, 62, 62), hsl(hue - 8, 65, 90)], sun: hsl(52, 100, 94), dim: 0 };
  return {
    hue,
    stops: [hsl(g.f(235, 265), 32, 36), hsl(g.f(320, 345), 42, 62), hsl(g.f(22, 38), 90, 74)],
    sun: hsl(g.f(28, 40), 95, 82),
    dim: -14,
  };
}

/** A gentle curve across the picture: a straight line plus a bump. `d` draws it as one quadratic. */
export function curve(w: number, y0: number, y2: number, bump: number) {
  const c = (y0 + y2) / 2 + 2 * bump;
  return {
    at: (x: number) => y0 + ((y2 - y0) * x) / w + (4 * bump * x * (w - x)) / (w * w),
    d: (dy = 0) => s`M0 ${y0 + dy} Q ${w / 2} ${c + dy} ${w} ${y2 + dy}`,
  };
}

export const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A palm whose trunk base sits at (x, y), `ht` tall, its crown leaning by `lean` (-1 to 1). */
export function palm(g: Rand, x: number, y: number, ht: number, lean: number, wood: string, leaf: string): string {
  const top: Point = [x + lean * ht * 0.45, y - ht];
  const bow: Point = [x + lean * ht * 0.05, y - ht * 0.5];
  const trunk = s`M${x} ${y} Q ${bow[0]} ${bow[1]} ${top[0]} ${top[1]}`;
  let out = el("path", { d: trunk, fill: "none", stroke: wood, "stroke-width": ht * 0.06, "stroke-linecap": "round" });
  // Darker rings along the trunk.
  out += el("path", {
    d: trunk,
    fill: "none",
    stroke: "#000",
    opacity: "0.18",
    "stroke-width": ht * 0.06,
    "stroke-dasharray": s`${ht * 0.015} ${ht * 0.05}`,
  });
  // Fronds fanning out from the crown, drooping more the further they point sideways.
  const fronds = g.i(6, 8);
  const len = ht * g.f(0.36, 0.44);
  let d = "";
  for (let k = 0; k < fronds; k++) {
    const angle = Math.PI * (1 + (k + g.f(0.2, 0.8)) / fronds);
    const tip: Point = [top[0] + Math.cos(angle) * len, top[1] + Math.sin(angle) * len * 0.6 + len * 0.35];
    const mid = lerp(top, tip, 0.5);
    // The normal to the frond that points upward.
    const nx = (tip[1] - top[1]) / len;
    const ny = -(tip[0] - top[0]) / len;
    const up = ny < 0 ? 1 : -1;
    d += s`M${top[0]} ${top[1]}
           Q ${mid[0] + nx * up * len * 0.28} ${mid[1] + ny * up * len * 0.28} ${tip[0]} ${tip[1]}
           Q ${mid[0] + nx * up * len * 0.06} ${mid[1] + ny * up * len * 0.06} ${top[0]} ${top[1]}Z`;
  }
  out += el("path", { d, fill: leaf });
  // Coconuts under the fronds.
  for (let k = 0; k < 2; k++)
    out += el("circle", {
      cx: top[0] + (k - 0.5) * ht * 0.05,
      cy: top[1] + ht * 0.03,
      r: ht * 0.03,
      fill: hsl(30, 45, 25),
    });
  return out;
}

/** Sea under the sky: the sky gradient, a sun, and water down to the bottom from `horizon`. */
export function seaAndSky(g: Rand, w: number, h: number, horizon: number, time: Time, sky: ReturnType<typeof daySky>) {
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const water = g.id("water");
  let out = el(
    "defs",
    {},
    lin(skyId, sky.stops),
    lin(water, [hsl(sky.hue - 5, 55, 36 + sky.dim), hsl(sky.hue - 25, 55, 52 + sky.dim)]),
  );
  out += fill(w, h, `url(#${skyId})`);
  const sunX = w * g.f(0.15, 0.85);
  const sunR = unit * g.f(0.05, 0.08);
  const sunY = time === "day" ? horizon * g.f(0.2, 0.4) : horizon - sunR * g.f(0.2, 1.6);
  out += el("circle", { cx: sunX, cy: sunY, r: sunR, fill: sky.sun });
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  // A low sun lays a streak of light on the water.
  if (time !== "day")
    for (let k = 0; k < 4; k++)
      out += el("rect", {
        x: sunX - sunR * (1 - k * 0.15) + g.f(-2, 2),
        y: horizon + unit * (0.012 + k * 0.025),
        width: sunR * 2 * (1 - k * 0.15),
        height: Math.max(1, unit * 0.007),
        rx: unit * 0.003,
        fill: sky.sun,
        opacity: 0.7 - k * 0.12,
      });
  return out;
}

/** The height of a left-to-right polyline at x. */
export function along(line: readonly Point[], x: number): number {
  for (let k = 1; k < line.length; k++)
    if (x <= line[k][0]) return lerp(line[k - 1], line[k], (x - line[k - 1][0]) / (line[k][0] - line[k - 1][0]))[1];
  return line[line.length - 1][1];
}

/** Snow on a pine from `PINE`, at 100 times its size: a cap on top and a ridge along the lower edge of each tier. */
export const PINE_SNOW =
  "M0-100 20-75 10-72 0-76-10-72-20-75Z" +
  [
    [30, -62],
    [42, -30],
    [50, 0],
  ]
    .map(([x, y]) =>
      pts([
        [-x, y],
        [x, y],
        [x * 0.8, y - 7],
        [x * 0.4, y - 4],
        [0, y - 8],
        [-x * 0.4, y - 4],
        [-x * 0.8, y - 7],
      ]),
    )
    .map(ring => `M${ring}Z`)
    .join("");

/** A snowy pine whose base sits at (x, y), reusing one drawn in `<defs>`; `paint` colors the needles. */
export const snowyPine = (id: string, x: number, y: number, ht: number, wd: number, paint: string) =>
  el("use", { href: `#${id}`, transform: s`translate(${x} ${y}) scale(${wd / 100} ${ht / 100})`, fill: paint });

/** A log cabin with a snowy roof, its base centered at (x, y), `cw` wide. */
export function cabin(g: Rand, x: number, y: number, cw: number, snow: string, lit: boolean): string {
  const ch = cw * 0.58;
  const eave = y - ch;
  const wall = g.pick([hsl(g.f(0, 10), 55, 40), hsl(g.f(20, 30), 40, 33), hsl(g.f(200, 220), 25, 38)]);
  // The chimney, behind the roof, and its smoke.
  const chx = x + cw * g.f(0.15, 0.3) * g.pick([-1, 1]);
  let out = "";
  if (lit)
    for (let k = 0; k < 3; k++)
      out += el("circle", {
        cx: chx + cw * (0.06 + 0.08 * k),
        cy: eave - cw * (0.62 + 0.16 * k),
        r: cw * (0.05 + 0.03 * k),
        fill: hsl(220, 10, 85),
        opacity: 0.6 - k * 0.15,
      });
  out += el("rect", {
    x: chx - cw * 0.05,
    y: eave - cw * 0.52,
    width: cw * 0.1,
    height: cw * 0.4,
    fill: hsl(10, 25, 30),
  });
  out += el("rect", {
    x: chx - cw * 0.065,
    y: eave - cw * 0.55,
    width: cw * 0.13,
    height: cw * 0.05,
    rx: cw * 0.02,
    fill: snow,
  });
  out += el("rect", { x: x - cw / 2, y: eave, width: cw, height: ch, fill: wall });
  // Log lines across the wall.
  let logs = "";
  for (let k = 1; k < 4; k++) logs += s`M${x - cw / 2} ${eave + (ch * k) / 4}h${cw}`;
  out += el("path", { d: logs, stroke: "#000", opacity: "0.12", "stroke-width": cw * 0.015 });
  // The gable, then snow along both slopes of the roof.
  out += el("polygon", {
    points: pts([
      [x - cw * 0.62, eave],
      [x, eave - cw * 0.42],
      [x + cw * 0.62, eave],
    ]),
    fill: hsl(20, 30, 24),
  });
  out += el("polygon", {
    points: pts([
      [x - cw * 0.68, eave + cw * 0.01],
      [x, eave - cw * 0.48],
      [x + cw * 0.68, eave + cw * 0.01],
      [x + cw * 0.6, eave + cw * 0.04],
      [x, eave - cw * 0.36],
      [x - cw * 0.6, eave + cw * 0.04],
    ]),
    fill: snow,
  });
  // A door and a window.
  const window = lit ? hsl(45, 95, 70) : hsl(210, 25, 30);
  const side = g.pick([-1, 1]);
  out += el("rect", {
    x: x + side * cw * 0.22 - cw * 0.09,
    y: y - ch * 0.62,
    width: cw * 0.18,
    height: ch * 0.62,
    fill: hsl(25, 35, 20),
  });
  out += el("rect", {
    x: x - side * cw * 0.2 - cw * 0.1,
    y: eave + ch * 0.25,
    width: cw * 0.2,
    height: ch * 0.3,
    fill: window,
  });
  // Snow drifted against the walls.
  out += el("ellipse", { cx: x, cy: y, rx: cw * 0.68, ry: cw * 0.07, fill: snow });
  return out;
}

/** Path data without the spaces around its commands, which cost three bytes each in a data URI. */
export const tight = (d: string) => d.replace(/\s*([A-Za-z])\s*/g, "$1");

/** Small round stars scattered above `bottom`, in two sizes: each a round-capped dot of zero length. */
export function starDots(g: Rand, w: number, bottom: number, count: number, unit: number): string {
  const d = ["", ""];
  for (let k = 0; k < count; k++) d[g.i(0, 1)] += s`M${w * g.f(0, 1)} ${bottom * g.f(0, 1) ** 1.3}h0`;
  return d
    .map((dots, k) =>
      el("path", {
        d: dots,
        stroke: "#fff",
        "stroke-width": unit * (0.005 + 0.004 * k),
        "stroke-linecap": "round",
        opacity: 0.9 - 0.25 * k,
      }),
    )
    .join("");
}

/** A radial glow fading out from `color`. */
export const glowDef = (id: string, color: string, strength: number) =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": strength }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }),
  );

export const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, q: 4, t: 2, c: 6, s: 4, a: 7, z: 0 };

/**
 * Path data rewritten in short form, for shapes too many to afford the usual tenths: every point
 * rounded to a whole px and written relative to the one before it (arc radii keep their tenths).
 */
export function whole(d: string): string {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  // Where the pen is exactly, where it is in the rounded output, and where the subpath began.
  let x = 0;
  let y = 0;
  let rx = 0;
  let ry = 0;
  let start: Point = [0, 0];
  let cmd = "M";
  let out = "";
  const write = (v: number, sep: boolean) => (sep && v >= 0 ? " " : "") + v;
  for (let i = 0; i < tokens.length;) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const lower = cmd.toLowerCase();
    const absolute = cmd !== lower;
    if (lower === "z") {
      out += "z";
      [x, y] = start;
      [rx, ry] = [Math.round(x), Math.round(y)];
      continue;
    }
    const args = tokens.slice(i, i + ARGS[lower]).map(Number);
    i += ARGS[lower];
    // Each point as an exact absolute position, then written as a rounded step from the pen.
    const point = (px: number, py: number): Point => (absolute ? [px, py] : [x + px, y + py]);
    const nums: number[] = [];
    let end: Point;
    if (lower === "h") end = [absolute ? args[0] : x + args[0], y];
    else if (lower === "v") end = [x, absolute ? args[0] : y + args[0]];
    else end = point(args[args.length - 2], args[args.length - 1]);
    if (lower === "h") nums.push(Math.round(end[0]) - rx);
    else if (lower === "v") nums.push(Math.round(end[1]) - ry);
    else {
      if (lower === "a") nums.push(...args.slice(0, 5).map(v => Math.round(v * 10) / 10));
      else
        for (let k = 0; k < args.length - 2; k += 2) {
          const [cx, cy] = point(args[k], args[k + 1]);
          nums.push(Math.round(cx) - rx, Math.round(cy) - ry);
        }
      nums.push(Math.round(end[0]) - rx, Math.round(end[1]) - ry);
    }
    out += lower + nums.map((v, k) => write(v, k > 0)).join("");
    [x, y] = end;
    [rx, ry] = [Math.round(x), Math.round(y)];
    if (lower === "m") start = end;
  }
  return out;
}

/** Open water with light falling from the surface. */
export function underwater(g: Rand, w: number, h: number, top: string, bottom: string): string {
  const water = g.id("water");
  let out = el("defs", {}, lin(water, [top, bottom])) + fill(w, h, `url(#${water})`);
  // Shimmer at the surface, and rays slanting down from it.
  out += el("rect", { width: w, height: h * 0.04, fill: "#fff", opacity: "0.12" });
  const slant = g.f(-0.25, 0.25) * h;
  let rays = "";
  for (let k = g.i(3, 5); k > 0; k--) {
    const x = w * g.f(-0.05, 1);
    const spread = w * g.f(0.03, 0.08);
    rays += s`M${x} 0L${x + spread} 0L${x + spread * 2.2 + slant} ${h}L${x + slant} ${h}Z`;
  }
  out += el("path", { d: rays, fill: "#fff", opacity: "0.09" });
  return out;
}

/** A small fish at (x, y), `r` from its middle to its nose, facing `dir`; sometimes with a band. */
export function smallFish(x: number, y: number, r: number, dir: number, body: string, fin: string, band = ""): string {
  const u = r * dir;
  let out = el("path", {
    d: whole(s`M${x - u * 0.75} ${y}L${x - u * 1.45} ${y - r * 0.55}L${x - u * 1.28} ${y}L${x - u * 1.45} ${y + r * 0.55}Z
         M${x - u * 0.5} ${y - r * 0.45}Q${x - u * 0.15} ${y - r * 0.95} ${x + u * 0.3} ${y - r * 0.5}Z`),
    fill: fin,
  });
  out += el("ellipse", { cx: x, cy: y, rx: r, ry: r * 0.62, fill: body });
  if (band) out += el("ellipse", { cx: x + u * 0.12, cy: y, rx: r * 0.15, ry: r * 0.54, fill: band });
  return out + el("circle", { cx: x + u * 0.55, cy: y - r * 0.12, r: r * 0.12, fill: "#1a1a22" });
}
