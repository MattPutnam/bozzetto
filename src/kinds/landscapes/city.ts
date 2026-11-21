import { defineKind, el, fill, hsl, lin } from "../../draw/core";

/** Two rows of buildings against a dusk sky; some windows are lit. */
export const city = /* @__PURE__ */ defineKind("city", "City at dusk", (g, w, h, note) => {
  const hue = g.f(0, 360);
  const sky = g.id("sky");
  const win = g.id("win");
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(hue + 220, 40, 28), hsl(hue, 60, 72)]),
    // A tile with one lit window, repeated over a building's face.
    el(
      "pattern",
      { id: win, width: 9, height: 12, patternUnits: "userSpaceOnUse" },
      el("rect", { x: 3, y: 3, width: 3, height: 5, fill: "hsl(45 90% 76%)" }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  // The setting sun.
  const sunX = w * g.f(0.15, 0.85);
  const sunY = h * g.f(0.3, 0.5);
  out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.06, 0.1), fill: hsl(hue + 20, 90, 88) });
  note.focus(sunX, sunY);
  // The pale back row of buildings, packed side by side.
  for (let x = -5; x < w;) {
    const bw = w * g.f(0.06, 0.13);
    const bh = h * g.f(0.28, 0.58);
    out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: hsl(hue + 230, 18, 42) });
    x += bw + g.f(-2, 3);
  }
  // The dark front row, some with lit windows.
  let fronts = 0;
  let lit = 0;
  for (let x = -5; x < w;) {
    fronts++;
    const bw = w * g.f(0.08, 0.16);
    const bh = h * g.f(0.16, 0.45);
    out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: hsl(hue + 230, 22, 18) });
    if (g.chance(0.6)) {
      lit++;
      out += el("rect", {
        x: x + 3,
        y: h - bh + 6,
        width: bw - 6,
        height: bh - 6,
        fill: `url(#${win})`,
        opacity: g.f(0.35, 0.9),
      });
    }
    x += bw + g.f(0, 4);
  }
  const windows = lit === 0 ? "" : lit * 2 <= fronts ? " with a few lit windows" : " with many lit windows";
  note.alt(`A dusk skyline${windows} below a setting sun`);
  return out;
});
