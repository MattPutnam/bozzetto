import { defineKind, el } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

const OFF_WHITE = "#f3f0e6";

/**
 * The canvas split again and again into rectangles, a few of them filled with primaries.
 *
 * @category Art
 */
export const grid = /* @__PURE__ */ defineKind("grid", "Primary grid", (g, w, h, note) => {
  type Cell = { x: number; y: number; w: number; h: number };
  const cells: Cell[] = [{ x: 0, y: 0, w, h }];
  // Repeatedly split one of the largest cells across its longer side.
  const splits = g.i(5, 9);
  for (let k = 0; k < splits; k++) {
    cells.sort((a, b) => b.w * b.h - a.w * a.h);
    const cell = cells.splice(g.chance(0.7) ? 0 : Math.min(1, cells.length - 1), 1)[0];
    const t = g.f(0.28, 0.72);
    if (cell.w / cell.h > g.f(0.7, 1.5))
      cells.push({ ...cell, w: cell.w * t }, { ...cell, x: cell.x + cell.w * t, w: cell.w * (1 - t) });
    else cells.push({ ...cell, h: cell.h * t }, { ...cell, y: cell.y + cell.h * t, h: cell.h * (1 - t) });
  }
  const palette = g.pick([
    ["#d23a2a", "#1f4fa0", "#f2c230", "#17171c"],
    ["#c8553d", "#2d5d7b", "#e9b44c", "#2b2b2b"],
    ["#e4572e", "#29335c", "#f3a712", "#669bbc"],
  ]);
  // Most cells stay off-white, but at least one gets a color.
  const fills: string[] = cells.map(() => (g.chance(0.32) ? g.pick(palette) : OFF_WHITE));
  if (!fills.some(f => f !== OFF_WHITE)) fills[g.i(0, fills.length - 1)] = palette[0];
  // The cells, outlined in thick dark lines.
  const strokeWidth = Math.min(w, h) * 0.02;
  const colored = cells.filter((_, k) => fills[k] !== OFF_WHITE);
  note.alt(
    `${capitalize(numberWord(cells.length))} rectangles divided by thick lines, ${numberWord(colored.length)} filled with color, after Mondrian`,
  );
  // Focus on the largest colored cell.
  const main = colored.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
  note.focus(main.x + main.w / 2, main.y + main.h / 2);
  return cells
    .map((cell, k) =>
      el("rect", {
        x: cell.x,
        y: cell.y,
        width: cell.w,
        height: cell.h,
        fill: fills[k],
        stroke: "#15151a",
        "stroke-width": strokeWidth,
      }),
    )
    .join("");
});
