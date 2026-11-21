import { defineKind, el, fill, hsl } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/** Squares nested low in the frame in neighboring colors, after Albers. */
export const squares = /* @__PURE__ */ defineKind("squares", "Nested squares", (g, w, h, note) => {
  const hue = g.f(0, 360);
  const dir = g.pick([-1, 1]);
  const step = g.f(5, 18);
  const sat = g.f(35, 75);
  const baseLight = g.f(28, 62);
  // Each square steps lighter on dark grounds and darker on light ones.
  const lightStep = g.f(7, 13) * (baseLight > 50 ? -1 : 1);
  const count = g.i(3, 4);
  // The outermost square is the ground.
  let out = fill(w, h, hsl(hue, sat, baseLight));
  const size = Math.min(w, h);
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  for (let k = 1; k < count; k++) {
    const side = size * (1 - k * (count === 4 ? 0.22 : 0.28));
    const margin = (size - side) / 2;
    // Margins run 1 : 2 : 3 from bottom to sides to top.
    out += el("rect", {
      x: ox + margin,
      y: oy + margin * 1.5,
      width: side,
      height: side,
      fill: hsl(hue + dir * step * k, sat + g.f(-8, 8), baseLight + lightStep * k),
    });
    // The innermost square, set low in the frame.
    note.focus(ox + margin + side / 2, oy + margin * 1.5 + side / 2);
  }
  note.alt(`${capitalize(numberWord(count))} nested squares set low in the frame, after Josef Albers`);
  return out;
});
