import { defineKind, el, fill, hsl, type Point, pts, s } from "../../draw/core";
import { andList } from "../../draw/words";

const COATS = [
  ["#e89a4b", "#f7d3a6"],
  ["#8c8c94", "#d9d9de"],
  ["#2b2b30", "#4a4a52"],
  ["#efe9df", "#ffffff"],
  ["#b4865e", "#ead7c0"],
  ["#5b4636", "#9c8067"],
] as const;

/**
 * A cat's face and shoulders. Coat, eyes, tabby stripes and muzzle vary.
 *
 * @category Animals
 */
export const cat = /* @__PURE__ */ defineKind(
  "cat",
  "Cat",
  { tabby: [true, false], muzzle: [true, false], pupils: ["slit", "round"] },
  (g, w, h, note) => {
    const [fur, light] = g.pick(COATS);
    const whisker = fur === "#efe9df" ? "#555" : "#f4f1ea";
    const unit = Math.min(w, h);
    const cx = w / 2;
    const cy = h * 0.5;
    const rx = unit * g.f(0.24, 0.29);
    const ry = rx * g.f(0.8, 0.92);
    let out = fill(w, h, hsl(g.f(0, 360), 30, 84));
    // Shoulders.
    out += el("ellipse", { cx, cy: cy + ry * 1.7, rx: rx * 1.3, ry: ry * 1.1, fill: fur });
    // Ears, each with a pink inner ear shrunk toward its center.
    const tip = g.f(0.62, 0.8);
    const up = g.f(1.25, 1.5);
    for (const side of [-1, 1]) {
      const ear: Point[] = [
        [cx + side * rx * 0.88, cy - ry * 0.3],
        [cx + side * rx * tip, cy - ry * up],
        [cx + side * rx * 0.18, cy - ry * 0.85],
      ];
      const midX = (ear[0][0] + ear[1][0] + ear[2][0]) / 3;
      const midY = (ear[0][1] + ear[1][1] + ear[2][1]) / 3;
      const inner = ear.map(([x, y]): Point => [midX + (x - midX) * 0.55, midY + (y - midY) * 0.55 - ry * 0.03]);
      out += el("polygon", { points: pts(ear), fill: fur });
      out += el("polygon", { points: pts(inner), fill: "#f2a8a8", opacity: "0.85" });
    }
    // Head.
    out += el("ellipse", { cx, cy, rx, ry, fill: fur });
    const tabby = g.option("tabby", g.chance(0.35));
    if (tabby)
      // Tabby stripes on the forehead.
      out += el("path", {
        d: s`M ${cx} ${cy - ry * 0.98} v ${ry * 0.3}
           M ${cx - rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22}
           M ${cx + rx * 0.22} ${cy - ry * 0.94} v ${ry * 0.22}`,
        stroke: "#000",
        "stroke-opacity": "0.18",
        "stroke-width": rx * 0.08,
        "stroke-linecap": "round",
      });
    const muzzle = g.option("muzzle", g.chance(0.5));
    if (muzzle)
      // A pale muzzle.
      out += el("ellipse", { cx, cy: cy + ry * 0.42, rx: rx * 0.42, ry: ry * 0.3, fill: light });
    // Eyes, with slit or round pupils.
    const eye = g.pick(["#9bc53d", "#f2c14e", "#6fb7e0", "#d98c2b"]);
    const slit = g.option("pupils", g.chance(0.6) ? "slit" : "round") === "slit";
    for (const side of [-1, 1]) {
      out += el("ellipse", { cx: cx + side * rx * 0.4, cy: cy - ry * 0.05, rx: rx * 0.17, ry: ry * 0.2, fill: eye });
      out += el("ellipse", {
        cx: cx + side * rx * 0.4,
        cy: cy - ry * 0.05,
        rx: rx * (slit ? 0.045 : 0.1),
        ry: ry * (slit ? 0.17 : 0.12),
        fill: "#111",
      });
    }
    // Nose.
    out += el("polygon", {
      points: s`${cx - rx * 0.08},${cy + ry * 0.24} ${cx + rx * 0.08},${cy + ry * 0.24} ${cx},${cy + ry * 0.35}`,
      fill: "#e07a7a",
    });
    // Mouth: a short line down from the nose, then two curves.
    out += el("path", {
      d: s`M ${cx} ${cy + ry * 0.35}
         v ${ry * 0.1}
         M ${cx - rx * 0.14} ${cy + ry * 0.5}
         Q ${cx - rx * 0.07} ${cy + ry * 0.56} ${cx} ${cy + ry * 0.45}
         Q ${cx + rx * 0.07} ${cy + ry * 0.56} ${cx + rx * 0.14} ${cy + ry * 0.5}`,
      stroke: "#3a2a2a",
      "stroke-width": rx * 0.035,
      fill: "none",
      "stroke-linecap": "round",
    });
    // Whiskers: three on each side.
    let whiskers = "";
    for (const side of [-1, 1])
      for (const k of [-1, 0, 1])
        whiskers += s`M ${cx + side * rx * 0.25} ${cy + ry * 0.38 + k * ry * 0.06} L ${cx + side * rx * 1.05} ${cy + ry * 0.3 + k * ry * 0.16} `;
    out += el("path", { d: whiskers.trim(), stroke: whisker, "stroke-width": rx * 0.02, opacity: "0.8" });
    const features = [muzzle && "a pale muzzle", slit ? "slit pupils" : "round pupils"];
    note.alt(`A ${tabby ? "tabby " : ""}cat's face with ${andList(features)}`);
    note.focus(cx, cy - ry * 0.05);
    // Head and ears.
    note.frame(cx - rx * 1.05, cy - ry * 1.5, rx * 2.1, ry * 2.55);
    return out;
  },
);
