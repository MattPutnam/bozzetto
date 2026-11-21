import { defineKind, el, hash, hex, hsl, lin, mix, pts, s, type Point, type Rand } from "./core";
import { andList, capitalize, numberWord } from "./words";

/** A tennis ball seen from above at (x, y), radius r, with its shadow falling down and to the right. */
function tennisBall(g: Rand, x: number, y: number, r: number, paint: string): string {
  const turn = g.f(0, 360);
  return (
    el("circle", {
      cx: x + r * 0.28,
      cy: y + r * 0.34,
      r: r * 1.02,
      fill: "#000",
      opacity: 0.22,
    }) +
    el("circle", { cx: x, cy: y, r, fill: paint }) +
    el("path", {
      d: s`M${x - r * 0.95} ${y - r * 0.3}Q${x - r * 0.05} ${y + r * 0.1} ${x - r * 0.3} ${y + r * 0.95}
           M${x + r * 0.3} ${y - r * 0.95}Q${x + r * 0.05} ${y - r * 0.1} ${x + r * 0.95} ${y + r * 0.3}`,
      fill: "none",
      stroke: "#ffffff",
      "stroke-width": r * 0.13,
      "stroke-linecap": "round",
      opacity: 0.85,
      transform: s`rotate(${turn} ${x} ${y})`,
    }) +
    el("path", {
      d: s`M${x - r * 0.7} ${y + r * 0.7}A${r} ${r} 0 0 0 ${x + r * 0.7} ${y - r * 0.7}A${r * 1.1} ${r * 1.1} 0 0 1 ${x - r * 0.7} ${y + r * 0.7}Z`,
      fill: "#000",
      opacity: 0.12,
    }) +
    el("circle", {
      cx: x - r * 0.38,
      cy: y - r * 0.4,
      r: r * 0.28,
      fill: "#ffffff",
      opacity: 0.28,
    })
  );
}

/** The shapes of a tennis racket lying along +x, centered on (0, 0), `len` long from the butt cap to the tip. */
function racketShape(len: number) {
  const hx = len * 0.27;
  const rx = len * 0.23;
  const ry = len * 0.175;
  const bar = len * 0.03;
  // Where the hoop meets the throat, and where the throat arms meet the shaft.
  const a = (145 * Math.PI) / 180;
  const ax = hx + rx * Math.cos(a);
  const ay = ry * Math.sin(a);
  const sx = -len * 0.13;
  const sy = len * 0.014;
  const frame = s`M${sx} ${-sy}Q${-len * 0.02} ${-len * 0.05} ${ax} ${-ay}A${rx} ${ry} 0 1 1 ${ax} ${ay}
                  Q${-len * 0.02} ${len * 0.05} ${sx} ${sy}`;
  const bridge = s`M${ax} ${-ay}Q${ax + len * 0.035} 0 ${ax} ${ay}`;
  const shaft = s`M${sx + bar * 0.3} ${-sy - bar * 0.3}L${-len * 0.235} ${-len * 0.022}V${len * 0.022}
                  L${sx + bar * 0.3} ${sy + bar * 0.3}Z`;
  const grip = {
    x: -len * 0.49,
    y: -len * 0.026,
    width: len * 0.27,
    height: len * 0.052,
    rx: len * 0.01,
  };
  return { hx, rx, ry, bar, ax, frame, bridge, shaft, grip };
}

/** A tennis racket lying flat: frame, open throat, strings, a wrapped grip and a butt cap, along +x around (0, 0). */
function racket(len: number, frame: string, grip: string, strings: string, guard: boolean): string {
  const r = racketShape(len);
  let out = "";
  // The string bed inside the hoop and the bridge, filled with the string grid.
  const ix = r.rx - r.bar * 0.4;
  const iy = r.ry - r.bar * 0.4;
  const from = r.ax + len * 0.02;
  const yb = iy * Math.sqrt(1 - ((from - r.hx) / ix) ** 2);
  out += el("path", { d: s`M${from} ${-yb}A${ix} ${iy} 0 1 1 ${from} ${yb}Z`, fill: strings });
  // The frame: hoop, throat arms and bridge, then the shaft into the handle.
  const line = {
    fill: "none",
    stroke: frame,
    "stroke-width": r.bar,
    "stroke-linejoin": "round",
  };
  out += el("path", { d: r.frame, ...line });
  out += el("path", { d: r.bridge, ...line, "stroke-width": r.bar * 0.8 });
  out += el("path", { d: r.shaft, fill: frame });
  // A light line along one side of the hoop, and a bumper guard over the tip.
  out += el("path", {
    d: s`M${r.hx - r.rx * 0.5} ${-r.ry * 0.87}A${r.rx} ${r.ry} 0 0 1 ${r.hx + r.rx * 0.6} ${-r.ry * 0.8}`,
    fill: "none",
    stroke: "#ffffff",
    opacity: 0.22,
    "stroke-width": r.bar * 0.25,
  });
  if (guard)
    out += el("path", {
      d: s`M${r.hx + r.rx * 0.77} ${-r.ry * 0.64}A${r.rx} ${r.ry} 0 0 1 ${r.hx + r.rx * 0.77} ${r.ry * 0.64}`,
      fill: "none",
      stroke: "#000",
      opacity: 0.3,
      "stroke-width": r.bar * 0.9,
    });
  // The grip, its spiral wrap, a collar where it meets the shaft, and the butt cap.
  out += el("rect", { ...r.grip, fill: grip });
  let wrap = "";
  for (let x = r.grip.x + len * 0.02; x < r.grip.x + r.grip.width - len * 0.01; x += len * 0.03)
    wrap += s`M${x} ${r.grip.y}l${len * 0.016} ${r.grip.height}`;
  out += el("path", {
    d: wrap,
    stroke: "#000",
    opacity: 0.16,
    "stroke-width": Math.max(0.5, len * 0.005),
  });
  out += el("rect", {
    x: -len * 0.23,
    y: -len * 0.027,
    width: len * 0.02,
    height: len * 0.054,
    fill: frame,
  });
  out += el("rect", {
    x: -len * 0.5,
    y: -len * 0.031,
    width: len * 0.024,
    height: len * 0.062,
    rx: len * 0.008,
    fill: frame,
  });
  out += el("rect", {
    x: -len * 0.5,
    y: -len * 0.031,
    width: len * 0.024,
    height: len * 0.062,
    rx: len * 0.008,
    fill: "#000",
    opacity: 0.2,
  });
  return out;
}

/** A racket's soft shadow on the ground below it, in the same frame as `racket`. */
function racketShadow(len: number): string {
  const r = racketShape(len);
  const line = { fill: "none", stroke: "#000", "stroke-width": r.bar };
  return (
    el("ellipse", {
      cx: r.hx,
      cy: 0,
      rx: r.rx,
      ry: r.ry,
      fill: "#000",
      opacity: 0.25,
    }) +
    el("path", { d: r.frame, ...line }) +
    el("path", { d: r.shaft, fill: "#000" }) +
    el("rect", { ...r.grip, fill: "#000" })
  );
}

interface Lie {
  x: number;
  y: number;
  /** Degrees; 0 points the head along +x. */
  turn: number;
}

/** One or two tennis rackets and some balls, a close still life seen from above, on a court, a bench or a towel. */
export const tennis = defineKind("tennis", "Tennis", (g, w, h, note) => {
  // Lay everything out on a landscape canvas, turning it a quarter turn for tall pictures.
  const tall = h > w;
  const W = tall ? h : w;
  const H = tall ? w : h;
  const ar = W / H;
  const place = g.pick(["hard", "hard", "clay", "clay", "grass", "bench", "towel"] as const);
  const court = place === "bench" ? "hard" : place === "towel" ? g.pick(["hard", "clay", "grass"] as const) : place;
  // The layout, in racket lengths around (0, 0).
  const layout =
    ar > 2.6
      ? g.pick(["one", "inline", "inline"] as const)
      : ar > 1.6
        ? g.pick(["one", "one", "pair", "cross"] as const)
        : g.pick(["one", "pair", "cross", "cross"] as const);
  const lies: Lie[] = [];
  if (layout === "one") lies.push({ x: 0, y: 0, turn: g.chance(0.5) ? 0 : 180 });
  else if (layout === "inline") {
    const dy = g.f(0.05, 0.1);
    lies.push({ x: -0.42, y: -dy, turn: 180 }, { x: 0.42, y: dy, turn: 0 });
  } else if (layout === "pair") {
    const dy = g.f(0.12, 0.18);
    const dx = g.f(-0.08, 0.08);
    lies.push({ x: dx, y: -dy, turn: 0 }, { x: -dx, y: dy, turn: 180 });
  } else {
    // Crossed at the shafts, the heads spread apart.
    const spread = g.f(16, 28);
    const dir = g.chance(0.5) ? 0 : 180;
    for (const t of [dir - spread, dir + spread]) {
      const a = (t * Math.PI) / 180;
      lies.push({ x: 0.17 * Math.cos(a), y: 0.17 * Math.sin(a), turn: t });
    }
  }
  // Tilt the whole group: more on square pictures, hardly at all on very wide ones.
  const tilt = (ar < 1.4 ? g.f(18, 38) : ar < 2.2 ? g.f(0, 16) : g.f(0, 4)) * (g.chance(0.5) ? 1 : -1);
  const tr = (tilt * Math.PI) / 180;
  const rot = ([x, y]: Point): Point => [x * Math.cos(tr) - y * Math.sin(tr), x * Math.sin(tr) + y * Math.cos(tr)];
  for (const lie of lies) {
    [lie.x, lie.y] = rot([lie.x, lie.y]);
    lie.turn += tilt;
  }
  // Points along each racket, for fitting and for keeping balls clear of it.
  const outline = (lie: Lie): Point[] => {
    const a = (lie.turn * Math.PI) / 180;
    const at = (u: number, v: number): Point => [
      lie.x + u * Math.cos(a) - v * Math.sin(a),
      lie.y + u * Math.sin(a) + v * Math.cos(a),
    ];
    const out: Point[] = [at(-0.5, -0.03), at(-0.5, 0.03)];
    for (let k = 0; k < 12; k++)
      out.push(at(0.27 + 0.245 * Math.cos((k * Math.PI) / 6), 0.19 * Math.sin((k * Math.PI) / 6)));
    return out;
  };
  const clear = (x: number, y: number, r: number) =>
    lies.every(lie => {
      const a = (lie.turn * Math.PI) / 180;
      const u = (x - lie.x) * Math.cos(a) + (y - lie.y) * Math.sin(a);
      const v = -(x - lie.x) * Math.sin(a) + (y - lie.y) * Math.cos(a);
      const head = ((u - 0.27) / (0.245 + r)) ** 2 + (v / (0.19 + r)) ** 2 > 1;
      const handle = u > 0.1 || u < -0.5 - r || Math.abs(v) > 0.05 + r;
      return head && handle;
    });
  // The balls: maybe one resting in the strings, the rest on the ground beside the rackets, sometimes touching.
  const br = 0.05;
  const balls: Point[] = [];
  const top = lies[lies.length - 1];
  const onStrings = g.chance(0.25);
  if (onStrings) {
    const a = (top.turn * Math.PI) / 180;
    const u = g.f(0.24, 0.32);
    balls.push([top.x + u * Math.cos(a), top.y + u * Math.sin(a)]);
  }
  const want = Math.min(onStrings ? 3 : 4, g.pick([1, 1, 1, 2, 2, 3]) + (layout === "inline" || ar > 2.6 ? 1 : 0));
  const spots = outline(lies[0]).concat(...lies.slice(1).map(outline));
  const xs = spots.map(p => p[0]);
  const ys = spots.map(p => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  // Room beside the rackets: wider pictures leave it at the ends, others along the sides.
  const padX = ar > 1.8 ? 0.3 : 0.12;
  const padY = ar > 1.8 ? 0.04 : 0.12;
  for (let tries = 0; tries < 60 && balls.length < want + (onStrings ? 1 : 0); tries++) {
    const last = balls[balls.length - 1];
    let p: Point;
    if (last && !onStrings && g.chance(0.5)) {
      const a = g.f(0, Math.PI * 2);
      p = [last[0] + Math.cos(a) * br * 2.05, last[1] + Math.sin(a) * br * 2.05];
    } else p = [g.f(box[0] - padX, box[2] + padX), g.f(box[1] - padY, box[3] + padY)];
    if (!clear(p[0], p[1], br * 1.15)) continue;
    if (balls.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < br * 2.02)) continue;
    balls.push(p);
  }
  // Fit the whole group to the canvas, filling most of it.
  for (const [x, y] of balls) spots.push([x - br, y - br], [x + br, y + br]);
  const fx = spots.map(p => p[0]);
  const fy = spots.map(p => p[1]);
  const x0 = Math.min(...fx);
  const y0 = Math.min(...fy);
  const bw = Math.max(...fx) - x0;
  const bh = Math.max(...fy) - y0;
  const len = Math.min((W * g.f(0.86, 0.94)) / bw, (H * g.f(0.86, 0.94)) / bh);
  const ox = (W - bw * len) / 2 - x0 * len + g.f(-0.5, 0.5) * Math.max(0, W - bw * len - W * 0.08);
  const oy = (H - bh * len) / 2 - y0 * len + g.f(-0.5, 0.5) * Math.max(0, H - bh * len - H * 0.08);
  const X = (x: number) => ox + x * len;
  const Y = (y: number) => oy + y * len;
  // The surface: painted court lines run in from somewhere, crossing under the gear.
  let out = "";
  const hue = g.f(-6, 6);
  const ground =
    court === "hard"
      ? hsl(g.pick([205, 215, 150, 160, 265]) + hue, g.f(30, 45), g.f(38, 48))
      : court === "clay"
        ? hsl(17 + hue, g.f(50, 62), g.f(50, 56))
        : hsl(100 + hue, 42, g.f(40, 46));
  out += el("rect", { width: W, height: H, fill: ground });
  const cx = W / 2;
  const cy = H / 2;
  const big = Math.hypot(W, H) / 2 + 2;
  const lean = g.f(-30, 30);
  if (court === "grass") {
    // Mowing stripes.
    let d = "";
    const band = len * g.f(0.35, 0.5);
    for (let x = -big; x < big; x += band * 2) d += s`M${cx + x} ${cy - big}h${band}v${big * 2}h${-band}Z`;
    out += el("path", {
      d,
      fill: "#ffffff",
      opacity: 0.06,
      transform: s`rotate(${lean + 90} ${cx} ${cy})`,
    });
  } else if (court === "clay") {
    // Brushed clay: a few faint sweeps.
    let d = "";
    for (let k = 0; k < 6; k++) {
      const x = g.f(0, W);
      const y = g.f(0, H);
      const r = len * g.f(0.15, 0.35);
      d += s`M${x - r} ${y}a${r} ${r * 0.08} 0 1 0 ${r * 2} 0a${r} ${r * 0.08} 0 1 0 ${-r * 2} 0`;
    }
    out += el("path", {
      d,
      fill: "#000",
      opacity: 0.04,
      transform: s`rotate(${lean} ${cx} ${cy})`,
    });
  }
  if (place !== "bench") {
    // One line across, and often a second meeting it: a corner, a T or a center mark.
    const lw = len * (g.chance(0.4) ? 0.12 : 0.075);
    const at = g.f(-0.3, 0.3) * H;
    let d = s`M${cx - big} ${cy + at - lw / 2}h${big * 2}v${lw}h${-big * 2}Z`;
    const second = g.pick(["none", "corner", "tee", "tee"] as const);
    if (second !== "none") {
      const x = cx + g.f(-0.35, 0.35) * W;
      const lw2 = len * 0.075;
      const up = g.chance(0.5);
      const y1 = second === "corner" ? (up ? cy - big : cy + at - lw / 2) : up ? cy - big : cy + at;
      const y2 = second === "corner" ? (up ? cy + at + lw / 2 : cy + big) : up ? cy + at : cy + big;
      d += s`M${x - lw2 / 2} ${y1}H${x + lw2 / 2}V${y2}H${x - lw2 / 2}Z`;
    }
    out += el("path", {
      d,
      fill: "#f7f5ef",
      opacity: court === "hard" ? 0.92 : 0.85,
      transform: s`rotate(${lean} ${cx} ${cy})`,
    });
  }
  if (place === "bench") {
    // Slats of a wooden bench running along the gear, with dark gaps between.
    const wood = g.f(24, 36);
    const slat = len * g.f(0.18, 0.26);
    const gap = len * 0.025;
    const reach = Math.hypot(W, H) / 2 + slat;
    let gaps = "";
    let dark = "";
    let grain = "";
    out += el("rect", { width: W, height: H, fill: hsl(wood, 42, g.f(52, 60)) });
    let odd = false;
    for (let y = -reach + g.f(0, slat); y < reach; y += slat + gap) {
      odd = !odd;
      gaps += s`M${cx - reach} ${cy + y - gap}h${reach * 2}v${gap}h${-reach * 2}Z`;
      if (odd) dark += s`M${cx - reach} ${cy + y}h${reach * 2}v${slat}h${-reach * 2}Z`;
      grain += s`M${cx - reach} ${cy + y + slat * g.f(0.3, 0.7)}h${reach * 2}`;
    }
    out += el(
      "g",
      { transform: s`rotate(${tilt + g.f(-6, 6)} ${cx} ${cy})` },
      el("path", { d: dark, fill: "#000", opacity: 0.06 }),
      el("path", { d: grain, stroke: "#000", opacity: 0.07, "stroke-width": len * 0.008 }),
      el("path", { d: gaps, fill: hsl(wood, 30, 20) }),
    );
  } else if (place === "towel") {
    // A folded towel under the gear, stripes across its ends, its corners on the court.
    const tw = Math.max(bw * len * 0.85, len * 0.9);
    const th = Math.max(bh * len * 0.75, len * 0.5);
    const tx = X(x0 + bw / 2) + g.f(-0.08, 0.08) * len;
    const ty = Y(y0 + bh / 2) + g.f(-0.06, 0.06) * len;
    const cloth = hsl(g.f(0, 360), g.f(25, 55), g.f(68, 82));
    const band = hsl(g.f(0, 360), g.f(40, 60), g.f(38, 50));
    const turn = tilt + g.f(-8, 8);
    out += el("rect", {
      x: tx - tw / 2 + len * 0.02,
      y: ty - th / 2 + len * 0.025,
      width: tw,
      height: th,
      rx: len * 0.02,
      fill: "#000",
      opacity: 0.2,
      transform: s`rotate(${turn} ${tx} ${ty})`,
    });
    const stripes = [0.08, 0.13, 0.87, 0.92]
      .map(t => s`M${tx - tw / 2 + tw * t} ${ty - th / 2}h${tw * 0.03}v${th}h${-tw * 0.03}Z`)
      .join("");
    out += el(
      "g",
      { transform: s`rotate(${turn} ${tx} ${ty})` },
      el("rect", {
        x: tx - tw / 2,
        y: ty - th / 2,
        width: tw,
        height: th,
        rx: len * 0.02,
        fill: cloth,
      }),
      el("path", { d: stripes, fill: band }),
      el("rect", {
        x: tx - tw / 2,
        y: ty - th * 0.02,
        width: tw,
        height: th * 0.04,
        fill: "#000",
        opacity: 0.06,
      }),
    );
  }
  // The rackets, each with its shadow; the later one lies on top.
  // One string grid for every racket: mains along the racket, crosses across it, lined up with its frame.
  const grid = g.id("strings");
  const main = len * 0.019;
  const cross = len * 0.026;
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id: grid, width: cross, height: main, patternUnits: "userSpaceOnUse", y: main / 2 },
      el("path", {
        d: s`M0 0H${cross}M0 0V${main}`,
        stroke: g.pick(["#f4f1e8", "#f4f1e8", hsl(g.f(50, 62), 80, 70), "#3a3c42"]),
        "stroke-width": Math.max(0.6, len * 0.0045) * 2,
      }),
    ),
  );
  const frames = [0, 210, 350, 20, 160, 280, 45].map(f => f + g.f(-8, 8));
  const used = g.i(0, frames.length - 1);
  lies.forEach((lie, k) => {
    const frame = hsl(frames[(used + k * 3) % frames.length], g.f(45, 70), g.f(32, 50));
    const grip = g.pick(["#f1eee6", "#2b2d33", hsl(g.f(0, 360), 40, 50)]);
    const at = s`translate(${X(lie.x)} ${Y(lie.y)}) rotate(${lie.turn})`;
    const shift = s`translate(${X(lie.x) + len * 0.012} ${Y(lie.y) + len * 0.016}) rotate(${lie.turn})`;
    out += el("g", { transform: shift, opacity: 0.22 }, racketShadow(len));
    out += el("g", { transform: at }, racket(len, frame, grip, `url(#${grid})`, g.chance(0.6)));
  });
  const ballPaint = hsl(g.f(62, 72), 85, g.f(56, 62));
  for (const [x, y] of balls) out += tennisBall(g, X(x), Y(y), br * len, ballPaint);
  // The focus: the top racket's head.
  const ta = (top.turn * Math.PI) / 180;
  const focus: Point = [X(top.x + 0.27 * Math.cos(ta)), Y(top.y + 0.27 * Math.sin(ta))];
  if (tall) {
    out = el("g", { transform: s`translate(${w} 0) rotate(90)` }, out);
    note.focus(w - focus[1], focus[0]);
  } else note.focus(...focus);
  const rackets = lies.length === 1 ? "A tennis racket" : "Two tennis rackets";
  const count = balls.length;
  const things = count === 0 ? rackets : `${rackets} and ${count === 1 ? "a ball" : `${numberWord(count)} balls`}`;
  const where =
    place === "bench"
      ? "on a wooden bench"
      : place === "towel"
        ? `on a towel on a ${court} court`
        : `on a ${court === "hard" ? "hard" : court} court`;
  note.alt(capitalize(`${things} ${where}`));
  return out;
});

/** A smooth closed path rounding off the corners of a polygon: curves between edge midpoints. */
function smooth(p: readonly Point[]): string {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${pts([mid(p[p.length - 1], p[0])])}`;
  for (let i = 0; i < p.length; i++) d += `Q${pts([p[i], mid(p[i], p[(i + 1) % p.length])])}`;
  return d + "Z";
}

/** Turns a point by `deg` degrees about the origin. */
function turned([x, y]: Point, deg: number): Point {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Maple boards seen from above, with a little grain, and part of a painted court line sometimes. */
function floor(g: Rand, w: number, h: number, k: number): { out: string; court: boolean } {
  const unit = Math.min(w, h);
  const hue = g.f(28, 38);
  const lightness = g.f(60, 70);
  const base = hex(hue, g.f(45, 58), lightness);
  let out = el("rect", { width: w, height: h, fill: base });
  // A tile of six boards, each its own shade, with an end joint somewhere along it.
  const bw = Math.max(7, 16 * k);
  const len = bw * g.f(9, 13);
  const id = g.id("boards");
  let tile = "";
  let light = "";
  let dark = "";
  let seams = "";
  let grain = "";
  for (let j = 0; j < 6; j++) {
    const x = j * bw;
    const board = s`M${x} 0h${bw}V${len}h${-bw}Z`;
    const tint = g.i(0, 2);
    if (tint === 1) light += board;
    if (tint === 2) dark += board;
    const joint = g.f(0, len);
    seams += s`M${x} 0V${len}M${x} ${joint}h${bw}`;
    const gx = x + bw * g.f(0.2, 0.8);
    grain += s`M${gx} ${g.f(0, len * 0.5)}q${bw * g.f(-0.3, 0.3)} ${len * 0.2} 0 ${len * g.f(0.3, 0.45)}`;
  }
  tile +=
    el("path", { d: light, fill: "#ffffff", opacity: 0.1 }) + el("path", { d: dark, fill: "#5a3410", opacity: 0.1 });
  const thin = Math.max(0.6, bw * 0.06);
  tile += el("path", { d: grain, stroke: "#6b3f15", opacity: 0.16, fill: "none", "stroke-width": thin });
  tile += el("path", { d: seams, stroke: "#4a2a0c", opacity: 0.3, "stroke-width": thin * 1.3 });
  const across = g.chance(0.5);
  out += el(
    "defs",
    {},
    el(
      "pattern",
      {
        id,
        width: bw * 6,
        height: len,
        patternUnits: "userSpaceOnUse",
        patternTransform: across ? "rotate(90)" : undefined,
      },
      tile,
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // The edge of a painted line, near one side so it runs behind the gear, not through its middle.
  const court = g.chance(0.55);
  if (court) {
    const paint = g.pick(["#f6f3ea", "#f6f3ea", hex(g.f(0, 360), 55, 45), "#2b2b2e"]);
    const lw = Math.max(4, 16 * k);
    const along = g.chance(0.5);
    const at = g.pick([g.f(0.04, 0.14), g.f(0.86, 0.96)]);
    const arc = g.chance(0.35);
    let d: string;
    if (arc) {
      // A sweep of a big circle, as the three-point line or the center circle.
      const r = unit * g.f(1.6, 2.4);
      const cx = w * g.f(0.2, 0.8);
      const top = at < 0.5;
      const cy = top ? h * at - r : h * at + r;
      d = s`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
    } else d = along ? s`M${w * at} 0V${h}` : s`M0 ${h * at}H${w}`;
    // Sometimes the area beyond the line is painted too.
    if (!arc && g.chance(0.4)) {
      const zone = hex(g.f(0, 360), g.f(35, 55), g.f(38, 50));
      const r = along
        ? at < 0.5
          ? { x: 0, y: 0, width: w * at, height: h }
          : { x: w * at, y: 0, width: w * (1 - at), height: h }
        : at < 0.5
          ? { x: 0, y: 0, width: w, height: h * at }
          : { x: 0, y: h * at, width: w, height: h * (1 - at) };
      out += el("rect", { ...r, fill: zone, opacity: 0.8 });
    }
    out += el("path", { d, fill: "none", stroke: paint, opacity: 0.88, "stroke-width": lw });
  }
  return { out, court };
}

/** A basketball seen from above at (0, 0), radius 40, with its channels and a shadow. */
function ball(g: Rand): string {
  const r = 40;
  const leather = g.chance(0.8)
    ? hex(g.f(16, 28), g.f(66, 80), g.f(44, 53))
    : hex(g.f(28, 36), g.f(40, 55), g.f(50, 58));
  const channel = darker(leather, g.f(0.7, 0.8));
  const t = g.f(0.15, 0.35);
  const u = g.f(0.1, 0.3);
  let out = el("circle", { cx: 0, cy: 0, r, fill: leather });
  out += el("path", {
    d: s`M${-r} 0A${r} ${r * t} 0 0 0 ${r} 0M0 ${-r}A${r * u} ${r} 0 0 1 0 ${r}
         M${-r * 0.62} ${-r * 0.78}Q${-r * 0.18} 0 ${-r * 0.62} ${r * 0.78}
         M${r * 0.62} ${-r * 0.78}Q${r * 0.18} 0 ${r * 0.62} ${r * 0.78}`,
    transform: s`rotate(${g.f(0, 360)})`,
    fill: "none",
    stroke: channel,
    "stroke-width": r * 0.055,
    "stroke-linecap": "round",
  });
  // Shade on the side away from the light, and a soft highlight.
  out += el("path", {
    d: s`M${-r * 0.75} ${r * 0.66}A${r} ${r} 0 0 0 ${r * 0.75} ${-r * 0.66}A${r * 1.15} ${r * 1.15} 0 0 1 ${-r * 0.75} ${r * 0.66}Z`,
    fill: "#000",
    opacity: 0.16,
  });
  out += el("circle", { cx: -r * 0.36, cy: -r * 0.38, r: r * 0.3, fill: "#ffffff", opacity: 0.16 });
  return out;
}

/** The upper of a right high-top seen from above, toe toward -y, outer side toward +x. */
const UPPER: Point[] = [
  [3, -55],
  [15, -50],
  [20, -38],
  [21, -22],
  [18, -6],
  [17, 12],
  [18, 30],
  [15, 47],
  [6, 55],
  [-5, 55],
  [-14, 48],
  [-17, 32],
  [-14, 14],
  [-15, -2],
  [-19, -20],
  [-17, -40],
  [-10, -51],
];

/** The sole peeks out around the upper, most at the toe. */
const SOLE: Point[] = UPPER.map(([x, y]) => [Math.round(x * 1.13), Math.round(y * 1.05 + 0.5)]);

const STRIPES = ["band", "double", "panel"] as const;

/**
 * A pair of high-top sneakers seen from above, each about 116 long and 46 wide. Returns the markup,
 * the outline of both shoes for layout, and the right shoe drawn once in defs to keep it short.
 */
function sneakers(g: Rand): { out: string; shade: string; hull: Point[] } {
  const hue = g.f(0, 360);
  const style = g.i(0, 2);
  const color = hex(hue, g.f(50, 72), g.f(40, 52));
  const contrast = hex(hue + g.pick([150, 180, 210]), g.f(50, 70), g.f(45, 58));
  const white = "#f3f1ec";
  // Mostly white with color, bold color with white, or dark with a bright stripe.
  const upper = style === 0 ? white : style === 1 ? color : hex(hue, 12, 20);
  const toe = style === 0 ? "#fbfaf7" : style === 1 ? (g.chance(0.5) ? white : darker(color, 0.3)) : hex(hue, 10, 28);
  const stripePaint = style === 0 ? color : style === 1 ? (g.chance(0.5) ? white : contrast) : color;
  const collar = style === 0 ? (g.chance(0.5) ? color : white) : style === 1 ? darker(color, 0.25) : hex(hue, 10, 14);
  const sole = style === 2 && g.chance(0.4) ? "#c8955a" : style === 2 || g.chance(0.85) ? "#fbfaf6" : "#2d2c2e";
  const laces = style === 2 ? g.pick([white, color]) : g.pick([white, white, darker(upper, 0.5)]);
  const stripe = g.pick(STRIPES);
  const soleId = g.id("sole");
  const upperId = g.id("vamp");
  const upperUse = (attrs: Record<string, string | number>): string => el("use", { href: `#${upperId}`, ...attrs });
  const shoe = g.id("shoe");
  const clip = g.id("upper");
  // The shoe itself.
  let body = el("use", { href: `#${soleId}`, fill: sole });
  body += upperUse({ fill: upper });
  // Everything printed or stitched on the upper stays inside its outline.
  let on = el("ellipse", { cx: 0, cy: -46, rx: 27, ry: 20, fill: toe });
  on += el("path", {
    d: "M-24 -36Q0 -18 24 -36",
    fill: "none",
    stroke: darker(toe, 0.25),
    "stroke-width": 1,
    "stroke-dasharray": "2 1.6",
  });
  let holes = "";
  for (let j = -2; j <= 2; j++) holes += s`M${j * 5 - 0.9} ${-42 + Math.abs(j) * 1.2}h1.8`;
  on += el("path", { d: holes, stroke: darker(toe, 0.3), "stroke-width": 1.6, "stroke-linecap": "round" });
  if (stripe === "band") on += el("path", { d: "M30 22L6 -14M-30 22L-6 -14", stroke: stripePaint, "stroke-width": 8 });
  else if (stripe === "double")
    on += el("path", {
      d: "M30 16L8 -14M30 28L8 -4M-30 16L-8 -14M-30 28L-8 -4",
      stroke: stripePaint,
      "stroke-width": 3.6,
    });
  else on += el("path", { d: "M-24 2Q0 -6 24 2V30H-24Z", fill: stripePaint });
  // A heel counter, and shade along the inner edge so the upper looks rounded.
  on += el("ellipse", { cx: 0, cy: 54, rx: 20, ry: 9, fill: darker(collar, 0.1) });
  on += upperUse({ fill: "none", stroke: "#000", opacity: 0.12, "stroke-width": 3 });
  body += el("clipPath", { id: clip }, upperUse({})) + el("g", { "clip-path": `url(#${clip})` }, on);
  // The tongue and the lacing panel.
  const tongue = lighter(upper === white ? "#d9d5cc" : upper, 0.12);
  body += el("rect", { x: -11, y: -26, width: 22, height: 50, rx: 7, fill: darker(upper, 0.1) });
  body += el("rect", { x: -7, y: -24, width: 14, height: 50, rx: 5, fill: tongue });
  // The padded ankle collar, its opening, and the top of the tongue standing up in it.
  // It stands up toward us, so it looks a little wider than the heel below it.
  body += el("rect", { x: -4, y: 48, width: 8, height: 12, rx: 2.5, fill: stripePaint });
  body += el("ellipse", { cx: 0, cy: 34, rx: 19.5, ry: 20, fill: collar });
  body += el("ellipse", {
    cx: 0,
    cy: 34,
    rx: 15,
    ry: 15.5,
    fill: "none",
    stroke: darker(collar, 0.2),
    "stroke-width": 0.9,
    "stroke-dasharray": "2 1.5",
  });
  body += el("ellipse", { cx: 0, cy: 37, rx: 10, ry: 11.5, fill: "#211d1b" });
  body += el("ellipse", { cx: 0, cy: 42, rx: 6.5, ry: 5.5, fill: "#3a3330" });
  body += el("path", { d: "M-7 24Q0 18 7 24L6 30Q0 27 -6 30Z", fill: tongue });
  // Laces crossing between two rows of eyelets, tied in a bow near the collar.
  const lace = "M-9.5 -20L9.5 -13L-9.5 -6L9.5 1L-9.5 8L9.5 15M9.5 -20L-9.5 -13L9.5 -6L-9.5 1L9.5 8L-9.5 15";
  body += el("path", {
    d: "M-9.8 -20V15M9.8 -20V15",
    stroke: darker(upper, 0.45),
    "stroke-width": 3,
    "stroke-linecap": "round",
    "stroke-dasharray": "0 7",
  });
  body += el("path", {
    d: lace,
    fill: "none",
    stroke: laces,
    "stroke-width": 2.4,
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  });
  body += el("path", {
    d: "M0 17C-5 12 -11 14 -8 18C-6 21 -2 19 0 17C5 12 11 14 8 18C6 21 2 19 0 17M0 17L-4 27M0 17L5 26",
    fill: "none",
    stroke: laces,
    "stroke-width": 2,
    "stroke-linecap": "round",
  });
  // Light along the outer side of the toe.
  body += el("path", { d: "M-12 -46Q-2 -54 10 -48", fill: "none", stroke: "#ffffff", opacity: 0.3, "stroke-width": 3 });
  // The pair, a little apart and not quite in line, toes turned slightly out or in.
  const stagger = g.f(-12, 12);
  const apart = g.f(26, 31);
  const splay = g.f(-7, 9);
  const right = { x: apart, y: stagger / 2, turn: splay };
  const left = { x: -apart, y: -stagger / 2, turn: -splay + g.f(-4, 4) };
  let out = el(
    "defs",
    {},
    el("path", { id: soleId, d: smooth(SOLE) }),
    el("path", { id: upperId, d: smooth(UPPER) }),
    el("g", { id: shoe }, body),
  );
  let shade = "";
  const hull: Point[] = [];
  for (const [p, flip] of [
    [left, true],
    [right, false],
  ] as const) {
    const tf = s`translate(${p.x} ${p.y}) rotate(${p.turn})${flip ? " scale(-1 1)" : ""}`;
    shade += el("use", { href: `#${soleId}`, transform: tf });
    out += el("use", { href: `#${shoe}`, transform: tf });
    for (const q of SOLE) {
      const [x, y] = turned([flip ? -q[0] : q[0], q[1]], p.turn);
      hull.push([x + p.x, y + p.y]);
    }
  }
  return { out, shade, hull };
}

/** A tank-top jersey's outline laid flat, about 150 wide and 180 tall, neck toward -y. */
const JERSEY = "M-22 -88Q0 -36 22 -88H42C43 -58 49 -34 66 -28L70 86Q0 94 -70 86L-66 -28C-49 -34 -43 -58 -42 -88Z";
const NECK = "M-22 -88Q0 -36 22 -88";
const ARMS = "M42 -88C43 -58 49 -34 66 -28M-42 -88C-43 -58 -49 -34 -66 -28";

/** Which of the seven segments (top, upper right, lower right, bottom, lower left, upper left, middle) light up each digit. */
const DIGITS = [
  "1111110",
  "0110000",
  "1101101",
  "1111001",
  "0110011",
  "1011011",
  "1011111",
  "1110000",
  "1111111",
  "1111011",
];

/** A number as blocky seven-segment strokes, centered on (0, cy), each digit dw wide and dh tall. */
function numberPath(n: number, cy: number, dw: number, dh: number): string {
  const digits = String(n).split("").map(Number);
  const gap = dw * 0.55;
  const total = digits.length * dw + (digits.length - 1) * gap;
  let d = "";
  for (const [j, digit] of digits.entries()) {
    const x = -total / 2 + j * (dw + gap);
    const y = cy - dh / 2;
    const segs = [
      s`M${x} ${y}h${dw}`,
      s`M${x + dw} ${y}v${dh / 2}`,
      s`M${x + dw} ${y + dh / 2}v${dh / 2}`,
      s`M${x} ${y + dh}h${dw}`,
      s`M${x} ${y + dh / 2}v${dh / 2}`,
      s`M${x} ${y}v${dh / 2}`,
      s`M${x} ${y + dh / 2}h${dw}`,
    ];
    for (const [i, on] of DIGITS[digit].split("").entries()) if (on === "1") d += segs[i];
  }
  return d;
}

/** A basketball jersey laid flat, seen from above: trim round the neck and arms, side panels and a big number. */
function jersey(g: Rand): { out: string; number: number } {
  const hue = g.f(0, 360);
  const home = g.chance(0.3);
  const paint = home ? "#f4f2ec" : hex(hue, g.f(50, 72), g.f(36, 52));
  const trim = home
    ? hex(hue, g.f(55, 70), g.f(36, 48))
    : g.pick(["#f4f2ec", hex(hue + g.pick([150, 180, 40]), 65, 58)]);
  const edge = g.pick([trim, home ? darker(trim, 0.35) : "#f4f2ec"]);
  const number = g.chance(0.25) ? g.i(0, 9) : g.i(10, 99);
  let out = el("path", { d: JERSEY, fill: paint });
  // Side panels from the underarms down.
  if (g.chance(0.6))
    out += el("path", { d: "M-66 -28L-70 86H-58L-56 -26ZM66 -28L70 86H58L56 -26Z", fill: trim, opacity: 0.9 });
  // The number, with an outline in a second color sometimes.
  const nd = numberPath(number, 4, 22, 46);
  if (edge !== trim)
    out += el("path", { d: nd, stroke: edge, "stroke-width": 13, "stroke-linecap": "square", fill: "none" });
  out += el("path", { d: nd, stroke: trim, "stroke-width": 8, "stroke-linecap": "square", fill: "none" });
  // A short bar where a team name would go, above the number.
  out += el("path", {
    d: "M-24 -38Q0 -44 24 -38",
    stroke: trim,
    "stroke-width": 4,
    fill: "none",
    "stroke-linecap": "round",
    opacity: 0.85,
  });
  // Ribbed trim round the neck and arms, and the hem.
  out += el("path", { d: NECK + ARMS, stroke: trim, "stroke-width": 7, fill: "none" });
  out += el("path", { d: "M-70 82Q0 90 70 82", stroke: "#000", opacity: 0.1, "stroke-width": 2, fill: "none" });
  // Soft folds in the fabric.
  out += el("path", {
    d: s`M${g.f(-50, -30)} ${g.f(20, 50)}Q${g.f(-20, 0)} ${g.f(40, 60)} ${g.f(10, 30)} ${g.f(60, 75)}M${g.f(30, 50)} ${g.f(-20, 0)}Q${g.f(40, 55)} ${g.f(20, 30)} ${g.f(35, 50)} ${g.f(50, 70)}`,
    stroke: "#000",
    opacity: 0.08,
    "stroke-width": 5,
    fill: "none",
    "stroke-linecap": "round",
  });
  out += el("path", { d: "M-60 -20Q-62 30 -62 78", stroke: "#ffffff", opacity: 0.12, "stroke-width": 6, fill: "none" });
  return { out, number };
}

type Piece = "ball" | "shoes" | "jersey";

/** A basketball, a pair of high-tops and a jersey laid out on a court floor. */
export const basketball = defineKind("basketball", "Basketball", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const pieces = ["ball", "shoes", "jersey"] as const;
  const shoes = sneakers(g);
  const shirt = jersey(g);
  // Each piece's outline about its own center, before it is turned, and its shadow's shape.
  const ring: Point[] = [];
  for (let a = 0; a < 16; a++) ring.push([Math.cos((a / 8) * Math.PI) * 40, Math.sin((a / 8) * Math.PI) * 40]);
  const hulls: Record<Piece, Point[]> = {
    ball: ring,
    shoes: shoes.hull,
    jersey: [
      [-42, -88],
      [42, -88],
      [70, -28],
      [70, 90],
      [-70, 90],
      [-70, -28],
    ],
  };
  const shades: Record<Piece, string> = {
    ball: el("circle", { r: 40 }),
    shoes: shoes.shade,
    jersey: el("path", { d: JERSEY }),
  };
  // How each piece might lie: shoes toes up or toward a side, the bottle and towel either way round.
  const turns: Record<Piece, number[]> = {
    ball: [0],
    shoes: [g.f(-12, 12), g.pick([90, -90]) + g.f(-10, 10)],
    jersey: [g.f(-8, 8)],
  };
  const order = pieces.map(p => ({ p, key: g.f(0, 1) })).sort((m, n) => m.key - n.key);
  const nudge = order.map(() => g.f(-1, 1));
  const margin = unit * 0.05;
  const gap = 12;
  // Try rows, columns and two by two, each piece either way round; keep a layout that fills the picture.
  type Layout = { k: number; at: { p: Piece; x: number; y: number; turn: number }[] };
  const layouts: Layout[] = [];
  for (let mask = 0; mask < 1 << order.length; mask++) {
    const boxes = order.map(({ p }, j) => {
      const choice = turns[p][(mask >> j) & 1] ?? turns[p][0];
      if (turns[p].length === 1 && (mask >> j) & 1) return null;
      const q = hulls[p].map(pt => turned(pt, choice));
      const xs = q.map(v => v[0]);
      const ys = q.map(v => v[1]);
      return { p, turn: choice, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
    if (boxes.some(b => b === null)) continue;
    const bs = boxes as NonNullable<(typeof boxes)[number]>[];
    for (const shape of ["row", "column", "grid"] as const) {
      if (shape === "grid" && bs.length < 3) continue;
      const rows: (typeof bs)[] =
        shape === "row" ? [bs] : shape === "column" ? bs.map(b => [b]) : [bs.slice(0, 2), bs.slice(2)];
      const at: Layout["at"] = [];
      let y = 0;
      let x0 = Infinity;
      let x1 = -Infinity;
      for (const line of rows) {
        const tall = Math.max(...line.map(b => b.y1 - b.y0));
        const wide = line.reduce((sum, b) => sum + b.x1 - b.x0, 0) + gap * (line.length - 1);
        let x = -wide / 2;
        for (const b of line) {
          const slack = tall - (b.y1 - b.y0);
          const j = bs.indexOf(b);
          const cy = y + slack / 2 + (slack / 2) * nudge[j] - b.y0;
          at.push({ p: b.p, x: x - b.x0, y: cy, turn: b.turn });
          x += b.x1 - b.x0 + gap;
        }
        x0 = Math.min(x0, -wide / 2);
        x1 = Math.max(x1, wide / 2);
        y += tall + gap;
      }
      const total = y - gap;
      const k = Math.min((w - margin * 2) / (x1 - x0), (h - margin * 2) / total);
      layouts.push({ k, at: at.map(a => ({ ...a, y: a.y - total / 2 })) });
    }
  }
  const best = Math.max(...layouts.map(l => l.k));
  const good = layouts.filter(l => l.k >= best * 0.93);
  const { k, at } = g.pick(good);
  const ground = floor(g, w, h, k);
  let out = ground.out;
  let focus: Point = [w / 2, h / 2];
  for (const { p, x, y, turn } of at) {
    const px = w / 2 + x * k;
    const py = h / 2 + y * k;
    const body = p === "ball" ? ball(g) : p === "shoes" ? shoes.out : shirt.out;
    // Shadows fall down and to the right whichever way a piece is turned.
    const soft = p === "ball" ? 6 : 4;
    out += el(
      "g",
      { transform: place(px + soft * k, py + (soft + 1) * k, k, turn), fill: "#000", opacity: 0.26 },
      shades[p],
    );
    out += el("g", { transform: place(px, py, k, turn) }, body);
    if (p === "ball") focus = [px, py];
  }
  note.alt(
    `A basketball, a pair of high-top sneakers and a jersey with the number ${shirt.number} on a hardwood ${ground.court ? "court" : "floor"}`,
  );
  note.focus(...focus);
  return out;
});

/** A rectangle between two corners given in any order. */
function box(x1: number, y1: number, x2: number, y2: number, attrs: Record<string, string | number>): string {
  return el("rect", {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    ...attrs,
  });
}

const WALLS = ["plaster", "brick", "wood", "concrete"] as const;
type Wall = (typeof WALLS)[number];

/** A plain wall filling the picture, with a little texture. Returns the markup and what to call it. */
function wall(g: Rand, type: Wall, w: number, h: number): { out: string; name: string } {
  const big = Math.max(w, h);
  const unit = Math.min(w, h);
  if (type === "brick") {
    const painted = g.chance(0.4);
    const hue = painted ? g.f(0, 360) : g.f(6, 22);
    const face = painted ? hex(hue, g.f(8, 25), g.f(80, 88)) : hex(hue, g.f(38, 50), g.f(44, 52));
    const mortar = painted ? mix(face, "#000000", 0.08) : hex(30, 12, 74);
    const bh = big * g.f(0.03, 0.04);
    const bw = bh * g.f(2.4, 2.8);
    const joint = bh * 0.14;
    const x0 = -g.f(0, bw);
    let out = el("rect", { width: w, height: h, fill: face });
    // A few bricks a shade off.
    let dark = "";
    let light = "";
    for (let k = g.i(8, 14); k > 0; k--) {
      const row = g.i(0, Math.ceil(h / bh));
      const x = x0 + g.i(0, Math.ceil(w / bw)) * bw - (row % 2) * (bw / 2);
      const d = s`M${x} ${row * bh}h${bw}v${bh}h${-bw}Z`;
      if (g.chance(0.5)) dark += d;
      else light += d;
    }
    out +=
      el("path", { d: dark, fill: "#000", opacity: "0.07" }) + el("path", { d: light, fill: "#fff", opacity: "0.08" });
    // The mortar, as a tile two courses tall: bed joints along both, and a head joint in each.
    const id = g.id("brick");
    out += el(
      "defs",
      {},
      el(
        "pattern",
        { id, patternUnits: "userSpaceOnUse", x: x0, width: bw, height: bh * 2 },
        el("path", {
          d: s`M0 0H${bw}M0 ${bh}H${bw}M0 ${bh * 2}H${bw}M0 0V${bh}M${bw / 2} ${bh}V${bh * 2}M${bw} 0V${bh}`,
          stroke: mortar,
          "stroke-width": joint,
        }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: `url(#${id})`, opacity: painted ? 0.7 : 0.85 });
    return { out, name: painted ? "painted brick wall" : "brick wall" };
  }
  if (type === "wood") {
    const painted = g.chance(0.3);
    const face = painted ? hex(g.f(0, 360), g.f(12, 28), g.f(76, 86)) : hex(g.f(24, 40), g.f(28, 45), g.f(56, 70));
    const upright = g.chance(0.6);
    const across = upright ? w : h;
    const pw = big * g.f(0.05, 0.075);
    let out = el("rect", { width: w, height: h, fill: face });
    let tone = "";
    let seams = "";
    for (let k = 0; k * pw < across; k++) {
      const a = k * pw;
      if (g.chance(0.45)) tone += upright ? s`M${a} 0h${pw}V${h}h${-pw}Z` : s`M0 ${a}v${pw}H${w}v${-pw}Z`;
      if (k) seams += upright ? s`M${a} 0V${h}` : s`M0 ${a}H${w}`;
    }
    out += el("path", { d: tone, fill: "#000", opacity: "0.05" });
    out += el("path", { d: seams, stroke: "#000", opacity: 0.16, "stroke-width": Math.max(1, unit * 0.005) });
    return { out, name: painted ? "painted wooden wall" : "wooden wall" };
  }
  if (type === "concrete") {
    const face = hex(g.f(20, 215), g.f(3, 9), g.f(70, 80));
    let out = el("rect", { width: w, height: h, fill: face });
    for (let k = 0; k < 3; k++)
      out += el("ellipse", {
        cx: w * g.f(0, 1),
        cy: h * g.f(0, 1),
        rx: big * g.f(0.15, 0.3),
        ry: unit * g.f(0.1, 0.25),
        fill: g.chance(0.5) ? "#000" : "#fff",
        opacity: "0.04",
      });
    // Form panels, with two rows of tie holes in each.
    const cols = Math.max(2, Math.round(w / (unit * 0.8)));
    const rows = Math.max(1, Math.round(h / (unit * 0.55)));
    const pw = w / cols;
    const ph = h / rows;
    let seams = "";
    for (let k = 1; k < cols; k++) seams += s`M${k * pw} 0V${h}`;
    for (let k = 1; k < rows; k++) seams += s`M0 ${k * ph}H${w}`;
    out += el("path", { d: seams, stroke: "#000", opacity: 0.12, "stroke-width": Math.max(1, unit * 0.006) });
    let holes = "";
    for (let k = 0; k < rows; k++) for (const t of [0.25, 0.75]) holes += s`M${pw * 0.25} ${k * ph + ph * t}H${w}`;
    out += el("path", {
      d: holes,
      stroke: "#000",
      opacity: 0.16,
      "stroke-width": unit * 0.016,
      "stroke-linecap": "round",
      "stroke-dasharray": s`0 ${pw / 2}`,
    });
    return { out, name: "concrete wall" };
  }
  // Plaster: a soft wash of light from above, and a few faint patches.
  const hue = g.f(0, 360);
  const sat = g.f(12, 35);
  const light = g.f(78, 88);
  const id = g.id("wall");
  let out = el(
    "defs",
    {},
    el(
      "linearGradient",
      { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hex(hue, sat, light + 4) }),
      el("stop", { offset: 1, "stop-color": hex(hue, sat, light - 4) }),
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  for (let k = 0; k < 3; k++)
    out += el("ellipse", {
      cx: w * g.f(0, 1),
      cy: h * g.f(0, 1),
      rx: big * g.f(0.12, 0.25),
      ry: unit * g.f(0.1, 0.2),
      fill: "#fff",
      opacity: 0.1,
    });
  return { out, name: "plaster wall" };
}

/** Where the boards go: their turn (0 upright, ±90 on their sides), their length and their centers. */
interface Layout {
  kind: "up" | "stack" | "row";
  rot: number;
  len: number;
  spots: Point[];
}

/**
 * Picks among the ways 1 to 3 boards fit the picture (upright side by side, on their sides one
 * above another, or on their sides end to end) one that fills it well. Boards are `ratio` as wide
 * as they are long, plus `extra` of that width for things that stick out, like wheels.
 */
function arrange(
  g: Rand,
  w: number,
  h: number,
  ratio: number,
  extra: number,
  side: number,
  kinds: readonly Layout["kind"][],
  counts: readonly number[] = [1, 2, 3],
): Layout {
  const options: Layout[] = [];
  const at = (n: number, pitch: number) => Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * pitch);
  for (const n of counts) {
    const up = Math.min(h * 0.8, (w * 0.9) / (ratio * (n * (1 + extra) + (n - 1) * 0.45)));
    options.push({
      kind: "up",
      rot: 0,
      len: up,
      spots: at(n, up * ratio * (1.45 + extra)).map((dx): Point => [w / 2 + dx, h / 2]),
    });
    // On their sides, leaving room below each for its rack.
    const flat = Math.min(w * 0.86, (h * 0.8) / (ratio * (n * (1 + extra) + (n - 1) * 0.45)));
    const lift = flat * ratio * 0.12;
    options.push({
      kind: "stack",
      rot: side,
      len: flat,
      spots: at(n, flat * ratio * (1.45 + extra)).map((dy): Point => [w / 2, h / 2 - lift + dy]),
    });
    if (n > 1) {
      const row = Math.min((w * 0.9) / (n + (n - 1) * 0.08), (h * 0.7) / (ratio * (1 + extra)));
      options.push({
        kind: "row",
        rot: side,
        len: row,
        spots: at(n, row * 1.08).map((dx): Point => [w / 2 + dx, h / 2 - row * ratio * 0.12]),
      });
    }
  }
  const allowed = options.filter(o => kinds.includes(o.kind));
  const area = (o: Layout) => o.spots.length * o.len ** 2;
  const best = Math.max(...allowed.map(area));
  return g.pick(allowed.filter(o => area(o) >= best * 0.55));
}

/** A vector in the picture turned into a board's own coordinates, for a board turned by rot degrees. */
function unturn(dx: number, dy: number, rot: number): Point {
  const a = (rot * Math.PI) / 180;
  return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
}

/** The parts of a bracket: what sits behind the board, what wraps in front of it, and its shadow. */
interface Mount {
  back: string;
  front: string;
  shade: string;
}

/** An end clip for an upright board, at its end y, reaching outward in direction e (−1 up, 1 down). */
function endClip(y: number, e: number, cw: number, paint: string): Mount {
  const shade = s`M${-cw / 2} ${y - e * cw * 0.25}H${cw / 2}V${y + e * cw * 0.3}H${-cw / 2}Z`;
  return {
    shade,
    back: box(-cw / 2, y - e * cw * 0.25, cw / 2, y + e * cw * 0.3, {
      rx: cw * 0.1,
      fill: mix(paint, "#000000", 0.18),
    }),
    front:
      box(-cw * 0.44, y - e * cw * 0.3, cw * 0.44, y + e * cw * 0.05, { rx: cw * 0.1, fill: paint }) +
      box(-cw * 0.44, y - e * cw * 0.3, cw * 0.44, y - e * cw * 0.22, { fill: "#fff", opacity: 0.25 }),
  };
}

/** A rack arm under a board lying on its side: its edge at x, reaching out along side, at y along it. */
function rackArm(x: number, y: number, side: number, aw: number, paint: string): Mount {
  const shade = s`M${x - side * aw * 0.24} ${y - aw / 2}H${x + side * aw * 0.42}V${y + aw / 2}H${x - side * aw * 0.24}Z`;
  return {
    shade,
    back: "",
    // The arm's end below the board, and its padded tip turned up in front of the rail.
    front:
      box(x - side * aw * 0.05, y - aw * 0.4, x + side * aw * 0.42, y + aw * 0.4, {
        rx: aw * 0.1,
        fill: mix(paint, "#000000", 0.2),
      }) + box(x - side * aw * 0.24, y - aw / 2, x + side * aw * 0.12, y + aw / 2, { rx: aw * 0.12, fill: paint }),
  };
}

/** A soft shadow of `shape` on the wall: the shape drawn twice, offset by (dx, dy) and a little further. */
function softShadow(g: Rand, shape: string, dx: number, dy: number): string {
  // The id comes from the shape (less the picture's id prefix, which fixed options change), so boards
  // with the same shadow give the same markup and can share it.
  const id = g.id(`shade${hash(shape.replaceAll(g.id(""), "")).toString(36)}`);
  const layer = (f: number, opacity: number) =>
    el("use", { href: `#${id}`, fill: "#000", opacity, transform: s`translate(${dx * f} ${dy * f})` });
  return el("defs", {}, el("g", { id }, shape)) + layer(1.8, 0.1) + layer(1, 0.14);
}

/** Names each graphic once, in the plural when more than one board has it: "flames and a checkerboard". */
function graphics<T extends string>(styles: readonly T[], words: Record<T, [string, string]>): string {
  const unique = [...new Set(styles)];
  return andList(unique.map(st => words[st][styles.filter(x => x === st).length > 1 ? 1 : 0]));
}

/** Writes markup in full the first time it's seen and as a `<use>` of it after that, for parts boards share. */
function sharer(g: Rand, name: string): (markup: string) => string {
  const seen = new Map<string, string>();
  return markup => {
    const id = seen.get(markup);
    if (id) return el("use", { href: `#${id}` });
    const fresh = g.id(`${name}${seen.size}`);
    seen.set(markup, fresh);
    return el("g", { id: fresh }, markup);
  };
}

const MOUNT_PAINTS = ["#b9bec4", "#2e2f35", "#a87b4f", "#e9e6df", "#c9a46a"];

/** A board's colors: a ground, two accents, and a light and a dark for details. */
interface Pal {
  base: string;
  a: string;
  b: string;
  light: string;
  ink: string;
}

function palette(g: Rand, hue: number): Pal {
  const sat = g.f(50, 72);
  const turn = g.pick([30, 150, 180, 120, -40]);
  const c1 = hex(hue, sat, g.f(48, 60));
  const c2 = hex(hue + turn, sat, g.f(55, 66));
  const c3 = hex(hue - 25, sat - 8, g.f(30, 40));
  const light = g.pick(["#f5efe2", "#fbf7ee", hex(hue + turn, 55, 88)]);
  const ink = g.pick(["#2a2930", hex(hue + 190, 28, 20)]);
  const [base, a, b] = g.pick([
    [c1, c2, light],
    [light, c1, c2],
    [ink, c1, c2],
    [c3, c2, light],
    [c1, light, ink],
    [c2, c3, light],
  ]);
  return { base, a, b, light, ink };
}

/** The area a graphic covers, in the board's own coordinates; its long side runs along y. */
interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SKATE_ART = [
  "stripes",
  "chevrons",
  "checker",
  "rings",
  "dots",
  "waves",
  "sunburst",
  "fade",
  "shapes",
  "face",
  "flames",
] as const;
type SkateArt = (typeof SKATE_ART)[number];

/** How alt text names each graphic, for one board and for several. */
const SKATE_WORDS: Record<SkateArt, [string, string]> = {
  stripes: ["stripes", "stripes"],
  chevrons: ["chevrons", "chevrons"],
  checker: ["a checkerboard", "checkerboards"],
  rings: ["rings", "rings"],
  dots: ["polka dots", "polka dots"],
  waves: ["waves", "waves"],
  sunburst: ["a sunburst", "sunbursts"],
  fade: ["a sunset fade", "sunset fades"],
  shapes: ["geometric shapes", "geometric shapes"],
  face: ["a smiling face", "smiling faces"],
  flames: ["flames", "flames"],
};

/** Graphics that can run across a whole set of decks as one picture, and what to call that picture. */

/** A bold graphic filling the area `b`. `id` names its gradient, if it has one. */
function skateArt(g: Rand, style: SkateArt, b: Area, p: Pal, id: string): string {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const small = Math.min(b.w, b.h);
  const reach = Math.hypot(b.w, b.h) / 2 + small * 0.1;
  let out = el("rect", { x: b.x - 2, y: b.y - 2, width: b.w + 4, height: b.h + 4, fill: p.base });
  if (style === "stripes") {
    const angle = g.pick([0, 0, 25, -25, 45, -45]);
    const step = Math.max(b.w, b.h) / g.i(7, 12);
    const thick = g.f(0.3, 0.6);
    let da = "";
    let db = "";
    for (let k = 0, y = cy - reach; y < cy + reach; k++, y += step) {
      const d = s`M${cx - reach} ${y}h${reach * 2}v${step * thick}h${-reach * 2}Z`;
      if (k % 2) db += d;
      else da += d;
    }
    out += el(
      "g",
      { transform: s`rotate(${angle} ${cx} ${cy})` },
      el("path", { d: da, fill: p.a }),
      el("path", { d: db, fill: p.b }),
    );
  } else if (style === "chevrons") {
    const sp = b.w * g.f(0.3, 0.42);
    const depth = b.w * g.f(0.25, 0.45) * g.pick([1, -1]);
    let da = "";
    let db = "";
    for (let k = 0, y = b.y - Math.abs(depth) - sp; y < b.y + b.h + sp; k++, y += sp) {
      const d = s`M${b.x - sp} ${y + depth}L${cx} ${y}L${b.x + b.w + sp} ${y + depth}`;
      if (k % 2) db += d;
      else da += d;
    }
    const stroke = { fill: "none", "stroke-width": sp * 0.45, "stroke-linejoin": "miter" };
    out += el("path", { d: da, stroke: p.a, ...stroke }) + el("path", { d: db, stroke: p.b, ...stroke });
  } else if (style === "checker") {
    const cols = g.pick([4, 5]);
    const cell = b.w / cols;
    const full = g.chance(0.5);
    const top = full ? b.y : cy - b.h * g.f(0.15, 0.25);
    const bottom = full ? b.y + b.h : 2 * cy - top;
    const [under, over] = g.pick([
      [p.light, p.ink],
      [p.a, p.ink],
      [p.light, p.a],
    ]);
    // Each row of squares is one dashed line.
    let d = "";
    for (let r = 0; top + r * cell < bottom - 1; r++)
      d += s`M${b.x + (r % 2) * cell} ${top + (r + 0.5) * cell}H${b.x + b.w}`;
    out += el("rect", { x: b.x, y: top, width: b.w, height: bottom - top, fill: under });
    out += el("path", { d, stroke: over, "stroke-width": cell, "stroke-dasharray": s`${cell} ${cell}` });
    if (!full)
      out += el("path", {
        d: s`M${b.x} ${top - cell * 0.4}H${b.x + b.w}M${b.x} ${bottom + cell * 0.4}H${b.x + b.w}`,
        stroke: p.b,
        "stroke-width": cell * 0.3,
      });
  } else if (style === "rings") {
    const ox = cx + g.f(-0.2, 0.2) * b.w;
    const oy = b.y + b.h * g.pick([0.3, 0.5, 0.7]);
    const step = small * g.f(0.15, 0.24);
    const colors = g.pick([
      [p.a, p.b],
      [p.a, p.light, p.b],
      [p.b, p.base, p.a, p.light],
    ]);
    const far = Math.hypot(Math.max(ox - b.x, b.x + b.w - ox), Math.max(oy - b.y, b.y + b.h - oy));
    for (let k = Math.ceil(far / step); k > 0; k--)
      out += el("circle", { cx: ox, cy: oy, r: k * step, fill: colors[k % colors.length] });
  } else if (style === "dots") {
    // Each row of dots is one round-capped dashed line.
    const cell = b.w / g.pick([3, 3.5, 4]);
    let d = "";
    for (let r = 0, y = b.y + cell * 0.3; y < b.y + b.h + cell; r++, y += cell * 0.75)
      d += s`M${b.x + (r % 2 ? cell / 2 : 0) - cell * 0.25} ${y}H${b.x + b.w + cell}`;
    out += el("path", {
      d,
      stroke: g.pick([p.a, p.b, p.light]),
      "stroke-width": cell * g.f(0.4, 0.6),
      "stroke-linecap": "round",
      "stroke-dasharray": s`0 ${cell}`,
    });
  } else if (style === "waves") {
    const wl = small * g.f(0.6, 0.95);
    const amp = wl * g.f(0.1, 0.18);
    const count = g.i(4, 7);
    const colors = [p.a, p.b, p.light, p.base];
    const shift = g.i(0, 3);
    // One wave, drawn again lower down for each band.
    let d = s`M${b.x - wl} ${b.y}`;
    for (let x = b.x - wl; x < b.x + b.w + wl; x += wl) d += s`q${wl / 4} ${-amp} ${wl / 2} 0t${wl / 2} 0`;
    d += s`v${b.h + 4}H${b.x - wl}Z`;
    out += el("defs", {}, el("path", { id, d }));
    for (let k = 1; k <= count; k++)
      out += el("use", { href: `#${id}`, y: (b.h * k) / (count + 1), fill: colors[(k + shift) % colors.length] });
  } else if (style === "sunburst") {
    const oy = b.y + b.h * g.pick([0.3, 0.5, 0.5, 0.7]);
    // The rays are the dashes of one very wide circle.
    const rays = g.i(8, 13) * 2;
    const ray = (Math.PI * reach * 2) / rays;
    out += el("circle", {
      cx,
      cy: oy,
      r: reach,
      fill: "none",
      stroke: p.a,
      "stroke-width": reach * 2,
      "stroke-dasharray": s`${ray} ${ray}`,
      transform: s`rotate(${g.f(0, 360)} ${cx} ${oy})`,
    });
    const r = small * g.f(0.28, 0.38);
    out += el("circle", { cx, cy: oy, r: r * 1.25, fill: p.b });
    out += el("circle", { cx, cy: oy, r, fill: p.light });
  } else if (style === "fade") {
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: b.y, x2: 0, y2: b.y + b.h },
        el("stop", { offset: 0, "stop-color": p.a }),
        el("stop", { offset: 0.55, "stop-color": p.b }),
        el("stop", { offset: 1, "stop-color": p.base }),
      ),
    );
    out += el("rect", { x: b.x - 2, y: b.y - 2, width: b.w + 4, height: b.h + 4, fill: `url(#${id})` });
    // A sun cut by bands of the fade showing through.
    const r = small * g.f(0.32, 0.42);
    const oy = b.y + b.h * g.f(0.35, 0.55);
    out += el("circle", { cx, cy: oy, r, fill: p.light });
    let slits = "";
    for (let k = 0; k < 4; k++) {
      const y = oy + r * (0.1 + k * 0.24);
      slits += s`M${cx - r} ${y}h${r * 2}v${r * (0.04 + k * 0.03)}h${-r * 2}Z`;
    }
    out += el("path", { d: slits, fill: `url(#${id})` });
  } else if (style === "shapes") {
    const colors = [p.a, p.b, p.light, p.ink].filter(c => c !== p.base);
    const count = g.i(5, 7);
    for (let k = 0; k < count; k++) {
      const x = cx + g.f(-0.28, 0.28) * b.w;
      const y = b.y + (b.h * (k + g.f(0.3, 0.7))) / count;
      const r = b.w * g.f(0.14, 0.24);
      const paint = g.pick(colors);
      const turn = g.f(0, 360);
      const shape = g.pick(["circle", "triangle", "square", "ring", "squiggle"] as const);
      if (shape === "circle") out += el("circle", { cx: x, cy: y, r, fill: paint });
      else if (shape === "ring")
        out += el("circle", { cx: x, cy: y, r: r * 0.8, fill: "none", stroke: paint, "stroke-width": r * 0.35 });
      else if (shape === "triangle")
        out += el("path", {
          d: `M${pts([0, 1, 2].map((j): Point => [x + Math.cos(turn + j * 2.09) * r, y + Math.sin(turn + j * 2.09) * r]))}Z`,
          fill: paint,
        });
      else if (shape === "square")
        out += el("rect", {
          x: x - r * 0.75,
          y: y - r * 0.75,
          width: r * 1.5,
          height: r * 1.5,
          fill: paint,
          transform: s`rotate(${turn} ${x} ${y})`,
        });
      else
        out += el("path", {
          d: s`M${x - r * 1.2} ${y}q${r * 0.3} ${-r * 0.6} ${r * 0.6} 0t${r * 0.6} 0t${r * 0.6} 0t${r * 0.6} 0`,
          fill: "none",
          stroke: paint,
          "stroke-width": r * 0.28,
          "stroke-linecap": "round",
          transform: s`rotate(${turn} ${x} ${y})`,
        });
    }
  } else if (style === "face") {
    // Bands across both ends, and a big round face in the middle.
    const band = b.h * 0.08;
    out += el("path", {
      d: s`M${b.x} ${b.y + b.h * 0.12}h${b.w}v${band}h${-b.w}Z M${b.x} ${b.y + b.h * 0.88 - band}h${b.w}v${band}h${-b.w}Z`,
      fill: p.b,
    });
    const r = b.w * 0.4;
    const ink = p.base === p.ink ? p.light : p.ink;
    const head = p.a === p.ink ? p.light : p.a;
    out += el("circle", { cx, cy, r, fill: head });
    const wink = g.chance(0.25);
    out += el("ellipse", { cx: cx - r * 0.36, cy: cy - r * 0.18, rx: r * 0.1, ry: r * 0.17, fill: ink });
    if (wink)
      out += el("path", {
        d: s`M${cx + r * 0.24} ${cy - r * 0.16}q${r * 0.12} ${-r * 0.12} ${r * 0.24} 0`,
        fill: "none",
        stroke: ink,
        "stroke-width": r * 0.08,
        "stroke-linecap": "round",
      });
    else out += el("ellipse", { cx: cx + r * 0.36, cy: cy - r * 0.18, rx: r * 0.1, ry: r * 0.17, fill: ink });
    const grin = g.f(0.45, 0.75);
    out += el("path", {
      d: s`M${cx - r * 0.46} ${cy + r * 0.2}Q${cx} ${cy + r * (0.2 + grin)} ${cx + r * 0.46} ${cy + r * 0.2}`,
      fill: "none",
      stroke: ink,
      "stroke-width": r * 0.09,
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M${cx - r * 0.62} ${cy + r * 0.12}h0M${cx + r * 0.62} ${cy + r * 0.12}h0`,
      stroke: p.b,
      "stroke-width": r * 0.2,
      "stroke-linecap": "round",
      opacity: 0.7,
    });
  } else {
    // Flames licking up from the tail.
    const by = b.y + b.h;
    const layers: [string, number][] = [
      [p.a, g.f(0.5, 0.68)],
      [p.b, g.f(0.3, 0.42)],
    ];
    for (const [paint, reachUp] of layers) {
      const tongues = g.i(3, 4);
      const tw = (b.w * 1.1) / tongues;
      const y0 = by - b.h * reachUp * 0.3;
      let x = b.x - b.w * 0.05;
      let d = s`M${x} ${by + 2}L${x} ${y0}`;
      for (let k = 0; k < tongues; k++) {
        const xr = x + tw;
        const tx = x + tw * g.f(0.4, 0.8);
        const ty = by - b.h * reachUp * g.f(0.75, 1);
        const th = y0 - ty;
        d += s`C${x} ${y0 - th * 0.55} ${tx - tw * 0.35} ${ty + th * 0.35} ${tx} ${ty}`;
        d += s`C${tx - tw * 0.05} ${ty + th * 0.4} ${xr + tw * 0.1} ${y0 - th * 0.3} ${xr} ${y0}`;
        x = xr;
      }
      d += s`L${x} ${by + 2}Z`;
      out += el("path", { d, fill: paint });
    }
  }
  return out;
}

/** A skateboard deck's outline, centered on (0, 0) and running along y: straight sides, round kicked ends. */
function deckPath(wid: number, len: number): string {
  const hw = wid / 2;
  const ry = wid * 0.55;
  const top = -len / 2 + ry;
  return s`M${-hw} ${top}A${hw} ${ry} 0 0 1 ${hw} ${top}V${-top}A${hw} ${ry} 0 0 1 ${-hw} ${-top}Z`;
}

const GRIPS = ["plain", "bands", "stripe", "logo", "rails"] as const;
type Grip = (typeof GRIPS)[number];
const GRIP_WORDS: Record<Grip, string> = {
  plain: "",
  bands: " with bands cut across its ends",
  stripe: " with a stripe down the middle",
  logo: " with a round logo cut out",
  rails: " with stripes along its edges",
};

/** One skateboard shown twice on a wall, as if from both sides: grip tape and bolts, then the graphic and trucks. */
export const skateboard = defineKind("skateboard", "Skateboard", { wall: WALLS }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallType = g.option("wall", g.pick(WALLS));
  const backdrop = wall(g.fork("wall"), wallType, w, h);
  let out = backdrop.out;
  const ratio = 0.26;
  // The two hang upright side by side, though on a tall picture they may lie one above another, and
  // on a very wide one end to end.
  const aspect = w / h;
  const kinds = aspect < 0.9 ? (["up", "stack"] as const) : aspect > 2 ? (["up", "row"] as const) : (["up"] as const);
  const plan = arrange(g, w, h, ratio, 0.32, 90, kinds, [2]);
  const len = plan.len;
  const wid = len * ratio;
  const gripAt = g.pick([0, 1]);
  const style = g.pick(SKATE_ART);
  const pal = palette(g, g.f(0, 360));
  const grip = g.pick(GRIPS);
  const gripPaint = g.pick(["#1f1f23", "#26262b", "#2d2b2a"]);
  const mountPaint = g.pick(MOUNT_PAINTS);
  const wheelPaint = g.pick(["#f3efe2", "#f2c94c", "#ef7f5a", "#6fb8dc", "#8fd1c0", "#e67fa8"]);
  // The deck's outline is written once and reused for both boards, their clip, shadows and edges.
  const deck = g.id("deck");
  const clip = g.id("deckclip");
  out += el(
    "defs",
    {},
    el("path", { id: deck, d: deckPath(wid, len) }),
    el("clipPath", { id: clip }, el("use", { href: `#${deck}` })),
  );
  const [sx, sy] = [unit * 0.012, unit * 0.022];
  const place = (spot: Point) => s`translate(${spot[0]} ${spot[1]}) rotate(${plan.rot})`;
  // Upright boards sit on hidden mounts; boards on their sides rest on two rack arms.
  const mounts: Mount[] =
    plan.rot === 0 ? [] : [-1, 1].map(e => rackArm(wid / 2, e * len * 0.15, 1, wid * 0.32, mountPaint));
  // The wheels, which stick out past the deck's sides.
  const ww = wid * 0.22;
  const wd = len * 0.075;
  let wheels = "";
  for (const e of [-1, 1])
    for (const side of [-1, 1])
      wheels += s`M${side * wid * 0.53 - ww / 2} ${e * len * 0.31 - wd / 2}h${ww}v${wd}h${-ww}Z`;
  const share = sharer(g, "deckpart");
  for (const spot of plan.spots) {
    const [dx, dy] = unturn(sx, sy, plan.rot);
    const shade = wheels + mounts.map(m => m.shade).join("");
    const shadow = softShadow(g, el("use", { href: `#${deck}` }) + el("path", { d: shade }), dx, dy);
    out += el("g", { transform: place(spot) }, share(shadow + mounts.map(m => m.back).join("")));
  }
  // The kicked ends sit a little in shade, and a soft gloss runs down one side.
  const kick = len / 2 - wid * 0.75;
  const finish =
    el("path", {
      d: s`M${-wid} ${kick}H${wid}V${len}H${-wid}ZM${-wid} ${-kick}H${wid}V${-len}H${-wid}Z`,
      fill: "#000",
      opacity: 0.1,
    }) +
    el("path", {
      d: s`M${-wid * 0.3} ${len * 0.3}V${-len * 0.3}`,
      stroke: "#fff",
      opacity: 0.14,
      "stroke-width": wid * 0.08,
      "stroke-linecap": "round",
    });
  const ply = el("use", {
    href: `#${deck}`,
    fill: "none",
    stroke: "#d9b98c",
    "stroke-width": Math.max(1, wid * 0.035),
  });
  for (const [k, spot] of plan.spots.entries()) {
    let board = "";
    if (k === gripAt) {
      // Grip tape: sandpaper grit, maybe a shape cut from it, and the bolts holding the trucks.
      const grit = g.id("grit");
      const t = wid * 0.09;
      let specks = "";
      for (let j = 0; j < 6; j++) specks += dot(g.f(0, t), g.f(0, t), t * 0.06);
      let cut = "";
      const a = pal.a;
      const band = wid * 0.1;
      if (grip === "bands")
        for (const e of [-1, 1]) cut += s`M${-wid} ${e * (len * 0.4) - band / 2}h${wid * 2}v${band}h${-wid * 2}Z`;
      if (grip === "stripe") cut = s`M${-wid * 0.08} ${-len}h${wid * 0.16}v${len * 2}h${-wid * 0.16}Z`;
      if (grip === "logo") {
        const r = wid * 0.24;
        cut = dot(0, 0, r) + dot(0, 0, r * 0.62);
      }
      if (grip === "rails")
        cut = s`M${-wid / 2} ${-len}h${wid * 0.09}v${len * 2}h${-wid * 0.09}ZM${wid / 2} ${-len}h${-wid * 0.09}v${len * 2}h${wid * 0.09}Z`;
      let bolts = "";
      for (const e of [-1, 1])
        for (const bx of [-1, 1])
          for (const by of [-1, 1]) bolts += dot(bx * wid * 0.1, e * len * 0.31 + by * len * 0.022, wid * 0.026);
      board += el("path", { d: wheels, fill: wheelPaint });
      board += el(
        "g",
        { "clip-path": `url(#${clip})` },
        el(
          "defs",
          {},
          el(
            "pattern",
            { id: grit, width: t, height: t, patternUnits: "userSpaceOnUse" },
            el("path", { d: specks, fill: "#ffffff", opacity: 0.22 }),
          ),
        ),
        el("rect", { x: -wid, y: -len, width: wid * 2, height: len * 2, fill: gripPaint }),
        cut ? el("path", { d: cut, fill: a, "fill-rule": "evenodd" }) : "",
        el("rect", { x: -wid, y: -len, width: wid * 2, height: len * 2, fill: `url(#${grit})` }),
        el("path", { d: bolts, fill: "#c3c8ce" }),
        finish,
      );
    } else {
      // The graphic side, with the trucks and wheels.
      const metal = "#b4bac1";
      const truck = g.id("truck");
      let ends = "";
      for (const side of [-1, 1]) ends += s`M${side * wid * 0.53 - ww / 2} ${-wd / 2}h${ww}v${wd}h${-ww}Z`;
      board += el(
        "g",
        { "clip-path": `url(#${clip})` },
        skateArt(g, style, { x: -wid / 2, y: -len / 2, w: wid, h: len }, pal, g.id("fade")),
        finish,
      );
      board += el(
        "defs",
        {},
        el(
          "g",
          { id: truck },
          el("rect", {
            x: -wid * 0.2,
            y: -len * 0.04,
            width: wid * 0.4,
            height: len * 0.08,
            rx: wid * 0.04,
            fill: mix(metal, "#000000", 0.25),
          }),
          el("rect", { x: -wid * 0.5, y: -len * 0.016, width: wid, height: len * 0.032, rx: len * 0.016, fill: metal }),
          el("circle", { r: wid * 0.06, fill: mix(metal, "#000000", 0.4) }),
          el("path", {
            d: ends,
            fill: wheelPaint,
            stroke: wheelPaint,
            "stroke-width": ww * 0.2,
            "stroke-linejoin": "round",
          }),
          el("path", {
            d: s`M${-wid * 0.53} ${-wd / 2}v${wd}M${wid * 0.53} ${-wd / 2}v${wd}`,
            stroke: "#000",
            opacity: 0.12,
            "stroke-width": ww * 0.16,
          }),
        ),
      );
      board += ply + el("use", { href: `#${truck}`, y: -len * 0.31 }) + el("use", { href: `#${truck}`, y: len * 0.31 });
    }
    if (k === gripAt) board += ply;
    out += el("g", { transform: place(spot) }, board + share(mounts.map(m => m.front).join("")));
  }
  const hung =
    plan.kind === "up"
      ? `hung on a ${backdrop.name}`
      : `resting on racks ${plan.kind === "stack" ? "one above the other" : "side by side"} on a ${backdrop.name}`;
  note.alt(
    `A skateboard shown from both sides, ${hung}: grip tape${GRIP_WORDS[grip]} on top, and ${graphics([style], SKATE_WORDS)} and trucks underneath`,
  );
  const [fx, fy] = plan.spots[1 - gripAt];
  note.focus(fx, fy);
  return out;
});

const SURF_ART = ["rails", "stripes", "racing", "swirl", "fade", "panels", "wood", "clear"] as const;
type SurfArt = (typeof SURF_ART)[number];

const SURF_WORDS: Record<SurfArt, [string, string]> = {
  rails: ["painted rails", "painted rails"],
  stripes: ["stripes", "stripes"],
  racing: ["racing stripes", "racing stripes"],
  swirl: ["resin swirls", "resin swirls"],
  fade: ["a fade", "fades"],
  panels: ["resin panels", "resin panels"],
  wood: ["a wood finish", "wood finishes"],
  clear: ["a clear finish", "clear finishes"],
};

/** A surfboard's plan: how wide for its length, how full its nose, where it's widest, its tail. */
interface SurfShape {
  name: string;
  ratio: number;
  /** How full the nose is: higher is fuller. */
  nose: number;
  round: boolean;
  wide: number;
  tail: "squash" | "round" | "pin";
}

function surfShape(g: Rand): SurfShape {
  const type = g.pick(["shortboard", "shortboard", "fish", "longboard", "longboard", "gun"] as const);
  if (type === "fish") return { name: "fish", ratio: 0.31, nose: 2.6, round: false, wide: 0.45, tail: "squash" };
  if (type === "longboard")
    return { name: "longboard", ratio: 0.23, nose: 2.4, round: true, wide: 0.5, tail: g.pick(["round", "squash"]) };
  if (type === "gun") return { name: "gun", ratio: 0.22, nose: 1.9, round: false, wide: 0.55, tail: "pin" };
  return {
    name: "shortboard",
    ratio: 0.26,
    nose: g.f(2.1, 2.5),
    round: false,
    wide: g.f(0.48, 0.54),
    tail: g.pick(["squash", "round", "pin"]),
  };
}

/** Half a surfboard's width at t (0 at the tail, 1 at the nose), as a share of its full width. */
function surfHalf(t: number, shape: SurfShape): number {
  const c = shape.wide;
  const tailWidth = { squash: 0.42, round: 0.32, pin: 0.1 }[shape.tail];
  const cap = { squash: 0.01, round: 0.07, pin: 0.04 }[shape.tail];
  const nose = Math.max(0, 1 - ((t - c) / (1 - c)) ** shape.nose);
  const body = t < c ? 1 - (1 - tailWidth) * ((c - t) / c) ** 1.7 : shape.round ? Math.sqrt(nose) : nose;
  const end = t < cap ? Math.sqrt(Math.max(0, 1 - ((cap - t) / cap) ** 2)) : 1;
  return 0.5 * body * end;
}

/** A surfboard's outline centered on (0, 0), nose toward −y. */
function surfPath(wid: number, len: number, shape: SurfShape): string {
  const right: Point[] = [];
  const steps = 12;
  for (let k = 0; k <= steps; k++) {
    // Closer samples at both ends, where the outline turns fastest.
    const t = (1 - Math.cos((Math.PI * k) / steps)) / 2;
    right.push([surfHalf(t, shape) * wid, len / 2 - t * len]);
  }
  const left = right.map(([x, y]): Point => [-x, y]).reverse();
  // A smooth curve through the midpoints, in whole pixels, which are plenty here and keep the markup short.
  const ring = [...right, ...left.slice(1, -1)];
  const xy = ([x, y]: Point) => `${Math.round(x)} ${Math.round(y)}`;
  const mid = (k: number): Point => {
    const [a, b] = [ring[k % ring.length], ring[(k + 1) % ring.length]];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  return `M${xy(mid(ring.length - 1))}${ring.map((p, k) => `Q${xy(p)} ${xy(mid(k))}`).join("")}Z`;
}

/** A surfboard's deck graphic over the area of a board `wid` by `len`, clipped by the caller. */
function surfArt(g: Rand, style: SurfArt, wid: number, len: number, outline: string, p: Pal, id: string): string {
  const top = -len / 2;
  const fillAll = (paint: string) => el("rect", { x: -wid, y: top - 2, width: wid * 2, height: len + 4, fill: paint });
  const stringer = el("path", {
    d: s`M0 ${-top}V${top}`,
    stroke: "#000",
    opacity: 0.3,
    "stroke-width": Math.max(0.8, wid * 0.016),
  });
  if (style === "wood") {
    const wood = hex(g.f(26, 38), g.f(35, 55), g.f(50, 64));
    let out = fillAll(wood);
    let grain = "";
    for (let k = 0; k < 7; k++) {
      const x = wid * (-0.42 + k * 0.14 + g.f(-0.03, 0.03));
      grain += s`M${x} ${-top}Q${x + wid * g.f(-0.08, 0.08)} 0 ${x * 0.3} ${top}`;
    }
    out += el("path", {
      d: grain,
      fill: "none",
      stroke: mix(wood, "#000000", 0.35),
      opacity: 0.3,
      "stroke-width": wid * 0.012,
    });
    if (g.chance(0.5)) out += el("use", { href: outline, fill: "none", stroke: p.a, "stroke-width": wid * 0.12 });
    return out + stringer;
  }
  if (style === "clear") {
    let out = fillAll(g.pick(["#f1ecdd", "#f4f1ea", "#ece4d0"]));
    out += el("use", { href: outline, fill: "none", stroke: p.a, opacity: 0.45, "stroke-width": wid * 0.34 });
    return out + stringer;
  }
  let out = fillAll(p.base);
  if (style === "rails") {
    out += el("use", { href: outline, fill: "none", stroke: p.a, "stroke-width": wid * 0.24 });
    out += el("use", {
      href: outline,
      fill: "none",
      stroke: p.light === p.base ? p.ink : p.light,
      "stroke-width": wid * 0.018,
      transform: "scale(0.76 0.9)",
    });
  } else if (style === "stripes") {
    const y = top + len * g.f(0.18, 0.32);
    const bands = g.i(1, 3);
    let d = "";
    let y1 = y;
    for (let k = 0; k < bands; k++) {
      const t = wid * (k === 0 ? g.f(0.2, 0.35) : g.f(0.06, 0.12));
      d += s`M${-wid} ${y1}h${wid * 2}v${t}h${-wid * 2}Z`;
      y1 += t + wid * 0.07;
    }
    const tilt = g.f(-12, 12);
    out += el("path", { d, fill: p.a, transform: s`rotate(${tilt} 0 ${y})` });
    if (g.chance(0.5))
      out += el("rect", {
        x: -wid,
        y: -top - len * g.f(0.15, 0.25),
        width: wid * 2,
        height: wid * 0.1,
        fill: p.b,
        transform: s`rotate(${-tilt} 0 ${-top - len * 0.2})`,
      });
  } else if (style === "racing") {
    const off = g.chance(0.4) ? wid * 0.14 : 0;
    out += el("rect", { x: off - wid * 0.09, y: top, width: wid * 0.18, height: len, fill: p.a });
    out += el("path", {
      d: s`M${off - wid * 0.16} ${top}V${-top}M${off + wid * 0.16} ${top}V${-top}`,
      stroke: p.b,
      "stroke-width": wid * 0.035,
    });
  } else if (style === "swirl") {
    const colors = [p.a, p.b, p.light].filter(c => c !== p.base);
    let swirls = "";
    for (let k = g.i(4, 6); k > 0; k--) {
      const y0 = top + len * g.f(-0.1, 0.8);
      const seg = len * g.f(0.1, 0.18);
      const xs = [0, 1, 2, 3].map(() => wid * g.f(-0.55, 0.55));
      const mid: Point = [(xs[1] + xs[2]) / 2, y0 + seg * 1.5];
      swirls += el("path", {
        d: s`M${xs[0]} ${y0}Q${xs[1]} ${y0 + seg} ${mid[0]} ${mid[1]}T${xs[3]} ${y0 + seg * 3}`,
        stroke: g.pick(colors),
        "stroke-width": wid * g.f(0.1, 0.26),
      });
    }
    out += el("g", { fill: "none", "stroke-linecap": "round" }, swirls);
  } else if (style === "fade") {
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        el("stop", { offset: 0, "stop-color": p.a }),
        el("stop", { offset: 0.5, "stop-color": p.b }),
        el("stop", { offset: 1, "stop-color": p.base }),
      ),
    );
    out += el("use", { href: outline, fill: `url(#${id})` });
  } else {
    // Panels of tinted resin at the nose and the tail, with a pinline where they meet the middle.
    const y1 = top + len * g.f(0.2, 0.33);
    const y2 = -top - len * g.f(0.15, 0.28);
    const bow = wid * g.f(-0.35, 0.35);
    const nose = s`M${-wid} ${y1 + bow}Q0 ${y1 - bow} ${wid} ${y1 + bow}`;
    const tail = s`M${-wid} ${y2 - bow}Q0 ${y2 + bow} ${wid} ${y2 - bow}`;
    out += el("path", { d: nose + s`V${top - 2}H${-wid}Z`, fill: p.a });
    out += el("path", { d: tail + s`V${-top + 2}H${-wid}Z`, fill: p.b });
    out += el("path", {
      d: nose + tail,
      fill: "none",
      stroke: p.light === p.base ? p.ink : p.light,
      "stroke-width": wid * 0.03,
    });
  }
  return out;
}

/** Surfboards on a wall, deck side out: on rack arms one above another, or hung upright in a row. */
export const surfboard = defineKind("surfboard", "Surfboard", { wall: WALLS }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wallType = g.option("wall", g.pick(WALLS));
  const backdrop = wall(g.fork("wall"), wallType, w, h);
  let out = backdrop.out;
  // Surfboards lie on racks one above another on wide pictures, and hang upright on tall ones.
  const aspect = w / h;
  const kinds =
    aspect > 2
      ? (["stack", "row"] as const)
      : aspect > 1.15
        ? (["stack"] as const)
        : aspect < 0.87
          ? (["up"] as const)
          : (["up", "stack"] as const);
  const plan = arrange(g, w, h, 0.27, 0, g.pick([90, -90]), kinds);
  const count = plan.spots.length;
  const slot = plan.len * 0.27;
  // A matched set in turning colors, or a quiver of different boards.
  const series = g.chance(0.5);
  const hue = g.f(0, 360);
  const step = g.pick([25, 40, 60, 180]);
  const shape0 = surfShape(g);
  const style0 = g.pick(SURF_ART);
  // Each distinct outline is written once, and boards of the same shape share it.
  const outlines = new Map<string, string>();
  let defs = "";
  const boards = plan.spots.map((spot, k) => {
    const shape = series || k === 0 ? shape0 : surfShape(g);
    const style = series || k === 0 ? style0 : g.pick(SURF_ART);
    const len = Math.min(plan.len, slot / shape.ratio) * (series ? 1 : g.f(0.9, 1));
    const wid = len * shape.ratio;
    const pal = palette(g, series ? hue + k * step : g.f(0, 360));
    const path = surfPath(wid, len, shape);
    if (!outlines.has(path)) {
      outlines.set(path, g.id(`surf${k}`));
      defs += el("path", { id: outlines.get(path)!, d: path });
    }
    return { spot, shape, style, len, wid, pal, outline: `#${outlines.get(path)}` };
  });
  out += el("defs", {}, defs);
  const mountPaint = g.pick(MOUNT_PAINTS);
  const down = plan.rot === 90 ? 1 : -1;
  const mounts = boards.map(({ shape, len, wid }) => {
    if (plan.rot === 0) {
      const cw = Math.min(wid * 0.38, unit * 0.06);
      return [endClip(-len / 2 + len * 0.03, -1, cw, mountPaint), endClip(len / 2, 1, cw, mountPaint)];
    }
    return [0.25, 0.75].map(t =>
      rackArm(down * surfHalf(t, shape) * wid, len / 2 - t * len, down, Math.min(wid * 0.3, unit * 0.06), mountPaint),
    );
  });
  const place = (spot: Point) => s`translate(${spot[0]} ${spot[1]}) rotate(${plan.rot})`;
  const [dx, dy] = unturn(unit * 0.012, unit * 0.022, plan.rot);
  const share = sharer(g, "surfpart");
  for (const [k, board] of boards.entries()) {
    const shade = mounts[k].map(m => m.shade).join("");
    const shadow = softShadow(g, el("use", { href: board.outline }) + el("path", { d: shade }), dx, dy);
    out += el("g", { transform: place(board.spot) }, share(shadow + mounts[k].map(m => m.back).join("")));
  }
  const clips = new Map<string, string>();
  for (const [k, board] of boards.entries()) {
    const { wid, len, outline } = board;
    const art = surfArt(g, board.style, wid, len, outline, board.pal, g.id(`surffade${k}`));
    let markup = "";
    if (!clips.has(outline)) {
      clips.set(outline, g.id(`surfclip${k}`));
      markup += el("defs", {}, el("clipPath", { id: clips.get(outline)! }, el("use", { href: outline })));
    }
    markup += el(
      "g",
      { "clip-path": `url(#${clips.get(outline)})` },
      art,
      // A soft shine down one rail.
      share(
        el("path", {
          d: s`M${-wid * 0.26} ${len * 0.32}Q${-wid * 0.34} 0 ${-wid * 0.14} ${-len * 0.34}`,
          fill: "none",
          stroke: "#fff",
          opacity: 0.25,
          "stroke-width": wid * 0.06,
          "stroke-linecap": "round",
        }),
      ),
    );
    markup += share(
      el("use", {
        href: outline,
        fill: "none",
        stroke: "#000",
        opacity: 0.12,
        "stroke-width": Math.max(0.8, wid * 0.012),
      }) + mounts[k].map(m => m.front).join(""),
    );
    out += el("g", { transform: place(board.spot) }, markup);
  }
  // Alt text.
  const words = graphics(
    boards.map(b => b.style),
    SURF_WORDS,
  );
  const longboards = boards.every(b => b.shape.name === "longboard");
  const noun = longboards ? "longboard" : "surfboard";
  const subject = count === 1 ? `A ${noun}` : `${capitalize(numberWord(count))} ${noun}s`;
  const hung =
    plan.kind === "up"
      ? `hung upright on a ${backdrop.name}`
      : `resting on ${count === 1 ? "a rack" : plan.kind === "stack" ? "racks one above another" : "racks side by side"} on a ${backdrop.name}`;
  note.alt(`${subject} with ${words}, ${hung}`);
  const middle = boards[Math.floor(count / 2)].spot;
  note.focus(middle[0], middle[1]);
  return out;
});

const darker = (c: string, t: number): string => mix(c, "#000000", t);
const lighter = (c: string, t: number): string => mix(c, "#ffffff", t);

/** A transform placing design units at (x, y), scaled and turned; mirrored left to right when flip. */
const place = (x: number, y: number, k: number, turn = 0, flip = false): string =>
  `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(1)}) scale(${(flip ? -k : k).toFixed(4)} ${k.toFixed(4)})`;

/** A circle in path data, so several can share one element. */
const dot = (x: number, y: number, r: number): string =>
  s`M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Something to lay out: its center and a radius that holds it, in design units. */
interface Spot {
  x: number;
  y: number;
  r: number;
}

/** Scales and centers a set of spots to fill the picture, leaving a margin. */
function fit(spots: readonly Spot[], w: number, h: number, margin: number) {
  const x0 = Math.min(...spots.map(p => p.x - p.r));
  const x1 = Math.max(...spots.map(p => p.x + p.r));
  const y0 = Math.min(...spots.map(p => p.y - p.r));
  const y1 = Math.max(...spots.map(p => p.y + p.r));
  const k = Math.min((w - margin * 2) / (x1 - x0), (h - margin * 2) / (y1 - y0));
  const at = (x: number, y: number): Point => [w / 2 + (x - (x0 + x1) / 2) * k, h / 2 + (y - (y0 + y1) / 2) * k];
  return { k, at };
}

/** Short grass seen from above, with mowing stripes. */
function grass(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(92, 122);
  const base = hex(hue, g.f(38, 50), g.f(36, 44));
  let out = el("rect", { width: w, height: h, fill: base });
  // Wide mowing stripes.
  const band = unit * g.f(0.3, 0.45);
  const tilt = g.f(-30, 30);
  let d = "";
  // Turned, they still cover the picture: it fits in a circle as wide as w + h.
  const reach = (w + h) * 0.6;
  for (let x = w / 2 - reach; x < w / 2 + reach; x += band * 2) d += s`M${x} ${h / 2 - reach}V${h / 2 + reach}`;
  out += el("path", {
    d,
    stroke: "#ffffff",
    opacity: 0.06,
    "stroke-width": band,
    transform: s`rotate(${tilt} ${w / 2} ${h / 2})`,
  });
  // Blades, as two tiles of different sizes so the repeat doesn't show.
  let defs = "";
  let layers = "";
  for (const [k, size] of [0.07, 0.097].entries()) {
    const t = unit * size;
    const id = g.id(`blades${k}`);
    let dark = "";
    let light = "";
    for (let j = 0; j < 5; j++) {
      const x = g.f(0, t);
      const y = g.f(0, t);
      const len = t * g.f(0.25, 0.45);
      const lean = g.f(-0.3, 0.3) * len;
      const blade = s`M${x} ${y}l${lean} ${-len}`;
      if (j % 2) dark += blade;
      else light += blade;
    }
    const wd = Math.max(0.8, unit * 0.005);
    defs += el(
      "pattern",
      { id, width: t, height: t, patternUnits: "userSpaceOnUse", patternTransform: s`rotate(${g.f(-8, 8)})` },
      el("path", { d: dark, stroke: hex(hue, 45, 26), "stroke-width": wd, "stroke-linecap": "round" }),
      el("path", { d: light, stroke: hex(hue - 8, 45, 56), "stroke-width": wd, "stroke-linecap": "round" }),
    );
    layers += el("rect", { width: w, height: h, fill: `url(#${id})`, opacity: 0.55 });
  }
  return out + el("defs", {}, defs) + layers;
}

/** The top of a wooden bench seen from above: planks running across with gaps between. */
function bench(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const hue = g.f(24, 38);
  const light = g.f(48, 66);
  let out = el("rect", { width: w, height: h, fill: hex(hue, 30, 18) });
  const count = Math.max(3, Math.round(h / (unit * g.f(0.2, 0.28))));
  const ph = h / count;
  const gap = Math.max(1.5, unit * 0.012);
  const off = g.f(0, ph);
  let grain = "";
  for (let k = -1; k <= count; k++) {
    const y = k * ph + off - ph / 2;
    out += el("rect", {
      y: y + gap / 2,
      width: w,
      height: ph - gap,
      fill: hex(hue + g.f(-3, 3), 38, light + g.f(-4, 4)),
    });
    for (let j = 0; j < 3; j++) {
      const gy = y + ph * g.f(0.2, 0.8);
      grain += s`M0 ${gy}C${w * 0.3} ${gy + g.f(-1, 1) * ph * 0.2} ${w * 0.7} ${gy + g.f(-1, 1) * ph * 0.2} ${w} ${gy}`;
    }
  }
  out += el("path", {
    d: grain,
    stroke: "#000",
    opacity: 0.08,
    fill: "none",
    "stroke-width": Math.max(1, unit * 0.004),
  });
  return out;
}

/** Ice seen from above, scratched by skates, with a painted line under it sometimes. */
function ice(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const id = g.id("ice");
  let out = el("defs", {}, lin(id, [hsl(g.f(195, 205), 45, 95), hsl(g.f(198, 210), 38, 87)]));
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  if (g.chance(0.4)) {
    const x = w * g.f(0.1, 0.9);
    out += el("path", {
      d: s`M${x} ${-h * 0.1}L${x + g.f(-0.3, 0.3) * w} ${h * 1.1}`,
      stroke: g.pick([hsl(355, 65, 58), hsl(220, 60, 52)]),
      opacity: 0.35,
      "stroke-width": unit * 0.09,
    });
  }
  // Skate scratches: long shallow arcs, and a little snow.
  let cut = "";
  let shade = "";
  for (let k = g.i(12, 18); k > 0; k--) {
    const x = g.f(-0.1, 1.1) * w;
    const y = g.f(0, 1) * h;
    const len = unit * g.f(0.3, 0.9);
    const a = g.f(0, Math.PI);
    const dx = Math.cos(a) * len;
    const dy = Math.sin(a) * len;
    const bend = g.f(-0.25, 0.25) * len;
    const arc = s`M${x} ${y}q${dx / 2 - (dy / len) * bend} ${dy / 2 + (dx / len) * bend} ${dx} ${dy}`;
    if (k % 3) cut += arc;
    else shade += arc;
  }
  out += el("path", {
    d: cut,
    stroke: "#ffffff",
    opacity: 0.8,
    fill: "none",
    "stroke-width": Math.max(0.8, unit * 0.004),
  });
  out += el("path", {
    d: shade,
    stroke: hsl(205, 25, 62),
    opacity: 0.3,
    fill: "none",
    "stroke-width": Math.max(0.6, unit * 0.003),
  });
  let snow = "";
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = g.f(0, w);
    const y = g.f(0, h);
    const r = unit * g.f(0.03, 0.07);
    snow += s`M${x - r} ${y}a${r} ${r * 0.4} 0 1 0 ${r * 2} 0a${r} ${r * 0.4} 0 1 0 ${-r * 2} 0`;
  }
  out += el("path", { d: snow, fill: "#ffffff", opacity: 0.55 });
  return out;
}

/** A ribbed rubber floor mat, as in a locker room, seen from above. */
function mat(g: Rand, w: number, h: number): string {
  const unit = Math.min(w, h);
  const base = hex(g.pick([210, 220, 30, 0, 150]), g.f(4, 14), g.f(20, 28));
  let out = el("rect", { width: w, height: h, fill: base });
  const t = unit * 0.045;
  const id = g.id("rib");
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id, width: t, height: t, patternUnits: "userSpaceOnUse", patternTransform: s`rotate(${g.pick([0, 45])})` },
      el("rect", {
        x: t * 0.15,
        y: t * 0.4,
        width: t * 0.7,
        height: t * 0.2,
        rx: t * 0.1,
        fill: "#ffffff",
        opacity: 0.08,
      }),
      el("rect", { x: t * 0.15, y: t * 0.62, width: t * 0.7, height: t * 0.08, fill: "#000", opacity: 0.25 }),
    ),
  );
  out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  // Seams between tiles.
  const tile = unit * g.f(0.55, 0.8);
  let d = "";
  for (let x = g.f(0, tile); x < w; x += tile) d += s`M${x} 0V${h}`;
  for (let y = g.f(0, tile); y < h; y += tile) d += s`M0 ${y}H${w}`;
  out += el("path", { d, stroke: "#000", opacity: 0.35, "stroke-width": Math.max(1, unit * 0.006) });
  return out;
}

/** A soft round shadow under something resting on a surface, in design units. */
const shadow = (x: number, y: number, rx: number, ry: number, opacity = 0.25): string =>
  el("ellipse", { cx: x, cy: y, rx, ry, fill: "#000", opacity });

/** A baseball seen from above at (0, 0), radius r: leather with two curving seams of V stitches. */
function baseballBall(g: Rand, r: number): string {
  const leather = g.pick(["#f5f1e6", "#f2ecdd", "#efe7d4"]);
  const thread = g.pick(["#d23a32", "#c8302e", "#d8463a"]);
  let out = el("circle", { cx: 0, cy: 0, r, fill: leather });
  let seam = "";
  let stitches = "";
  for (const side of [-1, 1]) {
    const p0: Point = [side * 0.5 * r, -0.86 * r];
    const p1: Point = [side * 0.02 * r, 0];
    const p2: Point = [side * 0.5 * r, 0.86 * r];
    seam += `M${pts([p0])}Q${pts([p1, p2])}`;
    for (let k = 1; k < 8; k++) {
      const t = k / 8;
      const x = (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1];
      const tx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
      const ty = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      const len = Math.hypot(tx, ty);
      const ux = tx / len;
      const uy = ty / len;
      // Each stitch is a little V pointing along the seam.
      const a = r * 0.15;
      const b = r * 0.07;
      stitches += s`M${x - uy * a - ux * b} ${y + ux * a - uy * b}L${x} ${y}L${x + uy * a - ux * b} ${y - ux * a - uy * b}`;
    }
  }
  out += el("path", { d: seam, fill: "none", stroke: thread, opacity: 0.45, "stroke-width": r * 0.04 });
  out += el("path", {
    d: stitches,
    fill: "none",
    stroke: thread,
    "stroke-width": r * 0.065,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  // Shading on the side away from the light.
  out += el("path", {
    d: s`M${-r * 0.7} ${r * 0.71}A${r} ${r} 0 0 0 ${r * 0.71} ${-r * 0.7}A${r * 1.15} ${r * 1.15} 0 0 1 ${-r * 0.7} ${r * 0.71}Z`,
    fill: "#000",
    opacity: 0.12,
  });
  return el("g", { transform: s`rotate(${g.f(-50, 50)})` }, out);
}

/** A ball with its shadow, at (x, y) in design units. */
const ballAt = (g: Rand, x: number, y: number, r: number): string =>
  shadow(x + r * 0.25, y + r * 0.3, r * 1.05, r * 0.95, 0.28) +
  el("g", { transform: s`translate(${x} ${y})` }, baseballBall(g, r));

/** Glove leather: tan, caramel, chestnut, near black or now and then a bold color. */
function gloveLeather(g: Rand): string {
  const pick = g.i(0, 5);
  return [
    hex(g.f(28, 34), g.f(50, 60), g.f(48, 56)),
    hex(g.f(22, 28), g.f(58, 68), g.f(38, 44)),
    hex(g.f(10, 18), g.f(45, 55), g.f(28, 34)),
    hex(g.f(210, 230), 8, g.f(16, 22)),
    hex(g.f(34, 40), g.f(40, 50), g.f(60, 66)),
    hex(g.pick([0, 215, 350, 200]), g.f(45, 60), g.f(30, 40)),
  ][pick];
}

/** Where a stall of length len, leaning ang degrees from straight up out of (x, y), has gone at t. */
const along = (x: number, y: number, ang: number, len: number, t: number, side = 0): Point => {
  const a = (ang * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  return [x + ux * len * t - uy * side, y + uy * len * t + ux * side];
};

/** A rounded stall (a finger or thumb) leaning ang degrees, from (x, y) up. */
const stall = (x: number, y: number, ang: number, len: number, wd: number, round = wd / 2): string =>
  el("rect", {
    x: -wd / 2,
    y: -len,
    width: wd,
    height: len + wd * 0.6,
    rx: round,
    transform: s`translate(${x} ${y}) rotate(${ang})`,
  });

type Stall = [x: number, y: number, ang: number, len: number, wd: number];

/**
 * A fielder's glove palm up, seen from above, fingers toward -y and the thumb on the left, about
 * 115 units long. The fingers are laced together nearly to their tips, and a wide laced web fills
 * the space between thumb and index finger. Its pocket is at (2, 0).
 */
function fieldersGlove(g: Rand, leather: string, lace: string): string {
  const deep = darker(leather, 0.22);
  // Pinky to index finger: wide and short, so only their rounded tips stand apart.
  const fingers: Stall[] = [
    [30, -2, 14, 35, 21],
    [16, -11, 5, 43, 21],
    [1, -14, -3, 46, 21],
    [-14, -11, -11, 42, 21],
  ];
  const thumb: Stall = [-28, 12, -50, 42, 22];
  const at = (f: Stall, t: number, side = 0) => along(f[0], f[1], f[2], f[3], t, side);
  let body = stall(...thumb);
  for (const f of fingers) body += stall(...f, f[4] * 0.3);
  let gaps = "";
  for (let j = 0; j < 3; j++) {
    const [right, left] = [fingers[j], fingers[j + 1]];
    gaps += `M${pts([at(left, 0), at(left, 0.97), at(right, 0.97), at(right, 0)])}Z`;
  }
  body += el("path", { d: gaps });
  body += el("ellipse", { cx: 3, cy: 6, rx: 34, ry: 33 });
  body += el("rect", { x: -27, y: 14, width: 56, height: 34, rx: 13 });

  // The web: from the thumb's tip to the index finger's, bulging out between them.
  const index = fingers[3];
  const [t0, t1] = [at(thumb, 0.2, 9), at(thumb, 1, 6)];
  const [i0, i1] = [at(index, 0.15, -8), at(index, 0.9, -6)];
  const mid: Point = [(t1[0] + i1[0]) / 2, (t1[1] + i1[1]) / 2];
  const out0 = Math.hypot(mid[0] - 2, mid[1]);
  const bulge: Point = [mid[0] + ((mid[0] - 2) / out0) * 7, mid[1] + (mid[1] / out0) * 7];
  const rim = `M${pts([t1])}Q${pts([bulge, i1])}`;
  const web = `M${pts([t0, t1])}Q${pts([bulge, i1])}L${pts([i0])}Z`;
  // The body is drawn twice, as a shadow and in leather, so it's written once.
  const id = g.id("glove");
  let out = el("defs", {}, el("g", { id }, body));
  out += el(
    "g",
    { transform: "translate(5 6)", fill: "#000", opacity: 0.25 },
    el("use", { href: `#${id}` }),
    el("path", { d: web }),
  );
  out += el("path", { d: web, fill: darker(leather, 0.32) });
  // A leather post up the middle of the web, crossed by laces, and a bound edge around its top.
  const top: Point = [0.25 * t1[0] + 0.5 * bulge[0] + 0.25 * i1[0], 0.25 * t1[1] + 0.5 * bulge[1] + 0.25 * i1[1]];
  const foot: Point = [(t0[0] + i0[0]) / 2, (t0[1] + i0[1]) / 2];
  out += el("path", { d: `M${pts([foot, top])}`, stroke: leather, "stroke-width": 9, "stroke-linecap": "round" });
  out += el("path", { d: `M${pts([foot, top])}`, stroke: deep, "stroke-width": 1.2, "stroke-dasharray": "2 3" });
  let ladder = "";
  for (let k = 1; k < 7; k++) {
    const t = k / 7;
    const a: Point = [t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t];
    const b: Point = [i0[0] + (i1[0] - i0[0]) * t, i0[1] + (i1[1] - i0[1]) * t];
    // Bow each rung outward a little, following the rim.
    const c: Point = [
      (a[0] + b[0]) / 2 + (bulge[0] - mid[0]) * t * 0.6,
      (a[1] + b[1]) / 2 + (bulge[1] - mid[1]) * t * 0.6,
    ];
    ladder += `M${pts([a])}Q${pts([c, b])}`;
  }
  out += el("path", { d: ladder, stroke: lace, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none" });
  out += el("path", { d: rim, stroke: leather, "stroke-width": 5, "stroke-linecap": "round", fill: "none" });
  out += el("path", { d: rim, stroke: lace, "stroke-width": 1.6, "stroke-dasharray": "2.5 3", fill: "none" });
  out += el("use", { href: `#${id}`, fill: leather });

  // Seams between the fingers and a highlight down each.
  let seams = "";
  let shine = "";
  for (let j = 0; j < 3; j++) {
    const [right, left] = [fingers[j], fingers[j + 1]];
    const between = (t: number): Point => {
      const [a, b] = [at(left, t), at(right, t)];
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    };
    seams += `M${pts([between(0.12), between(0.85)])}`;
  }
  for (const f of fingers) shine += `M${pts([at(f, 0.3, -f[4] * 0.12), at(f, 0.9, -f[4] * 0.12)])}`;
  shine += `M${pts([at(thumb, 0.3, -3), at(thumb, 0.9, -3)])}`;
  out += el("path", { d: seams, stroke: deep, "stroke-width": 1.3, "stroke-linecap": "round" });
  out += el("path", { d: shine, stroke: "#ffffff", opacity: 0.12, "stroke-width": 6, "stroke-linecap": "round" });
  // The pocket, the heel pad and the wrist strap with a small oval patch.
  out += el("ellipse", { cx: 2, cy: 0, rx: 24, ry: 25, fill: "#000", opacity: 0.16 });
  out += el("ellipse", { cx: 2, cy: 1, rx: 15, ry: 16, fill: "#000", opacity: 0.1 });
  out += el("path", { d: "M-24 26Q2 21 28 26", stroke: deep, "stroke-width": 1.4, fill: "none" });
  out += el("rect", { x: -25, y: 30, width: 52, height: 13, rx: 6, fill: darker(leather, 0.1) });
  out += el("ellipse", { cx: 12, cy: 36.5, rx: 7, ry: 4, fill: lighter(leather, 0.55) });
  out += el("path", { d: "M-22 46H26", stroke: lace, "stroke-width": 2.2, "stroke-dasharray": "3 3" });
  return out;
}

const BAT_FINISHES = ["ash", "maple", "dark", "two-tone", "metal"] as const;

/**
 * A baseball bat lying along +x, seen from above, centered on (0, 0) and len units long: the knob
 * at -len/2, a thin handle, the taper and the barrel. Returns the markup and whether it's metal.
 */
function bat(g: Rand, len: number): { out: string; metal: boolean } {
  const finish = g.pick(BAT_FINISHES);
  const knob = 8.5;
  const handle = 4.6;
  const barrel = 12.5;
  const x0 = -len / 2;
  // The profile, knob to barrel: distance along, half the width, and whether it eases in on a curve.
  const t0 = len * 0.36;
  const t1 = len * 0.72;
  const nodes: [number, number, boolean][] = [
    [0, knob * 0.7, false],
    [3, knob, false],
    [7, knob, false],
    [12, handle, false],
    [t0, handle * 1.15, false],
    [t1, barrel, true],
    [len - 4, barrel, false],
  ];
  const P = (x: number, y: number) => s`${x0 + x} ${y}`;
  const edge = (sc: number, back: boolean): string => {
    const list = back ? [...nodes].reverse() : nodes;
    return list
      .map(([x, hw], i) => {
        if (i === 0) return "";
        const [px, pw] = list[i - 1];
        const curved = back ? list[i - 1][2] : list[i][2];
        const mid = (px + x) / 2;
        return curved ? `C${P(mid, pw * sc)} ${P(mid, hw * sc)} ${P(x, hw * sc)}` : `L${P(x, hw * sc)}`;
      })
      .join("");
  };
  /** The band of the bat between -from and +to times its half width, rounded off at the end when end. */
  const strip = (from: number, to: number, end = true): string => {
    const cap = end
      ? s`Q${x0 + len + 1} ${-barrel * from} ${x0 + len + 1} ${(to - from) * barrel * 0.5}Q${x0 + len + 1} ${barrel * to} ${x0 + len - 4} ${barrel * to}`
      : s`L${x0 + len - 4} ${barrel * to}`;
    return `M${P(0, -nodes[0][1] * from)}${edge(-from, false)}${cap}${edge(to, true)}Z`;
  };
  const outline = strip(1, 1);
  const wood = {
    ash: hex(g.f(36, 42), g.f(45, 58), g.f(70, 77)),
    maple: hex(g.f(26, 32), g.f(42, 55), g.f(58, 66)),
    dark: g.pick([hex(10, 8, 17), hex(5, 45, 26), hex(215, 30, 22)]),
    "two-tone": hex(g.f(32, 38), g.f(45, 55), g.f(66, 72)),
    metal: hex(g.f(0, 360), g.f(0, 35), g.f(55, 68)),
  }[finish];
  let out = el("path", { d: outline, fill: "#000", opacity: 0.25, transform: "translate(4 5)" });
  out += el("path", { d: outline, fill: wood });
  if (finish === "two-tone") {
    // A dark barrel, starting partway up the taper.
    const split = len * 0.62;
    const t = (split - t0) / (t1 - t0);
    const hs = handle * 1.15 + (barrel - handle * 1.15) * t * t * (3 - 2 * t);
    const end = s`L${x0 + len - 4} ${-barrel}Q${x0 + len + 1} ${-barrel} ${x0 + len + 1} 0Q${x0 + len + 1} ${barrel} ${x0 + len - 4} ${barrel}`;
    out += el("path", {
      d: `M${P(split, -hs)}L${P(t1, -barrel)}${end}L${P(t1, barrel)}L${P(split, hs)}Z`,
      fill: g.pick([hex(10, 8, 17), hex(5, 45, 26)]),
    });
  }
  // Grip tape wound round the handle: always on metal bats, sometimes on wood.
  if (finish === "metal" || g.chance(0.3)) {
    const grip = g.pick(["#1d1d20", hex(g.f(0, 360), 55, 42), "#e9e4d8"]);
    const gx = len * 0.3;
    out += el("rect", { x: x0 + 7, y: -handle * 1.08, width: gx - 7, height: handle * 2.16, rx: 2, fill: grip });
    let wraps = "";
    for (let x = 10; x < gx - 2; x += 7) wraps += s`M${x0 + x} ${-handle}l3 ${handle * 2}`;
    out += el("path", { d: wraps, stroke: "#000", opacity: 0.25, "stroke-width": 0.9 });
  }
  // The knob's lip, and a burned or printed label on the barrel.
  out += el("path", {
    d: s`M${x0 + 7} ${-knob}V${knob}`,
    stroke: "#000",
    opacity: 0.2,
    "stroke-width": 1.4,
  });
  const lx = x0 + len * 0.8;
  if (finish === "metal") {
    out += el("rect", {
      x: lx - len * 0.07,
      y: -barrel * 0.5,
      width: len * 0.14,
      height: barrel,
      rx: 2,
      fill: g.pick(["#1d1d20", "#f4f1e8", hex(g.f(0, 360), 60, 45)]),
    });
  } else {
    out += el("ellipse", {
      cx: lx,
      cy: 0,
      rx: len * 0.05,
      ry: barrel * 0.5,
      fill: "none",
      stroke: "#000",
      opacity: 0.35,
      "stroke-width": 1.6,
    });
    out += el("path", {
      d: s`M${lx - len * 0.03} 0H${lx + len * 0.03}`,
      stroke: "#000",
      opacity: 0.3,
      "stroke-width": 2.4,
    });
  }
  // Rounded light along the top and shade along the bottom.
  out += el("path", { d: strip(0.62, -0.2, false), fill: "#ffffff", opacity: finish === "metal" ? 0.4 : 0.22 });
  out += el("path", { d: strip(-0.35, 1, false), fill: "#000", opacity: 0.16 });
  return { out, metal: finish === "metal" };
}

/** A baseball cap seen from above, crown radius 34, brim toward +y. */
function cap(g: Rand): string {
  const hue = g.f(0, 360);
  const crown = g.chance(0.25) ? hex(hue, 10, g.f(18, 26)) : hex(hue, g.f(40, 65), g.f(32, 50));
  // The brim is a shade darker than the crown, or a contrasting color, so it always stands out.
  const brimPaint = g.chance(0.55)
    ? darker(crown, 0.42)
    : g.pick([hex(hue + 180, 40, 45), "#f1ede4", hex(hue, 10, 22), hex(hue, 50, 72)]);
  const r = 34;
  // The brim, a wide curved bill reaching well out from the front.
  const brim = s`M${-r * 0.99} ${r * 0.15}C${-r * 1.04} ${r * 2.4} ${r * 1.04} ${r * 2.4} ${r * 0.99} ${r * 0.15}Z`;
  let out = el(
    "g",
    { transform: "translate(4 5)", fill: "#000", opacity: 0.25 },
    el("circle", { cx: 0, cy: 0, r }),
    el("path", { d: brim }),
  );
  out += el("path", { d: brim, fill: brimPaint });
  out += el("path", {
    d: s`M${-r * 0.88} ${r * 0.5}C${-r * 0.9} ${r * 2.2} ${r * 0.9} ${r * 2.2} ${r * 0.88} ${r * 0.5}
         M${-r * 0.78} ${r * 0.62}C${-r * 0.8} ${r * 2.02} ${r * 0.8} ${r * 2.02} ${r * 0.78} ${r * 0.62}`,
    stroke: lighter(brimPaint, 0.35),
    opacity: 0.8,
    "stroke-width": 1.1,
    fill: "none",
    "stroke-dasharray": "2.5 2",
  });
  // The crown, with six panels meeting at a button.
  out += el("circle", { cx: 0, cy: 0, r, fill: crown });
  // A shade line where the crown meets the brim.
  out += el("path", {
    d: s`M${-r * 0.99} ${r * 0.15}A${r} ${r} 0 0 0 ${r * 0.99} ${r * 0.15}`,
    stroke: "#000",
    opacity: 0.3,
    "stroke-width": 2.2,
    fill: "none",
  });
  let seams = "";
  for (let k = 0; k < 6; k++) {
    const a = ((k * 60 + 30) * Math.PI) / 180;
    seams += s`M0 0L${Math.cos(a) * r} ${Math.sin(a) * r}`;
  }
  out += el("path", { d: seams, stroke: darker(crown, 0.3), "stroke-width": 1.4 });
  // Eyelets, one per panel.
  let holes = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    holes += dot(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 1.4);
  }
  out += el("path", { d: holes, fill: darker(crown, 0.4) });
  // An abstract emblem on the front panels, sometimes.
  const accent = g.pick(["#f4f1e8", hex(hue + 180, 60, 60), hex(48, 85, 60)]);
  const mark = g.i(0, 3);
  if (mark === 1) out += el("circle", { cx: 0, cy: r * 0.62, r: r * 0.17, fill: accent });
  if (mark === 2)
    out += el("path", {
      d: s`M0 ${r * 0.44}L${r * 0.18} ${r * 0.64}L0 ${r * 0.84}L${-r * 0.18} ${r * 0.64}Z`,
      fill: accent,
    });
  if (mark === 3) {
    const star: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      const rr = (k % 2 ? 0.08 : 0.19) * r;
      star.push([Math.cos(a) * rr, r * 0.64 + Math.sin(a) * rr]);
    }
    out += el("path", { d: `M${pts(star)}Z`, fill: accent });
  }
  // Light on the dome, shade on its far side, and the button.
  out += el("circle", { cx: -r * 0.3, cy: -r * 0.3, r: r * 0.5, fill: "#ffffff", opacity: 0.1 });
  out += el("path", {
    d: s`M${-r * 0.7} ${r * 0.71}A${r} ${r} 0 0 0 ${r * 0.71} ${-r * 0.7}A${r * 1.2} ${r * 1.2} 0 0 1 ${-r * 0.7} ${r * 0.71}Z`,
    fill: "#000",
    opacity: 0.15,
  });
  out += el("circle", { cx: 0, cy: 0, r: 3.4, fill: darker(crown, 0.15) });
  out += el("circle", { cx: -0.8, cy: -0.8, r: 1.4, fill: "#ffffff", opacity: 0.25 });
  return out;
}

/** A bat, a ball, a glove and a cap on the grass: all four, or three of them. */
export const baseball = defineKind("baseball", "Baseball", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = grass(g, w, h);
  const left = g.pick(["none", "bat", "ball", "glove", "cap"] as const);
  const has = { bat: left !== "bat", ball: left !== "ball", glove: left !== "glove", cap: left !== "cap" };
  const inPocket = has.ball && has.glove && g.chance(0.6);
  // The smaller pieces sit in a row along the picture's long side, beside the bat when there is one.
  const ratio = w / h;
  const axis = ratio > 1.15 ? 0 : ratio < 0.87 ? 90 : g.pick([30, -30]);
  const a = ((axis + g.f(-8, 8)) * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const toXY = (u: number, v: number): Point => [u * ux - v * uy, u * uy + v * ux];
  const side = g.pick([-1, 1]);
  type Piece = "glove" | "cap" | "ball";
  const row: Piece[] = [];
  if (has.glove) row.push("glove");
  if (has.cap) row.push("cap");
  if (has.ball && !inPocket) row.push("ball");
  const order = row.map(p => ({ p, key: g.f(0, 1) })).sort((m, n) => m.key - n.key);
  const radius = { glove: 62, cap: 50, ball: 18 };
  const gap = has.bat ? 12 : 20;
  const length = order.reduce((sum, { p }) => sum + radius[p] * 2, 0) + gap * (order.length - 1);
  let u = -length / 2;
  const spots: Spot[] = [];
  const placed: { p: Piece; x: number; y: number }[] = [];
  for (const { p } of order) {
    u += radius[p];
    const v = has.bat ? side * (radius[p] + 24) : g.f(-0.25, 0.25) * radius[p];
    const [x, y] = toXY(u, v);
    placed.push({ p, x, y });
    spots.push({ x, y, r: radius[p] });
    u += radius[p] + gap;
  }
  const batLen = 290;
  const batShift = g.f(-0.08, 0.08) * batLen;
  const batTurn = (Math.atan2(uy, ux) * 180) / Math.PI + g.f(-3, 3) + (g.chance(0.5) ? 180 : 0);
  if (has.bat) {
    for (let t = -0.5; t <= 0.5; t += 0.1) {
      const [x, y] = toXY(batShift + t * batLen, 0);
      spots.push({ x, y, r: 14 });
    }
  }
  const { k, at } = fit(spots, w, h, unit * 0.05);
  let metal = false;
  if (has.bat) {
    const [bx, by] = at(...toXY(batShift, 0));
    const made = bat(g, batLen);
    metal = made.metal;
    out += el("g", { transform: place(bx, by, k, batTurn) }, made.out);
  }
  const leather = gloveLeather(g);
  const lace = g.chance(0.6) ? darker(leather, 0.35) : lighter(leather, 0.4);
  let focus: Point = [w / 2, h / 2];
  for (const { p, x, y } of placed) {
    const [px, py] = at(x, y);
    if (p === "cap") {
      // The brim points away from the bat, or out to one side of the row, never under its neighbors.
      const turn = (Math.atan2(side * uy, side * ux) * 180) / Math.PI;
      const [dx, dy] = [-side * uy * 12 * k, side * ux * 12 * k];
      out += el("g", { transform: place(px - dx, py - dy, k, turn + g.f(-40, 40)) }, cap(g));
    } else if (p === "glove") {
      let mitt = fieldersGlove(g, leather, lace);
      if (inPocket) mitt += ballAt(g, 2, -2, 14);
      out += el("g", { transform: place(px, py - k * 4, k, g.f(-25, 25), g.chance(0.3)) }, mitt);
      focus = [px, py];
    } else {
      out += el("g", { transform: place(px, py, k) }, ballAt(g, 0, 0, 14));
      if (!has.glove) focus = [px, py];
    }
  }
  const batName = `a ${metal ? "metal" : "wooden"} ${has.ball ? "" : "baseball "}bat`;
  const things = inPocket
    ? `A baseball resting in a glove beside ${andList([has.bat && batName, has.cap && "a cap"])}`
    : capitalize(andList([has.ball && "a baseball", has.bat && batName, has.glove && "a glove", has.cap && "a cap"]));
  note.alt(`${things} on the grass`);
  note.focus(...focus);
  return out;
});

/**
 * A football helmet in profile facing +x, about 120 units long with its mask. Returns the markup
 * and the lowest point of the chin cup and the back rim, for resting it on the ground.
 */
function helmet(g: Rand): string {
  const hue = g.f(0, 360);
  const shell = g.pick([
    hex(hue, g.f(55, 75), g.f(38, 50)),
    hex(hue, g.f(55, 75), g.f(38, 50)),
    hex(hue, 10, g.f(16, 24)),
    hex(hue, 8, g.f(86, 92)),
    hex(g.f(40, 48), 65, 52),
  ]);
  const stripe = g.pick(["#f4f1e8", hex(hue + 180, 60, 55), hex(hue, 15, 18), hex(45, 80, 58)]);
  const mask = g.pick(["#f1efe9", "#a7adb4", hex(hue, 10, 20), hex(hue + g.f(150, 210), 55, 50)]);
  const id = g.id("shell");
  const outline = `M-46 0C-58 -30-44 -76-4 -80C30 -82 52 -62 54 -42Q55 -36 49 -35L30 -35Q22 -34 22 -24
    L24 -2Q25 6 16 6L-8 5Q-20 1-32 1Q-42 1-46 0Z`;
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: outline })));
  // The inside of the helmet, seen through the mask.
  out += el("path", { d: "M22 -34L50 -35Q66 -30 66 -8Q64 6 50 10L22 4Z", fill: "#26272b", opacity: 0.6 });
  out += el("path", { d: outline, fill: shell });
  let paint = "";
  // The stripe down the middle of the crown, which shows along the top in profile.
  paint += el("path", {
    d: "M58 -44C52 -70 30 -86-4 -84C-44 -82-62 -36-50 -2",
    fill: "none",
    stroke: stripe,
    "stroke-width": g.pick([9, 12]),
  });
  if (g.chance(0.5))
    paint += el("path", {
      d: "M58 -44C52 -70 30 -86-4 -84C-44 -82-62 -36-50 -2",
      fill: "none",
      stroke: shell,
      "stroke-width": 3,
    });
  // A simple decal on the side.
  const decal = g.i(0, 3);
  const accent = g.pick([stripe, "#f4f1e8", hex(hue + 180, 60, 55)]);
  if (decal === 1) paint += el("circle", { cx: -14, cy: -44, r: 14, fill: accent });
  if (decal === 2) {
    const star: Point[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      const rr = k % 2 ? 6.5 : 16;
      star.push([-14 + Math.cos(a) * rr, -44 + Math.sin(a) * rr]);
    }
    paint += el("path", { d: `M${pts(star)}Z`, fill: accent });
  }
  if (decal === 3) paint += el("path", { d: "M-6 -62L-24 -42L-14 -42L-22 -24L0 -48L-10 -48Z", fill: accent });
  // Shade along the bottom and a gloss highlight on top.
  paint += el("ellipse", { cx: 0, cy: 6, rx: 70, ry: 24, fill: "#000", opacity: 0.16 });
  paint += el("ellipse", {
    cx: -8,
    cy: -64,
    rx: 24,
    ry: 8,
    transform: "rotate(-18 -8 -64)",
    fill: "#ffffff",
    opacity: 0.3,
  });
  out += el("g", { "clip-path": `url(#${id})` }, paint);
  // The ear hole and the edge padding.
  out += el("circle", { cx: 4, cy: -22, r: 4.5, fill: "#1f2024" });
  out += el("circle", { cx: 4, cy: -22, r: 6.5, fill: "none", stroke: "#000", opacity: 0.2, "stroke-width": 1.5 });
  out += el("path", { d: "M-44 -2Q-30 -2-10 2", stroke: "#26272b", "stroke-width": 3, fill: "none" });
  // The chin strap and cup.
  out += el("path", { d: "M14 -8Q30 6 50 12", stroke: darker(mask, 0.25), "stroke-width": 2.5, fill: "none" });
  out += el("ellipse", {
    cx: 52,
    cy: 12,
    rx: 8,
    ry: 5,
    transform: "rotate(-20 52 12)",
    fill: g.pick(["#f1efe9", "#26272b"]),
  });
  // The face mask: a cage of bars clipped on at the brow and the jaw.
  out += el("path", {
    d: `M49 -36Q70 -32 68 -8Q66 8 50 10M24 -22Q46 -25 68 -20M24 -6Q44 -4 64 2M44 -34Q49 -14 42 9`,
    fill: "none",
    stroke: mask,
    "stroke-width": 3.6,
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: "M22 -25v5M22 -9v5",
    stroke: darker(shell, 0.3),
    "stroke-width": 4,
    "stroke-linecap": "round",
  });
  return out;
}

/** An American football in profile, centered at (0, 0), half-length L, laces toward the viewer. */
function footballBall(g: Rand, L: number, R: number): string {
  const leather = hex(g.f(14, 24), g.f(45, 60), g.f(30, 38));
  const id = g.id("ball");
  const shape = s`M${-L} 0C${-L * 0.55} ${-R * 1.36} ${L * 0.55} ${-R * 1.36} ${L} 0C${L * 0.55} ${R * 1.36} ${-L * 0.55} ${R * 1.36} ${-L} 0Z`;
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: shape })));
  out += el("path", { d: shape, fill: leather });
  let inner = "";
  // Stripes near the ends, sometimes.
  if (g.chance(0.5))
    inner += el("path", {
      d: s`M${-L * 0.6} ${-R}Q${-L * 0.52} 0 ${-L * 0.6} ${R}M${L * 0.6} ${-R}Q${L * 0.52} 0 ${L * 0.6} ${R}`,
      fill: "none",
      stroke: "#f4f1e6",
      "stroke-width": R * 0.16,
    });
  // Panel seams running end to end.
  inner += el("path", {
    d: s`M${-L} 0Q0 ${-R * 0.75} ${L} 0M${-L} 0Q0 ${R * 0.9} ${L} 0`,
    fill: "none",
    stroke: "#000",
    opacity: 0.25,
    "stroke-width": R * 0.04,
  });
  inner += el("ellipse", { cx: 0, cy: R * 0.75, rx: L, ry: R * 0.5, fill: "#000", opacity: 0.18 });
  inner += el("ellipse", { cx: -L * 0.35, cy: -R * 0.3, rx: L * 0.3, ry: R * 0.14, fill: "#ffffff", opacity: 0.14 });
  out += el("g", { "clip-path": `url(#${id})` }, inner);
  // The laces: one long strip with short cross laces over it.
  const ly = -R * 0.55;
  let cross = "";
  for (let k = 0; k < 8; k++) {
    const x = -L * 0.26 + (k * L * 0.52) / 7;
    cross += s`M${x} ${ly - R * 0.12}V${ly + R * 0.12}`;
  }
  out += el("path", {
    d: s`M${-L * 0.3} ${ly + R * 0.03}Q0 ${ly - R * 0.06} ${L * 0.3} ${ly + R * 0.03}`,
    fill: "none",
    stroke: "#f4f1e6",
    "stroke-width": R * 0.07,
  });
  out += el("path", { d: cross, stroke: "#f4f1e6", "stroke-width": R * 0.075, "stroke-linecap": "round" });
  return out;
}

/** A football helmet and a ball resting on the grass of a field or on a locker-room bench. */
export const football = defineKind("football", "Football", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const where = g.pick(["grass", "grass", "bench"] as const);
  const gy = h * g.f(0.76, 0.82);
  let out = "";
  if (where === "grass") {
    // A low view across the field: blurred distance above, grass below.
    const hy = h * g.f(0.3, 0.42);
    const hue = g.f(95, 120);
    const back = g.id("back");
    const turf = g.id("turf");
    out += el(
      "defs",
      {},
      lin(back, [hsl(g.f(200, 215), 35, g.f(70, 80)), hsl(hue, 22, 60)]),
      lin(turf, [hsl(hue, 30, 52), hsl(hue, 45, 34)]),
    );
    out += el("rect", { width: w, height: hy + 1, fill: `url(#${back})` });
    let bokeh = "";
    for (let k = g.i(4, 8); k > 0; k--) bokeh += dot(g.f(0, w), hy * g.f(0.2, 0.8), unit * g.f(0.03, 0.07));
    out += el("path", { d: bokeh, fill: "#ffffff", opacity: 0.18 });
    out += el("rect", { y: hy, width: w, height: h - hy, fill: `url(#${turf})` });
    // A yard line across the field behind the gear.
    const ly = hy + (gy - hy) * g.f(0.25, 0.55);
    out += el("rect", {
      y: ly,
      width: w,
      height: unit * 0.018 * (1 + (ly - hy) / (h - hy)),
      fill: "#f4f4ee",
      opacity: 0.75,
    });
    // Blades of grass in front.
    let blades = "";
    for (let x = g.f(0, 4); x < w; x += Math.max(unit * g.f(0.015, 0.035), w / 110)) {
      const y = gy + g.f(0, h - gy);
      blades += s`M${x} ${y + unit * 0.02}l${g.f(-1, 1) * unit * 0.01} ${-unit * g.f(0.02, 0.05)}`;
    }
    out += el("path", { d: blades, stroke: hsl(hue, 45, 26), opacity: 0.5, "stroke-width": Math.max(1, unit * 0.005) });
  } else {
    // A row of lockers behind a wooden bench.
    const tone = hex(g.f(0, 360), g.f(15, 35), g.f(45, 60));
    out += el("rect", { width: w, height: h, fill: tone });
    const lw = unit * g.f(0.2, 0.26);
    let lines = "";
    let vents = "";
    for (let x = g.f(-lw, 0); x < w; x += lw) {
      lines += s`M${x} 0V${gy}`;
      for (let k = 0; k < 4; k++) vents += s`M${x + lw * 0.25} ${h * 0.08 + k * unit * 0.025}h${lw * 0.5}`;
      vents += s`M${x + lw * 0.8} ${gy * 0.5}v${unit * 0.06}`;
    }
    out += el("path", { d: lines, stroke: "#000", opacity: 0.3, "stroke-width": Math.max(1.5, unit * 0.008) });
    out += el("path", {
      d: vents,
      stroke: "#000",
      opacity: 0.25,
      "stroke-width": Math.max(1.5, unit * 0.01),
      "stroke-linecap": "round",
    });
    const wood = hex(g.f(24, 36), 40, g.f(50, 62));
    out += el("rect", { y: gy - unit * 0.05, width: w, height: unit * 0.1, fill: wood });
    out += el("rect", { y: gy + unit * 0.05, width: w, height: unit * 0.07, fill: darker(wood, 0.25) });
    out += el("rect", { y: gy + unit * 0.12, width: w, height: h, fill: "#000", opacity: 0.45 });
  }
  // The helmet and ball side by side, sometimes with the ball in front.
  const flip = g.chance(0.5);
  const ballFirst = g.chance(0.5);
  const front = g.chance(0.35);
  const L = 36;
  const R = 22;
  const tilt = g.f(-8, 8);
  const helmetW = 125;
  const gap = front ? -24 : g.f(6, 18);
  const span = helmetW + gap + L * 2;
  const k = Math.min((w * 0.86) / span, (gy - h * 0.06) / 100);
  const left = w / 2 - (span * k) / 2;
  const helmetX = ballFirst ? left + (L * 2 + gap) * k + 60 * k : left + 60 * k;
  const ballX = ballFirst ? left + L * k : left + (helmetW + gap + L) * k;
  // Rest the helmet on its chin cup and back rim: turn it about the chin until the rim comes down.
  const lean = (Math.atan2(17, 98) * 180) / Math.PI;
  const helmetPart =
    el("ellipse", { cx: helmetX, cy: gy, rx: 66 * k, ry: 6 * k, fill: "#000", opacity: 0.25 }) +
    el(
      "g",
      {
        transform: `translate(${helmetX.toFixed(1)} ${(gy - 17 * k).toFixed(1)}) scale(${(flip ? -k : k).toFixed(4)} ${k.toFixed(4)}) rotate(${(-lean).toFixed(1)} 52 17)`,
      },
      helmet(g),
    );
  const lowest = Math.sqrt((L * Math.sin((tilt * Math.PI) / 180)) ** 2 + (R * Math.cos((tilt * Math.PI) / 180)) ** 2);
  const by = gy + (front ? unit * 0.03 : 0);
  const ballPart =
    el("ellipse", { cx: ballX, cy: by, rx: L * 1.1 * k, ry: 5 * k, fill: "#000", opacity: 0.25 }) +
    el("g", { transform: place(ballX, by - lowest * k, k, tilt, g.chance(0.5)) }, footballBall(g, L, R));
  out += front ? helmetPart + ballPart : ballPart + helmetPart;
  note.alt(
    `A football helmet and a ball ${where === "grass" ? "on the grass of a field" : "on a bench in a locker room"}`,
  );
  note.focus(helmetX, gy - 45 * k);
  return out;
});

/** A hockey stick lying flat, butt at (0, 0) and shaft along +x, blade turning toward -y. */
function stick(g: Rand, len: number): string {
  const wood = g.chance(0.4);
  const shaftPaint = wood ? hex(g.f(30, 38), 45, g.f(58, 68)) : hex(g.f(0, 360), g.f(10, 50), g.f(18, 40));
  const accent = hex(g.f(0, 360), 65, 55);
  const tape = g.pick(["#1f2024", "#f2f1ec", hex(220, 40, 28), "#e3e1d8"]);
  const knobTape = g.pick(["#f2f1ec", "#1f2024", tape]);
  const sw = len * 0.032;
  const bl = len * 0.21;
  const bh = len * 0.055;
  let out = "";
  // The blade, turned 45 degrees at the heel with its bottom edge on the outside of the bend, its toe
  // rounded and curving a little. It is drawn upside down, then flipped into place.
  const blade = s`M${-sw * 0.6} ${-sw / 2}L${bl * 0.8} ${-sw / 2 - bh * 0.12}Q${bl} ${-sw / 2 - bh * 0.15} ${bl * 1.02} ${bh * 0.4}
    Q${bl} ${bh - sw / 2} ${bl * 0.8} ${bh - sw / 2}L${sw * 0.4} ${bh - sw / 2}Q${-sw * 0.8} ${bh - sw / 2} ${-sw * 0.6} ${-sw / 2}Z`;
  const id = g.id("blade");
  let tapeMarks = "";
  for (let k = 0; k < 9; k++) {
    const x = bl * (0.18 + k * 0.095);
    tapeMarks += s`M${x} ${-bh * 0.3}l${bh * 0.25} ${bh * 1.6}`;
  }
  const bladeGroup =
    el("defs", {}, el("clipPath", { id }, el("path", { d: blade }))) +
    el("path", { d: blade, fill: shaftPaint }) +
    el(
      "g",
      { "clip-path": `url(#${id})` },
      el("rect", { x: bl * 0.16, y: -bh, width: bl, height: bh * 2, fill: tape }),
      el("path", { d: tapeMarks, stroke: "#000", opacity: 0.2, "stroke-width": len * 0.003 }),
    );
  // The shadow, then the shaft and blade.
  const shade = `translate(${(len * 0.012).toFixed(1)} ${(len * 0.016).toFixed(1)})`;
  out += el(
    "g",
    { transform: shade, fill: "#000", opacity: 0.2 },
    el("rect", { x: 0, y: -sw / 2, width: len, height: sw, rx: sw * 0.3 }),
    el("path", { d: blade, transform: s`translate(${len} 0) rotate(-45) scale(1 -1)` }),
  );
  out += el("g", { transform: s`translate(${len} 0) rotate(-45) scale(1 -1)` }, bladeGroup);
  out += el("rect", { x: 0, y: -sw / 2, width: len, height: sw, rx: sw * 0.3, fill: shaftPaint });
  // A graphic band on a composite shaft, or grain on a wooden one.
  if (wood)
    out += el("path", {
      d: s`M${len * 0.15} ${-sw * 0.15}H${len * 0.6}M${len * 0.4} ${sw * 0.2}H${len * 0.9}`,
      stroke: "#000",
      opacity: 0.12,
      "stroke-width": len * 0.003,
    });
  else out += el("rect", { x: len * 0.55, y: -sw / 2, width: len * 0.18, height: sw, fill: accent });
  out += el("rect", { x: 0, y: -sw * 0.42, width: len, height: sw * 0.22, fill: "#ffffff", opacity: 0.18 });
  // Tape wound around the top of the shaft, building a knob at the end.
  let wraps = "";
  for (let k = 0; k < 7; k++) wraps += s`M${len * (0.012 + k * 0.012)} ${-sw * 0.56}l${len * 0.01} ${sw * 1.12}`;
  out += el("rect", {
    x: -len * 0.006,
    y: -sw * 0.56,
    width: len * 0.1,
    height: sw * 1.12,
    rx: sw * 0.3,
    fill: knobTape,
  });
  out += el("ellipse", { cx: 0, cy: 0, rx: sw * 0.45, ry: sw * 0.68, fill: knobTape });
  out += el("ellipse", { cx: 0, cy: 0, rx: sw * 0.45, ry: sw * 0.68, fill: "#000", opacity: 0.12 });
  out += el("path", { d: wraps, stroke: "#000", opacity: 0.2, "stroke-width": len * 0.003 });
  return out;
}

/** A hockey puck at (0, 0), seen at an angle: its top face and the band of its side. */
function puck(r: number): string {
  const ry = r * 0.6;
  const t = r * 0.5;
  return (
    el("ellipse", { cx: r * 0.15, cy: t + ry * 0.2, rx: r * 1.15, ry: ry * 1.1, fill: "#000", opacity: 0.25 }) +
    el("path", { d: s`M${-r} 0V${t}A${r} ${ry} 0 0 0 ${r} ${t}V0Z`, fill: "#141518" }) +
    el("path", {
      d: s`M${-r} ${t * 0.35}A${r} ${ry} 0 0 0 ${r} ${t * 0.35}`,
      fill: "none",
      stroke: "#ffffff",
      opacity: 0.08,
      "stroke-width": r * 0.06,
    }) +
    el("ellipse", { cx: 0, cy: 0, rx: r, ry, fill: "#26282c" }) +
    el("ellipse", { cx: 0, cy: 0, rx: r * 0.45, ry: ry * 0.45, fill: "#ffffff", opacity: 0.12 })
  );
}

/** A hockey player's helmet lying face up, seen from the front, about 48 units tall. */
function playerHelmet(g: Rand, visor: boolean): string {
  const shell = g.pick([hex(g.f(0, 360), g.f(50, 70), g.f(35, 50)), hex(220, 10, 18), "#eeece6"]);
  const metal = g.pick(["#c9cdd2", "#26272b", "#e9e7e1"]);
  const outline =
    "M-20 6C-22 -14-13 -27 0 -27C13 -27 22 -14 20 6L18 16Q16 19 13 17L13 0Q0 -5-13 0L-13 17Q-16 19-18 16Z";
  let out = el("path", { d: outline, transform: "translate(2.5 3)", fill: "#000", opacity: 0.25 });
  if (!visor)
    out += el("path", {
      d: "M-14 -2L-14 12Q-12 22 0 25Q12 22 14 12L14 -2Z",
      transform: "translate(2.5 3)",
      fill: "#000",
      opacity: 0.2,
    });
  // The padded inside, seen through the face opening.
  out += el("path", { d: "M-14 -2Q0 -6 14 -2L14 16Q0 24-14 16Z", fill: "#2a2b30" });
  out += el("path", { d: "M-9 3Q0 0 9 3", stroke: "#000", opacity: 0.4, "stroke-width": 1.2, fill: "none" });
  out += el("path", { d: outline, fill: shell });
  // Vents and ridges on the dome, ear holes, and the shading.
  out += el("path", {
    d: "M-10 -16v-4M0 -19v-5M10 -16v-4",
    stroke: "#000",
    opacity: 0.4,
    "stroke-width": 3,
    "stroke-linecap": "round",
  });
  out += el("path", {
    d: "M-6 -6Q-7 -16-5 -25M6 -6Q7 -16 5 -25",
    stroke: "#000",
    opacity: 0.12,
    "stroke-width": 1.2,
    fill: "none",
  });
  out += el("path", { d: dot(-16, 8, 1.6) + dot(16, 8, 1.6), fill: "#1f2024" });
  out += el("ellipse", {
    cx: -8,
    cy: -19,
    rx: 7,
    ry: 4,
    transform: "rotate(-25 -8 -19)",
    fill: "#ffffff",
    opacity: 0.28,
  });
  // The chin strap.
  out += el("path", { d: "M-15 15Q-8 26 0 27Q8 26 15 15", stroke: "#1f2024", "stroke-width": 1.4, fill: "none" });
  if (visor) {
    out += el("path", { d: "M-15 -3Q0 -7 15 -3L14 8Q0 12-14 8Z", fill: hsl(200, 35, 85), opacity: 0.45 });
    out += el("path", { d: "M-12 -1Q-6 -3-2 -3", stroke: "#ffffff", opacity: 0.8, "stroke-width": 1.2, fill: "none" });
    out += el("path", { d: dot(-14, 2, 1.1) + dot(14, 2, 1.1), fill: metal });
  } else {
    // A wire cage over the face, with a chin cup.
    out += el("path", {
      d: "M-14 -2L-14 12Q-12 22 0 25Q12 22 14 12L14 -2M-9 -2V19M-4.5 -2V22M0 -2V24M4.5 -2V22M9 -2V19M-14 6H14M-13.5 13H13.5",
      stroke: metal,
      fill: "none",
      "stroke-width": 1.1,
      "stroke-linecap": "round",
    });
    out += el("ellipse", { cx: 0, cy: 25, rx: 6, ry: 2.8, fill: "#1f2024" });
  }
  return out;
}

/** A goalie mask lying face up, seen from the front: an egg-shaped shell, a cage and painted art. */
function goalieMask(g: Rand): string {
  const hue = g.f(0, 360);
  const base = g.pick([hex(hue, g.f(50, 70), g.f(40, 55)), "#eeece6", hex(hue, 10, 18)]);
  const art = g.pick([hex(hue + 180, 65, 55), hex(g.f(30, 55), 85, 58), "#f4f1e8", hex(hue + 30, 70, 45)]);
  const metal = g.pick(["#e9e7e1", "#26272b", hex(45, 60, 55)]);
  const outline = "M0 -28C15 -28 21 -16 20 -4C19 10 12 22 0 26C-12 22-19 10-20 -4C-21 -16-15 -28 0 -28Z";
  const id = g.id("mask");
  let out = el("defs", {}, el("clipPath", { id }, el("path", { d: outline })));
  out += el("path", { d: outline, transform: "translate(2.5 3)", fill: "#000", opacity: 0.25 });
  out += el("path", { d: outline, fill: base });
  // The painted art, kept on the shell.
  const style = g.i(0, 3);
  let paint: string;
  if (style === 0)
    paint = el("path", {
      d: "M-24 -10Q-8 -30 24 -22M-24 -2Q-6 -24 24 -14M-24 6Q-4 -18 24 -6",
      stroke: art,
      "stroke-width": 3.5,
      fill: "none",
    });
  else if (style === 1)
    paint = el("path", {
      d: "M-22 30L-20 4L-15 14L-12 -6L-7 10L-4 -14L0 6L4 -14L7 10L12 -6L15 14L20 4L22 30Z",
      fill: art,
    });
  else if (style === 2) {
    paint = el("rect", { x: -5, y: -30, width: 10, height: 26, fill: art });
    paint += el("path", { d: dot(-12, -14, 2.4) + dot(12, -14, 2.4), fill: art });
  } else
    paint = el("path", {
      d: "M-22 -12Q-12 -16-6 -8Q-12 -4-22 -2ZM22 -12Q12 -16 6 -8Q12 -4 22 -2Z",
      fill: art,
    });
  paint += el("ellipse", {
    cx: -7,
    cy: -18,
    rx: 7,
    ry: 4.5,
    transform: "rotate(-25 -7 -18)",
    fill: "#ffffff",
    opacity: 0.3,
  });
  paint += el("path", { d: "M-20 10Q0 34 20 10L20 30H-20Z", fill: "#000", opacity: 0.12 });
  out += el("g", { "clip-path": `url(#${id})` }, paint);
  // Strap clips at the sides.
  out += el("path", { d: "M-20 -8v6M20 -8v6", stroke: "#1f2024", "stroke-width": 2.4, "stroke-linecap": "round" });
  // The cat-eye cage over the face.
  const cage = "M-15 -6Q0 -10 15 -6Q15 6 8 16Q0 21-8 16Q-15 6-15 -6Z";
  const cid = g.id("cage");
  out += el("defs", {}, el("clipPath", { id: cid }, el("path", { d: cage })));
  out += el("path", { d: cage, fill: "#1f2024", opacity: 0.75 });
  out += el(
    "g",
    { "clip-path": `url(#${cid})` },
    el("path", {
      d: "M-10 -12V24M-5 -12V24M0 -12V24M5 -12V24M10 -12V24M-16 4H16M-16 11H16",
      stroke: metal,
      "stroke-width": 1.1,
    }),
  );
  out += el("path", { d: cage, fill: "none", stroke: metal, "stroke-width": 1.5 });
  return out;
}

/** A hockey stick, a puck and a helmet or goalie mask on the ice, a rubber mat or a bench. */
export const hockey = defineKind("hockey", "Hockey", { headgear: ["helmet", "goalie"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const headgear = g.option("headgear", g.chance(0.6) ? "helmet" : "goalie");
  const where = g.pick(["ice", "ice", "ice", "mat", "bench"] as const);
  let out = where === "ice" ? ice(g, w, h) : where === "mat" ? mat(g, w, h) : bench(g, w, h);
  // The stick runs from upper left to lower right at about the picture's diagonal; mirrored
  // pictures show a stick for the other hand.
  const flip = g.chance(0.5);
  const len = 200;
  const phi = ((Math.atan2(h, w) * 180) / Math.PI) * (w < h ? g.f(0.95, 1.1) : g.f(0.6, 0.85));
  const p = (phi * Math.PI) / 180;
  const ux = Math.cos(p);
  const uy = Math.sin(p);
  const toe = ((phi - 45) * Math.PI) / 180;
  const heel: Point = [ux * len, uy * len];
  const tip: Point = [heel[0] + Math.cos(toe) * 44, heel[1] + Math.sin(toe) * 44];
  // Close up, the butt end of the stick runs out of the picture; wide pictures show all of it.
  const from = w / h > 2.2 ? 0 : g.f(0.35, 0.55);
  // The helmet lies below the shaft, partly over it; the puck sits in front of the blade.
  const t = from + (1 - from) * g.f(0.2, 0.45);
  const off = g.f(18, 30);
  const head: Spot = { x: ux * len * t - uy * off * -1, y: uy * len * t + ux * off, r: 30 };
  const pk: Spot = {
    x: heel[0] + Math.cos(toe) * 26 + Math.cos(toe + Math.PI / 2) * g.f(16, 26),
    y: heel[1] + Math.sin(toe) * 26 + Math.sin(toe + Math.PI / 2) * g.f(16, 26),
    r: 9,
  };
  const spots: Spot[] = [
    { x: ux * len * from, y: uy * len * from, r: 6 },
    { x: heel[0], y: heel[1], r: 10 },
    { x: tip[0], y: tip[1], r: 8 },
    head,
    pk,
  ];
  const { k, at } = fit(spots, w, h, unit * 0.05);
  out += s`<g transform="translate(${w / 2} 0) scale(${flip ? -1 : 1} 1) translate(${-w / 2} 0)">`;
  const [sx, sy] = at(0, 0);
  out += el("g", { transform: place(sx, sy, k, phi) }, stick(g, len));
  const [px, py] = at(pk.x, pk.y);
  out += el("g", { transform: place(px, py, k) }, puck(7));
  const [hx, hy] = at(head.x, head.y);
  const visor = g.chance(0.5);
  out += el(
    "g",
    { transform: place(hx, hy, k * 1.05, g.f(-25, 25)) },
    headgear === "helmet" ? playerHelmet(g, visor) : goalieMask(g),
  );
  out += "</g>";
  const gear = headgear === "helmet" ? `a helmet with a ${visor ? "visor" : "cage"}` : "a goalie mask";
  const ground = where === "ice" ? "on the ice" : where === "mat" ? "on a rubber mat" : "on a bench";
  note.alt(`A hockey stick, a puck and ${gear} ${ground}`);
  note.focus(flip ? w - hx : hx, hy);
  return out;
});
