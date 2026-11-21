import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";

/** A cactus or succulent in a terracotta pot. */
export const cactus = /* @__PURE__ */ defineKind("cactus", "Potted cactus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.78, 0.84);
  const cx = w / 2;
  const potW = unit * g.f(0.16, 0.2);
  const potH = unit * g.f(0.2, 0.25);
  const potY = top + unit * 0.02;
  const pot = g.pick(["#c4572f", "#d97b4f", "#e9e3d5", "#3e6d8e", "#2b2b2b", "#e8b04b"]);
  const green = hsl(g.f(95, 150), g.f(30, 50), g.f(38, 50));
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  const rimY = potY - potH;
  if (g.chance(0.6)) {
    // A columnar cactus
    const stemW = potW * g.f(0.55, 0.7);
    const stemH = unit * g.f(0.3, 0.42);
    const stemTop = rimY - stemH;
    // Arms
    const arms: string[] = [];
    for (const side of [-1, 1])
      if (g.chance(0.7)) {
        const armY = rimY - stemH * g.f(0.35, 0.6);
        const reach = stemW * g.f(1.1, 1.5);
        const rise = stemH * g.f(0.2, 0.4);
        arms.push(s`M ${cx} ${armY} H ${cx + side * reach} V ${armY - rise}`);
      }
    if (arms.length)
      out += el("path", {
        d: arms.join(" "),
        stroke: green,
        "stroke-width": stemW * 0.75,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none",
      });
    // Stem
    out += el("rect", {
      x: cx - stemW / 2,
      y: stemTop,
      width: stemW,
      height: stemH + unit * 0.02,
      rx: stemW / 2,
      fill: green,
    });
    // Ribs
    out += el("path", {
      d: s`M ${cx - stemW * 0.18} ${stemTop + stemW * 0.3} V ${rimY}
           M ${cx + stemW * 0.18} ${stemTop + stemW * 0.3} V ${rimY}`,
      stroke: "#000",
      "stroke-opacity": "0.12",
      "stroke-width": stemW * 0.06,
      "stroke-linecap": "round",
    });
    // Flower on top
    const flowering = g.chance(0.5);
    const armsText = arms.length === 0 ? "" : arms.length === 1 ? " with one arm" : " with two arms";
    const flowerText = flowering ? (arms.length ? " and a flower" : " with a flower") : "";
    note.alt(`A potted cactus${armsText}${flowerText}`);
    note.focus(cx, stemTop + stemH * 0.35);
    if (flowering)
      out += el("path", {
        d: blob(g, cx, stemTop + stemW * 0.05, stemW * 0.28, stemW * 0.22, 5, 0.3, 0.03),
        fill: hsl(g.f(320, 380), 75, 68),
      });
  } else {
    // A succulent: a fan of leaves around a pale heart
    const leaves = g.i(7, 11);
    const spread = potW * g.f(1.1, 1.4);
    const cy = rimY - unit * 0.05;
    note.alt("A succulent rosette in a pot");
    note.focus(cx, cy - spread * 0.2);
    for (let k = 0; k < leaves; k++) {
      const angle = Math.PI + (k / (leaves - 1)) * Math.PI;
      const leafX = cx + Math.cos(angle) * spread * 0.55;
      const leafY = cy + Math.sin(angle) * spread * 0.55;
      out += el("ellipse", {
        cx: leafX,
        cy: leafY,
        rx: spread * 0.5,
        ry: spread * 0.17,
        fill: green,
        transform: s`rotate(${(angle * 180) / Math.PI} ${leafX} ${leafY})`,
      });
    }
    out += el("ellipse", { cx, cy, rx: spread * 0.32, ry: spread * 0.25, fill: hsl(g.f(95, 150), 40, 58) });
  }
  // Pot: shadow, body, and rim
  out += el("ellipse", { cx, cy: potY, rx: potW * 1.1, ry: unit * 0.018, fill: "#000", opacity: "0.12" });
  out += el("polygon", {
    points: pts([
      [cx - potW, rimY],
      [cx + potW, rimY],
      [cx + potW * 0.75, potY],
      [cx - potW * 0.75, potY],
    ]),
    fill: pot,
  });
  out += el("rect", {
    x: cx - potW * 1.1,
    y: rimY - unit * 0.045,
    width: potW * 2.2,
    height: unit * 0.055,
    rx: unit * 0.008,
    fill: mix(pot, "#ffffff", 0.12),
  });
  return out;
});
