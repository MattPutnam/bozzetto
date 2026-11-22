import { defineKind, el, fill, hex, mix } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/**
 * Two or three soft-edged blocks on a dark ground, after the color-field painters.
 *
 * @category Art
 */
export const field = /* @__PURE__ */ defineKind("field", "Color field", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.f(0, 360);
  const margin = unit * 0.08;
  const gap = unit * 0.05;
  const count = g.i(2, 3);
  const blur = g.id("blur");
  const soft = unit * 0.012;
  // A soft blur for the block edges.
  let out = el(
    "defs",
    {},
    el(
      "filter",
      { id: blur, x: "-10%", y: "-10%", width: "120%", height: "120%" },
      el("feGaussianBlur", { stdDeviation: soft }),
    ),
  );
  // The dark ground.
  const ground = hex(hue, g.f(35, 60), g.f(22, 42));
  out += fill(w, h, ground);
  // The blocks share the length left over after margins and gaps, in proportion to their weights:
  // stacked on most canvases, side by side on a very wide one, so they always fill it.
  const wide = w > h * 1.8;
  const length = wide ? w : h;
  const weights = Array.from({ length: count }, () => g.f(0.6, 1.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const avail = length - 2 * margin - (count - 1) * gap;
  let at = margin;
  for (const weight of weights) {
    const size = (avail * weight) / total;
    // Fully opaque, with a touch of the ground mixed in, so the blur stays even across the block.
    const color = mix(hex(hue + g.f(-45, 45), g.f(40, 78), g.f(30, 70)), ground, 0.06);
    const x = wide ? at : margin;
    const y = wide ? margin : at;
    const bw = wide ? size : w - 2 * margin;
    const bh = wide ? h - 2 * margin : size;
    out += el("rect", { x, y, width: bw, height: bh, fill: color, filter: `url(#${blur})` });
    // A crisp copy over the middle, where the blur has nothing to soften, keeps it perfectly flat.
    const inset = soft * 3;
    out += el("rect", { x: x + inset, y: y + inset, width: bw - 2 * inset, height: bh - 2 * inset, fill: color });
    at += size + gap;
  }
  note.focus(w / 2, h / 2);
  note.alt(
    wide
      ? `${capitalize(numberWord(count))} soft-edged blocks of color side by side, in the style of a color-field painting`
      : `${capitalize(numberWord(count))} soft-edged bands of color, in the style of a color-field painting`,
  );
  return out;
});
