import { defineKind, el, facing, fill, hsl, lin, pts, s } from "../../draw/core";
import { glowDef } from "./shared";

/**
 * A city street in the rain: lit windows over a wet road that mirrors them, street lamps glowing.
 *
 * @category Landscapes
 */
export const rainyStreet = /* @__PURE__ */ defineKind("rainy-street", "Rainy street", (g, w, h, note) => {
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
