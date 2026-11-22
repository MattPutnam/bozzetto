import { defineKind, el, hsl, s } from "../../draw/core";
import { AT, daySky, palm, seaAndSky, TIMES } from "./shared";

/**
 * A small tropical island with palms, alone in open sea.
 *
 * @category Landscapes
 */
export const island = /* @__PURE__ */ defineKind("island", "Tropical island", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const horizon = h * g.f(0.48, 0.58);
  let out = seaAndSky(g, w, h, horizon, time, sky);
  // A few clouds by day.
  if (time === "day")
    for (let k = g.i(1, 3); k > 0; k--) {
      const cx = w * g.f(0.05, 0.95);
      const cy = horizon * g.f(0.2, 0.7);
      const cr = unit * g.f(0.04, 0.06);
      out += el("path", {
        d: s`M${cx - cr * 2} ${cy} a ${cr} ${cr} 0 0 1 ${cr * 1.2} ${-cr * 0.8} a ${cr * 1.3} ${cr * 1.3} 0 0 1 ${cr * 2.2} ${-cr * 0.2}
             a ${cr} ${cr} 0 0 1 ${cr * 0.8} ${cr}Z`,
        fill: "#fff",
        opacity: "0.85",
      });
    }
  // The island: a sandy mound in a ring of shallow water.
  const ix = w * g.f(0.38, 0.62);
  const iy = horizon + (h - horizon) * g.f(0.4, 0.55);
  const iw = Math.min(w * 0.6, unit * g.f(0.75, 1));
  const ih = iw * g.f(0.13, 0.18);
  const sandTop = (x: number) => iy - ih * (1 - ((2 * (x - ix)) / iw) ** 2);
  out += el("ellipse", {
    cx: ix,
    cy: iy,
    rx: iw * 0.66,
    ry: ih * 0.55,
    fill: hsl(175, 60, 62 + sky.dim),
    opacity: "0.55",
  });
  out += el("ellipse", {
    cx: ix,
    cy: iy,
    rx: iw * 0.54,
    ry: ih * 0.28,
    fill: "none",
    stroke: "#fff",
    "stroke-width": unit * 0.008,
    opacity: "0.7",
  });
  out += el("path", {
    d: s`M${ix - iw / 2} ${iy} Q ${ix} ${iy - ih * 2} ${ix + iw / 2} ${iy} Q ${ix} ${iy + ih * 0.35} ${ix - iw / 2} ${iy}Z`,
    fill: hsl(g.f(35, 45), 60, 78 + sky.dim / 2),
  });
  const green = g.f(95, 140);
  // One to three palms, leaning outward.
  const palms = g.i(1, 3);
  const spots = [0, -0.22, 0.2].slice(0, palms).map(u => u + g.f(-0.06, 0.06));
  let top = iy;
  for (const u of spots.sort((a, b) => Math.abs(b) - Math.abs(a))) {
    const x = ix + iw * u;
    const y = sandTop(x) + ih * 0.15;
    const ht = Math.min(iw * g.f(0.32, 0.46), (y - unit * 0.1) / 1.1);
    const lean = (u === spots[0] && palms === 1 ? g.pick([-1, 1]) : Math.sign(u) || 1) * g.f(0.15, 0.45);
    out += palm(g, x, y, ht, lean, hsl(g.f(25, 35), 35, 40 + sky.dim), hsl(green + g.f(-10, 10), 50, 30 + sky.dim));
    top = Math.min(top, y - ht);
  }
  const count = ["", "a palm tree", "two palm trees", "three palm trees"][palms];
  note.alt(`A small tropical island with ${count} in open sea ${AT[time]}`);
  note.focus(ix, (top + iy) / 2);
  return out;
});
