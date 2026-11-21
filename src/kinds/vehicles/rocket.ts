import { defineKind, el, fill, hsl, lin, mix, s } from "../../draw/core";
import { local, shade, skyAt, veil, when } from "./shared";

/** A retro rocket: lifting off its pad, or flying through space. */
export const rocket = /* @__PURE__ */ defineKind(
  "rocket",
  "Rocket",
  { scene: ["launch", "space"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const scene = g.option("scene", g.chance(0.5) ? "launch" : "space");
    const accent = g.pick(["#d6453d", "#2f6fb0", "#f08a5d", "#5bab6e", "#9b7ed1", "#e0a526"]);
    const bodyPaint = g.pick(["#f4f1ea", "#e6e9ee", "#f6e7c8"]);
    let out = "";
    let cx: number;
    let cy: number;
    let size: number;
    let angle = 0;
    const time = g.pick(["day", "dusk", "night"] as const);
    const smoke: string[] = [];
    if (scene === "launch") {
      const dark = shade(time);
      const groundY = h * g.f(0.84, 0.88);
      const lift = g.f(0.22, 0.36);
      size = Math.min((groundY - h * 0.09) / (0.97 + lift), w * 0.7);
      cx = w / 2 + g.f(-1, 1) * Math.max(0, w / 2 - size * 0.8 - w * 0.05);
      cy = groundY - size * (lift + 0.47);
      out += skyAt(g, w, h, time, groundY);
      out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(g.f(20, 40), 15, 45 * dark) });
      // The launch tower, standing on the ground to one side.
      const side = g.pick([-1, 1]);
      const tx = cx + side * size * 0.45;
      const tw = size * 0.16;
      const top = cy - size * 0.3;
      const steel = hsl(10, 55, 42 * dark);
      let lattice = s`M${tx - tw / 2} ${groundY}V${top}M${tx + tw / 2} ${groundY}V${top}`;
      const rungs = Math.max(3, Math.round((groundY - top) / tw));
      const step = (groundY - top) / rungs;
      for (let k = 0; k < rungs; k++) {
        const y0 = groundY - k * step;
        lattice += s`M${tx - tw / 2} ${y0}L${tx + tw / 2} ${y0 - step}M${tx - tw / 2} ${y0 - step}H${tx + tw / 2}`;
      }
      out += el("path", { d: lattice, stroke: steel, "stroke-width": unit * 0.012, fill: "none" });
      out += el("rect", { x: tx - tw * 0.7, y: top - unit * 0.02, width: tw * 1.4, height: unit * 0.02, fill: steel });
      // The pad
      out += el("rect", {
        x: cx - size * 0.3,
        y: groundY - unit * 0.025,
        width: size * 0.6,
        height: unit * 0.025,
        fill: hsl(220, 8, 32 * dark),
      });
      // Smoke billowing along the ground, drawn in front of the pad.
      for (let k = 0; k < 9; k++) {
        const t = (k - 4) / 4;
        const r = size * (0.07 + 0.06 * (1 - Math.abs(t))) * g.f(0.85, 1.15);
        smoke.push(
          el("circle", {
            cx: cx + t * size * 0.5,
            cy: groundY - r * 0.55,
            r,
            fill: hsl(220, 10, g.f(86, 96) * (0.6 + 0.4 * dark)),
          }),
        );
      }
    } else {
      const id = g.id("space");
      const hue = g.f(220, 290);
      out += el("defs", {}, lin(id, [hsl(hue, 45, 8), hsl(hue + 20, 40, 20)]));
      out += fill(w, h, `url(#${id})`);
      let stars = "";
      for (let k = g.i(25, 45); k > 0; k--) {
        const sx = w * g.f(0, 1);
        const sy = h * g.f(0, 1);
        const sr = g.f(0.5, 1.6);
        stars += s`M${sx - sr} ${sy}a${sr} ${sr} 0 1 0 ${sr * 2} 0a${sr} ${sr} 0 1 0 ${-sr * 2} 0`;
      }
      out += el("path", { d: stars, fill: "#ffffff", opacity: 0.85 });
      size = unit * g.f(0.55, 0.62);
      const tilt = g.pick([-1, 1]);
      angle = tilt * g.f(25, 50);
      // A planet in a lower corner, away from where the rocket points.
      const pr = unit * g.f(0.18, 0.28);
      const px = tilt > 0 ? w * g.f(0.05, 0.2) : w * g.f(0.8, 0.95);
      const py = h * g.f(0.75, 0.95);
      const planet = hsl(g.f(0, 360), 50, 62);
      if (g.chance(0.5)) {
        out += el("ellipse", {
          cx: px,
          cy: py,
          rx: pr * 1.7,
          ry: pr * 0.4,
          fill: "none",
          stroke: hsl(40, 50, 75),
          "stroke-width": pr * 0.12,
          transform: s`rotate(-15 ${px} ${py})`,
        });
      }
      out += el("circle", { cx: px, cy: py, r: pr, fill: planet });
      out += el("circle", { cx: px - pr * 0.3, cy: py - pr * 0.2, r: pr * 0.18, fill: "#000", opacity: 0.1 });
      out += el("circle", { cx: px + pr * 0.35, cy: py + pr * 0.3, r: pr * 0.12, fill: "#000", opacity: 0.1 });
      // Center the rocket and its flame on the canvas.
      const rad = (angle * Math.PI) / 180;
      cx = w / 2 + g.f(-0.05, 0.05) * w + Math.sin(rad) * size * 0.16;
      cy = h / 2 - Math.cos(rad) * size * 0.16;
    }
    const u = local(cx, cy, size);
    const flameLen = scene === "launch" ? (h * 0.86 - cy) / size - 0.42 : g.f(0.25, 0.35);
    let ship = "";
    // Flame
    ship += u.path(`M -0.09 0.46 Q -0.13 0.6 0 ${0.47 + flameLen} Q 0.13 0.6 0.09 0.46 Z`, { fill: hsl(22, 95, 58) });
    ship += u.path(`M -0.05 0.46 Q -0.07 0.56 0 ${0.47 + flameLen * 0.65} Q 0.07 0.56 0.05 0.46 Z`, {
      fill: hsl(48, 100, 75),
    });
    // Fins, behind the body's edges.
    ship += u.path("M -0.15 0.04 Q -0.3 0.15 -0.32 0.45 Q -0.24 0.37 -0.12 0.37 Z", { fill: accent });
    ship += u.path("M 0.15 0.04 Q 0.3 0.15 0.32 0.45 Q 0.24 0.37 0.12 0.37 Z", { fill: accent });
    // Nozzle
    ship += u.path("M -0.08 0.39 L 0.08 0.39 L 0.1 0.47 L -0.1 0.47 Z", { fill: "#5b6068" });
    // Body, with a colored nose.
    const body =
      "M 0 -0.5 C 0.13 -0.42 0.17 -0.22 0.16 0.05 Q 0.15 0.3 0.11 0.4 L -0.11 0.4 Q -0.15 0.3 -0.16 0.05 C -0.17 -0.22 -0.13 -0.42 0 -0.5 Z";
    const clip = g.id("rocket");
    ship += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
    ship += u.path(body, { fill: bodyPaint });
    ship += u.rect(-0.2, -0.52, 0.4, 0.22, { fill: accent, "clip-path": `url(#${clip})` });
    ship += u.rect(0.06, -0.4, 0.2, 0.8, { fill: "#000", opacity: 0.08, "clip-path": `url(#${clip})` });
    // Center fin
    ship += u.path("M -0.025 0.13 L 0.025 0.13 L 0.03 0.46 L -0.03 0.46 Z", { fill: mix(accent, "#000000", 0.2) });
    // Porthole
    ship += u.circle(0, -0.1, 0.075, { fill: mix(accent, "#000000", 0.25) });
    ship += u.circle(0, -0.1, 0.052, { fill: hsl(200, 60, 75) });
    ship += u.circle(-0.018, -0.12, 0.016, { fill: "#ffffff", opacity: 0.8 });
    if (scene === "launch") out += veil(w, h, time);
    out += angle ? el("g", { transform: s`rotate(${angle} ${cx} ${cy})` }, ship) : ship;
    out += smoke.join("");
    note.alt(
      scene === "launch"
        ? `A rocket lifting off its launch pad${when(time)}`
        : "A rocket flying through space past a planet",
    );
    note.focus(cx, cy);
    return out;
  },
);
