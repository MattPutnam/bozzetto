import { defineKind, el, facing, hsl, mix, type Point, pts, s } from "../../draw/core";
import { sky, turn, turnBox } from "./shared";

/**
 * A hedgehog on the forest floor among fallen leaves.
 *
 * @category Animals
 */
export const hedgehog = /* @__PURE__ */ defineKind("hedgehog", "Hedgehog", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.74, 0.8);
  const rx = unit * g.f(0.24, 0.28);
  const ry = rx * g.f(0.62, 0.72);
  const cx = w / 2 - dir * rx * 0.15;
  const bx = cx - rx * 0.1;
  const by = gy - ry;
  const spineHue = g.f(20, 35);
  const spine = hsl(spineHue, g.f(25, 40), g.f(24, 32));
  const tipColor = hsl(spineHue + 10, 30, g.f(62, 72));
  const face = g.pick(["#e9cfa8", "#dcc0a0", "#f0dcc0", "#cfb08c"]);
  const autumn = g.chance(0.55);
  const leafHues = autumn ? [15, 30, 42, 8] : [90, 110, 60];
  let out = sky(g, w, h, autumn ? g.f(30, 45) : g.f(90, 130));
  // Trunks in the distance.
  for (let k = g.i(2, 3); k > 0; k--) {
    const tx = w * g.f(0, 1);
    const tw = unit * g.f(0.05, 0.1);
    out += el("rect", { x: tx - tw / 2, width: tw, height: gy, fill: hsl(25, 20, g.f(55, 65)), opacity: "0.6" });
  }
  // The forest floor.
  out += el("rect", { y: gy - unit * 0.02, width: w, height: h, fill: hsl(g.f(25, 40), 35, g.f(36, 44)) });
  // Fallen leaves.
  const leaf = (x: number, y: number, size: number, hue: number, tilt: number): string =>
    el("ellipse", {
      cx: x,
      cy: y,
      rx: size,
      ry: size * 0.42,
      fill: hsl(hue, 60, g.f(42, 55)),
      transform: s`rotate(${tilt} ${x} ${y})`,
    });
  for (let k = g.i(5, 9); k > 0; k--)
    out += leaf(w * g.f(0, 1), gy + (h - gy) * g.f(0.05, 0.95), unit * g.f(0.03, 0.05), g.pick(leafHues), g.f(-40, 40));
  // A mushroom off to one side.
  const shroom = g.chance(0.5);
  if (shroom) {
    const mr = unit * g.f(0.06, 0.08);
    // Behind the hedgehog, but kept inside the picture.
    const mx = Math.min(w - mr * 1.3, Math.max(mr * 1.3, cx - dir * rx * g.f(1.6, 1.9)));
    const red = g.chance(0.5);
    out += el("rect", { x: mx - mr * 0.25, y: gy - mr * 1.2, width: mr * 0.5, height: mr * 1.2, fill: "#f1e8d8" });
    out += el("path", {
      d: s`M ${mx - mr} ${gy - mr * 1.1} Q ${mx} ${gy - mr * 2.6} ${mx + mr} ${gy - mr * 1.1} Z`,
      fill: red ? "#d8432f" : "#b07a4c",
    });
    if (red)
      for (const [dx, dy] of [
        [-0.45, 1.4],
        [0.1, 1.7],
        [0.5, 1.35],
      ])
        out += el("circle", { cx: mx + dx * mr, cy: gy - dy * mr, r: mr * 0.12, fill: "#fff" });
  }
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.2, ry: ry * 0.14, fill: "#000", opacity: "0.18" });
  out += facing(cx, dir);
  // Feet, then the pale belly.
  for (const fx of [bx - rx * 0.5, bx + rx * 0.45])
    out += el("ellipse", { cx: fx, cy: gy - rx * 0.02, rx: rx * 0.12, ry: rx * 0.06, fill: "#4a3428" });
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: face });
  // Spines: a jagged arc over the back, filled down to the middle of the body.
  const spikes: Point[] = [];
  const count = 30;
  for (let k = 0; k <= count; k++) {
    const a = -0.3 * Math.PI - (k / count) * 1.0 * Math.PI;
    const reach = k % 2 ? g.f(1.1, 1.2) : 0.97;
    spikes.push([bx + Math.cos(a) * rx * reach, by + Math.sin(a) * ry * reach]);
  }
  spikes.push([bx - rx * 0.3, by + ry * 0.72], [bx + rx * 0.1, by + ry * 0.5], [bx + rx * 0.3, by + ry * 0.05]);
  out += el("polygon", { points: pts(spikes), fill: spine });
  // Light tips on some spines.
  let tips = "";
  for (let k = 1; k < count; k += 2) {
    const [x, y] = spikes[k];
    tips += s`M ${x} ${y} L ${bx + (x - bx) * 0.9} ${by + (y - by) * 0.9} `;
  }
  out += el("path", {
    d: tips,
    stroke: tipColor,
    "stroke-width": rx * 0.035,
    "stroke-linecap": "round",
  });
  // A few spine marks within the coat.
  let marks = "";
  for (let k = g.i(6, 9); k > 0; k--) {
    const a = g.f(-0.95, -0.4) * Math.PI;
    const d = g.f(0.35, 0.8);
    const x = bx + Math.cos(a) * rx * d;
    const y = by + Math.sin(a) * ry * d;
    marks += s`M ${x} ${y} l ${Math.cos(a) * rx * 0.14} ${Math.sin(a) * rx * 0.14} `;
  }
  out += el("path", {
    d: marks,
    stroke: tipColor,
    "stroke-width": rx * 0.03,
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  // A leaf caught on its spines.
  const carried = g.chance(0.3);
  if (carried) {
    const a = g.f(-0.75, -0.55) * Math.PI;
    out += leaf(bx + Math.cos(a) * rx * 1.02, by + Math.sin(a) * ry * 1.02, rx * 0.2, g.pick(leafHues), g.f(-30, 30));
  }
  // The face: cheek, pointed snout, nose, ear and eye.
  const fx = bx + rx * 0.62;
  const fy = by + ry * 0.2;
  out += el("ellipse", { cx: fx, cy: fy, rx: rx * 0.4, ry: ry * 0.5, fill: face });
  const nose: Point = [bx + rx * 1.32, by + ry * 0.42];
  out += el("path", {
    d: s`M ${fx} ${fy - ry * 0.42} Q ${fx + rx * 0.45} ${fy - ry * 0.2} ${nose[0]} ${nose[1] - rx * 0.03}
         L ${nose[0]} ${nose[1] + rx * 0.04} Q ${fx + rx * 0.4} ${fy + ry * 0.5} ${fx - rx * 0.1} ${fy + ry * 0.45} Z`,
    fill: face,
  });
  out += el("circle", { cx: nose[0], cy: nose[1], r: rx * 0.065, fill: "#2a1e18" });
  out += el("circle", { cx: fx - rx * 0.12, cy: fy - ry * 0.48, r: rx * 0.085, fill: mix(face, "#5a3a28", 0.35) });
  const ex = fx + rx * 0.12;
  const ey = fy - ry * 0.12;
  out += el("circle", { cx: ex, cy: ey, r: rx * 0.06, fill: "#1a1412" });
  out += el("circle", { cx: ex + rx * 0.02, cy: ey - rx * 0.02, r: rx * 0.02, fill: "#fff" });
  out += el("circle", { cx: fx + rx * 0.05, cy: fy + ry * 0.2, r: rx * 0.08, fill: "#ff7a8a", opacity: "0.3" });
  out += "</g>";
  note.alt(
    `A hedgehog on the forest floor among ${autumn ? "autumn " : ""}leaves${carried ? ", a leaf caught on its spines" : ""}${shroom ? ", beside a mushroom" : ""}`,
  );
  note.focus(turn(cx, dir, ex), ey);
  // Face, from ear to nose.
  const left = fx - rx * 0.5;
  note.frame(turnBox(cx, dir, left, nose[0] + rx * 0.15 - left), fy - ry * 0.75, nose[0] + rx * 0.15 - left, ry * 1.3);
  return out;
});
