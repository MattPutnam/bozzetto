import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";

/** A low sun over the sea, with its reflection broken into streaks. */
export const sea = /* @__PURE__ */ defineKind("sea", "Sunset sea", (g, w, h, note) => {
  const hue = g.f(-15, 45);
  const horizon = h * g.f(0.55, 0.68);
  const sunX = w * g.f(0.25, 0.75);
  const sunR = h * g.f(0.08, 0.14);
  const sunY = horizon - sunR * g.f(-0.2, 0.7);
  const sun = hsl(hue + 10, 95, g.f(72, 86));
  const sky = g.id("sky");
  const water = g.id("water");
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(hue + 240, 35, g.f(35, 50)), hsl(hue + 320, 50, 66), hsl(hue, 90, 78)]),
    lin(water, [hsl(hue + 220, 35, 40), hsl(hue + 225, 45, 17)]),
  );
  out += fill(w, h, `url(#${sky})`);
  // The sun.
  out += el("circle", { cx: sunX, cy: sunY, r: sunR, fill: sun });
  note.alt("A sun setting into a calm sea, its reflection streaking the water");
  note.focus(sunX, sunY);
  if (g.chance(0.4)) {
    // A distant island on the horizon.
    const islandX = w * g.f(0, 0.8);
    const islandW = w * g.f(0.12, 0.3);
    out += el("path", {
      d: s`M${islandX} ${horizon}
           Q ${islandX + islandW * 0.4} ${horizon - h * g.f(0.04, 0.09)} ${islandX + islandW} ${horizon}Z`,
      fill: hsl(hue + 250, 30, 25),
    });
    note.alt("A sun setting into a calm sea beside a distant island");
  }
  // The water.
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  // The sun's reflection: streaks that narrow and fade toward the viewer.
  const streaks = g.i(4, 7);
  for (let i = 0; i < streaks; i++) {
    const y = horizon + (h - horizon) * Math.pow((i + 0.6) / (streaks + 1), 1.3);
    const streakW = 2 * sunR * (1 - (0.6 * i) / streaks) * g.f(0.7, 1.1);
    out += el("rect", {
      x: sunX - streakW / 2 + g.f(-4, 4),
      y,
      width: streakW,
      height: g.f(1.5, 3.5),
      rx: "1.5",
      fill: sun,
      opacity: 0.75 - i * 0.08,
    });
  }
  return out;
});
