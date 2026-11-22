import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { numberWord } from "../../draw/words";

const SPONGE = ["#f3d9a4", "#7b4a35", "#f7e7c6", "#e9b872"];

const CREAM = ["#fbf4e8", "#f7c6d0", "#f6d365", "#6b3e2e"];

/**
 * A layered slice of cake on a plate, with a berry on top.
 *
 * @category Food
 */
export const cake = /* @__PURE__ */ defineKind("cake", "Slice of cake", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const sponge = g.pick(SPONGE);
  const cream = g.pick(CREAM.filter(c => c !== sponge));
  const frost = g.chance(0.5) ? cream : g.pick(CREAM);
  let out = table(g, w, h, h * 0.72, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  // The plate is sized to the slice's footprint, and the slice sits centered on it:
  // the front edge in the near half of the plate, the back corner in the far half.
  const cx = w / 2;
  const plateY = h * 0.8;
  const frontW = unit * g.f(0.3, 0.38);
  const dx = frontW * g.f(0.45, 0.6);
  const frontH = unit * g.f(0.28, 0.34);
  const plateRx = Math.max(unit * 0.46, (frontW + dx) * 0.72);
  const plateRy = plateRx * 0.22;
  const dy = plateRy * g.f(0.65, 0.85);
  const x0 = cx - (frontW + dx) / 2;
  const bottomY = plateY + plateRy * 0.4;
  const topY = bottomY - frontH;
  // Plate: shadow, rim, and well
  out += el("ellipse", { cx, cy: plateY + plateRy * 0.12, rx: plateRx, ry: plateRy, fill: "#000", opacity: "0.08" });
  out += el("ellipse", { cx, cy: plateY, rx: plateRx, ry: plateRy, fill: "#fff" });
  out += el("ellipse", { cx, cy: plateY, rx: plateRx * 0.75, ry: plateRy * 0.72, fill: "#000", opacity: "0.05" });
  // Shaded side of the slice
  out += el("polygon", {
    points: pts([
      [x0 + frontW, bottomY],
      [x0 + frontW + dx, bottomY - dy],
      [x0 + frontW + dx, topY - dy],
      [x0 + frontW, topY],
    ]),
    fill: mix(sponge, "#000000", 0.18),
  });
  // Layers of sponge and cream on the front face
  const layers = g.i(2, 3) * 2 + 1;
  for (let k = 0; k < layers; k++) {
    const y0 = topY + (frontH * k) / layers;
    const isCream = k % 2 === 1;
    out += el("rect", { x: x0, y: y0, width: frontW, height: frontH / layers + 0.5, fill: isCream ? cream : sponge });
  }
  // Frosting on top, and its front edge
  out += el("polygon", {
    points: pts([
      [x0, topY],
      [x0 + frontW, topY],
      [x0 + frontW + dx, topY - dy],
      [x0 + dx * 0.15, topY - dy * 0.12],
    ]),
    fill: frost,
  });
  out += el("rect", { x: x0, y: topY, width: frontW, height: frontH * 0.06, fill: frost });
  const tx = x0 + frontW * 0.55 + dx * 0.4;
  const ty = topY - dy * 0.45;
  const berry = g.chance(0.5);
  const tiers = (layers + 1) / 2;
  note.alt(
    `A slice of ${numberWord(tiers)}-layer cake on a plate, topped with ${berry ? "a strawberry" : "cream and a cherry"}`,
  );
  note.focus(tx, ty - unit * 0.04);
  if (berry) {
    // Strawberry and its leaves
    out += el("path", {
      d: s`M ${tx} ${ty - unit * 0.08}
           C ${tx - unit * 0.07} ${ty - unit * 0.07} ${tx - unit * 0.06} ${ty + unit * 0.01} ${tx} ${ty + unit * 0.01}
           C ${tx + unit * 0.06} ${ty + unit * 0.01} ${tx + unit * 0.07} ${ty - unit * 0.07} ${tx} ${ty - unit * 0.08}
           Z`,
      fill: "#e0384f",
    });
    out += el("path", {
      d: s`M ${tx - unit * 0.03} ${ty - unit * 0.085}
           L ${tx} ${ty - unit * 0.06}
           L ${tx + unit * 0.03} ${ty - unit * 0.085}`,
      stroke: "#4b8a2a",
      "stroke-width": unit * 0.018,
      fill: "none",
      "stroke-linecap": "round",
    });
  } else {
    // A dollop of cream with a cherry
    out += el("circle", {
      cx: tx,
      cy: ty - unit * 0.03,
      r: unit * 0.045,
      fill: frost === "#fbf4e8" ? "#f7c6d0" : "#fbf4e8",
    });
    out += el("circle", { cx: tx, cy: ty - unit * 0.09, r: unit * 0.035, fill: "#c1121f" });
  }
  return out;
});
