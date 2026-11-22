import { defineKind, el, fill, mix } from "../../draw/core";

/**
 * A tartan plaid: a mirrored run of stripes in several widths and colors, crossing itself.
 *
 * @category Patterns
 */
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
  // Half a sett: stripes of a few widths; the other half mirrors it. Widths are whole pixels.
  const module = Math.max(1, Math.round(unit * g.f(0.012, 0.018)));
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
  // The stripes run the full length of the picture rather than repeating in tiles, so no seams show
  // where tiles would meet, and their edges fall on whole pixels, so neighbors meet cleanly. Stripes
  // of one color and width share a path of thick lines. The sett starts somewhere different each seed.
  const stripes = (across: number, along: number, start: number, vertical: boolean) => {
    const paths = new Map<string, string>();
    for (let at = start - size; at < across;) {
      for (const { color, width } of sett) {
        if (at + width > 0 && at < across) {
          const key = `${color} ${width}`;
          const mid = at + width / 2;
          paths.set(key, (paths.get(key) ?? "") + (vertical ? `M${mid} 0v${along}` : `M0 ${mid}h${along}`));
        }
        at += width;
      }
    }
    let out = "";
    for (const [key, d] of paths) {
      const [color, width] = key.split(" ");
      out += el("path", { d, stroke: color, "stroke-width": width });
    }
    return out;
  };
  const shiftY = Math.round(g.f(0, size));
  const shiftX = Math.round(g.f(0, size));
  const weave = g.id("twill");
  const fine = module * 1.2;
  let out = el(
    "defs",
    {},
    el(
      "pattern",
      { id: weave, width: fine, height: fine, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      el("rect", { width: fine / 2, height: fine, fill: "#000", opacity: "0.07" }),
    ),
  );
  out += fill(w, h, sett[0].color);
  // Horizontal stripes are solid; vertical ones are half see-through, so crossings blend.
  out += stripes(h, w, shiftY, false);
  out += el("g", { opacity: "0.5" }, stripes(w, h, shiftX, true));
  out += el("rect", { width: w, height: h, fill: `url(#${weave})` });
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "A soft tartan plaid of crossing stripes in several widths"
      : "A woven plaid with broad and narrow stripes crossing",
  );
  return out;
});
