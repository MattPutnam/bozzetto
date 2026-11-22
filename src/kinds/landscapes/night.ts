import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";

/**
 * Stars, a full or crescent moon, and dark hills.
 *
 * @category Landscapes
 */
export const night = /* @__PURE__ */ defineKind(
  "night",
  "Night sky",
  { moon: ["crescent", "full"] },
  (g, w, h, note) => {
    const hue = g.f(210, 285);
    const moonX = w * g.f(0.2, 0.8);
    const moonY = h * g.f(0.18, 0.35);
    const moonR = h * g.f(0.07, 0.11);
    const crescent = g.option("moon", g.chance(0.6) ? "crescent" : "full") === "crescent";
    const dir = g.pick([-1, 1]);
    const sky = g.id("sky");
    const bite = g.id("bite");
    // For a crescent, a mask that bites a slightly smaller circle out of the moon.
    const mask = crescent
      ? el(
          "mask",
          { id: bite },
          el("rect", { width: w, height: h, fill: "#fff" }),
          el("circle", { cx: moonX + dir * moonR * 0.5, cy: moonY - moonR * 0.25, r: moonR * 0.92, fill: "#000" }),
        )
      : "";
    let out = el("defs", {}, lin(sky, [hsl(hue, 50, 9), hsl(hue + 20, 45, 30)]), mask);
    out += fill(w, h, `url(#${sky})`);
    // Stars.
    const stars = g.i(14, 28);
    for (let i = 0; i < stars; i++)
      out += el("circle", {
        cx: w * g.f(0, 1),
        cy: h * g.f(0, 0.68),
        r: g.f(0.5, 1.6),
        fill: "#fff",
        opacity: g.f(0.35, 1),
      });
    // The moon.
    out += el("circle", {
      cx: moonX,
      cy: moonY,
      r: moonR,
      fill: "hsl(50 60% 92%)",
      mask: crescent ? `url(#${bite})` : undefined,
    });
    const stargazing = stars >= 22 ? "a sky full of stars" : "a scattering of stars";
    note.alt(`A ${crescent ? "crescent" : "full"} moon and ${stargazing} over rolling hills`);
    note.focus(moonX, moonY);
    // The far hills.
    out += el("path", {
      d: s`M0 ${h * g.f(0.66, 0.76)}
         Q ${w * g.f(0.2, 0.5)} ${h * g.f(0.52, 0.66)} ${w} ${h * g.f(0.64, 0.76)}
         V ${h} H0Z`,
      fill: hsl(hue, 30, 15),
    });
    // The near hills.
    out += el("path", {
      d: s`M0 ${h * g.f(0.8, 0.9)}
         Q ${w * g.f(0.5, 0.8)} ${h * g.f(0.68, 0.8)} ${w} ${h * g.f(0.82, 0.9)}
         V ${h} H0Z`,
      fill: hsl(hue, 25, 8),
    });
    return out;
  },
);
