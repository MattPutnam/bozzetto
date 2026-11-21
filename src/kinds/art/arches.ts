import { defineKind, el, fill, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/** Rainbow arches of nested bands standing on the ground, in mid-century colors. */
export const arches = /* @__PURE__ */ defineKind("arches", "Rainbow arches", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#c4673f", "#e3a54a", "#9aa77f", "#e8c4b0", "#5e7b78"],
    ["#b5523b", "#f0b45c", "#6d8f88", "#f2d4c2", "#2f4858"],
    ["#d9824b", "#efc66b", "#a7b89a", "#c77c78", "#56596e"],
    ["#a0522d", "#dda15e", "#606c38", "#fefae0", "#bc6c25"],
  ]);
  let out = fill(w, h, g.pick(["#f4ebdd", "#f1e4d3", "#eee3cf", "#f6eee6"]));
  // A low ground strip, sometimes.
  const ground = g.chance(0.5) ? h * g.f(0.06, 0.12) : 0;
  const base = h - ground;
  // Enough arches to span a wide frame; their outer radii fit both the width and the height.
  const count = Math.max(1, Math.min(4, Math.round((w / h) * g.f(0.9, 1.3))));
  const slot = w / count;
  const sun = g.chance(0.45);
  let biggest: [number, number, number] = [0, 0, 0];
  const bands = g.i(3, 5);
  const archs: string[] = [];
  const outers = new Set<string>();
  for (let k = 0; k < count; k++) {
    const outer = Math.min(slot * g.f(0.36, 0.46), base * g.f(0.5, 0.64));
    const cx = slot * (k + 0.5) + slot * g.f(-0.06, 0.06);
    // Legs lift the round top above the ground; taller frames get longer legs.
    const legs = Math.max(0, base - outer - h * g.f(0.12, 0.22)) * g.f(0.5, 1);
    const cy = base - legs;
    const band = outer / (bands + g.f(0.4, 1.4));
    const start = g.i(0, palette.length - 1);
    outers.add(palette[start]);
    let arch = "";
    for (let j = 0; j < bands; j++) {
      // Each band is a thick stroke along the middle of its ring.
      const r = outer - band * (j + 0.5);
      arch += el("path", {
        d: s`M${cx - r} ${base + 1}V${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}V${base + 1}`,
        fill: "none",
        stroke: palette[(start + j) % palette.length],
        "stroke-width": band + 0.6,
      });
    }
    archs.push(arch);
    if (outer > biggest[2]) biggest = [cx, cy, outer];
  }
  // A sun in the sky behind, placed in a gap above the arches.
  if (sun) {
    const r = unit * g.f(0.07, 0.11);
    const x = count > 1 ? slot * g.i(1, count - 1) : w * g.pick([0.2, 0.8]);
    out += el("circle", { cx: x, cy: Math.max(r * 1.6, h * g.f(0.15, 0.25)), r, fill: g.pick(palette) });
  }
  out += archs.join("");
  // The ground takes a color no arch's outer band uses, so the arches stand out against it.
  const soil = palette.find(c => !outers.has(c)) ?? palette[0];
  if (ground) out += el("rect", { y: base, width: w, height: ground + 1, fill: soil });
  note.focus(biggest[0], biggest[1] - biggest[2] / 2);
  note.alt(
    `${count === 1 ? "A rainbow arch" : `${capitalize(numberWord(count))} rainbow arches`} of ${numberWord(bands)} nested bands${sun ? " under a round sun" : ""}, in mid-century style`,
  );
  return out;
});
