import { defineKind, el, fill, hex, hsl, lin } from "../../draw/core";

/**
 * Two rows of buildings against a dusk sky; some windows are lit.
 *
 * @category Landscapes
 */
export const city = /* @__PURE__ */ defineKind("city", "City at dusk", (g, w, h, note) => {
  const sky = g.id("sky");
  const win = g.id("win");
  // A few dusk skies, from the top down: indigo to peach, blue to gold, or violet to rose.
  const mood = g.pick(["sunset", "golden", "rose"] as const);
  const topHue = mood === "golden" ? g.f(205, 222) : mood === "sunset" ? g.f(235, 260) : g.f(255, 275);
  const stops =
    mood === "sunset"
      ? [hex(topHue, 38, 30), hex(g.f(320, 342), 45, 62), hex(g.f(22, 36), 90, 74)]
      : mood === "golden"
        ? [hex(topHue, 45, 42), hex(g.f(18, 30), 70, 72), hex(g.f(40, 48), 92, 78)]
        : [hex(topHue, 35, 28), hex(g.f(330, 350), 50, 72)];
  let out = el(
    "defs",
    {},
    lin(sky, stops),
    // A tile with one lit window, repeated over a building's face.
    el(
      "pattern",
      { id: win, width: 9, height: 12, patternUnits: "userSpaceOnUse" },
      el("rect", { x: 3, y: 3, width: 3, height: 5, fill: "hsl(45 90% 76%)" }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  // Buildings are sized from the height on wide pictures, so the skyline stays tall and narrow.
  const span = Math.min(w, h * 1.8);
  // The back row of buildings, packed side by side, in a muted tone well darker than the sky behind.
  const backs: [number, number, number][] = [];
  for (let x = -5; x < w;) {
    const bw = span * g.f(0.06, 0.13);
    const bh = h * g.f(0.28, 0.55);
    backs.push([x, bw, bh]);
    x += bw + g.f(-2, 3);
  }
  // The setting sun, kept clear above the rooftops.
  const r = Math.min(w, h) * g.f(0.07, 0.11);
  const sunX = w * g.f(0.15, 0.85);
  const roof = Math.min(
    ...backs.filter(([x, bw]) => x < sunX + r * 1.4 && x + bw > sunX - r * 1.4).map(([, , bh]) => h - bh),
  );
  const sunY = Math.max(r * 1.6, Math.min(h * g.f(0.25, 0.42), roof - r * 1.5));
  out += el("circle", { cx: sunX, cy: sunY, r: r * 1.5, fill: hsl(45, 100, 90), opacity: "0.25" });
  out += el("circle", { cx: sunX, cy: sunY, r, fill: hsl(g.f(38, 52), 100, 90) });
  note.focus(sunX, sunY);
  const back = hex(topHue, 22, 36);
  for (const [x, bw, bh] of backs) out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: back });
  // The dark front row, some with lit windows.
  let fronts = 0;
  let lit = 0;
  const front = hex(topHue, 26, 15);
  for (let x = -5; x < w;) {
    fronts++;
    const bw = span * g.f(0.08, 0.16);
    const bh = h * g.f(0.16, 0.45);
    out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: front });
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
