import { defineKind, el, s } from "../../draw/core";
import { numberWord } from "../../draw/words";

/**
 * A grid of tiles, each holding a circle, half circle, quarter circle or triangle.
 *
 * @category Art
 */
export const bauhaus = /* @__PURE__ */ defineKind("bauhaus", "Bauhaus tiles", (g, w, h, note) => {
  const palette = g.pick([
    ["#e63946", "#f1c453", "#1d3557", "#f1faee"],
    ["#d1495b", "#edae49", "#00798c", "#30638e"],
    ["#222222", "#e9e3d5", "#c44536", "#e0a458"],
    ["#3d405b", "#e07a5f", "#f2cc8f", "#81b29a"],
  ]);
  const cell = Math.min(w, h) / 3;
  const rows = Math.ceil(h / cell);
  const cols = Math.ceil(w / cell);
  let out = "";
  const used = new Set<number>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cell;
      const y = row * cell;
      // Two different colors: one for the tile, one for its shape.
      const ground = g.pick(palette);
      let paint = g.pick(palette);
      while (paint === ground) paint = g.pick(palette);
      // A quarter-turn rotation about the tile center, used by the shapes that have a direction.
      const transform = s`rotate(${90 * g.i(0, 3)} ${x + cell / 2} ${y + cell / 2})`;
      // The tile, slightly oversized so no seams show.
      out += el("rect", { x, y, width: cell + 0.5, height: cell + 0.5, fill: ground });
      const shape = g.i(0, 4);
      used.add(shape);
      switch (shape) {
        case 0:
          // A large circle.
          out += el("circle", { cx: x + cell / 2, cy: y + cell / 2, r: cell * 0.42, fill: paint });
          break;
        case 1:
          // A half circle.
          out += el("path", {
            d: s`M${x} ${y + cell / 2}
                 A ${cell / 2} ${cell / 2} 0 0 1 ${x + cell} ${y + cell / 2}Z`,
            fill: paint,
            transform,
          });
          break;
        case 2:
          // A quarter circle.
          out += el("path", {
            d: s`M${x} ${y}
                 L${x + cell} ${y}
                 A ${cell} ${cell} 0 0 1 ${x} ${y + cell}Z`,
            fill: paint,
            transform,
          });
          break;
        case 3:
          // A right triangle.
          out += el("polygon", { points: s`${x},${y} ${x + cell},${y} ${x},${y + cell}`, fill: paint, transform });
          break;
        default:
          // A small circle.
          out += el("circle", { cx: x + cell / 2, cy: y + cell / 2, r: cell * 0.22, fill: paint });
      }
    }
  }
  // Name the shapes that appear, in a fixed order; both circle sizes read as "circles".
  const names = [
    used.has(0) || used.has(4) ? "circles" : "",
    used.has(1) ? "half circles" : "",
    used.has(2) ? "quarter circles" : "",
    used.has(3) ? "triangles" : "",
  ].filter(Boolean);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  note.alt(`A grid of ${numberWord(rows * cols)} Bauhaus-style tiles with ${list}`);
  return out;
});
