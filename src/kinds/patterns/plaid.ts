import { defineKind, el, fill, mix } from "../../draw/core";
import { tile } from "./shared";

/** A tartan plaid: a mirrored run of stripes in several widths and colors, crossing itself. */
export const plaid = /* @__PURE__ */ defineKind("plaid", "Plaid", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const palette = g.pick([
    ["#3f5a4a", "#6d8a72", "#c9b98a", "#8c3b3b", "#e8dfc8"],
    ["#33415c", "#5c6f91", "#b9c4d6", "#c58f4e", "#efe9dd"],
    ["#7a3b3b", "#a85a50", "#d9b48f", "#3e4a3d", "#f0e6d6"],
    ["#5b4a6b", "#8c7ca3", "#d8cfe3", "#c2a04f", "#f2eef4"],
    ["#4a5d57", "#86a39a", "#e3d9b8", "#b5654a", "#f4efe3"],
    ["#6b5440", "#a2846a", "#e2d3bd", "#4f6475", "#f5efe6"],
  ]);
  // Calmer plaids lift every color toward the lightest one.
  const lift = g.f(0.25, 0.45);
  const colors = palette.map(c => mix(c, palette[4], lift));
  // Half a sett: stripes of a few widths; the other half mirrors it.
  const module = unit * g.f(0.012, 0.018);
  const half: { color: string; width: number }[] = [];
  let last = -1;
  for (let k = g.i(5, 7); k > 0; k--) {
    let pick = g.i(0, colors.length - 1);
    while (pick === last) pick = g.i(0, colors.length - 1);
    last = pick;
    half.push({ color: colors[pick], width: module * g.pick([1, 2, 4, 6, 8, 12]) });
  }
  const sett = [...half, ...[...half].reverse()];
  const size = sett.reduce((sum, stripe) => sum + stripe.width, 0);
  // Horizontal stripes are solid; vertical ones are half see-through, so crossings blend.
  let across = "";
  let down = "";
  let at = 0;
  for (const { color, width } of sett) {
    across += el("rect", { y: at, width: size, height: width + 0.2, fill: color });
    down += el("rect", { x: at, width: width + 0.2, height: size, fill: color });
    at += width;
  }
  const id = g.id("sett");
  const weave = g.id("twill");
  const fine = module * 1.2;
  let out = el(
    "defs",
    {},
    tile(g, id, size, across, el("g", { opacity: "0.5" }, down)),
    el(
      "pattern",
      { id: weave, width: fine, height: fine, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      el("rect", { width: fine / 2, height: fine, fill: "#000", opacity: "0.07" }),
    ),
  );
  out += fill(w, h, sett[0].color);
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  out += el("rect", { width: w, height: h, fill: `url(#${weave})` });
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "A soft tartan plaid of crossing stripes in several widths"
      : "A woven plaid with broad and narrow stripes crossing",
  );
  return out;
});
