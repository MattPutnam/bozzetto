import { defineKind, el, facing, fill, hsl, lin, pts, qpt, s, type Point, type Rand } from "./core";
import { blob, smoothClosed } from "./shapes";

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

/** Path data without the spaces around its commands, which cost three bytes each in a data URI. */
const tight = (d: string) => d.replace(/\s*([A-Za-z])\s*/g, "$1");

/** A soft cloud: a row of puffs on a flat base centered at (x, y), `cw` wide. */
function cloud(g: Rand, x: number, y: number, cw: number, paint: string): string {
  let d = s`M${x - cw * 0.42} ${y}H${x + cw * 0.42}V${y - cw * 0.1}H${x - cw * 0.42}Z`;
  const puffs = g.i(3, 5);
  for (let k = 0; k < puffs; k++) {
    const t = (k + 0.5) / puffs;
    const r = cw * (0.1 + 0.16 * Math.sin(Math.PI * t)) * g.f(0.85, 1.15);
    const cx = x - cw * 0.4 + cw * 0.8 * t;
    d += s`M${cx - r} ${y - r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  return el("path", { d, fill: paint });
}

/** Small round stars scattered above `bottom`, in two sizes: each a round-capped dot of zero length. */
function starDots(g: Rand, w: number, bottom: number, count: number, unit: number): string {
  const d = ["", ""];
  for (let k = 0; k < count; k++) d[g.i(0, 1)] += s`M${w * g.f(0, 1)} ${bottom * g.f(0, 1) ** 1.3}h0`;
  return d
    .map((dots, k) =>
      el("path", {
        d: dots,
        stroke: "#fff",
        "stroke-width": unit * (0.005 + 0.004 * k),
        "stroke-linecap": "round",
        opacity: 0.9 - 0.25 * k,
      }),
    )
    .join("");
}

/** A radial glow fading out from `color`. */
const glowDef = (id: string, color: string, strength: number) =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": strength }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": 0 }),
  );

/** A rainbow over fresh hills after rain, the storm moving off to one side. */
export const rainbow = defineKind("rainbow", "Rainbow", (g, w, h, note) => {
  const evening = g.chance(0.35);
  const unit = Math.min(w, h);
  const hue = g.f(195, 215);
  const skyId = g.id("sky");
  const stops = evening
    ? [hsl(hue + 25, 22, 50), hsl(g.f(15, 30), 45, 72), hsl(g.f(35, 48), 75, 86)]
    : [hsl(hue + 8, 24, 58), hsl(hue, 42, 75), hsl(hue - 10, 50, 91)];
  const dim = evening ? -6 : 0;
  let out = el("defs", {}, lin(skyId, stops));
  out += fill(w, h, `url(#${skyId})`);
  const ground = h * g.f(0.6, 0.68);
  // The storm moving off: rain falling from a dark cloud bank on one side.
  const side = g.pick([-1, 1]);
  const stormX = side < 0 ? w * g.f(0.05, 0.22) : w * g.f(0.78, 0.95);
  const stormY = h * g.f(0.2, 0.28);
  const stormW = Math.max(unit * g.f(0.55, 0.75), w * 0.3);
  let rain = "";
  for (let x = stormX - stormW * 0.42; x < stormX + stormW * 0.42; x += unit * g.f(0.018, 0.03))
    rain += s`M${x} ${stormY}l${-side * unit * 0.05} ${ground - stormY}`;
  out += el("path", { d: rain, stroke: hsl(hue, 15, 50), "stroke-width": unit * 0.006, opacity: "0.3" });
  // The bow: six bands, centered below the hills, with the sky a little brighter inside it.
  const cx = w * g.f(0.35, 0.65);
  const cy = ground + h * g.f(0.02, 0.12);
  const radius = Math.min(cy - h * 0.12, w * g.f(0.4, 0.5));
  const band = radius * 0.032;
  const hues = [0, 28, 55, 120, 205, 270];
  out += el("circle", { cx, cy, r: radius - 6 * band, fill: "#fff", opacity: "0.12" });
  const bow = (r: number, order: number[], opacity: number) =>
    el(
      "g",
      { fill: "none", "stroke-width": band * 1.08, opacity },
      ...order.map((hh, k) =>
        el("path", {
          d: s`M${cx - r + k * band} ${cy}A${r - k * band} ${r - k * band} 0 0 1 ${cx + r - k * band} ${cy}`,
          stroke: hsl(hh, 85, 62),
        }),
      ),
    );
  out += bow(radius, hues, evening ? 0.55 : 0.6);
  const double = g.chance(0.35);
  if (double) out += bow(radius * 1.3, [...hues].reverse(), 0.22);
  // The storm clouds, and a few soft clouds clearing away.
  // Clouds are kept short enough to clear the top edge: a puff is at most about half as tall as its cloud is wide.
  const bankW = Math.min(stormW, (stormY + unit * 0.02) / 0.55);
  out += cloud(g, stormX, stormY + unit * 0.02, bankW, hsl(hue, 10, 56 + dim));
  out += cloud(g, stormX + side * bankW * 0.15, stormY - unit * 0.04, bankW * 0.6, hsl(hue, 12, 66 + dim));
  for (let k = g.i(1, 2); k > 0; k--) {
    const x = side < 0 ? w * g.f(0.5, 0.92) : w * g.f(0.08, 0.5);
    const cw = unit * g.f(0.18, 0.28);
    out += cloud(g, x, Math.max(h * g.f(0.12, 0.3), cw * 0.62), cw, evening ? hsl(30, 60, 92) : "#fff");
  }
  // Far, middle and near hills, fresh after the rain.
  const green = g.f(85, 125);
  const far = curve(w, ground - h * g.f(0.04, 0.1), ground - h * g.f(0, 0.08), -h * g.f(0.02, 0.06));
  const mid = curve(w, ground + h * g.f(0.02, 0.08), ground + h * g.f(0, 0.06), -h * g.f(0.02, 0.06));
  const near = curve(w, h * g.f(0.82, 0.9), h * g.f(0.8, 0.9), -h * g.f(0, 0.05));
  out += el("path", { d: far.d() + s`V${h}H0Z`, fill: hsl(green + 15, 28, 60 + dim) });
  out += el("path", { d: mid.d() + s`V${h}H0Z`, fill: hsl(green, 42, 47 + dim) });
  // Round trees on the middle hill.
  const bark = hsl(25, 30, 28 + dim);
  const crown = hsl(green + 10, 42, 32 + dim);
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = w * g.f(0.05, 0.95);
    const r = unit * g.f(0.03, 0.05);
    const y = mid.at(x) + unit * 0.01;
    out += el("rect", { x: x - r * 0.15, y: y - r * 1.6, width: r * 0.3, height: r * 1.6, fill: bark });
    out += el("circle", { cx: x, cy: y - r * 1.7, r, fill: crown });
  }
  out += el("path", { d: near.d() + s`V${h}H0Z`, fill: hsl(green - 5, 48, 38 + dim) });
  // A puddle on the near slope, holding the sky.
  if (g.chance(0.5)) {
    const px = w * g.f(0.15, 0.85);
    out += el("ellipse", {
      cx: px,
      cy: near.at(px) + (h - near.at(px)) * 0.5,
      rx: unit * g.f(0.06, 0.1),
      ry: unit * 0.018,
      fill: stops[2],
      opacity: "0.8",
    });
  }
  note.alt(
    `A ${double ? "double " : ""}rainbow arching over rolling hills after rain${evening ? " in evening light" : ""}`,
  );
  note.focus(cx, cy - radius);
  return out;
});

/** A desert canyon seen from its floor: stepped walls banded with rock, overlapping as they recede, and a river or a dry wash between. */
export const canyon = defineKind("canyon", "Desert canyon", (g, w, h, note) => {
  const time = g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  // Where the floor vanishes into the distance.
  const vx = w * g.f(0.42, 0.58);
  const fy = h * g.f(0.48, 0.56);
  const rockHue = g.f(5, 28);
  const dim = sky.dim;
  const defs = [lin(skyId, sky.stops)];
  let out = fill(w, h, `url(#${skyId})`);
  out += el("circle", {
    cx: vx + w * g.f(-0.12, 0.12),
    cy: time === "day" ? h * g.f(0.08, 0.18) : fy - h * g.f(0.1, 0.2),
    r: unit * g.f(0.04, 0.06),
    fill: sky.sun,
  });
  // Flat-topped buttes on the horizon, a hazy row and a nearer one.
  for (const [haze, rise] of [
    [1, 0.16],
    [0, 0.09],
  ]) {
    const far: Point[] = [[0, fy + 1]];
    for (let x = -w * g.f(0, 0.1); x < w; x += w * g.f(0.05, 0.15)) {
      const bw = Math.min(w * g.f(0.12, 0.3), unit * 0.7);
      const top = fy - h * rise * g.f(0.4, 1);
      const lean = bw * g.f(0.08, 0.16);
      far.push([x, fy + 1], [x + lean, top], [x + bw - lean, top], [x + bw, fy + 1]);
      x += bw;
    }
    far.push([w, fy + 1]);
    out += el("polygon", {
      points: pts(far),
      fill: hsl(rockHue + 10 + haze * 8, 30 + 8 * (1 - haze), 58 + 10 * haze + dim),
    });
  }
  // The floor, and the river (or a dry wash) winding toward the viewer.
  out += el("rect", { y: fy, width: w, height: h - fy, fill: hsl(rockHue + 22, 38, 62 + dim) });
  const wash = g.chance(0.3);
  const bx = w * g.f(0.38, 0.62);
  const wide = Math.min(w * g.f(0.2, 0.32), unit * 0.5);
  const wob = g.f(0.6, 1) * g.pick([-1, 1]);
  const phase = g.f(0, Math.PI * 2);
  const left: Point[] = [];
  const right: Point[] = [];
  for (let k = 0; k <= 14; k++) {
    const t = k / 14;
    const y = fy + (h + 2 - fy) * t;
    const half = (wide * t ** 1.3 + unit * 0.006) / 2;
    const x = vx + (bx - vx) * t + Math.sin(phase + t * 6) * unit * 0.08 * t * wob;
    left.push([x - half, y]);
    right.push([x + half, y]);
  }
  /** Where the river's left (-1) or right (1) bank is at height y. */
  const bank = (y: number, dir: number) => {
    const side = dir < 0 ? left : right;
    const f = ((y - fy) / (h + 2 - fy)) * 14;
    const k = Math.max(0, Math.min(13, Math.floor(f)));
    return lerp(side[k], side[k + 1], Math.min(1, f - k))[0];
  };
  out += el("polygon", {
    points: pts([...left, ...[...right].reverse()]),
    fill: wash ? hsl(rockHue + 28, 30, 74 + dim) : hsl(sky.hue, 45, 56 + dim),
  });
  // Ripples on the water, or pebbles in the wash.
  let marks = "";
  for (let k = g.i(5, 8); k > 0; k--) {
    const j = g.i(5, 13);
    const span = right[j][0] - left[j][0];
    const x = left[j][0] + span * g.f(0.15, 0.6);
    marks += wash
      ? s`M${x} ${left[j][1]}a${span * 0.04} ${span * 0.025} 0 1 0 ${span * 0.08} 0a${span * 0.04} ${span * 0.025} 0 1 0 ${-span * 0.08} 0`
      : s`M${x} ${left[j][1]}h${span * g.f(0.15, 0.3)}`;
  }
  out += wash
    ? el("path", { d: marks, fill: hsl(rockHue + 10, 15, 55 + dim) })
    : el("path", { d: marks, stroke: "#fff", "stroke-width": unit * 0.005, opacity: "0.45" });
  // Scrub along the banks.
  let scrub = "";
  for (let k = g.i(4, 8); k > 0; k--) {
    const j = g.i(4, 14);
    const r = unit * (0.008 + 0.025 * (j / 14)) * g.f(0.7, 1.2);
    const x = g.chance(0.5) ? left[j][0] - r * 1.2 : right[j][0] + r * 1.2;
    scrub += s`M${x - r} ${left[j][1]}a${r} ${r * 0.8} 0 1 1 ${2 * r} 0Z`;
  }
  out += el("path", { d: scrub, fill: hsl(g.f(70, 100), 28, 34 + dim) });

  // The strata: the same bands, as fractions of a wall's height, on every wall, so they line up as they recede.
  const breaks = [0];
  while (breaks[breaks.length - 1] < 1) breaks.push(Math.min(1, breaks[breaks.length - 1] + g.f(0.1, 0.22)));
  const tones = breaks.slice(1).map(() => g.i(0, 3));
  for (let k = 1; k < tones.length; k++) if (tones[k] === tones[k - 1]) tones[k] = (tones[k] + 1) % 4;
  const TONE = [
    [0, 52, 48],
    [8, 46, 57],
    [16, 42, 66],
    [-4, 48, 40],
  ];
  const sunSide = g.pick([-1, 1]);
  // The strata drawn once for the sunlit side and once for the shaded side, 100 units tall, gently wavy;
  // each wall stretches a copy to its own height.
  const wave = breaks.map(() => g.f(-3, 3));
  const strata = [g.id("shaded"), g.id("sunlit")];
  strata.forEach((id, lit) => {
    const bands = ["", "", "", ""];
    for (let k = 0; k < tones.length; k++)
      bands[tones[k]] += s`M-1 ${breaks[k] * 100 - 1}q${w / 2 + 1} ${wave[k]} ${w + 2} 0V${breaks[k + 1] * 100 + 1}
                            q${-w / 2 - 1} ${wave[k + 1]} ${-w - 2} 0Z`;
    defs.push(
      el(
        "g",
        { id },
        ...bands.map((d, k) =>
          d ? el("path", { d, fill: hsl(rockHue + TONE[k][0], TONE[k][1], TONE[k][2] + dim + (lit ? 4 : -14)) }) : "",
        ),
      ),
    );
  });
  const haze = sky.stops[sky.stops.length - 1];
  // Wall layers on each side, from far to near: each nearer one taller, lower at its foot and further out.
  const topNear = h * g.f(0.1, 0.22);
  const count = g.i(3, 4);
  const layers: { t: number; dir: number }[] = [];
  for (const dir of [-1, 1]) {
    const off = dir < 0 ? 0 : g.f(0.35, 0.6);
    for (let k = 1; k <= count; k++) layers.push({ t: Math.max(0.15, (k - off) / count), dir });
    if (off) layers.push({ t: 1, dir });
  }
  layers.sort((a, b) => a.t - b.t);
  let ledges = "";
  layers.forEach(({ t, dir }, n) => {
    const edge = dir < 0 ? -1 : w + 1;
    const base = fy + (h + unit * 0.02 - fy) * t ** 1.6;
    const top = fy - (fy - topNear) * t ** 0.85 * g.f(0.85, 1);
    const tall = base - top;
    const inner = bank(Math.min(base, h), dir) + dir * (unit * 0.01 + w * 0.03 * t) * g.f(0.6, 1.4);
    const spread = (w * 0.3 * t + unit * 0.06) * g.f(0.8, 1.2);
    const rim = inner + dir * spread;
    // Down the wall from its rim: a steep cliff, then a talus slope slanting toward the river, and again,
    // so the wall widens as it goes down. Each stretch is broken into a few jagged pieces.
    const pairs = g.i(2, 3);
    const drops = Array.from({ length: pairs * 2 }, (_, k) => (k % 2 ? g.f(0.8, 1.4) : g.f(0.5, 0.9)));
    const runs = Array.from({ length: pairs * 2 }, (_, k) => (k % 2 ? g.f(0.7, 1.2) : g.f(0.05, 0.12)));
    const dropSum = drops.reduce((p, q) => p + q);
    const runSum = runs.reduce((p, q) => p + q);
    const ring: Point[] = [
      [edge, top],
      [rim, top],
    ];
    let x = rim;
    let y = top;
    for (let k = 0; k < pairs * 2; k++) {
      const dy = (tall * drops[k]) / dropSum;
      const dx = (-dir * spread * runs[k]) / runSum;
      const pieces = k % 2 ? 2 : 1;
      const slope = k % 2 === 1;
      for (let j = 1; j <= pieces; j++) {
        const f = j / pieces;
        const last = k === pairs * 2 - 1 && j === pieces;
        const jag = last ? 0 : unit * g.f(-0.008, 0.008);
        ring.push([x + dx * f + jag, y + dy * f + (slope ? jag : 0)]);
      }
      if (slope) ledges += `M${pts(ring.slice(-pieces - 1)).replace(/ /g, "L")}`;
      x += dx;
      y += dy;
    }
    ring.push([edge, base]);
    const clip = g.id(`wall${n}`);
    const shape = g.id(`face${n}`);
    defs.push(el("clipPath", { id: clip }, el("polygon", { id: shape, points: pts(ring) })));
    // The strata, and haze over the farther walls.
    out += el(
      "g",
      { "clip-path": `url(#${clip})` },
      el("use", { href: `#${strata[dir === sunSide ? 1 : 0]}`, transform: s`matrix(1 0 0 ${tall / 100} 0 ${top})` }),
    );
    if (t < 1) out += el("use", { href: `#${shape}`, fill: haze, opacity: (1 - t) * 0.45 });
    // A dark line around the nearer walls, setting each off from the wall behind.
    if (t > 0.4)
      out += el("use", {
        href: `#${shape}`,
        fill: "none",
        stroke: "#000",
        "stroke-width": unit * 0.006,
        opacity: "0.25",
      });
  });
  // Light catching the talus slopes.
  out += el("path", { d: ledges, fill: "none", stroke: "#fff", "stroke-width": unit * 0.006, opacity: "0.35" });
  note.alt(
    `A desert canyon with banded rock walls, ${wash ? "a dry wash" : "a river"} winding along its floor ${AT[time]}`,
  );
  note.focus(vx, fy - h * 0.05);
  return el("defs", {}, ...defs) + out;
});

/** A tiny animal silhouette standing at (x, y), `ht` tall, facing right. */
function beast(kind: "giraffe" | "elephant" | "antelope", x: number, y: number, ht: number, paint: string) {
  const line = { fill: "none", stroke: paint, "stroke-linecap": "round" };
  let out = "";
  if (kind === "giraffe") {
    const by = y - ht * 0.55;
    const bw = ht * 0.4;
    out += el("path", {
      d: s`M${x - bw * 0.38} ${by}L${x - bw * 0.42} ${y}M${x - bw * 0.2} ${by}L${x - bw * 0.16} ${y}
           M${x + bw * 0.24} ${by}L${x + bw * 0.22} ${y}M${x + bw * 0.4} ${by}L${x + bw * 0.46} ${y}`,
      ...line,
      "stroke-width": ht * 0.045,
    });
    out += el("path", {
      d: s`M${x + bw * 0.3} ${by - ht * 0.04}L${x + bw * 0.62} ${y - ht * 0.93}`,
      ...line,
      "stroke-width": ht * 0.08,
    });
    out += el("ellipse", {
      cx: x,
      cy: by - ht * 0.02,
      rx: bw * 0.55,
      ry: ht * 0.1,
      fill: paint,
      transform: s`rotate(-12 ${x} ${by})`,
    });
    out += el("ellipse", { cx: x + bw * 0.74, cy: y - ht * 0.92, rx: ht * 0.07, ry: ht * 0.035, fill: paint });
  } else if (kind === "elephant") {
    const legs = [-0.36, -0.16, 0.14, 0.32]
      .map(f => s`M${x + ht * f - ht * 0.065} ${y}h${ht * 0.13}v${-ht * 0.45}h${-ht * 0.13}Z`)
      .join("");
    out += el("path", { d: legs, fill: paint });
    out += el("ellipse", { cx: x, cy: y - ht * 0.55, rx: ht * 0.5, ry: ht * 0.3, fill: paint });
    out += el("circle", { cx: x + ht * 0.5, cy: y - ht * 0.62, r: ht * 0.2, fill: paint });
    out += el("path", {
      d: s`M${x + ht * 0.62} ${y - ht * 0.55}Q${x + ht * 0.74} ${y - ht * 0.3} ${x + ht * 0.7} ${y - ht * 0.08}`,
      ...line,
      "stroke-width": ht * 0.08,
    });
  } else {
    const by = y - ht * 0.5;
    out += el("path", {
      d: s`M${x - ht * 0.22} ${by}L${x - ht * 0.24} ${y}M${x - ht * 0.12} ${by}L${x - ht * 0.08} ${y}
           M${x + ht * 0.14} ${by}L${x + ht * 0.12} ${y}M${x + ht * 0.24} ${by}L${x + ht * 0.28} ${y}
           M${x + ht * 0.25} ${by - ht * 0.05}L${x + ht * 0.36} ${by - ht * 0.32}L${x + ht * 0.3} ${by - ht * 0.52}`,
      ...line,
      "stroke-width": ht * 0.05,
    });
    out += el("ellipse", { cx: x, cy: by - ht * 0.04, rx: ht * 0.3, ry: ht * 0.12, fill: paint });
    out += el("ellipse", { cx: x + ht * 0.38, cy: by - ht * 0.3, rx: ht * 0.08, ry: ht * 0.05, fill: paint });
  }
  return out;
}

/** A flat-topped crown `cw` wide: a gently curved underside at `cy` with a row of low puffs on top. */
function crown(g: Rand, cx: number, cy: number, cw: number, ch: number): string {
  const n = g.i(3, 5);
  const r = cw / n / 2;
  let d = s`M${cx - cw / 2} ${cy}Q${cx} ${cy + ch * 0.3} ${cx + cw / 2} ${cy}`;
  for (let k = 0; k < n; k++) d += s`a${r} ${ch * g.f(0.7, 1)} 0 0 0 ${-2 * r} 0`;
  return d + "Z";
}

/** A flat-topped acacia whose trunk base sits at (x, y), `ht` tall; `leaf` colors the crown: its top, middle and underside. */
function acacia(g: Rand, x: number, y: number, ht: number, bark: string, leaf: readonly string[], far = false): string {
  const fork: Point = [x + ht * g.f(-0.08, 0.08), y - ht * g.f(0.38, 0.5)];
  const cy = y - ht * g.f(0.78, 0.86);
  const cw = ht * g.f(1.3, 1.7);
  const ch = ht * g.f(0.16, 0.22);
  const tw = ht * 0.035;
  let out = el("polygon", {
    points: pts([
      [x - tw, y],
      [fork[0] - tw * 0.6, fork[1]],
      [fork[0] + tw * 0.6, fork[1]],
      [x + tw, y],
    ]),
    fill: bark,
  });
  // Branches spreading up from the fork to the crown.
  let d = "";
  for (const f of [-0.32, 0, 0.3]) {
    const end: Point = [x + cw * f * g.f(0.8, 1.1), cy];
    d += s`M${fork[0]} ${fork[1]}Q${(fork[0] + end[0]) / 2 + f * ht * 0.1} ${(fork[1] + cy) / 2} ${end[0]} ${end[1]}`;
  }
  out += el("path", { d, fill: "none", stroke: bark, "stroke-width": tw * 1.1, "stroke-linecap": "round" });
  // The crown: a darker underside, the canopy, and light on its top. A far tree is too small to show them.
  const ccx = x + cw * g.f(-0.08, 0.08);
  if (far) return out + el("path", { d: crown(g, ccx, cy, cw, ch), fill: leaf[1] });
  out += el("path", { d: crown(g, ccx, cy + ch * 0.2, cw * 0.96, ch * 0.8), fill: leaf[2] });
  out += el("path", { d: crown(g, ccx, cy, cw, ch), fill: leaf[1] });
  out += el("path", { d: crown(g, ccx - cw * 0.04, cy - ch * 0.4, cw * 0.7, ch * 0.6), fill: leaf[0] });
  return out;
}

/** Open grassland with flat-topped acacias under a big sky, animals small on the horizon. */
export const savanna = defineKind("savanna", "Savanna", (g, w, h, note) => {
  const time = g.pick(["day", "golden", "sunset"] as const);
  const unit = Math.min(w, h);
  const hue = g.f(195, 215);
  const skyId = g.id("sky");
  const grassId = g.id("grass");
  const horizon = h * g.f(0.6, 0.68);
  const stops =
    time === "day"
      ? [hsl(hue, 55, 62), hsl(hue - 5, 50, 88)]
      : time === "golden"
        ? [hsl(hue + 10, 40, 64), hsl(g.f(36, 46), 80, 84)]
        : [hsl(g.f(260, 285), 30, 36), hsl(g.f(8, 22), 75, 62), hsl(g.f(36, 46), 95, 76)];
  const sunset = time === "sunset";
  const grassHue = g.f(36, 52);
  const grass = sunset
    ? [hsl(grassHue - 15, 40, 34), hsl(grassHue - 20, 35, 24)]
    : [hsl(grassHue, 50, time === "day" ? 66 : 60), hsl(grassHue - 6, 55, time === "day" ? 52 : 46)];
  let out = el("defs", {}, lin(skyId, stops), lin(grassId, grass));
  out += fill(w, h, `url(#${skyId})`);
  const sunR = unit * (sunset ? g.f(0.1, 0.14) : g.f(0.05, 0.07));
  const sunX = w * g.f(0.2, 0.8);
  out += el("circle", {
    cx: sunX,
    cy: time === "day" ? horizon * g.f(0.2, 0.4) : horizon - sunR * (sunset ? g.f(0.2, 0.8) : g.f(1.5, 3)),
    r: sunR,
    fill: sunset ? hsl(g.f(25, 40), 95, 80) : hsl(48, 100, 92),
  });
  // Low hills far off, and the plain.
  const hills = curve(w, horizon - h * g.f(0, 0.04), horizon - h * g.f(0, 0.04), -h * g.f(0.01, 0.04));
  out += el("path", {
    d: hills.d() + s`V${h}H0Z`,
    fill: sunset ? hsl(g.f(270, 300), 20, 38) : hsl(hue + 10, 18, 66),
  });
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${grassId})` });
  // Lighter streaks of grass across the plain.
  for (let k = g.i(2, 4); k > 0; k--) {
    const y = horizon + (h - horizon) * g.f(0.1, 0.7);
    out += el("ellipse", {
      cx: w * g.f(0, 1),
      cy: y,
      rx: w * g.f(0.2, 0.45),
      ry: unit * 0.012,
      fill: "#fff",
      opacity: "0.08",
    });
  }
  const dark = hsl(20, 25, 12);
  const bark = sunset ? dark : hsl(25, 25, 28);
  const leafHue = g.f(75, 110);
  const leaf = sunset
    ? [dark, dark, hsl(20, 25, 8)]
    : [hsl(leafHue, 35, 42), hsl(leafHue, 32, 33), hsl(leafHue, 30, 24)];
  // Small acacias on the horizon.
  for (let k = g.i(1, 3); k > 0; k--) {
    const ht = unit * g.f(0.06, 0.1);
    out += acacia(g, w * g.f(0.05, 0.95), horizon + unit * 0.01, ht, bark, leaf, true);
  }
  // The animals, small in the distance.
  const herd = g.pick(["giraffe", "elephant", "antelope"] as const);
  const herdX = w * g.f(0.2, 0.8);
  const dir = g.pick([-1, 1]);
  const count = herd === "antelope" ? g.i(3, 4) : g.i(2, 3);
  const size = unit * (herd === "giraffe" ? 0.09 : herd === "elephant" ? 0.06 : 0.035);
  const paint = sunset ? dark : hsl(25, 25, 22);
  // The whole herd faces one way.
  out += facing(herdX, dir);
  for (let k = 0; k < count; k++) {
    const scale = herd === "elephant" && k === count - 1 ? 0.6 : g.f(0.85, 1.05);
    const x = herdX + (k - count / 2) * size * g.f(0.8, 1.4);
    out += beast(herd, x, horizon + (h - horizon) * g.f(0.08, 0.14), size * scale, paint);
  }
  out += "</g>";
  // The main acacia in the foreground, sometimes with a second further back.
  const side = g.pick([-1, 1]);
  const tx = w / 2 + side * w * g.f(0.15, 0.3);
  const ty = h * g.f(0.84, 0.92);
  const tht = Math.min(unit * g.f(0.42, 0.55), ty * 0.82);
  const second = g.chance(0.5);
  if (second) {
    const sx = w / 2 - side * w * g.f(0.18, 0.35);
    const sy = horizon + (h - horizon) * g.f(0.35, 0.5);
    out += el("ellipse", { cx: sx, cy: sy, rx: tht * 0.4, ry: tht * 0.04, fill: "#000", opacity: "0.12" });
    out += acacia(g, sx, sy, tht * g.f(0.45, 0.6), bark, leaf);
  }
  out += el("ellipse", { cx: tx, cy: ty, rx: tht * 0.7, ry: tht * 0.06, fill: "#000", opacity: "0.15" });
  out += acacia(g, tx, ty, tht, bark, leaf);
  // Tufts of tall grass in the foreground.
  let tufts = "";
  for (let k = g.i(3, 6); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = horizon + (h - horizon) * g.f(0.55, 1);
    const th = unit * g.f(0.03, 0.05);
    tufts += s`M${x - th * 0.3} ${y - th * 0.8}L${x} ${y}L${x + th * 0.05} ${y - th}M${x} ${y}L${x + th * 0.35} ${y - th * 0.75}`;
  }
  out += el("path", {
    d: tufts,
    fill: "none",
    stroke: sunset ? hsl(grassHue - 20, 35, 16) : hsl(grassHue - 4, 50, 38),
    "stroke-width": unit * 0.005,
    "stroke-linecap": "round",
  });
  const animals = { giraffe: "giraffes", elephant: "elephants", antelope: "antelope" }[herd];
  const when = time === "day" ? "under a big sky" : time === "golden" ? "in low evening light" : "at sunset";
  note.alt(`Flat-topped acacia trees on open grassland ${when}, ${animals} in the distance`);
  note.focus(tx, ty - tht * 0.8);
  return out;
});

/** The northern lights rippling over a still lake or snowy hills on a starry night. */
export const aurora = defineKind("aurora", "Northern lights", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.f(215, 240);
  const glow = g.f(120, 165);
  const tip = g.chance(0.5) ? g.f(275, 320) : glow + g.f(25, 45);
  const lake = g.chance(0.5);
  const shore = h * g.f(0.62, 0.72);
  // Repeated details are spaced wider on wide pictures, to keep the markup small.
  const spread = Math.sqrt(Math.max(1, w / h / 1.4));
  const skyId = g.id("sky");
  const veil = g.id("veil");
  const defs = [
    lin(skyId, [hsl(hue, 55, 6), hsl(hue + 10, 45, 14), hsl(hue + 15, 40, 24)]),
    el(
      "linearGradient",
      { id: veil, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hsl(tip, 70, 60), "stop-opacity": 0 }),
      el("stop", { offset: 0.45, "stop-color": hsl(tip, 70, 62), "stop-opacity": 0.3 }),
      el("stop", { offset: 0.78, "stop-color": hsl(glow, 85, 60), "stop-opacity": 0.7 }),
      el("stop", { offset: 1, "stop-color": hsl(glow, 90, 70), "stop-opacity": 0.9 }),
    ),
  ];
  // The sky: stars, then curtains of light with rays rising from their lower edges.
  let sky = el("rect", { width: w, height: shore, fill: `url(#${skyId})` });
  sky += starDots(g, w, shore * 0.9, g.i(24, 38), unit);
  const ribbons = g.i(1, 3);
  let focusY = shore * 0.4;
  for (let r = 0; r < ribbons; r++) {
    const base = shore * g.f(0.45, 0.72) - r * shore * 0.12;
    const amp = shore * g.f(0.04, 0.09);
    const freq = g.f(0.8, 1.8);
    const tilt = shore * g.f(-0.25, 0.25);
    const tall = shore * g.f(0.25, 0.42);
    const p1 = g.f(0, 6);
    const p2 = g.f(0, 6);
    const bottom = (x: number) => base + amp * Math.sin(p1 + (freq * 2 * Math.PI * x) / w) + tilt * (x / w - 0.5);
    const topAt = (x: number) => bottom(x) - tall * (0.65 + 0.35 * Math.sin(p2 + (2.3 * Math.PI * x) / w));
    const lower: Point[] = [];
    const upper: Point[] = [];
    for (let k = 0; k <= 9; k++) {
      const x = -0.1 * w + (1.2 * w * k) / 9;
      lower.push([x, bottom(x)]);
      upper.unshift([x, topAt(x)]);
    }
    const d = tight(smoothClosed([...lower, ...upper]));
    sky += el("path", { d, fill: `url(#${veil})`, opacity: r ? g.f(0.5, 0.75) : 0.95 });
    let rays = "";
    for (let k = g.i(6, 10); k > 0; k--) {
      const x = w * g.f(0, 1);
      rays += s`M${x} ${bottom(x) - unit * 0.01}V${topAt(x) + tall * 0.2}`;
    }
    sky += el("path", { d: rays, stroke: hsl(glow, 80, 78), "stroke-width": unit * g.f(0.005, 0.01), opacity: "0.18" });
    if (!r) focusY = base - tall * 0.35;
  }
  let out = "";
  let alt: string;
  if (lake) {
    // A far shore of dark hills and pines, then everything above it mirrored in the water.
    const hill = curve(w, shore - h * g.f(0.02, 0.07), shore - h * g.f(0.02, 0.07), -h * g.f(0, 0.05));
    sky += el("path", { d: hill.d() + s`V${shore}H0Z`, fill: hsl(hue, 30, 10) });
    let trees = "";
    for (let x = g.f(0, 0.02) * w; x < w; x += unit * g.f(0.03, 0.06) * spread * 1.3) {
      const th = unit * g.f(0.03, 0.07);
      const by = hill.at(x) + unit * 0.01;
      trees += s`M${x - th * 0.25} ${by}l${th * 0.25} ${-th}l${th * 0.25} ${th}Z`;
    }
    sky += el("path", { d: trees, fill: hsl(hue, 30, 6) });
    const view = g.id("view");
    defs.push(el("g", { id: view }, sky));
    out += fill(w, h, hsl(hue, 40, 8));
    out += el("use", { href: `#${view}` });
    out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * shore})`, opacity: "0.75" });
    out += el("rect", { y: shore, width: w, height: h - shore, fill: hsl(hue, 40, 10), opacity: "0.3" });
    for (let k = g.i(3, 5); k > 0; k--)
      out += el("rect", {
        x: w * g.f(-0.1, 0.9),
        y: shore + (h - shore) * g.f(0.1, 0.9),
        width: w * g.f(0.1, 0.3),
        height: Math.max(1, unit * 0.004),
        fill: "#fff",
        opacity: "0.12",
      });
    // A snowy bank in one corner with a pine or two.
    const side = g.pick([-1, 1]);
    const bank = curve(w, h * (side < 0 ? 0.86 : 1.05), h * (side < 0 ? 1.05 : 0.86), -h * 0.03);
    out += el("path", { d: bank.d() + s`V${h + 1}H0Z`, fill: hsl(hue, 22, 34) });
    for (let k = g.i(1, 2); k > 0; k--) {
      const x = side < 0 ? w * g.f(0.02, 0.18) : w * g.f(0.82, 0.98);
      const ht = unit * g.f(0.28, 0.38);
      out += pine(x, bank.at(x) + ht * 0.04, ht, ht * 0.5, hsl(hue, 30, 7));
    }
    alt = "The northern lights rippling over a still lake on a starry night, mirrored in the water";
  } else {
    out += sky;
    // Snowy hills under the glow, with snow-laden pines and sometimes a cabin.
    const tree = g.id("pine");
    const snow = (light: number) => hsl(hue, 22, light);
    defs.push(
      el(
        "g",
        { id: tree },
        el("path", { d: `M${pts(PINE.map(([x, y]): Point => [x * 100, y * 100]))}Z` }),
        el("path", { d: PINE_SNOW, fill: snow(62) }),
      ),
    );
    const far = curve(w, shore - h * g.f(0, 0.05), shore - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
    const near = curve(w, h * g.f(0.8, 0.86), h * g.f(0.8, 0.86), -h * g.f(0, 0.05));
    out += el("path", { d: far.d() + s`V${h}H0Z`, fill: hsl(glow, 14, 38) });
    for (let x = g.f(0, 0.05) * w; x < w; x += unit * g.f(0.05, 0.12) * spread) {
      const ht = unit * g.f(0.06, 0.11);
      out += snowyPine(tree, x, far.at(x) + ht * 0.1, ht, ht * 0.55, hsl(hue, 25, 12));
    }
    out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(52) });
    const cabinX = w * g.f(0.25, 0.75);
    const cw = unit * g.f(0.18, 0.24);
    const lit = g.chance(0.5);
    for (const dir of [-1, 1]) {
      const x = cabinX + dir * cw * g.f(1, 1.6);
      const ht = unit * g.f(0.24, 0.32);
      out += snowyPine(tree, x, near.at(x) + ht * 0.04, ht, ht * 0.55, hsl(hue, 25, 10));
    }
    if (lit) out += cabin(g, cabinX, near.at(cabinX) + cw * 0.05, cw, snow(66), true);
    // A soft glow of the lights on the snow.
    out += el("rect", { y: shore, width: w, height: h - shore, fill: hsl(glow, 70, 60), opacity: "0.06" });
    alt = `The northern lights rippling over snowy hills and pines on a starry night${lit ? ", a cabin window lit below" : ""}`;
  }
  note.alt(alt);
  note.focus(w / 2, focusY);
  return el("defs", {}, ...defs) + out;
});

/** A city street in the rain: lit windows over a wet road that mirrors them, street lamps glowing. */
export const rainyStreet = defineKind("rainy-street", "Rainy street", (g, w, h, note) => {
  const night = g.chance(0.55);
  const unit = Math.min(w, h);
  const hue = g.f(205, 240);
  const skyId = g.id("sky");
  const streak = g.id("streak");
  const lamp = g.id("lamp");
  const view = g.id("view");
  const base = h * g.f(0.58, 0.66);
  const curb = base + unit * g.f(0.07, 0.1);
  const warm = hsl(g.f(36, 46), 95, 70);
  // Wide pictures get bigger windows and fewer towers, so the markup stays small.
  const wide = Math.sqrt(Math.max(1, w / h / 1.4));
  const defs = [
    lin(skyId, night ? [hsl(hue, 35, 9), hsl(hue + 5, 28, 22)] : [hsl(hue, 28, 30), hsl(hue + 20, 24, 52)]),
    el(
      "linearGradient",
      { id: streak, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": warm, "stop-opacity": 0.55 }),
      el("stop", { offset: 1, "stop-color": warm, "stop-opacity": 0 }),
    ),
    glowDef(lamp, warm, 0.5),
  ];
  let out = fill(w, h, `url(#${skyId})`);
  // Towers far off in the haze.
  let haze = "";
  for (let x = -w * g.f(0, 0.1); x < w; x += unit * g.f(0.1, 0.2) * wide) {
    const tw = unit * g.f(0.08, 0.16) * wide;
    haze += s`M${x} ${base}V${base - base * g.f(0.55, 0.95)}h${tw}V${base}Z`;
  }
  let scene = el("path", { d: haze, fill: hsl(hue, 14, night ? 20 : 40), opacity: "0.7" });
  // The street's buildings, built on a grid of windows so a pattern can draw them.
  const tw = unit * g.f(0.055, 0.07) * wide;
  // Tall pictures get taller floors, for the same reason.
  const th = unit * g.f(0.07, 0.085) * Math.min(wide, 1.2) * Math.sqrt(Math.max(1, h / w / 1.4));
  const x0 = -tw * g.f(0, 1);
  const glass = hsl(hue, 25, night ? 12 : 22);
  const shapes = [
    [0.28, 0.18, 0.44, 0.58],
    [0.15, 0.25, 0.7, 0.45],
  ];
  const grids = shapes.map((_, k) => g.id(`windows${k}`));
  shapes.forEach(([x, y, ww, wh], k) =>
    defs.push(
      el(
        "pattern",
        { id: grids[k], patternUnits: "userSpaceOnUse", x: x0, y: base, width: tw, height: th },
        el("rect", { x: tw * x, y: th * y, width: tw * ww, height: th * wh, fill: glass }),
      ),
    ),
  );
  const maxRows = Math.max(3, Math.floor((base - unit * 0.06) / th) - 1);
  let lit = "";
  let shops = "";
  const panes = ["", ""];
  // Three facade colors and two awning colors, each drawn as one path.
  const walls = [0, 1, 2].map(() => hsl(hue + g.f(-30, 30), g.f(8, 22), g.f(18, 30) + (night ? 0 : 8)));
  const facades = ["", "", ""];
  const awningColors = [hsl(g.f(0, 360), 50, 40), hsl(g.f(0, 360), 50, 40)];
  const awnings = ["", ""];
  let last = -1;
  const glows: number[] = [];
  for (let x = x0; x < w;) {
    const cols = g.i(2, 5);
    const bw = cols * tw;
    const rows = g.i(3, maxRows);
    const top = base - rows * th - th * 0.3;
    const style = g.i(0, 1);
    // No two neighbors share a color.
    const color = (last + g.i(1, 2)) % 3;
    last = color;
    facades[color] += s`M${x} ${top}h${bw}V${base}h${-bw}Z`;
    panes[style] += s`M${x} ${top + th * 0.3}h${bw}V${base - th}h${-bw}Z`;
    const [wx, wy, ww, wh] = shapes[style];
    for (let row = 1; row < rows; row++)
      for (let c = 0; c < cols; c++)
        if (g.chance((night ? 0.25 : 0.18) / wide))
          lit += s`M${x + (c + wx) * tw} ${base - (row + 1) * th + wy * th}h${ww * tw}v${wh * th}h${-ww * tw}Z`;
    // A shop front, lit most of the time, under an awning.
    if (g.chance(0.55)) {
      const sx = x + tw * 0.3;
      const sw = bw - tw * 0.6;
      shops += s`M${sx} ${base - th * 0.85}h${sw}v${th * 0.85}h${-sw}Z`;
      awnings[g.i(0, 1)] +=
        s`M${sx - tw * 0.1} ${base - th * 0.9}h${sw + tw * 0.2}l${tw * 0.1} ${th * 0.2}h${-sw - tw * 0.4}Z`;
      glows.push(sx + sw / 2, sw);
    }
    x += bw;
  }
  facades.forEach((d, k) => (scene += d ? el("path", { d, fill: walls[k] }) : ""));
  panes.forEach((d, k) => (scene += d ? el("path", { d, fill: `url(#${grids[k]})` }) : ""));
  scene += el("path", { d: lit, fill: warm });
  if (shops) scene += el("path", { d: shops, fill: warm, opacity: "0.85" });
  awnings.forEach((d, k) => (scene += d ? el("path", { d, fill: awningColors[k] }) : ""));
  defs.push(el("g", { id: view }, scene));
  out += el("use", { href: `#${view}` });
  // The wet road mirrors the street, and the sidewalk catches a little of it too.
  out += el("rect", { y: base, width: w, height: h - base, fill: hsl(hue, 15, night ? 12 : 22) });
  out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * base})`, opacity: "0.4" });
  out += el("rect", { y: base, width: w, height: curb - base, fill: hsl(hue, 10, night ? 24 : 34), opacity: "0.85" });
  out += el("rect", { y: curb - unit * 0.006, width: w, height: unit * 0.006, fill: "#fff", opacity: "0.2" });
  // Streak reflections of the shops and lamps on the wet road, all sharing one gradient down the road;
  // street lamps along the curb, each with a glow and a pool of light.
  const fall = (h - curb) * 0.85;
  let streaks = "";
  for (let k = 0; k < glows.length; k += 2)
    streaks += s`M${glows[k] - glows[k + 1] * 0.3} ${curb}h${glows[k + 1] * 0.6}v${fall}h${-glows[k + 1] * 0.6}Z`;
  const lamps = Math.max(1, Math.round(w / (unit * g.f(0.7, 1) * wide)));
  const lampXs: number[] = [];
  const pole = hsl(hue, 15, 10);
  let poles = "";
  let pools = "";
  let bulbs = "";
  let halos = "";
  for (let k = 0; k < lamps; k++) {
    const lx = (w * (k + g.f(0.3, 0.7))) / lamps;
    lampXs.push(lx);
    const ly = curb - unit * 0.015;
    const lh = Math.min(unit * g.f(0.32, 0.4), ly * 0.75);
    const u = unit;
    streaks += s`M${lx - u * 0.04} ${curb}h${u * 0.08}v${fall}h${-u * 0.08}Z`;
    pools += s`M${lx - u * 0.1} ${ly}a${u * 0.1} ${u * 0.02} 0 1 0 ${u * 0.2} 0a${u * 0.1} ${u * 0.02} 0 1 0 ${-u * 0.2} 0`;
    poles += s`M${lx - u * 0.005} ${ly}v${-lh}h${u * 0.01}v${lh}Z
               M${lx - u * 0.025} ${ly - lh + u * 0.012}L${lx - u * 0.012} ${ly - lh - u * 0.025}H${lx + u * 0.012}L${lx + u * 0.025} ${ly - lh + u * 0.012}Z`;
    bulbs += s`M${lx - u * 0.016} ${ly - lh}h${u * 0.032}v${u * 0.012}h${-u * 0.032}Z`;
    halos += el("circle", { cx: lx, cy: ly - lh, r: u * 0.12, fill: `url(#${lamp})` });
  }
  out += el("path", { d: streaks, fill: `url(#${streak})`, opacity: "0.7" });
  out += el("path", { d: pools, fill: warm, opacity: "0.2" });
  out += el("path", { d: poles, fill: pole }) + halos + el("path", { d: bulbs, fill: hsl(48, 100, 85) });
  // Someone walking under an umbrella, kept clear of the lamps.
  const person = g.chance(0.7);
  let px = w * g.f(0.2, 0.8);
  const ph = unit * g.f(0.14, 0.17);
  for (const lx of lampXs) if (Math.abs(px - lx) < ph * 0.6) px = lx + (px < lx ? -1 : 1) * ph * 0.6;
  const py = base + (curb - base) * 0.65;
  if (person) {
    const dark = hsl(hue, 20, 8);
    const dir = g.pick([-1, 1]);
    let fig = facing(px, dir);
    fig += el("ellipse", { cx: px, cy: py, rx: ph * 0.18, ry: ph * 0.025, fill: "#000", opacity: "0.3" });
    fig += el("path", {
      d: s`M${px - ph * 0.04} ${py - ph * 0.35}L${px - ph * 0.07} ${py}M${px + ph * 0.04} ${py - ph * 0.35}L${px + ph * 0.09} ${py}`,
      stroke: dark,
      "stroke-width": ph * 0.05,
      "stroke-linecap": "round",
    });
    fig += el("polygon", {
      points: pts([
        [px - ph * 0.07, py - ph * 0.76],
        [px + ph * 0.07, py - ph * 0.76],
        [px + ph * 0.1, py - ph * 0.3],
        [px - ph * 0.1, py - ph * 0.3],
      ]),
      fill: dark,
    });
    fig += el("circle", { cx: px + ph * 0.01, cy: py - ph * 0.84, r: ph * 0.065, fill: dark });
    // The arm up to the handle, and the umbrella over the head.
    const ux = px + ph * 0.06;
    const uy = py - ph * 1.04;
    const ur = ph * 0.34;
    fig += el("path", {
      d: s`M${px + ph * 0.04} ${py - ph * 0.72}L${ux} ${py - ph * 0.6}M${ux} ${py - ph * 0.6}V${uy}`,
      stroke: dark,
      "stroke-width": ph * 0.03,
      "stroke-linecap": "round",
    });
    let rim = "";
    for (let k = 0; k < 4; k++) {
      const a = ux - ur + (k * ur) / 2;
      rim += s`Q${a + ur / 4} ${uy - ur * 0.08} ${a + ur / 2} ${uy}`;
    }
    fig += el("path", {
      d:
        s`M${ux - ur} ${uy}A${ur} ${ur * 0.75} 0 0 1 ${ux + ur} ${uy}` +
        rim.replace(/^Q/, "L" + s`${ux + ur} ${uy}Q`) +
        "Z",
      fill: hsl(g.f(0, 360), 60, night ? 42 : 48),
    });
    out += fig + "</g>";
  }
  // Rain, and rings where it lands on the road.
  let rain = "";
  const slant = g.f(-0.3, 0.3);
  for (let k = Math.round(g.i(20, 28) / Math.min(wide, 1.3)); k > 0; k--) {
    const len = unit * g.f(0.04, 0.07);
    rain += s`M${w * g.f(0, 1)} ${h * g.f(-0.05, 1)}l${len * slant} ${len}`;
  }
  out += el("path", { d: rain, stroke: "#fff", "stroke-width": unit * 0.003, opacity: "0.35" });
  let rings = "";
  for (let k = g.i(2, 4); k > 0; k--) {
    const r = unit * g.f(0.015, 0.03);
    const x = w * g.f(0, 1);
    const y = curb + (h - curb) * g.f(0.15, 0.95);
    rings += s`M${x - r} ${y}a${r} ${r * 0.3} 0 1 0 ${2 * r} 0a${r} ${r * 0.3} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: rings, fill: "none", stroke: "#fff", "stroke-width": unit * 0.003, opacity: "0.25" });
  note.alt(
    `A city street in the rain ${night ? "at night" : "at dusk"}, lit windows mirrored in the wet road${person ? ", someone walking under an umbrella" : ""}`,
  );
  if (person) note.focus(px, py - ph * 0.6);
  else note.focus(lampXs[0], curb - unit * 0.3);
  return el("defs", {}, ...defs) + out;
});

/** A tent beside a campfire under mountains or tall pines, at dusk or on a starry night. */
export const campsite = defineKind("campsite", "Campsite", (g, w, h, note) => {
  const night = g.chance(0.55);
  const backdrop = g.pick(["mountains", "pines"] as const);
  const unit = Math.min(w, h);
  const hue = g.f(220, 250);
  const skyId = g.id("sky");
  const fireGlow = g.id("glow");
  const lantern = g.id("lantern");
  const stops = night
    ? [hsl(hue, 50, 8), hsl(hue + 10, 40, 20)]
    : [hsl(g.f(235, 260), 35, 28), hsl(g.f(300, 330), 30, 46), hsl(g.f(18, 32), 75, 66)];
  let out = el(
    "defs",
    {},
    lin(skyId, stops),
    glowDef(fireGlow, hsl(30, 100, 60), 0.45),
    glowDef(lantern, hsl(42, 100, 70), 0.5),
  );
  out += fill(w, h, `url(#${skyId})`);
  const groundY = h * g.f(0.62, 0.7);
  out += starDots(g, w, groundY * (night ? 0.8 : 0.4), night ? g.i(30, 45) : g.i(4, 8), unit);
  if (night && g.chance(0.6)) {
    // A crescent moon.
    const mx = w * g.f(0.1, 0.9);
    const my = groundY * g.f(0.15, 0.3);
    const mr = unit * g.f(0.035, 0.05);
    out += el("path", {
      d: s`M${mx} ${my - mr}A${mr} ${mr} 0 1 0 ${mx} ${my + mr}A${mr * 0.75} ${mr} 0 1 1 ${mx} ${my - mr}Z`,
      fill: hsl(50, 60, 90),
    });
  }
  const shade = (k: number) => (night ? hsl(hue, 25, 18 - 5 * k) : hsl(hue + 20, 20, 34 - 7 * k));
  if (backdrop === "mountains") {
    // Two dark ranges behind the camp.
    for (let range = 0; range < 2; range++) {
      const amp = groundY * (0.5 - 0.15 * range);
      const steps = g.i(3, 5);
      const ridge: Point[] = [[0, groundY - amp * g.f(0.2, 0.5)]];
      for (let step = 1; step < steps * 2; step++) {
        const x = (w * step) / (steps * 2) + g.f(-0.25, 0.25) * (w / (steps * 2));
        ridge.push([x, groundY - amp * (step % 2 ? g.f(0.6, 1) : g.f(0.15, 0.4))]);
      }
      ridge.push([w, groundY - amp * g.f(0.2, 0.5)], [w, groundY + 1], [0, groundY + 1]);
      out += el("polygon", { points: pts(ridge), fill: shade(range) });
    }
  } else {
    // Two rows of pines along the edge of the clearing.
    for (let row = 0; row < 2; row++) {
      let trees = "";
      for (
        let x = g.f(-0.02, 0.02) * w;
        x < w * 1.02;
        x += unit * g.f(0.05, 0.09) * Math.sqrt(Math.max(1, w / h / 1.4))
      ) {
        const ht = groundY * (row ? g.f(0.3, 0.45) : g.f(0.45, 0.6));
        // Two tiers, drawn relative to keep the path short.
        const a = ht * 0.22;
        trees += s`M${x - a} ${groundY + 1}l${a * 0.62} ${-ht * 0.5}h${-a * 0.24}l${a * 0.62} ${-ht * 0.5}
                   l${a * 0.62} ${ht * 0.5}h${-a * 0.24}l${a * 0.62} ${ht * 0.5}Z`;
      }
      out += el("path", { d: trees, fill: shade(row) });
    }
  }
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(g.f(90, 140), 25, night ? 15 : 24) });
  // Where the tent and fire stand.
  const tw = unit * g.f(0.3, 0.38);
  const th = tw * g.f(0.6, 0.72);
  const side = g.pick([-1, 1]);
  const pc = w * g.f(0.42, 0.58);
  // The tent's far side runs back away from the fire, so keep it and the fire inside the picture.
  const margin = unit * 0.04;
  const reach = tw / 2 + tw * 0.45;
  const tx = Math.max(
    side > 0 ? reach + margin : tw / 2 + margin,
    Math.min(side > 0 ? w - tw * 1.2 - margin : w - reach - margin, pc - side * tw * 0.4),
  );
  const ty = groundY + (h - groundY) * g.f(0.3, 0.45);
  const fx = tx + side * tw * 1.05;
  const fy = Math.min(ty + unit * g.f(0.03, 0.06), h - unit * 0.06);
  out += el("circle", { cx: fx, cy: fy - unit * 0.05, r: unit * 0.5, fill: `url(#${fireGlow})` });
  // The tent: its side running back away from the fire, then the front with its door.
  const away = -side;
  const ex = tx + (away * tw) / 2;
  const dd = tw * 0.45;
  const dz = tw * 0.12;
  const canvas = hsl(g.f(0, 360), g.f(45, 65), night ? 36 : 42);
  out += el("ellipse", {
    cx: tx + away * dd * 0.5,
    cy: ty,
    rx: tw * 0.8,
    ry: tw * 0.07,
    fill: "#000",
    opacity: "0.25",
  });
  out += el("polygon", {
    points: pts([
      [ex, ty],
      [tx, ty - th],
      [tx + away * dd, ty - th - dz],
      [ex + away * dd, ty - dz],
    ]),
    fill: canvas,
  });
  out += el("polygon", {
    points: pts([
      [ex, ty],
      [tx, ty - th],
      [tx + away * dd, ty - th - dz],
      [ex + away * dd, ty - dz],
    ]),
    fill: "#000",
    opacity: "0.3",
  });
  const front = pts([
    [tx - tw / 2, ty],
    [tx, ty - th],
    [tx + tw / 2, ty],
  ]);
  out += el("polygon", { points: front, fill: canvas });
  out += el("polygon", { points: front, fill: hsl(35, 100, 60), opacity: "0.15" });
  const lit = g.chance(0.5);
  if (lit) out += el("circle", { cx: tx, cy: ty - th * 0.3, r: tw * 0.5, fill: `url(#${lantern})` });
  out += el("polygon", {
    points: pts([
      [tx - tw * 0.17, ty],
      [tx, ty - th * 0.72],
      [tx + tw * 0.17, ty],
    ]),
    fill: lit ? hsl(42, 90, 66) : hsl(hue, 30, 10),
  });
  // Guy lines out to pegs.
  out += el("path", {
    d: s`M${tx} ${ty - th}L${tx - tw * 0.75} ${ty + unit * 0.005}M${tx} ${ty - th}L${tx + tw * 0.75} ${ty + unit * 0.005}`,
    stroke: "#fff",
    "stroke-width": unit * 0.003,
    opacity: "0.35",
  });
  // A log to sit on, beyond the fire.
  const seat = g.chance(0.5) && fx + side * unit * 0.2 > unit * 0.05 && fx + side * unit * 0.2 < w - unit * 0.05;
  if (seat) {
    const sx = fx + side * unit * 0.14;
    out += el("rect", {
      x: sx - unit * 0.06,
      y: fy - unit * 0.035,
      width: unit * 0.12,
      height: unit * 0.03,
      rx: unit * 0.015,
      fill: hsl(25, 35, 24),
    });
  }
  // The fire: a ring of stones, crossed logs, flames and sparks.
  const fr = unit * g.f(0.05, 0.065);
  out += el("ellipse", { cx: fx, cy: fy, rx: fr * 1.3, ry: fr * 0.3, fill: "#000", opacity: "0.3" });
  out += el("path", {
    d: s`M${fx - fr} ${fy - fr * 0.05}L${fx + fr * 0.8} ${fy - fr * 0.4}M${fx + fr} ${fy - fr * 0.05}L${fx - fr * 0.8} ${fy - fr * 0.4}`,
    stroke: hsl(25, 40, 22),
    "stroke-width": fr * 0.25,
    "stroke-linecap": "round",
  });
  const flame = (lean: number, ht: number, r: number) =>
    s`M${fx - r} ${fy - fr * 0.2}Q${fx - r} ${fy - ht * 0.5} ${fx + lean} ${fy - ht}Q${fx + r} ${fy - ht * 0.5} ${fx + r} ${fy - fr * 0.2}Z`;
  const fh = fr * g.f(2, 2.6);
  out += el("path", { d: flame(g.f(-0.2, 0.2) * fr, fh, fr * 0.7), fill: hsl(18, 100, 55) });
  out += el("path", { d: flame(g.f(-0.2, 0.2) * fr, fh * 0.7, fr * 0.48), fill: hsl(35, 100, 60) });
  out += el("path", { d: flame(0, fh * 0.4, fr * 0.26), fill: hsl(50, 100, 78) });
  let stones = "";
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (k / 6);
    const x = fx - Math.cos(a) * fr * 1.1;
    const y = fy - fr * 0.05 + Math.sin(a) * fr * 0.25;
    const r = fr * 0.22;
    stones += s`M${x - r} ${y}a${r} ${r * 0.7} 0 1 0 ${2 * r} 0a${r} ${r * 0.7} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: stones, fill: hsl(hue, 8, night ? 32 : 40) });
  let sparks = "";
  for (let k = g.i(3, 6); k > 0; k--) {
    const r = unit * 0.004;
    const x = fx + fr * g.f(-0.8, 0.8);
    const y = fy - fh * g.f(1.1, 2);
    sparks += s`M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  out += el("path", { d: sparks, fill: hsl(45, 100, 75) });
  // Tall pines framing the camp at the edges, left out where one would hide the tent or the fire.
  const campLeft = Math.min(tx - tw / 2 - (away < 0 ? dd : 0), fx - fr * 1.5);
  const campRight = Math.max(tx + tw / 2 + (away > 0 ? dd : 0), fx + fr * 1.5);
  for (const edge of [-1, 1]) {
    if (g.chance(0.45)) continue;
    const x = edge < 0 ? w * g.f(0, 0.08) : w * g.f(0.92, 1);
    const ht = Math.min(h * 0.85, unit * g.f(0.55, 0.75));
    if (x + ht * 0.21 > campLeft && x - ht * 0.21 < campRight) continue;
    out += pine(x, groundY + (h - groundY) * g.f(0.2, 0.4), ht, ht * 0.42, hsl(hue, 25, night ? 6 : 12));
  }
  note.alt(
    `A tent beside a campfire ${backdrop === "mountains" ? "below mountains" : "among tall pines"} ${night ? "on a starry night" : "at dusk"}`,
  );
  note.focus(fx, fy - fh * 0.5);
  return out;
});

/** Rice terraces stepping down a hillside, their paddies flooded with sky or planted with young rice. */
export const terraces = defineKind("terraces", "Rice terraces", (g, w, h, note) => {
  const time = g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const dim = sky.dim;
  const crest = h * g.f(0.24, 0.34);
  let defs = lin(skyId, sky.stops);
  let out = fill(w, h, `url(#${skyId})`);
  out += el("circle", {
    cx: w * g.f(0.15, 0.85),
    cy: time === "day" ? crest * g.f(0.25, 0.5) : crest * g.f(0.6, 0.8),
    r: unit * g.f(0.04, 0.06),
    fill: sky.sun,
  });
  // Misty ranges behind the hill.
  for (let range = 0; range < 2; range++) {
    const foot = crest + h * 0.05;
    const amp = crest * (0.75 - 0.25 * range);
    const steps = g.i(3, 5);
    const ridge: Point[] = [[0, foot - amp * g.f(0.2, 0.5)]];
    for (let step = 1; step < steps * 2; step++) {
      const x = (w * step) / (steps * 2) + g.f(-0.25, 0.25) * (w / (steps * 2));
      ridge.push([x, foot - amp * (step % 2 ? g.f(0.6, 1) : g.f(0.2, 0.45))]);
    }
    ridge.push([w, foot - amp * g.f(0.2, 0.5)], [w, foot], [0, foot]);
    out += el("polygon", { points: pts(ridge), fill: hsl(sky.hue + 10, 16, 74 - 10 * range + dim) });
  }
  // The wooded top of the hill.
  const green = g.f(85, 115);
  const top = curve(w, crest + h * g.f(0, 0.06), crest + h * g.f(0, 0.06), -h * g.f(0.02, 0.06));
  let woods = tight(top.d()) + s`V${h}H0Z`;
  // Wider apart on wide pictures, to keep the markup small.
  const apart = Math.sqrt(Math.max(1, w / h / 1.4));
  for (let x = g.f(0, 0.03) * w; x < w; x += unit * g.f(0.05, 0.08) * apart) {
    const r = unit * g.f(0.03, 0.045) * Math.min(apart, 1.4);
    woods += s`M${x - r} ${top.at(x) + r * 0.5}a${r} ${r} 0 1 1 ${2 * r} 0Z`;
  }
  out += el("path", { d: woods, fill: hsl(green + 20, 35, 28 + dim) });
  // The terraces follow the hill's contours: they bulge toward the viewer around a spur, and back
  // into a gully if there is one, with both drifting sideways down the slope. Closer steps are taller.
  const count = g.i(6, 8);
  const ratio = g.f(1.08, 1.2);
  const y0 = top.at(w / 2) + unit * 0.05;
  let sum = 0;
  for (let k = 0; k < count; k++) sum += ratio ** k;
  const spur = w * g.f(0.25, 0.75);
  const spread = w * g.f(0.18, 0.32);
  const features = [{ c: spur, spread, sign: 1, size: g.f(0.35, 0.55), drift: w * g.f(-0.25, 0.25) }];
  if (g.chance(0.6))
    features.push({
      c: spur + (spur < w / 2 ? 1 : -1) * w * g.f(0.32, 0.45),
      spread: w * g.f(0.15, 0.28),
      sign: -1,
      size: g.f(0.25, 0.45),
      drift: w * g.f(-0.25, 0.25),
    });
  const tilt = h * g.f(-0.08, 0.08);
  const season = g.pick(["water", "planted", "mixed", "mixed"] as const);
  // Flooded paddies hold the sky: its warm colors at dawn and dusk, blue and silver by day.
  const water =
    time === "day"
      ? [hsl(sky.hue, 42, 76), hsl(sky.hue - 8, 16, 84)]
      : [hsl(g.f(18, 34), time === "dawn" ? 45 : 55, time === "dawn" ? 82 : 66), hsl(sky.hue, 14, 72 + dim)];
  const earth = hsl(g.f(22, 36), 30, 30 + dim);
  const lip = hsl(green - 5, 40, 40 + dim);
  const dots = g.id("seedlings");
  const dw = unit * 0.028;
  defs += el(
    "pattern",
    { id: dots, patternUnits: "userSpaceOnUse", width: dw, height: dw * 0.7 },
    el("path", {
      d: s`M${dw * 0.25} ${dw * 0.17}h0M${dw * 0.75} ${dw * 0.52}h0`,
      stroke: hsl(green + 15, 50, 30 + dim),
      "stroke-width": unit * 0.009,
      "stroke-linecap": "round",
    }),
  );
  const hutAt = g.chance(0.5) ? g.i(1, 3) : -1;
  let hut: Point = [spur, y0];
  let y = y0;
  let prev: Point[] = [];
  for (let k = 0; k < count; k++) {
    const step = ((h * 1.03 - y0) / sum) * ratio ** k;
    const depth = (y - y0) / (h - y0);
    const lift = (y - top.at(w / 2)) / h;
    const line: Point[] = [];
    for (let j = 0; j <= 10; j++) {
      const x = -0.05 * w + (1.1 * w * j) / 10;
      let yy = y + tilt * (x / w - 0.5) * lift;
      for (const f of features)
        yy += f.sign * f.size * (y - y0) * Math.exp(-(((x - f.c - f.drift * depth) / f.spread) ** 2));
      // Never closer than a third of a step to the terrace above.
      if (prev.length) yy = Math.max(yy, prev[j][1] + step * 0.35);
      line.push([x, yy]);
    }
    prev = line;
    let d = s`M${line[0][0]} ${line[0][1]}`;
    for (let j = 1; j < line.length - 1; j++) {
      const next = lerp(line[j], line[j + 1], 0.5);
      d += s`Q${line[j][0]} ${line[j][1]} ${next[0]} ${next[1]}`;
    }
    d += s`L${line[10][0]} ${line[10][1]}V${h + unit}H${line[0][0]}Z`;
    const at = (x: number) => along(line, x);
    const id = g.id(`step${k}`);
    defs += el("path", { id, d });
    const riser = step * g.f(0.18, 0.26);
    const flooded = season === "water" || (season === "mixed" && g.chance(0.55));
    out += el("use", {
      href: `#${id}`,
      fill: flooded ? water[g.i(0, 1)] : hsl(green + g.f(-10, 10), 52, 46 + g.f(-4, 4) + dim),
    });
    out += flooded
      ? // A glint off the water.
        el("use", {
          href: `#${id}`,
          fill: "none",
          stroke: "#fff",
          "stroke-width": unit * 0.004,
          opacity: "0.5",
          transform: s`translate(0 ${riser * 2.2 + step * 0.15})`,
        })
      : // Rows of seedlings.
        el("use", { href: `#${id}`, fill: `url(#${dots})` });
    // The earthen bank down from this terrace's edge, and the grassy lip along the edge.
    out += el("use", {
      href: `#${id}`,
      fill: "none",
      stroke: earth,
      "stroke-width": riser,
      transform: s`translate(0 ${riser / 2})`,
    });
    out += el("use", { href: `#${id}`, fill: "none", stroke: lip, "stroke-width": unit * 0.008 });
    if (k === hutAt) {
      // A small thatched hut on the edge of the terrace above.
      const hx = spur + spread * g.f(0.4, 0.8) * g.pick([-1, 1]);
      const hy = at(hx) + unit * 0.004;
      const hw = unit * g.f(0.06, 0.08);
      hut = [hx, hy];
      out += el("rect", {
        x: hx - hw / 2,
        y: hy - hw * 0.55,
        width: hw,
        height: hw * 0.55,
        fill: hsl(30, 30, 42 + dim),
      });
      out += el("rect", {
        x: hx - hw * 0.1,
        y: hy - hw * 0.4,
        width: hw * 0.2,
        height: hw * 0.4,
        fill: hsl(25, 30, 18),
      });
      out += el("polygon", {
        points: pts([
          [hx - hw * 0.72, hy - hw * 0.45],
          [hx, hy - hw * 1.15],
          [hx + hw * 0.72, hy - hw * 0.45],
        ]),
        fill: hsl(40, 40, 52 + dim),
      });
    }
    y += step;
  }
  const look =
    season === "water"
      ? "their flooded paddies mirroring the sky"
      : season === "planted"
        ? "planted with young rice"
        : "some paddies flooded, some planted";
  note.alt(`Rice terraces stepping down a hillside${hutAt >= 0 ? " past a small hut" : ""}, ${look}, ${AT[time]}`);
  if (hutAt >= 0) note.focus(hut[0], hut[1] - unit * 0.04);
  else note.focus(spur, y0 + (h - y0) * 0.3);
  return el("defs", {}, defs) + out;
});

/** A small boat on the water with its waterline at (x, y), `len` long and facing `dir`. */
function boat(g: Rand, x: number, y: number, len: number, dir: number, hull: string): string {
  const ht = len * 0.13;
  let body = el("path", {
    d: s`M${x - len * 0.5} ${y - ht * 1.35}Q${x - len * 0.42} ${y} ${x - len * 0.2} ${y}L${x + len * 0.38} ${y}
         Q${x + len * 0.48} ${y - ht * 0.3} ${x + len * 0.5} ${y - ht}Z`,
    fill: hull,
  });
  body += el("path", {
    d: s`M${x - len * 0.5} ${y - ht * 1.35}L${x + len * 0.5} ${y - ht}`,
    stroke: "#fff",
    "stroke-width": ht * 0.25,
    opacity: "0.5",
  });
  const kind = g.i(0, 2);
  if (kind === 0) {
    // A canopy over the middle.
    const cy = y - ht * 1.15;
    body += el("path", {
      d: s`M${x - len * 0.2} ${cy}V${cy - ht * 1.5}M${x + len * 0.2} ${cy}V${cy - ht * 1.5}`,
      stroke: hsl(0, 0, 20),
      "stroke-width": ht * 0.15,
    });
    body += el("rect", {
      x: x - len * 0.26,
      y: cy - ht * 1.8,
      width: len * 0.52,
      height: ht * 0.4,
      rx: ht * 0.15,
      fill: hsl(g.f(0, 360), 40, 85),
    });
  } else if (kind === 1) {
    // Someone sitting at the stern.
    const px = x + len * 0.22;
    const py = y - ht * 1.1;
    body += el("rect", {
      x: px - ht * 0.4,
      y: py - ht * 1.3,
      width: ht * 0.8,
      height: ht * 1.4,
      rx: ht * 0.3,
      fill: hsl(g.f(0, 360), 35, 35),
    });
    body += el("circle", { cx: px, cy: py - ht * 1.7, r: ht * 0.4, fill: hsl(25, 35, 55) });
  }
  const out = el("g", { transform: s`matrix(1 0 0 -1 0 ${2 * y})`, opacity: "0.25" }, body) + body;
  return facing(x, dir) + out + "</g>";
}

/** Narrow gabled houses along a city canal, a little arched bridge, boats and reflections. */
export const canal = defineKind("canal", "Canal houses", (g, w, h, note) => {
  const time = g.chance(0.6) ? "day" : g.pick(TIMES);
  const sky = daySky(g, time);
  const unit = Math.min(w, h);
  const dim = sky.dim;
  const skyId = g.id("sky");
  const view = g.id("view");
  const stretch = Math.max(1, w / (unit * 0.15 * 11));
  const base = h * g.f(0.5, 0.56);
  const waterY = base + unit * g.f(0.045, 0.06);
  let scene = el("rect", { width: w, height: waterY, fill: `url(#${skyId})` });
  if (time !== "day" || g.chance(0.6))
    scene += el("circle", {
      cx: w * g.f(0.1, 0.9),
      cy: base * (time === "day" ? g.f(0.15, 0.3) : g.f(0.35, 0.5)),
      r: unit * g.f(0.04, 0.06),
      fill: sky.sun,
    });
  // The gap for the side canal and its bridge.
  const gw = unit * g.f(0.24, 0.32) * Math.sqrt(stretch);
  const gx = w * g.f(0.3, 0.7);
  // Houses far down the side canal, pale with distance.
  let far = "";
  for (let x = gx - gw / 2; x < gx + gw / 2;) {
    const fw = gw * g.f(0.18, 0.3);
    const fh = base * g.f(0.18, 0.3);
    far += s`M${x} ${base}V${base - fh}l${fw / 2} ${-fw * 0.5}l${fw / 2} ${fw * 0.5}V${base}Z`;
    x += fw;
  }
  scene += el("path", { d: far, fill: hsl(sky.hue + 10, 14, 66 + dim) });
  // The houses.
  const lit = time !== "day";
  const glass = hsl(210, 22, 26 + dim / 2);
  const glow = hsl(45, 95, 70);
  const frame = "#f4f1ea";
  let panes = "";
  let shine = "";
  let doors = "";
  let cornices = "";
  for (let x = -unit * g.f(0, 0.08); x < w;) {
    const hw = unit * g.f(0.12, 0.16) * stretch;
    if (x + hw > gx - gw / 2 && x < gx + gw / 2) {
      x = gx + gw / 2;
      continue;
    }
    const hh = Math.min(unit * g.f(0.28, 0.42) * Math.min(stretch, 1.4), base - hw * 0.6 - unit * 0.03);
    const yt = base - hh;
    const gable = g.pick(["point", "step", "neck", "flat"] as const);
    const outline: Point[] =
      gable === "point"
        ? [
            [x + hw / 2, yt - hw * 0.5],
            [x + hw, yt],
          ]
        : gable === "step"
          ? [0.15, 0.3, 0.42, 0.58, 0.7, 0.85].flatMap((f, j): Point[] => {
              const up = (j < 3 ? j + 1 : 6 - j) * hw * 0.13;
              const was = (j < 3 ? j : 7 - j) * hw * 0.13;
              return [
                [x + hw * f, yt - was],
                [x + hw * f, yt - up],
              ];
            })
          : gable === "neck"
            ? [
                [x + hw * 0.22, yt - hw * 0.08],
                [x + hw * 0.22, yt - hw * 0.38],
                [x + hw * 0.5, yt - hw * 0.55],
                [x + hw * 0.78, yt - hw * 0.38],
                [x + hw * 0.78, yt - hw * 0.08],
                [x + hw, yt],
              ]
            : [[x + hw, yt]];
    const color = g.pick([
      hsl(g.f(0, 22), 45, 42 + dim / 2),
      hsl(g.f(30, 50), 45, 72 + dim / 2),
      hsl(g.f(180, 220), 28, 55 + dim / 2),
      hsl(g.f(90, 140), 22, 52 + dim / 2),
      hsl(g.f(340, 360), 35, 60 + dim / 2),
      hsl(g.f(15, 30), 30, 30 + dim / 2),
    ]);
    scene += el("path", { d: s`M${x} ${base}V${yt}L` + pts(outline).replace(/,/g, " ") + s`V${base}Z`, fill: color });
    if (gable === "flat")
      cornices += s`M${x - unit * 0.004} ${yt - unit * 0.012}h${hw + unit * 0.008}v${unit * 0.016}h${-hw - unit * 0.008}Z`;
    // Windows floor by floor, a door at the bottom, and one in the gable.
    const cols = hw > unit * 0.15 ? 3 : 2;
    const floors = Math.max(2, Math.min(4, Math.round((hh * 0.78) / (unit * 0.08))));
    const fl = (hh * 0.8) / floors;
    const ww = hw / (cols * 2);
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < cols; c++) {
        const r = s`M${x + ww * (0.5 + 2 * c)} ${yt + hh * 0.05 + fl * (f + 0.2)}h${ww}v${fl * 0.6}h${-ww}Z`;
        if (lit && g.chance(0.4)) shine += r;
        else panes += r;
      }
    if (gable !== "flat")
      panes += s`M${x + hw / 2 - ww * 0.4} ${yt - hw * 0.25}h${ww * 0.8}v${hw * 0.16}h${-ww * 0.8}Z`;
    const dx = x + hw * g.f(0.15, 0.6);
    doors += s`M${dx} ${base}v${-hh * 0.15}h${hw * 0.22}v${hh * 0.15}Z`;
    x += hw;
  }
  if (cornices) scene += el("path", { d: cornices, fill: frame });
  scene += el("path", { d: panes, fill: glass, stroke: frame, "stroke-width": unit * 0.004 });
  if (shine) scene += el("path", { d: shine, fill: glow, stroke: frame, "stroke-width": unit * 0.004 });
  scene += el("path", { d: doors, fill: hsl(g.f(0, 360), 35, 24) });
  // The quay wall, and the bridge humped over the side canal with water showing under its arch.
  const stone = hsl(g.f(15, 35), 18, 44 + dim);
  scene += el("rect", { y: base, width: w, height: waterY - base, fill: stone });
  scene += el("rect", { y: base, width: w, height: unit * 0.008, fill: "#fff", opacity: "0.25" });
  const hump = unit * g.f(0.03, 0.05);
  const bl = gx - gw / 2 - unit * 0.01;
  const br = gx + gw / 2 + unit * 0.01;
  scene += el("path", {
    d: s`M${bl} ${waterY}V${base}Q${gx} ${base - hump * 2} ${br} ${base}V${waterY}Z`,
    fill: hsl(g.f(0, 20), 35, 38 + dim),
  });
  const ow = gw * g.f(0.5, 0.65);
  scene += el("path", {
    d: s`M${gx - ow / 2} ${waterY}A${ow / 2} ${waterY - base + hump * 0.4} 0 0 1 ${gx + ow / 2} ${waterY}Z`,
    fill: hsl(sky.hue, 30, 22 + dim / 2),
  });
  // A railing along the deck.
  const rail = (t: number) => qpt([bl, base], [gx, base - hump * 2], [br, base], t);
  let posts = "";
  for (let k = 0; k <= 8; k++) {
    const [px, py] = rail(k / 8);
    posts += s`M${px} ${py}v${-unit * 0.03}`;
  }
  const [r0, r1] = [rail(0), rail(1)];
  posts += s`M${r0[0]} ${r0[1] - unit * 0.03}Q${gx} ${base - hump * 2 - unit * 0.03} ${r1[0]} ${r1[1] - unit * 0.03}`;
  scene += el("path", { d: posts, fill: "none", stroke: hsl(0, 0, 20), "stroke-width": unit * 0.005 });
  let out = el("defs", {}, lin(skyId, sky.stops), el("g", { id: view }, scene));
  out += fill(w, h, hsl(sky.hue - 10, 35, 32 + dim));
  out += el("use", { href: `#${view}` });
  out += el("use", { href: `#${view}`, transform: s`matrix(1 0 0 -1 0 ${2 * waterY})`, opacity: "0.6" });
  out += el("rect", {
    y: waterY,
    width: w,
    height: h - waterY,
    fill: hsl(sky.hue - 10, 40, 30 + dim),
    opacity: "0.35",
  });
  let ripples = "";
  for (let k = g.i(5, 9); k > 0; k--) {
    const y = waterY + (h - waterY) * g.f(0.05, 0.95);
    ripples += s`M${w * g.f(-0.1, 0.95)} ${y}h${w * g.f(0.05, 0.2)}`;
  }
  out += el("path", { d: ripples, stroke: "#fff", "stroke-width": Math.max(1, unit * 0.005), opacity: "0.3" });
  // Boats: one moored at the quay, sometimes another out on the water.
  const len = unit * g.f(0.22, 0.3);
  const hull = () => g.pick([hsl(g.f(200, 230), 40, 30), hsl(g.f(0, 15), 50, 38), hsl(130, 25, 28), hsl(30, 35, 30)]);
  const mx = gx + g.pick([-1, 1]) * (gw / 2 + len * g.f(0.7, 1.2));
  const moored = Math.max(len * 0.6, Math.min(w - len * 0.6, mx));
  out += boat(g, moored, waterY + unit * 0.05, len, g.pick([-1, 1]), hull());
  const second = g.chance(0.55);
  if (second) {
    const bx = moored < w / 2 ? w * g.f(0.6, 0.85) : w * g.f(0.15, 0.4);
    out += boat(g, bx, waterY + (h - waterY) * g.f(0.55, 0.75), len * 1.15, g.pick([-1, 1]), hull());
  }
  const when = time === "day" ? "on a sunny day" : time === "dawn" ? "at dawn" : "at dusk, windows lit";
  note.alt(
    `Tall narrow houses along a canal with a little arched bridge and ${second ? "boats" : "a moored boat"}, ${when}`,
  );
  note.focus(gx, base - hump);
  return out;
});
