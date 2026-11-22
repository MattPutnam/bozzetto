import { defineKind, el, fill, s } from "../../draw/core";

/**
 * Parallel wavy bands whose ripples swell and drift from one band to the next, in the style of op art.
 *
 * @category Art
 */
export const waves = /* @__PURE__ */ defineKind("waves", "Op-art waves", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f4f1ea", "#17171b"],
    ["#f2ede4", "#1f3a5f"],
    ["#f6efe0", "#c8442f", "#1d2b44"],
    ["#efe9dc", "#2b6f6a", "#e2a33b", "#7b2e4f"],
    ["#1a1a20", "#e9e2d0"],
    ["#f7f3ea", "#3a5a98", "#e46c4c"],
  ]);
  let out = fill(w, h, palette[0]);
  const inks = palette.slice(1);
  // Spacing between band centers; each band is about half of it, so ground and ink alternate.
  const spacing = unit * g.f(0.07, 0.11);
  const thick = spacing * g.f(0.45, 0.55);
  const wavelength = unit * g.f(0.35, 0.7);
  // Capped so the slopes never get so steep that the bands pinch thin.
  const amp = Math.min(spacing * g.f(0.7, 1.6), wavelength * 0.18);
  const count = Math.ceil(h / spacing) + 6;
  // The ripples either swell and fade down the frame or grow steadily, and their crests drift
  // sideways a little per band. Both change slowly enough that neighboring bands never touch.
  const swell = g.chance(0.5);
  const flip = g.chance(0.5);
  const drift = g.f(0.004, 0.009) * g.pick([-1, 1]) * wavelength;
  const halves = Math.ceil((w + wavelength * 4) / (wavelength / 2));
  for (let k = 0; k < count; k++) {
    const y = (k - 3) * spacing;
    const t = flip ? 1 - k / count : k / count;
    const a = amp * (swell ? 0.15 + 0.85 * Math.sin(t * Math.PI) : 0.1 + 0.9 * t);
    // A sine wave made of quadratic half-waves, starting well off the left edge.
    const x0 = -wavelength * 1.5 + drift * (k - count / 2);
    let d = s`M${x0} ${y}Q${x0 + wavelength / 4} ${y - 2 * a} ${x0 + wavelength / 2} ${y}`;
    for (let j = 1; j < halves; j++) d += s`T${x0 + ((j + 1) * wavelength) / 2} ${y}`;
    out += el("path", {
      d,
      fill: "none",
      stroke: inks[k % inks.length],
      "stroke-width": thick,
    });
  }
  note.alt("Parallel wavy bands rippling across the frame, in the style of op art");
  return out;
});
