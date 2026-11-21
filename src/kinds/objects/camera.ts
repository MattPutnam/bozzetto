import { defineKind, el, hsl, mix, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";

/** Concentric rings for a camera lens: barrel, rings, glass and a glint. */
function lens(cx: number, cy: number, r: number, trim: string): string {
  return (
    el("circle", { cx, cy, r, fill: trim }) +
    el("circle", { cx, cy, r: r * 0.86, fill: "#1f1f1f" }) +
    el("circle", { cx, cy, r: r * 0.7, fill: mix(trim, "#000000", 0.2) }) +
    el("circle", { cx, cy, r: r * 0.56, fill: "#1c2633" }) +
    el("circle", { cx, cy, r: r * 0.32, fill: "#2c4058" }) +
    el("ellipse", { cx: cx - r * 0.2, cy: cy - r * 0.22, rx: r * 0.14, ry: r * 0.09, fill: "#fff", opacity: "0.55" })
  );
}

/** A vintage camera on a table: a rangefinder, a twin-lens reflex or a film SLR. */
export const camera = /* @__PURE__ */ defineKind("camera", "Vintage camera", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.66, 0.74);
  const cx = w / 2 + w * g.f(-0.04, 0.04);
  const bottom = top + unit * 0.07;
  const style = g.pick(["rangefinder", "tlr", "slr"]);
  const leather = g.pick(["#2b2b2b", "#2b2b2b", "#3a2f2a", "#5b3a29", "#2f4f4f", "#7a2e2e", "#3e6d8e", "#b08a62"]);
  const trim = g.pick(["#d9dcdf", "#d9dcdf", "#cfc6b0"]);
  const trimDark = mix(trim, "#000000", 0.25);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(45, 62)));
  const bw = style === "tlr" ? unit * g.f(0.15, 0.17) : unit * g.f(0.24, 0.27);
  const bh = style === "tlr" ? unit * g.f(0.4, 0.44) : bw * g.f(1, 1.15);
  const y0 = bottom - bh;
  // Shadow
  out += el("ellipse", { cx, cy: bottom, rx: bw * 1.15, ry: unit * 0.025, fill: "#000", opacity: "0.15" });
  // A strap lying in a loop on the table behind the camera
  const strap = g.chance(0.5) && style !== "tlr";
  if (strap) {
    const lugY = y0 + bh * (style === "tlr" ? 0.2 : 0.3);
    out += el("path", {
      d: s`M ${cx - bw} ${lugY}
           C ${cx - bw * 1.5} ${lugY + bh * 0.3} ${cx - bw * 1.5} ${bottom - unit * 0.035} ${cx - bw * 0.8} ${bottom - unit * 0.045}
           M ${cx + bw} ${lugY}
           C ${cx + bw * 1.5} ${lugY + bh * 0.3} ${cx + bw * 1.5} ${bottom - unit * 0.035} ${cx + bw * 0.8} ${bottom - unit * 0.045}`,
      stroke: g.pick(["#5b3a29", "#2b2b2b", "#8a5a3b", "#a83232"]),
      "stroke-width": unit * 0.018,
      fill: "none",
      "stroke-linecap": "round",
    });
  }
  let focusY: number;
  if (style === "tlr") {
    // Folding hood on top, then the box
    out += el("rect", {
      x: cx - bw * 0.85,
      y: y0 - bh * 0.08,
      width: bw * 1.7,
      height: bh * 0.09,
      rx: bw * 0.04,
      fill: trimDark,
    });
    out += el("rect", { x: cx - bw, y: y0, width: bw * 2, height: bh, rx: bw * 0.1, fill: trim });
    out += el("rect", {
      x: cx - bw * 0.92,
      y: y0 + bh * 0.08,
      width: bw * 1.84,
      height: bh * 0.84,
      rx: bw * 0.06,
      fill: leather,
    });
    // Focus knob on the side
    out += el("rect", {
      x: cx + bw,
      y: y0 + bh * 0.45,
      width: bw * 0.12,
      height: bh * 0.18,
      rx: bw * 0.03,
      fill: trimDark,
    });
    // Name plate between the lenses, then the viewing and taking lenses
    out += el("rect", {
      x: cx - bw * 0.7,
      y: y0 + bh * 0.44,
      width: bw * 1.4,
      height: bh * 0.07,
      rx: bw * 0.03,
      fill: trim,
    });
    out += lens(cx, y0 + bh * 0.26, bw * 0.5, trim);
    out += lens(cx, y0 + bh * 0.7, bw * 0.56, trim);
    focusY = y0 + bh * 0.45;
  } else {
    if (style === "slr") {
      // The prism hump
      out += el("polygon", {
        points: pts([
          [cx - bw * 0.3, y0 + bh * 0.05],
          [cx - bw * 0.2, y0 - bh * 0.3],
          [cx + bw * 0.2, y0 - bh * 0.3],
          [cx + bw * 0.3, y0 + bh * 0.05],
        ]),
        fill: trim,
      });
      out += el("rect", {
        x: cx - bw * 0.14,
        y: y0 - bh * 0.2,
        width: bw * 0.28,
        height: bh * 0.08,
        rx: bw * 0.01,
        fill: leather,
      });
    }
    // Shutter button and rewind knob on the top plate
    out += el("rect", {
      x: cx + bw * 0.55,
      y: y0 - bh * 0.1,
      width: bw * 0.18,
      height: bh * 0.12,
      rx: bw * 0.02,
      fill: trimDark,
    });
    out += el("rect", {
      x: cx - bw * 0.78,
      y: y0 - bh * 0.08,
      width: bw * 0.22,
      height: bh * 0.1,
      rx: bw * 0.02,
      fill: trimDark,
    });
    // Body: metal plates top and bottom, leather between
    out += el("rect", { x: cx - bw, y: y0, width: bw * 2, height: bh, rx: bh * 0.12, fill: trim });
    out += el("rect", { x: cx - bw, y: y0 + bh * 0.28, width: bw * 2, height: bh * 0.6, fill: leather });
    if (style === "rangefinder") {
      // Viewfinder and rangefinder windows
      out += el("rect", {
        x: cx - bw * 0.75,
        y: y0 + bh * 0.08,
        width: bw * 0.24,
        height: bh * 0.14,
        rx: bw * 0.02,
        fill: "#2c4058",
      });
      out += el("rect", {
        x: cx + bw * 0.45,
        y: y0 + bh * 0.08,
        width: bw * 0.2,
        height: bh * 0.14,
        rx: bw * 0.02,
        fill: "#2c4058",
      });
    }
    const lx = style === "slr" ? cx : cx - bw * 0.05;
    focusY = y0 + bh * 0.56;
    out += lens(lx, focusY, bh * (style === "slr" ? 0.42 : 0.38), trim);
  }
  // A glint along the top edge
  out += el("rect", {
    x: cx - bw * 0.85,
    y: y0 + bh * 0.03,
    width: bw * 1.7,
    height: unit * 0.006,
    rx: unit * 0.003,
    fill: "#fff",
    opacity: "0.35",
  });
  const name = style === "tlr" ? "twin-lens reflex camera" : style === "slr" ? "film SLR camera" : "rangefinder camera";
  note.alt(`A vintage ${name}${strap ? " and its strap" : ""} on a table`);
  note.focus(cx, focusY);
  return out;
});
