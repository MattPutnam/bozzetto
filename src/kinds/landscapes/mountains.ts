import { defineKind, el, fill, hsl, lin, type Point, pts } from "../../draw/core";

/** Three jagged ranges fading into the distance. */
export const mountains = /* @__PURE__ */ defineKind("mountains", "Mountain ranges", (g, w, h, note) => {
  const hue = g.f(180, 260);
  const shift = g.f(-35, 30);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(hue + shift, 45, 70), hsl(hue + shift + 30, 55, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The sun, most of the time.
  let sun: Point | undefined;
  if (g.chance(0.7)) {
    const sunX = w * g.f(0.15, 0.85);
    const sunY = h * g.f(0.18, 0.32);
    sun = [sunX, sunY];
    out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.05, 0.09), fill: hsl(hue + shift + 180, 70, 92) });
  }
  note.alt(
    sun
      ? "Three jagged mountain ranges fading into the distance under a sun"
      : "Three jagged mountain ranges fading into the distance",
  );
  // Without a sun, the eye goes to the highest peak.
  let peak: Point = [w / 2, h];
  // Three ranges, back to front: each lower, flatter and darker than the last.
  for (let range = 0; range < 3; range++) {
    const base = h * (0.52 + 0.15 * range);
    const amp = h * (0.34 - 0.08 * range);
    const steps = g.i(4, 6) + range;
    const ridge: Point[] = [[0, base - g.f(0, amp * 0.5)]];
    for (let step = 1; step < steps; step++) {
      const x = (w * step) / steps + g.f(-0.3, 0.3) * (w / steps);
      // Odd steps are peaks, even steps are valleys.
      ridge.push([x, step % 2 ? base - amp * g.f(0.55, 1) : base - amp * g.f(0, 0.35)]);
    }
    // Inner points only, so the focus never sits on an edge.
    for (const point of ridge.slice(1)) if (point[1] < peak[1]) peak = point;
    ridge.push([w, base - g.f(0, amp * 0.6)], [w, h], [0, h]);
    out += el("polygon", { points: pts(ridge), fill: hsl(hue + shift + 10, 16 + 8 * range, 64 - 17 * range) });
  }
  const [focusX, focusY] = sun ?? peak;
  note.focus(focusX, focusY);
  return out;
});
