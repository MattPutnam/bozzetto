import { defineKind, el, facing, hsl, lin, mix, s } from "../../draw/core";
import { local, PAINTS, shade, skyAt, timeOfDay, veil, when } from "./shared";

/** A sailboat on open water, with a mainsail and a jib. */
export const sailboat = /* @__PURE__ */ defineKind("sailboat", "Sailboat", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const horizon = h * g.f(0.5, 0.6);
  const waterY = h * g.f(0.74, 0.8);
  const size = Math.min(w * 0.58, (waterY - h * 0.06) / 1.04) * g.f(0.9, 1);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - size * 0.55 - w * 0.05);
  const dir = g.pick([1, -1]);
  const seaHue = g.f(190, 215);
  const water = g.id("water");
  let out = skyAt(g, w, h, time, horizon);
  if (g.chance(0.35)) {
    // A distant island
    const ix = w * g.f(0, 0.8);
    const iw = w * g.f(0.15, 0.3);
    out += el("path", {
      d: s`M${ix} ${horizon} Q ${ix + iw * 0.4} ${horizon - h * g.f(0.04, 0.08)} ${ix + iw} ${horizon}Z`,
      fill: hsl(150, 18, 40 * dark),
    });
  }
  out += el("defs", {}, lin(water, [hsl(seaHue, 45, 52 * dark), hsl(seaHue + 10, 55, 30 * dark)]));
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  // Ripples
  let ripples = "";
  for (let k = g.i(5, 9); k > 0; k--) {
    const ry = horizon + (h - horizon) * g.f(0.08, 0.95);
    const rx = w * g.f(0, 1);
    const rl = unit * g.f(0.04, 0.12) * (0.5 + (ry - horizon) / (h - horizon));
    ripples += s`M${rx} ${ry}h${rl}`;
  }
  out += el("path", {
    d: ripples,
    stroke: "#ffffff",
    "stroke-width": unit * 0.008,
    opacity: 0.3,
    "stroke-linecap": "round",
  });
  const u = local(cx, waterY, size);
  const hullPaint = g.pick(["#f4f1ea", "#1f3a5f", "#c0392b", "#2f6b58", "#e8e0cf", "#3a3d44"]);
  const sail = g.pick(["#fbfaf6", "#fbfaf6", "#f3ead6", "#f6d7c3", "#d9e8f0"]);
  const stripe = g.pick(PAINTS);
  const hull = "M -0.47 -0.13 L 0.54 -0.17 Q 0.42 -0.02 0.24 0 L -0.36 0 Q -0.47 -0.03 -0.47 -0.13 Z";
  const clip = g.id("hull");
  out += el("defs", {}, el("clipPath", { id: clip }, u.path(hull)));
  out += facing(cx, dir);
  // Reflection
  out += u.path("M -0.45 0 L 0.4 0 Q 0.3 0.1 0 0.12 Q -0.35 0.1 -0.45 0 Z", { fill: hullPaint, opacity: 0.18 });
  // Cabin, hull, and a stripe along the hull.
  out += u.rect(-0.26, -0.22, 0.3, 0.12, { rx: u.k(0.03), fill: mix(hullPaint, "#ffffff", 0.5) });
  out += u.path(hull, { fill: hullPaint });
  out += u.rect(-0.6, -0.1, 1.3, 0.025, {
    fill: stripe,
    "clip-path": `url(#${clip})`,
    transform: s`rotate(-2.3 ${cx} ${waterY})`,
  });
  // Mainsail and boom
  const main = g.pick([sail, sail, stripe]);
  out += u.path("M 0.01 -0.98 Q -0.24 -0.62 -0.43 -0.27 L 0.01 -0.27 Z", { fill: main });
  out += u.path("M -0.03 -0.9 Q -0.18 -0.64 -0.31 -0.4", {
    stroke: "#000",
    "stroke-width": u.k(0.005),
    opacity: 0.12,
    fill: "none",
  });
  out += u.line(0.02, -0.255, -0.45, -0.255, {
    stroke: "#6b5a48",
    "stroke-width": u.k(0.018),
    "stroke-linecap": "round",
  });
  // Mast and a pennant
  out += u.line(0.02, -1.0, 0.02, -0.16, { stroke: "#7a6a58", "stroke-width": u.k(0.02) });
  out += u.poly(
    [
      [0.02, -1.02],
      [-0.1, -0.995],
      [0.02, -0.97],
    ],
    { fill: g.pick(["#d6453d", "#f2c94c", "#6fa8dc"]) },
  );
  // Jib, from the masthead down to the bow.
  if (g.chance(0.8)) out += u.path("M 0.04 -0.9 L 0.5 -0.2 L 0.08 -0.22 Q 0.11 -0.55 0.04 -0.9 Z", { fill: sail });
  // Portholes
  const lightPort = time === "night" ? hsl(45, 90, 75) : "#2f3e52";
  out += "</g>" + veil(w, h, time) + facing(cx, dir);
  out += u.circle(-0.18, -0.165, 0.016, { fill: lightPort }) + u.circle(-0.06, -0.165, 0.016, { fill: lightPort });
  out += "</g>";
  // A waterline ripple in front of the hull.
  out += el("path", {
    d: s`M${cx - size * 0.5} ${waterY + 1}h${size}`,
    stroke: "#ffffff",
    "stroke-width": unit * 0.008,
    opacity: 0.4,
    "stroke-linecap": "round",
  });
  note.alt(`A sailboat on open water${time === "dusk" ? " at sunset" : when(time)}`);
  note.focus(cx - dir * size * 0.08, waterY - size * 0.45);
  return out;
});
