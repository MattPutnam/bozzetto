import { defineKind, el, facing, hsl, mix, s } from "../../draw/core";
import { hill, local, shade, skyAt, timeOfDay, tree, veil, when } from "./shared";

/** A steam locomotive pulling one or two carriages along a track. */
export const train = /* @__PURE__ */ defineKind("train", "Steam train", (g, w, h, note) => {
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
