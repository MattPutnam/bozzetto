import { defineKind, el, fill, hsl, lin, type Rand, s } from "../../draw/core";
import { curve } from "./shared";

/** A soft cloud: a row of puffs on a flat base centered at (x, y), `cw` wide. */
function cloud(g: Rand, x: number, y: number, cw: number, paint: string): string {
  let d = s`M${x - cw * 0.42} ${y}H${x + cw * 0.42}V${y - cw * 0.1}H${x - cw * 0.42}Z`;
  const puffs = g.i(3, 5);
  for (let k = 0; k < puffs; k++) {
    const t = (k + 0.5) / puffs;
    const r = cw * (0.1 + 0.16 * Math.sin(Math.PI * t)) * g.f(0.85, 1.15);
    const cx = x - cw * 0.4 + cw * 0.8 * t;
    d += s`M${cx - r} ${y - r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  return el("path", { d, fill: paint });
}

/**
 * A rainbow over fresh hills after rain, the storm moving off to one side.
 *
 * @category Landscapes
 */
export const rainbow = /* @__PURE__ */ defineKind("rainbow", "Rainbow", (g, w, h, note) => {
  const evening = g.chance(0.35);
  const unit = Math.min(w, h);
  const hue = g.f(195, 215);
  const skyId = g.id("sky");
  const stops = evening
    ? [hsl(hue + 25, 22, 50), hsl(g.f(15, 30), 45, 72), hsl(g.f(35, 48), 75, 86)]
    : [hsl(hue + 8, 24, 58), hsl(hue, 42, 75), hsl(hue - 10, 50, 91)];
  const dim = evening ? -6 : 0;
  let out = el("defs", {}, lin(skyId, stops));
  out += fill(w, h, `url(#${skyId})`);
  const ground = h * g.f(0.6, 0.68);
  // The storm moving off: rain falling from a dark cloud bank on one side.
  const side = g.pick([-1, 1]);
  const stormX = side < 0 ? w * g.f(0.05, 0.22) : w * g.f(0.78, 0.95);
  const stormY = h * g.f(0.2, 0.28);
  const stormW = Math.max(unit * g.f(0.55, 0.75), w * 0.3);
  let rain = "";
  for (let x = stormX - stormW * 0.42; x < stormX + stormW * 0.42; x += unit * g.f(0.018, 0.03))
    rain += s`M${x} ${stormY}l${-side * unit * 0.05} ${ground - stormY}`;
  out += el("path", { d: rain, stroke: hsl(hue, 15, 50), "stroke-width": unit * 0.006, opacity: "0.3" });
  // The bow: six bands, centered below the hills, with the sky a little brighter inside it.
  const cx = w * g.f(0.35, 0.65);
  const cy = ground + h * g.f(0.02, 0.12);
  const radius = Math.min(cy - h * 0.12, w * g.f(0.4, 0.5));
  const band = radius * 0.032;
  const hues = [0, 28, 55, 120, 205, 270];
  out += el("circle", { cx, cy, r: radius - 6 * band, fill: "#fff", opacity: "0.12" });
  const bow = (r: number, order: number[], opacity: number) =>
    el(
      "g",
      { fill: "none", "stroke-width": band * 1.08, opacity },
      ...order.map((hh, k) =>
        el("path", {
          d: s`M${cx - r + k * band} ${cy}A${r - k * band} ${r - k * band} 0 0 1 ${cx + r - k * band} ${cy}`,
          stroke: hsl(hh, 85, 62),
        }),
      ),
    );
  out += bow(radius, hues, evening ? 0.55 : 0.6);
  const double = g.chance(0.35);
  if (double) out += bow(radius * 1.3, [...hues].reverse(), 0.22);
  // The storm clouds, and a few soft clouds clearing away.
  // Clouds are kept short enough to clear the top edge: a puff is at most about half as tall as its cloud is wide.
  const bankW = Math.min(stormW, (stormY + unit * 0.02) / 0.55);
  out += cloud(g, stormX, stormY + unit * 0.02, bankW, hsl(hue, 10, 56 + dim));
  out += cloud(g, stormX + side * bankW * 0.15, stormY - unit * 0.04, bankW * 0.6, hsl(hue, 12, 66 + dim));
  for (let k = g.i(1, 2); k > 0; k--) {
    const x = side < 0 ? w * g.f(0.5, 0.92) : w * g.f(0.08, 0.5);
    const cw = unit * g.f(0.18, 0.28);
    out += cloud(g, x, Math.max(h * g.f(0.12, 0.3), cw * 0.62), cw, evening ? hsl(30, 60, 92) : "#fff");
  }
  // Far, middle and near hills, fresh after the rain.
  const green = g.f(85, 125);
  const far = curve(w, ground - h * g.f(0.04, 0.1), ground - h * g.f(0, 0.08), -h * g.f(0.02, 0.06));
  const mid = curve(w, ground + h * g.f(0.02, 0.08), ground + h * g.f(0, 0.06), -h * g.f(0.02, 0.06));
  const near = curve(w, h * g.f(0.82, 0.9), h * g.f(0.8, 0.9), -h * g.f(0, 0.05));
  out += el("path", { d: far.d() + s`V${h}H0Z`, fill: hsl(green + 15, 28, 60 + dim) });
  out += el("path", { d: mid.d() + s`V${h}H0Z`, fill: hsl(green, 42, 47 + dim) });
  // Round trees on the middle hill.
  const bark = hsl(25, 30, 28 + dim);
  const crown = hsl(green + 10, 42, 32 + dim);
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = w * g.f(0.05, 0.95);
    const r = unit * g.f(0.03, 0.05);
    const y = mid.at(x) + unit * 0.01;
    out += el("rect", { x: x - r * 0.15, y: y - r * 1.6, width: r * 0.3, height: r * 1.6, fill: bark });
    out += el("circle", { cx: x, cy: y - r * 1.7, r, fill: crown });
  }
  out += el("path", { d: near.d() + s`V${h}H0Z`, fill: hsl(green - 5, 48, 38 + dim) });
  // A puddle on the near slope, holding the sky.
  if (g.chance(0.5)) {
    const px = w * g.f(0.15, 0.85);
    out += el("ellipse", {
      cx: px,
      cy: near.at(px) + (h - near.at(px)) * 0.5,
      rx: unit * g.f(0.06, 0.1),
      ry: unit * 0.018,
      fill: stops[2],
      opacity: "0.8",
    });
  }
  note.alt(
    `A ${double ? "double " : ""}rainbow arching over rolling hills after rain${evening ? " in evening light" : ""}`,
  );
  note.focus(cx, cy - radius);
  return out;
});
