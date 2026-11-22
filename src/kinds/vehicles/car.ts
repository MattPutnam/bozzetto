import { defineKind, el, facing, hsl, mix, s } from "../../draw/core";
import { CHROME, hill, local, PAINTS, shade, skyAt, timeOfDay, TIRE, tree, veil, when } from "./shared";

/** A tire with a hubcap, resting with its center at (x, y). */
const wheel = (u: ReturnType<typeof local>, x: number, y: number, r: number, whitewall: boolean): string =>
  u.circle(x, y, r, { fill: TIRE }) +
  (whitewall ? u.circle(x, y, r * 0.68, { fill: "#f1f1ee" }) : "") +
  u.circle(x, y, r * 0.5, { fill: CHROME }) +
  u.circle(x, y, r * 0.17, { fill: "#8a9099" });

/**
 * A rounded retro car driving along a country road.
 *
 * @category Vehicles
 */
export const car = /* @__PURE__ */ defineKind("car", "Retro car", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const horizon = h * g.f(0.5, 0.6);
  const roadTop = h * g.f(0.72, 0.77);
  const roadY = roadTop + (h - roadTop) * 0.45;
  const size = Math.min(unit * g.f(0.82, 0.95), w * 0.8);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.08);
  const dir = g.pick([1, -1]);
  const paint = g.pick(PAINTS);
  const grass = g.f(80, 130);
  let out = skyAt(g, w, h, time, horizon + h * 0.1);
  out += hill(g, w, h, horizon, h * g.f(0.04, 0.1), hsl(grass + 10, 28, 60 * dark));
  // Trees along the far side of the road.
  const verge = roadTop - h * g.f(0.06, 0.1);
  out += el("rect", { y: verge, width: w, height: h - verge, fill: hsl(grass, 38, 46 * dark) });
  for (let k = g.i(1, 4); k > 0; k--)
    out += tree(
      w * g.f(0.03, 0.97),
      verge + 2,
      unit * g.f(0.16, 0.26),
      hsl(grass + 5, 35, 34 * dark),
      hsl(25, 30, 28 * dark),
    );
  // The road, its edge and the dashed lane line in front of the car.
  out += el("rect", { y: roadTop, width: w, height: h - roadTop, fill: hsl(220, 8, 36 * dark) });
  out += el("rect", { y: roadTop, width: w, height: unit * 0.012, fill: hsl(220, 8, 60 * dark) });
  const dash = unit * 0.06;
  out += el("path", {
    d: s`M${-g.f(0, dash * 2)} ${roadY + (h - roadY) * 0.55}H${w}`,
    stroke: hsl(48, 60, 85 * dark),
    "stroke-width": unit * 0.012,
    "stroke-dasharray": s`${dash} ${dash}`,
  });
  const u = local(cx, roadY, size);
  const darker = mix(paint, "#000000", 0.25);
  const clip = g.id("body");
  const body = `M -0.47 -0.12 L 0.47 -0.12 Q 0.52 -0.12 0.52 -0.18 Q 0.52 -0.31 0.36 -0.33 L 0.2 -0.35
    Q 0.1 -0.57 -0.1 -0.58 Q -0.3 -0.58 -0.39 -0.38 Q -0.5 -0.35 -0.51 -0.22 Q -0.52 -0.12 -0.47 -0.12 Z`;
  out += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
  // Shadow
  out += u.ellipse(0, 0, 0.56, 0.03, { fill: "#000", opacity: 0.2 });
  out += facing(cx, dir);
  // A roof rack with a suitcase, sometimes.
  const rack = g.chance(0.3);
  if (rack) {
    out += u.path("M -0.22 -0.55 L -0.22 -0.61 L 0.04 -0.61 L 0.04 -0.54", {
      stroke: "#555b63",
      "stroke-width": u.k(0.014),
      fill: "none",
    });
    out += u.rect(-0.19, -0.69, 0.2, 0.08, { rx: u.k(0.015), fill: g.pick(["#8b5a3c", "#c27c4a", "#5e6f8a"]) });
    out += u.rect(-0.1, -0.69, 0.02, 0.08, { fill: "#000", opacity: 0.25 });
  }
  out += u.path(body, { fill: paint });
  // Two-tone lower body, or a chrome side stripe.
  const trim = g.pick(["two-tone", "stripe", "plain"]);
  if (trim === "two-tone")
    out += u.rect(-0.6, -0.24, 1.2, 0.2, {
      fill: g.pick(["#f4efe2", darker, "#3a3d44"]),
      "clip-path": `url(#${clip})`,
    });
  if (trim === "stripe") out += u.rect(-0.6, -0.255, 1.2, 0.018, { fill: CHROME, "clip-path": `url(#${clip})` });
  // Windows, split by a pillar.
  const glass = time === "night" ? "#3a4660" : "#cfe6f2";
  out += u.path("M 0.165 -0.36 Q 0.08 -0.535 -0.1 -0.54 Q -0.27 -0.54 -0.345 -0.37 Z", { fill: glass });
  out += u.path("M 0.1 -0.5 Q 0.04 -0.52 -0.02 -0.52", {
    stroke: "#ffffff",
    "stroke-width": u.k(0.012),
    fill: "none",
    opacity: 0.6,
    "stroke-linecap": "round",
  });
  out += u.rect(-0.075, -0.56, 0.03, 0.21, { fill: paint });
  // Door seam and handle
  out += u.line(-0.06, -0.35, -0.06, -0.14, { stroke: darker, "stroke-width": u.k(0.008) });
  out += u.rect(-0.13, -0.315, 0.045, 0.012, { rx: u.k(0.006), fill: CHROME });
  // Bumpers, taillight and headlight
  out += u.rect(0.44, -0.155, 0.1, 0.035, { rx: u.k(0.017), fill: CHROME });
  out += u.rect(-0.54, -0.155, 0.1, 0.035, { rx: u.k(0.017), fill: CHROME });
  out += u.rect(-0.525, -0.29, 0.03, 0.045, { rx: u.k(0.01), fill: "#c8302a" });
  // Wheel arches, then the wheels.
  const whitewall = g.chance(0.5);
  for (const wx of [-0.31, 0.31]) {
    out += u.path(`M ${wx - 0.135} -0.12 A 0.135 0.135 0 0 1 ${wx + 0.135} -0.12 Z`, { fill: "#1d1e22" });
    out += wheel(u, wx, -0.105, 0.105, whitewall);
  }
  out += "</g>" + veil(w, h, time);
  // The headlight, with a beam at night.
  if (time === "night") {
    out += facing(cx, dir);
    out += u.poly(
      [
        [0.5, -0.27],
        [1.6, -0.36],
        [1.6, 0.02],
      ],
      { fill: hsl(50, 90, 80), opacity: 0.22 },
    );
  } else out += facing(cx, dir);
  out += u.circle(0.495, -0.25, 0.032, { fill: hsl(50, 90, time === "day" ? 88 : 80) });
  out += "</g>";
  note.alt(`A rounded retro car${rack ? " with a suitcase on its roof" : ""} on a country road${when(time)}`);
  note.focus(cx + dir * size * 0.02, roadY - size * 0.3);
  return out;
});
