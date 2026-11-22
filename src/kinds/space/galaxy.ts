import { defineKind, el, fill, hsl, lin, type Point, s } from "../../draw/core";
import { extents, radial, starCount, starDots } from "./shared";

/** Path data through points, whole pixels and no spaces before minus signs, to keep data URIs small. */
function pathOf(cmd: string, points: readonly Point[]): string {
  let out = cmd;
  for (const [x, y] of points) {
    const xs = String(Math.round(x));
    const ys = String(Math.round(y));
    out += (out.length > 1 && !xs.startsWith("-") ? " " : "") + xs + (ys.startsWith("-") ? "" : " ") + ys;
  }
  return out;
}

/** A smooth open curve through the midpoints of points, as quadratic pieces. */
function smoothOpen(p: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = pathOf("M", [p[0]]) + pathOf("L", [mid(p[0], p[1])]);
  for (let k = 1; k < p.length - 1; k++) d += pathOf("Q", [p[k], k === p.length - 2 ? p[k + 1] : mid(p[k], p[k + 1])]);
  return d;
}

/** A smooth closed shape through the midpoints of a ring of points. */
function smoothRing(ring: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const count = ring.length;
  let d = pathOf("M", [mid(ring[count - 1], ring[0])]);
  for (let k = 0; k < count; k++) d += pathOf("Q", [ring[k], mid(ring[k], ring[(k + 1) % count])]);
  return d + "Z";
}

/**
 * A spiral galaxy: a glowing core and soft arms with dust lanes and star-forming knots, at a tilt.
 *
 * @category Space
 */
export const galaxy = /* @__PURE__ */ defineKind("galaxy", "Galaxy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(225, 275);
  const sky = g.id("sky");
  const core = g.id("core");
  const armPaint = g.id("arm");
  const halo = g.id("halo");
  const soft = g.id("soft");
  const fine = g.id("fine");
  const lanes = g.id("lanes");
  const far = g.id("far");
  // Palette: a warm core, with arms that are classic blue, teal or violet.
  const coreHue = g.f(28, 48);
  const armHue = g.pick([g.f(205, 222), g.f(180, 194), g.f(250, 272)]);
  const knotHue = g.f(322, 348);
  // The view: face-on (round) to steeply inclined (a narrow ellipse), turned any way.
  const tilt = g.chance(0.3) ? g.f(0.82, 1) : g.f(0.3, 0.8);
  // Laid along a wide or tall picture's long side, and any way in a squarer one.
  const swing = g.f(-1, 1);
  const turn = w > h * 1.5 ? swing * 25 : h > w * 1.15 ? 90 + swing * 35 : swing * 90;
  const barred = g.chance(0.35);
  const arms = barred ? 2 : g.pick([2, 2, 2, 3, 4]);
  const wind = g.pick([-1, 1]);
  // As large as fits, the turned disc kept inside the picture.
  const [ex, ey] = extents(1, tilt, turn);
  const R = Math.min((w * 0.47) / ex, (h * 0.45) / ey, unit * 0.72);
  const cx = w / 2 + (w / 2 - ex * R) * g.f(-0.6, 0.6);
  const cy = h / 2 + (h / 2 - ey * R) * g.f(-0.6, 0.6);
  const bar = R * g.f(0.26, 0.34);
  const r0 = barred ? bar : R * g.f(0.07, 0.13);
  const turns = g.f(1.05, 1.6) * Math.PI * (arms > 2 ? 0.85 : 1);
  const b = Math.log((R * 0.97) / r0) / (turns * 1.2);
  const skew = g.f(0, Math.PI * 2);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 4), hsl(skyHue + 15, 40, 12)]),
    radial(core, [
      [0, hsl(coreHue + 10, 90, 96), 1],
      [0.25, hsl(coreHue, 90, 78), 0.9],
      [0.6, hsl(coreHue - 5, 80, 60), 0.35],
      [1, hsl(coreHue - 10, 70, 50), 0],
    ]),
    radial(
      armPaint,
      [
        [0, hsl(coreHue, 85, 80), 1],
        [0.4, hsl(armHue, 70, 72), 1],
        [1, hsl(armHue + 10, 60, 60), 1],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(R) },
    ),
    radial(halo, [
      [0, hsl(armHue, 60, 60), 0.35],
      [1, hsl(armHue, 60, 40), 0],
    ]),
    radial(far, [
      [0, hsl(coreHue, 70, 88), 0.9],
      [1, hsl(armHue, 50, 60), 0],
    ]),
    el(
      "filter",
      { id: soft, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: R * 0.045 }),
    ),
    el(
      "filter",
      { id: lanes, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: R * 0.018 }),
    ),
    el(
      "filter",
      { id: fine, x: "-25%", y: "-25%", width: "150%", height: "150%" },
      el("feGaussianBlur", { stdDeviation: Math.max(0.6, R * 0.012) }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // One or two tiny far galaxies, kept clear of the big one.
  let farCount = 0;
  for (let k = g.i(1, 2), tries = 0; k > 0 && tries < 30; tries++) {
    const rx = unit * g.f(0.025, 0.045);
    const x = rx * 2 + (w - rx * 4) * g.f(0, 1);
    const y = rx * 2 + (h - rx * 4) * g.f(0, 1);
    const angle = g.f(0, 180);
    const ry = rx * g.f(0.3, 0.8);
    if (Math.hypot((x - cx) / (ex * R + rx * 2), (y - cy) / (ey * R + rx * 2)) < 1) continue;
    k--;
    farCount++;
    out += el("ellipse", {
      cx: x,
      cy: y,
      rx,
      ry,
      fill: `url(#${far})`,
      transform: s`rotate(${angle} ${x} ${y})`,
    });
  }

  // A point on arm `k` at fraction t of its length, in the disc's own (face-on) frame.
  const spiral = (k: number, t: number): Point => {
    const theta = t * turns;
    const r = r0 * Math.exp(b * theta);
    const a = wind * theta + skew + (k * Math.PI * 2) / arms;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const normal = (k: number, t: number): Point => {
    const [x0, y0] = spiral(k, t - 0.01);
    const [x1, y1] = spiral(k, t + 0.01);
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    return [-(y1 - y0) / len, (x1 - x0) / len];
  };
  // An arm as a band out to `end` that widens outward then tapers to its tip.
  const band = (k: number, end: number, width: (t: number) => number, steps = 9) => {
    const left: Point[] = [];
    const right: Point[] = [];
    for (let q = 0; q <= steps; q++) {
      const t = (q / steps) * end;
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const half = (width(t) / 2) * Math.min(1, ((end - t) / end) * 3.5, 0.5 + t * 2);
      left.push([x + nx * half, y + ny * half]);
      right.unshift([x - nx * half, y - ny * half]);
    }
    return smoothRing([...left, ...right]);
  };
  let glow = "";
  let bright = "";
  let dust = "";
  // Young stars and knots scattered along each arm, one path per color.
  const dots = ["", "", ""];
  for (let k = 0; k < arms; k++) {
    glow += band(k, 1.2, t => R * (0.15 + 0.2 * t));
    bright += band(k, 1, t => R * (0.05 + 0.07 * t));
    // The dust lane runs along the inside edge of the arm.
    const lane: Point[] = [];
    for (let q = 0; q <= 7; q++) {
      const t = 0.08 + q * 0.11;
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const off = wind * R * (0.02 + 0.03 * t);
      lane.push([x + nx * off, y + ny * off]);
    }
    dust += smoothOpen(lane);
    for (let q = Math.round(30 / Math.sqrt(arms)); q > 0; q--) {
      const t = g.f(0.12, 1.05);
      const [x, y] = spiral(k, t);
      const [nx, ny] = normal(k, t);
      const off = R * (0.03 + 0.08 * t) * g.f(-1, 1);
      const kind = g.chance(0.22) ? 1 : g.chance(0.25) ? 2 : 0;
      dots[kind] += pathOf("M", [[x + nx * off, y + ny * off]]) + "h0";
    }
  }
  let disc = el("circle", { r: Math.round(R), fill: `url(#${halo})` });
  disc += el(
    "g",
    { filter: `url(#${soft})` },
    el("path", { d: glow, fill: `url(#${armPaint})`, opacity: 0.45 }),
    el("path", { d: bright, fill: `url(#${armPaint})`, opacity: 0.7 }),
  );
  const dotWidths = [R * 0.028, R * 0.05, R * 0.018];
  const dotColors = [hsl(armHue - 5, 80, 82), hsl(knotHue, 80, 72), "#ffffff"];
  disc += el(
    "g",
    { filter: `url(#${lanes})` },
    el("path", {
      d: dust,
      fill: "none",
      stroke: hsl(skyHue, 40, 6),
      "stroke-width": R * 0.04,
      "stroke-linecap": "round",
      opacity: 0.42,
    }),
  );
  disc += el(
    "g",
    { filter: `url(#${fine})` },
    ...dots.map((d, k) =>
      el("path", {
        d,
        stroke: dotColors[k],
        "stroke-width": dotWidths[k],
        "stroke-linecap": "round",
        opacity: k === 1 ? 0.85 : 0.75,
      }),
    ),
  );
  if (barred)
    disc += el("ellipse", {
      rx: Math.round(bar * 1.1),
      ry: Math.round(bar * 0.3),
      fill: `url(#${core})`,
      transform: s`rotate(${(skew * 180) / Math.PI})`,
    });
  out += el(
    "g",
    {
      transform: `translate(${Math.round(cx)} ${Math.round(cy)})rotate(${Math.round(turn)})scale(1 ${tilt.toFixed(2)})`,
    },
    disc,
  );
  // The core's bulge stands out of the disc, so it is squashed less than the disc.
  const bulge = R * (barred ? g.f(0.15, 0.19) : g.f(0.24, 0.32));
  out += el("ellipse", {
    cx,
    cy,
    rx: bulge,
    ry: bulge * (0.55 + 0.45 * tilt),
    fill: `url(#${core})`,
    transform: s`rotate(${turn} ${cx} ${cy})`,
  });
  out += el("circle", { cx, cy, r: R * 0.035, fill: hsl(coreHue + 10, 90, 97) });
  // A few crisp foreground stars.
  out += starDots(g, w, h, Math.round(starCount(g, w, h) / 4), unit);
  const view = tilt > 0.82 ? "seen face-on" : tilt > 0.55 ? "seen at a tilt" : "seen at a steep slant";
  note.alt(
    `A ${barred ? "barred " : ""}spiral galaxy ${view} among distant stars${farCount ? `, with ${farCount === 2 ? "two tiny far galaxies" : "a tiny far galaxy"} beyond` : ""}`,
  );
  note.focus(cx, cy);
  return out;
});
