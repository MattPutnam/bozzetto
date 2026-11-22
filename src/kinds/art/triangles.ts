import { defineKind, el, fill, s } from "../../draw/core";
import { numberWord } from "../../draw/words";

/**
 * A tiling of triangles in a few colors, shading from one side of the frame to the other.
 *
 * @category Art
 */
export const triangles = /* @__PURE__ */ defineKind("triangles", "Triangle tiling", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"],
    ["#1d3557", "#457b9d", "#a8dadc", "#f1faee", "#e63946"],
    ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
    ["#0b3954", "#087e8b", "#bfd7ea", "#ff5a5f", "#c81d25"],
    ["#3d405b", "#81b29a", "#f2cc8f", "#e07a5f", "#f4f1de"],
  ]);
  const colors = g.chance(0.5) ? palette : [...palette].reverse();
  const side = unit * g.f(0.2, 0.3);
  const tall = side * 0.866;
  // Colors run in order along a random direction, with noise so the steps break up.
  const angle = g.f(0, Math.PI * 2);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const span = Math.abs(dx) * w + Math.abs(dy) * h;
  const lo = Math.min(0, dx * w) + Math.min(0, dy * h);
  const noise = g.f(0.25, 0.5);
  const paths: string[] = colors.map(() => "");
  let out = fill(w, h, colors[0]);
  const rows = Math.ceil(h / tall);
  const cols = Math.ceil(w / (side / 2)) + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      // Triangles alternate pointing up and down along each row.
      const up = (col + row) % 2 === 0;
      const x = (col * side) / 2;
      const y = row * tall;
      const t = ((x + side / 2) * dx + (y + tall / 2) * dy - lo) / span + g.f(-noise, noise);
      const index = Math.max(0, Math.min(colors.length - 1, Math.floor(t * colors.length)));
      // Each triangle is nudged a hair larger so no seams show.
      paths[index] += up
        ? s`M${x + side / 2} ${y - 0.3}l${side / 2 + 0.5} ${tall + 0.6}h${-side - 1}z`
        : s`M${x - 0.5} ${y - 0.3}h${side + 1}l${-side / 2 - 0.5} ${tall + 0.6}z`;
    }
  }
  out += paths.map((d, k) => (d ? el("path", { d, fill: colors[k] }) : "")).join("");
  note.alt(`A tiling of triangles in ${numberWord(colors.length)} colors, shading across the frame`);
  return out;
});
