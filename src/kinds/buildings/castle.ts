import { defineKind, el, type Point, pts, s } from "../../draw/core";
import { FLOWERS, hill, LIT, local, shade, skyAt, timeOfDay, tone, tree, UNLIT, veil, when } from "./shared";

/** Battlements along the top of a wall from x0 to x1 at y: merlons `mh` tall, as local path data. */
function merlons(x0: number, x1: number, y: number, mh: number): string {
  const count = Math.max(2, Math.round((x1 - x0) / (mh * 2.2)));
  const step = (x1 - x0) / (count * 2 - 1);
  let d = "";
  for (let k = 0; k < count; k++)
    d += `M ${x0 + k * 2 * step} ${y + 0.002} V ${y - mh} H ${x0 + (k * 2 + 1) * step} V ${y + 0.002} Z `;
  return d;
}

/**
 * A storybook castle on a hill, with towers, battlements, flags and a gate.
 *
 * @category Buildings
 */
export const castle = /* @__PURE__ */ defineKind("castle", "Storybook castle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  // Wide pictures put the horizon lower, leaving more height for the castle.
  const top = h * (g.f(0.56, 0.62) + Math.min(0.12, Math.max(0, (w / h - 2) * 0.06)));
  // On wide pictures the curtain wall stretches out, so the castle fills more of the frame.
  const span = Math.max(0.62, Math.min(1.5, 0.62 + (w / h - 1.6) * 0.4));
  const size = Math.min((top - h * 0.04) / 1.5, (w * 0.84) / (1.75 + (span - 0.62) * 2), unit * 0.75);
  const cx = w * g.f(0.42, 0.58);
  const grass = g.f(85, 125);
  let out = skyAt(g, w, h, time, top + (h - top) * 0.4);
  out += hill(g, w, h, top + (h - top) * 0.3, h * g.f(0.04, 0.1), tone(grass + 15, 24, 62, dark));
  out += el("rect", { y: top + (h - top) * 0.6, width: w, height: h, fill: tone(grass + 5, 34, 50, dark) });
  // The castle hill: flat on top, falling away to either side.
  const flat = size * (span + 0.28);
  const fall = size * 1.4;
  const hillY = (x: number) => {
    const d = Math.max(0, Math.abs(x - cx) - flat);
    return top + (d * d) / fall;
  };
  const reach = flat + Math.sqrt((h - top) * fall);
  const ridge: Point[] = [];
  for (let k = 0; k <= 24; k++) {
    const x = cx - reach + (2 * reach * k) / 24;
    ridge.push([x, hillY(x)]);
  }
  const hillPaint = tone(grass, 40, 44, dark);
  const hillShape = (dy: number) =>
    el("polygon", {
      points: pts([[cx - reach, h + 1], ...ridge.map(([x, y]): Point => [x, y + dy]), [cx + reach, h + 1]]),
      fill: hillPaint,
    });
  out += hillShape(0);
  // Trees on the slopes.
  const leaf = tone(grass + 10, 38, 30, dark);
  const trunk = tone(25, 30, 26, dark);
  for (const dir of [-1, 1])
    for (let k = g.i(0, 2); k > 0; k--) {
      const x = cx + dir * (flat + size * g.f(0.1, 0.9));
      out += tree(x, hillY(x) + size * 0.04, size * g.f(0.28, 0.4), leaf, trunk);
    }
  const u = local(cx, top, size);
  const stone = g.pick([
    [35, 15, 82],
    [30, 25, 74],
    [210, 8, 72],
    [15, 20, 80],
    [45, 25, 86],
  ] as const);
  const wall = tone(stone[0], stone[1], stone[2], dark);
  const back = tone(stone[0], stone[1], stone[2] - 10, dark);
  const roofPaint = g.pick([
    [215, 45, 40],
    [0, 50, 42],
    [175, 35, 36],
    [265, 30, 42],
    [20, 45, 38],
  ] as const);
  const roof = tone(roofPaint[0], roofPaint[1], roofPaint[2], dark);
  const flagHue = g.pick(FLOWERS);
  const flagSide = g.pick([-1, 1]);
  const lit = time !== "day";
  let glass = "";
  const shadow = (x0: number, y0: number, ww: number, hh: number) =>
    u.rect(x0, y0, ww, hh, { fill: "#000", opacity: 0.1 });
  const flag = (x: number, y: number) =>
    u.path(`M ${x} ${y} V ${y - 0.2}`, { stroke: tone(30, 10, 30, dark), "stroke-width": u.k(0.012) }) +
    u.path(
      `M ${x} ${y - 0.2} Q ${x + flagSide * 0.07} ${y - 0.22} ${x + flagSide * 0.15} ${y - 0.17} Q ${x + flagSide * 0.07} ${y - 0.16} ${x} ${y - 0.12} Z`,
      { fill: flagHue },
    );
  const cone = (x: number, y: number, half: number, tall: number) =>
    u.poly(
      [
        [x - half, y],
        [x, y - tall],
        [x + half, y],
      ],
      { fill: roof },
    ) + flag(x, y - tall + 0.01);
  const roofs = g.chance(0.65);
  // The keep, behind the curtain wall.
  const keepTop = -g.f(0.78, 0.92);
  out += u.rect(-0.24, keepTop, 0.48, -keepTop + 0.12, { fill: back });
  out += shadow(0.08, keepTop, 0.16, -keepTop + 0.12);
  if (roofs)
    out += u.poly(
      [
        [-0.28, keepTop],
        [-0.2, keepTop - 0.18],
        [0.2, keepTop - 0.18],
        [0.28, keepTop],
      ],
      { fill: roof },
    );
  else out += u.path(merlons(-0.24, 0.24, keepTop, 0.06), { fill: back });
  for (const x of [-0.12, 0.12])
    glass += u.path(
      `M ${x - 0.04} ${keepTop + 0.28} V ${keepTop + 0.18} A 0.04 0.04 0 0 1 ${x + 0.04} ${keepTop + 0.18} V ${keepTop + 0.28} Z`,
      {},
    );
  // A slim turret rising from the ground at one corner of the keep, taller than the keep.
  const turret = g.chance(0.6);
  if (turret) {
    const tx = g.pick([-1, 1]) * 0.27;
    const tt = Math.max(-1, keepTop - g.f(0.16, 0.26));
    out += u.rect(tx - 0.07, tt, 0.14, 0.12 - tt, { fill: back });
    out += shadow(tx + 0.02, tt, 0.05, 0.12 - tt);
    out += cone(tx, tt, 0.1, 0.24);
    glass += u.rect(tx - 0.015, tt + 0.08, 0.03, 0.08, {});
  } else if (roofs) out += flag(0, keepTop - 0.18);
  else out += flag(0, keepTop - 0.06);
  // The curtain wall and its battlements.
  const wallTop = -0.38;
  out += u.rect(-span, wallTop, span * 2, 0.5, { fill: wall });
  out += u.path(merlons(-span, span, wallTop, 0.06), { fill: wall });
  out += u.rect(-span, wallTop, span * 2, 0.03, { fill: "#000", opacity: 0.08 });
  // Towers at either end, and sometimes a pair flanking the gate.
  const tower = (x: number, half: number, tt: number, coned: boolean, flagged = true) => {
    let t = u.rect(x - half, tt, half * 2, 0.12 - tt, { fill: wall });
    t += shadow(x + half * 0.3, tt, half * 0.7, 0.12 - tt);
    if (coned) t += cone(x, tt, half * 1.25, half * 2.6);
    else {
      t += u.rect(x - half * 1.15, tt - 0.03, half * 2.3, 0.05, { fill: wall });
      t += u.path(merlons(x - half * 1.15, x + half * 1.15, tt - 0.03, 0.05), { fill: wall });
      if (flagged) t += flag(x, tt - 0.08);
    }
    glass += u.rect(x - 0.012, tt + 0.1, 0.024, 0.08, {});
    return t;
  };
  const sideTop = -g.f(0.62, 0.74);
  out += tower(-span, 0.13, sideTop, roofs) + tower(span, 0.13, sideTop, roofs);
  // A long wall gets a second pair of towers partway along.
  const midTowers = span > 1;
  if (midTowers) {
    const mx = (span + 0.27) / 2 + 0.05;
    const mt = sideTop + g.f(0.02, 0.08);
    out += tower(-mx, 0.11, mt, roofs) + tower(mx, 0.11, mt, roofs);
  }
  // Squat gate towers stand in front of the keep, so they carry no flags.
  const gateTowers = g.chance(0.45);
  if (gateTowers) out += tower(-0.17, 0.08, -0.5, false, false) + tower(0.17, 0.08, -0.5, false, false);
  // The gate, with its portcullis.
  out += u.path("M -0.085 0.12 V -0.12 A 0.085 0.085 0 0 1 0.085 -0.12 V 0.12 Z", { fill: tone(25, 25, 18, dark) });
  if (g.chance(0.6)) {
    let bars = "";
    for (let k = -2; k <= 2; k++) bars += `M ${k * 0.032} -0.2 V 0.04 `;
    bars += "M -0.085 -0.1 H 0.085 M -0.085 -0.02 H 0.085 ";
    out += u.path(bars, { stroke: tone(30, 10, 45, dark), "stroke-width": u.k(0.01) });
  }
  const windows = el("g", { fill: lit ? LIT : UNLIT }, glass);
  if (!lit) out += windows;
  // The hill again, a little lower, to bury the castle's foot; then the track up to the gate.
  out += hillShape(size * 0.035);
  const foot = cx + g.pick([-1, 1]) * Math.min(reach * 0.5, w * 0.3);
  out += el("path", {
    d: s`M${cx} ${top + size * 0.04}
         C ${cx + (foot - cx) * 1.4} ${top + (h - top) * 0.3} ${foot - (foot - cx) * 0.8} ${top + (h - top) * 0.6} ${foot} ${h + 2}`,
    fill: "none",
    stroke: tone(38, 25, 70, dark),
    "stroke-width": size * 0.06,
  });
  out += veil(w, h, time);
  if (lit) out += windows;
  const towers = `${["two", "four", "six"][+gateTowers + +midTowers]} towers`;
  const tops = roofs ? "pointed roofs" : "battlements";
  note.alt(`A storybook castle with ${towers}, ${tops} and flags on a hill${when(time)}`);
  note.focus(cx, top - size * 0.4);
  return out;
});
