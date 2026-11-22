import { defineKind, el } from "../../draw/core";
import { numberWord } from "../../draw/words";
import { at, backdrop, flatRays, flatSpiral, hexHsl, leaf, leafEl, onFace, SETTING, stem, type View } from "./shared";

/**
 * Oxeye daisies close up: many thin rays around a domed disc, sometimes a few together.
 *
 * @category Plants
 */
export const daisy = /* @__PURE__ */ defineKind("daisy", "Daisy", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "dusk"] as const);
  let out = backdrop(g, w, h, look);
  const green = hexHsl(g.f(90, 125), g.f(35, 50), g.f(32, 42));
  const R = unit * g.f(0.32, 0.4);
  const faceOn = g.chance(0.55);
  const main: View = {
    x: w / 2 + unit * g.f(-0.12, 0.12),
    y: h / 2 + unit * g.f(-0.06, 0.04),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.75, 1.1),
    roll: g.f(-0.3, 0.3),
  };
  // Smaller daisies behind, set off to either side.
  const heads: { v: View; r: number }[] = [];
  const extra = g.i(0, 2) + (w > h * 1.6 ? 1 : 0) + (w > h * 3 ? 1 : 0);
  for (let k = 0; k < extra; k++) {
    const r = R * g.f(0.45, 0.65);
    const side = k % 2 ? -1 : 1;
    const x = main.x + side * (R + r * g.f(0.2, 0.9)) * (k > 1 ? 1.9 : 1);
    if (x < r * 0.9 || x > w - r * 0.9) continue;
    heads.push({
      v: {
        x,
        y: Math.min(h - r * 0.8, Math.max(r * 1.05, main.y + unit * g.f(-0.3, 0.25))),
        tilt: g.f(0.8, 1.5),
        roll: g.f(-0.5, 0.5),
      },
      r,
    });
  }
  heads.push({ v: main, r: R });
  // One head drawn in <defs>: two rings of rays, and the domed disc of tiny florets.
  const raysId = g.id("rays");
  const discId = g.id("disc");
  const discR = g.f(22, 27);
  const count = g.i(21, 30);
  const len = 100 - discR * 0.7;
  out += el(
    "defs",
    {},
    el(
      "g",
      { id: raysId },
      el("path", { d: flatRays(g, count, discR * 0.7, len, len * 0.22, 0.85, 0), fill: "#dfe0d8" }),
      el("path", {
        d: flatRays(g, count, discR * 0.7, len * 0.96, len * 0.21, 0.85, Math.PI / count),
        fill: "#fbfbf6",
      }),
    ),
    el(
      "g",
      { id: discId },
      el("circle", { r: discR * 0.95, fill: "#f2bd1d" }),
      flatSpiral(discR * 0.85, 46, discR * 0.12, "#e09f10"),
    ),
  );
  for (const { v, r } of heads) {
    const [sx, sy] = at(v, 0, [0, -r * 0.1, 0]);
    out += stem(sx, sy, sx + unit * g.f(-0.1, 0.1), h + unit * 0.05, unit * g.f(-0.05, 0.05), r * 0.06, green);
    if (r === R && g.chance(0.6)) {
      const side = g.chance(0.5) ? -1 : 1;
      const ly = Math.min(h * 0.95, sy + r * g.f(1.0, 1.4));
      out += leafEl(leaf(sx, ly, side > 0 ? -0.6 : Math.PI + 0.6, unit * 0.13, unit * 0.025, 0.4), green, unit * 0.003);
    }
    const spin = g.f(0, Math.PI * 2);
    out += el("use", { href: `#${raysId}`, transform: onFace(v, r, spin) });
    out += el("circle", { r: discR, fill: "#c98a0c", transform: onFace(v, r, spin) });
    out += el("use", { href: `#${discId}`, transform: onFace(v, r, spin, r * 0.07) });
  }
  const others = heads.length - 1;
  note.alt(
    others
      ? `A daisy close up with ${others === 1 ? "another" : `${numberWord(others)} more`} behind ${SETTING[look]}`
      : `A daisy ${faceOn ? "facing the viewer" : "turned partly aside"} ${SETTING[look]}`,
  );
  note.focus(main.x, main.y);
  return out;
});
