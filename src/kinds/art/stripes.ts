import { defineKind, el, fill } from "../../draw/core";

/** Hard-edged stripes of varied widths, tilted across the frame. */
export const stripes = /* @__PURE__ */ defineKind("stripes", "Hard-edge stripes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#f3ead8", "#e4572e", "#29335c", "#f3a712", "#669bbc"],
    ["#f6f1e7", "#2a9d8f", "#e9c46a", "#e76f51", "#264653"],
    ["#1e1e24", "#f2c14e", "#f78154", "#4d9de0", "#e8e1d4"],
    ["#f4efe6", "#c1121f", "#003049", "#fdf0d5", "#669bbc"],
    ["#ede7f6", "#5e548e", "#9f86c0", "#e0b1cb", "#231942"],
  ]);
  const angle = g.pick([0, 90, 30, -30, 45, -45, 60, -60, 20, -20]);
  const diag = Math.hypot(w, h);
  let out = fill(w, h, palette[0]);
  // Widths come in a few multiples of one module, so the rhythm reads as designed.
  const module = unit * g.f(0.03, 0.05);
  const widths = [1, 1, 2, 3, 4, 6];
  let x = w / 2 - diag / 2;
  let last = palette[0];
  let bands = "";
  while (x < w / 2 + diag / 2) {
    const width = module * g.pick(widths);
    let paint = g.pick(palette);
    while (paint === last) paint = g.pick(palette);
    last = paint;
    if (paint !== palette[0]) {
      bands += el("rect", { x, y: h / 2 - diag / 2, width: width + 0.4, height: diag, fill: paint });
    }
    x += width;
  }
  out += el("g", { transform: angle ? `rotate(${angle} ${w / 2} ${h / 2})` : undefined }, bands);
  const tilt = angle === 0 ? "Upright" : angle === 90 ? "Level" : "Slanting";
  note.alt(`${tilt} hard-edged stripes of varied widths, in the style of hard-edge painting`);
  return out;
});
