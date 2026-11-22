import { defineKind, el, hsl, mix, type Point, type Rand, s } from "../../draw/core";
import { smoothClosed, table } from "../../draw/shapes";
import { sidePlate } from "./shared";

const PASTRIES = ["#d98c3f", "#e3a04f", "#cf8236"];

/** A croissant `size` across, the middle of its underside resting at (x, y): a crescent, its tips curling toward us. */
function croissantShape(g: Rand, x: number, y: number, size: number, color: string): string {
  const hc = size * 0.4;
  const reach = size * 0.46;
  const drop = hc * 0.35;
  const base = (t: number) => y + drop * t * t;
  const thick = (t: number) => hc * Math.max(0.12, 1 - 0.8 * Math.abs(t) ** 1.6);
  const ring: Point[] = [];
  for (let k = -6; k <= 6; k++) ring.push([x + (k / 6) * reach, base(k / 6) - thick(k / 6)]);
  for (let k = 5; k >= -5; k--) ring.push([x + (k / 6) * reach * 0.97, base(k / 6)]);
  const body = smoothClosed(ring);
  const dark = mix(color, "#000000", 0.25);
  const lit = mix(color, "#ffffff", 0.3);
  const clip = g.id(`croissant${Math.round(x)}`);
  let out = el("ellipse", {
    cx: x,
    cy: y + drop * 0.35,
    rx: size * 0.44,
    ry: hc * 0.12,
    fill: "#000",
    opacity: "0.15",
  });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: body })));
  let inside = el("path", { d: body, fill: color });
  // Each layer's highlight, then the grooves between the layers, bowed away from the middle
  let grooves = "";
  const edges = [-0.82, -0.55, -0.22, 0.22, 0.55, 0.82];
  const mids = [-0.95, -0.69, -0.39, 0, 0.39, 0.69, 0.95];
  for (const t of mids) {
    const th = thick(t);
    inside += el("ellipse", {
      cx: x + t * reach - reach * 0.04,
      cy: base(t) - th * 0.68,
      rx: reach * 0.09 * (1 - 0.4 * Math.abs(t)),
      ry: th * 0.2,
      fill: lit,
      opacity: "0.55",
    });
  }
  for (const t of edges) {
    const th = thick(t);
    const sx = x + t * reach;
    const bow = Math.sign(t) * th * 0.28;
    grooves += s`M ${sx - bow * 0.3} ${base(t) - th - hc * 0.1} Q ${sx + bow} ${base(t) - th * 0.5} ${sx - bow * 0.3} ${base(t) + hc * 0.1}`;
  }
  inside += el("path", { d: grooves, stroke: dark, "stroke-width": hc * 0.07, fill: "none" });
  // Darker underside
  inside += el("path", {
    d: s`M ${x - reach} ${base(1) - hc * 0.1} Q ${x} ${y - drop - hc * 0.1} ${x + reach} ${base(1) - hc * 0.1}`,
    stroke: dark,
    "stroke-width": hc * 0.2,
    fill: "none",
    opacity: "0.35",
  });
  out += el("g", { "clip-path": `url(#${clip})` }, inside);
  return out;
}

/**
 * One or two croissants on a plate, sometimes with a cup of coffee beside them.
 *
 * @category Food
 */
export const croissant = /* @__PURE__ */ defineKind("croissant", "Croissant", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const two = g.chance(0.4);
  const cupWanted = g.chance(0.55);
  const cup = cupWanted && w >= h * 1.2;
  const size = unit * (two ? 0.5 : 0.6);
  const cr = unit * 0.13;
  const prx = Math.min(size * (two ? 0.98 : 0.8), (w * 0.94 - (cup ? unit * 0.08 + cr * 3 : 0)) / 2);
  const pry = prx * 0.26;
  const rowW = prx * 2 + (cup ? unit * 0.08 + cr * 3 : 0);
  const cx = w / 2 - rowW / 2 + prx;
  const hc = size * 0.42;
  const plateY = Math.min(h * 0.95 - pry * 1.12, h / 2 + hc * 0.5 + (two ? pry * 0.3 : 0));
  let out = table(
    g,
    w,
    h,
    Math.max(h * 0.12, plateY - pry - unit * 0.08),
    hsl(g.f(0, 360), 30, 86),
    hsl(g.f(20, 40), 35, 62),
  );
  out += sidePlate(cx, plateY, prx, pry, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0", "#dfe7f5"]));
  const color = g.pick(PASTRIES);
  if (two) {
    out += croissantShape(g, cx - prx * 0.26, plateY - pry * 0.25, size * 0.85, g.pick(PASTRIES));
    out += croissantShape(g, cx + prx * 0.2, plateY + pry * 0.35, size * 0.9, color);
  } else out += croissantShape(g, cx, plateY + pry * 0.1, size, color);
  let latte = false;
  if (cup) {
    // A cup of coffee on its saucer, a little behind the plate
    const x = cx + prx + unit * 0.08 + cr * 1.5;
    const base = plateY - pry * 0.2;
    const china = g.pick(["#ffffff", "#ffffff", "#f3e6d0", "#d8ebe4", "#2b5d8a"]);
    const shade = mix(china, "#000000", 0.12);
    const ch = cr * 1.05;
    const top = base - cr * 0.12 - ch;
    out += el("ellipse", { cx: x, cy: base + cr * 0.05, rx: cr * 1.5, ry: cr * 0.36, fill: "#000", opacity: "0.12" });
    out += el("ellipse", { cx: x, cy: base, rx: cr * 1.5, ry: cr * 0.34, fill: shade });
    out += el("ellipse", { cx: x, cy: base - cr * 0.04, rx: cr * 1.42, ry: cr * 0.3, fill: china });
    // Handle, body and rim
    out += el("path", {
      d: s`M ${x + cr * 0.9} ${top + ch * 0.25} C ${x + cr * 1.55} ${top + ch * 0.2} ${x + cr * 1.5} ${top + ch * 0.75} ${x + cr * 0.75} ${top + ch * 0.8}`,
      stroke: shade,
      "stroke-width": cr * 0.16,
      fill: "none",
    });
    out += el("path", {
      d: s`M ${x - cr} ${top} L ${x + cr} ${top} C ${x + cr} ${top + ch * 0.9} ${x + cr * 0.6} ${top + ch} ${x} ${top + ch}
           C ${x - cr * 0.6} ${top + ch} ${x - cr} ${top + ch * 0.9} ${x - cr} ${top} Z`,
      fill: china,
    });
    out += el("path", {
      d: s`M ${x + cr * 0.55} ${top + ch * 0.15} C ${x + cr * 0.6} ${top + ch * 0.6} ${x + cr * 0.4} ${top + ch * 0.85} ${x} ${top + ch * 0.95}`,
      stroke: "#000",
      "stroke-width": cr * 0.12,
      fill: "none",
      opacity: "0.06",
    });
    out += el("ellipse", { cx: x, cy: top, rx: cr, ry: cr * 0.26, fill: shade });
    latte = g.chance(0.6);
    out += el("ellipse", {
      cx: x,
      cy: top + cr * 0.02,
      rx: cr * 0.88,
      ry: cr * 0.2,
      fill: latte ? "#c8955c" : "#4a2c1d",
    });
    if (latte)
      out += el("path", {
        d: s`M ${x} ${top + cr * 0.15} C ${x - cr * 0.5} ${top} ${x - cr * 0.2} ${top - cr * 0.14} ${x} ${top - cr * 0.04}
             C ${x + cr * 0.2} ${top - cr * 0.14} ${x + cr * 0.5} ${top} ${x} ${top + cr * 0.15} Z`,
        fill: "#f3e2bf",
      });
  }
  note.alt(
    `${two ? "Two croissants" : "A croissant"} on a plate${cup ? `, with ${latte ? "a latte" : "a cup of coffee"} beside it` : ""}`,
  );
  note.focus(cx, plateY - hc * 0.5);
  return out;
});
