import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { capitalize, numberWord } from "../../draw/words";
import { glow } from "./shared";

/**
 * A few lit candles of different heights on a table in a dim room.
 *
 * @category Objects
 */
export const candles = /* @__PURE__ */ defineKind("candles", "Candles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.74, 0.8);
  const hue = g.f(0, 360);
  const count = g.i(3, 5);
  const cw = unit * g.f(0.045, 0.06);
  const gap = unit * g.f(0.03, 0.06);
  const spacing = cw * 2 + gap;
  const flameH = cw * 1.5;
  const maxH = Math.min(unit * 0.46, top - h * 0.12 - flameH);
  const wax = g.pick([
    ["#f3ead8", "#efe2c8", "#f7f0e2"],
    ["#f3ead8", "#efe2c8", "#f7f0e2"],
    ["#e9b8c4", "#f0c9d2", "#e3a9b8"],
    ["#b9d8c2", "#a8cdb4", "#c9e2d0"],
    ["#c7b8e0", "#b6a5d6", "#d6cbea"],
    ["#f2d38a", "#ecc66f", "#f6dea6"],
    ["#a9c9e3", "#98bddb", "#bcd5ea"],
  ]);
  const holder = g.pick(["none", "plate", "dishes"]);
  const id = g.id("glow");
  let out = el("defs", {}, glow(id, "#ffd27a", 0.5));
  out += table(g, w, h, top, hsl(hue, g.f(15, 30), g.f(18, 28)), hsl(g.f(15, 35), g.f(25, 40), g.f(22, 32)));
  // Distinct heights, shuffled along the row
  const heights = Array.from(
    { length: count },
    (_, k) => unit * 0.12 + ((maxH - unit * 0.12) * (k + g.f(0.1, 0.9))) / count,
  );
  for (let k = heights.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [heights[k], heights[j]] = [heights[j], heights[k]];
  }
  const startX = w / 2 - ((count - 1) * spacing) / 2;
  const baseY = top + unit * g.f(0.05, 0.07);
  // Light pooling around the candles
  const tallest = Math.max(...heights);
  out += el("circle", {
    cx: w / 2,
    cy: baseY - tallest,
    r: Math.max(unit * 0.55, count * spacing * 0.9),
    fill: `url(#${id})`,
  });
  if (holder === "plate") {
    const plate = g.pick(["#c9a24a", "#e9e3d5", "#8a6b4a"]);
    const half = ((count - 1) * spacing) / 2 + cw * 1.8;
    out += el("ellipse", {
      cx: w / 2,
      cy: baseY + unit * 0.01,
      rx: half,
      ry: unit * 0.035,
      fill: mix(plate, "#000000", 0.25),
    });
    out += el("ellipse", { cx: w / 2, cy: baseY, rx: half * 0.97, ry: unit * 0.028, fill: plate });
  }
  let flames = "";
  for (let k = 0; k < count; k++) {
    const x = startX + k * spacing + g.f(-0.1, 0.1) * gap;
    const ch = heights[k];
    const color = g.pick(wax);
    const y = baseY - ch;
    if (holder === "dishes") {
      out += el("ellipse", { cx: x, cy: baseY + unit * 0.008, rx: cw * 1.6, ry: unit * 0.022, fill: "#9a7b3a" });
      out += el("ellipse", { cx: x, cy: baseY, rx: cw * 1.5, ry: unit * 0.016, fill: "#c9a24a" });
    } else if (holder === "none")
      out += el("ellipse", { cx: x, cy: baseY, rx: cw * 1.3, ry: unit * 0.015, fill: "#000", opacity: "0.2" });
    // Body, its lit side, and the melted pool on top
    out += el("rect", { x: x - cw, y, width: cw * 2, height: ch, rx: cw * 0.15, fill: color });
    out += el("rect", { x: x - cw * 0.2, y, width: cw * 1.2, height: ch, fill: "#000", opacity: "0.08" });
    out += el("ellipse", { cx: x, cy: y, rx: cw, ry: cw * 0.28, fill: mix(color, "#ffffff", 0.35) });
    // A drip down the front
    if (g.chance(0.6)) {
      const dx = x + g.f(-0.6, 0.3) * cw;
      const dl = ch * g.f(0.1, 0.25);
      out += el("path", {
        d: s`M ${dx} ${y} V ${y + dl}`,
        stroke: mix(color, "#ffffff", 0.2),
        "stroke-width": cw * 0.3,
        "stroke-linecap": "round",
      });
    }
    // Wick and flame
    const fy = y - cw * 0.05;
    out += el("path", { d: s`M ${x} ${fy} v ${-cw * 0.35}`, stroke: "#3b2f2a", "stroke-width": cw * 0.1 });
    const fx = x + g.f(-0.08, 0.08) * cw;
    flames += el("circle", { cx: fx, cy: fy - flameH * 0.5, r: flameH * 0.8, fill: "#ffd27a", opacity: "0.25" });
    flames += el("path", {
      d: s`M ${fx} ${fy - flameH}
           C ${fx + cw * 0.15} ${fy - flameH * 0.6} ${fx + cw * 0.5} ${fy - flameH * 0.3} ${x} ${fy - cw * 0.15}
           C ${x - cw * 0.5} ${fy - flameH * 0.3} ${fx - cw * 0.15} ${fy - flameH * 0.6} ${fx} ${fy - flameH}
           Z`,
      fill: "#ffb83d",
    });
    flames += el("ellipse", { cx: x, cy: fy - flameH * 0.3, rx: cw * 0.17, ry: flameH * 0.22, fill: "#fff3b0" });
  }
  out += flames;
  const on = holder === "plate" ? " on a plate" : holder === "dishes" ? " in brass holders" : " on a table";
  note.alt(`${capitalize(numberWord(count))} lit candles of different heights${on}`);
  note.focus(w / 2, baseY - tallest);
  return out;
});
