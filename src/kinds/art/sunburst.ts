import { defineKind, el, fill, type Point, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

/**
 * Rays fanning out from a point, often around a round sun, like a 1960s sunburst.
 *
 * @category Art
 */
export const sunburst = /* @__PURE__ */ defineKind("sunburst", "Sunburst", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f6c453", "#f08a4b", "#d1495b"],
    ["#f4e3c1", "#e9b872", "#c0603d"],
    ["#1f3b57", "#2c5f7c", "#f2c14e"],
    ["#fde2c4", "#f7b2a1", "#e6676b"],
    ["#2b2d42", "#3f4363", "#ef8354"],
    ["#e8f1e4", "#9cc5a1", "#2f6f62"],
  ]);
  // Where the rays start: the middle, low on the bottom edge, or a lower corner.
  const where = g.pick(["center", "bottom", "bottom", "corner"] as const);
  const side = g.pick([-1, 1]);
  const ox = where === "center" ? w * g.f(0.4, 0.6) : where === "bottom" ? w * g.f(0.35, 0.65) : side < 0 ? 0 : w;
  const oy = where === "center" ? h * g.f(0.4, 0.6) : h * g.f(0.92, 1);
  const reach = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)) * 1.1;
  let out = fill(w, h, palette[0]);
  // Rays alternate with the ground; a tapered spread leaves a gap at the hub.
  const count = g.i(9, 18) * (where === "center" ? 2 : 1);
  const span = where === "center" ? Math.PI * 2 : where === "bottom" ? Math.PI : Math.PI / 2;
  const first = where === "center" ? g.f(0, Math.PI) : where === "bottom" ? Math.PI : side < 0 ? -Math.PI / 2 : Math.PI;
  const step = span / count;
  const share = g.f(0.35, 0.55);
  const rays: Point[] = [];
  let d = "";
  for (let k = 0; k < count; k++) {
    const a = first + step * (k + (1 - share) / 2);
    const b = a + step * share;
    rays.push([ox + Math.cos(a) * reach, oy + Math.sin(a) * reach]);
    d += s`M${ox} ${oy}L${ox + Math.cos(a) * reach} ${oy + Math.sin(a) * reach}L${ox + Math.cos(b) * reach} ${oy + Math.sin(b) * reach}Z`;
  }
  out += el("path", { d, fill: palette[1] });
  // The sun at the hub, with a ring around it.
  const sun = g.chance(0.8);
  if (sun) {
    const r = unit * (where === "corner" ? g.f(0.3, 0.42) : g.f(0.16, 0.26));
    out += el("circle", { cx: ox, cy: oy, r: r * g.f(1.2, 1.35), fill: palette[0] });
    out += el("circle", { cx: ox, cy: oy, r, fill: palette[2] });
  }
  note.focus(ox === 0 ? unit * 0.15 : ox === w ? w - unit * 0.15 : ox, Math.min(oy, h - unit * 0.15));
  const from = where === "center" ? "" : where === "bottom" ? " from the bottom edge" : " from a lower corner";
  note.alt(
    `${count > 12 ? "Rays" : `${capitalize(numberWord(count))} rays`} fanning out${from}${sun ? " around a round sun" : ""}, like a retro sunburst`,
  );
  return out;
});
