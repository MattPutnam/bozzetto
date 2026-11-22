import { defineKind, el, fill, type Point, pts, s } from "../../draw/core";
import { andList } from "../../draw/words";

/**
 * A playful scatter of squiggles, zigzags, triangles and dots, in 1980s Memphis style.
 *
 * @category Art
 */
export const confetti = /* @__PURE__ */ defineKind("confetti", "Memphis confetti", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#ff6b9a", "#ffd23f", "#3ec1d3", "#6a4c93", "#1b1b1f"],
    ["#f25f5c", "#ffe066", "#247ba0", "#70c1b3", "#1b1b1f"],
    ["#ff8fab", "#fcbf49", "#2ec4b6", "#3a0ca3", "#1b1b1f"],
    ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c"],
  ]);
  let out = fill(w, h, g.pick(["#fdf8ef", "#fff3e6", "#f2f7f5", "#fdeef4", "#fff8d6"]));
  // One shape per cell of a jittered grid, so the scatter stays even.
  const cell = unit * g.f(0.24, 0.3);
  const rows = Math.max(2, Math.round(h / cell));
  const cols = Math.max(2, Math.round(w / cell));
  const cw = w / cols;
  const ch = h / rows;
  const size = Math.min(cw, ch);
  const stroke = unit * 0.022;
  const made = new Set<string>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + g.f(0.3, 0.7)) * cw;
      const y = (row + g.f(0.3, 0.7)) * ch;
      const paint = g.pick(palette);
      const turn = s`rotate(${g.f(0, 360)} ${x} ${y})`;
      const len = size * g.f(0.5, 0.75);
      const shape = g.pick(["squiggle", "zigzag", "triangle", "dot", "ring", "bar"] as const);
      made.add(shape);
      const line = { fill: "none", stroke: paint, "stroke-width": stroke, "stroke-linecap": "round" } as const;
      if (shape === "squiggle") {
        // Three quick humps.
        const step = len / 3;
        const a = size * 0.12;
        out += el("path", {
          d: s`M${x - len / 2} ${y}q${step / 2} ${-a * 2} ${step} 0t${step} 0t${step} 0`,
          ...line,
          "stroke-linejoin": "round",
          transform: turn,
        });
      } else if (shape === "zigzag") {
        const step = len / 4;
        const a = size * 0.1;
        out += el("path", {
          d: s`M${x - len / 2} ${y + a}l${step} ${-2 * a} ${step} ${2 * a} ${step} ${-2 * a} ${step} ${2 * a}`,
          ...line,
          "stroke-linejoin": "miter",
          transform: turn,
        });
      } else if (shape === "triangle") {
        const r = size * g.f(0.2, 0.3);
        const corners: Point[] = [0, 1, 2].map(k => [
          x + r * Math.cos(((k * 2) / 3) * Math.PI - Math.PI / 2),
          y + r * Math.sin(((k * 2) / 3) * Math.PI - Math.PI / 2),
        ]);
        out += el("polygon", {
          points: pts(corners),
          ...(g.chance(0.6) ? { fill: paint } : { ...line, "stroke-linejoin": "round" }),
          transform: turn,
        });
      } else if (shape === "dot") {
        out += el("circle", { cx: x, cy: y, r: size * g.f(0.08, 0.16), fill: paint });
      } else if (shape === "ring") {
        out += el("circle", { cx: x, cy: y, r: size * g.f(0.12, 0.2), ...line });
      } else {
        // A short, fat bar.
        out += el("rect", {
          x: x - len / 2,
          y: y - stroke * 1.2,
          width: len,
          height: stroke * 2.4,
          fill: paint,
          transform: turn,
        });
      }
    }
  }
  // A few tiny dots in the gaps.
  const specks: Point[] = [];
  for (let k = g.i(cols, cols * 2); k > 0; k--) specks.push([g.f(0, w), g.f(0, h)]);
  out += el("path", {
    d: specks.map(([x, y]) => s`M${x} ${y}h0`).join(""),
    stroke: palette[palette.length - 1],
    "stroke-width": stroke * 1.2,
    "stroke-linecap": "round",
  });
  const names = ["squiggle", "zigzag", "triangle", "dot", "ring"]
    .filter(name => made.has(name))
    .map(name => name + "s");
  note.alt(`A playful scatter of ${andList(names.length ? names : ["bars"])}, in 1980s Memphis style`);
  return out;
});
