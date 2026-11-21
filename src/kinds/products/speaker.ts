import { defineKind, el, hsl, s } from "../../draw/core";
import { baseFor, shade, softContact, sweepStudio, tint } from "./shared";

/** A fabric-covered speaker: a portable cylinder, a smart speaker or a wide portable box. */
export const speaker = /* @__PURE__ */ defineKind("speaker", "Speaker", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const shape = g.pick(["cylinder", "smart", "box"] as const);
  const fabric = g.pick([
    "#3a3a3c",
    "#d8d2c6",
    "#5a6b7a",
    "#8a6f5a",
    "#b9c3b0",
    "#c98a7a",
    "#2f3e4f",
    "#e2ddd3",
    "#6b5b7a",
    "#a8b8c8",
  ]);
  const trim = g.pick([shade(fabric, 0.35), "#2b2b2d", tint(fabric, 0.3), "#d9dcdf"]);
  const weave = g.id("weave");
  const sheen = g.id("sheen");
  const cx = w / 2;
  const p = unit * 0.011;
  const defs = el(
    "defs",
    {},
    el(
      "pattern",
      { id: weave, width: p, height: p, patternUnits: "userSpaceOnUse" },
      el("circle", { cx: p / 2, cy: p / 2, r: p * 0.26, fill: "#000", opacity: "0.22" }),
    ),
    el(
      "linearGradient",
      { id: sheen, x1: 0, y1: 0, x2: 1, y2: 0 },
      el("stop", { offset: 0, "stop-color": "#000", "stop-opacity": "0.22" }),
      el("stop", { offset: 0.35, "stop-color": "#fff", "stop-opacity": "0.12" }),
      el("stop", { offset: 0.6, "stop-color": "#000", "stop-opacity": "0" }),
      el("stop", { offset: 1, "stop-color": "#000", "stop-opacity": "0.28" }),
    ),
  );
  let out: string;
  let alt: string;
  let focusY: number;
  if (shape === "box") {
    const bw = unit * g.f(0.62, 0.72);
    const bh = unit * g.f(0.28, 0.33);
    const base = baseFor(h, unit, bh);
    const y0 = base - bh;
    const x0 = cx - bw / 2;
    const r = bh / 2;
    const clip = g.id("pill");
    out = sweepStudio(g, w, h, base - bh * 0.6, cx, y0 + bh * 0.5) + defs;
    out += softContact(cx, base, bw * 0.45, unit * 0.022);
    // A strap looped on one end
    const end = g.chance(0.5) ? 1 : -1;
    const strap = g.chance(0.6);
    if (strap) {
      const ex = cx + end * (bw / 2);
      out += el("path", {
        d: s`M ${ex - end * r * 0.4} ${y0 + bh * 0.3} C ${ex + end * r * 0.9} ${y0 + bh * 0.1} ${ex + end * r * 0.9} ${y0 + bh * 0.8} ${ex - end * r * 0.4} ${y0 + bh * 0.62}`,
        stroke: g.pick(["#2b2b2d", shade(fabric, 0.4), "#8a5a3b"]),
        "stroke-width": unit * 0.016,
        fill: "none",
        "stroke-linecap": "round",
      });
    }
    // Buttons along the top edge
    for (let b = 0; b < 3; b++) {
      out += el("rect", {
        x: cx - bw * 0.11 + b * bw * 0.08,
        y: y0 - unit * 0.008,
        width: bw * 0.055,
        height: unit * 0.02,
        rx: unit * 0.006,
        fill: shade(trim, 0.2),
      });
    }
    // A fabric pill with rubber end caps, shaded below and lit along the top
    const pill = { x: x0, y: y0, width: bw, height: bh, rx: r };
    let inside = el("rect", { ...pill, fill: fabric });
    inside += el("rect", { ...pill, fill: `url(#${weave})` });
    const cap = bh * 0.32;
    inside += el("rect", { x: x0, y: y0, width: cap, height: bh, fill: trim });
    inside += el("rect", { x: x0 + bw - cap, y: y0, width: cap, height: bh, fill: trim });
    inside += el("rect", { x: x0, y: y0 + bh * 0.72, width: bw, height: bh * 0.28, fill: "#000", opacity: "0.12" });
    inside += el("rect", { x: x0, y: y0 + bh * 0.1, width: bw, height: bh * 0.06, fill: "#fff", opacity: "0.15" });
    out += el("defs", {}, el("clipPath", { id: clip }, el("rect", pill)));
    out += el("g", { "clip-path": `url(#${clip})` }, inside);
    // A rubber foot along the bottom
    out += el("rect", {
      x: cx - bw * 0.3,
      y: base - unit * 0.006,
      width: bw * 0.6,
      height: unit * 0.012,
      rx: unit * 0.006,
      fill: "#222",
    });
    alt = strap
      ? "A portable fabric speaker with a strap looped on one end"
      : "A portable fabric speaker with rubber end caps";
    focusY = y0 + bh * 0.5;
  } else {
    const smart = shape === "smart";
    const r = unit * (smart ? g.f(0.22, 0.26) : g.f(0.15, 0.18));
    const ch = unit * (smart ? g.f(0.36, 0.44) : g.f(0.5, 0.6));
    const ry = r * 0.24;
    const base = baseFor(h, unit, ch + ry * 2);
    const bot = base - ry;
    const topY = bot - ch;
    out = sweepStudio(g, w, h, base - ch * 0.5, cx, topY + ch * 0.5) + defs;
    out += softContact(cx, base - ry * 0.3, r * 1.1, ry * 0.9);
    const side = (y1: number, y2: number) =>
      s`M ${cx - r} ${y1} L ${cx - r} ${y2} A ${r} ${ry} 0 0 0 ${cx + r} ${y2} L ${cx + r} ${y1} A ${r} ${ry} 0 0 1 ${cx - r} ${y1} Z`;
    const body = side(topY, bot);
    // A carrying loop at the back of a portable one
    const loop = !smart && g.chance(0.6);
    if (loop) {
      out += el("path", {
        d: s`M ${cx - r * 0.25} ${topY - ry * 0.6} Q ${cx} ${topY - ry * 3.2} ${cx + r * 0.25} ${topY - ry * 0.6}`,
        stroke: g.pick(["#2b2b2d", shade(fabric, 0.4)]),
        "stroke-width": unit * 0.014,
        fill: "none",
      });
    }
    out += el("path", { d: body, fill: fabric });
    out += el("path", { d: body, fill: `url(#${weave})` });
    // Rubber bands at the base, and at the top of a portable one
    const band = ch * 0.07;
    out += el("path", { d: side(bot - band, bot), fill: trim });
    if (!smart) out += el("path", { d: side(topY, topY + band), fill: trim });
    out += el("path", { d: body, fill: `url(#${sheen})` });
    // The top: a cap with a light ring, or buttons
    out += el("ellipse", { cx, cy: topY, rx: r, ry, fill: smart ? tint(trim, 0.15) : shade(trim, 0.08) });
    if (smart) {
      out += el("ellipse", {
        cx,
        cy: topY,
        rx: r * 0.8,
        ry: ry * 0.8,
        fill: "none",
        stroke: hsl(g.f(0, 360), 70, 72),
        "stroke-width": ry * 0.16,
        opacity: "0.9",
      });
      for (const dx of [-0.35, 0, 0.35]) {
        out += el("ellipse", {
          cx: cx + r * dx,
          cy: topY + ry * (dx ? 0.05 : 0.25),
          rx: r * 0.06,
          ry: ry * 0.09,
          fill: shade(trim, 0.3),
        });
      }
      alt = "A round smart speaker in fabric, a light ring glowing on top";
    } else {
      out += el("ellipse", { cx, cy: topY, rx: r * 0.55, ry: ry * 0.55, fill: shade(trim, 0.2) });
      out += el("ellipse", { cx, cy: topY - ry * 0.05, rx: r * 0.2, ry: ry * 0.22, fill: tint(trim, 0.2) });
      alt = loop
        ? "A cylindrical portable speaker in fabric, with a carrying loop"
        : "A cylindrical portable speaker wrapped in fabric";
    }
    out += el("rect", {
      x: cx - r * 0.62,
      y: topY + ch * 0.15,
      width: r * 0.06,
      height: ch * 0.6,
      rx: r * 0.03,
      fill: "#fff",
      opacity: "0.15",
    });
    focusY = topY + ch * 0.4;
  }
  note.alt(alt);
  note.focus(cx, focusY);
  return out;
});
