import { defineKind, el, facing, hsl, pts, s } from "../../draw/core";
import { flower, PETALS, sky } from "./shared";

/**
 * A bumblebee buzzing over flowers in a meadow, a dotted trail behind it.
 *
 * @category Animals
 */
export const bee = /* @__PURE__ */ defineKind("bee", "Bee", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([1, -1]);
  const gy = h * g.f(0.8, 0.86);
  const fr = unit * g.f(0.14, 0.17);
  const fx = w / 2 + dir * unit * g.f(0.12, 0.18);
  const ft = h * g.f(0.55, 0.62);
  let out = sky(g, w, h, g.f(185, 215));
  // Meadow.
  out += el("rect", { y: gy, width: w, height: h, fill: hsl(g.f(85, 115), 40, g.f(48, 56)) });
  // Flowers: a few around, then the one the bee is heading for.
  const others = g.i(1, 3);
  for (let k = 0; k < others; k++) {
    const x = w * g.f(0.05, 0.95);
    if (Math.abs(x - fx) < fr * 2) continue;
    out += flower(g, x, h + 2, gy - (gy - ft) * g.f(0.2, 0.7), fr * g.f(0.6, 0.85), g.pick(PETALS), "#f2c14e");
  }
  out += flower(g, fx, h + 2, ft, fr, g.pick(PETALS), g.pick(["#f2c14e", "#e8892e"]));
  const rx = unit * g.f(0.1, 0.12);
  const ry = rx * 0.72;
  const bx = fx - dir * unit * g.f(0.28, 0.32);
  const by = ft - unit * g.f(0.1, 0.16);
  // The dotted trail it flew along, looping behind.
  const back = bx - dir * rx * 1.2;
  const loop = unit * g.f(0.1, 0.16);
  out += el("path", {
    d: s`M ${back} ${by}
         C ${back - dir * loop} ${by - loop * 0.2} ${back - dir * loop * 1.5} ${by - loop * 1.2} ${back - dir * loop * 0.9} ${by - loop * 1.1}
         S ${back - dir * loop * 1.4} ${by + loop * 0.6} ${back - dir * loop * 2.6} ${by + loop * 0.3}`,
    stroke: "#3a3020",
    "stroke-width": Math.max(1.2, unit * 0.007),
    "stroke-dasharray": s`${unit * 0.015} ${unit * 0.02}`,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.4",
  });
  const clip = g.id("bee");
  out += el("defs", {}, el("clipPath", { id: clip }, el("ellipse", { cx: bx, cy: by, rx, ry })));
  out += facing(bx, dir);
  // Stinger and dangling legs.
  out += el("polygon", {
    points: pts([
      [bx - rx * 0.92, by - ry * 0.15],
      [bx - rx * 1.25, by + ry * 0.05],
      [bx - rx * 0.92, by + ry * 0.2],
    ]),
    fill: "#2a2320",
  });
  out += el("path", {
    d: s`M ${bx - rx * 0.3} ${by + ry * 0.8} l ${-rx * 0.1} ${ry * 0.45}
         M ${bx + rx * 0.1} ${by + ry * 0.85} l ${-rx * 0.05} ${ry * 0.45}
         M ${bx + rx * 0.45} ${by + ry * 0.75} l ${rx * 0.02} ${ry * 0.4}`,
    stroke: "#2a2320",
    "stroke-width": rx * 0.08,
    "stroke-linecap": "round",
  });
  // Back wing, body with stripes, head, front wing.
  const wingAt = (dx: number, rot: number, opacity: string): string =>
    el("ellipse", {
      cx: bx + dx,
      cy: by - ry * 1.2,
      rx: rx * 0.42,
      ry: ry * 0.85,
      fill: "#eaf6ff",
      opacity,
      transform: s`rotate(${rot} ${bx + dx} ${by - ry * 0.4})`,
    });
  out += wingAt(-rx * 0.2, -30, "0.6");
  out += el("ellipse", { cx: bx, cy: by, rx, ry, fill: g.pick(["#f7c531", "#f2b71f", "#f5cf4a"]) });
  out += el(
    "g",
    { "clip-path": `url(#${clip})`, fill: "#2a2320" },
    ...[-0.55, -0.05, 0.45].map(k =>
      el("rect", { x: bx + k * rx - rx * 0.13, y: by - ry, width: rx * 0.26, height: ry * 2 }),
    ),
  );
  const hx = bx + rx * 1.02;
  const hy = by - ry * 0.08;
  const hr = ry * 0.62;
  out += el("circle", { cx: hx, cy: hy, r: hr, fill: "#2a2320" });
  out += el("circle", { cx: hx + hr * 0.35, cy: hy - hr * 0.15, r: hr * 0.3, fill: "#fff" });
  out += el("circle", { cx: hx + hr * 0.45, cy: hy - hr * 0.15, r: hr * 0.15, fill: "#111" });
  out += el("path", {
    d: s`M ${hx} ${hy - hr * 0.9} Q ${hx + hr * 0.2} ${hy - hr * 1.8} ${hx + hr * 0.9} ${hy - hr * 1.9}
         M ${hx + hr * 0.35} ${hy - hr * 0.8} Q ${hx + hr * 0.8} ${hy - hr * 1.5} ${hx + hr * 1.4} ${hy - hr * 1.45}`,
    stroke: "#2a2320",
    "stroke-width": Math.max(1, rx * 0.06),
    "stroke-linecap": "round",
    fill: "none",
  });
  out += wingAt(rx * 0.1, -12, "0.75");
  out += "</g>";
  note.alt(`A bumblebee buzzing toward a flower in a meadow`);
  note.focus(bx, by);
  return out;
});
