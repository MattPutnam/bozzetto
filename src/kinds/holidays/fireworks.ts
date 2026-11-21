import { defineKind, el, fill, hex, lin, type Point, type Rand, s } from "../../draw/core";
import { compact, glow, pen, penDots, spread } from "./shared";

/** Round-capped strokes as one path. */
const strokes = (d: string, paint: string, width: number, opacity = "1"): string =>
  d ? el("path", { d, stroke: paint, "stroke-width": width, "stroke-linecap": "round", fill: "none", opacity }) : "";

type Style = "peony" | "willow" | "ring" | "crossette" | "crackle";

/**
 * One burst, drawn around the origin, `r` across each way, in its main and second colors. Smaller,
 * farther bursts have fewer sparks (`detail` below 1), which keeps the markup small.
 */
function burst(g: Rand, style: Style, r: number, main: string, second: string, detail: number): string {
  const some = (lo: number, hi: number) => Math.round(g.f(lo, hi) * detail);
  const gold = hex(g.f(38, 48), 90, 66);
  const spark = hex(50, 100, 94);
  // Sparks fall a little as they fly, more the farther they go.
  const fall = r * g.f(0.08, 0.16);
  const at = (a: number, d: number): Point => [Math.cos(a) * d, Math.sin(a) * d + fall * (d / r) ** 2];
  let out = "";
  if (style === "peony") {
    const count = some(16, 26);
    const streaks = g.chance(0.6);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const tips: Point[] = [];
    const inner: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2 + g.f(-0.08, 0.08);
      const len = r * g.f(0.82, 1);
      if (streaks) {
        const [x0, y0] = at(a, len * 0.3);
        const [x1, y1] = at(a, len * 0.9);
        d.M(x0, y0).L(x1, y1);
      } else for (const t of [0.45, 0.68]) inner.push(at(a, len * t));
      tips.push(at(a, len));
    }
    out += strokes(d.d, main, r * 0.03, "0.75");
    out += penDots(inner, r * 0.025, main, "0.8");
    out += penDots(tips, r * 0.04, g.chance(0.4) ? second : main);
    // A small bright heart of another color, sometimes.
    if (g.chance(0.5)) {
      const heart: Point[] = [];
      for (let k = 0; k < 9; k++) heart.push(at(turn + (k / 9) * Math.PI * 2, r * 0.26));
      out += penDots(heart, r * 0.03, second);
    }
  } else if (style === "willow") {
    // Long trails arching out and hanging down, with glitter at their ends.
    const count = some(12, 18);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const ends: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2 + g.f(-0.1, 0.1);
      const len = r * g.f(0.75, 0.95);
      const cx = Math.cos(a) * len;
      const cy = Math.sin(a) * len * 0.8 - r * 0.15;
      const ex = cx * 0.85;
      const ey = cy * 0.5 + r * g.f(0.55, 0.8);
      d.M(0, 0).Q(cx, cy, ex, ey);
      ends.push([ex, ey], [(cx + ex) / 2, (cy + ey) / 2 + r * 0.05]);
    }
    out += strokes(d.d, gold, r * 0.022, "0.7");
    out += penDots(ends, r * 0.022, spark, "0.9");
  } else if (style === "ring") {
    const count = some(22, 32);
    const ry = g.f(0.4, 1);
    const tilt = g.f(0, Math.PI);
    const ring: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2;
      const x = Math.cos(a) * r * 0.9;
      const y = Math.sin(a) * r * 0.9 * ry;
      ring.push([x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    out += penDots(ring, r * 0.04, main);
    // A little peony at its middle.
    const core: Point[] = [];
    for (let k = 0; k < 8; k++) core.push(at((k / 8) * Math.PI * 2, r * 0.22));
    out += penDots(core, r * 0.03, second);
  } else if (style === "crossette") {
    // Stars that fly out and split into crosses.
    const count = g.i(5, 7);
    const turn = g.f(0, Math.PI * 2);
    const d = pen(true);
    const split = pen(true);
    const tips: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = turn + (k / count) * Math.PI * 2;
      const [x0, y0] = at(a, r * 0.1);
      const [x1, y1] = at(a, r * 0.55);
      d.M(x0, y0).L(x1, y1);
      // Four short pieces, drawn as two vees through the split point.
      const ends = [-0.8, -0.27, 0.27, 0.8].map((b): Point => [
        x1 + Math.cos(a + b) * r * 0.4,
        y1 + Math.sin(a + b) * r * 0.4 + fall * 0.5,
      ]);
      split
        .M(...ends[0])
        .L(x1, y1)
        .L(...ends[1])
        .M(...ends[2])
        .L(x1, y1)
        .L(...ends[3]);
      tips.push(...ends);
    }
    out += strokes(d.d, main, r * 0.025, "0.6");
    out += strokes(split.d, second, r * 0.02, "0.75");
    out += penDots(tips, r * 0.032, spark);
  } else {
    // Glitter crackling all through a loose round cloud.
    const count = some(30, 44);
    const glitter: Point[] = [];
    const big: Point[] = [];
    for (let k = 0; k < count; k++) {
      const a = g.f(0, Math.PI * 2);
      const p = at(a, r * Math.sqrt(g.f(0.04, 1)));
      (k % 3 ? glitter : big).push(p);
    }
    out += penDots(glitter, r * 0.022, spark, "0.9");
    out += penDots(big, r * 0.04, main);
  }
  return out;
}

/** Fireworks bursting in a night sky over a city skyline, a harbor or wooded hills. */
export const fireworks = /* @__PURE__ */ defineKind("fireworks", "Fireworks", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(222, 262);
  const skyId = g.id("sky");
  const place = g.pick(["city", "harbor", "hills", "lake"] as const);
  const water = place === "harbor" || place === "lake";
  // Colors: a set of three that agree, or a mix of bright hues.
  const set = g.pick(["mixed", "mixed", "trio", "gold", "near"] as const);
  const startHue = g.f(0, 360);
  const colors =
    set === "trio"
      ? [hex(g.f(350, 362), 85, 62), hex(0, 0, 96), hex(g.f(212, 226), 85, 66)]
      : set === "gold"
        ? [hex(g.f(40, 48), 90, 64), hex(48, 70, 90), hex(g.f(28, 36), 90, 62)]
        : set === "near"
          ? [0, 1, 2].map(k => hex(startHue + k * 35, 85, 64))
          : [0, 1, 2, 3].map(k => hex(startHue + k * g.f(70, 110), 85, 64));
  const glows = colors.map((c, k) => glow(g.id(`glow${k}`), c, 0.35));
  const night = hex(skyHue, 45, 8);
  let defs = lin(skyId, [night, hex(skyHue, 40, 16), hex(skyHue + 15, 35, 26)]) + glows.join("");
  let out = fill(w, h, `url(#${skyId})`);

  // The ground or waterline, and how high the skyline or hills reach above it.
  const line = water ? h - unit * g.f(0.17, 0.23) : h - unit * g.f(0.02, 0.05);
  const rise = unit * (place === "city" || place === "harbor" ? 0.2 : 0.14);
  // A few faint stars.
  const stars: Point[] = [];
  for (let k = Math.round((w / unit) ** 0.6 * g.f(6, 10)); k > 0; k--) stars.push([g.f(0, w), g.f(0, line - rise)]);
  out += penDots(stars, unit * 0.004, hex(skyHue, 40, 90), "0.6");

  // The bursts, biggest first so they get the best places, then drawn far to near.
  const count = Math.min(6, Math.round((w / unit) * g.f(1.3, 1.7) + 1.4));
  type B = { x: number; y: number; r: number; style: Style; main: number; second: number };
  const bursts: B[] = [];
  const placed: [number, number, number][] = [];
  const top = unit * 0.04;
  const bottom = line - rise * 0.9;
  const styles: Style[] = ["peony", "peony", "willow", "ring", "crossette", "crackle"];
  for (let k = 0; k < count; k++) {
    const big = k === 0 ? g.f(0.27, 0.33) : k < Math.max(3, count / 2) ? g.f(0.16, 0.24) : g.f(0.1, 0.15);
    const r = Math.min(unit * big, (bottom - top) * 0.48);
    const [x, y] = spread(g, placed, r * 0.8, r, w - r, top + r, Math.max(top + r, bottom - r), 14);
    const main = g.i(0, colors.length - 1);
    bursts.push({
      x,
      y,
      r,
      // Crackle reads best small: a big one is just a cloud of dots.
      style: r > unit * 0.2 ? g.pick(styles.slice(0, -1)) : g.pick(styles),
      main,
      second: g.chance(0.6) ? (main + 1) % colors.length : main,
    });
  }
  bursts.sort((a, b) => a.r - b.r);
  // Long pictures have more bursts, each with a few fewer sparks.
  const spare = Math.min(1, 1.1 * (unit / Math.max(w, h)) ** 0.3);
  // Faint smoke drifting behind them.
  let smoke = "";
  for (const b of bursts.slice(-3)) {
    const sx = Math.round(b.x + b.r * g.f(-0.6, 0.6));
    const sy = Math.round(b.y + b.r * g.f(0.3, 0.8));
    const sr = Math.round(b.r * g.f(0.6, 1));
    const sh = Math.round(sr * 0.4);
    smoke += `M${sx - sr} ${sy}a${sr} ${sh} 0 1 0 ${sr * 2} 0a${sr} ${sh} 0 1 0 ${-sr * 2} 0`;
  }
  let show = el("path", { d: smoke, fill: hex(skyHue, 20, 60), opacity: "0.08" });
  for (const b of bursts) {
    const far = b.r < unit * 0.15;
    const color = colors[b.main];
    // The glow behind it, fainter for far bursts so they don't turn to smudges.
    show += el("circle", {
      cx: Math.round(b.x),
      cy: Math.round(b.y),
      r: Math.round(b.r * (far ? 1.1 : 1.3)),
      fill: `url(#${g.id(`glow${b.main}`)})`,
      opacity: far ? "0.6" : false,
    });
    const inner = burst(g, b.style, b.r, color, colors[b.second], Math.min(1, 0.3 + b.r / (unit * 0.4)) * spare);
    show += el(
      "g",
      { transform: `translate(${Math.round(b.x)} ${Math.round(b.y)})`, opacity: far ? "0.75" : false },
      inner,
    );
  }
  // A rocket or two still climbing, a faint trail below each.
  let trail = "";
  const heads: Point[] = [];
  for (let k = g.i(1, 2); k > 0; k--) {
    const x0 = g.f(0.1, 0.9) * w;
    const x1 = x0 + unit * g.f(-0.06, 0.06);
    const y1 = g.f(line - rise - unit * 0.25, line - rise - unit * 0.05);
    const len = unit * g.f(0.25, 0.4);
    trail += s`M${x0} ${y1 + len}Q${x0} ${y1 + len * 0.4} ${x1} ${y1}`;
    heads.push([x1, y1]);
  }
  show += strokes(trail, hex(40, 80, 70), unit * 0.006, "0.5");
  show += penDots(heads, unit * 0.008, hex(50, 100, 94));
  const showId = g.id("show");
  out += el("g", { id: showId }, show);

  // The water, with the show mirrored in it and broken up by ripples.
  if (water) {
    const waterId = g.id("water");
    const clipId = g.id("clip");
    defs += lin(waterId, [hex(skyHue, 40, 18), hex(skyHue, 45, 8)]);
    defs += el("clipPath", { id: clipId }, el("rect", { y: line, width: w, height: h - line }));
    out += el("rect", { y: line, width: w, height: h - line, fill: `url(#${waterId})` });
    const k = 0.45;
    out += el(
      "g",
      { "clip-path": `url(#${clipId})`, opacity: "0.45" },
      el("use", { href: `#${showId}`, transform: s`translate(0 ${line * (1 + k)})scale(1 -${k})` }),
    );
    // Each row is one dashed line, started at a different place so the dashes don't line up.
    let ripples = "";
    for (let y = line + unit * 0.012; y < h; y += unit * g.f(0.014, 0.026))
      ripples += s`M${-unit * g.f(0, 0.4)} ${y}H${w}`;
    const dash = [0.09, 0.05, 0.14, 0.04, 0.05, 0.07].map(v => Math.round(unit * v * g.f(0.7, 1.3))).join(" ");
    out += el("path", {
      d: ripples,
      stroke: hex(skyHue, 40, 10),
      "stroke-width": unit * 0.008,
      "stroke-dasharray": dash,
      opacity: "0.6",
    });
  }

  // The skyline or hills, dark against the sky.
  const dark = hex(skyHue, 30, 6);
  let what: string;
  if (place === "city" || place === "harbor") {
    // Written as relative steps in whole pixels, to keep it short.
    let cx = 0;
    let cy = Math.round(line);
    let d = `M0 ${cy}`;
    const V = (y: number) => {
      d += `v${Math.round(y) - cy}`;
      cy = Math.round(y);
    };
    const H = (x: number) => {
      d += `h${Math.round(x) - cx}`;
      cx = Math.round(x);
    };
    const lit: Point[] = [];
    for (let x = -g.f(0, unit * 0.05); x < w;) {
      const bw = unit * g.f(0.05, 0.11);
      const bh = rise * g.f(0.3, 1);
      const y = line - bh;
      V(y);
      if (g.chance(0.15)) {
        // A spire or a stepped top.
        H(x + bw * 0.4);
        V(y - bh * 0.25);
        H(x + bw * 0.6);
        V(y);
      }
      H(x + bw);
      // Some lit windows in rows.
      for (let wy = y + unit * 0.02; wy < line - unit * 0.015; wy += unit * 0.025)
        for (let wx = x + bw * 0.25; wx < x + bw * 0.8; wx += bw * 0.25) if (g.chance(0.08)) lit.push([wx, wy]);
      x += bw + (g.chance(0.2) ? unit * g.f(0.01, 0.03) : 0);
      if (x < w && g.chance(0.2)) V(line - rise * 0.15);
    }
    d += s`V${water ? line : h}H0Z`;
    out += el("path", { d, fill: dark });
    out += penDots(lit, unit * 0.005, hex(42, 80, 72), "0.75");
    what = water ? "over a harbor, reflected in the water" : "over a city skyline at night";
  } else {
    // A rolling hill, with a row of pines in front of it.
    const far = hex(skyHue, 28, 11);
    const ya = line - rise * g.f(0.4, 0.7);
    const yb = line - rise * g.f(0.4, 0.7);
    out += el("path", {
      d: s`M0 ${ya}Q${w * g.f(0.3, 0.7)} ${line - rise * 1.1} ${w} ${yb}V${water ? line : h}H0Z`,
      fill: far,
    });
    const pines = pen(true).M(0, line);
    for (let x = 0; x < w;) {
      const pw = unit * g.f(0.025, 0.045);
      const ph = rise * g.f(0.3, 0.75);
      pines.L(x + pw, line - ph).L(x + pw * 2, line - rise * 0.12);
      x += pw * 2;
    }
    out += el("path", { d: pines.d + s`L${w} ${line}V${water ? line : h}H0Z`, fill: dark });
    what = water ? "over a lake below a line of pines, reflected in the water" : "over wooded hills at night";
  }

  const main = bursts[bursts.length - 1];
  const willow = bursts.some(b => b.style === "willow" && b.r > unit * 0.15);
  note.alt(`${willow && g.chance(0.5) ? "A fireworks show with a drooping willow" : "Fireworks bursting"} ${what}`);
  note.focus(main.x, main.y);
  return compact(el("defs", {}, defs) + out);
});
