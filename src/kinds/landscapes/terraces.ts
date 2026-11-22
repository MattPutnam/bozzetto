import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { along, AT, curve, daySky, lerp, tight, TIMES } from "./shared";

/**
 * Rice terraces stepping down a hillside, their paddies flooded with sky or planted with young rice.
 *
 * @category Landscapes
 */
export const terraces = /* @__PURE__ */ defineKind("terraces", "Rice terraces", (g, w, h, note) => {
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
