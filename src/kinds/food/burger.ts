import { defineKind, el, hsl, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { sidePlate } from "./shared";

const BUNS = ["#e7a456", "#d98c3f", "#c9772f", "#e3b06a"];

/** A burger on a plate, seen from the side: bun, patty and a few fillings. */
export const burger = /* @__PURE__ */ defineKind("burger", "Burger", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.64, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const cx = w / 2;
  const plateY = h * 0.84;
  const bw = unit * g.f(0.24, 0.28);
  const plateRx = bw * 1.6;
  const plateRy = plateRx * 0.22;
  out += sidePlate(cx, plateY, plateRx, plateRy);
  const bun = g.pick(BUNS);
  const double = g.chance(0.3);
  const cheese = g.chance(0.7);
  const lettuce = g.chance(0.8);
  const tomato = g.chance(0.6);
  const onion = g.chance(0.35);
  const seeds = g.chance(0.75);
  let y = plateY + plateRy * 0.2;
  // Bottom bun
  const hb = bw * 0.28;
  out += el("rect", { x: cx - bw * 0.96, y: y - hb, width: bw * 1.92, height: hb, rx: hb * 0.45, fill: bun });
  y -= hb * 0.95;
  for (let k = 0; k < (double ? 2 : 1); k++) {
    // Patty
    const ph = bw * 0.26;
    out += el("rect", { x: cx - bw * 1.03, y: y - ph, width: bw * 2.06, height: ph, rx: ph * 0.4, fill: "#6b3e2e" });
    out += el("rect", {
      x: cx - bw * 0.95,
      y: y - ph * 0.82,
      width: bw * 1.9,
      height: ph * 0.12,
      rx: ph * 0.06,
      fill: "#8a553c",
    });
    y -= ph * 0.95;
    if (cheese) {
      // A square slice of cheese whose corners droop over the patty
      const t = bw * 0.06;
      let d = s`M ${cx - bw * 1.08} ${y - t * 0.5} L ${cx + bw * 1.08} ${y - t * 0.5} L ${cx + bw * 1.08} ${y + t * 0.5}`;
      for (const at of [0.7, 0.05, -0.62]) {
        const xd = cx + bw * (at + g.f(-0.08, 0.08));
        const dw = bw * 0.14;
        d += s` L ${xd + dw} ${y + t * 0.5} L ${xd} ${y + t * 0.5 + ph * g.f(0.4, 0.65)} L ${xd - dw} ${y + t * 0.5}`;
      }
      d += s` L ${cx - bw * 1.08} ${y + t * 0.5} Z`;
      out += el("path", { d, fill: "#f6c445", stroke: "#f6c445", "stroke-width": t * 0.6, "stroke-linejoin": "round" });
      y -= t;
    }
  }
  if (onion) {
    // Onion slice
    const oh = bw * 0.06;
    out += el("rect", { x: cx - bw * 0.95, y: y - oh, width: bw * 1.9, height: oh, rx: oh * 0.5, fill: "#ead9f2" });
    y -= oh * 0.9;
  }
  if (tomato) {
    // Tomato slice
    const th = bw * 0.11;
    out += el("rect", { x: cx - bw * 0.98, y: y - th, width: bw * 1.96, height: th, rx: th * 0.45, fill: "#e0473c" });
    y -= th * 0.9;
  }
  if (lettuce) {
    // A ruffled leaf of lettuce, frilled along its lower edge
    const lh = bw * 0.1;
    const frills = 7;
    let d = s`M ${cx - bw * 1.12} ${y - lh} L ${cx + bw * 1.12} ${y - lh}`;
    for (let k = 0; k < frills; k++) {
      const x0 = cx + bw * 1.12 - (k * bw * 2.24) / frills;
      const x1 = x0 - (bw * 2.24) / frills;
      d += s` Q ${(x0 + x1) / 2} ${y + lh * g.f(0.6, 1.3)} ${x1} ${y}`;
    }
    out += el("path", { d: d + " Z", fill: "#7bc043" });
    y -= lh;
  }
  // Top bun: a dome with rounded bottom corners
  const hd = bw * 0.72;
  const yb = y + bw * 0.03;
  out += el("path", {
    d: s`M ${cx - bw} ${yb - hd * 0.12} Q ${cx - bw} ${yb} ${cx - bw * 0.88} ${yb} L ${cx + bw * 0.88} ${yb}
         Q ${cx + bw} ${yb} ${cx + bw} ${yb - hd * 0.12}
         C ${cx + bw} ${yb - hd * 1.25} ${cx - bw} ${yb - hd * 1.25} ${cx - bw} ${yb - hd * 0.12} Z`,
    fill: bun,
  });
  // Highlight
  out += el("path", {
    d: s`M ${cx - bw * 0.72} ${yb - hd * 0.5} Q ${cx - bw * 0.55} ${yb - hd * 0.85} ${cx - bw * 0.15} ${yb - hd * 0.9}`,
    stroke: "#fff",
    "stroke-width": bw * 0.05,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.35",
  });
  if (seeds) {
    // Sesame seeds in two loose rows over the dome
    let d = "";
    for (const [row, count] of [
      [0.78, 5],
      [0.5, 6],
    ] as const) {
      for (let k = 0; k < count; k++) {
        const u = -0.72 + (1.44 * (k + 0.5)) / count + g.f(-0.06, 0.06);
        const top = hd * (0.12 + 0.85 * Math.sqrt(1 - u * u));
        const sx = cx + u * bw;
        const sy = yb - top * (row + g.f(-0.05, 0.05));
        const a = g.f(-0.6, 0.6);
        const dx = Math.cos(a) * bw * 0.035;
        const dy = Math.sin(a) * bw * 0.035;
        d += s`M${sx - dx} ${sy - dy}L${sx + dx} ${sy + dy}`;
      }
    }
    out += el("path", { d, stroke: "#fbf1d6", "stroke-width": bw * 0.04, "stroke-linecap": "round" });
  }
  const fillings = andList([cheese && "cheese", lettuce && "lettuce", tomato && "tomato", onion && "onion"]);
  note.alt(`A ${double ? "double " : ""}burger${fillings ? ` with ${fillings}` : ""} on a plate`);
  note.focus(cx, y);
  return out;
});
