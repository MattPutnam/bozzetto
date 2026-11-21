import { defineKind, el, fill, hsl, lin, s } from "../../draw/core";

/** A glowing jellyfish drifting in deep water, trailing its tentacles. */
export const jellyfish = /* @__PURE__ */ defineKind("jellyfish", "Jellyfish", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const hue = g.pick([g.f(280, 340), g.f(180, 210), g.f(10, 40)]);
  const deep = g.f(215, 250);
  const water = g.id("water");
  const glow = g.id("glow");
  let out =
    el(
      "defs",
      {},
      lin(water, [hsl(deep, 55, 30), hsl(deep + 10, 60, 12)]),
      el(
        "radialGradient",
        { id: glow },
        el("stop", { offset: 0, "stop-color": hsl(hue, 80, 75), "stop-opacity": "0.45" }),
        el("stop", { offset: 1, "stop-color": hsl(hue, 80, 75), "stop-opacity": "0" }),
      ),
    ) + fill(w, h, `url(#${water})`);
  // Specks drifting in the water.
  let specks = "";
  for (let k = g.i(10, 18); k > 0; k--)
    specks += el("circle", { cx: w * g.f(0, 1), cy: h * g.f(0, 1), r: unit * g.f(0.003, 0.008) });
  out += el("g", { fill: "#fff", opacity: "0.35" }, specks);
  const draw = (cx: number, top: number, rx: number, length: number, fade: string): string => {
    const ry = rx * 0.78;
    const rim = top + ry;
    const bell = hsl(hue, 70, 66);
    const inner = hsl(hue + 10, 80, 82);
    const ribbon = hsl(hue - 10, 65, 60);
    // Glow around the bell.
    let j = el("circle", { cx, cy: rim - ry * 0.3, r: rx * 2, fill: `url(#${glow})` });
    // Thin tentacles from the rim.
    let lines = "";
    const count = 7;
    for (let k = 0; k < count; k++) {
      const x = cx - rx * 0.85 + (k / (count - 1)) * rx * 1.7;
      const sway = rx * g.f(0.15, 0.3) * g.pick([-1, 1]);
      const len = length * g.f(0.75, 1);
      lines += s`M ${x} ${rim} C ${x + sway} ${rim + len * 0.33} ${x - sway} ${rim + len * 0.66} ${x + sway * 0.5} ${rim + len} `;
    }
    j += el("path", {
      d: lines,
      stroke: inner,
      "stroke-width": Math.max(1, rx * 0.03),
      "stroke-linecap": "round",
      fill: "none",
      opacity: "0.7",
    });
    // Frilly oral arms from the middle.
    for (const k of [-1, 0, 1]) {
      const x = cx + k * rx * 0.22;
      const len = length * g.f(0.45, 0.7);
      const sway = rx * 0.18 * (k || 1);
      j += el("path", {
        d: s`M ${x} ${rim - ry * 0.1} C ${x + sway} ${rim + len * 0.3} ${x - sway} ${rim + len * 0.65} ${x + sway * 0.6} ${rim + len}`,
        stroke: ribbon,
        "stroke-width": rx * 0.13,
        "stroke-linecap": "round",
        "stroke-dasharray": s`${rx * 0.12} ${rx * 0.04}`,
        fill: "none",
        opacity: "0.85",
      });
    }
    // The bell, with a scalloped rim.
    const scallops = 7;
    let d = s`M ${cx - rx} ${rim} C ${cx - rx} ${top - ry * 0.25} ${cx + rx} ${top - ry * 0.25} ${cx + rx} ${rim}`;
    for (let k = 1; k <= scallops; k++) {
      const x = cx + rx - (k / scallops) * rx * 2;
      d += s` Q ${x + rx / scallops} ${rim + ry * 0.16} ${x} ${rim}`;
    }
    j += el("path", { d: d + " Z", fill: bell, opacity: "0.92" });
    j += el("path", {
      d: s`M ${cx - rx * 0.6} ${rim - ry * 0.05} C ${cx - rx * 0.6} ${top + ry * 0.15} ${cx + rx * 0.6} ${top + ry * 0.15} ${cx + rx * 0.6} ${rim - ry * 0.05} Z`,
      fill: inner,
      opacity: "0.5",
    });
    j += el("ellipse", {
      cx: cx - rx * 0.45,
      cy: top + ry * 0.3,
      rx: rx * 0.2,
      ry: ry * 0.12,
      fill: "#fff",
      opacity: "0.45",
      transform: s`rotate(-30 ${cx - rx * 0.45} ${top + ry * 0.3})`,
    });
    return el("g", { opacity: fade }, j);
  };
  // Smaller ones further off.
  const far = g.i(0, 2);
  for (let k = 0; k < far; k++) {
    const rx = unit * g.f(0.06, 0.09);
    out += draw(w * g.pick([g.f(0.08, 0.25), g.f(0.75, 0.92)]), h * g.f(0.1, 0.55), rx, rx * 2.5, "0.45");
  }
  const rx = unit * g.f(0.19, 0.24);
  const top = h * g.f(0.1, 0.16);
  const cx = w * g.f(0.42, 0.58);
  const tilt = g.f(-12, 12);
  const length = h * 0.92 - top - rx * 0.78;
  out += el("g", { transform: s`rotate(${tilt} ${cx} ${top + rx * 0.6})` }, draw(cx, top, rx, length, "1"));
  note.alt(
    `A glowing jellyfish drifting in deep water${far ? `, with ${far > 1 ? "two smaller ones" : "a smaller one"} behind` : ""}`,
  );
  note.focus(cx, top + rx * 0.45);
  return out;
});
