import { defineKind, el, fill, hsl } from "../../draw/core";
import { tile } from "./shared";

/**
 * A woven check of two crossing sets of translucent stripes.
 *
 * @category Patterns
 */
export const gingham = /* @__PURE__ */ defineKind("gingham", "Gingham", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.pick([0, 12, 200, 215, 140, 165, 45, 280, 340, 25]);
  const ground = g.chance(0.8) ? "#fbfaf7" : hsl(hue + 30, 40, 94);
  const ink = hsl(hue + g.f(-8, 8), g.f(45, 65), g.f(60, 72));
  const size = unit * g.pick([0.08, 0.1, 0.12, 0.15]);
  const band = size / 2;
  const id = g.id("check");
  const weave = g.id("weave");
  // A fine diagonal twill inside the stripes, so the cloth reads as woven.
  const fine = size / 6;
  const twill = el(
    "pattern",
    { id: weave, width: fine, height: fine, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
    el("rect", { width: fine / 2, height: fine, fill: "#ffffff", opacity: "0.18" }),
  );
  const opacity = String(g.f(0.45, 0.55).toFixed(2));
  let out = el(
    "defs",
    {},
    twill,
    tile(
      g,
      id,
      size,
      el("rect", { width: size, height: band, fill: ink, opacity }),
      el("rect", { width: band, height: size, fill: ink, opacity }),
    ),
  );
  out += fill(w, h, ground);
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  out += el("rect", { width: w, height: h, fill: `url(#${weave})` });
  note.focus(w / 2, h / 2);
  note.alt(
    size > unit * 0.11
      ? "A woven gingham check with broad crossing stripes"
      : "A fine gingham check of crossing translucent stripes",
  );
  return out;
});
