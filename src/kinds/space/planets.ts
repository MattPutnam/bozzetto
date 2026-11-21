import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";
import { bands, clipCircle, craters, outside, shadeDef, starCount, starDots } from "./shared";

/** A planet system up close: a big banded or cratered planet, perhaps ringed, with moons and far planets. */
export const planets = /* @__PURE__ */ defineKind("planets", "Planets", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(220, 280);
  const lx = g.pick([-1, 1]);
  const shade = g.id("shade");
  const sky = g.id("sky");
  const clip = g.id("planet");
  const gas = g.chance(0.65);
  const ringed = g.chance(gas ? 0.6 : 0.3);
  const hue = g.f(0, 360);
  let r = unit * g.f(0.28, 0.36);
  const ringScale = g.f(1.7, 2);
  const tilt = g.f(-24, 24);
  // Keep the rings inside the picture, shrinking the planet if needed.
  const reach = ringed ? ringScale : 1.05;
  r = Math.min(r, (w * 0.46) / reach, h * 0.4);
  const halfW = r * reach;
  const cx = halfW + w * 0.03 + (w - 2 * (halfW + w * 0.03)) * g.f(0.1, 0.9);
  const cy = h * g.f(0.45, 0.56);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 5), hsl(skyHue + 15, 40, 14)]),
    shadeDef(shade, lx, 0.7),
    clipCircle(clip, cx, cy, r),
  );
  out += fill(w, h, `url(#${sky})`);
  out += starDots(g, w, h, starCount(g, w, h), unit);
  // Moons and far planets, kept clear of the big planet and its rings.
  const bodies: [number, number, number][] = [];
  const place = (br: number) => {
    for (let t = 0; t < 30; t++) {
      const x = br * 1.5 + (w - br * 3) * g.f(0, 1);
      const y = br * 1.5 + (h - br * 3) * g.f(0, 1);
      if (!outside(x, y, cx, cy, halfW + br * 1.6, r * (ringed ? 1.15 : 1) + br * 1.6)) continue;
      if (bodies.some(([bx, by, bb]) => Math.hypot(x - bx, y - by) < bb + br + unit * 0.05)) continue;
      bodies.push([x, y, br]);
      return true;
    }
    return false;
  };
  const moons = g.i(1, 2);
  for (let k = 0; k < moons; k++) place(r * g.f(0.11, 0.2));
  const moonCount = bodies.length;
  for (let k = g.i(1, 3); k > 0; k--) place(unit * g.f(0.012, 0.03));
  bodies.forEach(([x, y, br], k) => {
    const id = g.id(`body${k}`);
    const paint = hsl(g.f(0, 360), g.f(15, 45), g.f(55, 75));
    out += el("defs", {}, clipCircle(id, x, y, br));
    out += k < moonCount ? craters(g, x, y, br, paint, lx, id, 4) : el("circle", { cx: x, cy: y, r: br, fill: paint });
    out += el("circle", { cx: x, cy: y, r: br, fill: `url(#${shade})` });
  });
  // The big planet, with the far half of its rings behind it and the near half in front.
  const ringRx = r * ringScale;
  const ringRy = ringRx * g.f(0.16, 0.26);
  const ringPaint = [hsl(hue + g.f(20, 50), 35, 78), hsl(hue + g.f(-20, 20), 30, 62)];
  const ring = (sweep: number) =>
    ringPaint
      .map((paint, k) => {
        const rx = ringRx * (1 - k * 0.17);
        const ry = ringRy * (1 - k * 0.17);
        return el("path", {
          d: s`M${cx - rx} ${cy}A${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`,
          fill: "none",
          stroke: paint,
          "stroke-width": r * (k ? 0.14 : 0.2),
          opacity: k ? 0.75 : 0.85,
        });
      })
      .join("");
  let planet = ringed ? ring(1) : "";
  planet += gas
    ? bands(g, cx, cy, r, hue, clip)
    : craters(g, cx, cy, r, hsl(hue, g.f(15, 40), g.f(55, 68)), lx, clip, g.i(9, 14));
  planet += el("circle", { cx, cy, r, fill: `url(#${shade})` });
  if (ringed) planet += ring(0);
  out += el("g", { transform: s`rotate(${tilt} ${cx} ${cy})` }, planet);
  const what = gas
    ? ringed
      ? "A ringed, banded planet"
      : "A banded gas giant"
    : ringed
      ? "A ringed, cratered planet"
      : "A cratered planet";
  const moonWords = moonCount === 2 ? "two moons" : moonCount === 1 ? "a moon" : "";
  note.alt(`${what} up close${moonWords ? ` with ${moonWords}` : ""} and distant planets among the stars`);
  note.focus(cx, cy);
  return out;
});
