import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { arm, field, pine } from "./shared";

const BEARS = {
  brown: [
    { fur: "#8a5a36", muzzle: "#c49a72", pad: "#4a3020" },
    { fur: "#a26c3e", muzzle: "#d6b088", pad: "#553722" },
  ],
  black: [{ fur: "#2b2725", muzzle: "#b48a62", pad: "#4d4440" }],
  polar: [{ fur: "#f1ede2", muzzle: "#f8f6ef", pad: "#3a3634" }],
} as const;

/** A bear sitting up: brown or black in a pine wood, or a polar bear on the snow. */
export const bear = /* @__PURE__ */ defineKind(
  "bear",
  "Bear",
  { coat: ["brown", "black", "polar"] },
  (g, w, h, note) => {
    const species = g.option("coat", g.pick(["brown", "brown", "black", "polar"] as const));
    const coats: readonly { fur: string; muzzle: string; pad: string }[] = BEARS[species];
    const coat = g.pick(coats);
    const polar = species === "polar";
    const size = Math.min(w, h);
    const cx = w * g.f(0.42, 0.58);
    const hz = h * g.f(0.55, 0.65);
    const gy = h * g.f(0.85, 0.9);
    const bw = size * g.f(0.2, 0.23);
    const bh = bw * g.f(1, 1.1);
    const by = gy - bh * 0.92;
    const rx = bw * 0.62;
    const ry = rx * 0.9;
    const hy = by - bh * 0.88;
    const fx = cx + rx * g.f(-0.14, 0.14);
    const tilt = g.f(-8, 8);
    // A shade for arms and feet; on a black coat it is a little lighter instead.
    const shade = species === "black" ? mix(coat.fur, "#ffffff", 0.1) : mix(coat.fur, "#000000", polar ? 0.07 : 0.12);
    const wave = g.chance(0.25) ? g.pick([-1, 1]) : 0;
    const scene = g.fork("scene");
    let out = field(scene, w, h, hz, scene.f(190, 215), polar ? [205, 35, 95] : [scene.f(85, 115), 35, 48]);
    if (polar)
      // Ice ridges on the horizon
      for (let k = scene.i(1, 3); k > 0; k--) {
        const x = w * scene.f(-0.1, 0.9);
        const wide = w * scene.f(0.15, 0.35);
        const tall = h * scene.f(0.08, 0.2);
        out += el("polygon", {
          points: pts([
            [x, hz],
            [x + wide * scene.f(0.2, 0.4), hz - tall],
            [x + wide * scene.f(0.55, 0.8), hz - tall * scene.f(0.6, 0.95)],
            [x + wide, hz],
          ]),
          fill: hsl(205, 30, scene.f(84, 91)),
        });
      }
    else
      // Pines along the edge of the wood
      for (let k = scene.i(3, 6); k > 0; k--)
        out += pine(
          w * scene.f(0, 1),
          hz + (gy - hz) * scene.f(0, 0.12),
          size * scene.f(0.25, 0.45),
          hsl(scene.f(130, 160), 30, scene.f(26, 36)),
        );
    // Shadow
    out += el("ellipse", { cx, cy: gy, rx: bw * 1.35, ry: bw * 0.13, fill: "#000", opacity: "0.15" });
    // Body
    out += el("ellipse", { cx, cy: by, rx: bw, ry: bh, fill: coat.fur });
    // Hind feet, soles toward us
    for (const sd of [-1, 1]) {
      out += el("ellipse", { cx: cx + sd * bw * 0.62, cy: gy - bw * 0.16, rx: bw * 0.3, ry: bw * 0.21, fill: shade });
      out += el("ellipse", {
        cx: cx + sd * bw * 0.62,
        cy: gy - bw * 0.13,
        rx: bw * 0.17,
        ry: bw * 0.11,
        fill: coat.pad,
      });
    }
    // Arms: resting on the belly, or one raised in a wave
    for (const sd of [-1, 1]) {
      out +=
        sd === wave
          ? arm(
              cx + sd * bw * 0.62,
              by - bh * 0.45,
              cx + sd * bw * 1.15,
              by - bh * 0.5,
              cx + sd * bw * 1.05,
              by - bh * 1.05,
              bw * 0.32,
              shade,
            )
          : arm(
              cx + sd * bw * 0.66,
              by - bh * 0.5,
              cx + sd * bw * 0.85,
              by + bh * 0.15,
              cx + sd * bw * 0.36,
              by + bh * 0.42,
              bw * 0.32,
              shade,
            );
    }
    // Head, tilted a little, with the face turned a little
    out += s`<g transform="rotate(${tilt} ${cx} ${hy + ry})">`;
    for (const sd of [-1, 1]) {
      out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.72, r: rx * 0.3, fill: coat.fur });
      out += el("circle", { cx: cx + sd * rx * 0.72, cy: hy - ry * 0.7, r: rx * 0.15, fill: shade });
    }
    out += el("ellipse", { cx, cy: hy, rx, ry, fill: coat.fur });
    out += el("ellipse", { cx: fx, cy: hy + ry * 0.38, rx: rx * 0.42, ry: ry * 0.32, fill: coat.muzzle });
    out += el("ellipse", { cx: fx, cy: hy + ry * 0.24, rx: rx * 0.15, ry: ry * 0.1, fill: "#1f1714" });
    out += el("path", {
      d: s`M ${fx} ${hy + ry * 0.32} v ${ry * 0.14}
         M ${fx - rx * 0.12} ${hy + ry * 0.5} Q ${fx} ${hy + ry * 0.6} ${fx + rx * 0.12} ${hy + ry * 0.5}`,
      stroke: "#1f1714",
      "stroke-width": rx * 0.04,
      fill: "none",
      "stroke-linecap": "round",
    });
    for (const sd of [-1, 1]) {
      out += el("circle", { cx: fx + sd * rx * 0.36, cy: hy - ry * 0.1, r: rx * 0.08, fill: "#1a1310" });
      out += el("circle", { cx: fx + sd * rx * 0.36 + rx * 0.03, cy: hy - ry * 0.13, r: rx * 0.025, fill: "#ffffff" });
    }
    out += "</g>";
    note.alt(
      `${polar ? "A polar bear sitting on the snow" : "A bear sitting at the edge of a pine wood"}${wave ? ", waving a paw" : ""}`,
    );
    note.focus(fx, hy);
    // Head and ears.
    note.frame(cx - rx * 1.2, hy - ry * 1.25, rx * 2.4, ry * 2.4);
    return out;
  },
);
