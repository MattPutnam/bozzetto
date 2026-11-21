import { defineKind, el, hsl, type Rand, s } from "../../draw/core";
import { cloud, hill, local, shade, skyAt, veil } from "./shared";

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
export const hotAirBalloon = /* @__PURE__ */ defineKind("hot-air-balloon", "Hot-air balloon", (g, w, h, note) => {
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
