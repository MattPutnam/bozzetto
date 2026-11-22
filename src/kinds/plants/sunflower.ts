import { defineKind, el, hsl } from "../../draw/core";
import {
  backdrop,
  countWord,
  flatRays,
  flatSpiral,
  hexHsl,
  leaf,
  leafEl,
  onFace,
  SETTING,
  stem,
  type View,
} from "./shared";

/**
 * A sunflower head close up: two rings of rays around a seed head, on a leafy stem.
 *
 * @category Plants
 */
export const sunflower = /* @__PURE__ */ defineKind("sunflower", "Sunflower", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["sky", "sky", "garden", "warm"] as const);
  let out = backdrop(g, w, h, look);
  const hue = g.f(38, 50);
  const green = hexHsl(g.f(85, 110), g.f(40, 55), g.f(30, 40));
  const R = unit * g.f(0.36, 0.42);
  const faceOn = g.chance(0.6);
  const main: View = {
    x: w / 2 + unit * g.f(-0.08, 0.08),
    y: Math.max(h * 0.46, R + unit * 0.06),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.9, 1.15),
    roll: g.f(-0.3, 0.3),
  };
  // Smaller heads behind, when there is room beside the main one.
  const heads: { v: View; r: number }[] = [];
  const room = (w - R * 2) / 2;
  for (const side of g.chance(0.5) ? [-1, 1] : [1, -1]) {
    const r = R * g.f(0.5, 0.68);
    if (room < r * 1.6 || (heads.length && w < h * 2) || !g.chance(w > h * 1.6 ? 0.85 : 0.4)) continue;
    heads.push({
      v: {
        x: Math.max(r * 1.05, Math.min(w - r * 1.05, main.x + side * (R + r * g.f(0.55, 0.8)))),
        y: main.y + unit * g.f(-0.12, 0.05),
        tilt: g.f(0.95, 1.4),
        roll: side * g.f(0.1, 0.4),
      },
      r,
    });
  }
  heads.push({ v: main, r: R });
  // One head drawn in <defs>: two rings of rays, and the seed head's florets, seeds and spiral.
  const raysId = g.id("rays");
  const seedsId = g.id("seeds");
  const discR = g.f(38, 46);
  const count = g.i(18, 24);
  const len = 100 - discR * 0.8;
  out += el(
    "defs",
    {},
    el(
      "g",
      { id: raysId },
      el("path", { d: flatRays(g, count, discR * 0.8, len, len * 0.4, 0.15, 0), fill: hsl(hue - 8, 88, 46) }),
      el("path", {
        d: flatRays(g, count, discR * 0.8, len * 0.95, len * 0.38, 0.15, Math.PI / count),
        fill: hsl(hue, 92, 56),
      }),
    ),
    el(
      "g",
      { id: seedsId },
      el("circle", { r: discR, fill: "#6b4a1c" }),
      el("circle", { r: discR * 0.86, fill: "#3c2412" }),
      el("circle", { r: discR * 0.32, fill: "#5a4a1e" }),
      flatSpiral(discR * 0.84, 110, discR * 0.06, "#7a5426", 0.12),
    ),
  );
  for (const { v, r } of heads) {
    // Stem and leaves
    const foot = v.x + unit * g.f(-0.08, 0.08);
    out += stem(v.x, v.y, foot, h + unit * 0.05, unit * g.f(-0.06, 0.06), r * 0.13, green);
    if (r === R)
      for (const side of [-1, 1]) {
        if (!g.chance(0.75)) continue;
        const ly = Math.min(h * 0.94, v.y + R * g.f(0.75, 1.05));
        const lx = (v.x + foot) / 2;
        const angle = side > 0 ? g.f(-0.5, 0.2) : Math.PI - g.f(-0.5, 0.2);
        out += leafEl(
          leaf(lx, ly, angle, unit * g.f(0.3, 0.38), unit * g.f(0.13, 0.16), 0.06, side * 0.05),
          green,
          unit * 0.008,
        );
      }
    // The head, its rim, and the seed head raised a little above the rays.
    const spin = g.f(0, Math.PI * 2);
    out += el("use", { href: `#${raysId}`, transform: onFace(v, r, spin) });
    out += el("circle", { r: discR, fill: "#3a2212", transform: onFace(v, r, spin) });
    out += el("use", { href: `#${seedsId}`, transform: onFace(v, r, spin, r * 0.06) });
  }
  const other = heads.length - 1;
  note.alt(
    `${countWord(heads.length, "sunflower", "sunflowers")} ${faceOn ? "facing the viewer" : "turned partly aside"} ${SETTING[look]}`.replace(
      other ? "facing" : "\0",
      "the nearest facing",
    ),
  );
  note.focus(main.x, main.y);
  return out;
});
