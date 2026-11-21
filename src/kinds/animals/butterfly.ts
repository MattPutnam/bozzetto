import { defineKind, el, hsl, s } from "../../draw/core";
import { flower, PETALS, sky } from "./shared";

const WINGS = [
  { name: "orange", wing: "#f08a24", edge: "#2a1e18", spot: "#fff" },
  { name: "blue", wing: "#3d8de0", edge: "#14243a", spot: "#bfe3ff" },
  { name: "yellow", wing: "#f7d154", edge: "#2a2418", spot: "#fff4c2" },
  { name: "pink", wing: "#f48fb1", edge: "#6a2846", spot: "#fff" },
  { name: "white", wing: "#f7f4ec", edge: "#6a6a6a", spot: "#3a3a3a" },
  { name: "purple", wing: "#9b6fd8", edge: "#2a1a44", spot: "#f7d154" },
] as const;

/** A butterfly with open wings, resting on a flower or fluttering beside it. */
export const butterfly = /* @__PURE__ */ defineKind("butterfly", "Butterfly", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(WINGS);
  const perched = g.chance(0.55);
  const fr = unit * g.f(0.13, 0.16);
  const fx = w / 2 + (perched ? 0 : g.pick([-1, 1]) * unit * 0.18);
  const ft = h * g.f(0.56, 0.64);
  const gy = h * g.f(0.82, 0.88);
  let out = sky(g, w, h, g.f(185, 215));
  // Grass.
  out += el("rect", { y: gy, width: w, height: h, fill: hsl(g.f(85, 115), 40, g.f(48, 56)) });
  // Other flowers, smaller and further off.
  for (let k = g.i(1, 3); k > 0; k--) {
    const x = w * g.pick([g.f(0.04, 0.22), g.f(0.78, 0.96)]);
    out += flower(g, x, gy + h * 0.05, gy - (gy - ft) * g.f(0.3, 0.7), fr * g.f(0.6, 0.8), g.pick(PETALS), "#f2c14e");
  }
  // The flower the butterfly visits.
  out += flower(g, fx, h + 2, ft, fr, g.pick(PETALS), g.pick(["#f2c14e", "#e8892e", "#7a4a2e"]));
  const span = unit * (perched ? g.f(0.16, 0.19) : g.f(0.18, 0.22));
  const body = span * 0.85;
  const tilt = perched ? g.f(-8, 8) : g.f(-25, 25);
  const bx = perched ? fx : fx - Math.sign(fx - w / 2) * unit * g.f(0.32, 0.38);
  const by = perched ? ft - body * 0.4 : ft - unit * g.f(0.15, 0.25);
  const ay = by - body * 0.2;
  const near = perched ? 1 : g.f(0.6, 0.8);
  // One pair of wings on the right side of the body: fore and hind.
  const wing = (sd: number, scale: number): string => {
    const W = span * scale;
    const H = span * 0.95;
    const x = (v: number): number => bx + sd * v;
    const fore = s`M ${x(0)} ${ay + body * 0.05}
       C ${x(W * 0.25)} ${ay - H * 0.7} ${x(W * 0.7)} ${ay - H * 1.0} ${x(W)} ${ay - H * 0.9}
       Q ${x(W * 1.02)} ${ay - H * 0.35} ${x(W * 0.7)} ${ay - H * 0.1}
       Q ${x(W * 0.35)} ${ay + H * 0.05} ${x(0)} ${ay + body * 0.15} Z`;
    const hind = s`M ${x(0)} ${ay + body * 0.1}
       C ${x(W * 0.65)} ${ay + H * 0.0} ${x(W * 0.8)} ${ay + H * 0.6} ${x(W * 0.38)} ${ay + H * 0.72}
       Q ${x(W * 0.1)} ${ay + H * 0.72} ${x(0)} ${ay + body * 0.45} Z`;
    const edge = Math.max(1.2, span * 0.045);
    let wings = el("path", {
      d: hind + fore,
      fill: colors.wing,
      stroke: colors.edge,
      "stroke-width": edge,
      "stroke-linejoin": "round",
    });
    // Spots near the wingtip and on the hind wing.
    for (const [dx, dy, r] of [
      [0.84, -0.78, 0.055],
      [0.9, -0.6, 0.045],
      [0.68, -0.84, 0.04],
      [0.45, 0.5, 0.06],
    ])
      wings += el("circle", { cx: x(W * dx), cy: ay + H * dy, r: span * r, fill: colors.spot });
    return wings;
  };
  out += el(
    "g",
    { transform: s`rotate(${tilt} ${bx} ${by + body * 0.5})` },
    wing(-1, near),
    wing(1, perched ? 1 : 1 / near - 0.2),
    // Body.
    el("ellipse", { cx: bx, cy: by, rx: span * 0.07, ry: body * 0.5, fill: "#2a2320" }),
    el("circle", { cx: bx, cy: by - body * 0.5, r: span * 0.08, fill: "#2a2320" }),
    // Antennae with clubbed tips.
    el("path", {
      d: s`M ${bx - span * 0.03} ${by - body * 0.55} Q ${bx - span * 0.1} ${by - body * 0.9} ${bx - span * 0.25} ${by - body * 1.0}
         M ${bx + span * 0.03} ${by - body * 0.55} Q ${bx + span * 0.1} ${by - body * 0.9} ${bx + span * 0.25} ${by - body * 1.0}`,
      stroke: "#2a2320",
      "stroke-width": Math.max(1, span * 0.025),
      fill: "none",
    }),
    el("circle", { cx: bx - span * 0.25, cy: by - body * 1.0, r: span * 0.035, fill: "#2a2320" }),
    el("circle", { cx: bx + span * 0.25, cy: by - body * 1.0, r: span * 0.035, fill: "#2a2320" }),
  );
  note.alt(perched ? "A butterfly resting on a flower" : "A butterfly fluttering beside a flower");
  note.focus(bx, ay);
  return out;
});
