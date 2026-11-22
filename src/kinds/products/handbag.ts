import { defineKind, el, mix, pts, s } from "../../draw/core";
import { contact, studio } from "./shared";

/**
 * A leather handbag: a tote with long handles, or a structured top-handle bag with a flap.
 *
 * @category Products
 */
export const handbag = /* @__PURE__ */ defineKind("handbag", "Handbag", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["tote", "top-handle"]);
  const tote = style === "tote";
  const bh = unit * (tote ? g.f(0.36, 0.4) : g.f(0.32, 0.36));
  const top = tote ? unit * g.f(0.5, 0.56) : unit * g.f(0.38, 0.42);
  const bottom = tote ? top * g.f(0.78, 0.84) : unit * g.f(0.5, 0.55);
  const handleH = unit * (tote ? g.f(0.2, 0.24) : g.f(0.15, 0.18));
  const cx = w / 2;
  const floorY = h / 2 + (bh + handleH) / 2;
  const y0 = floorY - bh;
  let out = studio(g, w, h, floorY, cx, floorY - (bh + handleH) / 2);
  const leather = g.pick([
    "#2b2b2b",
    "#8a4b2a",
    "#b5835a",
    "#6d2433",
    "#e9dcc5",
    "#5e6b4a",
    "#e2b4b0",
    "#2f3e5c",
    "#c74b3b",
    "#d9a441",
  ]);
  const shade = mix(leather, "#000000", 0.2);
  const hardware = g.pick(["#d4b06a", "#cfd3d6"]);
  const stitch =
    leather === "#e9dcc5" || leather === "#e2b4b0" ? mix(leather, "#000000", 0.25) : mix(leather, "#ffffff", 0.35);
  const corner = unit * 0.03;
  const bodyD = s`M ${cx - top / 2} ${y0} L ${cx + top / 2} ${y0} L ${cx + bottom / 2} ${floorY - corner}
                  Q ${cx + bottom / 2} ${floorY} ${cx + bottom / 2 - corner} ${floorY} L ${cx - bottom / 2 + corner} ${floorY}
                  Q ${cx - bottom / 2} ${floorY} ${cx - bottom / 2} ${floorY - corner} Z`;
  out += contact(cx, floorY, Math.max(top, bottom) * 0.58, unit * 0.028);
  const arch = (half: number, lift: number, sw: number, color: string, y: number) =>
    el("path", {
      d: s`M ${cx - half} ${y} C ${cx - half} ${y - lift * 1.33} ${cx + half} ${y - lift * 1.33} ${cx + half} ${y}`,
      stroke: color,
      "stroke-width": sw,
      fill: "none",
      "stroke-linecap": "round",
    });
  if (tote) {
    const half = top * 0.24;
    const sw = unit * 0.032;
    // The back handle, then the body, then the front handle stitched onto it
    out += arch(half * 1.05, handleH * 0.95, sw, shade, y0 + unit * 0.01);
    out += el("path", { d: bodyD, fill: leather });
    out += el("polygon", {
      points: pts([
        [cx + top * 0.36, y0],
        [cx + top / 2, y0],
        [cx + bottom / 2, floorY - corner],
        [cx + bottom * 0.36, floorY],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    out += el("rect", { x: cx - top / 2, y: y0, width: top, height: bh * 0.08, fill: shade });
    out += arch(half, handleH, sw, leather, y0 + bh * 0.18);
    for (const sx of [-1, 1]) {
      out += el("rect", {
        x: cx + sx * half - sw * 0.75,
        y: y0 + bh * 0.04,
        width: sw * 1.5,
        height: bh * 0.18,
        rx: sw * 0.2,
        fill: leather,
      });
      out += el("circle", { cx: cx + sx * half, cy: y0 + bh * 0.15, r: sw * 0.22, fill: hardware });
    }
    out += el("path", {
      d: s`M ${cx - top * 0.46} ${y0 + bh * 0.12} L ${cx + top * 0.46} ${y0 + bh * 0.12}`,
      stroke: stitch,
      "stroke-width": unit * 0.004,
      "stroke-dasharray": s`${unit * 0.012} ${unit * 0.008}`,
    });
  } else {
    // A rigid handle on rings, the body, then the flap and its clasp
    const half = top * 0.27;
    const sw = unit * 0.04;
    const ringY = y0 - unit * 0.012;
    out += arch(half, handleH, sw, leather, ringY - unit * 0.01);
    out += arch(half, handleH, sw * 0.3, shade, ringY - unit * 0.01 + sw * 0.15);
    out += el("path", { d: bodyD, fill: leather });
    out += el("polygon", {
      points: pts([
        [cx + top * 0.36, y0],
        [cx + top / 2, y0],
        [cx + bottom / 2, floorY - corner],
        [cx + bottom * 0.38, floorY],
      ]),
      fill: "#000",
      opacity: "0.1",
    });
    for (const sx of [-1, 1])
      out += el("ellipse", {
        cx: cx + sx * half,
        cy: ringY,
        rx: unit * 0.018,
        ry: unit * 0.022,
        fill: "none",
        stroke: hardware,
        "stroke-width": unit * 0.009,
      });
    const fy = y0 + bh * g.f(0.5, 0.58);
    const fx = top / 2 + (bottom - top) * ((fy - y0) / bh) * 0.5;
    const pointed = g.chance(0.4);
    out += el("path", {
      d: pointed
        ? s`M ${cx - top / 2 - unit * 0.004} ${y0} L ${cx + top / 2 + unit * 0.004} ${y0} L ${cx + fx} ${fy - bh * 0.2} L ${cx} ${fy} L ${cx - fx} ${fy - bh * 0.2} Z`
        : s`M ${cx - top / 2 - unit * 0.004} ${y0} L ${cx + top / 2 + unit * 0.004} ${y0} L ${cx + fx} ${fy - bh * 0.08}
           Q ${cx + fx} ${fy} ${cx + fx - unit * 0.04} ${fy} L ${cx - fx + unit * 0.04} ${fy} Q ${cx - fx} ${fy} ${cx - fx} ${fy - bh * 0.08} Z`,
      fill: shade,
    });
    out += el("rect", {
      x: cx - top * 0.44,
      y: y0 + bh * 0.05,
      width: top * 0.88,
      height: unit * 0.006,
      rx: unit * 0.003,
      fill: "#fff",
      opacity: "0.25",
    });
    out += el("rect", {
      x: cx - unit * 0.035,
      y: fy - unit * 0.035,
      width: unit * 0.07,
      height: unit * 0.045,
      rx: unit * 0.012,
      fill: hardware,
    });
    out += el("rect", {
      x: cx - unit * 0.012,
      y: fy - unit * 0.025,
      width: unit * 0.024,
      height: unit * 0.025,
      rx: unit * 0.005,
      fill: mix(hardware, "#000000", 0.25),
    });
    // Metal feet at the bottom corners
    for (const sx of [-1, 1])
      out += el("ellipse", {
        cx: cx + sx * (bottom / 2 - unit * 0.05),
        cy: floorY,
        rx: unit * 0.014,
        ry: unit * 0.008,
        fill: hardware,
      });
  }
  note.alt(
    tote
      ? "A leather tote bag with long handles on a studio floor"
      : "A structured top-handle bag with a flap and clasp on a studio floor",
  );
  note.focus(cx, floorY - bh * 0.5);
  return out;
});
