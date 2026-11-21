import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { boxAround, bubbles, pose, scaled, underwater } from "./shared";

const SHARKS = ["#7f8fa0", "#6d7f94", "#8c98a6", "#5d7389", "#7a8a8a"] as const;

/** A friendly shark cruising over the seabed in a side view, light rays falling from above. */
export const shark = /* @__PURE__ */ defineKind("shark", "Shark", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dir = g.pick([-1, 1]);
  const body = g.pick(SHARKS);
  const dark = mix(body, "#000000", 0.2);
  const belly = mix(body, "#ffffff", 0.75);
  let out = underwater(g, w, h);
  // Sandy seabed with a little seaweed.
  const gy = h * g.f(0.86, 0.9);
  for (let k = g.i(2, 4); k > 0; k--) {
    const x = w * g.f(0.03, 0.97);
    out += el("path", {
      d: s`M ${x} ${gy + 4}
           C ${x + g.f(-15, 15)} ${gy - h * 0.1} ${x + g.f(-15, 15)} ${gy - h * 0.18} ${x + g.f(-10, 10)} ${gy - h * g.f(0.15, 0.3)}`,
      stroke: hsl(g.f(100, 150), 40, g.f(28, 40)),
      "stroke-width": unit * g.f(0.02, 0.03),
      "stroke-linecap": "round",
      fill: "none",
    });
  }
  out += el("path", {
    d: s`M -5 ${gy} Q ${w * 0.5} ${gy - h * 0.025} ${w + 5} ${gy + h * 0.01} V ${h} H -5 Z`,
    fill: hsl(g.f(38, 48), 45, g.f(70, 78)),
  });
  const L = Math.min(w * 0.7, h * 1.6) * g.f(0.85, 1);
  const cx = w * g.f(0.46, 0.54);
  const cy = Math.min(h * g.f(0.45, 0.52), gy - L * 0.25);
  const tilt = g.f(-8, 8);
  // A little school of fish in the distance.
  const school = g.chance(0.5);
  if (school) {
    const fx = cx - dir * w * g.f(0.25, 0.35);
    const fy = h * g.f(0.15, 0.25);
    const fr = unit * 0.022;
    let fish = "";
    for (let k = 0; k < 5; k++) {
      const x = fx + dir * (k % 3) * fr * 3 + g.f(-1, 1) * fr;
      const y = fy + Math.floor(k / 2) * fr * 2.2 + g.f(-1, 1) * fr * 0.5;
      fish += el("ellipse", { cx: x, cy: y, rx: fr, ry: fr * 0.5 });
      fish += el("polygon", {
        points: pts([
          [x - dir * fr * 0.8, y],
          [x - dir * fr * 1.6, y - fr * 0.5],
          [x - dir * fr * 1.6, y + fr * 0.5],
        ]),
      });
    }
    out += el("g", { fill: hsl(g.f(30, 60), 70, 60), opacity: "0.75" }, fish);
  }
  // Its shadow on the sand.
  out += el("ellipse", { cx, cy: gy + h * 0.02, rx: L * 0.38, ry: unit * 0.025, fill: "#000", opacity: "0.1" });
  const [open, at] = pose(cx, cy, L, dir, tilt);
  const clip = g.id("shark");
  const bodyD = scaled(
    L,
    `M 0.5 0.01 C 0.49 -0.05 0.4 -0.1 0.22 -0.11 C 0.02 -0.12 -0.25 -0.06 -0.4 -0.02 L -0.4 0.02
     C -0.25 0.05 0.0 0.11 0.2 0.1 C 0.38 0.09 0.48 0.06 0.5 0.01 Z`,
  );
  out += open;
  // Tail, fins behind the body, then the body.
  out += el("path", {
    d: scaled(
      L,
      "M -0.37 -0.02 Q -0.45 -0.1 -0.56 -0.23 Q -0.54 -0.08 -0.5 0.0 Q -0.52 0.06 -0.55 0.13 Q -0.46 0.06 -0.37 0.02 Z",
    ),
    fill: body,
  });
  out += el("path", { d: scaled(L, "M 0.14 -0.1 Q 0.06 -0.2 -0.04 -0.27 Q -0.04 -0.16 -0.1 -0.09 Z"), fill: body });
  out += el("path", { d: scaled(L, "M -0.24 -0.05 L -0.3 -0.1 L -0.31 -0.03 Z"), fill: body });
  out += el("path", { d: scaled(L, "M -0.18 0.06 L -0.25 0.11 L -0.26 0.04 Z"), fill: dark });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el("path", { d: bodyD, fill: body });
  // Pale belly, clipped to the body.
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("path", { d: scaled(L, "M 0.52 0.02 C 0.3 0.05 0.0 0.04 -0.42 0.0 L -0.42 0.2 L 0.52 0.2 Z"), fill: belly }),
    el("ellipse", { cx: 0.12 * L, cy: -0.09 * L, rx: 0.25 * L, ry: 0.018 * L, fill: "#fff", opacity: "0.2" }),
  );
  // Gill slits, the near fin, eye and a slight smile.
  out += el("path", {
    d: scaled(
      L,
      "M 0.27 -0.04 Q 0.255 0.0 0.265 0.04 M 0.24 -0.045 Q 0.225 0.0 0.235 0.045 M 0.21 -0.05 Q 0.195 0.0 0.205 0.05",
    ),
    stroke: dark,
    "stroke-width": L * 0.007,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("path", { d: scaled(L, "M 0.18 0.07 Q 0.12 0.17 0.0 0.22 Q 0.06 0.12 0.06 0.08 Z"), fill: dark });
  out += el("path", {
    d: scaled(L, "M 0.46 0.045 Q 0.41 0.075 0.35 0.06"),
    stroke: mix(body, "#000000", 0.5),
    "stroke-width": L * 0.008,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: 0.37 * L, cy: -0.03 * L, r: 0.022 * L, fill: "#1a1a22" });
  out += el("circle", { cx: 0.377 * L, cy: -0.037 * L, r: 0.007 * L, fill: "#fff" });
  out += el("circle", { cx: 0.38 * L, cy: 0.03 * L, r: 0.02 * L, fill: "#ff8a8a", opacity: "0.25" });
  out += "</g>";
  const nose = at(0.52, 0.0);
  out += bubbles(g, nose[0] + dir * L * 0.03, nose[1], L * 0.05, unit * 0.012);
  note.alt(
    `A friendly shark swimming over the seabed${school ? " past a school of small fish" : ""}, light rays above`,
  );
  const eye = at(0.37, -0.03);
  note.focus(eye[0], eye[1]);
  note.frame(
    ...boxAround(
      (
        [
          [0.16, -0.13],
          [0.54, -0.13],
          [0.54, 0.12],
          [0.16, 0.12],
        ] as const
      ).map(p => at(p[0], p[1])),
    ),
  );
  return out;
});
