import { defineKind, el, hsl, s } from "../../draw/core";
import { at, backdrop, disc, fan, hexHsl, type Part, petalFrame, SETTING, stem, type View } from "./shared";

// Poppy colors: hue, saturation, lightness. Field poppies first, then garden ones.
const POPPIES: readonly (readonly [number, number, number])[] = [
  [4, 88, 50],
  [2, 85, 47],
  [8, 90, 52],
  [22, 92, 56],
  [340, 60, 72],
  [40, 30, 94],
  [12, 75, 66],
];

/**
 * A poppy close up: four crinkled papery petals around a seed pod ringed with stamens.
 *
 * @category Plants
 */
export const poppy = /* @__PURE__ */ defineKind("poppy", "Poppy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "warm"] as const);
  const [hue, sat, light] = g.pick(POPPIES.slice(0, g.chance(0.6) ? 3 : POPPIES.length));
  let out = backdrop(g, w, h, look, hue);
  const green = hexHsl(g.f(85, 110), g.f(25, 35), g.f(40, 48));
  const R = unit * g.f(0.32, 0.38);
  const faceOn = g.chance(0.5);
  const budSide = g.chance(0.5) ? -1 : 1;
  const v: View = {
    x: w / 2 - budSide * unit * g.f(0, 0.12),
    y: h / 2 + unit * g.f(-0.02, 0.06),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.8, 1.05),
    roll: g.f(-0.3, 0.3),
  };
  // A nodding bud on a hooked stem
  const bud = g.chance(0.55);
  if (bud) {
    const bx = Math.max(unit * 0.17, Math.min(w - unit * 0.17, v.x + budSide * (R + unit * g.f(0.12, 0.2))));
    const top = Math.max(unit * 0.08, v.y - R * g.f(0.6, 0.9));
    const br = unit * g.f(0.045, 0.06);
    out += el("path", {
      d: s`M${bx - budSide * unit * 0.05} ${h + unit * 0.05}Q${bx - budSide * unit * 0.06} ${(top + h) / 2} ${bx} ${top}Q${bx + budSide * br * 1.6} ${top - br * 0.4} ${bx + budSide * br * 1.4} ${top + br * 1.2}`,
      stroke: green,
      "stroke-width": unit * 0.012,
      fill: "none",
      "stroke-linecap": "round",
    });
    const cx = bx + budSide * br * 1.3;
    const cy = top + br * 2.3;
    out += el("ellipse", {
      cx,
      cy,
      rx: br,
      ry: br * 1.45,
      fill: green,
      transform: s`rotate(${-budSide * 15} ${cx} ${cy})`,
    });
    out += el("path", {
      d: s`M${cx} ${cy - br * 1.3}Q${cx + budSide * br * 0.3} ${cy} ${cx} ${cy + br * 1.4}`,
      stroke: "#000",
      "stroke-opacity": "0.15",
      "stroke-width": br * 0.12,
      fill: "none",
    });
  }
  // The flower's stem
  const [sx, sy] = at(v, 0, [0, -R * 0.05, 0]);
  out += stem(sx, sy, sx - budSide * unit * g.f(0, 0.1), h + unit * 0.05, unit * g.f(-0.06, 0.06), unit * 0.013, green);
  // Petals: the outer pair, then the inner pair across them, each with faint creases.
  const parts: (Part & { paint: string; crease?: string })[] = [];
  const blotch = g.chance(0.55) && light < 70;
  const turn = g.f(0, Math.PI);
  for (let k = 0; k < 4; k++) {
    const inner = k >= 2;
    const theta = turn + (k % 2) * Math.PI + (inner ? Math.PI / 2 : 0);
    const shape = {
      len: R * (inner ? 0.88 : 1) * g.f(0.95, 1.03),
      wid: 0,
      spread: inner ? 0.95 : 1.05,
      lift: inner ? 0.5 : 0.3,
      cup: 0.12,
      wobble: 0.07,
    };
    const part = fan(g, v, theta, shape);
    // Inner petals sit inside the outer ones: draw them later.
    part.z += inner ? R : 0;
    const local = petalFrame(shape);
    let crease = "";
    for (let c = 0; c < 4; c++) {
      const phi = g.f(-0.8, 0.8);
      const a = at(v, theta, local(shape.len * 0.3 * Math.cos(phi), shape.len * 0.3 * Math.sin(phi), 0));
      const b = at(
        v,
        theta,
        local(shape.len * 0.85 * Math.cos(phi), shape.len * 0.85 * Math.sin(phi), shape.len * 0.04),
      );
      crease += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    }
    parts.push({ ...part, paint: hsl(hue, sat, light + (inner ? -3 : 2) + g.f(-2, 2)), crease });
    if (blotch)
      parts.push({
        ...fan(g, v, theta, { ...shape, len: shape.len * 0.3, spread: 0.7, wobble: 0.05 }),
        z: part.z + 0.01,
        lean: part.lean,
        paint: "#22141a",
      });
  }
  // The middle: a ring of stamens around the seed pod and its ridged cap.
  const ring = 36;
  let filaments = "";
  let anthers = "";
  for (let k = 0; k < ring; k++) {
    const theta = (k / ring) * Math.PI * 2 + g.f(-0.05, 0.05);
    const a = at(v, theta, [R * 0.12, R * 0.04, 0]);
    const b = at(v, theta, [R * g.f(0.26, 0.34), R * 0.12, 0]);
    filaments += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    anthers += s`M${b[0]} ${b[1]}h.1`;
  }
  const [cx, cy] = at(v, 0, [0, R * 0.21, 0]);
  let rays = "";
  const rayCount = g.i(8, 11);
  for (let k = 0; k < rayCount; k++) {
    const [ax, ay] = at(v, (k / rayCount) * Math.PI * 2, [R * 0.1, R * 0.2, 0]);
    rays += s`M${cx} ${cy}L${ax} ${ay}`;
  }
  const middle =
    el("path", { d: filaments, stroke: "#2a1d24", "stroke-width": R * 0.012, fill: "none" }) +
    el("path", { d: anthers, stroke: "#1e1418", "stroke-width": R * 0.04, "stroke-linecap": "round" }) +
    disc(v, 0, R * 0.14, "#7f925a") +
    disc(v, R * 0.1, R * 0.13, "#93a66a") +
    disc(v, R * 0.2, R * 0.11, "#5f6b3e") +
    el("path", { d: rays, stroke: "#2c1f2e", "stroke-width": R * 0.022, "stroke-linecap": "round" });
  const draw = (list: typeof parts) =>
    list
      .sort((a, b) => a.z - b.z)
      .map(
        part =>
          el("path", { d: part.d, fill: part.paint }) +
          (part.crease
            ? el("path", {
                d: part.crease,
                stroke: "#000",
                "stroke-opacity": "0.13",
                "stroke-width": R * 0.012,
                fill: "none",
              })
            : ""),
      )
      .join("");
  out +=
    draw(parts.filter(part => part.lean <= unit * 0.04)) + middle + draw(parts.filter(part => part.lean > unit * 0.04));
  note.alt(
    `A poppy ${faceOn ? "open to the viewer" : "seen at an angle"}${bud ? " beside a nodding bud" : ""} ${SETTING[look]}`,
  );
  note.focus(v.x, v.y);
  return out;
});
