import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { capitalize, numberWord } from "../../draw/words";
import { SPRINKLES } from "./shared";

const FROSTING = ["#fbf4e8", "#f7c6d0", "#c9a7eb", "#b8e0b0", "#6b3e2e", "#8fd3f4", "#f6d365"];

const WRAPPERS = ["#f49ac1", "#8fd3f4", "#f6d365", "#7bd389", "#c9a7eb", "#f28b66", "#fbf4e8"];

/**
 * One to three cupcakes on a table, with swirled frosting and sprinkles or a cherry.
 *
 * @category Food
 */
export const cupcake = /* @__PURE__ */ defineKind("cupcake", "Cupcake", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.6, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const size = (c: number) => unit * [0.4, 0.34, 0.3][c - 1];
  let count = g.i(1, 3);
  while (count > 1 && count * size(count) * 1.3 > w * 0.92) count--;
  const S = size(count);
  const baseY = h * 0.88;
  const topping = g.pick(["sprinkles", "cherry", "both", "berry"]);
  const sponge = g.pick(["#e9b872", "#7b4a35", "#f3d9a4"]);
  let focusY = 0;
  for (let k = 0; k < count; k++) {
    const x = w / 2 + (k - (count - 1) / 2) * S * 1.3;
    const frost = g.pick(FROSTING);
    const wrap = g.pick(WRAPPERS.filter(c => c !== frost));
    const top = baseY - S * 0.56;
    // Shadow, and the paper wrapper with its pleats
    out += el("ellipse", { cx: x, cy: baseY, rx: S * 0.48, ry: S * 0.06, fill: "#000", opacity: "0.12" });
    out += el("polygon", {
      points: pts([
        [x - S * 0.36, baseY],
        [x + S * 0.36, baseY],
        [x + S * 0.47, top],
        [x - S * 0.47, top],
      ]),
      fill: wrap,
    });
    let pleats = "";
    for (let p = 1; p < 7; p++) {
      const u = -1 + p / 3.5;
      pleats += s`M${x + u * S * 0.36} ${baseY}L${x + u * S * 0.47} ${top}`;
    }
    out += el("path", { d: pleats, stroke: mix(wrap, "#000000", 0.12), "stroke-width": S * 0.02 });
    // The cake's crown above the wrapper
    out += el("ellipse", { cx: x, cy: top - S * 0.02, rx: S * 0.5, ry: S * 0.1, fill: sponge });
    // Three tiers of frosting, each shaded underneath
    const tiers: [number, number, number][] = [];
    for (let t = 0; t < 3; t++) {
      const rx = S * 0.52 * (1 - t * 0.27);
      const ry = S * 0.13 * (1 - t * 0.1);
      const cy = top - S * 0.1 - t * S * 0.17;
      tiers.push([cy, rx, ry]);
      out += el("ellipse", { cx: x, cy: cy + ry * 0.3, rx, ry, fill: mix(frost, "#000000", 0.1) });
      out += el("ellipse", { cx: x, cy, rx, ry, fill: frost });
    }
    const [ty, , tr] = tiers[2];
    // The swirl's peak
    out += el("path", {
      d: s`M ${x - S * 0.12} ${ty} C ${x - S * 0.1} ${ty - S * 0.15} ${x + S * 0.01} ${ty - S * 0.12} ${x + S * 0.03} ${ty - S * 0.24}
           C ${x + S * 0.1} ${ty - S * 0.12} ${x + S * 0.13} ${ty - S * 0.06} ${x + S * 0.12} ${ty} Z`,
      fill: frost,
    });
    focusY = ty - tr;
    if (topping !== "cherry" && topping !== "berry") {
      // Sprinkles spread over the front of each tier
      const colors = SPRINKLES.filter(c => c !== frost);
      const byColor = new Map<string, string>();
      for (const [cy, rx, ry] of tiers)
        for (let p = 0; p < 5; p++) {
          const u = -0.75 + p * 0.375 + g.f(-0.08, 0.08);
          const px = x + u * rx;
          const py = cy + ry * Math.sqrt(1 - u * u) * g.f(-0.3, 0.6);
          const a = g.f(0, Math.PI);
          const c = g.pick(colors);
          const d = s`M${px - Math.cos(a) * S * 0.025} ${py - Math.sin(a) * S * 0.025}l${Math.cos(a) * S * 0.05} ${Math.sin(a) * S * 0.05}`;
          byColor.set(c, (byColor.get(c) ?? "") + d);
        }
      for (const [c, path] of byColor)
        out += el("path", { d: path, stroke: c, "stroke-width": S * 0.022, "stroke-linecap": "round" });
    }
    if (topping === "cherry" || topping === "both") {
      // A cherry on the peak, with its stem
      const cy = ty - S * 0.2;
      out += el("path", {
        d: s`M ${x} ${cy - S * 0.06} q ${S * 0.02} ${-S * 0.12} ${S * 0.1} ${-S * 0.16}`,
        stroke: "#4b7a2a",
        "stroke-width": S * 0.025,
        fill: "none",
        "stroke-linecap": "round",
      });
      out += el("circle", { cx: x, cy, r: S * 0.085, fill: "#d62839" });
      out += el("circle", { cx: x - S * 0.03, cy: cy - S * 0.03, r: S * 0.022, fill: "#fff", opacity: "0.6" });
      focusY = cy;
    } else if (topping === "berry") {
      // A strawberry on the peak
      const cy = ty - S * 0.16;
      out += el("path", {
        d: s`M ${x} ${cy + S * 0.1} C ${x - S * 0.13} ${cy + S * 0.02} ${x - S * 0.1} ${cy - S * 0.1} ${x} ${cy - S * 0.08}
             C ${x + S * 0.1} ${cy - S * 0.1} ${x + S * 0.13} ${cy + S * 0.02} ${x} ${cy + S * 0.1} Z`,
        fill: "#e0384f",
      });
      out += el("path", {
        d: s`M ${x - S * 0.07} ${cy - S * 0.1} L ${x} ${cy - S * 0.06} L ${x + S * 0.07} ${cy - S * 0.1}`,
        stroke: "#4b8a2a",
        "stroke-width": S * 0.035,
        fill: "none",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      focusY = cy;
    }
  }
  const what =
    topping === "sprinkles"
      ? "sprinkles"
      : topping === "cherry"
        ? "a cherry"
        : topping === "both"
          ? "sprinkles and a cherry"
          : "a strawberry";
  note.alt(
    `${count === 1 ? "A cupcake" : `${capitalize(numberWord(count))} cupcakes`} with swirled frosting and ${what}`,
  );
  note.focus(w / 2, focusY);
  return out;
});
