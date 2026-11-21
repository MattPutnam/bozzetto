import { defineKind, el, fill, hsl, mix, s } from "../../draw/core";
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
    // A glazed plate, deep enough in color that the egg white stands out on it: rim, a pale lip and the well
    const plate = g.pick(["#5b8fb9", "#3f5e7a", "#7a9e7e", "#4f7a6a", "#c9a94e", "#8a6fa8", "#4a4f5c"]);
    out += el("circle", { cx, cy, r: radius, fill: plate });
    out += el("circle", { cx, cy, r: radius * 0.8, fill: mix(plate, "#ffffff", 0.18) });
    out += el("circle", { cx, cy, r: radius * 0.76, fill: mix(plate, "#000000", 0.08) });
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
  const white = blob(g, ex, ey, radius * 0.55, radius * 0.5, g.i(4, 6), 0.12, 0.08);
  // A soft shadow under its edge, then the white with a faint crisp rim
  out += el("path", {
    d: white,
    fill: "#000",
    opacity: "0.18",
    transform: s`translate(${radius * 0.025} ${radius * 0.045})`,
  });
  out += el("path", { d: white, fill: "#fbfbf6", stroke: "#e6dfcc", "stroke-width": radius * 0.02 });
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
