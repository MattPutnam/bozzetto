import { defineKind, el, fill, hsl, lin, pts, qpt, s, type Point } from "./core";

/** Soft hills under a gradient sky and a sun, sometimes with a lone tree. */
export const hills = defineKind("hills", "Rolling hills", "landscape", (g, w, h) => {
  const hue = g.f(0, 360);
  const sky = g.id("sky");
  // The far hill: one curve and its smooth continuation.
  const farPeak = g.f(0.42, 0.58);
  const farMid = g.f(0.56, 0.68);
  const farEnd = g.f(0.48, 0.62);
  // The near hill: a single curve from (0, y0) through control (qx, y1) to (w, y2).
  const y0 = h * g.f(0.76, 0.86);
  const y1 = h * g.f(0.56, 0.7);
  const y2 = h * g.f(0.72, 0.84);
  const qx = w * g.f(0.3, 0.6);

  let out = el("defs", {}, lin(sky, [hsl(hue, 55, 78), "#fff"]));
  out += fill(w, h, `url(#${sky})`);
  out += el("circle", {
    cx: w * g.f(0.2, 0.8),
    cy: h * g.f(0.22, 0.38),
    r: h * g.f(0.07, 0.12),
    fill: hsl(hue + 180, 80, 88),
  });
  out += el("path", {
    d: s`M0 ${h * farMid + h * 0.08}
         Q ${w * 0.3} ${h * farPeak} ${w * 0.6} ${h * farMid}
         T ${w} ${h * farEnd}
         V ${h} H 0Z`,
    fill: hsl(hue + 15, 35, 62),
  });
  if (g.chance(0.45)) {
    // A lone tree standing on the near hill.
    const [tx, ty] = qpt([0, y0], [qx, y1], [w, y2], g.f(0.2, 0.8));
    const th = h * g.f(0.1, 0.16);
    out += el("rect", { x: tx - th * 0.05, y: ty - th, width: th * 0.1, height: th + 6, fill: hsl(hue + 20, 30, 30) });
    out += el("circle", { cx: tx, cy: ty - th, r: th * g.f(0.35, 0.5), fill: hsl(hue + 40, 38, 36) });
  }
  out += el("path", {
    d: s`M0 ${y0}
         Q ${qx} ${y1} ${w} ${y2}
         V ${h} H 0Z`,
    fill: hsl(hue + 30, 40, 45),
  });
  return out;
});

/** Three jagged ranges fading into the distance. */
export const mountains = defineKind("mountains", "Mountain ranges", "landscape", (g, w, h) => {
  const hue = g.f(180, 260);
  const shift = g.f(-35, 30);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(hue + shift, 45, 70), hsl(hue + shift + 30, 55, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The sun, most of the time.
  if (g.chance(0.7))
    out += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: h * g.f(0.18, 0.32),
      r: h * g.f(0.05, 0.09),
      fill: hsl(hue + shift + 180, 70, 92),
    });
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
    ridge.push([w, base - g.f(0, amp * 0.6)], [w, h], [0, h]);
    out += el("polygon", { points: pts(ridge), fill: hsl(hue + shift + 10, 16 + 8 * range, 64 - 17 * range) });
  }
  return out;
});

/** A low sun over the sea, with its reflection broken into streaks. */
export const sea = defineKind("sea", "Sunset sea", "landscape", (g, w, h) => {
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
  if (g.chance(0.4)) {
    // A distant island on the horizon.
    const islandX = w * g.f(0, 0.8);
    const islandW = w * g.f(0.12, 0.3);
    out += el("path", {
      d: s`M${islandX} ${horizon}
           Q ${islandX + islandW * 0.4} ${horizon - h * g.f(0.04, 0.09)} ${islandX + islandW} ${horizon}Z`,
      fill: hsl(hue + 250, 30, 25),
    });
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

/** Layered sand ridges under a pale sun. */
export const dunes = defineKind("dunes", "Desert dunes", "landscape", (g, w, h) => {
  const sand = g.f(16, 40);
  const skyHue = g.f(185, 220);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 55, 68), hsl(skyHue - 20, 60, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The pale sun.
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: h * g.f(0.18, 0.3),
    r: h * g.f(0.05, 0.08),
    fill: "hsl(48 95% 94%)",
  });
  // Three dune ridges, back to front, each a single S-curve.
  for (let ridge = 0; ridge < 3; ridge++) {
    const y0 = h * (0.5 + 0.14 * ridge + g.f(-0.04, 0.04));
    out += el("path", {
      d: s`M0 ${y0}
           C ${w * g.f(0.15, 0.4)} ${y0 - h * g.f(0.05, 0.16)}
             ${w * g.f(0.5, 0.8)} ${y0 + h * g.f(0.02, 0.12)}
             ${w} ${y0 + h * g.f(-0.1, 0.06)}
           V ${h} H 0Z`,
      fill: hsl(sand + ridge * 4, 58 - 4 * ridge, 74 - 10 * ridge),
    });
  }
  return out;
});

const PINE: readonly Point[] = [
  [0, -1],
  [0.3, -0.62],
  [0.17, -0.62],
  [0.42, -0.3],
  [0.27, -0.3],
  [0.5, 0],
  [-0.5, 0],
  [-0.27, -0.3],
  [-0.42, -0.3],
  [-0.17, -0.62],
  [-0.3, -0.62],
];
/** A three-tier pine whose trunk base sits at (x, y). */
const pine = (x: number, y: number, ht: number, wd: number, paint: string) =>
  el("polygon", { points: pts(PINE.map(([px, py]): Point => [x + px * wd, y + py * ht])), fill: paint });

/** A pale back row of pines and a dark, scattered front row. */
export const forest = defineKind("forest", "Pine forest", "landscape", (g, w, h) => {
  const hue = g.f(90, 165);
  const skyHue = g.f(180, 235);
  const groundY = h * g.f(0.66, 0.76);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 45, 76), hsl(skyHue - 30, 50, 93)]));
  out += fill(w, h, `url(#${sky})`);
  // The pale back row, evenly spread along the horizon.
  const back = g.i(9, 14);
  for (let i = 0; i < back; i++) {
    const ht = h * g.f(0.14, 0.26);
    out += pine((w * (i + g.f(0, 1))) / back, groundY + g.f(-2, 3), ht, ht * g.f(0.45, 0.6), hsl(hue, 22, g.f(52, 60)));
  }
  // The ground.
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(hue, 30, 36) });
  // The dark front row, scattered and drawn far to near.
  const front = Array.from({ length: g.i(4, 8) }, () => ({
    x: w * g.f(-0.05, 1.05),
    y: groundY + (h - groundY) * g.f(0.15, 0.9),
  })).sort((a, b) => a.y - b.y);
  for (const tree of front) {
    const ht = h * g.f(0.32, 0.55);
    out += pine(tree.x, tree.y, ht, ht * g.f(0.45, 0.58), hsl(hue + g.f(-10, 10), 35, g.f(18, 28)));
  }
  return out;
});

/** Stars, a full or crescent moon, and dark hills. */
export const night = defineKind("night", "Night sky", "landscape", (g, w, h) => {
  const hue = g.f(210, 285);
  const moonX = w * g.f(0.2, 0.8);
  const moonY = h * g.f(0.18, 0.35);
  const moonR = h * g.f(0.07, 0.11);
  const crescent = g.chance(0.6);
  const dir = g.pick([-1, 1]);
  const sky = g.id("sky");
  const bite = g.id("bite");
  // For a crescent, a mask that bites a slightly smaller circle out of the moon.
  const mask = crescent
    ? el(
        "mask",
        { id: bite },
        el("rect", { width: w, height: h, fill: "#fff" }),
        el("circle", { cx: moonX + dir * moonR * 0.5, cy: moonY - moonR * 0.25, r: moonR * 0.92, fill: "#000" }),
      )
    : "";
  let out = el("defs", {}, lin(sky, [hsl(hue, 50, 9), hsl(hue + 20, 45, 30)]), mask);
  out += fill(w, h, `url(#${sky})`);
  // Stars.
  const stars = g.i(14, 28);
  for (let i = 0; i < stars; i++)
    out += el("circle", {
      cx: w * g.f(0, 1),
      cy: h * g.f(0, 0.68),
      r: g.f(0.5, 1.6),
      fill: "#fff",
      opacity: g.f(0.35, 1),
    });
  // The moon.
  out += el("circle", {
    cx: moonX,
    cy: moonY,
    r: moonR,
    fill: "hsl(50 60% 92%)",
    mask: crescent ? `url(#${bite})` : undefined,
  });
  // The far hills.
  out += el("path", {
    d: s`M0 ${h * g.f(0.66, 0.76)}
         Q ${w * g.f(0.2, 0.5)} ${h * g.f(0.52, 0.66)} ${w} ${h * g.f(0.64, 0.76)}
         V ${h} H0Z`,
    fill: hsl(hue, 30, 15),
  });
  // The near hills.
  out += el("path", {
    d: s`M0 ${h * g.f(0.8, 0.9)}
         Q ${w * g.f(0.5, 0.8)} ${h * g.f(0.68, 0.8)} ${w} ${h * g.f(0.82, 0.9)}
         V ${h} H0Z`,
    fill: hsl(hue, 25, 8),
  });
  return out;
});

/** Two rows of buildings against a dusk sky; some windows are lit. */
export const city = defineKind("city", "City at dusk", "landscape", (g, w, h) => {
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
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: h * g.f(0.3, 0.5),
    r: h * g.f(0.06, 0.1),
    fill: hsl(hue + 20, 90, 88),
  });
  // The pale back row of buildings, packed side by side.
  for (let x = -5; x < w;) {
    const bw = w * g.f(0.06, 0.13);
    const bh = h * g.f(0.28, 0.58);
    out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: hsl(hue + 230, 18, 42) });
    x += bw + g.f(-2, 3);
  }
  // The dark front row, some with lit windows.
  for (let x = -5; x < w;) {
    const bw = w * g.f(0.08, 0.16);
    const bh = h * g.f(0.16, 0.45);
    out += el("rect", { x, y: h - bh, width: bw, height: bh, fill: hsl(hue + 230, 22, 18) });
    if (g.chance(0.6))
      out += el("rect", {
        x: x + 3,
        y: h - bh + 6,
        width: bw - 6,
        height: bh - 6,
        fill: `url(#${win})`,
        opacity: g.f(0.35, 0.9),
      });
    x += bw + g.f(0, 4);
  }
  return out;
});
