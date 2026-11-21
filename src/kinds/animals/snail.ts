import { defineKind, el, facing, fill, hsl, type Point, s } from "../../draw/core";

/** A snail with a spiral shell on a leaf. */
export const snail = /* @__PURE__ */ defineKind("snail", "Snail", (g, w, h, note) => {
  const size = Math.min(w, h);
  const gy = h * g.f(0.72, 0.8);
  const dir = g.pick([-1, 1]);
  const cx = w * g.f(0.42, 0.58);
  const shellHue = g.f(10, 45);
  const body = g.pick(["#c9b49a", "#b9a58e", "#d6c3a5", "#9fb39a"]);
  const sr = size * g.f(0.17, 0.21);
  let out = fill(w, h, hsl(g.f(70, 160), 30, g.f(80, 88)));
  // The leaf and its vein
  out += el("path", {
    d: s`M -10 ${gy + h * 0.05}
         Q ${w * 0.3} ${gy - h * 0.06} ${w * 0.55} ${gy}
         T ${w + 10} ${gy - h * 0.02}
         V ${h} H -10 Z`,
    fill: hsl(g.f(90, 125), 42, 42),
  });
  out += el("path", {
    d: s`M -10 ${gy + h * 0.12}
         Q ${w * 0.5} ${gy + h * 0.02} ${w + 10} ${gy + h * 0.1}`,
    stroke: hsl(g.f(90, 125), 40, 30),
    "stroke-width": "2",
    fill: "none",
    opacity: "0.5",
  });
  out += facing(cx, dir);
  const by = gy - size * 0.02;
  const bl = sr * 2.4;
  // Body, rising into the head at the front
  out += el("path", {
    d: s`M ${cx - bl * 0.6} ${by}
         Q ${cx} ${by - sr * 0.1} ${cx + bl * 0.45} ${by - sr * 0.12}
         Q ${cx + bl * 0.58} ${by - sr * 0.25} ${cx + bl * 0.6} ${by - sr * 0.9}
         Q ${cx + bl * 0.7} ${by - sr * 1.05} ${cx + bl * 0.78} ${by - sr * 0.85}
         Q ${cx + bl * 0.8} ${by - sr * 0.2} ${cx + bl * 0.65} ${by + sr * 0.02}
         Q ${cx} ${by + sr * 0.2} ${cx - bl * 0.6} ${by}
         Z`,
    fill: body,
  });
  // Eye stalks and eyes
  const ex = cx + bl * 0.66;
  const ey = by - sr * 0.85;
  out += el("path", {
    d: s`M ${ex} ${ey} L ${ex - sr * 0.08} ${ey - sr * 0.55}
         M ${ex + sr * 0.08} ${ey} L ${ex + sr * 0.22} ${ey - sr * 0.5}`,
    stroke: body,
    "stroke-width": sr * 0.07,
    "stroke-linecap": "round",
  });
  out += el("circle", { cx: ex - sr * 0.08, cy: ey - sr * 0.58, r: sr * 0.07, fill: "#2a2320" });
  out += el("circle", { cx: ex + sr * 0.22, cy: ey - sr * 0.53, r: sr * 0.07, fill: "#2a2320" });
  // Shell with a spiral and a highlight
  const sx = cx - sr * 0.1;
  const sy = by - sr * 0.95;
  out += el("circle", { cx: sx, cy: sy, r: sr, fill: hsl(shellHue, 55, 52) });
  let angle = 0;
  let radius = sr * 0.85;
  const ring: Point[] = [];
  for (let k = 0; k < 28; k++) {
    ring.push([sx + Math.cos(angle) * radius, sy + Math.sin(angle) * radius]);
    angle += 0.42;
    radius *= 0.93;
  }
  const spiral =
    s`M ${ring[0][0]} ${ring[0][1]}` +
    ring
      .slice(1)
      .map(p => s` L ${p[0]} ${p[1]}`)
      .join("");
  out += el("path", {
    d: spiral,
    stroke: hsl(shellHue + 10, 50, 32),
    "stroke-width": sr * 0.09,
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  out += el("circle", { cx: sx - sr * 0.35, cy: sy - sr * 0.4, r: sr * 0.18, fill: "#fff", opacity: "0.25" });
  out += "</g>";
  note.alt(`A snail with a spiral shell on a leaf, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(cx + dir * (ex + sr * 0.07 - cx), ey - sr * 0.4);
  return out;
});
