import { defineKind, el, facing, hsl, mix, type Point } from "../../draw/core";
import { hill, local, PAINTS, shade, skyAt, timeOfDay, TIRE, tree, veil, when } from "./shared";

/**
 * A bicycle standing on a park path.
 *
 * @category Vehicles
 */
export const bicycle = /* @__PURE__ */ defineKind("bicycle", "Bicycle", (g, w, h, note) => {
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
