import { defineKind, el, fill, hsl, lin, type Point, qpt, s } from "../../draw/core";
import { bands, clipCircle, earth, outside, shadeDef, starCount, starDots } from "./shared";

/**
 * A moon landscape: cratered ground, the Earth or a planet rising, sometimes a lander and footprints.
 *
 * @category Space
 */
export const moon = /* @__PURE__ */ defineKind("moon", "Moon surface", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(220, 270);
  const lx = g.pick([-1, 1]);
  const ground = g.f(20, 240);
  const gray = (light: number) => hsl(ground, 7, light);
  const sky = g.id("sky");
  const shade = g.id("shade");
  const soil = g.id("soil");
  const globeClip = g.id("globe");
  const horizon = h * g.f(0.58, 0.68);
  // The rising world sits just behind the horizon.
  const isEarth = g.chance(0.6);
  const pr = unit * g.f(0.12, 0.19);
  const px = w * g.f(0.2, 0.8);
  const py = horizon - pr * g.f(0.15, 0.75);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 35, 4), hsl(skyHue + 10, 30, 11)]),
    lin(soil, [gray(g.f(60, 68)), gray(g.f(40, 48))]),
    shadeDef(shade, lx, 0.75),
    clipCircle(globeClip, px, py, pr),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, horizon, starCount(g, w, h), unit);
  if (isEarth) out += earth(g, px, py, pr, globeClip, shade, unit);
  else {
    out += bands(g, px, py, pr, g.f(0, 360), globeClip);
    out += el("circle", { cx: px, cy: py, r: pr, fill: `url(#${shade})` });
  }
  // A far ridge of crater rims, then the ground sweeping toward us.
  let ridge = s`M0 ${horizon}`;
  const humps = Math.max(3, Math.round((w / unit) * 3));
  for (let q = 0; q < humps; q++) {
    const x0 = (q * w) / humps;
    ridge += s`Q${x0 + w / humps / 2} ${horizon - unit * g.f(0, 0.07)} ${x0 + w / humps} ${horizon + unit * g.f(-0.01, 0.01)}`;
  }
  out += el("path", { d: ridge + s`V${h}H0Z`, fill: gray(g.f(34, 40)) });
  const near = horizon + unit * g.f(0.02, 0.05);
  out += el("path", {
    d: s`M0 ${near + unit * g.f(-0.02, 0.02)}Q${w * g.f(0.3, 0.7)} ${near - unit * g.f(0.02, 0.05)} ${w} ${near + unit * g.f(-0.02, 0.02)}V${h}H0Z`,
    fill: `url(#${soil})`,
  });
  // The lander, standing on the near ground to one side of the rising world.
  const hasLander = g.chance(0.65);
  const ls = unit * g.f(0.16, 0.22);
  const lxPos = px < w / 2 ? w * g.f(0.6, 0.82) : w * g.f(0.18, 0.4);
  const lyPos = near + (h - near) * g.f(0.35, 0.5);
  // Footprints: pairs of small prints winding toward us, larger as they come near.
  const footprints = !hasLander || g.chance(0.7);
  const trail: [number, number, number][] = [];
  if (footprints) {
    const start: Point = hasLander ? [lxPos + ls * 0.3, lyPos] : [w * g.f(0.3, 0.7), near + (h - near) * 0.12];
    const end: Point = [w * g.f(0.25, 0.75), h + unit * 0.02];
    const bend: Point = [(start[0] + end[0]) / 2 + w * g.f(-0.2, 0.2), (start[1] + end[1]) / 2];
    for (let k = 1; k <= 12; k++) {
      const [x, y] = qpt(start, bend, end, k / 12);
      const size = unit * 0.012 * (0.5 + 1.4 * ((y - near) / (h - near)));
      trail.push([x + (k % 2 ? -1 : 1) * size * 1.4, y, size]);
    }
  }
  // Craters, smaller and flatter toward the horizon, kept clear of the lander, the trail and each other.
  const holes: [number, number, number, number][] = [];
  for (let c = g.i(6, 9), tries = 0; c > 0 && tries < 60; tries++) {
    const t = g.f(0.08, 1);
    const y = near + (h - near) * t;
    const rx = unit * g.f(0.06, 0.15) * (0.35 + t);
    const ry = rx * (0.22 + 0.2 * t);
    const x = w * g.f(-0.05, 1.05);
    if (hasLander && !outside(x, y, lxPos, lyPos, rx + ls * 0.7, ry + ls * 0.3)) continue;
    if (trail.some(([px, py, size]) => !outside(px, py, x, y, rx * 1.15 + size * 2, ry * 1.3 + size))) continue;
    if (holes.some(([hx, hy, hrx, hry]) => !outside(x, y, hx, hy, (rx + hrx) * 1.15, (ry + hry) * 1.3))) continue;
    c--;
    holes.push([x, y, rx, ry]);
  }
  const ellipse = (ex: number, ey: number, erx: number, ery: number) =>
    s`M${ex - erx} ${ey}a${erx} ${ery} 0 1 0 ${erx * 2} 0a${erx} ${ery} 0 1 0 ${-erx * 2} 0`;
  const crater = (part: (x: number, y: number, rx: number, ry: number) => string) =>
    holes.map(([x, y, rx, ry]) => part(x, y, rx, ry)).join("");
  out += el("path", {
    d: crater((x, y, rx, ry) => ellipse(x, y - ry * 0.1, rx * 1.12, ry * 1.22)),
    fill: "#fff",
    opacity: 0.16,
  });
  out += el("path", { d: crater((x, y, rx, ry) => ellipse(x, y, rx, ry)), fill: gray(30) });
  out += el("path", {
    d: crater((x, y, rx, ry) => ellipse(x + lx * rx * 0.08, y + ry * 0.3, rx * 0.8, ry * 0.62)),
    fill: gray(46),
  });
  if (footprints)
    out += el("path", {
      d: trail.map(([x, y, size]) => ellipse(x, y, size, size * 0.5)).join(""),
      fill: "#000",
      opacity: 0.25,
    });
  if (hasLander) {
    const u = ls / 100;
    const x = (v: number) => lxPos + v * u;
    const y = (v: number) => lyPos + v * u;
    const foil = hsl(g.f(36, 46), 75, 55);
    const cabin = gray(80);
    out += el("ellipse", { cx: x(lx * -12), cy: y(0), rx: ls * 0.7, ry: ls * 0.1, fill: "#000", opacity: 0.25 });
    // Legs and pads.
    out += el("path", {
      d: s`M${x(-25)} ${y(-40)}L${x(-48)} ${y(-2)}M${x(25)} ${y(-40)}L${x(48)} ${y(-2)}M${x(-20)} ${y(-28)}L${x(-38)} ${y(-18)}M${x(20)} ${y(-28)}L${x(38)} ${y(-18)}`,
      stroke: gray(70),
      "stroke-width": ls * 0.04,
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M${x(-56)} ${y(0)}h${ls * 0.16}M${x(40)} ${y(0)}h${ls * 0.16}`,
      stroke: gray(78),
      "stroke-width": ls * 0.04,
      "stroke-linecap": "round",
    });
    // The foil-wrapped descent stage, then the cabin with its window and dish.
    out += el("path", {
      d: s`M${x(-30)} ${y(-60)}H${x(30)}L${x(34)} ${y(-50)}V${y(-30)}L${x(30)} ${y(-24)}H${x(-30)}L${x(-34)} ${y(-30)}V${y(-50)}Z`,
      fill: foil,
    });
    out += el("rect", {
      x: x(lx > 0 ? -34 : 12),
      y: y(-60),
      width: ls * 0.22,
      height: ls * 0.36,
      fill: "#000",
      opacity: 0.18,
    });
    out += el("path", {
      d: s`M${x(-24)} ${y(-60)}L${x(-20)} ${y(-82)}L${x(-6)} ${y(-90)}H${x(14)}L${x(24)} ${y(-80)}V${y(-60)}Z`,
      fill: cabin,
    });
    out += el("path", { d: s`M${x(-15)} ${y(-80)}L${x(-6)} ${y(-86)}V${y(-74)}H${x(-15)}Z`, fill: hsl(215, 30, 22) });
    out += el("path", {
      d: s`M${x(18)} ${y(-90)}V${y(-100)}M${x(12)} ${y(-104)}Q${x(18)} ${y(-96)} ${x(26)} ${y(-102)}`,
      stroke: gray(75),
      "stroke-width": ls * 0.03,
      fill: "none",
    });
    out += el("circle", { cx: x(0), cy: y(-30), r: ls * 0.04, fill: gray(30) });
  }
  const world = isEarth ? "The Earth" : "A banded planet";
  note.alt(
    `${world} rising over a cratered moon surface${hasLander ? `, a lander resting nearby${footprints ? " with footprints leading away" : ""}` : ", footprints crossing the dust"}`,
  );
  note.focus(px, py);
  return out;
});
