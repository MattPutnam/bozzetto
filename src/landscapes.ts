import { defineKind, el, facing, fill, hsl, lin, pts, qpt, s, type Point, type Rand } from "./core";
import { blob } from "./shapes";

/** Soft hills under a gradient sky and a sun, sometimes with a lone tree. */
export const hills = defineKind("hills", "Rolling hills", { tree: [true, false] }, (g, w, h, note) => {
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
  const sunX = w * g.f(0.2, 0.8);
  const sunY = h * g.f(0.22, 0.38);
  out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.07, 0.12), fill: hsl(hue + 180, 80, 88) });
  note.alt("Rolling hills under a low sun");
  note.focus(sunX, sunY);
  out += el("path", {
    d: s`M0 ${h * farMid + h * 0.08}
         Q ${w * 0.3} ${h * farPeak} ${w * 0.6} ${h * farMid}
         T ${w} ${h * farEnd}
         V ${h} H 0Z`,
    fill: hsl(hue + 15, 35, 62),
  });
  if (g.option("tree", g.chance(0.45))) {
    // A lone tree standing on the near hill.
    const [tx, ty] = qpt([0, y0], [qx, y1], [w, y2], g.f(0.2, 0.8));
    const th = h * g.f(0.1, 0.16);
    out += el("rect", { x: tx - th * 0.05, y: ty - th, width: th * 0.1, height: th + 6, fill: hsl(hue + 20, 30, 30) });
    out += el("circle", { cx: tx, cy: ty - th, r: th * g.f(0.35, 0.5), fill: hsl(hue + 40, 38, 36) });
    note.alt("Rolling hills with a lone tree under a low sun");
    note.focus(tx, ty - th * 0.7);
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
export const mountains = defineKind("mountains", "Mountain ranges", (g, w, h, note) => {
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

/** A low sun over the sea, with its reflection broken into streaks. */
export const sea = defineKind("sea", "Sunset sea", (g, w, h, note) => {
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

/** Layered sand ridges under a pale sun. */
export const dunes = defineKind("dunes", "Desert dunes", (g, w, h, note) => {
  const sand = g.f(16, 40);
  const skyHue = g.f(185, 220);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 55, 68), hsl(skyHue - 20, 60, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The pale sun.
  const sunX = w * g.f(0.15, 0.85);
  const sunY = h * g.f(0.18, 0.3);
  out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.05, 0.08), fill: "hsl(48 95% 94%)" });
  const side = sunX < w * 0.4 ? " on the left" : sunX > w * 0.6 ? " on the right" : "";
  note.alt(`Three rows of desert dunes under a hazy sun${side}`);
  note.focus(sunX, sunY);
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
export const forest = defineKind("forest", "Pine forest", (g, w, h, note) => {
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
  // The eye goes to the tallest front pine that stands fully inside the frame.
  let focus: Point = [w / 2, groundY];
  let tallest = 0;
  for (const tree of front) {
    const ht = h * g.f(0.32, 0.55);
    out += pine(tree.x, tree.y, ht, ht * g.f(0.45, 0.58), hsl(hue + g.f(-10, 10), 35, g.f(18, 28)));
    const inFrame = tree.x > w * 0.08 && tree.x < w * 0.92;
    if (inFrame && tree.y - ht * 0.5 > 0 && ht > tallest) {
      tallest = ht;
      focus = [tree.x, tree.y - ht * 0.5];
    }
  }
  const count = ["four", "five", "six", "seven", "eight"][front.length - 4];
  note.alt(`A pine forest with ${count} tall pines before a distant treeline`);
  note.focus(...focus);
  return out;
});

/** Stars, a full or crescent moon, and dark hills. */
export const night = defineKind("night", "Night sky", { moon: ["crescent", "full"] }, (g, w, h, note) => {
  const hue = g.f(210, 285);
  const moonX = w * g.f(0.2, 0.8);
  const moonY = h * g.f(0.18, 0.35);
  const moonR = h * g.f(0.07, 0.11);
  const crescent = g.option("moon", g.chance(0.6) ? "crescent" : "full") === "crescent";
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
  const stargazing = stars >= 22 ? "a sky full of stars" : "a scattering of stars";
  note.alt(`A ${crescent ? "crescent" : "full"} moon and ${stargazing} over rolling hills`);
  note.focus(moonX, moonY);
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
export const city = defineKind("city", "City at dusk", (g, w, h, note) => {
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

type Time = "dawn" | "day" | "dusk";
const TIMES: readonly Time[] = ["dawn", "day", "dusk"];
const AT: Record<Time, string> = { dawn: "at dawn", day: "on a clear day", dusk: "at dusk" };

/** A sky for a time of day: gradient stops from the top down, the sun's color, and how much to darken the land. */
function daySky(g: Rand, time: Time) {
  const hue = g.f(195, 222);
  if (time === "dawn")
    return { hue, stops: [hsl(hue + 10, 40, 70), hsl(g.f(15, 40), 85, 86)], sun: hsl(45, 100, 90), dim: -4 };
  if (time === "day") return { hue, stops: [hsl(hue, 62, 62), hsl(hue - 8, 65, 90)], sun: hsl(52, 100, 94), dim: 0 };
  return {
    hue,
    stops: [hsl(g.f(235, 265), 32, 36), hsl(g.f(320, 345), 42, 62), hsl(g.f(22, 38), 90, 74)],
    sun: hsl(g.f(28, 40), 95, 82),
    dim: -14,
  };
}

/** A gentle curve across the picture: a straight line plus a bump. `d` draws it as one quadratic. */
function curve(w: number, y0: number, y2: number, bump: number) {
  const c = (y0 + y2) / 2 + 2 * bump;
  return {
    at: (x: number) => y0 + ((y2 - y0) * x) / w + (4 * bump * x * (w - x)) / (w * w),
    d: (dy = 0) => s`M0 ${y0 + dy} Q ${w / 2} ${c + dy} ${w} ${y2 + dy}`,
  };
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A palm whose trunk base sits at (x, y), `ht` tall, its crown leaning by `lean` (-1 to 1). */
function palm(g: Rand, x: number, y: number, ht: number, lean: number, wood: string, leaf: string): string {
  const top: Point = [x + lean * ht * 0.45, y - ht];
  const bow: Point = [x + lean * ht * 0.05, y - ht * 0.5];
  const trunk = s`M${x} ${y} Q ${bow[0]} ${bow[1]} ${top[0]} ${top[1]}`;
  let out = el("path", { d: trunk, fill: "none", stroke: wood, "stroke-width": ht * 0.06, "stroke-linecap": "round" });
  // Darker rings along the trunk.
  out += el("path", {
    d: trunk,
    fill: "none",
    stroke: "#000",
    opacity: "0.18",
    "stroke-width": ht * 0.06,
    "stroke-dasharray": s`${ht * 0.015} ${ht * 0.05}`,
  });
  // Fronds fanning out from the crown, drooping more the further they point sideways.
  const fronds = g.i(6, 8);
  const len = ht * g.f(0.36, 0.44);
  let d = "";
  for (let k = 0; k < fronds; k++) {
    const angle = Math.PI * (1 + (k + g.f(0.2, 0.8)) / fronds);
    const tip: Point = [top[0] + Math.cos(angle) * len, top[1] + Math.sin(angle) * len * 0.6 + len * 0.35];
    const mid = lerp(top, tip, 0.5);
    // The normal to the frond that points upward.
    const nx = (tip[1] - top[1]) / len;
    const ny = -(tip[0] - top[0]) / len;
    const up = ny < 0 ? 1 : -1;
    d += s`M${top[0]} ${top[1]}
           Q ${mid[0] + nx * up * len * 0.28} ${mid[1] + ny * up * len * 0.28} ${tip[0]} ${tip[1]}
           Q ${mid[0] + nx * up * len * 0.06} ${mid[1] + ny * up * len * 0.06} ${top[0]} ${top[1]}Z`;
  }
  out += el("path", { d, fill: leaf });
  // Coconuts under the fronds.
  for (let k = 0; k < 2; k++)
    out += el("circle", {
      cx: top[0] + (k - 0.5) * ht * 0.05,
      cy: top[1] + ht * 0.03,
      r: ht * 0.03,
      fill: hsl(30, 45, 25),
    });
  return out;
}

/** A still mountain lake that mirrors the peaks and sky above it. */
export const lake = defineKind("lake", "Mountain lake", (g, w, h, note) => {
  const time = g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const shore = h * g.f(0.56, 0.66);
  const skyId = g.id("sky");
  // Everything above the water, drawn once here and again upside down as the reflection.
  let scene = el("rect", { width: w, height: shore, fill: `url(#${skyId})` });
  if (g.chance(0.65))
    scene += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: shore * g.f(0.25, 0.5),
      r: unit * g.f(0.05, 0.08),
      fill: sky.sun,
    });
  const snow = time === "day" ? hsl(sky.hue, 30, 97) : time === "dawn" ? hsl(20, 70, 93) : hsl(330, 35, 82);
  // The highest peak draws the eye.
  let peak: Point = [w / 2, shore];
  // The far range, tall and snowcapped.
  const amp = shore * g.f(0.5, 0.68);
  const steps = g.i(3, 5);
  const ridge: Point[] = [[0, shore - amp * g.f(0.1, 0.5)]];
  for (let step = 1; step < steps * 2; step++) {
    const x = (w * step) / (steps * 2) + g.f(-0.25, 0.25) * (w / (steps * 2));
    ridge.push([x, shore - amp * (step % 2 ? g.f(0.6, 1) : g.f(0.15, 0.4))]);
  }
  ridge.push([w, shore - amp * g.f(0.1, 0.5)]);
  scene += el("polygon", {
    points: pts([...ridge, [w, shore], [0, shore]]),
    fill: hsl(sky.hue + 10, 18, 56 + sky.dim),
  });
  // Snow on each peak, with a ragged lower edge.
  let caps = "";
  for (let k = 1; k < ridge.length - 1; k += 2) {
    const top = ridge[k];
    if (top[1] < peak[1]) peak = top;
    const t = g.f(0.26, 0.42);
    const left = lerp(top, ridge[k - 1], t);
    const right = lerp(top, ridge[k + 1], t);
    const ragged = [0.25, 0.5, 0.75].map((f, j) => lerp(lerp(right, left, f), top, j % 2 ? 0 : g.f(0.2, 0.4)));
    caps += `M${pts([top, right, ...ragged, left])}Z`;
  }
  scene += el("path", { d: caps, fill: snow });
  // The shaded side of each peak.
  let shade = "";
  for (let k = 1; k < ridge.length - 1; k += 2) shade += `M${pts([ridge[k], ridge[k + 1], [ridge[k][0], shore]])}Z`;
  scene += el("path", { d: shade, fill: "#000", opacity: "0.1" });
  // Low wooded hills along the far shore.
  const hill = curve(w, shore - shore * g.f(0.04, 0.14), shore - shore * g.f(0.04, 0.14), -shore * g.f(-0.04, 0.06));
  const green = g.f(110, 160);
  scene += el("path", { d: hill.d() + s`V${shore}H0Z`, fill: hsl(green, 25, 32 + sky.dim) });
  // A treeline of small pines on those hills.
  let trees = "";
  const gap = unit * g.f(0.025, 0.04);
  for (let x = g.f(0, gap); x < w; x += gap * g.f(0.6, 1.4)) {
    const base = hill.at(x) + unit * 0.01;
    const th = unit * g.f(0.03, 0.065);
    trees += s`M${x - th * 0.25} ${base}L${x} ${base - th}L${x + th * 0.25} ${base}Z`;
  }
  scene += el("path", { d: trees, fill: hsl(green, 30, 22 + sky.dim) });

  // The scene is drawn once in the defs and used twice: upright, and flipped below the shore as the reflection.
  const view = g.id("view");
  let out = el("defs", {}, lin(skyId, sky.stops), el("g", { id: view }, scene));
  out += fill(w, h, `url(#${skyId})`);
  out += el("use", { href: `#${view}` });
  out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * shore})` });
  // A tint of water over the reflection, and a few ripples.
  out += el("rect", {
    y: shore,
    width: w,
    height: h - shore,
    fill: hsl(sky.hue + 5, 45, 28 + sky.dim),
    opacity: "0.35",
  });
  out += el("rect", { y: shore - 0.5, width: w, height: Math.max(1, unit * 0.004), fill: "#000", opacity: "0.15" });
  const ripples = g.i(3, 6);
  for (let k = 0; k < ripples; k++) {
    const rw = w * g.f(0.08, 0.3);
    out += el("rect", {
      x: g.f(-0.1, 1) * w,
      y: shore + (h - shore) * g.f(0.1, 0.92),
      width: rw,
      height: Math.max(1, unit * 0.005),
      rx: unit * 0.003,
      fill: "#fff",
      opacity: g.f(0.15, 0.35),
    });
  }
  note.alt(`A still mountain lake ${AT[time]}, mirroring snowy peaks`);
  note.focus(...peak);
  return out;
});

/** Sea under the sky: the sky gradient, a sun, and water down to the bottom from `horizon`. */
function seaAndSky(g: Rand, w: number, h: number, horizon: number, time: Time, sky: ReturnType<typeof daySky>) {
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const water = g.id("water");
  let out = el(
    "defs",
    {},
    lin(skyId, sky.stops),
    lin(water, [hsl(sky.hue - 5, 55, 36 + sky.dim), hsl(sky.hue - 25, 55, 52 + sky.dim)]),
  );
  out += fill(w, h, `url(#${skyId})`);
  const sunX = w * g.f(0.15, 0.85);
  const sunR = unit * g.f(0.05, 0.08);
  const sunY = time === "day" ? horizon * g.f(0.2, 0.4) : horizon - sunR * g.f(0.2, 1.6);
  out += el("circle", { cx: sunX, cy: sunY, r: sunR, fill: sky.sun });
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  // A low sun lays a streak of light on the water.
  if (time !== "day")
    for (let k = 0; k < 4; k++)
      out += el("rect", {
        x: sunX - sunR * (1 - k * 0.15) + g.f(-2, 2),
        y: horizon + unit * (0.012 + k * 0.025),
        width: sunR * 2 * (1 - k * 0.15),
        height: Math.max(1, unit * 0.007),
        rx: unit * 0.003,
        fill: sky.sun,
        opacity: 0.7 - k * 0.12,
      });
  return out;
}

/** A sandy beach with a striped umbrella, a leaning palm, or shells at the water's edge. */
export const beach = defineKind("beach", "Beach", { item: ["umbrella", "palm", "shells"] }, (g, w, h, note) => {
  const time = g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const horizon = h * g.f(0.4, 0.5);
  let out = seaAndSky(g, w, h, horizon, time, sky);
  // The waterline, the band of wet sand behind it, and the dry sand.
  const line = curve(w, h * g.f(0.6, 0.72), h * g.f(0.6, 0.72), h * g.f(-0.05, 0.05));
  const wet = unit * g.f(0.03, 0.05);
  const sandHue = g.f(32, 45);
  out += el("path", { d: line.d() + s`V${h}H0Z`, fill: hsl(sandHue, 38, 64 + sky.dim / 2) });
  out += el("path", {
    d: line.d(-unit * 0.035),
    fill: "none",
    stroke: "#fff",
    "stroke-width": unit * 0.006,
    opacity: "0.45",
  });
  out += el("path", { d: line.d(), fill: "none", stroke: "#fff", "stroke-width": unit * 0.012, opacity: "0.85" });
  out += el("path", { d: line.d(wet) + s`V${h}H0Z`, fill: hsl(sandHue, 62, 80 + sky.dim / 2) });
  // Where something on the dry sand can sit, from just past the wet band to near the bottom.
  const sandAt = (x: number, f: number) => {
    const top = line.at(x) + wet + unit * 0.04;
    return top + (h - unit * 0.05 - top) * f;
  };
  const item = g.option("item", g.pick(["umbrella", "palm", "shells"] as const));
  const shadow = time === "dawn" ? 1 : time === "dusk" ? -1 : g.pick([-1, 1]);
  if (item === "umbrella") {
    const bx = w * g.f(0.3, 0.7);
    const by = sandAt(bx, g.f(0.45, 0.7));
    const ht = unit * g.f(0.34, 0.44);
    const r = ht * g.f(0.55, 0.65);
    const rh = r * 0.48;
    const chord = by - ht + rh;
    const tilt = g.f(-12, 12);
    // The umbrella's shadow on the sand.
    out += el("ellipse", { cx: bx + shadow * r * 0.4, cy: by, rx: r, ry: r * 0.2, fill: "#000", opacity: "0.12" });
    // A towel beside it, lying flat.
    const side = g.pick([-1, 1]);
    const tl = r * 1.1;
    const td = r * 0.3;
    const skew = side * td * 0.5;
    const tx = Math.max(unit * 0.03, Math.min(w - tl - unit * 0.06, bx + side * r * g.f(0.7, 1) - tl / 2));
    const ty = by - td * 0.3;
    const corner = (u: number, v: number): Point => [tx + tl * u + skew * v, ty + td * v];
    const towel = g.f(0, 360);
    out += el("polygon", {
      points: pts([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]),
      fill: hsl(towel, 60, 58),
    });
    for (const u of [0.2, 0.7])
      out += el("polygon", {
        points: pts([corner(u, 0), corner(u + 0.1, 0), corner(u + 0.1, 1), corner(u, 1)]),
        fill: "#fff",
        opacity: "0.85",
      });
    // The pole and canopy, tilted together about the foot of the pole.
    const canopy = hsl(g.f(0, 360), 70, 55);
    const stripe = g.chance(0.6) ? "#fff" : hsl(g.f(0, 360), 75, 62);
    const bottom = (x: number): Point => [bx + x, chord + rh * 0.25 * (1 - (x / r) ** 2)];
    const apex: Point = [bx, by - ht];
    let stripes = "";
    const parts = g.pick([6, 8]);
    for (let k = 1; k < parts; k += 2)
      stripes += `M${pts([apex, bottom(-r + (2 * r * k) / parts), bottom(-r + (2 * r * (k + 1)) / parts)])}Z`;
    out += s`<g transform="rotate(${tilt} ${bx} ${by})">`;
    out += el("rect", { x: bx - unit * 0.006, y: by - ht, width: unit * 0.012, height: ht, fill: "#ece6da" });
    out += el("path", {
      d: s`M${bx - r} ${chord} A ${r} ${rh} 0 0 1 ${bx + r} ${chord} Q ${bx} ${chord + rh * 0.5} ${bx - r} ${chord}Z`,
      fill: canopy,
    });
    out += el("path", { d: stripes, fill: stripe });
    out += el("circle", { cx: bx, cy: by - ht, r: unit * 0.01, fill: "#ece6da" });
    out += "</g>";
    note.alt(`A striped beach umbrella and a towel on the sand ${AT[time]}`);
    note.focus(bx, by - ht * 0.6);
  } else if (item === "palm") {
    const left = g.chance(0.5);
    const x = w * (left ? g.f(0.1, 0.28) : g.f(0.72, 0.9));
    const y = sandAt(x, g.f(0.4, 0.7));
    const ht = Math.min(unit * g.f(0.5, 0.66), (y - unit * 0.14) / 1.05);
    const lean = (left ? 1 : -1) * g.f(0.15, 0.45);
    out += el("ellipse", {
      cx: x + lean * ht * 0.3,
      cy: y,
      rx: ht * 0.35,
      ry: ht * 0.06,
      fill: "#000",
      opacity: "0.1",
    });
    out += palm(g, x, y, ht, lean, hsl(g.f(25, 35), 35, 42 + sky.dim), hsl(g.f(95, 135), 50, 34 + sky.dim));
    // A coconut that has fallen onto the sand.
    out += el("circle", { cx: x - lean * ht * 0.2, cy: y - unit * 0.012, r: unit * 0.018, fill: hsl(30, 45, 28) });
    note.alt(`A palm tree leaning over a sandy beach ${AT[time]}`);
    note.focus(x + lean * ht * 0.45, y - ht);
  } else {
    // Shells and a starfish or two, larger nearer the viewer.
    const things = Array.from({ length: g.i(4, 7) }, (_, k) => {
      const x = w * ((k + g.f(0.15, 0.85)) / 7) * (7 / g.i(4, 7));
      return { x: Math.min(w * 0.92, Math.max(w * 0.08, x)), f: g.f(0, 1), star: k < 2 && g.chance(0.7) };
    });
    let stars = 0;
    let focus: Point = [w / 2, h * 0.8];
    for (const { x, f, star } of things.sort((a, b) => a.f - b.f)) {
      const y = sandAt(x, f);
      const r = unit * (0.045 + 0.04 * f);
      out += el("ellipse", { cx: x + r * 0.15, cy: y + r * 0.1, rx: r, ry: r * 0.35, fill: "#000", opacity: "0.1" });
      if (star) {
        stars++;
        focus = [x, y];
        const turn = g.f(0, Math.PI);
        const ring = Array.from({ length: 10 }, (_, j): Point => {
          const a = turn + (j * Math.PI) / 5;
          const rr = j % 2 ? r * 0.42 : r * 1.1;
          return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6];
        });
        out += el("polygon", { points: pts(ring), fill: hsl(g.f(5, 30), 75, 58), "stroke-linejoin": "round" });
      } else {
        // A scallop: a fan with ridges and a small hinge.
        const a0 = -Math.PI * 0.85;
        const a1 = -Math.PI * 0.15;
        const fan = (a: number): Point => [x + Math.cos(a) * r, y - r * 0.1 + Math.sin(a) * r * 0.8];
        const [sx, sy] = fan(a0);
        const [ex, ey] = fan(a1);
        out += el("path", {
          d: s`M${x} ${y} L${sx} ${sy} A ${r} ${r * 0.8} 0 0 1 ${ex} ${ey}Z`,
          fill: hsl(g.f(0, 40), 60, 86),
        });
        let ridges = "";
        for (let j = 1; j < 5; j++) {
          const [rx, ry] = fan(a0 + ((a1 - a0) * j) / 5);
          ridges += s`M${x} ${y}L${rx} ${ry}`;
        }
        out += el("path", { d: ridges, stroke: "#000", opacity: "0.15", "stroke-width": unit * 0.004 });
        out += el("rect", {
          x: x - r * 0.18,
          y: y - r * 0.08,
          width: r * 0.36,
          height: r * 0.16,
          rx: r * 0.05,
          fill: hsl(20, 40, 75),
        });
      }
    }
    note.alt(`Seashells${stars ? (stars > 1 ? " and starfish" : " and a starfish") : ""} on a sandy beach ${AT[time]}`);
    note.focus(...focus);
  }
  return out;
});

/** A small tropical island with palms, alone in open sea. */
export const island = defineKind("island", "Tropical island", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const horizon = h * g.f(0.48, 0.58);
  let out = seaAndSky(g, w, h, horizon, time, sky);
  // A few clouds by day.
  if (time === "day")
    for (let k = g.i(1, 3); k > 0; k--) {
      const cx = w * g.f(0.05, 0.95);
      const cy = horizon * g.f(0.2, 0.7);
      const cr = unit * g.f(0.04, 0.06);
      out += el("path", {
        d: s`M${cx - cr * 2} ${cy} a ${cr} ${cr} 0 0 1 ${cr * 1.2} ${-cr * 0.8} a ${cr * 1.3} ${cr * 1.3} 0 0 1 ${cr * 2.2} ${-cr * 0.2}
             a ${cr} ${cr} 0 0 1 ${cr * 0.8} ${cr}Z`,
        fill: "#fff",
        opacity: "0.85",
      });
    }
  // The island: a sandy mound in a ring of shallow water.
  const ix = w * g.f(0.38, 0.62);
  const iy = horizon + (h - horizon) * g.f(0.4, 0.55);
  const iw = Math.min(w * 0.6, unit * g.f(0.75, 1));
  const ih = iw * g.f(0.13, 0.18);
  const sandTop = (x: number) => iy - ih * (1 - ((2 * (x - ix)) / iw) ** 2);
  out += el("ellipse", {
    cx: ix,
    cy: iy,
    rx: iw * 0.66,
    ry: ih * 0.55,
    fill: hsl(175, 60, 62 + sky.dim),
    opacity: "0.55",
  });
  out += el("ellipse", {
    cx: ix,
    cy: iy,
    rx: iw * 0.54,
    ry: ih * 0.28,
    fill: "none",
    stroke: "#fff",
    "stroke-width": unit * 0.008,
    opacity: "0.7",
  });
  out += el("path", {
    d: s`M${ix - iw / 2} ${iy} Q ${ix} ${iy - ih * 2} ${ix + iw / 2} ${iy} Q ${ix} ${iy + ih * 0.35} ${ix - iw / 2} ${iy}Z`,
    fill: hsl(g.f(35, 45), 60, 78 + sky.dim / 2),
  });
  const green = g.f(95, 140);
  // One to three palms, leaning outward.
  const palms = g.i(1, 3);
  const spots = [0, -0.22, 0.2].slice(0, palms).map(u => u + g.f(-0.06, 0.06));
  let top = iy;
  for (const u of spots.sort((a, b) => Math.abs(b) - Math.abs(a))) {
    const x = ix + iw * u;
    const y = sandTop(x) + ih * 0.15;
    const ht = Math.min(iw * g.f(0.32, 0.46), (y - unit * 0.1) / 1.1);
    const lean = (u === spots[0] && palms === 1 ? g.pick([-1, 1]) : Math.sign(u) || 1) * g.f(0.15, 0.45);
    out += palm(g, x, y, ht, lean, hsl(g.f(25, 35), 35, 40 + sky.dim), hsl(green + g.f(-10, 10), 50, 30 + sky.dim));
    top = Math.min(top, y - ht);
  }
  const count = ["", "a palm tree", "two palm trees", "three palm trees"][palms];
  note.alt(`A small tropical island with ${count} in open sea ${AT[time]}`);
  note.focus(ix, (top + iy) / 2);
  return out;
});

/** The height of a left-to-right polyline at x. */
function along(line: readonly Point[], x: number): number {
  for (let k = 1; k < line.length; k++)
    if (x <= line[k][0]) return lerp(line[k - 1], line[k], (x - line[k - 1][0]) / (line[k][0] - line[k - 1][0]))[1];
  return line[line.length - 1][1];
}

/** A striped lighthouse on a grassy cliff above the sea, by day, at dusk or with its beam lit at night. */
export const lighthouse = defineKind("lighthouse", "Lighthouse", (g, w, h, note) => {
  const time = g.pick(["day", "dusk", "night"] as const);
  const unit = Math.min(w, h);
  const horizon = h * g.f(0.5, 0.62);
  let out: string;
  let dim: number;
  if (time === "night") {
    const hue = g.f(215, 245);
    const skyId = g.id("sky");
    const water = g.id("water");
    dim = -26;
    out = el(
      "defs",
      {},
      lin(skyId, [hsl(hue, 50, 10), hsl(hue + 10, 40, 30)]),
      lin(water, [hsl(hue, 40, 22), hsl(hue, 45, 12)]),
    );
    out += fill(w, h, `url(#${skyId})`);
    for (let k = g.i(14, 24); k > 0; k--)
      out += el("circle", {
        cx: w * g.f(0, 1),
        cy: horizon * g.f(0, 0.9),
        r: g.f(0.5, 1.4),
        fill: "#fff",
        opacity: g.f(0.4, 1),
      });
    out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  } else {
    const sky = daySky(g, time);
    dim = sky.dim;
    out = seaAndSky(g, w, h, horizon, time, sky);
  }
  // A few wave crests on the open water.
  let waves = "";
  for (let k = g.i(4, 7); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = horizon + (h - horizon) * g.f(0.15, 0.9);
    const ww = unit * g.f(0.03, 0.06);
    waves += s`M${x} ${y}q${ww / 2} ${-ww * 0.3} ${ww} 0`;
  }
  out += el("path", { d: waves, fill: "none", stroke: "#fff", "stroke-width": unit * 0.005, opacity: "0.45" });

  // The point, drawn with the cliff on the left and mirrored half the time.
  const side = g.pick([-1, 1]);
  const edge = Math.min(w * g.f(0.42, 0.55), unit * g.f(1, 1.3));
  const ct = h * g.f(0.5, 0.62);
  const drop = h - ct;
  const top: Point[] = [
    [0, ct - unit * g.f(0, 0.05)],
    [edge * 0.5, ct + unit * g.f(-0.015, 0.015)],
    [edge - unit * 0.04, ct + unit * 0.005],
    [edge, ct + unit * 0.035],
  ];
  const face: Point[] = [
    [edge + unit * 0.02, ct + drop * 0.25],
    [edge - unit * 0.015, ct + drop * 0.5],
    [edge + unit * 0.05, ct + drop * 0.75],
    [edge + unit * 0.09, h],
  ];
  let land = facing(w / 2, side);
  // Rocks in the surf off the point, each with foam at its foot.
  for (let k = g.i(1, 3); k > 0; k--) {
    const rx = edge + unit * g.f(0.13, 0.35);
    const ry = h - (h - horizon) * g.f(0.08, 0.35);
    const rw = unit * g.f(0.04, 0.08);
    land += el("polygon", {
      points: pts([
        [rx - rw, ry],
        [rx - rw * 0.5, ry - rw * g.f(0.5, 0.8)],
        [rx + rw * 0.2, ry - rw * g.f(0.6, 0.9)],
        [rx + rw, ry],
      ]),
      fill: hsl(25, 10, 30 + dim),
    });
    land += el("ellipse", { cx: rx, cy: ry, rx: rw * 1.3, ry: rw * 0.18, fill: "#fff", opacity: "0.7" });
  }
  land += el("polygon", { points: pts([...top, ...face, [0, h]]), fill: hsl(g.f(20, 40), 14, 46 + dim) });
  // The shaded cliff face, and surf at its foot.
  land += el("polygon", {
    points: pts([
      top[3],
      ...face,
      [edge - unit * 0.06, h],
      [edge - unit * 0.07, ct + drop * 0.5],
      [edge - unit * 0.035, ct + unit * 0.05],
    ]),
    fill: "#000",
    opacity: "0.18",
  });
  land += el("ellipse", {
    cx: edge + unit * 0.08,
    cy: h,
    rx: unit * 0.1,
    ry: unit * 0.012,
    fill: "#fff",
    opacity: "0.6",
  });
  // Grass over the top, a little thicker inland.
  const grass = top.map(([x, y]): Point => [x, y + unit * (x < edge - 1 ? 0.04 : 0.02)]).reverse();
  land += el("polygon", { points: pts([...top, ...grass]), fill: hsl(g.f(85, 125), 40, 40 + dim) });

  // The tower, its gallery, lantern and roof.
  const lx = edge * g.f(0.55, 0.72);
  const by = along(top, lx) + unit * 0.012;
  const th = Math.min(unit * g.f(0.36, 0.46), (by - unit * 0.14) / 1.33);
  const bw = th * 0.24;
  const tw = th * 0.16;
  // A keeper's cottage beside it, inland.
  const hw = th * 0.38;
  const hx = lx - bw / 2 - hw * 0.45;
  const cottage = g.chance(0.55) && hx - hw / 2 > unit * 0.02;
  if (cottage) {
    const hy = along(top, hx) + unit * 0.012;
    const hh = hw * 0.5;
    land += el("rect", { x: hx - hw / 2, y: hy - hh, width: hw, height: hh, fill: "#f2eee4" });
    land += el("polygon", {
      points: pts([
        [hx - hw * 0.58, hy - hh],
        [hx - hw * 0.35, hy - hh - hw * 0.3],
        [hx + hw * 0.4, hy - hh - hw * 0.3],
        [hx + hw * 0.58, hy - hh],
      ]),
      fill: hsl(g.f(0, 20), 45, 35 + dim / 2),
    });
    land += el("rect", {
      x: hx - hw * 0.3,
      y: hy - hh * 0.7,
      width: hw * 0.16,
      height: hh * 0.3,
      fill: time === "day" ? hsl(210, 25, 40) : hsl(45, 95, 70),
    });
  }
  const at = (f: number) => (bw + (tw - bw) * f) / 2;
  const plain = "#f4f1ea";
  const paint = g.pick([hsl(g.f(-8, 8), 70, 48), hsl(g.f(205, 225), 50, 32), hsl(0, 0, 18)]);
  land += el("polygon", {
    points: pts([
      [lx - bw / 2, by],
      [lx - tw / 2, by - th],
      [lx + tw / 2, by - th],
      [lx + bw / 2, by],
    ]),
    fill: plain,
  });
  const bands = g.i(3, 5);
  const striped = g.chance(0.8);
  if (striped)
    for (let k = bands % 2 ? 1 : 0; k < bands; k += 2) {
      const f0 = k / bands;
      const f1 = (k + 1) / bands;
      land += el("polygon", {
        points: pts([
          [lx - at(f0), by - th * f0],
          [lx - at(f1), by - th * f1],
          [lx + at(f1), by - th * f1],
          [lx + at(f0), by - th * f0],
        ]),
        fill: paint,
      });
    }
  // The tower's shaded half.
  land += el("polygon", {
    points: pts([
      [lx + bw * 0.1, by],
      [lx + tw * 0.1, by - th],
      [lx + tw / 2, by - th],
      [lx + bw / 2, by],
    ]),
    fill: "#000",
    opacity: "0.12",
  });
  const dark = hsl(0, 0, 18);
  const gy = by - th;
  const lw = tw * 0.82;
  const lh = th * 0.13;
  const lit = time !== "day";
  const glass = lit ? hsl(50, 100, 78) : hsl(200, 30, 72);
  const lcy = gy - th * 0.04 - lh / 2;
  if (time === "night") {
    // The beam, sweeping out to sea, and a glow around the lantern.
    const reach = w + unit;
    land += el("polygon", {
      points: pts([
        [lx, lcy - lh * 0.25],
        [reach, lcy - unit * g.f(0.15, 0.3)],
        [reach, lcy + unit * g.f(0.08, 0.18)],
        [lx, lcy + lh * 0.25],
      ]),
      fill: hsl(50, 100, 80),
      opacity: "0.3",
    });
    land += el("circle", { cx: lx, cy: lcy, r: lh * 1.5, fill: hsl(50, 100, 80), opacity: "0.3" });
  }
  land += el("rect", { x: lx - lw / 2, y: lcy - lh / 2, width: lw, height: lh, fill: glass });
  land += el("rect", { x: lx - lw * 0.12, y: lcy - lh / 2, width: lw * 0.06, height: lh, fill: dark });
  land += el("rect", { x: lx + lw * 0.22, y: lcy - lh / 2, width: lw * 0.06, height: lh, fill: dark });
  land += el("rect", { x: lx - tw * 0.72, y: gy - th * 0.045, width: tw * 1.44, height: th * 0.05, fill: dark });
  const roof = lcy - lh / 2;
  land += el("path", {
    d: s`M${lx - lw * 0.68} ${roof} Q ${lx} ${roof - lw * 0.95} ${lx + lw * 0.68} ${roof}Z`,
    fill: striped && g.chance(0.5) ? paint : dark,
  });
  land += el("rect", { x: lx - unit * 0.003, y: roof - lw * 0.62, width: unit * 0.006, height: lw * 0.2, fill: dark });
  land += "</g>";
  out += land;

  const fx = side === 1 ? lx : w - lx;
  note.alt(
    time === "night"
      ? "A lighthouse on a rocky cliff at night, its beam sweeping out to sea"
      : `A ${striped ? "striped " : ""}lighthouse on a rocky cliff above the sea ${time === "dusk" ? "at dusk" : "on a clear day"}${cottage ? ", with a keeper's cottage" : ""}`,
  );
  note.focus(fx, by - th * 0.75);
  return out;
});

/** A volcano trailing smoke by day, or glowing with lava at dusk or night. */
export const volcano = defineKind("volcano", "Volcano", (g, w, h, note) => {
  const time = g.pick(["day", "dusk", "night"] as const);
  const glowing = time !== "day";
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const stops =
    time === "day"
      ? [hsl(g.f(195, 215), 50, 64), hsl(g.f(185, 205), 45, 88)]
      : time === "dusk"
        ? [hsl(g.f(250, 275), 30, 30), hsl(g.f(5, 20), 70, 52), hsl(g.f(30, 42), 90, 70)]
        : [hsl(g.f(240, 275), 40, 9), hsl(g.f(255, 285), 35, 18), hsl(g.f(0, 15), 55, 30)];
  const glow = g.id("glow");
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    el(
      "radialGradient",
      { id: glow },
      el("stop", { offset: 0, "stop-color": hsl(30, 100, 62), "stop-opacity": 0.6 }),
      el("stop", { offset: 1, "stop-color": hsl(20, 100, 55), "stop-opacity": 0 }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  const dim = time === "day" ? 0 : time === "dusk" ? -14 : -24;
  if (time === "night")
    for (let k = g.i(10, 18); k > 0; k--)
      out += el("circle", {
        cx: w * g.f(0, 1),
        cy: h * g.f(0, 0.45),
        r: g.f(0.5, 1.3),
        fill: "#fff",
        opacity: g.f(0.3, 0.9),
      });

  const ground = h * g.f(0.8, 0.88);
  const cx = w * g.f(0.35, 0.65);
  const top = h * g.f(0.24, 0.34);
  const cw = unit * g.f(0.06, 0.09);
  const foot = Math.min(w * 0.62, unit * g.f(0.75, 0.95));
  const rock = hsl(g.f(10, 35), g.f(10, 22), (time === "day" ? g.f(32, 42) : 30) + dim);
  // Lower hills on either side.
  out += el("path", {
    d: s`M0 ${ground - h * g.f(0.1, 0.2)} Q ${w * 0.3} ${ground - h * g.f(0.15, 0.3)} ${w * 0.55} ${ground}
         Q ${w * 0.75} ${ground - h * g.f(0.15, 0.25)} ${w} ${ground - h * g.f(0.05, 0.15)} V${h}H0Z`,
    fill: hsl(g.f(90, 140), 18, 50 + dim * 1.3),
    opacity: "0.8",
  });
  // The cone: concave slopes from the crater rim down to the plain, with the crater's dip on top.
  const rim = (dir: number): [Point, Point, Point] => [
    [cx + dir * cw, top],
    [cx + dir * (cw + (foot - cw) * 0.28), top + (ground - top) * 0.8],
    [cx + dir * foot, ground],
  ];
  const left = rim(-1);
  const right = rim(1);
  const slope = (t: number, dir: number) => qpt(...(dir < 0 ? left : right), t);
  // A point inside the cone: t from the rim (0) to the foot (1), u from the left slope (-1) to the right (1).
  const on = (t: number, u: number) => lerp(slope(t, -1), slope(t, 1), (u + 1) / 2);
  const dip = s`Q ${cx} ${top + cw * 0.4} ${left[0][0]} ${top}`;
  out += el("path", {
    d:
      s`M${left[0][0]} ${top} Q ${left[1][0]} ${left[1][1]} ${left[2][0]} ${ground} L${right[2][0]} ${ground}
         Q ${right[1][0]} ${right[1][1]} ${right[0][0]} ${top}` +
      dip +
      "Z",
    fill: rock,
  });
  const snowy = time === "day" && g.chance(0.5);
  if (snowy) {
    // A snowcap with a ragged lower edge.
    const ts = g.f(0.18, 0.28);
    const edge = [-0.6, -0.2, 0.2, 0.6].map((u, j) => on(ts * (j % 2 ? 0.65 : 1.15), u));
    const sides = [0.06, 0.12, ts].map(t => slope(t, -1));
    const back = [ts, 0.12, 0.06].map(t => slope(t, 1));
    out += el("path", {
      d: `M${pts([left[0], ...sides, ...edge, ...back, right[0]])}` + dip + "Z",
      fill: hsl(210, 30, 96),
    });
  }
  // The shaded side.
  out += el("path", {
    d: s`M${cx + cw * 0.15} ${top + cw * 0.3} L${right[0][0]} ${top} Q ${right[1][0]} ${right[1][1]} ${right[2][0]} ${ground}
         L${cx + foot * 0.15} ${ground}Z`,
    fill: "#000",
    opacity: "0.14",
  });
  if (glowing) {
    // Lava running down from the crater, with a soft glow around each flow.
    const flows = g.i(2, 4);
    let lava = "";
    for (let k = 0; k < flows; k++) {
      const u0 = -0.7 + (1.4 * (k + g.f(0.2, 0.8))) / flows;
      const end = g.f(0.4, 0.85);
      const drift = g.f(-0.2, 0.2);
      const phase = g.f(0, 6);
      const path = Array.from({ length: 7 }, (_, j) => {
        const t = (end * j) / 6;
        return on(t, Math.max(-0.92, Math.min(0.92, u0 + drift * t + 0.06 * Math.sin(phase + j * 1.7))));
      });
      lava += `M${pts(path).replace(/ /g, "L")}`;
    }
    const line = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    out += el("path", { d: lava, ...line, stroke: hsl(15, 100, 50), "stroke-width": unit * 0.035, opacity: "0.35" });
    out += el("path", { d: lava, ...line, stroke: hsl(32, 100, 60), "stroke-width": unit * 0.013 });
    // The glowing crater.
    out += el("circle", { cx, cy: top, r: cw * 3.2, fill: `url(#${glow})` });
    out += el("ellipse", { cx, cy: top + cw * 0.12, rx: cw * 0.95, ry: cw * 0.22, fill: hsl(40, 100, 70) });
  }
  // The plume, rising and drifting with the wind.
  const wind = g.f(-1, 1);
  const puffs = g.i(6, 9);
  const rise = top + unit * 0.15;
  for (let k = 0; k < puffs; k++) {
    const t = (k + 0.5) / puffs;
    const px = cx + wind * unit * 0.55 * t ** 1.4 + g.f(-0.02, 0.02) * unit;
    const py = top - unit * 0.01 - rise * t;
    const shade = glowing ? (k < 2 ? hsl(18, 55, 38) : hsl(15, 12, g.f(20, 30) + dim / 3)) : hsl(220, 8, g.f(74, 90));
    out += el("circle", { cx: px, cy: py, r: unit * (0.035 + 0.1 * t) * g.f(0.85, 1.15), fill: shade, opacity: "0.9" });
  }
  // The plain in front.
  out += el("path", {
    d: s`M0 ${ground + h * g.f(-0.01, 0.03)} Q ${w / 2} ${ground - h * g.f(0, 0.03)} ${w} ${ground + h * g.f(-0.01, 0.03)} V${h}H0Z`,
    fill: hsl(g.f(30, 100), 18, 30 + dim),
  });
  note.alt(
    glowing
      ? `A volcano glowing ${time === "dusk" ? "at dusk" : "at night"}, lava running down its slopes`
      : `A ${snowy ? "snow-capped " : ""}volcano trailing a plume of smoke`,
  );
  note.focus(cx, top);
  return out;
});

/** Snow on a pine from `PINE`, at 100 times its size: a cap on top and a ridge along the lower edge of each tier. */
const PINE_SNOW =
  "M0-100 20-75 10-72 0-76-10-72-20-75Z" +
  [
    [30, -62],
    [42, -30],
    [50, 0],
  ]
    .map(([x, y]) =>
      pts([
        [-x, y],
        [x, y],
        [x * 0.8, y - 7],
        [x * 0.4, y - 4],
        [0, y - 8],
        [-x * 0.4, y - 4],
        [-x * 0.8, y - 7],
      ]),
    )
    .map(ring => `M${ring}Z`)
    .join("");

/** A snowy pine whose base sits at (x, y), reusing one drawn in `<defs>`; `paint` colors the needles. */
const snowyPine = (id: string, x: number, y: number, ht: number, wd: number, paint: string) =>
  el("use", { href: `#${id}`, transform: s`translate(${x} ${y}) scale(${wd / 100} ${ht / 100})`, fill: paint });

/** A log cabin with a snowy roof, its base centered at (x, y), `cw` wide. */
function cabin(g: Rand, x: number, y: number, cw: number, snow: string, lit: boolean): string {
  const ch = cw * 0.58;
  const eave = y - ch;
  const wall = g.pick([hsl(g.f(0, 10), 55, 40), hsl(g.f(20, 30), 40, 33), hsl(g.f(200, 220), 25, 38)]);
  // The chimney, behind the roof, and its smoke.
  const chx = x + cw * g.f(0.15, 0.3) * g.pick([-1, 1]);
  let out = "";
  if (lit)
    for (let k = 0; k < 3; k++)
      out += el("circle", {
        cx: chx + cw * (0.06 + 0.08 * k),
        cy: eave - cw * (0.62 + 0.16 * k),
        r: cw * (0.05 + 0.03 * k),
        fill: hsl(220, 10, 85),
        opacity: 0.6 - k * 0.15,
      });
  out += el("rect", {
    x: chx - cw * 0.05,
    y: eave - cw * 0.52,
    width: cw * 0.1,
    height: cw * 0.4,
    fill: hsl(10, 25, 30),
  });
  out += el("rect", {
    x: chx - cw * 0.065,
    y: eave - cw * 0.55,
    width: cw * 0.13,
    height: cw * 0.05,
    rx: cw * 0.02,
    fill: snow,
  });
  out += el("rect", { x: x - cw / 2, y: eave, width: cw, height: ch, fill: wall });
  // Log lines across the wall.
  let logs = "";
  for (let k = 1; k < 4; k++) logs += s`M${x - cw / 2} ${eave + (ch * k) / 4}h${cw}`;
  out += el("path", { d: logs, stroke: "#000", opacity: "0.12", "stroke-width": cw * 0.015 });
  // The gable, then snow along both slopes of the roof.
  out += el("polygon", {
    points: pts([
      [x - cw * 0.62, eave],
      [x, eave - cw * 0.42],
      [x + cw * 0.62, eave],
    ]),
    fill: hsl(20, 30, 24),
  });
  out += el("polygon", {
    points: pts([
      [x - cw * 0.68, eave + cw * 0.01],
      [x, eave - cw * 0.48],
      [x + cw * 0.68, eave + cw * 0.01],
      [x + cw * 0.6, eave + cw * 0.04],
      [x, eave - cw * 0.36],
      [x - cw * 0.6, eave + cw * 0.04],
    ]),
    fill: snow,
  });
  // A door and a window.
  const window = lit ? hsl(45, 95, 70) : hsl(210, 25, 30);
  const side = g.pick([-1, 1]);
  out += el("rect", {
    x: x + side * cw * 0.22 - cw * 0.09,
    y: y - ch * 0.62,
    width: cw * 0.18,
    height: ch * 0.62,
    fill: hsl(25, 35, 20),
  });
  out += el("rect", {
    x: x - side * cw * 0.2 - cw * 0.1,
    y: eave + ch * 0.25,
    width: cw * 0.2,
    height: ch * 0.3,
    fill: window,
  });
  // Snow drifted against the walls.
  out += el("ellipse", { cx: x, cy: y, rx: cw * 0.68, ry: cw * 0.07, fill: snow });
  return out;
}

/** Snowy hills with a cabin or two among snow-laden pines. */
export const winter = defineKind("winter", "Winter hills", (g, w, h, note) => {
  const time = g.pick(["day", "overcast", "evening"] as const);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const hue = time === "evening" ? g.f(250, 280) : g.f(200, 222);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 68), hsl(hue - 5, 50, 92)]
      : time === "overcast"
        ? [hsl(hue, 12, 70), hsl(hue, 15, 88)]
        : [hsl(hue, 30, 42), hsl(g.f(320, 345), 40, 72), hsl(g.f(25, 40), 70, 84)];
  const tree = g.id("pine");
  const snow = (light: number) => hsl(hue, time === "evening" ? 30 : 35, light);
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    // A snowy pine, 100 units tall, to reuse.
    el(
      "g",
      { id: tree },
      el("path", { d: `M${pts(PINE.map(([x, y]): Point => [x * 100, y * 100]))}Z` }),
      el("path", { d: PINE_SNOW, fill: snow(96) }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  if (time !== "overcast")
    out += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: h * (time === "day" ? g.f(0.12, 0.25) : g.f(0.3, 0.4)),
      r: unit * g.f(0.05, 0.07),
      fill: time === "day" ? hsl(50, 100, 96) : hsl(35, 95, 86),
    });
  const green = g.f(140, 170);
  const lit = time !== "day";
  // Far, middle and near slopes.
  const far = curve(w, h * g.f(0.45, 0.55), h * g.f(0.45, 0.55), -h * g.f(0.02, 0.1));
  const mid = curve(w, h * g.f(0.6, 0.7), h * g.f(0.6, 0.7), -h * g.f(0.02, 0.08));
  const near = curve(w, h * g.f(0.74, 0.8), h * g.f(0.74, 0.8), -h * g.f(0, 0.05));
  out += el("path", { d: far.d() + s`V${h}H0Z`, fill: snow(84) });
  // A row of small, pale pines along the far ridge.
  for (let x = g.f(0, 0.1) * w; x < w; x += unit * g.f(0.06, 0.16)) {
    const ht = unit * g.f(0.06, 0.1);
    out += snowyPine(tree, x, far.at(x) + ht * 0.15, ht, ht * 0.55, hsl(green, 15, 55));
  }
  out += el("path", { d: mid.d() + s`V${h}H0Z`, fill: snow(90) });
  // The main cabin on the near slope, a smaller one sometimes on the middle slope.
  const cx = w * g.f(0.28, 0.72);
  const cw = unit * g.f(0.24, 0.3);
  const second = g.chance(0.5);
  const sx = cx < w / 2 ? w * g.f(0.68, 0.85) : w * g.f(0.15, 0.32);
  const sw = cw * 0.5;
  // Pines on the middle slope, kept clear of the small cabin.
  const midPines = g.i(2, 5);
  for (let k = 0; k < midPines; k++) {
    const x = w * ((k + g.f(0.1, 0.9)) / midPines);
    if (second && Math.abs(x - sx) < sw) continue;
    const ht = unit * g.f(0.12, 0.18);
    out += snowyPine(tree, x, mid.at(x) + ht * 0.05, ht, ht * 0.55, hsl(green, 30, 30));
  }
  if (second) out += cabin(g, sx, mid.at(sx) + sw * 0.05, sw, snow(96), lit);
  out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(97) });
  // Big pines beside the main cabin.
  for (const dir of [-1, 1]) {
    if (g.chance(0.3)) continue;
    const x = cx + dir * cw * g.f(0.85, 1.3);
    const ht = unit * g.f(0.26, 0.36);
    out += snowyPine(tree, x, near.at(x) + ht * 0.04, ht, ht * 0.55, hsl(green, 35, 24));
  }
  const cy = near.at(cx) + cw * 0.05;
  out += cabin(g, cx, cy, cw, snow(98), lit);
  // Falling snow.
  const flakes = time === "overcast" ? g.i(20, 32) : g.chance(0.4) ? g.i(12, 24) : 0;
  let dots = "";
  for (let k = 0; k < flakes; k++) {
    const r = unit * g.f(0.004, 0.009);
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    dots += s`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  if (dots) out += el("path", { d: dots, fill: "#fff", opacity: "0.85" });
  const cabins = second ? "Two cabins" : "A cabin";
  const when = time === "day" ? "on a clear day" : time === "overcast" ? "on an overcast day" : "at dusk, windows lit";
  note.alt(`${cabins} among snowy pines on winter hills ${flakes ? "in falling snow " : ""}${when}`);
  note.focus(cx, cy - cw * 0.4);
  return out;
});

const AUTUMN: readonly (readonly [number, number, number])[] = [
  [24, 85, 52],
  [8, 70, 45],
  [42, 90, 55],
  [15, 80, 50],
  [34, 85, 48],
  [0, 60, 40],
];

/** A grove of trees in autumn colors, with leaves falling and gathered under them. */
export const autumn = defineKind("autumn", "Autumn trees", (g, w, h, note) => {
  const time = g.pick(["day", "golden", "overcast"] as const);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const hue = g.f(195, 220);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 64), hsl(hue - 5, 55, 90)]
      : time === "golden"
        ? [hsl(hue + 10, 35, 66), hsl(g.f(30, 45), 80, 84)]
        : [hsl(hue, 12, 72), hsl(hue, 14, 88)];
  const dim = time === "overcast" ? -5 : 0;
  let out = el("defs", {}, lin(skyId, stops));
  out += fill(w, h, `url(#${skyId})`);
  if (time !== "overcast")
    out += el("circle", {
      cx: w * g.f(0.15, 0.85),
      cy: h * g.f(0.15, 0.3),
      r: unit * g.f(0.05, 0.07),
      fill: time === "day" ? hsl(52, 100, 94) : hsl(40, 100, 86),
    });
  const groundY = h * g.f(0.6, 0.68);
  // A distant hill.
  const hill = curve(w, groundY - h * g.f(0, 0.06), groundY - h * g.f(0, 0.06), -h * g.f(0.02, 0.08));
  out += el("path", { d: hill.d() + s`V${h}H0Z`, fill: hsl(g.f(60, 100), 18, 66 + dim) });
  const leaf = (k: number, light = 0, sat = 0) => hsl(AUTUMN[k][0], AUTUMN[k][1] + sat, AUTUMN[k][2] + light + dim);
  // A back row of small, hazy trees on the horizon.
  let backs = "";
  for (let x = g.f(0, 0.05) * w; x < w; x += Math.max(unit * g.f(0.07, 0.11), w / 30)) {
    const r = unit * g.f(0.035, 0.055);
    backs += s`M${x - r} ${groundY + 1}a${r} ${r * 1.1} 0 1 1 ${2 * r} 0Z`;
  }
  out += el("path", { d: backs, fill: hsl(AUTUMN[g.i(0, AUTUMN.length - 1)][0] + 10, 26, 60 + dim) });
  // The meadow.
  const meadow = hsl(g.f(38, 70), 45, 54 + dim);
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: meadow });
  // A footpath winding away, sometimes.
  const path = g.chance(0.4);
  const px = w * g.f(0.3, 0.7);
  const bx = w * g.f(0.35, 0.65);
  const pw = unit * g.f(0.1, 0.14);
  /** The path's left and right edges at height y, from its two curves. */
  const pathAt = (y: number): [number, number] => {
    const t = (y - groundY) / (h - groundY);
    const at = (a: number, c: number, b: number) => (1 - t) ** 2 * a + 2 * t * (1 - t) * c + t ** 2 * b;
    return [at(px, bx + pw, bx - pw * 0.4), at(px, bx + pw * 1.6, bx + pw * 1.4)];
  };
  if (path) {
    out += el("path", {
      d: s`M${px - unit * 0.008} ${groundY} Q ${bx + pw} ${(groundY + h) / 2} ${bx - pw * 0.4} ${h}
           H ${bx + pw * 1.4} Q ${bx + pw * 1.6} ${(groundY + h) / 2} ${px + unit * 0.008} ${groundY}Z`,
      fill: hsl(32, 35, 70 + dim),
    });
  }
  // The front row, spaced across the picture.
  const count = Math.min(7, Math.max(2, Math.round(w / (unit * g.f(0.3, 0.4)))));
  const trees = Array.from({ length: count }, (_, k) => {
    const r = unit * g.f(0.12, 0.17);
    return {
      x: (w * (k + g.f(0.3, 0.7))) / count,
      y: groundY + (h - groundY) * g.f(0.3, 0.6),
      r,
      trunk: r * g.f(1, 1.35),
      color: g.i(0, AUTUMN.length - 1),
    };
  }).sort((a, b) => a.y - b.y);
  // No tree stands on the path: one whose trunk would is moved to the nearer verge, or the
  // other one if the nearer would push it out of the picture.
  if (path)
    for (const t of trees) {
      const [left, right] = pathAt(t.y);
      const clear = t.r * 0.3;
      if (t.x < left - clear || t.x > right + clear) continue;
      const toLeft = left - clear;
      const toRight = right + clear;
      const leftFits = toLeft > t.r * 0.5;
      const rightFits = toRight < w - t.r * 0.5;
      t.x = leftFits && (!rightFits || t.x - toLeft < toRight - t.x) ? toLeft : toRight;
    }
  // Fallen leaves gathered in a ring under each tree.
  for (const t of trees)
    out += el("ellipse", { cx: t.x, cy: t.y, rx: t.r * 1.05, ry: t.r * 0.2, fill: leaf(t.color, 4), opacity: "0.7" });
  const bark = hsl(g.f(15, 30), 30, 24 + dim);
  for (const t of trees) {
    const cy = t.y - t.trunk - t.r * 0.55;
    const tw = t.r * 0.11;
    out += el("polygon", {
      points: pts([
        [t.x - tw, t.y],
        [t.x - tw * 0.45, cy],
        [t.x + tw * 0.45, cy],
        [t.x + tw, t.y],
      ]),
      fill: bark,
    });
    out += el("path", { d: blob(g, t.x, cy, t.r, t.r * 0.88, 4, 0.08, 0.06), fill: leaf(t.color) });
    out += el("path", {
      d: blob(g, t.x - t.r * 0.22, cy - t.r * 0.25, t.r * 0.55, t.r * 0.45, 3, 0.1, 0.06),
      fill: leaf(t.color, 9, 5),
    });
  }
  // Leaves drifting down from the crowns and lying on the grass.
  for (const t of trees) {
    let d = "";
    for (let k = g.i(1, 2); k > 0; k--) {
      // Each leaf is a tilted ellipse, drawn as two arcs.
      const x = t.x + t.r * g.f(-1.3, 1.3);
      const y = t.y - t.trunk * g.f(0.15, 0.85);
      const turn = g.f(0, Math.PI);
      const dx = Math.cos(turn) * unit * 0.013;
      const dy = Math.sin(turn) * unit * 0.013;
      const deg = (turn * 180) / Math.PI;
      const r = unit * 0.013;
      d += s`M${x - dx} ${y - dy}A${r} ${r * 0.45} ${deg} 0 1 ${x + dx} ${y + dy}A${r} ${r * 0.45} ${deg} 0 1 ${x - dx} ${y - dy}`;
    }
    out += el("path", { d, fill: leaf(t.color, -3) });
  }
  let ground = "";
  for (let k = g.i(8, 13); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = groundY + (h - groundY) * g.f(0.1, 0.98);
    const r = unit * 0.01;
    ground += s`M${x - r} ${y}a${r} ${r * 0.5} 0 1 0 ${2 * r} 0a${r} ${r * 0.5} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: ground, fill: leaf(g.i(0, AUTUMN.length - 1)), opacity: "0.8" });
  const when = time === "day" ? "on a clear day" : time === "golden" ? "in low evening light" : "on an overcast day";
  note.alt(`A row of trees in autumn colors, leaves falling${path ? " beside a winding path" : ""}, ${when}`);
  const middle = trees.reduce((a, b) => (Math.abs(b.x - w / 2) < Math.abs(a.x - w / 2) ? b : a));
  note.focus(middle.x, middle.y - middle.trunk - middle.r * 0.4);
  return out;
});

const FIELDS: readonly (readonly [number, number, number])[] = [
  [95, 45, 45],
  [80, 50, 55],
  [48, 70, 62],
  [38, 60, 52],
  [25, 35, 42],
  [110, 38, 58],
  [60, 60, 50],
];

/** Patchwork fields over rolling farmland, with hedgerows and a barn. */
export const farm = defineKind("farm", "Farmland", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  let out = el("defs", {}, lin(skyId, sky.stops));
  out += fill(w, h, `url(#${skyId})`);
  const horizon = h * g.f(0.3, 0.4);
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: horizon * (time === "day" ? g.f(0.3, 0.55) : g.f(0.6, 0.8)),
    r: unit * g.f(0.04, 0.06),
    fill: sky.sun,
  });
  // Far blue hills on the horizon.
  const hills = curve(w, horizon - h * g.f(0, 0.05), horizon - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
  out += el("path", { d: hills.d() + s`V${h}H0Z`, fill: hsl(sky.hue + 10, 22, 62 + sky.dim) });
  // Four bands of fields, back to front, each a curve split into fields by lines that spread toward the viewer.
  const vx = w * g.f(0.35, 0.65);
  const tops = [0, 0.17, 0.4, 0.68].map((f, k) =>
    curve(
      w,
      horizon + (h - horizon) * (f + g.f(-0.04, 0.04)) + (k ? 0 : h * 0.01),
      horizon + (h - horizon) * (f + g.f(-0.04, 0.04)) + (k ? 0 : h * 0.01),
      -h * g.f(-0.02, 0.05),
    ),
  );
  const hedge = hsl(g.f(110, 140), 35, 26 + sky.dim);
  let last = -1;
  let striped = 0;
  const clips: string[] = [];
  let fields = "";
  let lines = "";
  let bushes = "";
  tops.forEach((band, k) => {
    const cuts = [-0.2 * w];
    const n = g.i(2, 4) + (k < 2 ? 1 : 0);
    for (let j = 1; j < n; j++) cuts.push((w * (j + g.f(-0.3, 0.3))) / n);
    cuts.push(1.2 * w);
    // Where a cut line meets the bottom of the picture.
    const foot = (x: number) => vx + (x - vx) * (1.3 + 0.4 * k);
    for (let j = 0; j < cuts.length - 1; j++) {
      const a = cuts[j];
      const b = cuts[j + 1];
      const edge = Array.from({ length: 6 }, (_, i): Point => {
        const x = a + ((b - a) * i) / 5;
        return [x, band.at(x)];
      });
      const shape = pts([...edge, [foot(b), h + 1], [foot(a), h + 1]]);
      let pick = g.i(0, FIELDS.length - 1);
      if (pick === last) pick = (pick + 1) % FIELDS.length;
      last = pick;
      const [fh, fs, fl] = FIELDS[pick];
      fields += el("polygon", { points: shape, fill: hsl(fh, fs, fl + sky.dim) });
      // Rows of crops in some fields, running toward the horizon.
      if (striped < 4 && k > 0 && g.chance(0.4)) {
        const id = g.id(`field${striped++}`);
        clips.push(el("clipPath", { id }, el("polygon", { points: shape })));
        let rows = "";
        const count = 6 + k * 2;
        for (let i = 1; i < count; i++) {
          const top = a + ((b - a) * i) / count;
          rows += s`M${top} ${band.at(top)}L${foot(top)} ${h}`;
        }
        fields += el("path", {
          d: rows,
          stroke: "#000",
          opacity: "0.13",
          "stroke-width": unit * (0.004 + 0.003 * k),
          "clip-path": `url(#${id})`,
        });
      }
      // A hedge along each cut, down to the next band.
      if (j > 0) lines += s`M${a} ${band.at(a)}L${foot(a)} ${h}`;
    }
    if (k > 0) lines += band.d();
    // Round trees dotted along the band's top hedge, bigger nearer the viewer.
    for (let i = g.i(1, 3); i > 0; i--) {
      const x = w * g.f(0.03, 0.97);
      const r = unit * (0.012 + 0.008 * k) * g.f(0.8, 1.3);
      bushes += s`M${x - r} ${band.at(x)}a${r} ${r} 0 1 1 ${2 * r} 0Z`;
    }
    out += fields + el("path", { d: lines, fill: "none", stroke: hedge, "stroke-width": unit * (0.006 + 0.003 * k) });
    out += el("path", { d: bushes, fill: hedge });
    fields = "";
    lines = "";
    bushes = "";
  });
  out = out.replace("</defs>", clips.join("") + "</defs>");
  // The barn, standing in the third band, and sometimes a silo.
  const bw = unit * g.f(0.16, 0.21);
  const bx = w * g.f(0.22, 0.78);
  const band = tops[2];
  const below = tops[3];
  const by = Math.min(
    band.at(bx) + (below.at(bx) - band.at(bx)) * 0.55,
    below.at(bx - bw) - unit * 0.01,
    below.at(bx + bw) - unit * 0.01,
  );
  const bh = bw * 0.6;
  const red = hsl(g.f(-6, 12), g.f(50, 65), 42 + sky.dim / 2);
  const silo = g.chance(0.6);
  const sx = bx + g.pick([-1, 1]) * bw * 0.72;
  const sw = bw * 0.26;
  out += el("ellipse", { cx: bx, cy: by, rx: bw * 0.85, ry: bw * 0.08, fill: "#000", opacity: "0.12" });
  if (silo) {
    const sh = bh * 1.9;
    out += el("rect", { x: sx - sw / 2, y: by - sh, width: sw, height: sh, fill: hsl(200, 8, 74 + sky.dim) });
    out += el("path", {
      d: s`M${sx - sw / 2} ${by - sh} A ${sw / 2} ${sw / 2} 0 0 1 ${sx + sw / 2} ${by - sh}Z`,
      fill: hsl(200, 10, 60 + sky.dim),
    });
    out += el("rect", { x: sx, y: by - sh, width: sw / 2, height: sh, fill: "#000", opacity: "0.1" });
  }
  out += el("rect", { x: bx - bw / 2, y: by - bh, width: bw, height: bh, fill: red });
  out += el("polygon", {
    points: pts([
      [bx - bw * 0.56, by - bh],
      [bx - bw * 0.4, by - bh - bw * 0.28],
      [bx, by - bh - bw * 0.42],
      [bx + bw * 0.4, by - bh - bw * 0.28],
      [bx + bw * 0.56, by - bh],
    ]),
    fill: g.chance(0.5) ? hsl(0, 0, 28) : hsl(g.f(0, 12), 40, 26),
  });
  // A big door with a crossed frame, and a loft window.
  const dw = bw * 0.36;
  const dh = bh * 0.68;
  const trim = { fill: "none", stroke: "#f4f1ea", "stroke-width": bw * 0.025 };
  out += el("rect", { x: bx - dw / 2, y: by - dh, width: dw, height: dh, fill: "#000", opacity: "0.15" });
  out += el("rect", { x: bx - dw / 2, y: by - dh, width: dw, height: dh, ...trim });
  out += el("path", {
    d: s`M${bx - dw / 2} ${by - dh}L${bx + dw / 2} ${by}M${bx + dw / 2} ${by - dh}L${bx - dw / 2} ${by}`,
    ...trim,
  });
  out += el("rect", { x: bx - bw * 0.07, y: by - bh - bw * 0.2, width: bw * 0.14, height: bw * 0.12, fill: "#f4f1ea" });
  note.alt(`A barn${silo ? " and silo" : ""} among patchwork fields and hedgerows ${AT[time]}`);
  note.focus(bx, by - bh * 0.7);
  return out;
});
