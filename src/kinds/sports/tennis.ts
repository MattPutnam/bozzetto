import { defineKind, el, hsl, type Point, type Rand, s } from "../../draw/core";
import { capitalize, numberWord } from "../../draw/words";

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

/**
 * One or two tennis rackets and some balls, a close still life seen from above, on a court, a bench or a towel.
 *
 * @category Sports
 */
export const tennis = /* @__PURE__ */ defineKind("tennis", "Tennis", (g, w, h, note) => {
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
