import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";
import { extents, radial, starCount } from "./shared";

/**
 * A black hole: a dark shadow in a thin bright ring, its glowing disc passing in front and bent up over the top.
 *
 * @category Space
 */
export const blackHole = /* @__PURE__ */ defineKind("black-hole", "Black hole", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyHue = g.f(225, 275);
  const sky = g.id("sky");
  const heat = g.id("heat");
  const lens = g.id("lens");
  const beam = g.id("beam");
  const lit = g.id("lit");
  const aura = g.id("aura");
  const jet = g.id("jet");
  // The disc: classic hot gold, blue-white, or magenta.
  const hue = g.pick([g.f(26, 42), g.f(205, 222), g.f(300, 325)]);
  const open = g.chance(0.3) ? g.f(0.2, 0.3) : g.f(0.07, 0.16);
  const turn = g.f(-1, 1) * (w > h * 1.5 ? 10 : 24);
  const width = g.f(2.4, 3.4);
  const arch = g.f(1.5, 1.85);
  const toward = g.pick([-1, 1]);
  const jets = g.chance(0.35);
  // The shadow's radius, as large as lets the disc and the bent light above it fit.
  const [ex, ey] = extents(width, width * open, turn);
  const rs = Math.min((w * 0.45) / Math.max(ex, arch), (h * 0.42) / Math.max(ey, arch), unit * 0.24);
  const cx = w / 2;
  const cy = h / 2 + rs * 0.1;
  const D = rs * width;
  const inner = rs * 1.12;
  const edge = inner / D;
  const hot = hsl(hue + 12, 95, 95);
  const warm = hsl(hue, 95, 66);
  const deep = hsl(hue - 14, 90, 42);
  let out = el(
    "defs",
    {},
    lin(sky, [hsl(skyHue, 45, 4), hsl(skyHue + 15, 40, 10)]),
    radial(
      heat,
      [
        [edge, warm, 0.5],
        [edge + 0.06, hot, 1],
        [edge + (1 - edge) * 0.35, warm, 1],
        [edge + (1 - edge) * 0.7, deep, 0.75],
        [1, deep, 0],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(D) },
    ),
    radial(
      lens,
      [
        [1 / arch, hot, 1],
        [(1 / arch + 1) / 2, warm, 0.95],
        [1, deep, 0],
      ],
      { gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: Math.round(rs * arch) },
    ),
    // The side of the disc turning toward us shines brighter: a mask that lets light through on that side.
    el(
      "linearGradient",
      {
        id: lit,
        gradientUnits: "userSpaceOnUse",
        x1: Math.round(-D * toward),
        x2: Math.round(D * toward),
        y1: 0,
        y2: 0,
      },
      el("stop", { offset: 0.1, "stop-color": "#ffffff" }),
      el("stop", { offset: 0.75, "stop-color": "#000000" }),
    ),
    el(
      "mask",
      {
        id: beam,
        maskUnits: "userSpaceOnUse",
        x: Math.round(-D),
        y: Math.round(-D),
        width: Math.round(D * 2),
        height: Math.round(D * 2),
      },
      el("rect", {
        x: Math.round(-D),
        y: Math.round(-D),
        width: Math.round(D * 2),
        height: Math.round(D * 2),
        fill: `url(#${lit})`,
      }),
    ),
    radial(aura, [
      [0.25, warm, 0.4],
      [1, deep, 0],
    ]),
    el(
      "linearGradient",
      { id: jet, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: 0, "stop-color": hsl(215, 80, 88), "stop-opacity": 0 }),
      el("stop", { offset: 0.5, "stop-color": hsl(215, 80, 88), "stop-opacity": 0.4 }),
      el("stop", { offset: 1, "stop-color": hsl(215, 80, 88), "stop-opacity": 0 }),
    ),
  );
  out += fill(w, h, `url(#${sky})`);
  // Stars, those near the hole drawn out a little along circles around it.
  const reach = rs * 2.6;
  let dots = "";
  let arcs = "";
  for (let k = starCount(g, w, h); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    const d = Math.hypot(x - cx, y - cy);
    if (d > reach || d < rs * 1.2) {
      dots += s`M${x} ${y}h0`;
      continue;
    }
    const a = Math.atan2(y - cy, x - cx);
    const span = Math.min(0.16, 0.035 * (reach / d) ** 2);
    arcs += s`M${cx + Math.cos(a - span) * d} ${cy + Math.sin(a - span) * d}A${d} ${d} 0 0 1 ${cx + Math.cos(a + span) * d} ${cy + Math.sin(a + span) * d}`;
  }
  const star = unit * 0.007;
  out += el("path", { d: dots, stroke: "#fff", "stroke-width": star, "stroke-linecap": "round", opacity: 0.75 });
  out += el("path", {
    d: arcs,
    stroke: "#fff",
    "stroke-width": star * 0.8,
    "stroke-linecap": "round",
    fill: "none",
    opacity: 0.6,
  });

  // Everything else is drawn turned with the disc, centered on the hole.
  let hole = el("ellipse", { rx: Math.round(D * 1.2), ry: Math.round(rs * 2.6), fill: `url(#${aura})` });
  if (jets) {
    const len = rs * g.f(2.6, 3.4);
    const base = rs * 0.035;
    hole += el("path", {
      d: s`M${-base} 0L${-base * 4} ${-len}H${base * 4}L${base} 0L${base * 4} ${len}H${-base * 4}Z`,
      fill: `url(#${jet})`,
    });
  }
  // Half of the disc, squashed by the tilt: the far half (side -1) or the near half (side 1).
  const half = (side: number) => {
    const sweep = side > 0 ? 0 : 1;
    return s`M${-D} 0A${D} ${D} 0 0 ${sweep} ${D} 0H${inner}A${inner} ${inner} 0 0 ${1 - sweep} ${-inner} 0Z`;
  };
  // Swirling streaks on a half of the disc, light and dark.
  const streaks = (side: number) => {
    let light = "";
    let dark = "";
    for (let k = 0; k < 6; k++) {
      const r = inner + (D - inner) * g.f(0.08, 0.6);
      const a0 = g.f(0.05, 0.6) * Math.PI;
      const a1 = a0 + g.f(0.2, 0.4) * Math.PI;
      const arc = s`M${Math.cos(a0) * r} ${Math.sin(a0) * r * side}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${Math.cos(a1) * r} ${Math.sin(a1) * r * side}`;
      if (k % 2) dark += arc;
      else light += arc;
    }
    return (
      el("path", { d: light, fill: "none", stroke: hot, "stroke-width": rs * 0.08, opacity: 0.22 }) +
      el("path", { d: dark, fill: "none", stroke: deep, "stroke-width": rs * 0.1, opacity: 0.3 })
    );
  };
  const squash = `scale(1 ${open.toFixed(3)})`;
  // A shape in the disc's glow: dimmer, plus a brighter copy masked to the side turning toward us.
  const glowing = (d: string, paint: string, alpha = 1) =>
    el("path", { d, fill: `url(#${paint})`, opacity: 0.75 * alpha }) +
    el("path", { d, fill: `url(#${paint})`, mask: `url(#${beam})`, opacity: alpha === 1 ? undefined : alpha });
  const disc = (side: number) => el("g", { transform: squash }, glowing(half(side), heat), streaks(side));
  hole += disc(-1);
  // The far side of the disc, its light bent up over the top of the hole and, fainter, under it.
  const top = rs * arch;
  const under = rs * 1.16;
  const ring = rs * 1.03;
  hole += glowing(s`M${-top} 0A${top} ${top} 0 0 1 ${top} 0H${ring}A${ring} ${ring} 0 0 0 ${-ring} 0Z`, lens);
  hole += glowing(
    s`M${-under} 0A${under} ${under} 0 0 0 ${under} 0H${ring}A${ring} ${ring} 0 0 1 ${-ring} 0Z`,
    lens,
    0.6,
  );
  let bands = "";
  for (let k = 0; k < 3; k++) {
    const r = rs * (1.12 + ((arch - 1.12) * (k + g.f(0.2, 0.8))) / 3);
    const a = g.f(0, 0.25) * Math.PI;
    bands += s`M${-Math.cos(a) * r} ${-Math.sin(a) * r}A${r} ${r} 0 0 1 ${Math.cos(a + 0.3) * r} ${-Math.sin(a + 0.3) * r}`;
  }
  hole += el("path", { d: bands, fill: "none", stroke: deep, "stroke-width": rs * 0.05, opacity: 0.3 });
  // The shadow and its thin photon ring.
  hole += el("circle", { r: rs, fill: "#000" });
  hole += el("circle", { r: ring, fill: "none", stroke: warm, "stroke-width": rs * 0.12, opacity: 0.45 });
  hole += el("circle", { r: ring, fill: "none", stroke: hot, "stroke-width": rs * 0.035 });
  hole += disc(1);
  out += el("g", { transform: s`translate(${cx} ${cy})rotate(${turn})` }, hole);
  note.alt(
    `A black hole ringed by a glowing accretion disc${open > 0.2 ? " seen from a little above" : ""}${jets ? ", faint jets streaming from its poles" : ""}, among stars`,
  );
  note.focus(cx, cy);
  return out;
});
