import { defineKind, el, facing, fill, hsl, lin, mix, s } from "../../draw/core";

/** A whale at the surface, half under the water, blowing a spout. */
export const whale = /* @__PURE__ */ defineKind("whale", "Whale", (g, w, h, note) => {
  const skyHue = g.f(185, 225);
  const sky = g.id("sky");
  const sea = g.id("sea");
  const hz = h * g.f(0.5, 0.6);
  const dir = g.pick([-1, 1]);
  const body = g.pick(["#3e5a78", "#2c3e55", "#5b7a8c", "#46506b"]);
  const belly = mix(body, "#ffffff", 0.55);
  const cx = w * g.f(0.42, 0.58);
  const length = Math.min(w, h * 1.6) * g.f(0.3, 0.38);
  const height = length * g.f(0.32, 0.42);
  const wy = hz + height * 0.35;
  let out =
    el(
      "defs",
      {},
      lin(sky, [hsl(skyHue, 50, 78), hsl(skyHue - 20, 55, 94)]),
      lin(sea, [hsl(skyHue + 5, 55, 48), hsl(skyHue + 15, 60, 25)]),
    ) + fill(w, h, `url(#${sky})`);
  // Clouds
  const clouds = g.chance(0.6);
  if (clouds)
    for (let k = g.i(1, 3); k > 0; k--) {
      const x = w * g.f(0, 1);
      const y = h * g.f(0.1, 0.3);
      const radius = h * g.f(0.04, 0.07);
      out += el("path", {
        d: s`M ${x - radius * 2} ${y}
             a ${radius} ${radius} 0 0 1 ${radius * 1.3} ${-radius * 0.8}
             a ${radius * 1.1} ${radius * 1.1} 0 0 1 ${radius * 1.9} ${radius * 0.1}
             a ${radius * 0.8} ${radius * 0.8} 0 0 1 ${radius * 0.9} ${radius * 0.7}
             Z`,
        fill: "#fff",
        opacity: "0.85",
      });
    }
  out += facing(cx, dir);
  const hx = cx + length * 0.5;
  const tx = cx - length * 0.55;
  // Spout: three jets from the blowhole
  out += el("path", {
    d: s`M ${hx - length * 0.12} ${wy - height * 0.95}
         q ${-length * 0.02} ${-height * 0.6} ${-length * 0.12} ${-height * 0.85}
         M ${hx - length * 0.12} ${wy - height * 0.95}
         q 0 ${-height * 0.7} ${length * 0.03} ${-height * 1}
         M ${hx - length * 0.12} ${wy - height * 0.95}
         q ${length * 0.03} ${-height * 0.55} ${length * 0.14} ${-height * 0.78}`,
    stroke: "#fff",
    "stroke-width": height * 0.09,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.9",
  });
  // Tail flukes
  out += el("path", {
    d: s`M ${tx + length * 0.1} ${wy - height * 0.2}
         Q ${tx - length * 0.05} ${wy - height * 0.55} ${tx - length * 0.12} ${wy - height * 1.05}
         Q ${tx - length * 0.02} ${wy - height * 0.85} ${tx + length * 0.02} ${wy - height * 0.95}
         Q ${tx + length * 0.05} ${wy - height * 0.82} ${tx + length * 0.16} ${wy - height * 0.98}
         Q ${tx + length * 0.12} ${wy - height * 0.55} ${tx + length * 0.24} ${wy - height * 0.2}
         Z`,
    fill: body,
  });
  // Body
  out += el("path", {
    d: s`M ${tx + length * 0.1} ${wy}
         Q ${cx - length * 0.1} ${wy - height * 0.9} ${hx - length * 0.15} ${wy - height}
         Q ${hx + length * 0.08} ${wy - height * 0.95} ${hx} ${wy - height * 0.2}
         Q ${hx - length * 0.05} ${wy + height * 0.55} ${cx} ${wy + height * 0.5}
         Q ${tx + length * 0.2} ${wy + height * 0.4} ${tx + length * 0.1} ${wy}
         Z`,
    fill: body,
  });
  // Belly line
  out += el("path", {
    d: s`M ${hx - length * 0.02} ${wy - height * 0.25}
         Q ${cx + length * 0.1} ${wy - height * 0.1} ${cx - length * 0.1} ${wy - height * 0.12}`,
    stroke: belly,
    "stroke-width": height * 0.05,
    fill: "none",
    "stroke-linecap": "round",
    opacity: "0.7",
  });
  // Eye
  out += el("circle", { cx: hx - length * 0.14, cy: wy - height * 0.42, r: height * 0.06, fill: "#111" });
  out += "</g>";
  // Sea, over the lower half of the whale
  out += el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})`, opacity: "0.88" });
  // Ripples either side of the whale
  out += el("path", {
    d: s`M ${cx - length * 0.75} ${hz + 2}
         Q ${cx - length * 0.6} ${hz - 4} ${cx - length * 0.45} ${hz + 2}
         M ${cx + length * 0.45} ${hz + 2}
         Q ${cx + length * 0.6} ${hz - 4} ${cx + length * 0.75} ${hz + 2}`,
    stroke: "#fff",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.8",
  });
  note.alt(
    `A whale blowing a spout at the surface${clouds ? " under clouds" : ""}, facing ${dir > 0 ? "right" : "left"}`,
  );
  note.focus(cx + dir * length * 0.36, wy - height * 0.42);
  return out;
});
