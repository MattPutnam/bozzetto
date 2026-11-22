import { defineKind, el, facing, fill, hsl, lin, s } from "../../draw/core";

/**
 * A fish among weeds and bubbles. Color, stripes and direction vary.
 *
 * @category Animals
 */
export const fish = /* @__PURE__ */ defineKind("fish", "Fish", (g, w, h, note) => {
  const waterHue = g.f(180, 215);
  const hue = g.f(0, 360);
  const dir = g.pick([1, -1]);
  const water = g.id("water");
  const clip = g.id("body");
  const cx = w * g.f(0.42, 0.55);
  const cy = h * g.f(0.4, 0.55);
  const length = Math.min(w, (h * 4) / 3) * g.f(0.2, 0.28);
  const height = length * g.f(0.45, 0.7);
  // The body outline: two curves meeting at nose and tail. Also clips the stripes.
  const bodyD = s`M ${cx - length} ${cy} Q ${cx - length * 0.2} ${cy - height * 1.1} ${cx + length * 0.8} ${cy} Q ${cx - length * 0.2} ${cy + height * 1.1} ${cx - length} ${cy} Z`;
  const fin = hsl(hue + 20, 70, 42);
  let out = el(
    "defs",
    {},
    lin(water, [hsl(waterHue, 55, 64), hsl(waterHue + 15, 60, 30)]),
    el("clipPath", { id: clip }, el("path", { d: bodyD })),
  );
  out += fill(w, h, `url(#${water})`);
  // Weeds rising from the bottom.
  for (let k = g.i(2, 3); k > 0; k--) {
    const x = w * g.f(0.05, 0.95);
    out += el("path", {
      d: s`M ${x} ${h + 5}
           C ${x + g.f(-25, 25)} ${h * 0.78} ${x + g.f(-25, 25)} ${h * 0.6} ${x + g.f(-15, 15)} ${h * g.f(0.38, 0.62)}`,
      stroke: hsl(g.f(100, 150), 40, g.f(25, 40)),
      "stroke-width": g.f(5, 10),
      "stroke-linecap": "round",
      fill: "none",
    });
  }
  out += facing(cx, dir);
  // Tail fin.
  out += el("polygon", {
    points: s`${cx + length * 0.7},${cy} ${cx + length * 1.15},${cy - height * 0.62} ${cx + length * 1.02},${cy} ${cx + length * 1.15},${cy + height * 0.62}`,
    fill: fin,
  });
  // Dorsal fin.
  out += el("path", {
    d: s`M ${cx - length * 0.35} ${cy - height * 0.45}
         Q ${cx - length * 0.05} ${cy - height * 1.05} ${cx + length * 0.35} ${cy - height * 0.32}
         Z`,
    fill: fin,
  });
  // Body.
  out += el("path", { d: bodyD, fill: hsl(hue, 72, 56) });
  const striped = g.chance(0.65);
  if (striped) {
    // Stripes, clipped to the body.
    const stripe = g.chance(0.5) ? "#fff" : hsl(hue + 20, 60, 28);
    const count = g.i(2, 3);
    out += el(
      "g",
      { "clip-path": `url(#${clip})`, fill: stripe, opacity: "0.85" },
      ...Array.from({ length: count }, (_, k) =>
        el("rect", {
          x: cx - length * 0.45 + k * length * 0.42,
          y: cy - height,
          width: length * 0.12,
          height: height * 2,
        }),
      ),
    );
  }
  // Eye and pupil.
  out += el("circle", { cx: cx - length * 0.62, cy: cy - height * 0.1, r: height * 0.14, fill: "#fff" });
  out += el("circle", { cx: cx - length * 0.65, cy: cy - height * 0.1, r: height * 0.07, fill: "#111" });
  out += "</g>";
  // Bubbles rising from the mouth.
  const mouthX = cx - dir * length * 1.1;
  const count = g.i(2, 4);
  for (let k = 0; k < count; k++) {
    out += el("circle", {
      cx: mouthX - dir * g.f(0, 10),
      cy: cy - height * 0.3 - k * h * 0.09,
      r: g.f(3, 7),
      fill: "none",
      stroke: "#fff",
      "stroke-width": "1.5",
      opacity: "0.7",
    });
  }
  // The body is drawn facing left, so it faces right when mirrored.
  note.alt(`A ${striped ? "striped " : ""}fish among weeds and bubbles, facing ${dir > 0 ? "left" : "right"}`);
  note.focus(cx - dir * length * 0.62, cy - height * 0.1);
  return out;
});
