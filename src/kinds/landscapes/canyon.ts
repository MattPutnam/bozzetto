import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { AT, daySky, lerp, TIMES } from "./shared";

/**
 * A desert canyon seen from its floor: stepped walls banded with rock, overlapping as they recede, and a river or a dry wash between.
 *
 * @category Landscapes
 */
export const canyon = /* @__PURE__ */ defineKind("canyon", "Desert canyon", (g, w, h, note) => {
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
