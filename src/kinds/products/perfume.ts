import { defineKind, el, mix, type Point, pts } from "../../draw/core";
import { contact, studio } from "./shared";

/**
 * A faceted glass perfume bottle with its cap, sometimes standing in front of its box.
 *
 * @category Products
 */
export const perfume = /* @__PURE__ */ defineKind("perfume", "Perfume", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const shape = g.pick(["octagon", "square", "tall", "hexagon"]);
  const boxed = g.chance(0.4);
  const bh = unit * (shape === "tall" ? g.f(0.47, 0.51) : g.f(0.41, 0.45));
  const bw = shape === "tall" ? bh * g.f(0.5, 0.6) : shape === "hexagon" ? bh * g.f(0.95, 1.05) : bh * g.f(0.78, 0.92);
  const neckH = unit * 0.035;
  const cap = g.pick(["cube", "cylinder", "sphere", "crystal"]);
  const capH = cap === "sphere" ? bw * 0.36 : cap === "cylinder" ? unit * g.f(0.11, 0.14) : unit * g.f(0.08, 0.1);
  const totalH = bh + neckH + capH;
  const floorY = h / 2 + totalH / 2 + unit * 0.01;
  const boxW = bw * 0.95;
  const span = boxed ? bw * 0.5 + boxW * 1.05 : bw;
  const cx = w / 2 - (boxed ? span / 2 - bw / 2 : 0);
  const y0 = floorY - bh;
  let out = studio(g, w, h, floorY, w / 2, floorY - totalH / 2);
  const liquid = g.pick(["#e3a857", "#f0a6b5", "#c7a6e0", "#b8d98a", "#8fd0e0", "#f2d16b", "#c8505f", "#f3c6a0"]);
  const glass = mix(liquid, "#ffffff", 0.55);
  const capColor = g.pick(["#d4b06a", "#cfd3d6", "#2b2b2b", "#8a5a3b", "#f4f1ea", mix(liquid, "#000000", 0.2)]);
  const capShade = mix(capColor, "#000000", 0.2);
  if (boxed) {
    // The box, standing just behind and to the right
    const bx = cx + bw * 0.2;
    const boxH = bh * g.f(1.15, 1.3);
    const paper = g.pick(["#f4f1ea", "#2b2b2b", "#e9d3c4", "#d6dfe6", "#e8d9a8", mix(liquid, "#ffffff", 0.3)]);
    const by = floorY - unit * 0.02;
    out += contact(bx + boxW / 2, by, boxW * 0.6, unit * 0.02, 0.14);
    out += el("rect", { x: bx, y: by - boxH, width: boxW, height: boxH, fill: paper });
    out += el("rect", {
      x: bx + boxW * 0.86,
      y: by - boxH,
      width: boxW * 0.14,
      height: boxH,
      fill: "#000",
      opacity: "0.1",
    });
    out += el("rect", {
      x: bx,
      y: by - boxH + boxH * 0.14,
      width: boxW,
      height: unit * 0.004,
      fill: "#000",
      opacity: "0.15",
    });
    out += el("rect", {
      x: bx + boxW * 0.45,
      y: by - boxH * 0.62,
      width: boxW * 0.42,
      height: boxH * 0.2,
      fill: "none",
      stroke: paper === "#2b2b2b" ? "#d4b06a" : mix(paper, "#000000", 0.3),
      "stroke-width": unit * 0.004,
    });
  }
  out += contact(cx, floorY, bw * 0.62, unit * 0.025);
  // Bottle outline: the outer edge, then the front face set in from it
  const c = shape === "square" ? bw * 0.08 : shape === "tall" ? bw * 0.12 : bw * 0.2;
  const outline = (inset: number, bottomInset: number): Point[] => {
    const l = cx - bw / 2 + inset;
    const r = cx + bw / 2 - inset;
    const t = y0 + inset;
    const b = floorY - bottomInset;
    const k = Math.max(0, c - inset * 0.4);
    if (shape === "hexagon") {
      const m = (t + b) / 2;
      return [
        [l + k, t],
        [r - k, t],
        [r, m],
        [r - k, b],
        [l + k, b],
        [l, m],
      ];
    }
    return [
      [l + k, t],
      [r - k, t],
      [r, t + k],
      [r, b - k],
      [r - k, b],
      [l + k, b],
      [l, b - k],
      [l, t + k],
    ];
  };
  const outer = outline(0, 0);
  const m = bw * 0.1;
  const inner = outline(m, m * 1.6);
  out += el("polygon", { points: pts(outer), fill: glass, "fill-opacity": "0.92" });
  // Light on the upper-left facets, shade on the lower-right ones
  const facet = (k: number, color: string, opacity: string) => {
    const j = (k + 1) % outer.length;
    return el("polygon", { points: pts([outer[k], outer[j], inner[j], inner[k]]), fill: color, opacity });
  };
  const n = outer.length;
  for (let k = 0; k < n; k++) {
    const mid = [(outer[k][0] + outer[(k + 1) % n][0]) / 2, (outer[k][1] + outer[(k + 1) % n][1]) / 2];
    const lean = (mid[0] - cx) / bw + (mid[1] - (y0 + floorY) / 2) / bh;
    if (lean > 0.15) out += facet(k, "#000", "0.12");
    else if (lean < -0.15) out += facet(k, "#fff", "0.3");
  }
  // The perfume inside, filled to a seeded level
  const clip = g.id("juice");
  const innerTop = inner[0][1];
  const innerBottom = floorY - m * 1.6;
  const level = innerTop + (innerBottom - innerTop) * g.f(0.1, 0.35);
  out += el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: pts(inner) })));
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("rect", {
      x: cx - bw / 2,
      y: innerTop,
      width: bw,
      height: innerBottom - innerTop,
      fill: mix(liquid, "#ffffff", 0.35),
    }),
    el("rect", { x: cx - bw / 2, y: level, width: bw, height: innerBottom - level, fill: liquid }),
    el("rect", { x: cx + bw * 0.12, y: level, width: bw, height: innerBottom - level, fill: "#000", opacity: "0.08" }),
    el("rect", { x: cx - bw / 2, y: level, width: bw, height: unit * 0.006, fill: "#fff", opacity: "0.4" }),
  );
  // A tall glint on the left of the face
  out += el("rect", {
    x: cx - bw / 2 + m * 1.6,
    y: innerTop + (innerBottom - innerTop) * 0.12,
    width: bw * 0.06,
    height: (innerBottom - innerTop) * 0.6,
    rx: bw * 0.03,
    fill: "#fff",
    opacity: "0.45",
  });
  // Collar and cap
  const neckW = bw * (shape === "tall" ? 0.4 : 0.26);
  const neckY = y0 - neckH;
  out += el("rect", { x: cx - neckW / 2, y: neckY, width: neckW, height: neckH + unit * 0.004, fill: "#cfd3d6" });
  out += el("rect", { x: cx - neckW / 2, y: neckY, width: neckW * 0.3, height: neckH, fill: "#fff", opacity: "0.4" });
  const capTop = neckY - capH;
  if (cap === "sphere") {
    const r = capH / 2;
    out += el("circle", { cx, cy: capTop + r, r, fill: capShade });
    out += el("circle", { cx: cx - r * 0.06, cy: capTop + r * 0.94, r: r * 0.92, fill: capColor });
    out += el("circle", { cx: cx - r * 0.4, cy: capTop + r * 0.55, r: r * 0.18, fill: "#fff", opacity: "0.45" });
  } else if (cap === "crystal") {
    const cw = bw * 0.42;
    const crystal = mix(liquid, "#ffffff", 0.4);
    out += el("polygon", {
      points: pts([
        [cx - cw * 0.3, neckY],
        [cx + cw * 0.3, neckY],
        [cx + cw / 2, capTop + capH * 0.45],
        [cx + cw * 0.25, capTop],
        [cx - cw * 0.25, capTop],
        [cx - cw / 2, capTop + capH * 0.45],
      ]),
      fill: crystal,
    });
    out += el("polygon", {
      points: pts([
        [cx, neckY],
        [cx + cw * 0.3, neckY],
        [cx + cw / 2, capTop + capH * 0.45],
        [cx + cw * 0.25, capTop],
        [cx, capTop],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    out += el("polygon", {
      points: pts([
        [cx - cw * 0.25, capTop],
        [cx - cw * 0.08, capTop],
        [cx - cw * 0.3, capTop + capH * 0.45],
        [cx - cw / 2, capTop + capH * 0.45],
      ]),
      fill: "#fff",
      opacity: "0.4",
    });
  } else {
    const cw = cap === "cube" ? bw * (shape === "tall" ? 0.7 : 0.44) : bw * (shape === "tall" ? 0.46 : 0.3);
    out += el("rect", { x: cx - cw / 2, y: capTop, width: cw, height: capH, rx: cw * 0.06, fill: capColor });
    out += el("rect", { x: cx + cw * 0.2, y: capTop, width: cw * 0.3, height: capH, rx: cw * 0.06, fill: capShade });
    out += el("rect", {
      x: cx - cw * 0.36,
      y: capTop + capH * 0.12,
      width: cw * 0.08,
      height: capH * 0.76,
      rx: cw * 0.04,
      fill: "#fff",
      opacity: "0.35",
    });
  }
  const bottle =
    shape === "tall"
      ? "A tall faceted perfume bottle"
      : shape === "hexagon"
        ? "A hexagonal perfume bottle"
        : "A faceted glass perfume bottle";
  note.alt(`${bottle} with its cap${boxed ? ", in front of its box" : ""}, on a studio backdrop`);
  note.focus(cx, y0 + bh * 0.4);
  return out;
});
