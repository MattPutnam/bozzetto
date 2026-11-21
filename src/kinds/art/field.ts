import { defineKind, el, fill, hsl } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/** Two or three soft-edged bands on a dark ground, after the color-field painters. */
export const field = /* @__PURE__ */ defineKind("field", "Color field", (g, w, h, note) => {
  const hue = g.f(0, 360);
  const margin = w * 0.08;
  const gap = h * 0.05;
  const count = g.i(2, 3);
  const blur = g.id("blur");
  // A soft blur for the band edges.
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: "-10%", y: "-10%", width: "120%", height: "120%" },
      el("feGaussianBlur", { stdDeviation: Math.min(w, h) * 0.012 }),
    ),
  );
  // The dark ground.
  out += fill(w, h, hsl(hue, g.f(35, 60), g.f(22, 42)));
  // The bands share the height left over after margins and gaps, in proportion to their weights.
  const weights = Array.from({ length: count }, () => g.f(0.6, 1.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const avail = h - 2 * margin - (count - 1) * gap;
  let y = margin;
  for (const weight of weights) {
    const bandH = (avail * weight) / total;
    out += el("rect", {
      x: margin,
      y,
      width: w - 2 * margin,
      height: bandH,
      fill: hsl(hue + g.f(-45, 45), g.f(40, 78), g.f(30, 70)),
      filter: `url(#${blur})`,
      opacity: "0.94",
    });
    y += bandH + gap;
  }
  note.alt(`${capitalize(numberWord(count))} soft-edged bands of color, in the style of a color-field painting`);
  return out;
});
