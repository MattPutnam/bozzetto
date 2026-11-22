import { defineKind, el, facing, fill, hsl, s } from "../../draw/core";

/**
 * A round songbird on a leafy branch, facing either way.
 *
 * @category Animals
 */
export const bird = /* @__PURE__ */ defineKind("bird", "Bird on a branch", (g, w, h, note) => {
  const hue = g.f(0, 360);
  const body = hsl(hue, g.f(45, 70), g.f(40, 58));
  const belly = hsl(hue + g.f(20, 50), g.f(50, 80), g.f(70, 82));
  const wing = hsl(hue, 45, 28);
  const branchY = h * g.f(0.68, 0.76);
  const dir = g.pick([1, -1]);
  const cx = w * g.f(0.4, 0.6);
  const size = Math.min(w, h) * g.f(0.14, 0.19);
  let out = fill(w, h, hsl(g.f(160, 220), 40, 86));
  // The branch.
  out += el("path", {
    d: s`M -10 ${branchY + h * 0.04}
         Q ${w * 0.5} ${branchY - h * 0.03} ${w + 10} ${branchY + h * g.f(-0.02, 0.06)}`,
    stroke: "#6b4a32",
    "stroke-width": h * 0.035,
    "stroke-linecap": "round",
    fill: "none",
  });
  // Leaves along the branch.
  for (let k = g.i(2, 4); k > 0; k--) {
    const leafX = w * g.f(0.05, 0.95);
    const leafY = branchY + g.f(-4, 4);
    out += el("ellipse", {
      cx: leafX,
      cy: leafY - h * 0.03,
      rx: h * 0.05,
      ry: h * 0.022,
      fill: hsl(g.f(90, 140), 40, g.f(35, 50)),
      transform: s`rotate(${g.f(-60, 60)} ${leafX} ${leafY})`,
    });
  }
  const bodyX = cx;
  const bodyY = branchY - size * 0.95;
  const headX = bodyX + size * 0.7;
  const headY = bodyY - size * 0.6;
  out += facing(cx, dir);
  // Tail.
  out += el("polygon", {
    points: s`${bodyX - size * 0.7},${bodyY + size * 0.1} ${bodyX - size * 1.8},${bodyY + size * 0.5} ${bodyX - size * 1.6},${bodyY + size * 0.85}`,
    fill: wing,
  });
  // Legs.
  out += el("path", {
    d: s`M ${bodyX - size * 0.15} ${bodyY + size * 0.75} l ${-size * 0.05} ${size * 0.3}
         M ${bodyX + size * 0.18} ${bodyY + size * 0.75} l ${size * 0.02} ${size * 0.3}`,
    stroke: "#5a3d2b",
    "stroke-width": size * 0.07,
    "stroke-linecap": "round",
  });
  // Body and belly.
  out += el("ellipse", { cx: bodyX, cy: bodyY, rx: size * 1.05, ry: size * 0.85, fill: body });
  out += el("ellipse", {
    cx: bodyX + size * 0.25,
    cy: bodyY + size * 0.25,
    rx: size * 0.62,
    ry: size * 0.5,
    fill: belly,
  });
  // Wing.
  out += el("ellipse", {
    cx: bodyX - size * 0.25,
    cy: bodyY,
    rx: size * 0.75,
    ry: size * 0.42,
    fill: wing,
    transform: s`rotate(-14 ${bodyX - size * 0.25} ${bodyY})`,
  });
  const crest = g.chance(0.35);
  if (crest)
    // A crest.
    out += el("polygon", {
      points: s`${headX - size * 0.25},${headY - size * 0.4} ${headX - size * 0.45},${headY - size * 0.95} ${headX + size * 0.1},${headY - size * 0.5}`,
      fill: body,
    });
  // Head.
  out += el("circle", { cx: headX, cy: headY, r: size * 0.55, fill: body });
  // Beak.
  out += el("polygon", {
    points: s`${headX + size * 0.48},${headY - size * 0.1} ${headX + size * g.f(0.8, 0.95)},${headY + size * 0.03} ${headX + size * 0.48},${headY + size * 0.15}`,
    fill: "#f0a23a",
  });
  // Eye and its highlight.
  out += el("circle", { cx: headX + size * 0.2, cy: headY - size * 0.08, r: size * 0.085, fill: "#111" });
  out += el("circle", { cx: headX + size * 0.23, cy: headY - size * 0.11, r: size * 0.025, fill: "#fff" });
  note.alt(`A ${crest ? "crested " : ""}songbird on a leafy branch, facing ${dir > 0 ? "right" : "left"}`);
  note.focus(cx + dir * (headX + size * 0.2 - cx), headY - size * 0.08);
  return out + "</g>";
});
