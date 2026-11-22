import { defineKind, el, facing, hsl, type Point, pts, s } from "../../draw/core";
import { smoothClosed } from "../../draw/shapes";
import { PETALS, sky, turn, turnBox } from "./shared";

/**
 * A turtle plodding across a meadow or a beach, its head out of its shell.
 *
 * @category Animals
 */
export const turtle = /* @__PURE__ */ defineKind("turtle", "Turtle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const beach = g.chance(0.4);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.76, 0.82);
  const rx = unit * g.f(0.27, 0.32);
  const ry = rx * g.f(0.58, 0.7);
  const cx = w / 2 - dir * rx * 0.15 + w * g.f(-0.05, 0.05);
  const shellHue = g.f(25, 110);
  const shellLight = g.f(30, 40);
  const shell = hsl(shellHue, g.f(35, 55), shellLight);
  const scute = hsl(shellHue + g.f(-10, 10), 45, shellLight + g.f(12, 20));
  const skinHue = g.f(65, 110);
  const skin = hsl(skinHue, g.f(25, 45), g.f(48, 58));
  const farSkin = hsl(skinHue, 30, 38);
  const hz = gy - (gy - h * 0.3) * g.f(0.45, 0.6);
  let out = sky(g, w, h, g.f(190, 215));
  if (beach) {
    // The sea and the sand.
    out += el("rect", { y: hz, width: w, height: gy, fill: hsl(g.f(185, 205), 55, 52) });
    out += el("path", {
      d: s`M -5 ${hz + (gy - hz) * 0.55} Q ${w * 0.5} ${hz + (gy - hz) * 0.4} ${w + 5} ${hz + (gy - hz) * 0.6} V ${h} H -5 Z`,
      fill: hsl(g.f(38, 46), 55, g.f(74, 82)),
    });
  } else {
    // A far hill and the meadow, with a few flowers.
    out += el("ellipse", {
      cx: w * g.f(0.2, 0.8),
      cy: hz + h * 0.1,
      rx: w * 0.7,
      ry: h * 0.16,
      fill: hsl(110, 30, 66),
    });
    out += el("path", {
      d: s`M -5 ${hz + (gy - hz) * 0.5} Q ${w * 0.5} ${hz + (gy - hz) * 0.3} ${w + 5} ${hz + (gy - hz) * 0.55} V ${h} H -5 Z`,
      fill: hsl(g.f(85, 115), 40, g.f(48, 56)),
    });
    for (let k = g.i(3, 6); k > 0; k--) {
      const fx = w * g.f(0.03, 0.97);
      const fy = gy + (h - gy) * g.f(0.15, 0.85);
      if (Math.abs(fx - cx) < rx * 1.5) continue;
      out += el("circle", { cx: fx, cy: fy, r: unit * 0.014, fill: g.pick(PETALS) });
    }
  }
  const base = gy - ry * 0.42;
  // Shadow.
  out += el("ellipse", { cx, cy: gy, rx: rx * 1.15, ry: ry * 0.1, fill: "#000", opacity: "0.14" });
  out += facing(cx, dir);
  // Far legs, then near legs, all tucked under the shell.
  for (const [lx, paint] of [
    [cx - rx * 0.32, farSkin],
    [cx + rx * 0.72, farSkin],
    [cx - rx * 0.62, skin],
    [cx + rx * 0.45, skin],
  ] as const)
    out += el("rect", {
      x: lx - rx * 0.12,
      y: base - ry * 0.1,
      width: rx * 0.24,
      height: gy - base + ry * 0.1,
      rx: rx * 0.1,
      fill: paint,
    });
  // Tail.
  out += el("polygon", {
    points: pts([
      [cx - rx * 0.9, base - ry * 0.12],
      [cx - rx * 1.15, base + ry * 0.04],
      [cx - rx * 0.9, base + ry * 0.06],
    ]),
    fill: skin,
  });
  // Neck and head, reaching forward and up.
  const hx = cx + rx * 1.2;
  const hy = base - ry * g.f(0.45, 0.7);
  const hr = rx * 0.25;
  out += el("path", {
    d: s`M ${cx + rx * 0.7} ${base - ry * 0.3}
         Q ${hx - hr * 1.2} ${hy - hr * 0.3} ${hx} ${hy - hr * 0.6}
         L ${hx} ${hy + hr * 0.6}
         Q ${hx - hr * 1.2} ${base} ${cx + rx * 0.7} ${base + ry * 0.12} Z`,
    fill: skin,
  });
  out += el("ellipse", { cx: hx, cy: hy, rx: hr * 1.15, ry: hr * 0.9, fill: skin });
  // Eye, smile and cheek.
  out += el("circle", { cx: hx + hr * 0.35, cy: hy - hr * 0.2, r: hr * 0.17, fill: "#1c1a16" });
  out += el("circle", { cx: hx + hr * 0.4, cy: hy - hr * 0.27, r: hr * 0.06, fill: "#fff" });
  out += el("path", {
    d: s`M ${hx + hr * 0.5} ${hy + hr * 0.3} Q ${hx + hr * 0.8} ${hy + hr * 0.45} ${hx + hr * 1.05} ${hy + hr * 0.2}`,
    stroke: "#2a2a1e",
    "stroke-width": hr * 0.08,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: hx + hr * 0.15, cy: hy + hr * 0.3, r: hr * 0.18, fill: "#ff7a8a", opacity: "0.3" });
  // Shell dome, its rim and scutes.
  out += el("path", { d: s`M ${cx - rx} ${base} A ${rx} ${ry} 0 0 1 ${cx + rx} ${base} Z`, fill: shell });
  out += el("ellipse", {
    cx,
    cy: base,
    rx: rx * 1.04,
    ry: ry * 0.11,
    fill: hsl(shellHue, 40, shellLight - 10),
  });
  const plate = (x: number, y: number, pw: number, ph: number): string =>
    el("path", {
      d: smoothClosed(
        [0, 1, 2, 3, 4, 5].map((k): Point => {
          const a = (k / 6) * Math.PI * 2;
          return [x + Math.cos(a) * pw, y + Math.sin(a) * ph];
        }),
      ),
      fill: scute,
    });
  out += plate(cx, base - ry * 0.58, rx * 0.24, ry * 0.26);
  for (const sd of [-1, 1]) out += plate(cx + sd * rx * 0.56, base - ry * 0.36, rx * 0.19, ry * 0.22);
  out += el("ellipse", {
    cx: cx - rx * 0.3,
    cy: base - ry * 0.78,
    rx: rx * 0.28,
    ry: ry * 0.1,
    fill: "#fff",
    opacity: "0.18",
    transform: s`rotate(-18 ${cx - rx * 0.3} ${base - ry * 0.78})`,
  });
  out += "</g>";
  note.alt(
    `A turtle walking on ${beach ? "a sandy beach by the sea" : "a meadow"}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(turn(cx, dir, hx), hy);
  // Head.
  note.frame(turnBox(cx, dir, hx - hr * 1.6, hr * 3.1), hy - hr * 1.5, hr * 3.1, hr * 2.8);
  return out;
});
