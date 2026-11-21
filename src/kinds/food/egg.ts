import { defineKind, el, fill, hsl, s } from "../../draw/core";
import { blob } from "../../draw/shapes";

/** A fried egg in a pan or on a plate, sometimes with bacon. */
export const egg = /* @__PURE__ */ defineKind("egg", "Fried egg", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const pan = g.chance(0.5);
  const radius = unit * 0.42;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 50), g.f(80, 88)));
  if (pan) {
    // Pan: handle, rim, and base
    out += el("rect", {
      x: cx + radius * 0.8,
      y: cy - radius * 0.1,
      width: w,
      height: radius * 0.2,
      rx: radius * 0.1,
      fill: "#2b2b2b",
      transform: s`rotate(${g.f(-30, 30)} ${cx} ${cy})`,
    });
    out += el("circle", { cx, cy, r: radius, fill: "#3a3a3a" });
    out += el("circle", { cx, cy, r: radius * 0.88, fill: "#2b2b2b" });
  } else {
    // Plate
    out += el("circle", { cx, cy, r: radius, fill: "#fff" });
    out += el("circle", { cx, cy, r: radius * 0.78, fill: "#000", opacity: "0.04" });
  }
  const bacon = g.chance(0.45);
  if (bacon)
    for (let k = 0; k < 2; k++) {
      // A rasher of bacon: a wavy stroke with a paler streak of fat along it
      const by = cy + radius * (0.25 + k * 0.22);
      const bx = cx - radius * 0.5;
      const wave = s`M ${bx} ${by}
                     q ${radius * 0.12} ${-radius * 0.08} ${radius * 0.24} 0
                     t ${radius * 0.24} 0
                     t ${radius * 0.24} 0
                     t ${radius * 0.24} 0`;
      out += el("path", {
        d: wave,
        stroke: "#b5452f",
        "stroke-width": radius * 0.12,
        fill: "none",
        "stroke-linecap": "round",
      });
      out += el("path", {
        d: wave,
        stroke: "#f2b8a2",
        "stroke-width": radius * 0.035,
        fill: "none",
        "stroke-linecap": "round",
      });
    }
  // White
  const ex = cx + radius * g.f(-0.12, 0.12);
  const ey = cy - radius * g.f(0.05, 0.2);
  out += el("path", { d: blob(g, ex, ey, radius * 0.55, radius * 0.5, g.i(4, 6), 0.12, 0.08), fill: "#fbfbf6" });
  // Yolk and its shine
  const yolkX = ex + radius * g.f(-0.12, 0.12);
  const yolkY = ey + radius * g.f(-0.1, 0.05);
  out += el("circle", { cx: yolkX, cy: yolkY, r: radius * 0.2, fill: "#f6a21a" });
  note.alt(`A fried egg ${pan ? "in a pan" : "on a plate"}${bacon ? " with two rashers of bacon" : ""}`);
  note.focus(yolkX, yolkY);
  out += el("circle", {
    cx: yolkX - radius * 0.06,
    cy: yolkY - radius * 0.07,
    r: radius * 0.05,
    fill: "#fff",
    opacity: "0.6",
  });
  return out;
});
