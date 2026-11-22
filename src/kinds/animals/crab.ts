import { defineKind, el, hsl, mix, type Point, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { sky } from "./shared";

const CRABS = [
  { shell: "#e2553f", name: "red" },
  { shell: "#f08a3a", name: "orange" },
  { shell: "#c8403a", name: "red" },
  { shell: "#5a86c8", name: "blue" },
  { shell: "#8a5aa8", name: "purple" },
] as const;

/**
 * A crab on the sand at the water's edge, claws raised.
 *
 * @category Animals
 */
export const crab = /* @__PURE__ */ defineKind("crab", "Crab", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(CRABS);
  const shell = colors.shell;
  const dark = mix(shell, "#000000", 0.2);
  const light = mix(shell, "#ffffff", 0.35);
  const hz = h * g.f(0.3, 0.4);
  const gy = h * g.f(0.8, 0.86);
  const cx = w * g.f(0.45, 0.55);
  const rx = unit * g.f(0.2, 0.23);
  const ry = rx * g.f(0.58, 0.66);
  const cy = gy - ry * 1.3;
  let out = sky(g, w, h, g.f(190, 215));
  // Sea, a line of foam and the sand.
  out += el("rect", { y: hz, width: w, height: h, fill: hsl(g.f(180, 200), 55, g.f(48, 56)) });
  const shore = hz + (h - hz) * g.f(0.18, 0.28);
  out += el("path", {
    d: s`M -5 ${shore} Q ${w * 0.3} ${shore - h * 0.04} ${w * 0.6} ${shore} T ${w + 5} ${shore} V ${h} H -5 Z`,
    fill: "#f4f1ea",
    opacity: "0.85",
  });
  const sand = hsl(g.f(38, 46), 55, g.f(74, 82));
  out += el("path", {
    d: s`M -5 ${shore + h * 0.03} Q ${w * 0.3} ${shore - h * 0.01} ${w * 0.6} ${shore + h * 0.03} T ${w + 5} ${shore + h * 0.03} V ${h} H -5 Z`,
    fill: sand,
  });
  // A shell or a starfish on the sand.
  const extra = g.pick(["shell", "starfish", "none"] as const);
  if (extra !== "none") {
    const sx = cx + g.pick([-1, 1]) * rx * g.f(2.1, 2.5);
    const sy = gy + (h - gy) * g.f(0.1, 0.5);
    const sr = unit * g.f(0.035, 0.05);
    if (extra === "starfish") {
      const star: Point[] = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? sr * 0.42 : sr;
        star.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.8]);
      }
      out += el("path", { d: smoothClosed(star), fill: g.pick(["#f08a5a", "#e86f8a", "#f2b14e"]) });
    } else {
      out += el("path", {
        d: s`M ${sx - sr} ${sy + sr * 0.4} Q ${sx} ${sy - sr * 1.3} ${sx + sr} ${sy + sr * 0.4} Z`,
        fill: "#f6e1d0",
      });
      out += el("path", {
        d: s`M ${sx} ${sy + sr * 0.35} L ${sx} ${sy - sr * 0.4} M ${sx} ${sy + sr * 0.35} L ${sx - sr * 0.5} ${sy - sr * 0.15}
             M ${sx} ${sy + sr * 0.35} L ${sx + sr * 0.5} ${sy - sr * 0.15}`,
        stroke: "#d8b8a0",
        "stroke-width": sr * 0.1,
        "stroke-linecap": "round",
      });
    }
  }
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.6, ry: ry * 0.18, fill: "#000", opacity: "0.15" });
  // Legs: three a side, bending up at the knee and down to the sand.
  let legs = "";
  for (const sd of [-1, 1])
    for (let k = 0; k < 3; k++) {
      const hip: Point = [cx + sd * rx * (0.7 - k * 0.1), cy + ry * (0.1 + k * 0.25)];
      const knee: Point = [cx + sd * rx * (1.15 + k * 0.22), cy - ry * (0.45 - k * 0.3)];
      const foot: Point = [cx + sd * rx * (1.05 + k * 0.4), gy];
      legs += s`M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]} `;
    }
  out += el("path", {
    d: legs,
    stroke: dark,
    "stroke-width": rx * 0.12,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    fill: "none",
  });
  // Arms and claws, raised. Each claw is round with a wedge cut out between the pincers.
  const reach = g.f(1.3, 1.6);
  const gape = g.f(0.3, 0.5);
  for (const sd of [-1, 1]) {
    const cr = rx * 0.3;
    const px = cx + sd * rx * 1.15;
    const py = cy - ry * reach;
    out += el("path", {
      d: s`M ${cx + sd * rx * 0.6} ${cy - ry * 0.3} Q ${cx + sd * rx * 1.15} ${cy - ry * 0.3} ${px} ${py}`,
      stroke: shell,
      "stroke-width": rx * 0.18,
      "stroke-linecap": "round",
      fill: "none",
    });
    const mouth = -Math.PI / 2 + sd * 0.35;
    const a1 = mouth + gape;
    const a2 = mouth - gape;
    out += el("path", {
      d: s`M ${px} ${py - cr * 0.1}
           L ${px + Math.cos(a1) * cr} ${py + Math.sin(a1) * cr}
           A ${cr} ${cr * 1.1} 0 1 1 ${px + Math.cos(a2) * cr} ${py + Math.sin(a2) * cr} Z`,
      fill: shell,
    });
  }
  // Eye stalks and eyes.
  for (const sd of [-1, 1]) {
    const ex = cx + sd * rx * 0.3;
    const ey = cy - ry * 1.45;
    out += el("path", {
      d: s`M ${cx + sd * rx * 0.22} ${cy - ry * 0.7} L ${ex} ${ey}`,
      stroke: dark,
      "stroke-width": rx * 0.08,
      "stroke-linecap": "round",
    });
    out += el("circle", { cx: ex, cy: ey, r: rx * 0.14, fill: "#fff" });
    out += el("circle", { cx: ex + sd * rx * 0.02, cy: ey + rx * 0.02, r: rx * 0.075, fill: "#111" });
    out += el("circle", { cx: ex + rx * 0.03, cy: ey - rx * 0.03, r: rx * 0.025, fill: "#fff" });
  }
  // Body, with a highlight, smile and cheeks.
  out += el("ellipse", { cx, cy, rx, ry, fill: shell });
  out += el("ellipse", { cx, cy: cy - ry * 0.45, rx: rx * 0.55, ry: ry * 0.22, fill: light, opacity: "0.5" });
  out += el("path", {
    d: s`M ${cx - rx * 0.2} ${cy + ry * 0.05} Q ${cx} ${cy + ry * 0.35} ${cx + rx * 0.2} ${cy + ry * 0.05}`,
    stroke: "#3a1a14",
    "stroke-width": rx * 0.05,
    "stroke-linecap": "round",
    fill: "none",
  });
  for (const sd of [-1, 1])
    out += el("circle", { cx: cx + sd * rx * 0.5, cy: cy + ry * 0.05, r: rx * 0.1, fill: "#ff6a7a", opacity: "0.35" });
  note.alt(`A crab on the sand at the water's edge, claws raised${extra === "none" ? "" : `, beside a ${extra}`}`);
  note.focus(cx, cy - ry * 0.6);
  // Body and eyes.
  note.frame(cx - rx * 1.1, cy - ry * 1.85, rx * 2.2, ry * 2.85);
  return out;
});
