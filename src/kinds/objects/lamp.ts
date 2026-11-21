import { defineKind, el, hsl, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { glow } from "./shared";

/** A lit lamp in the evening: a table lamp on a table, or a floor lamp. */
export const lamp = /* @__PURE__ */ defineKind("lamp", "Lamp", { stand: ["table", "floor"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const floorLamp = g.option("stand", g.chance(0.35) ? "floor" : "table") === "floor";
  const hue = g.f(0, 360);
  const wall = hsl(hue, g.f(15, 30), g.f(30, 40));
  const wood = hsl(g.f(15, 35), g.f(25, 40), g.f(24, 34));
  const light = g.pick(["#ffe7a3", "#ffd98a", "#fff0c2"]);
  const shade = hsl(g.f(20, 60), g.f(40, 70), g.f(78, 88));
  const metal = g.pick(["#c9a24a", "#2b2b2b", "#d9dcdf", "#8a6b4a"]);
  const top = floorLamp ? h * g.f(0.84, 0.88) : h * g.f(0.72, 0.78);
  const bottom = top + unit * (floorLamp ? 0.03 : 0.04);
  const cx = w / 2 + w * g.f(-0.08, 0.08);
  const sh = unit * g.f(0.15, 0.19);
  const sbw = unit * g.f(0.14, 0.18);
  const stw = sbw * g.f(0.55, 0.75);
  const id = g.id("glow");
  let out = el("defs", {}, glow(id, light, 0.55));
  out += table(g, w, h, top, wall, wood);
  // The shade's height: on a tall pole for a floor lamp, or on a base and short neck on a table.
  let shadeBottom: number;
  let base = "";
  let what: string;
  if (floorLamp) {
    shadeBottom = h * g.f(0.08, 0.14) + sh;
    const tripod = g.chance(0.5);
    what = tripod ? "A lit floor lamp on a tripod" : "A lit floor lamp";
    if (tripod) {
      // Three splayed legs
      const legTop = shadeBottom + (bottom - shadeBottom) * 0.55;
      const spread = unit * 0.13;
      base += el("path", {
        d: s`M ${cx} ${legTop} L ${cx - spread} ${bottom} M ${cx} ${legTop} L ${cx + spread} ${bottom} M ${cx} ${legTop} L ${cx + spread * 0.2} ${bottom - unit * 0.03}`,
        stroke: metal,
        "stroke-width": unit * 0.014,
        "stroke-linecap": "round",
      });
      base += el("rect", {
        x: cx - unit * 0.006,
        y: shadeBottom,
        width: unit * 0.012,
        height: legTop - shadeBottom,
        fill: metal,
      });
    } else {
      // Pole on a round foot
      base += el("ellipse", { cx, cy: bottom, rx: unit * 0.09, ry: unit * 0.022, fill: "#000", opacity: "0.15" });
      base += el("rect", {
        x: cx - unit * 0.006,
        y: shadeBottom,
        width: unit * 0.012,
        height: bottom - shadeBottom,
        fill: metal,
      });
      base += el("path", {
        d: s`M ${cx - unit * 0.075} ${bottom} Q ${cx} ${bottom - unit * 0.05} ${cx + unit * 0.075} ${bottom} Z`,
        fill: metal,
      });
    }
  } else {
    // A base on the table and a short neck up to the shade
    const baseH = unit * g.f(0.13, 0.19);
    const baseW = unit * g.f(0.06, 0.08);
    const neck = unit * g.f(0.05, 0.08);
    const baseTop = bottom - baseH;
    shadeBottom = baseTop - neck;
    const form = g.pick(["jar", "column", "cone"]);
    const ceramic = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f6b58", "#e8b04b", "#7a5c9e", "#a8b5a2"]);
    base += el("ellipse", { cx, cy: bottom, rx: baseW * 1.4, ry: unit * 0.02, fill: "#000", opacity: "0.2" });
    base += el("rect", {
      x: cx - unit * 0.005,
      y: shadeBottom,
      width: unit * 0.01,
      height: neck + unit * 0.01,
      fill: metal,
    });
    base += el("path", {
      d:
        form === "jar"
          ? s`M ${cx - baseW * 0.45} ${baseTop}
              C ${cx - baseW * 1.5} ${baseTop + baseH * 0.15} ${cx - baseW * 1.4} ${bottom} ${cx - baseW * 0.6} ${bottom}
              H ${cx + baseW * 0.6}
              C ${cx + baseW * 1.4} ${bottom} ${cx + baseW * 1.5} ${baseTop + baseH * 0.15} ${cx + baseW * 0.45} ${baseTop}
              Z`
          : form === "column"
            ? s`M ${cx - baseW * 0.5} ${baseTop} H ${cx + baseW * 0.5} L ${cx + baseW * 0.6} ${bottom - baseH * 0.12}
                H ${cx + baseW} V ${bottom} H ${cx - baseW} V ${bottom - baseH * 0.12} H ${cx - baseW * 0.6} Z`
            : s`M ${cx - baseW * 0.25} ${baseTop} H ${cx + baseW * 0.25} L ${cx + baseW} ${bottom} H ${cx - baseW} Z`,
      fill: ceramic,
    });
    // Highlight
    base += el("rect", {
      x: cx - baseW * 0.45,
      y: baseTop + baseH * 0.25,
      width: baseW * 0.15,
      height: baseH * 0.45,
      rx: baseW * 0.07,
      fill: "#fff",
      opacity: "0.25",
    });
    const stack = g.chance(0.5);
    what = stack ? "A lit table lamp beside a stack of books" : "A lit table lamp on a table";
    if (stack) {
      // A few books lying flat beside the lamp
      const side = g.chance(0.5) ? 1 : -1;
      const bx = cx + side * (sbw + unit * 0.1);
      let y = bottom;
      for (let k = g.i(2, 4); k > 0; k--) {
        const bookW = unit * g.f(0.15, 0.2);
        const bookH = unit * g.f(0.025, 0.04);
        y -= bookH;
        base += el("rect", {
          x: bx - bookW / 2 + g.f(-0.02, 0.02) * unit,
          y,
          width: bookW,
          height: bookH,
          rx: unit * 0.004,
          fill: hsl(g.f(0, 360), g.f(30, 55), g.f(35, 60)),
        });
      }
    }
  }
  const shadeTop = shadeBottom - sh;
  // The glow, and light thrown down onto the surface
  out += el("circle", { cx, cy: shadeBottom - sh * 0.4, r: unit * 0.55, fill: `url(#${id})` });
  out += el("polygon", {
    points: pts([
      [cx - sbw, shadeBottom],
      [cx + sbw, shadeBottom],
      [cx + sbw * 2, bottom],
      [cx - sbw * 2, bottom],
    ]),
    fill: light,
    opacity: "0.14",
  });
  out += el("ellipse", { cx, cy: bottom, rx: sbw * 2, ry: unit * 0.035, fill: light, opacity: "0.2" });
  out += base;
  // Bulb seen under the shade, then the shade itself
  out += el("ellipse", { cx, cy: shadeBottom, rx: sbw * 0.96, ry: unit * 0.022, fill: "#fff8de" });
  out += el("polygon", {
    points: pts([
      [cx - stw, shadeTop],
      [cx + stw, shadeTop],
      [cx + sbw, shadeBottom],
      [cx - sbw, shadeBottom],
    ]),
    fill: shade,
  });
  // Trim at the shade's bottom edge
  out += el("rect", {
    x: cx - sbw,
    y: shadeBottom - unit * 0.012,
    width: sbw * 2,
    height: unit * 0.012,
    fill: "#000",
    opacity: "0.08",
  });
  note.alt(what);
  note.focus(cx, shadeBottom - sh * 0.5);
  return out;
});
