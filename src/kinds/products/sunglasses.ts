import { defineKind, el, facing, mix, s } from "../../draw/core";
import { contact, studio } from "./shared";

/** A pair of folded sunglasses standing face-on, in aviator, round or wayfarer style. */
export const sunglasses = /* @__PURE__ */ defineKind("sunglasses", "Sunglasses", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.pick(["aviator", "round", "wayfarer"]);
  const W = unit * g.f(0.66, 0.72);
  const cx = w / 2;
  const gap = W * (style === "round" ? 0.11 : 0.09);
  const a = (W - gap) / 4; // half-width of one lens
  const b = style === "round" ? a : style === "aviator" ? a * 0.84 : a * 0.7;
  const floorY = h / 2 + b + unit * 0.06;
  const ly = floorY - b * (style === "aviator" ? 1.08 : 1.04);
  const lx = cx - gap / 2 - a; // the left lens center
  let out = studio(g, w, h, floorY, cx, ly);
  const metalFrame = style !== "wayfarer";
  const frame = metalFrame
    ? g.pick(["#d4b06a", "#cfd3d6", "#2b2b2b", "#b98a72"])
    : g.pick(["#2b2b2b", "#2b2b2b", "#5a3a2a", "#8a5a3b", "#2f3e5c", "#7a2e3a", "#c9b9a0", "#3c5e48"]);
  const tint = g.pick([
    ["#2b2f33", "#5a6066"],
    ["#3d2b22", "#8a6a4a"],
    ["#2f4033", "#5f7a5a"],
    ["#22385a", "#6fa3c8"],
    ["#5a3040", "#d08a9a"],
    ["#4a3a1e", "#c9a050"],
  ]);
  const lensId = g.id("lens");
  // One lens outline, centered on (x, y), the outer side to the left
  const lens = (x: number, y: number): string => {
    if (style === "round") return s`M ${x - a} ${y} A ${a} ${a} 0 1 1 ${x + a} ${y} A ${a} ${a} 0 1 1 ${x - a} ${y} Z`;
    if (style === "aviator")
      return s`M ${x - a * 0.95} ${y - b * 0.7}
               C ${x - a * 0.6} ${y - b * 1.02} ${x + a * 0.55} ${y - b * 1.02} ${x + a * 0.95} ${y - b * 0.78}
               C ${x + a * 1.08} ${y - b * 0.35} ${x + a * 0.75} ${y + b * 0.75} ${x + a * 0.05} ${y + b}
               C ${x - a * 0.55} ${y + b * 1.12} ${x - a * 1.08} ${y + b * 0.4} ${x - a * 0.95} ${y - b * 0.7} Z`;
    return s`M ${x - a * 1.02} ${y - b * 1.02}
             Q ${x} ${y - b * 0.9} ${x + a * 0.98} ${y - b * 0.88}
             C ${x + a * 1.02} ${y + b * 0.1} ${x + a * 0.8} ${y + b * 0.95} ${x + a * 0.2} ${y + b}
             C ${x - a * 0.4} ${y + b * 1.02} ${x - a * 0.9} ${y + b * 0.8} ${x - a * 0.95} ${y + b * 0.1}
             Z`;
  };
  const lensD = lens(lx, ly);
  out += el(
    "defs",
    {},
    el(
      "linearGradient",
      { id: lensId, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": tint[0] }),
      el("stop", { offset: 1, "stop-color": tint[1] }),
    ),
  );
  out += contact(cx, floorY, W * 0.5, unit * 0.022);
  // The folded temples, crossing behind the lenses
  const hingeY = ly - b * (style === "wayfarer" ? 0.7 : 0.55);
  out += el("path", {
    d: s`M ${cx - W / 2 + a * 0.05} ${hingeY} L ${cx + W * 0.3} ${hingeY + b * 0.22} M ${cx + W / 2 - a * 0.05} ${hingeY} L ${cx - W * 0.3} ${hingeY + b * 0.3}`,
    stroke: mix(frame, "#000000", 0.15),
    "stroke-width": metalFrame ? unit * 0.012 : unit * 0.022,
    "stroke-linecap": "round",
  });
  const fw = metalFrame ? unit * 0.012 : unit * 0.05;
  const one = (d: string) =>
    el("path", { d, fill: "none", stroke: frame, "stroke-width": fw, "stroke-linejoin": "round" }) +
    el("path", { d, fill: `url(#${lensId})`, "fill-opacity": "0.9" }) +
    // A streak of light across the lens
    el("path", {
      d: s`M ${lx - a * 0.55} ${ly + b * 0.15} L ${lx - a * 0.05} ${ly - b * 0.55}`,
      stroke: "#fff",
      "stroke-opacity": "0.3",
      "stroke-width": a * 0.16,
      "stroke-linecap": "round",
    });
  // Bridge between the lenses
  if (style === "aviator") {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.1} ${ly - b * 0.9} L ${cx + gap / 2 + a * 0.1} ${ly - b * 0.9}
           M ${cx - gap / 2 - a * 0.02} ${ly - b * 0.55} Q ${cx} ${ly - b * 0.75} ${cx + gap / 2 + a * 0.02} ${ly - b * 0.55}`,
      stroke: frame,
      "stroke-width": unit * 0.011,
      fill: "none",
    });
  } else if (style === "round") {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.02} ${ly - b * 0.35} Q ${cx} ${ly - b * 0.62} ${cx + gap / 2 + a * 0.02} ${ly - b * 0.35}`,
      stroke: frame,
      "stroke-width": unit * 0.013,
      fill: "none",
    });
  } else {
    out += el("path", {
      d: s`M ${cx - gap / 2 - a * 0.1} ${ly - b * 0.72} Q ${cx} ${ly - b * 0.95} ${cx + gap / 2 + a * 0.1} ${ly - b * 0.72}`,
      stroke: frame,
      "stroke-width": unit * 0.045,
      fill: "none",
    });
  }
  out += one(lensD);
  out += facing(cx, -1) + one(lensD) + "</g>";
  if (metalFrame) {
    // Nose pads and hinge studs
    for (const sx of [-1, 1]) {
      out += el("ellipse", {
        cx: cx + sx * gap * 0.62,
        cy: ly - b * 0.05,
        rx: unit * 0.008,
        ry: unit * 0.016,
        fill: "#e8ecee",
        opacity: "0.8",
      });
      out += el("circle", { cx: cx + sx * (W / 2 - a * 0.05), cy: hingeY, r: unit * 0.011, fill: frame });
    }
  } else {
    // Two little rivets at the corners, and a highlight along the top of the frame
    for (const sx of [-1, 1]) {
      out += el("circle", { cx: cx + sx * (W / 2 - a * 0.2), cy: ly - b * 0.78, r: unit * 0.008, fill: "#d9dcdf" });
    }
    out += el("path", {
      d: s`M ${lx - a * 0.8} ${ly - b * 1.08} Q ${lx} ${ly - b * 1.0} ${lx + a * 0.7} ${ly - b * 0.98}`,
      stroke: "#fff",
      "stroke-opacity": "0.25",
      "stroke-width": unit * 0.008,
      fill: "none",
      "stroke-linecap": "round",
    });
  }
  const name =
    style === "aviator"
      ? "Aviator sunglasses"
      : style === "round"
        ? "Round sunglasses"
        : "Thick-framed wayfarer-style sunglasses";
  note.alt(`${name}, folded and standing on a studio floor`);
  note.focus(cx, ly);
  return out;
});
