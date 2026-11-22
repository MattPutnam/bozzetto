import { defineKind, el, facing, hsl, mix, s } from "../../draw/core";
import { cloud, local, PAINTS, skyAt, TIRE, veil } from "./shared";

/**
 * An airliner or a small propeller plane climbing through the sky.
 *
 * @category Vehicles
 */
export const airplane = /* @__PURE__ */ defineKind(
  "airplane",
  "Airplane",
  { engine: ["jet", "propeller"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const engine = g.option("engine", g.chance(0.7) ? "jet" : "propeller");
    const time = g.pick(["day", "day", "day", "dusk", "night"] as const);
    const size = Math.min(w * 0.78, unit * 1.15) * g.f(0.82, 0.95);
    const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.06);
    const cy = h / 2 + size * 0.06 + g.f(-0.05, 0.05) * h;
    const dir = g.pick([1, -1]);
    const pitch = -g.f(3, 12);
    let out = skyAt(g, w, h, time, h);
    // Clouds, behind the plane.
    const clouds = g.i(2, 5);
    for (let k = 0; k < clouds; k++)
      out += cloud(
        w * g.f(-0.05, 1.05),
        h * g.f(0.2, 1.02),
        unit * g.f(0.1, 0.2),
        "#ffffff",
        time === "day" ? 0.9 : time === "dusk" ? 0.55 : 0.12,
      );
    const u = local(cx, cy, size);
    const paint = g.pick(["#f4f3ef", "#f4f3ef", "#e6e9ee", ...PAINTS.slice(0, 6)]);
    const accent = g.pick(["#d6453d", "#2f6fb0", "#1f3a5f", "#f08a5d", "#5bab6e", "#e0a526", "#9b7ed1"]);
    const glass = time === "night" ? hsl(45, 80, 72) : "#2f3e52";
    let plane = "";
    const lights: string[] = [];
    if (engine === "jet") {
      // A contrail streaming back off the edge.
      if (time !== "night" && g.chance(0.5))
        plane += u.path("M -0.5 -0.03 L -4 -0.03", {
          stroke: "#ffffff",
          "stroke-width": u.k(0.03),
          opacity: 0.55,
          "stroke-linecap": "round",
        });
      const body =
        "M 0.36 -0.065 Q 0.5 -0.06 0.51 0 Q 0.5 0.06 0.36 0.065 L -0.25 0.065 Q -0.4 0.06 -0.5 -0.03 L -0.5 -0.06 Q -0.48 -0.065 -0.42 -0.065 Z";
      const clip = g.id("plane");
      plane += el("defs", {}, el("clipPath", { id: clip }, u.path(body)));
      // Tail fin
      plane += u.path("M -0.3 -0.06 L -0.43 -0.27 L -0.5 -0.27 L -0.5 -0.05 Z", { fill: accent });
      plane += u.path(body, { fill: paint });
      plane += u.rect(-0.6, 0.025, 1.2, 0.05, { fill: mix(paint, "#000000", 0.12), "clip-path": `url(#${clip})` });
      plane += u.rect(-0.6, -0.04, 1.2, 0.012, { fill: accent, "clip-path": `url(#${clip})` });
      // Windows: a dashed line.
      const windows = u.path("M -0.3 -0.018 L 0.33 -0.018", {
        stroke: glass,
        "stroke-width": u.k(0.022),
        "stroke-dasharray": s`${u.k(0.012)} ${u.k(0.022)}`,
        "stroke-linecap": "round",
      });
      plane += windows;
      lights.push(windows);
      plane += u.path("M 0.42 -0.045 L 0.465 -0.036 L 0.478 -0.02 L 0.42 -0.02 Z", { fill: glass });
      plane += u.rect(0.37, -0.045, 0.025, 0.07, {
        rx: u.k(0.008),
        fill: "none",
        stroke: "#000",
        "stroke-width": u.k(0.004),
        opacity: 0.25,
      });
      // Tailplane, wing, pylon and engine.
      plane += u.path("M -0.36 -0.015 L -0.5 0.03 L -0.53 0.025 L -0.47 -0.025 Z", {
        fill: mix(paint, "#000000", 0.18),
      });
      plane += u.path("M 0.1 0.03 L -0.12 0.03 L -0.27 0.15 L -0.21 0.15 Z", { fill: mix(paint, "#000000", 0.1) });
      plane += u.rect(-0.1, 0.075, 0.17, 0.06, { rx: u.k(0.03), fill: g.pick([paint, accent, "#c9ced6"]) });
      plane += u.ellipse(0.065, 0.105, 0.012, 0.027, { fill: "#3a3d44" });
      lights.push(u.circle(-0.27, 0.15, 0.012, { fill: "#ff4d4d" }), u.circle(-0.5, -0.27, 0.01, { fill: "#ffffff" }));
    } else {
      const body =
        "M 0.38 -0.06 Q 0.46 -0.06 0.46 0 Q 0.46 0.05 0.38 0.055 L -0.15 0.04 Q -0.38 0.02 -0.5 -0.02 L -0.5 -0.04 Q -0.3 -0.05 -0.1 -0.06 L 0.1 -0.1 Q 0.2 -0.11 0.3 -0.07 Z";
      // Rounded tail fin
      plane += u.path("M -0.28 -0.045 Q -0.38 -0.22 -0.46 -0.22 Q -0.5 -0.22 -0.5 -0.15 L -0.5 -0.035 Z", {
        fill: accent,
      });
      // Landing gear, below the body.
      plane += u.path("M 0.22 0.04 L 0.26 0.15 M -0.42 0.0 L -0.43 0.05", {
        stroke: "#3a3d44",
        "stroke-width": u.k(0.014),
      });
      plane += u.circle(0.26, 0.155, 0.028, { fill: TIRE }) + u.circle(-0.43, 0.055, 0.015, { fill: TIRE });
      plane += u.path(body, { fill: paint });
      plane += u.path("M -0.5 -0.025 L 0.46 -0.005", { stroke: accent, "stroke-width": u.k(0.018) });
      // Cabin windows
      plane += u.path("M 0.21 -0.085 Q 0.29 -0.08 0.33 -0.05 L 0.21 -0.05 Z", { fill: glass });
      plane += u.rect(0.08, -0.08, 0.1, 0.035, { rx: u.k(0.01), fill: glass });
      // High wing on top, with its strut.
      plane += u.line(0.05, 0.03, 0.0, -0.1, { stroke: "#3a3d44", "stroke-width": u.k(0.012) });
      plane += u.rect(-0.08, -0.125, 0.34, 0.03, { rx: u.k(0.015), fill: mix(paint, "#000000", 0.12) });
      plane += u.path("M -0.36 -0.02 L -0.5 0.0 L -0.51 -0.015 L -0.46 -0.035 Z", {
        fill: mix(paint, "#000000", 0.18),
      });
      // Spinner and a blurred propeller
      plane += u.ellipse(0.47, 0, 0.012, 0.17, { fill: "#3a3d44", opacity: 0.25 });
      plane += u.path("M 0.46 -0.03 Q 0.52 -0.02 0.53 0 Q 0.52 0.02 0.46 0.03 Z", { fill: accent });
      lights.push(u.circle(-0.08, -0.11, 0.012, { fill: "#ff4d4d" }), u.circle(-0.5, -0.22, 0.01, { fill: "#ffffff" }));
    }
    out += facing(cx, dir) + el("g", { transform: s`rotate(${pitch} ${cx} ${cy})` }, plane) + "</g>";
    out += veil(w, h, time);
    if (time === "night")
      out += facing(cx, dir) + el("g", { transform: s`rotate(${pitch} ${cx} ${cy})` }, ...lights) + "</g>";
    const name = engine === "jet" ? "An airliner" : "A small propeller plane";
    note.alt(
      `${name} climbing through ${time === "night" ? "the night sky" : time === "dusk" ? "a sunset sky" : "the clouds"}`,
    );
    note.focus(cx, cy);
    return out;
  },
);
