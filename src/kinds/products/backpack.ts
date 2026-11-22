import { defineKind, el, mix, s } from "../../draw/core";
import { contact, studio } from "./shared";

/**
 * A backpack seen from the front, with a zip pocket and its straps showing at the sides.
 *
 * @category Products
 */
export const backpack = /* @__PURE__ */ defineKind("backpack", "Backpack", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["daypack", "daypack", "rucksack"]);
  const BW = unit * g.f(0.42, 0.47);
  const BH = unit * g.f(0.56, 0.62);
  const cx = w / 2;
  const floorY = h / 2 + BH / 2 + unit * 0.03;
  const top = floorY - BH;
  const x0 = cx - BW / 2;
  let out = studio(g, w, h, floorY, cx, floorY - BH / 2);
  const body = g.pick([
    "#2f4a6d",
    "#2b2b2b",
    "#b8433a",
    "#6b7044",
    "#d9a441",
    "#8a8f96",
    "#2f7c7a",
    "#e8a7a8",
    "#c9b48e",
    "#3c5e48",
    "#5a4a7a",
  ]);
  const shade = mix(body, "#000000", 0.25);
  const trim = g.pick([shade, shade, "#2b2b2b", "#a8754a", mix(body, "#ffffff", 0.3)]);
  const zip = mix(body, "#000000", 0.45);
  const metal = g.pick(["#cfd3d6", "#2b2b2b"]);
  const clip = g.id("pack");
  // Shoulder straps peeking out behind the sides, and the grab handle on top
  out += contact(cx, floorY, BW * 0.62, unit * 0.03);
  out += el("path", {
    d: s`M ${cx - BW * 0.4} ${top + BH * 0.2} C ${cx - BW * 0.56} ${top + BH * 0.4} ${cx - BW * 0.56} ${floorY - BH * 0.3} ${cx - BW * 0.46} ${floorY - BH * 0.1}
         M ${cx + BW * 0.4} ${top + BH * 0.2} C ${cx + BW * 0.56} ${top + BH * 0.4} ${cx + BW * 0.56} ${floorY - BH * 0.3} ${cx + BW * 0.46} ${floorY - BH * 0.1}`,
    stroke: mix(trim === shade ? body : trim, "#000000", 0.35),
    "stroke-width": BW * 0.07,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: s`M ${cx - BW * 0.1} ${top + BH * 0.03} Q ${cx} ${top - BH * 0.12} ${cx + BW * 0.1} ${top + BH * 0.03}`,
    stroke: trim,
    "stroke-width": BW * 0.035,
    fill: "none",
    "stroke-linecap": "round",
  });
  // The body, rounded on top
  const R = style === "daypack" ? BW * 0.42 : BW * 0.2;
  const c = BW * 0.08;
  const bodyD = s`M ${x0} ${floorY - c} L ${x0} ${top + R} Q ${x0} ${top} ${x0 + R} ${top} L ${x0 + BW - R} ${top}
                  Q ${x0 + BW} ${top} ${x0 + BW} ${top + R} L ${x0 + BW} ${floorY - c}
                  Q ${x0 + BW} ${floorY} ${x0 + BW - c} ${floorY} L ${x0 + c} ${floorY} Q ${x0} ${floorY} ${x0} ${floorY - c} Z`;
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("rect", { x: x0, y: top, width: BW, height: BH, fill: body }),
    // A sturdier base panel, the shade down the right side and a highlight on the left
    el("rect", { x: x0, y: floorY - BH * 0.09, width: BW, height: BH * 0.09, fill: trim }),
    el("rect", { x: x0 + BW * 0.84, y: top, width: BW * 0.16, height: BH, fill: "#000", opacity: "0.12" }),
    el("rect", { x: x0 + BW * 0.05, y: top, width: BW * 0.06, height: BH, fill: "#fff", opacity: "0.12" }),
  );
  const pull = (x: number, y: number) =>
    el("rect", { x: x - BW * 0.018, y, width: BW * 0.036, height: BH * 0.07, rx: BW * 0.015, fill: metal });
  if (style === "daypack") {
    // Main zip round the top
    const i = BW * 0.09;
    const Ri = R - i * 0.6;
    out += el("path", {
      d: s`M ${x0 + i} ${top + BH * 0.5} L ${x0 + i} ${top + i + Ri} Q ${x0 + i} ${top + i} ${x0 + i + Ri} ${top + i}
           L ${x0 + BW - i - Ri} ${top + i} Q ${x0 + BW - i} ${top + i} ${x0 + BW - i} ${top + i + Ri} L ${x0 + BW - i} ${top + BH * 0.5}`,
      stroke: zip,
      "stroke-width": unit * 0.009,
      fill: "none",
    });
    out += pull(x0 + BW - i - Ri * 0.6, top + i + unit * 0.004);
  } else {
    // A flap over the top, buckled down with two straps
    const fb = top + BH * 0.4;
    out += el("path", {
      d: s`M ${x0 - BW * 0.01} ${top + R} Q ${x0 - BW * 0.01} ${top - BH * 0.01} ${x0 + R} ${top - BH * 0.01}
           L ${x0 + BW - R} ${top - BH * 0.01} Q ${x0 + BW + BW * 0.01} ${top - BH * 0.01} ${x0 + BW + BW * 0.01} ${top + R}
           L ${x0 + BW + BW * 0.01} ${fb - BW * 0.1} Q ${x0 + BW + BW * 0.01} ${fb} ${x0 + BW * 0.9} ${fb}
           L ${x0 + BW * 0.1} ${fb} Q ${x0 - BW * 0.01} ${fb} ${x0 - BW * 0.01} ${fb - BW * 0.1} Z`,
      fill: trim === shade ? mix(body, "#000000", 0.12) : trim,
    });
    for (const sx of [-1, 1]) {
      const bx = cx + sx * BW * 0.24;
      out += el("rect", {
        x: bx - BW * 0.04,
        y: fb - BH * 0.14,
        width: BW * 0.08,
        height: BH * 0.26,
        rx: BW * 0.015,
        fill: shade,
      });
      out += el("rect", {
        x: bx - BW * 0.055,
        y: fb - BH * 0.02,
        width: BW * 0.11,
        height: BH * 0.06,
        rx: BW * 0.012,
        fill: metal,
      });
    }
  }
  // Front zip pocket
  const pw = BW * (style === "daypack" ? 0.72 : 0.66);
  const ph = BH * (style === "daypack" ? 0.36 : 0.26);
  const py = floorY - BH * 0.13 - ph;
  const pocket = g.pick([mix(body, "#000000", 0.1), mix(body, "#ffffff", 0.15), trim]);
  out += el("rect", { x: cx - pw / 2, y: py, width: pw, height: ph, rx: BW * 0.08, fill: pocket });
  out += el("rect", {
    x: cx - pw / 2,
    y: py + ph * 0.7,
    width: pw,
    height: ph * 0.3,
    rx: BW * 0.06,
    fill: "#000",
    opacity: "0.08",
  });
  out += el("path", {
    d: s`M ${cx - pw * 0.4} ${py + ph * 0.18} L ${cx + pw * 0.4} ${py + ph * 0.18}`,
    stroke: zip,
    "stroke-width": unit * 0.009,
    "stroke-linecap": "round",
  });
  out += pull(cx + pw * 0.28, py + ph * 0.18);
  note.alt(
    style === "daypack"
      ? "A backpack with a zip front pocket, standing on a studio floor"
      : "A rucksack with a buckled flap and a zip pocket, standing on a studio floor",
  );
  note.focus(cx, top + BH * 0.45);
  return out;
});
