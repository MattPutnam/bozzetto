import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";

/** Layered sand ridges under a pale sun. */
export const dunes = /* @__PURE__ */ defineKind("dunes", "Desert dunes", (g, w, h, note) => {
  const sand = g.f(16, 40);
  const skyHue = g.f(185, 220);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 55, 68), hsl(skyHue - 20, 60, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The pale sun.
  const sunX = w * g.f(0.15, 0.85);
  const sunY = h * g.f(0.18, 0.3);
  out += el("circle", { cx: sunX, cy: sunY, r: h * g.f(0.05, 0.08), fill: "hsl(48 95% 94%)" });
  const side = sunX < w * 0.4 ? " on the left" : sunX > w * 0.6 ? " on the right" : "";
  note.alt(`Three rows of desert dunes under a hazy sun${side}`);
  note.focus(sunX, sunY);
  // Three dune ridges, back to front, each a single S-curve.
  for (let ridge = 0; ridge < 3; ridge++) {
    const y0 = h * (0.5 + 0.14 * ridge + g.f(-0.04, 0.04));
    out += el("path", {
      d: s`M0 ${y0}
           C ${w * g.f(0.15, 0.4)} ${y0 - h * g.f(0.05, 0.16)}
             ${w * g.f(0.5, 0.8)} ${y0 + h * g.f(0.02, 0.12)}
             ${w} ${y0 + h * g.f(-0.1, 0.06)}
           V ${h} H 0Z`,
      fill: hsl(sand + ridge * 4, 58 - 4 * ridge, 74 - 10 * ridge),
    });
  }
  return out;
});
