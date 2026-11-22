import { defineKind, el, fill, hsl, s } from "../../draw/core";
import { blob, sprinkles } from "../../draw/shapes";
import { SPRINKLES } from "./shared";

/**
 * A glazed donut from above, with sprinkles on some.
 *
 * @category Food
 */
export const donut = /* @__PURE__ */ defineKind("donut", "Donut", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.05, 0.05);
  const cy = h / 2 + h * g.f(-0.04, 0.04);
  const radius = unit * g.f(0.32, 0.38);
  const hole = radius * g.f(0.28, 0.34);
  const bg = hsl(g.f(0, 360), g.f(30, 55), g.f(82, 90));
  const glaze = g.pick(["#f49ac1", "#6b3e2e", "#fbf4e8", "#8fd3f4", "#f6d365", "#c9a7eb"]);
  let out = fill(w, h, bg);
  const plate = g.chance(0.5);
  if (plate) {
    // Plate, with a faint dip in the middle
    out += el("circle", { cx, cy: cy + unit * 0.015, r: radius * 1.28, fill: "#fff", opacity: "0.85" });
    out += el("circle", { cx, cy: cy + unit * 0.015, r: radius * 1.08, fill: "#000", opacity: "0.04" });
  }
  // Shadow
  out += el("circle", { cx, cy: cy + radius * 0.04, r: radius, fill: "#000", opacity: "0.08" });
  // Dough
  out += el("circle", { cx, cy, r: radius, fill: "#d99a5b" });
  // Glaze
  out += el("path", { d: blob(g, cx, cy, radius * 0.86, radius * 0.86, g.i(7, 11), 0.07, 0.05), fill: glaze });
  // Bare dough around the hole, then the hole itself
  out += el("circle", { cx, cy, r: hole * 1.35, fill: "#d99a5b" });
  out += el("circle", { cx, cy, r: hole, fill: bg });
  const sprinkled = g.chance(0.7);
  if (sprinkled)
    out += sprinkles(
      g,
      cx,
      cy,
      hole * 1.5,
      radius * 0.78,
      g.i(22, 40),
      radius * 0.09,
      glaze === "#fbf4e8" ? SPRINKLES.slice(0, 4) : SPRINKLES,
      radius * 0.035,
    );
  // Highlight
  out += el("path", {
    d: s`M ${cx - radius * 0.55} ${cy - radius * 0.45}
         Q ${cx - radius * 0.2} ${cy - radius * 0.72} ${cx + radius * 0.15} ${cy - radius * 0.68}`,
    stroke: "#fff",
    "stroke-width": radius * 0.05,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.4",
  });
  note.alt(`A glazed donut${sprinkled ? " with sprinkles" : ""}${plate ? " on a plate" : ""}`);
  note.focus(cx, cy);
  return out;
});
