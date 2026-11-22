import { defineKind, el, fill, hsl, lin, qpt, s } from "../../draw/core";

/**
 * Soft hills under a gradient sky and a sun, sometimes with a lone tree.
 *
 * @category Landscapes
 */
export const hills = /* @__PURE__ */ defineKind("hills", "Rolling hills", { tree: [true, false] }, (g, w, h, note) => {
  const hue = g.f(0, 360);
  const sky = g.id("sky");
  // The far hill: one curve and its smooth continuation.
  const farPeak = g.f(0.42, 0.58);
  const farMid = g.f(0.56, 0.68);
  const farEnd = g.f(0.48, 0.62);
  // The near hill: a single curve from (0, y0) through control (qx, y1) to (w, y2).
  const y0 = h * g.f(0.76, 0.86);
  const y1 = h * g.f(0.56, 0.7);
  const y2 = h * g.f(0.72, 0.84);
  const qx = w * g.f(0.3, 0.6);

  let out = el("defs", {}, lin(sky, [hsl(hue, 55, 78), "#fff"]));
  out += fill(w, h, `url(#${sky})`);
  const sunX = w * g.f(0.2, 0.8);
  const sunY = h * g.f(0.22, 0.38);
  out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.07, 0.12), fill: hsl(hue + 180, 80, 88) });
  note.alt("Rolling hills under a low sun");
  note.focus(sunX, sunY);
  out += el("path", {
    d: s`M0 ${h * farMid + h * 0.08}
         Q ${w * 0.3} ${h * farPeak} ${w * 0.6} ${h * farMid}
         T ${w} ${h * farEnd}
         V ${h} H 0Z`,
    fill: hsl(hue + 15, 35, 62),
  });
  if (g.option("tree", g.chance(0.45))) {
    // A lone tree standing on the near hill.
    const [tx, ty] = qpt([0, y0], [qx, y1], [w, y2], g.f(0.2, 0.8));
    const th = h * g.f(0.1, 0.16);
    out += el("rect", { x: tx - th * 0.05, y: ty - th, width: th * 0.1, height: th + 6, fill: hsl(hue + 20, 30, 30) });
    out += el("circle", { cx: tx, cy: ty - th, r: th * g.f(0.35, 0.5), fill: hsl(hue + 40, 38, 36) });
    note.alt("Rolling hills with a lone tree under a low sun");
    note.focus(tx, ty - th * 0.7);
  }
  out += el("path", {
    d: s`M0 ${y0}
         Q ${qx} ${y1} ${w} ${y2}
         V ${h} H 0Z`,
    fill: hsl(hue + 30, 40, 45),
  });
  return out;
});
