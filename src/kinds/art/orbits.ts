import { defineKind, el, fill, hsl } from "../../draw/core";
import { numberWord } from "../../draw/words";

/**
 * A large haloed circle among small circles, rings and thin lines.
 *
 * @category Art
 */
export const orbits = /* @__PURE__ */ defineKind("orbits", "Orbiting circles", (g, w, h, note) => {
  const dark = g.chance(0.55);
  const ink = dark ? "#efe7d6" : "#1c1c22";
  const palette = ["#d9473b", "#f0b62e", "#2f6db5", "#1f9e89", "#7a3e9d", "#e57ea1", ink];
  let out = fill(w, h, dark ? hsl(g.f(200, 250), 30, 14) : hsl(g.f(30, 50), 35, 88));
  // Thin lines across the picture.
  const lines = g.i(2, 3);
  for (let k = lines; k > 0; k--) {
    out += el("line", {
      x1: w * g.f(-0.1, 0.5),
      y1: h * g.f(0, 1),
      x2: w * g.f(0.5, 1.1),
      y2: h * g.f(0, 1),
      stroke: ink,
      "stroke-width": g.f(1, 3),
      opacity: "0.7",
    });
  }
  // The big circle and its halo.
  const cx = w * g.f(0.3, 0.7);
  const cy = h * g.f(0.35, 0.62);
  const radius = Math.min(w, h) * g.f(0.2, 0.3);
  out += el("circle", { cx, cy, r: radius * 1.22, fill: g.pick(palette), opacity: "0.35" });
  out += el("circle", { cx, cy, r: radius, fill: g.pick(palette), opacity: "0.92" });
  // Small circles, some of them rings.
  note.focus(cx, cy);
  const smalls = g.i(5, 9);
  let rings = 0;
  for (let k = smalls; k > 0; k--) {
    const r = Math.min(w, h) * g.f(0.02, 0.1);
    const paint = g.pick(palette);
    const ring = g.chance(0.25);
    if (ring) rings++;
    out += ring
      ? el("circle", {
          cx: w * g.f(0.05, 0.95),
          cy: h * g.f(0.08, 0.92),
          r,
          fill: "none",
          stroke: paint,
          "stroke-width": r * 0.3,
        })
      : el("circle", { cx: w * g.f(0.05, 0.95), cy: h * g.f(0.08, 0.92), r, fill: paint, opacity: "0.88" });
  }
  const solids = smalls - rings;
  const plural = (k: number, one: string, many: string): string => `${numberWord(k)} ${k === 1 ? one : many}`;
  const parts = [solids && plural(solids, "small circle", "small circles"), rings && plural(rings, "ring", "rings")];
  note.alt(`A large haloed circle among ${parts.filter(Boolean).join(" and ")}, crossed by ${numberWord(lines)} lines`);
  return out;
});
