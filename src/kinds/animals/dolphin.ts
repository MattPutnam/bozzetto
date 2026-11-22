import { defineKind, el, hsl, lin, mix, type Point, type Rand, s } from "../../draw/core";
import { boxAround, bubbles, pose, scaled, sky, underwater } from "./shared";

/** A splash of water thrown up where something meets the surface at (x, y). */
function splash(x: number, y: number, r: number): string {
  let out = el("ellipse", { cx: x, cy: y, rx: r * 1.2, ry: r * 0.22, fill: "#fff", opacity: "0.5" });
  out += el("path", {
    d: s`M ${x - r} ${y} Q ${x - r * 0.75} ${y - r * 0.55} ${x - r * 0.35} ${y - r * 0.2}
         Q ${x - r * 0.1} ${y - r * 0.95} ${x + r * 0.15} ${y - r * 0.25}
         Q ${x + r * 0.55} ${y - r * 0.7} ${x + r} ${y} Z`,
    fill: "#fff",
    opacity: "0.85",
  });
  for (const [dx, dy] of [
    [-0.8, 0.8],
    [-0.3, 1.25],
    [0.45, 1.05],
    [0.95, 0.65],
  ])
    out += el("circle", { cx: x + dx * r, cy: y - dy * r, r: r * 0.09, fill: "#fff", opacity: "0.85" });
  return out;
}

const DOLPHINS = ["#8aa3bd", "#7b95ad", "#93a7bb", "#6f8aa6", "#8fa2b0"] as const;

/** One dolphin facing right, a unit long, around (0, 0). Clip ids come from `g`. */
function dolphinFigure(g: Rand, L: number, body: string): string {
  const clip = g.id(`dolphin${g.i(0, 1e6)}`);
  const dark = mix(body, "#000000", 0.18);
  const belly = mix(body, "#ffffff", 0.62);
  const bodyD = scaled(
    L,
    `M 0.53 0.03 C 0.5 0.01 0.45 0.0 0.4 -0.005 C 0.37 -0.02 0.37 -0.07 0.32 -0.09
     C 0.24 -0.13 0.1 -0.13 -0.05 -0.1 C -0.2 -0.07 -0.35 -0.03 -0.43 -0.01 L -0.43 0.02
     C -0.3 0.04 -0.1 0.12 0.15 0.1 C 0.3 0.09 0.42 0.06 0.53 0.03 Z`,
  );
  // Flukes, the dorsal fin and the far flipper sit behind the body.
  let out = el("path", {
    d: scaled(
      L,
      "M -0.4 0.0 Q -0.47 -0.03 -0.56 -0.11 Q -0.52 -0.02 -0.5 0.005 Q -0.52 0.04 -0.56 0.12 Q -0.47 0.05 -0.4 0.02 Z",
    ),
    fill: dark,
  });
  out += el("path", {
    d: scaled(L, "M 0.07 -0.115 C 0.04 -0.16 -0.01 -0.19 -0.1 -0.195 C -0.07 -0.16 -0.08 -0.12 -0.13 -0.095 Z"),
    fill: dark,
  });
  out += el("path", { d: scaled(L, "M 0.26 0.07 Q 0.24 0.15 0.17 0.19 Q 0.18 0.12 0.18 0.08 Z"), fill: dark });
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: bodyD })));
  out += el("path", { d: bodyD, fill: body });
  // Pale belly and throat, clipped to the body, and a sheen along the back.
  out += el(
    "g",
    { "clip-path": `url(#${clip})` },
    el("ellipse", { cx: 0.12 * L, cy: 0.13 * L, rx: 0.42 * L, ry: 0.085 * L, fill: belly }),
    el("ellipse", { cx: 0.1 * L, cy: -0.1 * L, rx: 0.28 * L, ry: 0.02 * L, fill: "#fff", opacity: "0.25" }),
  );
  // Near flipper, smiling mouth and eye.
  out += el("path", { d: scaled(L, "M 0.22 0.06 Q 0.18 0.15 0.08 0.18 Q 0.12 0.1 0.12 0.06 Z"), fill: dark });
  out += el("path", {
    d: scaled(L, "M 0.52 0.035 Q 0.46 0.05 0.39 0.03"),
    stroke: mix(body, "#000000", 0.45),
    "stroke-width": L * 0.008,
    "stroke-linecap": "round",
    fill: "none",
  });
  out += el("circle", { cx: 0.33 * L, cy: -0.02 * L, r: 0.018 * L, fill: "#1a1a22" });
  out += el("circle", { cx: 0.336 * L, cy: -0.026 * L, r: 0.006 * L, fill: "#fff" });
  return out;
}

/**
 * A dolphin leaping from the sea in an arc, or swimming underwater; sometimes two together.
 *
 * @category Animals
 */
export const dolphin = /* @__PURE__ */ defineKind(
  "dolphin",
  "Dolphin",
  { scene: ["leap", "swim"] },
  (g, w, h, note) => {
    const scene = g.option("scene", g.pick(["leap", "leap", "swim"] as const));
    const dir = g.pick([-1, 1]);
    const pair = g.chance(0.4);
    const body = g.pick(DOLPHINS);
    // The head, in figure units: what an avatar frames.
    const head: Point[] = [
      [0.2, -0.13],
      [0.56, -0.13],
      [0.56, 0.11],
      [0.2, 0.11],
    ];
    let out = "";
    let frame: [number, number, number, number];
    let eye: Point;
    if (scene === "leap") {
      const hz = h * g.f(0.5, 0.6);
      out += sky(g, w, h, g.f(185, 215));
      if (g.chance(0.4))
        out += el("circle", {
          cx: w * g.pick([g.f(0.1, 0.25), g.f(0.75, 0.9)]),
          cy: hz * g.f(0.25, 0.45),
          r: Math.min(w, h) * 0.07,
          fill: "#fff3c4",
        });
      const sea = g.id("sea");
      const seaHue = g.f(190, 210);
      out +=
        el("defs", {}, lin(sea, [hsl(seaHue, 55, 50), hsl(seaHue + 10, 60, 30)])) +
        el("rect", { y: hz, width: w, height: h - hz, fill: `url(#${sea})` });
      // Little waves across the sea.
      let waves = "";
      for (let k = g.i(4, 6); k > 0; k--) {
        const x = w * g.f(0, 1);
        const y = hz + (h - hz) * g.f(0.1, 0.95);
        const r = Math.min(w, h) * g.f(0.02, 0.035);
        waves += s`M ${x - r} ${y} Q ${x} ${y - r * 0.5} ${x + r} ${y} `;
      }
      out += el("path", {
        d: waves,
        stroke: "#fff",
        "stroke-width": "2",
        "stroke-linecap": "round",
        fill: "none",
        opacity: "0.5",
      });
      // Rising with the tail just leaving the water, or diving back in nose first.
      const phase = g.pick(["rise", "dive"] as const);
      const tilt = phase === "rise" ? g.f(-32, -18) : g.f(18, 32);
      const L0 = Math.min(w * 0.55, h * 1.25) * g.f(0.85, 1);
      const leap = (x: number, wl: number, L: number, fade: string): [Point, Point[]] => {
        // The low end (tail or beak) touches the water, in a splash.
        const end: Point = phase === "rise" ? [-0.5, 0.01] : [0.52, 0.03];
        const cy = wl - pose(x, 0, L, dir, tilt)[1](...end)[1];
        const [open, at] = pose(x, cy, L, dir, tilt);
        const low = at(...end);
        let d = splash(low[0], wl, L * 0.14);
        d += open + dolphinFigure(g, L, body) + "</g>";
        if (phase === "rise") {
          // Drops falling from the tail.
          for (let k = 1; k <= 3; k++) {
            const [x, y] = at(-0.5 + k * 0.08, 0.1 + k * 0.03);
            d += el("circle", { cx: x, cy: y, r: L * 0.011, fill: "#fff", opacity: "0.8" });
          }
        }
        out += el("g", { opacity: fade }, d);
        return [at(0.33, -0.02), head.map(p => at(p[0], p[1]))];
      };
      let cx = w * g.f(0.45, 0.55);
      if (pair) {
        cx += dir * w * 0.08;
        const L = L0 * 0.68;
        leap(cx - dir * Math.min(L0 * 0.85, w * 0.32), hz + (h - hz) * 0.15, L, "0.9");
      }
      const [e, hd] = leap(cx, hz + (h - hz) * g.f(0.3, 0.4), L0, "1");
      eye = e;
      frame = boxAround(hd);
      const what = phase === "rise" ? "leaping from" : "diving back into";
      note.alt(`${pair ? "Two dolphins" : "A dolphin"} ${what} the sea${pair ? " together" : ""}`);
    } else {
      out += underwater(g, w, h);
      const L0 = Math.min(w * 0.62, h * 1.5) * g.f(0.85, 1);
      const tilt = g.f(-10, 10);
      let cx = w * g.f(0.45, 0.55);
      let cy = h * g.f(0.5, 0.58);
      if (pair) {
        cx += dir * w * 0.06;
        const L = L0 * 0.72;
        const above = g.chance(0.5);
        const [open] = pose(cx - dir * Math.min(L0 * 0.5, w * 0.25), cy + (above ? -1 : 1) * L0 * 0.26, L, dir, tilt);
        out += el("g", { opacity: "0.75" }, open + dolphinFigure(g, L, body) + "</g>");
        if (!above) cy -= L0 * 0.06;
      }
      const [open, at] = pose(cx, cy, L0, dir, tilt);
      out += open + dolphinFigure(g, L0, body) + "</g>";
      const nose = at(0.52, 0.02);
      out += bubbles(g, nose[0] + dir * L0 * 0.04, nose[1], L0 * 0.05, Math.min(w, h) * 0.012);
      eye = at(0.33, -0.02);
      frame = boxAround(head.map(p => at(p[0], p[1])));
      note.alt(
        `${pair ? "Two dolphins swimming together" : "A dolphin swimming"} underwater, light falling from above`,
      );
    }
    note.focus(eye[0], eye[1]);
    note.frame(...frame);
    return out;
  },
);
