import { defineKind, el, facing, hsl, mix } from "../../draw/core";
import { CHROME, local, PAINTS, shade, skyAt, timeOfDay, TIRE, veil, when } from "./shared";

/**
 * A bus at the curb of a city street: a city bus, a school bus or a double-decker.
 *
 * @category Vehicles
 */
export const bus = /* @__PURE__ */ defineKind(
  "bus",
  "Bus",
  { style: ["city", "school", "double-decker"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const style = g.option("style", g.pick(["city", "city", "school", "double-decker"] as const));
    const time = timeOfDay(g);
    const dark = shade(time);
    const tall = style === "double-decker" ? 0.6 : 0.4;
    const roadTop = h * g.f(0.74, 0.78);
    const roadY = roadTop + (h - roadTop) * 0.42;
    const size = Math.min(unit * g.f(0.85, 1), w * 0.84, (roadY - h * 0.08) / tall);
    const cx = w / 2 + g.f(-1, 1) * Math.max(0, (w - size) / 2 - w * 0.06);
    const dir = g.pick([1, -1]);
    const walkTop = roadTop - h * 0.05;
    let out = skyAt(g, w, h, time, walkTop);
    // A row of buildings, their windows a repeated tile.
    const tile = g.id("win");
    const winPaint = time === "night" ? hsl(45, 85, 70) : hsl(205, 30, 75 * dark);
    out += el(
      "defs",
      {},
      el(
        "pattern",
        { id: tile, width: unit * 0.06, height: unit * 0.075, patternUnits: "userSpaceOnUse" },
        el("rect", { x: unit * 0.015, y: unit * 0.015, width: unit * 0.03, height: unit * 0.04, fill: winPaint }),
      ),
    );
    const hue = g.f(0, 360);
    for (let x = -g.f(0, unit * 0.1); x < w;) {
      const bw = unit * g.f(0.22, 0.38);
      const bh = h * g.f(0.25, 0.5);
      out += el("rect", {
        x,
        y: walkTop - bh,
        width: bw,
        height: bh,
        fill: hsl(hue + g.f(-40, 40), g.f(15, 35), g.f(55, 75) * dark),
      });
      out += el("rect", {
        x: x + unit * 0.01,
        y: walkTop - bh + unit * 0.02,
        width: bw - unit * 0.02,
        height: bh - unit * 0.06,
        fill: `url(#${tile})`,
      });
      x += bw + g.f(0, unit * 0.03);
    }
    // Sidewalk, curb and road
    out += el("rect", { y: walkTop, width: w, height: roadTop - walkTop, fill: hsl(35, 8, 72 * dark) });
    out += el("rect", { y: roadTop, width: w, height: h - roadTop, fill: hsl(220, 8, 34 * dark) });
    out += el("rect", { y: roadTop, width: w, height: unit * 0.014, fill: hsl(35, 6, 55 * dark) });
    const u = local(cx, roadY, size);
    const paint =
      style === "school"
        ? "#f2b705"
        : style === "double-decker"
          ? g.pick(["#c8102e", "#c8102e", "#1f4e8c", "#2f6b58"])
          : g.pick(PAINTS.slice(0, 8));
    const accent = style === "school" ? "#23242a" : g.pick(["#f4efe2", "#23242a", mix(paint, "#000000", 0.3)]);
    const glass = time === "night" ? "#3a4660" : "#c4dceb";
    const lit = hsl(45, 85, 74);
    const panes: string[] = [];
    out += u.ellipse(0, 0, 0.54, 0.03, { fill: "#000", opacity: 0.2 });
    out += facing(cx, dir);
    let wheels: number[];
    let r = 0.075;
    /** A strip of windows split by thin bars of body color. */
    const strip = (x: number, y: number, sw: number, sh: number, bars: number) => {
      panes.push(`${x} ${y} ${sw} ${sh}`);
      let d = "";
      for (let k = 1; k < bars; k++) d += `M ${x + (sw * k) / bars} ${y} V ${y + sh} `;
      return d;
    };
    let bars = "";
    if (style === "school") {
      wheels = [-0.3, 0.36];
      out += u.rect(-0.5, -0.4, 0.8, 0.34, { rx: u.k(0.05), fill: paint });
      out += u.path("M 0.27 -0.22 L 0.42 -0.22 Q 0.5 -0.21 0.5 -0.15 L 0.5 -0.06 L 0.27 -0.06 Z", { fill: paint });
      out += u.rect(-0.5, -0.225, 0.8, 0.014, { fill: accent });
      out += u.rect(-0.5, -0.16, 0.99, 0.014, { fill: accent });
      out += u.rect(0.46, -0.11, 0.05, 0.04, { rx: u.k(0.01), fill: accent });
      bars += strip(-0.45, -0.34, 0.58, 0.09, 5);
      bars += strip(0.16, -0.34, 0.09, 0.26, 2);
      bars += strip(0.27, -0.35, 0.025, 0.12, 1);
    } else if (style === "double-decker") {
      wheels = [-0.28, 0.25];
      r = 0.08;
      out += u.rect(-0.5, -0.62, 1.0, 0.56, { rx: u.k(0.05), fill: paint });
      out += u.rect(-0.5, -0.38, 1.0, 0.03, { fill: accent });
      out += u.rect(0.3, -0.6, 0.17, 0.035, { rx: u.k(0.008), fill: "#23242a" });
      bars += strip(-0.46, -0.55, 0.94, 0.1, 6);
      bars += strip(-0.46, -0.31, 0.78, 0.1, 5);
      bars += strip(0.36, -0.32, 0.11, 0.25, 2);
    } else {
      wheels = [-0.3, 0.24];
      out += u.rect(-0.5, -0.42, 1.0, 0.36, { rx: u.k(0.045), fill: paint });
      out += u.rect(-0.5, -0.2, 0.84, 0.03, { fill: accent });
      out += u.rect(0.34, -0.405, 0.15, 0.035, { rx: u.k(0.008), fill: "#23242a" });
      bars += strip(-0.46, -0.35, 0.78, 0.12, 5);
      bars += strip(0.36, -0.35, 0.1, 0.28, 2);
      bars += strip(0.472, -0.36, 0.022, 0.24, 1);
    }
    const panesAt = (color: string) =>
      panes
        .map(p => {
          const [x, y, pw, ph] = p.split(" ").map(Number);
          return u.rect(x, y, pw, ph, { rx: u.k(0.012), fill: color });
        })
        .join("") + u.path(bars || "M 0 0", { stroke: paint, "stroke-width": u.k(0.018) });
    out += panesAt(glass);
    // Skirt, taillight, and the wheels in their arches.
    out += u.rect(-0.5, -0.09, style === "school" ? 0.8 : 1.0, 0.03, { fill: "#000", opacity: 0.2 });
    out += u.rect(-0.5, -0.17, 0.012, 0.045, { fill: "#c8302a" });
    for (const wx of wheels) {
      out += u.path(`M ${wx - r * 1.3} -0.06 A ${r * 1.3} ${r * 1.3} 0 0 1 ${wx + r * 1.3} -0.06 Z`, {
        fill: "#1d1e22",
      });
      out +=
        u.circle(wx, -r, r, { fill: TIRE }) +
        u.circle(wx, -r, r * 0.5, { fill: CHROME }) +
        u.circle(wx, -r, r * 0.17, { fill: "#8a9099" });
    }
    out += "</g>" + veil(w, h, time) + facing(cx, dir);
    if (time === "night") out += panesAt(lit);
    // A sign showing the route, and the headlight.
    const sign = style === "double-decker" ? [0.31, -0.592] : style === "city" ? [0.35, -0.397] : undefined;
    if (sign) out += u.rect(sign[0], sign[1], 0.13, 0.02, { fill: hsl(38, 95, 60) });
    out += u.rect(style === "school" ? 0.485 : 0.487, -0.14, 0.013, 0.03, {
      fill: hsl(50, 90, time === "day" ? 88 : 80),
    });
    out += "</g>";
    const name = style === "school" ? "A school bus" : style === "double-decker" ? "A double-decker bus" : "A city bus";
    note.alt(`${name} on a city street${when(time)}`);
    note.focus(cx, roadY - size * tall * 0.55);
    return out;
  },
);
