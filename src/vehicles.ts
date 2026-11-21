import { defineKind, el, facing, fill, hsl, lin, mix, n, pts, s, type AttrValue, type Point, type Rand } from "./core";

type Time = "day" | "dusk" | "night";

const timeOfDay = (g: Rand): Time => g.pick(["day", "day", "day", "dusk", "night"] as const);

/** How much to darken scenery at each time of day. */
const shade = (time: Time): number => (time === "night" ? 0.5 : time === "dusk" ? 0.85 : 1);

/** Words for the time of day, to end an alt sentence. */
const when = (time: Time): string => (time === "night" ? " at night" : time === "dusk" ? " at dusk" : "");

/** The sky down to `horizon`: a gradient, then the sun, or the moon and stars. */
function skyAt(g: Rand, w: number, h: number, time: Time, horizon: number, sun = true): string {
  const id = g.id("sky");
  const hue = g.f(-12, 12);
  const stops =
    time === "day"
      ? [hsl(205 + hue, 62, g.f(58, 68)), hsl(198 + hue, 60, 88)]
      : time === "dusk"
        ? [hsl(250 + hue, 35, 36), hsl(330 + hue, 45, 62), hsl(28 + hue, 90, 74)]
        : [hsl(228 + hue, 50, 8), hsl(238 + hue, 40, 25)];
  let out = el("defs", {}, lin(id, stops));
  out += el("rect", { width: w, height: horizon + 2, fill: `url(#${id})` });
  const unit = Math.min(w, h);
  const x = w * g.f(0.1, 0.9);
  const r = unit * g.f(0.05, 0.075);
  if (time === "night") {
    // Stars and a moon.
    let stars = "";
    for (let k = g.i(14, 26); k > 0; k--) {
      const sx = w * g.f(0, 1);
      const sy = horizon * g.f(0, 0.85);
      const sr = g.f(0.5, 1.5);
      stars += s`M${sx - sr} ${sy}a${sr} ${sr} 0 1 0 ${sr * 2} 0a${sr} ${sr} 0 1 0 ${-sr * 2} 0`;
    }
    out += el("path", { d: stars, fill: "#ffffff", opacity: 0.8 });
    if (sun) out += el("circle", { cx: x, cy: horizon * g.f(0.15, 0.4), r, fill: hsl(50, 70, 92) });
  } else if (time === "dusk") {
    if (sun) out += el("circle", { cx: x, cy: horizon - r * g.f(0.2, 1.6), r: r * 1.3, fill: hsl(32, 95, 80) });
  } else if (sun && g.chance(0.75)) {
    out += el("circle", { cx: x, cy: horizon * g.f(0.18, 0.45), r, fill: hsl(48, 95, 90) });
  }
  return out;
}

/** A wash over the whole picture that dims it for dusk or night. Lights are drawn after it. */
const veil = (w: number, h: number, time: Time): string =>
  time === "night"
    ? el("rect", { width: w, height: h, fill: hsl(232, 55, 12), opacity: 0.35 })
    : time === "dusk"
      ? el("rect", { width: w, height: h, fill: hsl(15, 70, 45), opacity: 0.1 })
      : "";

/** A puffy cloud with a flat base, centered on x with its base at y. */
const cloud = (x: number, y: number, size: number, paint: string, opacity: number): string =>
  el(
    "g",
    { fill: paint, opacity },
    el("rect", { x: x - size, y: y - size * 0.32, width: size * 2, height: size * 0.32, rx: size * 0.16 }),
    el("circle", { cx: x - size * 0.45, cy: y - size * 0.32, r: size * 0.36 }),
    el("circle", { cx: x + size * 0.08, cy: y - size * 0.48, r: size * 0.48 }),
    el("circle", { cx: x + size * 0.6, cy: y - size * 0.28, r: size * 0.3 }),
  );

/** A gentle hill line across the picture, filled down to the bottom. */
const hill = (g: Rand, w: number, h: number, y: number, rise: number, paint: string): string =>
  el("path", {
    d: s`M0 ${y + rise * g.f(-0.3, 0.5)}
         Q ${w * g.f(0.2, 0.8)} ${y - rise} ${w} ${y + rise * g.f(-0.3, 0.5)}
         V ${h} H0Z`,
    fill: paint,
  });

/** A round-topped tree whose trunk stands at (x, y). */
const tree = (x: number, y: number, ht: number, leaf: string, trunk: string): string =>
  el("rect", { x: x - ht * 0.05, y: y - ht * 0.5, width: ht * 0.1, height: ht * 0.5 + 1, fill: trunk }) +
  el("circle", { cx: x, cy: y - ht * 0.68, r: ht * 0.32, fill: leaf });

/**
 * Drawing in local units: (0, 0) maps to (ox, oy) and one unit to k px. Path data uses absolute
 * commands only, with spaces between every token.
 */
function local(ox: number, oy: number, k: number) {
  const x = (v: number) => ox + v * k;
  const y = (v: number) => oy + v * k;
  const path = (d: string): string => {
    const out: string[] = [];
    let cmd = "";
    let index = 0;
    for (const token of d.trim().split(/\s+/)) {
      if (/^[A-Z]$/.test(token)) {
        cmd = token;
        index = 0;
        out.push(token);
        continue;
      }
      const v = Number(token);
      let px: number;
      if (cmd === "A") {
        const slot = index % 7;
        px = slot < 2 ? v * k : slot < 5 ? v : slot === 5 ? x(v) : y(v);
      } else if (cmd === "H") px = x(v);
      else if (cmd === "V") px = y(v);
      else px = index % 2 === 0 ? x(v) : y(v);
      out.push(String(n(px)));
      index++;
    }
    return out.join(" ");
  };
  return {
    x,
    y,
    k: (v: number) => v * k,
    path: (d: string, attrs: Record<string, AttrValue> = {}) => el("path", { d: path(d), ...attrs }),
    poly: (points: readonly Point[], attrs: Record<string, AttrValue>) =>
      el("polygon", { points: pts(points.map(([px, py]): Point => [x(px), y(py)])), ...attrs }),
    circle: (cx: number, cy: number, r: number, attrs: Record<string, AttrValue>) =>
      el("circle", { cx: x(cx), cy: y(cy), r: r * k, ...attrs }),
    ellipse: (cx: number, cy: number, rx: number, ry: number, attrs: Record<string, AttrValue>) =>
      el("ellipse", { cx: x(cx), cy: y(cy), rx: rx * k, ry: ry * k, ...attrs }),
    rect: (rx0: number, ry0: number, rw: number, rh: number, attrs: Record<string, AttrValue>) =>
      el("rect", { x: x(rx0), y: y(ry0), width: rw * k, height: rh * k, ...attrs }),
    line: (x1: number, y1: number, x2: number, y2: number, attrs: Record<string, AttrValue>) =>
      el("path", { d: s`M${x(x1)} ${y(y1)}L${x(x2)} ${y(y2)}`, ...attrs }),
  };
}

const PAINTS = ["#d6453d", "#6fa8dc", "#8fd1c0", "#f2c94c", "#f08a5d", "#9b7ed1", "#5bab6e", "#2f4f6f", "#e8e0cf"];
const TIRE = "#2a2b30";
const CHROME = "#d5dae0";

/** A tire with a hubcap, resting with its center at (x, y). */
const wheel = (u: ReturnType<typeof local>, x: number, y: number, r: number, whitewall: boolean): string =>
  u.circle(x, y, r, { fill: TIRE }) +
  (whitewall ? u.circle(x, y, r * 0.68, { fill: "#f1f1ee" }) : "") +
  u.circle(x, y, r * 0.5, { fill: CHROME }) +
  u.circle(x, y, r * 0.17, { fill: "#8a9099" });

/** A rounded retro car driving along a country road. */
export const car = defineKind("car", "Retro car", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const horizon = h * g.f(0.5, 0.6);
  const roadTop = h * g.f(0.72, 0.77);
  const roadY = roadTop + (h - roadTop) * 0.45;
  const size = Math.min(unit * g.f(0.82, 0.95), w * 0.8);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.08);
  const dir = g.pick([1, -1]);
  const paint = g.pick(PAINTS);
  const grass = g.f(80, 130);
  let out = skyAt(g, w, h, time, horizon + h * 0.1);
  out += hill(g, w, h, horizon, h * g.f(0.04, 0.1), hsl(grass + 10, 28, 60 * dark));
  // Trees along the far side of the road.
  const verge = roadTop - h * g.f(0.06, 0.1);
  out += el("rect", { y: verge, width: w, height: h - verge, fill: hsl(grass, 38, 46 * dark) });
  for (let k = g.i(1, 4); k > 0; k--)
    out += tree(
      w * g.f(0.03, 0.97),
      verge + 2,
      unit * g.f(0.16, 0.26),
      hsl(grass + 5, 35, 34 * dark),
      hsl(25, 30, 28 * dark),
    );
  // The road, its edge and the dashed lane line in front of the car.
  out += el("rect", { y: roadTop, width: w, height: h - roadTop, fill: hsl(220, 8, 36 * dark) });
  out += el("rect", { y: roadTop, width: w, height: unit * 0.012, fill: hsl(220, 8, 60 * dark) });
  const dash = unit * 0.06;
  out += el("path", {
    d: s`M${-g.f(0, dash * 2)} ${roadY + (h - roadY) * 0.55}H${w}`,
    stroke: hsl(48, 60, 85 * dark),
    "stroke-width": unit * 0.012,
    "stroke-dasharray": s`${dash} ${dash}`,
  });
  const u = local(cx, roadY, size);
  const darker = mix(paint, "#000000", 0.25);
  const clip = g.id("body");
  const body = `M -0.47 -0.12 L 0.47 -0.12 Q 0.52 -0.12 0.52 -0.18 Q 0.52 -0.31 0.36 -0.33 L 0.2 -0.35
    Q 0.1 -0.57 -0.1 -0.58 Q -0.3 -0.58 -0.39 -0.38 Q -0.5 -0.35 -0.51 -0.22 Q -0.52 -0.12 -0.47 -0.12 Z`;
  out += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
  // Shadow
  out += u.ellipse(0, 0, 0.56, 0.03, { fill: "#000", opacity: 0.2 });
  out += facing(cx, dir);
  // A roof rack with a suitcase, sometimes.
  const rack = g.chance(0.3);
  if (rack) {
    out += u.path("M -0.22 -0.55 L -0.22 -0.61 L 0.04 -0.61 L 0.04 -0.54", {
      stroke: "#555b63",
      "stroke-width": u.k(0.014),
      fill: "none",
    });
    out += u.rect(-0.19, -0.69, 0.2, 0.08, { rx: u.k(0.015), fill: g.pick(["#8b5a3c", "#c27c4a", "#5e6f8a"]) });
    out += u.rect(-0.1, -0.69, 0.02, 0.08, { fill: "#000", opacity: 0.25 });
  }
  out += u.path(body, { fill: paint });
  // Two-tone lower body, or a chrome side stripe.
  const trim = g.pick(["two-tone", "stripe", "plain"]);
  if (trim === "two-tone")
    out += u.rect(-0.6, -0.24, 1.2, 0.2, {
      fill: g.pick(["#f4efe2", darker, "#3a3d44"]),
      "clip-path": `url(#${clip})`,
    });
  if (trim === "stripe") out += u.rect(-0.6, -0.255, 1.2, 0.018, { fill: CHROME, "clip-path": `url(#${clip})` });
  // Windows, split by a pillar.
  const glass = time === "night" ? "#3a4660" : "#cfe6f2";
  out += u.path("M 0.165 -0.36 Q 0.08 -0.535 -0.1 -0.54 Q -0.27 -0.54 -0.345 -0.37 Z", { fill: glass });
  out += u.path("M 0.1 -0.5 Q 0.04 -0.52 -0.02 -0.52", {
    stroke: "#ffffff",
    "stroke-width": u.k(0.012),
    fill: "none",
    opacity: 0.6,
    "stroke-linecap": "round",
  });
  out += u.rect(-0.075, -0.56, 0.03, 0.21, { fill: paint });
  // Door seam and handle
  out += u.line(-0.06, -0.35, -0.06, -0.14, { stroke: darker, "stroke-width": u.k(0.008) });
  out += u.rect(-0.13, -0.315, 0.045, 0.012, { rx: u.k(0.006), fill: CHROME });
  // Bumpers, taillight and headlight
  out += u.rect(0.44, -0.155, 0.1, 0.035, { rx: u.k(0.017), fill: CHROME });
  out += u.rect(-0.54, -0.155, 0.1, 0.035, { rx: u.k(0.017), fill: CHROME });
  out += u.rect(-0.525, -0.29, 0.03, 0.045, { rx: u.k(0.01), fill: "#c8302a" });
  // Wheel arches, then the wheels.
  const whitewall = g.chance(0.5);
  for (const wx of [-0.31, 0.31]) {
    out += u.path(`M ${wx - 0.135} -0.12 A 0.135 0.135 0 0 1 ${wx + 0.135} -0.12 Z`, { fill: "#1d1e22" });
    out += wheel(u, wx, -0.105, 0.105, whitewall);
  }
  out += "</g>" + veil(w, h, time);
  // The headlight, with a beam at night.
  if (time === "night") {
    out += facing(cx, dir);
    out += u.poly(
      [
        [0.5, -0.27],
        [1.6, -0.36],
        [1.6, 0.02],
      ],
      { fill: hsl(50, 90, 80), opacity: 0.22 },
    );
  } else out += facing(cx, dir);
  out += u.circle(0.495, -0.25, 0.032, { fill: hsl(50, 90, time === "day" ? 88 : 80) });
  out += "</g>";
  note.alt(`A rounded retro car${rack ? " with a suitcase on its roof" : ""} on a country road${when(time)}`);
  note.focus(cx + dir * size * 0.02, roadY - size * 0.3);
  return out;
});

/** A bicycle standing on a park path. */
export const bicycle = defineKind("bicycle", "Bicycle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const groundY = h * g.f(0.8, 0.86);
  const R = Math.min((w * 0.84) / 5.1, (groundY - h * 0.08) / 2.85) * g.f(0.9, 1);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - R * 2.7 - w * 0.05);
  const dir = g.pick([1, -1]);
  const grass = g.f(85, 135);
  const horizon = h * g.f(0.5, 0.62);
  let out = skyAt(g, w, h, time, horizon + h * 0.1);
  out += hill(g, w, h, horizon, h * g.f(0.04, 0.1), hsl(grass + 10, 30, 58 * dark));
  const lawn = groundY - h * g.f(0.1, 0.16);
  out += el("rect", { y: lawn, width: w, height: h - lawn, fill: hsl(grass, 38, 45 * dark) });
  for (let k = g.i(0, 3); k > 0; k--)
    out += tree(
      w * g.f(0.03, 0.97),
      lawn + 2,
      unit * g.f(0.2, 0.32),
      hsl(grass + 5, 35, 33 * dark),
      hsl(25, 30, 28 * dark),
    );
  // The path
  const pathTop = groundY - h * 0.04;
  out += el("rect", { y: pathTop, width: w, height: h - pathTop, fill: hsl(g.f(25, 40), 22, 70 * dark) });
  out += el("rect", { y: pathTop, width: w, height: unit * 0.01, fill: "#000", opacity: 0.08 });
  // The bicycle, in units of the wheel radius, facing right. Its tires touch the path at y = 0.
  const u = local(cx, groundY, R);
  const frame = g.pick(PAINTS.slice(0, 8));
  const style = g.pick(["diamond", "diamond", "step-through"] as const);
  const rear: Point = [-1.45, -1];
  const front: Point = [1.45, -1];
  const bb: Point = [-0.23, -0.78];
  const seatDir: Point = [-0.292, -0.956];
  const headDir: Point = [-0.309, -0.951];
  const along = (p: Point, d: Point, t: number): Point => [p[0] + d[0] * t, p[1] + d[1] * t];
  const seatTop = along(bb, seatDir, 1.5);
  const seatJoin = along(bb, seatDir, 1.38);
  const headLow = along(front, headDir, 1.1);
  const headTop = along(headLow, headDir, 0.35);
  const saddle = along(seatTop, seatDir, 0.3);
  const stem = along(headTop, headDir, 0.16);
  const tube = (a: Point, b: Point) => `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} `;
  out += u.ellipse(0, 0, 2.6, 0.08, { fill: "#000", opacity: 0.15 });
  out += facing(cx, dir);
  // The far crank and pedal, behind everything.
  const crank = g.f(0, Math.PI * 2);
  const pedal = (angle: number, paint: string) => {
    const p: Point = [bb[0] + Math.cos(angle) * 0.55, bb[1] + Math.sin(angle) * 0.55];
    return (
      u.path(tube(bb, p), { stroke: paint, "stroke-width": u.k(0.08), "stroke-linecap": "round" }) +
      u.rect(p[0] - 0.13, p[1] - 0.04, 0.26, 0.08, { rx: u.k(0.03), fill: paint })
    );
  };
  out += pedal(crank + Math.PI, "#5b5f66");
  // Wheels: tire, rim, spokes and hub.
  for (const [wx, wy] of [rear, front]) {
    let spokes = "";
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + (wx > 0 ? 0.13 : 0);
      spokes += `M ${wx} ${wy} L ${wx + Math.cos(a) * 0.88} ${wy + Math.sin(a) * 0.88} `;
    }
    out += u.path(spokes, { stroke: "#9aa1aa", "stroke-width": u.k(0.02) });
    out += u.circle(wx, wy, 0.9, { fill: "none", stroke: "#b8bec6", "stroke-width": u.k(0.05) });
    out += u.circle(wx, wy, 0.97, { fill: "none", stroke: TIRE, "stroke-width": u.k(0.11) });
    out += u.circle(wx, wy, 0.07, { fill: "#6b7078" });
  }
  // Fenders, sometimes.
  if (g.chance(0.4)) {
    const fender = mix(frame, "#ffffff", 0.15);
    out += u.path("M -2.54 -0.86 A 1.12 1.12 0 0 1 -0.75 -1.78", {
      stroke: fender,
      "stroke-width": u.k(0.07),
      fill: "none",
    });
    out += u.path("M 0.66 -1.8 A 1.12 1.12 0 0 1 2.45 -1.4", {
      stroke: fender,
      "stroke-width": u.k(0.07),
      fill: "none",
    });
  }
  // Chainring, cog and chain
  out += u.path(
    `M ${bb[0]} ${bb[1] - 0.3} L ${rear[0]} ${rear[1] - 0.12} M ${bb[0]} ${bb[1] + 0.3} L ${rear[0]} ${rear[1] + 0.12}`,
    {
      stroke: "#4a4d53",
      "stroke-width": u.k(0.04),
    },
  );
  out += u.circle(rear[0], rear[1], 0.13, { fill: "#4a4d53" });
  out += u.circle(bb[0], bb[1], 0.3, { fill: "none", stroke: "#4a4d53", "stroke-width": u.k(0.07) });
  // The frame: chainstays, seat stays, seat tube, down tube, top tube and fork.
  const headMid = along(headLow, headDir, 0.12);
  const headHigh = along(headLow, headDir, 0.27);
  let tubes = tube(rear, bb) + tube(rear, seatJoin) + tube(bb, seatTop) + tube(bb, headMid);
  if (style === "diamond") tubes += tube(seatJoin, headHigh);
  else {
    const low = along(bb, seatDir, 0.45);
    tubes += `M ${headHigh[0]} ${headHigh[1]} Q ${0.2} ${-1.75} ${low[0]} ${low[1]} `;
  }
  tubes += `M ${front[0]} ${front[1]} Q ${headLow[0] + 0.12} ${(front[1] + headLow[1]) / 2} ${headLow[0]} ${headLow[1]} `;
  out += u.path(tubes, {
    stroke: frame,
    "stroke-width": u.k(0.11),
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  // Head tube, seatpost and stem
  out += u.path(tube(headLow, headTop), {
    stroke: mix(frame, "#000000", 0.2),
    "stroke-width": u.k(0.15),
    "stroke-linecap": "round",
  });
  out += u.path(tube(seatTop, saddle) + tube(headTop, stem), {
    stroke: "#8a9099",
    "stroke-width": u.k(0.07),
    "stroke-linecap": "round",
  });
  // Handlebar: swept back on a city bike, dropped on a road bike.
  const [sx, sy] = stem;
  const drops = style === "diamond" && g.chance(0.5);
  const bar = drops
    ? `M ${sx} ${sy} L ${sx + 0.25} ${sy - 0.02} Q ${sx + 0.48} ${sy} ${sx + 0.44} ${sy + 0.25} Q ${sx + 0.4} ${sy + 0.38} ${sx + 0.24} ${sy + 0.34}`
    : `M ${sx} ${sy} C ${sx + 0.25} ${sy} ${sx + 0.2} ${sy - 0.22} ${sx - 0.12} ${sy - 0.26}`;
  out += u.path(bar, { stroke: "#3b3e44", "stroke-width": u.k(0.07), fill: "none", "stroke-linecap": "round" });
  if (!drops)
    out += u.line(sx - 0.02, sy - 0.255, sx - 0.2, sy - 0.265, {
      stroke: "#2b2c30",
      "stroke-width": u.k(0.11),
      "stroke-linecap": "round",
    });
  // A basket on the front of a step-through.
  const basket = style === "step-through" && g.chance(0.7);
  if (basket) {
    const [hx, hy] = headTop;
    out += u.rect(hx + 0.14, hy - 0.12, 0.6, 0.42, { rx: u.k(0.05), fill: "#b07a45" });
    out += u.path(
      `M ${hx + 0.29} ${hy - 0.12} V ${hy + 0.3} M ${hx + 0.44} ${hy - 0.12} V ${hy + 0.3} M ${hx + 0.59} ${hy - 0.12} V ${hy + 0.3}`,
      {
        stroke: "#8a5a2e",
        "stroke-width": u.k(0.035),
      },
    );
    out += u.rect(hx + 0.12, hy - 0.15, 0.64, 0.07, { rx: u.k(0.03), fill: "#8a5a2e" });
    out += u.line(hx - 0.03, hy + 0.05, hx + 0.14, hy + 0.05, { stroke: "#8a9099", "stroke-width": u.k(0.05) });
  }
  // Saddle
  const [qx, qy] = saddle;
  out += u.path(
    `M ${qx - 0.34} ${qy - 0.05} Q ${qx - 0.05} ${qy - 0.16} ${qx + 0.3} ${qy - 0.03} Q ${qx + 0.05} ${qy + 0.06} ${qx - 0.32} ${qy + 0.04} Z`,
    {
      fill: g.pick(["#3b2f2a", "#6b4a32", "#2b2c30"]),
    },
  );
  // Near crank, pedal and the crank's hub
  out += pedal(crank, "#3b3e44");
  out += u.circle(bb[0], bb[1], 0.09, { fill: "#8a9099" });
  out += "</g>";
  out += veil(w, h, time);
  const kind = basket
    ? "A step-through bicycle with a front basket"
    : drops
      ? "A road bicycle"
      : style === "step-through"
        ? "A step-through bicycle"
        : "A bicycle";
  note.alt(`${kind} standing on a park path${when(time)}`);
  note.focus(cx, groundY - R * 1.5);
  return out;
});

/** A sailboat on open water, with a mainsail and a jib. */
export const sailboat = defineKind("sailboat", "Sailboat", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const horizon = h * g.f(0.5, 0.6);
  const waterY = h * g.f(0.74, 0.8);
  const size = Math.min(w * 0.58, (waterY - h * 0.06) / 1.04) * g.f(0.9, 1);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - size * 0.55 - w * 0.05);
  const dir = g.pick([1, -1]);
  const seaHue = g.f(190, 215);
  const water = g.id("water");
  let out = skyAt(g, w, h, time, horizon);
  if (g.chance(0.35)) {
    // A distant island
    const ix = w * g.f(0, 0.8);
    const iw = w * g.f(0.15, 0.3);
    out += el("path", {
      d: s`M${ix} ${horizon} Q ${ix + iw * 0.4} ${horizon - h * g.f(0.04, 0.08)} ${ix + iw} ${horizon}Z`,
      fill: hsl(150, 18, 40 * dark),
    });
  }
  out += el("defs", {}, lin(water, [hsl(seaHue, 45, 52 * dark), hsl(seaHue + 10, 55, 30 * dark)]));
  out += el("rect", { y: horizon, width: w, height: h - horizon, fill: `url(#${water})` });
  // Ripples
  let ripples = "";
  for (let k = g.i(5, 9); k > 0; k--) {
    const ry = horizon + (h - horizon) * g.f(0.08, 0.95);
    const rx = w * g.f(0, 1);
    const rl = unit * g.f(0.04, 0.12) * (0.5 + (ry - horizon) / (h - horizon));
    ripples += s`M${rx} ${ry}h${rl}`;
  }
  out += el("path", {
    d: ripples,
    stroke: "#ffffff",
    "stroke-width": unit * 0.008,
    opacity: 0.3,
    "stroke-linecap": "round",
  });
  const u = local(cx, waterY, size);
  const hullPaint = g.pick(["#f4f1ea", "#1f3a5f", "#c0392b", "#2f6b58", "#e8e0cf", "#3a3d44"]);
  const sail = g.pick(["#fbfaf6", "#fbfaf6", "#f3ead6", "#f6d7c3", "#d9e8f0"]);
  const stripe = g.pick(PAINTS);
  const hull = "M -0.47 -0.13 L 0.54 -0.17 Q 0.42 -0.02 0.24 0 L -0.36 0 Q -0.47 -0.03 -0.47 -0.13 Z";
  const clip = g.id("hull");
  out += el("defs", {}, el("clipPath", { id: clip }, u.path(hull)));
  out += facing(cx, dir);
  // Reflection
  out += u.path("M -0.45 0 L 0.4 0 Q 0.3 0.1 0 0.12 Q -0.35 0.1 -0.45 0 Z", { fill: hullPaint, opacity: 0.18 });
  // Cabin, hull, and a stripe along the hull.
  out += u.rect(-0.26, -0.22, 0.3, 0.12, { rx: u.k(0.03), fill: mix(hullPaint, "#ffffff", 0.5) });
  out += u.path(hull, { fill: hullPaint });
  out += u.rect(-0.6, -0.1, 1.3, 0.025, {
    fill: stripe,
    "clip-path": `url(#${clip})`,
    transform: s`rotate(-2.3 ${cx} ${waterY})`,
  });
  // Mainsail and boom
  const main = g.pick([sail, sail, stripe]);
  out += u.path("M 0.01 -0.98 Q -0.24 -0.62 -0.43 -0.27 L 0.01 -0.27 Z", { fill: main });
  out += u.path("M -0.03 -0.9 Q -0.18 -0.64 -0.31 -0.4", {
    stroke: "#000",
    "stroke-width": u.k(0.005),
    opacity: 0.12,
    fill: "none",
  });
  out += u.line(0.02, -0.255, -0.45, -0.255, {
    stroke: "#6b5a48",
    "stroke-width": u.k(0.018),
    "stroke-linecap": "round",
  });
  // Mast and a pennant
  out += u.line(0.02, -1.0, 0.02, -0.16, { stroke: "#7a6a58", "stroke-width": u.k(0.02) });
  out += u.poly(
    [
      [0.02, -1.02],
      [-0.1, -0.995],
      [0.02, -0.97],
    ],
    { fill: g.pick(["#d6453d", "#f2c94c", "#6fa8dc"]) },
  );
  // Jib, from the masthead down to the bow.
  if (g.chance(0.8)) out += u.path("M 0.04 -0.9 L 0.5 -0.2 L 0.08 -0.22 Q 0.11 -0.55 0.04 -0.9 Z", { fill: sail });
  // Portholes
  const lightPort = time === "night" ? hsl(45, 90, 75) : "#2f3e52";
  out += "</g>" + veil(w, h, time) + facing(cx, dir);
  out += u.circle(-0.18, -0.165, 0.016, { fill: lightPort }) + u.circle(-0.06, -0.165, 0.016, { fill: lightPort });
  out += "</g>";
  // A waterline ripple in front of the hull.
  out += el("path", {
    d: s`M${cx - size * 0.5} ${waterY + 1}h${size}`,
    stroke: "#ffffff",
    "stroke-width": unit * 0.008,
    opacity: 0.4,
    "stroke-linecap": "round",
  });
  note.alt(`A sailboat on open water${time === "dusk" ? " at sunset" : when(time)}`);
  note.focus(cx - dir * size * 0.08, waterY - size * 0.45);
  return out;
});

/** One balloon: gores in two colors (or many), a basket on ropes, and a burner. */
function balloonAt(g: Rand, x: number, y: number, R: number, colors: readonly string[], flame: boolean): string {
  const u = local(x, y, R);
  // The outline of a gore line at fraction f of the width: f = 1 is the right edge, -1 the left.
  const down = (f: number) => `C ${0.55 * f} -1 ${f} -0.6 ${f} -0.05 C ${f} 0.5 ${0.45 * f} 0.95 ${0.22 * f} 1.25`;
  const up = (f: number) => `C ${0.45 * f} 0.95 ${f} 0.5 ${f} -0.05 C ${f} -0.6 ${0.55 * f} -1 0 -1`;
  const lines = [-1, -0.8, -0.45, 0, 0.45, 0.8, 1];
  let out = "";
  // Ropes, burner and basket hang below.
  out += u.path("M -0.2 1.27 L -0.16 1.56 M 0.2 1.27 L 0.16 1.56 M -0.07 1.28 L -0.06 1.56 M 0.07 1.28 L 0.06 1.56", {
    stroke: "#5b4a3a",
    "stroke-width": u.k(0.015),
  });
  out += u.rect(-0.06, 1.33, 0.12, 0.07, { fill: "#6b7078" });
  if (flame) out += u.ellipse(0, 1.27, 0.05, 0.09, { fill: hsl(38, 100, 65) });
  out += u.rect(-0.17, 1.55, 0.34, 0.24, { rx: u.k(0.03), fill: "#a87545" });
  out += u.path("M -0.085 1.58 V 1.79 M 0 1.58 V 1.79 M 0.085 1.58 V 1.79", {
    stroke: "#8a5a2e",
    "stroke-width": u.k(0.012),
  });
  out += u.rect(-0.19, 1.54, 0.38, 0.05, { rx: u.k(0.02), fill: "#7a4f2a" });
  // The envelope: a base color, then every other gore.
  out += u.path(`M 0 -1 ${down(1)} L ${-0.22} 1.25 ${up(-1)} Z`, { fill: colors[0] });
  for (let k = 0; k < lines.length - 1; k++) {
    const paint = colors[k % colors.length];
    if (paint === colors[0]) continue;
    out += u.path(`M 0 -1 ${down(lines[k + 1])} L ${0.22 * lines[k]} 1.25 ${up(lines[k])} Z`, { fill: paint });
  }
  // Shading on the right, a highlight on the left, and the skirt.
  out += u.path(`M 0 -1 ${down(1)} L ${0.22 * 0.3} 1.25 ${up(0.3)} Z`, { fill: "#000", opacity: 0.12 });
  out += u.ellipse(-0.45, -0.35, 0.16, 0.3, {
    fill: "#ffffff",
    opacity: 0.22,
    transform: s`rotate(20 ${u.x(-0.45)} ${u.y(-0.35)})`,
  });
  out += u.rect(-0.23, 1.21, 0.46, 0.07, { rx: u.k(0.02), fill: "#5b4a3a" });
  return out;
}

const hues = (g: Rand): string[] => {
  const base = g.f(0, 360);
  const style = g.pick(["pair", "pair", "rainbow"]);
  if (style === "rainbow") return [0, 1, 2, 3, 4, 5].map(k => hsl(base + k * 60, 70, 58));
  const other = base + g.pick([40, 150, 180, 200]);
  return [hsl(base, 70, g.f(50, 60)), g.chance(0.4) ? hsl(45, 30, 95) : hsl(other, 70, g.f(55, 68))];
};

/** A hot-air balloon drifting over fields, among clouds. */
export const hotAirBalloon = defineKind("hot-air-balloon", "Hot-air balloon", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = g.pick(["day", "day", "day", "dusk"] as const);
  const dark = shade(time);
  const R = Math.min((h * 0.82) / 2.85, w * 0.32) * g.f(0.85, 1);
  const bx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - R * 1.1 - w * 0.05);
  const by = h * 0.08 + R * g.f(1.02, 1.12);
  const horizon = h * g.f(0.74, 0.82);
  let out = skyAt(g, w, h, time, horizon + h * 0.1);
  // Clouds behind
  for (let k = g.i(2, 4); k > 0; k--)
    out += cloud(w * g.f(0, 1), h * g.f(0.15, 0.6), unit * g.f(0.08, 0.16), "#ffffff", time === "day" ? 0.85 : 0.5);
  // Fields
  const grass = g.f(70, 130);
  out += hill(g, w, h, horizon, h * g.f(0.03, 0.07), hsl(grass + 15, 28, 58 * dark));
  out += hill(g, w, h, horizon + h * 0.08, h * g.f(0.03, 0.06), hsl(grass, 35, 44 * dark));
  // A small far balloon, where there is room.
  const far = g.fork("far");
  const smallR = R * far.f(0.18, 0.26);
  const sx = far.chance(0.5) ? bx - R * far.f(1.4, 2.6) : bx + R * far.f(1.4, 2.6);
  const twin = sx > smallR * 1.2 && sx < w - smallR * 1.2 && far.chance(0.7);
  if (twin) out += el("g", { opacity: 0.85 }, balloonAt(far, sx, h * far.f(0.25, 0.55), smallR, hues(far), false));
  out += balloonAt(g, bx, by, R, hues(g), false);
  out += veil(w, h, time);
  // The burner's flame shows best at dusk.
  if (time === "dusk") out += local(bx, by, R).ellipse(0, 1.27, 0.05, 0.09, { fill: hsl(38, 100, 65) });
  note.alt(
    `${twin ? "Two hot-air balloons" : "A hot-air balloon"} drifting over fields${time === "dusk" ? " at sunset" : ""}`,
  );
  note.focus(bx, by);
  return out;
});

/** A retro rocket: lifting off its pad, or flying through space. */
export const rocket = defineKind("rocket", "Rocket", { scene: ["launch", "space"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scene = g.option("scene", g.chance(0.5) ? "launch" : "space");
  const accent = g.pick(["#d6453d", "#2f6fb0", "#f08a5d", "#5bab6e", "#9b7ed1", "#e0a526"]);
  const bodyPaint = g.pick(["#f4f1ea", "#e6e9ee", "#f6e7c8"]);
  let out = "";
  let cx: number;
  let cy: number;
  let size: number;
  let angle = 0;
  const time = g.pick(["day", "dusk", "night"] as const);
  const smoke: string[] = [];
  if (scene === "launch") {
    const dark = shade(time);
    const groundY = h * g.f(0.84, 0.88);
    const lift = g.f(0.22, 0.36);
    size = Math.min((groundY - h * 0.09) / (0.97 + lift), w * 0.7);
    cx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - size * 0.8 - w * 0.05);
    cy = groundY - size * (lift + 0.47);
    out += skyAt(g, w, h, time, groundY);
    out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(g.f(20, 40), 15, 45 * dark) });
    // The launch tower, standing on the ground to one side.
    const side = g.pick([-1, 1]);
    const tx = cx + side * size * 0.45;
    const tw = size * 0.16;
    const top = cy - size * 0.3;
    const steel = hsl(10, 55, 42 * dark);
    let lattice = s`M${tx - tw / 2} ${groundY}V${top}M${tx + tw / 2} ${groundY}V${top}`;
    const rungs = Math.max(3, Math.round((groundY - top) / tw));
    const step = (groundY - top) / rungs;
    for (let k = 0; k < rungs; k++) {
      const y0 = groundY - k * step;
      lattice += s`M${tx - tw / 2} ${y0}L${tx + tw / 2} ${y0 - step}M${tx - tw / 2} ${y0 - step}H${tx + tw / 2}`;
    }
    out += el("path", { d: lattice, stroke: steel, "stroke-width": unit * 0.012, fill: "none" });
    out += el("rect", { x: tx - tw * 0.7, y: top - unit * 0.02, width: tw * 1.4, height: unit * 0.02, fill: steel });
    // The pad
    out += el("rect", {
      x: cx - size * 0.3,
      y: groundY - unit * 0.025,
      width: size * 0.6,
      height: unit * 0.025,
      fill: hsl(220, 8, 32 * dark),
    });
    // Smoke billowing along the ground, drawn in front of the pad.
    for (let k = 0; k < 9; k++) {
      const t = (k - 4) / 4;
      const r = size * (0.07 + 0.06 * (1 - Math.abs(t))) * g.f(0.85, 1.15);
      smoke.push(
        el("circle", {
          cx: cx + t * size * 0.5,
          cy: groundY - r * 0.55,
          r,
          fill: hsl(220, 10, g.f(86, 96) * (0.6 + 0.4 * dark)),
        }),
      );
    }
  } else {
    const id = g.id("space");
    const hue = g.f(220, 290);
    out += el("defs", {}, lin(id, [hsl(hue, 45, 8), hsl(hue + 20, 40, 20)]));
    out += fill(w, h, `url(#${id})`);
    let stars = "";
    for (let k = g.i(25, 45); k > 0; k--) {
      const sx = w * g.f(0, 1);
      const sy = h * g.f(0, 1);
      const sr = g.f(0.5, 1.6);
      stars += s`M${sx - sr} ${sy}a${sr} ${sr} 0 1 0 ${sr * 2} 0a${sr} ${sr} 0 1 0 ${-sr * 2} 0`;
    }
    out += el("path", { d: stars, fill: "#ffffff", opacity: 0.85 });
    size = unit * g.f(0.55, 0.62);
    const tilt = g.pick([-1, 1]);
    angle = tilt * g.f(25, 50);
    // A planet in a lower corner, away from where the rocket points.
    const pr = unit * g.f(0.18, 0.28);
    const px = tilt > 0 ? w * g.f(0.05, 0.2) : w * g.f(0.8, 0.95);
    const py = h * g.f(0.75, 0.95);
    const planet = hsl(g.f(0, 360), 50, 62);
    if (g.chance(0.5)) {
      out += el("ellipse", {
        cx: px,
        cy: py,
        rx: pr * 1.7,
        ry: pr * 0.4,
        fill: "none",
        stroke: hsl(40, 50, 75),
        "stroke-width": pr * 0.12,
        transform: s`rotate(-15 ${px} ${py})`,
      });
    }
    out += el("circle", { cx: px, cy: py, r: pr, fill: planet });
    out += el("circle", { cx: px - pr * 0.3, cy: py - pr * 0.2, r: pr * 0.18, fill: "#000", opacity: 0.1 });
    out += el("circle", { cx: px + pr * 0.35, cy: py + pr * 0.3, r: pr * 0.12, fill: "#000", opacity: 0.1 });
    // Center the rocket and its flame on the canvas.
    const rad = (angle * Math.PI) / 180;
    cx = w / 2 + g.f(-0.05, 0.05) * w + Math.sin(rad) * size * 0.16;
    cy = h / 2 - Math.cos(rad) * size * 0.16;
  }
  const u = local(cx, cy, size);
  const flameLen = scene === "launch" ? (h * 0.86 - cy) / size - 0.42 : g.f(0.25, 0.35);
  let ship = "";
  // Flame
  ship += u.path(`M -0.09 0.46 Q -0.13 0.6 0 ${0.47 + flameLen} Q 0.13 0.6 0.09 0.46 Z`, { fill: hsl(22, 95, 58) });
  ship += u.path(`M -0.05 0.46 Q -0.07 0.56 0 ${0.47 + flameLen * 0.65} Q 0.07 0.56 0.05 0.46 Z`, {
    fill: hsl(48, 100, 75),
  });
  // Fins, behind the body's edges.
  ship += u.path("M -0.15 0.04 Q -0.3 0.15 -0.32 0.45 Q -0.24 0.37 -0.12 0.37 Z", { fill: accent });
  ship += u.path("M 0.15 0.04 Q 0.3 0.15 0.32 0.45 Q 0.24 0.37 0.12 0.37 Z", { fill: accent });
  // Nozzle
  ship += u.path("M -0.08 0.39 L 0.08 0.39 L 0.1 0.47 L -0.1 0.47 Z", { fill: "#5b6068" });
  // Body, with a colored nose.
  const body =
    "M 0 -0.5 C 0.13 -0.42 0.17 -0.22 0.16 0.05 Q 0.15 0.3 0.11 0.4 L -0.11 0.4 Q -0.15 0.3 -0.16 0.05 C -0.17 -0.22 -0.13 -0.42 0 -0.5 Z";
  const clip = g.id("rocket");
  ship += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
  ship += u.path(body, { fill: bodyPaint });
  ship += u.rect(-0.2, -0.52, 0.4, 0.22, { fill: accent, "clip-path": `url(#${clip})` });
  ship += u.rect(0.06, -0.4, 0.2, 0.8, { fill: "#000", opacity: 0.08, "clip-path": `url(#${clip})` });
  // Center fin
  ship += u.path("M -0.025 0.13 L 0.025 0.13 L 0.03 0.46 L -0.03 0.46 Z", { fill: mix(accent, "#000000", 0.2) });
  // Porthole
  ship += u.circle(0, -0.1, 0.075, { fill: mix(accent, "#000000", 0.25) });
  ship += u.circle(0, -0.1, 0.052, { fill: hsl(200, 60, 75) });
  ship += u.circle(-0.018, -0.12, 0.016, { fill: "#ffffff", opacity: 0.8 });
  if (scene === "launch") out += veil(w, h, time);
  out += angle ? el("g", { transform: s`rotate(${angle} ${cx} ${cy})` }, ship) : ship;
  out += smoke.join("");
  note.alt(
    scene === "launch"
      ? `A rocket lifting off its launch pad${when(time)}`
      : "A rocket flying through space past a planet",
  );
  note.focus(cx, cy);
  return out;
});

/** A steam locomotive pulling one or two carriages along a track. */
export const train = defineKind("train", "Steam train", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const railY = h * g.f(0.8, 0.85);
  const cars = g.i(1, 2);
  // From the rear of the last carriage to the cowcatcher, in locomotive lengths.
  const rearX = -0.53 - cars * 0.88;
  const total = 0.53 - rearX;
  const size = Math.min(Math.max((w * 0.92) / total, unit * 0.5), unit * 0.9, (railY - h * 0.04) / 0.95);
  // Center the train, or when it is too long, keep the locomotive in and let the last carriage run off the edge.
  const ox = total * size > w * 0.96 ? w * 0.97 - 0.53 * size : w / 2 - ((0.53 + rearX) / 2) * size;
  const dir = g.pick([1, -1]);
  const grass = g.f(80, 135);
  const horizon = h * g.f(0.5, 0.62);
  let out = skyAt(g, w, h, time, horizon + h * 0.1);
  out += hill(g, w, h, horizon, h * g.f(0.04, 0.1), hsl(grass + 10, 28, 58 * dark));
  const field = railY - h * g.f(0.08, 0.14);
  out += el("rect", { y: field, width: w, height: h - field, fill: hsl(grass, 36, 45 * dark) });
  for (let k = g.i(0, 3); k > 0; k--)
    out += tree(
      w * g.f(0.03, 0.97),
      field + 2,
      unit * g.f(0.18, 0.3),
      hsl(grass + 5, 35, 32 * dark),
      hsl(25, 30, 28 * dark),
    );
  // Ballast, sleepers and the rail.
  const u = local(ox, railY, size);
  out += el("rect", { y: railY, width: w, height: size * 0.06, fill: hsl(30, 10, 52 * dark) });
  out += el("path", {
    d: s`M${-g.f(0, size * 0.08)} ${railY + size * 0.025}H${w}`,
    stroke: hsl(25, 30, 30 * dark),
    "stroke-width": size * 0.03,
    "stroke-dasharray": s`${size * 0.04} ${size * 0.045}`,
  });
  out += el("rect", { y: railY, width: w, height: size * 0.016, fill: hsl(220, 6, 62 * dark) });
  const paint = g.pick(["#2b2d33", "#1f4e3d", "#7a2626", "#24456e"]);
  const trim = g.pick(["#c0392b", "#c9a227", "#3a3d44"]);
  const carPaint = g.pick(["#7a2626", "#1f4e3d", "#24456e", "#c9a227", "#8b5a3c", "#e8e0cf"]);
  const iron = "#2b2d33";
  const brass = "#c9a227";
  const glass = "#cfe2ec";
  const lit = hsl(45, 90, 72);
  const windows: [number, number, number, number][] = [];
  out += facing(w / 2, dir);
  // Carriages, from the last one forward.
  for (let i = cars - 1; i >= 0; i--) {
    const x0 = -0.53 - i * 0.88 - 0.85;
    // A carriage wholly past the edge isn't drawn: it would only add bytes.
    if (u.x(x0 + 0.88) < 0) continue;
    out += u.rect(x0 - 0.035, -0.13, 0.04, 0.025, { fill: iron });
    out += u.rect(x0 + 0.03, -0.13, 0.79, 0.04, { fill: iron });
    // Bogie wheels and their hubs, grouped so each color is written once.
    const axles = [0.12, 0.24, 0.61, 0.73];
    out += el("g", { fill: iron }, ...axles.map(bx => u.circle(x0 + bx, -0.05, 0.05, {})));
    out += el("g", { fill: "#8a9099" }, ...axles.map(bx => u.circle(x0 + bx, -0.05, 0.018, {})));
    out += u.rect(x0, -0.5, 0.85, 0.38, { rx: u.k(0.03), fill: carPaint });
    out += u.rect(x0 - 0.015, -0.535, 0.88, 0.05, { rx: u.k(0.025), fill: "#4a4d53" });
    out += u.rect(x0, -0.24, 0.85, 0.025, { fill: mix(carPaint, "#ffffff", 0.45) });
    for (let k = 0; k < 5; k++) windows.push([x0 + 0.075 + k * 0.148, -0.43, 0.105, 0.13]);
  }
  // The locomotive: frame, cab, boiler, dome, stack, lamp and cowcatcher.
  out += u.rect(-0.56, -0.13, 0.07, 0.025, { fill: iron });
  out += u.rect(-0.5, -0.22, 0.94, 0.07, { fill: iron });
  out += u.ellipse(0.06, -0.47, 0.06, 0.05, { fill: brass });
  out += u.poly(
    [
      [0.25, -0.46],
      [0.32, -0.46],
      [0.34, -0.62],
      [0.23, -0.62],
    ],
    { fill: iron },
  );
  out += u.rect(0.215, -0.645, 0.135, 0.03, { rx: u.k(0.01), fill: iron });
  out += u.rect(-0.2, -0.47, 0.62, 0.26, { rx: u.k(0.06), fill: paint });
  out += u.rect(0.34, -0.475, 0.09, 0.27, { rx: u.k(0.045), fill: iron });
  out += u.path("M 0.0 -0.47 V -0.21 M 0.18 -0.47 V -0.21", { stroke: brass, "stroke-width": u.k(0.014) });
  out += u.rect(0.37, -0.535, 0.055, 0.06, { rx: u.k(0.01), fill: brass });
  out += u.rect(-0.5, -0.62, 0.32, 0.41, { fill: paint });
  out += u.rect(-0.53, -0.665, 0.38, 0.05, { rx: u.k(0.02), fill: iron });
  windows.push([-0.43, -0.56, 0.17, 0.13]);
  out += u.poly(
    [
      [0.42, -0.18],
      [0.535, -0.015],
      [0.42, -0.015],
    ],
    { fill: trim },
  );
  // Cylinder, wheels and the rod joining the drivers.
  out += u.rect(0.17, -0.16, 0.13, 0.08, { rx: u.k(0.015), fill: iron });
  for (const [wx, r] of [
    [-0.36, 0.1],
    [-0.12, 0.1],
    [0.12, 0.1],
    [0.34, 0.06],
  ]) {
    out += u.circle(wx, -r, r, { fill: iron });
    out += u.circle(wx, -r, r * 0.75, { fill: trim });
    out += u.circle(wx, -r, r * 0.25, { fill: iron });
  }
  const crank = g.f(0, Math.PI * 2);
  const pinX = Math.cos(crank) * 0.05;
  const pinY = -0.1 + Math.sin(crank) * 0.05;
  out += u.path(`M ${-0.36 + pinX} ${pinY} L ${0.12 + pinX} ${pinY} L 0.24 -0.12`, {
    stroke: "#9aa1aa",
    "stroke-width": u.k(0.022),
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  const paneAt = (paneColor: string) =>
    el("g", { fill: paneColor }, ...windows.map(([x, y, pw, ph]) => u.rect(x, y, pw, ph, { rx: u.k(0.012) })));
  // At night the windows are drawn lit, above the darkening veil, instead.
  if (time !== "night") out += paneAt(glass);
  // Smoke drifting back from the stack.
  const steam = g.chance(0.85);
  if (steam) {
    const puffs = g.i(3, 5);
    for (let k = 0; k < puffs; k++)
      out += u.circle(0.27 - k * 0.15 - g.f(0, 0.04), -0.7 - k * 0.04 - g.f(0, 0.03), 0.05 + k * 0.022, {
        fill: "#eceef1",
        opacity: 0.9 - k * 0.12,
      });
  }
  out += "</g>" + veil(w, h, time);
  if (time === "night") {
    out += facing(w / 2, dir) + paneAt(lit);
    out += u.poly(
      [
        [0.43, -0.52],
        [1.6, -0.62],
        [1.6, -0.1],
      ],
      { fill: hsl(50, 90, 80), opacity: 0.2 },
    );
    out += u.rect(0.415, -0.525, 0.012, 0.04, { fill: hsl(50, 100, 85) }) + "</g>";
  }
  const carriages = cars === 1 ? "a carriage" : "two carriages";
  note.alt(`A steam locomotive${steam ? " puffing smoke" : ""} pulling ${carriages} along a track${when(time)}`);
  note.focus(w / 2 + dir * (ox + size * 0.05 - w / 2), railY - size * 0.38);
  return out;
});

/** A bus at the curb of a city street: a city bus, a school bus or a double-decker. */
export const bus = defineKind("bus", "Bus", { style: ["city", "school", "double-decker"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const style = g.option("style", g.pick(["city", "city", "school", "double-decker"] as const));
  const time = timeOfDay(g);
  const dark = shade(time);
  const tall = style === "double-decker" ? 0.6 : 0.4;
  const roadTop = h * g.f(0.74, 0.78);
  const roadY = roadTop + (h - roadTop) * 0.42;
  const size = Math.min(unit * g.f(0.85, 1), w * 0.84, (roadY - h * 0.08) / tall);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.06);
  const dir = g.pick([1, -1]);
  const walkTop = roadTop - h * 0.05;
  let out = skyAt(g, w, h, time, walkTop);
  // A row of buildings, their windows a repeated tile.
  const tile = g.id("win");
  const winPaint = time === "night" ? hsl(45, 85, 70) : hsl(205, 30, 75 * dark);
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id: tile, width: unit * 0.06, height: unit * 0.075, patternUnits: "userSpaceOnUse" },
      el("rect", { x: unit * 0.015, y: unit * 0.015, width: unit * 0.03, height: unit * 0.04, fill: winPaint }),
    ),
  );
  const hue = g.f(0, 360);
  for (let x = -g.f(0, unit * 0.1); x < w;) {
    const bw = unit * g.f(0.22, 0.38);
    const bh = h * g.f(0.25, 0.5);
    out += el("rect", {
      x,
      y: walkTop - bh,
      width: bw,
      height: bh,
      fill: hsl(hue + g.f(-40, 40), g.f(15, 35), g.f(55, 75) * dark),
    });
    out += el("rect", {
      x: x + unit * 0.01,
      y: walkTop - bh + unit * 0.02,
      width: bw - unit * 0.02,
      height: bh - unit * 0.06,
      fill: `url(#${tile})`,
    });
    x += bw + g.f(0, unit * 0.03);
  }
  // Sidewalk, curb and road
  out += el("rect", { y: walkTop, width: w, height: roadTop - walkTop, fill: hsl(35, 8, 72 * dark) });
  out += el("rect", { y: roadTop, width: w, height: h - roadTop, fill: hsl(220, 8, 34 * dark) });
  out += el("rect", { y: roadTop, width: w, height: unit * 0.014, fill: hsl(35, 6, 55 * dark) });
  const u = local(cx, roadY, size);
  const paint =
    style === "school"
      ? "#f2b705"
      : style === "double-decker"
        ? g.pick(["#c8102e", "#c8102e", "#1f4e8c", "#2f6b58"])
        : g.pick(PAINTS.slice(0, 8));
  const accent = style === "school" ? "#23242a" : g.pick(["#f4efe2", "#23242a", mix(paint, "#000000", 0.3)]);
  const glass = time === "night" ? "#3a4660" : "#c4dceb";
  const lit = hsl(45, 85, 74);
  const panes: string[] = [];
  out += u.ellipse(0, 0, 0.54, 0.03, { fill: "#000", opacity: 0.2 });
  out += facing(cx, dir);
  let wheels: number[];
  let r = 0.075;
  /** A strip of windows split by thin bars of body color. */
  const strip = (x: number, y: number, sw: number, sh: number, bars: number) => {
    panes.push(`${x} ${y} ${sw} ${sh}`);
    let d = "";
    for (let k = 1; k < bars; k++) d += `M ${x + (sw * k) / bars} ${y} V ${y + sh} `;
    return d;
  };
  let bars = "";
  if (style === "school") {
    wheels = [-0.3, 0.36];
    out += u.rect(-0.5, -0.4, 0.8, 0.34, { rx: u.k(0.05), fill: paint });
    out += u.path("M 0.27 -0.22 L 0.42 -0.22 Q 0.5 -0.21 0.5 -0.15 L 0.5 -0.06 L 0.27 -0.06 Z", { fill: paint });
    out += u.rect(-0.5, -0.225, 0.8, 0.014, { fill: accent });
    out += u.rect(-0.5, -0.16, 0.99, 0.014, { fill: accent });
    out += u.rect(0.46, -0.11, 0.05, 0.04, { rx: u.k(0.01), fill: accent });
    bars += strip(-0.45, -0.34, 0.58, 0.09, 5);
    bars += strip(0.16, -0.34, 0.09, 0.26, 2);
    bars += strip(0.27, -0.35, 0.025, 0.12, 1);
  } else if (style === "double-decker") {
    wheels = [-0.28, 0.25];
    r = 0.08;
    out += u.rect(-0.5, -0.62, 1.0, 0.56, { rx: u.k(0.05), fill: paint });
    out += u.rect(-0.5, -0.38, 1.0, 0.03, { fill: accent });
    out += u.rect(0.3, -0.6, 0.17, 0.035, { rx: u.k(0.008), fill: "#23242a" });
    bars += strip(-0.46, -0.55, 0.94, 0.1, 6);
    bars += strip(-0.46, -0.31, 0.78, 0.1, 5);
    bars += strip(0.36, -0.32, 0.11, 0.25, 2);
  } else {
    wheels = [-0.3, 0.24];
    out += u.rect(-0.5, -0.42, 1.0, 0.36, { rx: u.k(0.045), fill: paint });
    out += u.rect(-0.5, -0.2, 0.84, 0.03, { fill: accent });
    out += u.rect(0.34, -0.405, 0.15, 0.035, { rx: u.k(0.008), fill: "#23242a" });
    bars += strip(-0.46, -0.35, 0.78, 0.12, 5);
    bars += strip(0.36, -0.35, 0.1, 0.28, 2);
    bars += strip(0.472, -0.36, 0.022, 0.24, 1);
  }
  const panesAt = (color: string) =>
    panes
      .map(p => {
        const [x, y, pw, ph] = p.split(" ").map(Number);
        return u.rect(x, y, pw, ph, { rx: u.k(0.012), fill: color });
      })
      .join("") + u.path(bars || "M 0 0", { stroke: paint, "stroke-width": u.k(0.018) });
  out += panesAt(glass);
  // Skirt, taillight, and the wheels in their arches.
  out += u.rect(-0.5, -0.09, style === "school" ? 0.8 : 1.0, 0.03, { fill: "#000", opacity: 0.2 });
  out += u.rect(-0.5, -0.17, 0.012, 0.045, { fill: "#c8302a" });
  for (const wx of wheels) {
    out += u.path(`M ${wx - r * 1.3} -0.06 A ${r * 1.3} ${r * 1.3} 0 0 1 ${wx + r * 1.3} -0.06 Z`, { fill: "#1d1e22" });
    out +=
      u.circle(wx, -r, r, { fill: TIRE }) +
      u.circle(wx, -r, r * 0.5, { fill: CHROME }) +
      u.circle(wx, -r, r * 0.17, { fill: "#8a9099" });
  }
  out += "</g>" + veil(w, h, time) + facing(cx, dir);
  if (time === "night") out += panesAt(lit);
  // A sign showing the route, and the headlight.
  const sign = style === "double-decker" ? [0.31, -0.592] : style === "city" ? [0.35, -0.397] : undefined;
  if (sign) out += u.rect(sign[0], sign[1], 0.13, 0.02, { fill: hsl(38, 95, 60) });
  out += u.rect(style === "school" ? 0.485 : 0.487, -0.14, 0.013, 0.03, {
    fill: hsl(50, 90, time === "day" ? 88 : 80),
  });
  out += "</g>";
  const name = style === "school" ? "A school bus" : style === "double-decker" ? "A double-decker bus" : "A city bus";
  note.alt(`${name} on a city street${when(time)}`);
  note.focus(cx, roadY - size * tall * 0.55);
  return out;
});

/** An airliner or a small propeller plane climbing through the sky. */
export const airplane = defineKind("airplane", "Airplane", { engine: ["jet", "propeller"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const engine = g.option("engine", g.chance(0.7) ? "jet" : "propeller");
  const time = g.pick(["day", "day", "day", "dusk", "night"] as const);
  const size = Math.min(w * 0.78, unit * 1.15) * g.f(0.82, 0.95);
  const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.06);
  const cy = h / 2 + size * 0.06 + g.f(-0.05, 0.05) * h;
  const dir = g.pick([1, -1]);
  const pitch = -g.f(3, 12);
  let out = skyAt(g, w, h, time, h);
  // Clouds, behind the plane.
  const clouds = g.i(2, 5);
  for (let k = 0; k < clouds; k++)
    out += cloud(
      w * g.f(-0.05, 1.05),
      h * g.f(0.2, 1.02),
      unit * g.f(0.1, 0.2),
      "#ffffff",
      time === "day" ? 0.9 : time === "dusk" ? 0.55 : 0.12,
    );
  const u = local(cx, cy, size);
  const paint = g.pick(["#f4f3ef", "#f4f3ef", "#e6e9ee", ...PAINTS.slice(0, 6)]);
  const accent = g.pick(["#d6453d", "#2f6fb0", "#1f3a5f", "#f08a5d", "#5bab6e", "#e0a526", "#9b7ed1"]);
  const glass = time === "night" ? hsl(45, 80, 72) : "#2f3e52";
  let plane = "";
  const lights: string[] = [];
  if (engine === "jet") {
    // A contrail streaming back off the edge.
    if (time !== "night" && g.chance(0.5))
      plane += u.path("M -0.5 -0.03 L -4 -0.03", {
        stroke: "#ffffff",
        "stroke-width": u.k(0.03),
        opacity: 0.55,
        "stroke-linecap": "round",
      });
    const body =
      "M 0.36 -0.065 Q 0.5 -0.06 0.51 0 Q 0.5 0.06 0.36 0.065 L -0.25 0.065 Q -0.4 0.06 -0.5 -0.03 L -0.5 -0.06 Q -0.48 -0.065 -0.42 -0.065 Z";
    const clip = g.id("plane");
    plane += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
    // Tail fin
    plane += u.path("M -0.3 -0.06 L -0.43 -0.27 L -0.5 -0.27 L -0.5 -0.05 Z", { fill: accent });
    plane += u.path(body, { fill: paint });
    plane += u.rect(-0.6, 0.025, 1.2, 0.05, { fill: mix(paint, "#000000", 0.12), "clip-path": `url(#${clip})` });
    plane += u.rect(-0.6, -0.04, 1.2, 0.012, { fill: accent, "clip-path": `url(#${clip})` });
    // Windows: a dashed line.
    const windows = u.path("M -0.3 -0.018 L 0.33 -0.018", {
      stroke: glass,
      "stroke-width": u.k(0.022),
      "stroke-dasharray": s`${u.k(0.012)} ${u.k(0.022)}`,
      "stroke-linecap": "round",
    });
    plane += windows;
    lights.push(windows);
    plane += u.path("M 0.42 -0.045 L 0.465 -0.036 L 0.478 -0.02 L 0.42 -0.02 Z", { fill: glass });
    plane += u.rect(0.37, -0.045, 0.025, 0.07, {
      rx: u.k(0.008),
      fill: "none",
      stroke: "#000",
      "stroke-width": u.k(0.004),
      opacity: 0.25,
    });
    // Tailplane, wing, pylon and engine.
    plane += u.path("M -0.36 -0.015 L -0.5 0.03 L -0.53 0.025 L -0.47 -0.025 Z", { fill: mix(paint, "#000000", 0.18) });
    plane += u.path("M 0.1 0.03 L -0.12 0.03 L -0.27 0.15 L -0.21 0.15 Z", { fill: mix(paint, "#000000", 0.1) });
    plane += u.rect(-0.1, 0.075, 0.17, 0.06, { rx: u.k(0.03), fill: g.pick([paint, accent, "#c9ced6"]) });
    plane += u.ellipse(0.065, 0.105, 0.012, 0.027, { fill: "#3a3d44" });
    lights.push(u.circle(-0.27, 0.15, 0.012, { fill: "#ff4d4d" }), u.circle(-0.5, -0.27, 0.01, { fill: "#ffffff" }));
  } else {
    const body =
      "M 0.38 -0.06 Q 0.46 -0.06 0.46 0 Q 0.46 0.05 0.38 0.055 L -0.15 0.04 Q -0.38 0.02 -0.5 -0.02 L -0.5 -0.04 Q -0.3 -0.05 -0.1 -0.06 L 0.1 -0.1 Q 0.2 -0.11 0.3 -0.07 Z";
    // Rounded tail fin
    plane += u.path("M -0.28 -0.045 Q -0.38 -0.22 -0.46 -0.22 Q -0.5 -0.22 -0.5 -0.15 L -0.5 -0.035 Z", {
      fill: accent,
    });
    // Landing gear, below the body.
    plane += u.path("M 0.22 0.04 L 0.26 0.15 M -0.42 0.0 L -0.43 0.05", {
      stroke: "#3a3d44",
      "stroke-width": u.k(0.014),
    });
    plane += u.circle(0.26, 0.155, 0.028, { fill: TIRE }) + u.circle(-0.43, 0.055, 0.015, { fill: TIRE });
    plane += u.path(body, { fill: paint });
    plane += u.path("M -0.5 -0.025 L 0.46 -0.005", { stroke: accent, "stroke-width": u.k(0.018) });
    // Cabin windows
    plane += u.path("M 0.21 -0.085 Q 0.29 -0.08 0.33 -0.05 L 0.21 -0.05 Z", { fill: glass });
    plane += u.rect(0.08, -0.08, 0.1, 0.035, { rx: u.k(0.01), fill: glass });
    // High wing on top, with its strut.
    plane += u.line(0.05, 0.03, 0.0, -0.1, { stroke: "#3a3d44", "stroke-width": u.k(0.012) });
    plane += u.rect(-0.08, -0.125, 0.34, 0.03, { rx: u.k(0.015), fill: mix(paint, "#000000", 0.12) });
    plane += u.path("M -0.36 -0.02 L -0.5 0.0 L -0.51 -0.015 L -0.46 -0.035 Z", { fill: mix(paint, "#000000", 0.18) });
    // Spinner and a blurred propeller
    plane += u.ellipse(0.47, 0, 0.012, 0.17, { fill: "#3a3d44", opacity: 0.25 });
    plane += u.path("M 0.46 -0.03 Q 0.52 -0.02 0.53 0 Q 0.52 0.02 0.46 0.03 Z", { fill: accent });
    lights.push(u.circle(-0.08, -0.11, 0.012, { fill: "#ff4d4d" }), u.circle(-0.5, -0.22, 0.01, { fill: "#ffffff" }));
  }
  out += facing(cx, dir) + el("g", { transform: s`rotate(${pitch} ${cx} ${cy})` }, plane) + "</g>";
  out += veil(w, h, time);
  if (time === "night")
    out += facing(cx, dir) + el("g", { transform: s`rotate(${pitch} ${cx} ${cy})` }, ...lights) + "</g>";
  const name = engine === "jet" ? "An airliner" : "A small propeller plane";
  note.alt(
    `${name} climbing through ${time === "night" ? "the night sky" : time === "dusk" ? "a sunset sky" : "the clouds"}`,
  );
  note.focus(cx, cy);
  return out;
});
