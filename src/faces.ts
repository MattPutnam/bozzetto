import { defineKind, el, fill, hsl, s } from "./core";

const SKINS = [
  ["#f6d5c1", "#e2b49b"],
  ["#eec1a2", "#d69f7e"],
  ["#d9a17e", "#bd8361"],
  ["#b97b56", "#9a6141"],
  ["#8d5a3b", "#734629"],
  ["#5e3b27", "#4a2d1c"],
] as const;
const HAIR = ["#2b1d16", "#4a2f1f", "#7b4a26", "#c58a3d", "#e3c27a", "#a33b20", "#8f8f95", "#1d1d24"];
const STYLES = ["short", "long", "bun", "curly", "bald", "bob"] as const;

/** Head and shoulders. Skin, hair color and style, head shape, brows, smile and glasses vary. */
export const portrait = defineKind("portrait", "Portrait", (g, w, h) => {
  const [skin, shade] = g.pick(SKINS);
  const hair = g.pick(HAIR);
  const style = g.pick(STYLES);
  // The head: an ellipse centered at (cx, cy) with radii rx and ry.
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.15, 0.185);
  const ry = rx * g.f(1.12, 1.3);
  const cx = w / 2;
  const cy = h / 2 - ry * g.f(0.2, 0.5);
  let out = fill(w, h, hsl(g.f(0, 360), 35, 82));

  // Hair that sits behind the head.
  if (style === "long")
    out += el("path", {
      d: s`M ${cx - rx * 1.12} ${cy}
           Q ${cx - rx * 1.3} ${cy + ry * 1.6} ${cx - rx * 0.9} ${cy + ry * 1.95}
           H ${cx + rx * 0.9}
           Q ${cx + rx * 1.3} ${cy + ry * 1.6} ${cx + rx * 1.12} ${cy}
           Z`,
      fill: hair,
    });
  if (style === "bob")
    out += el("rect", {
      x: cx - rx * 1.18,
      y: cy - ry * 0.3,
      width: rx * 2.36,
      height: ry * 1.2,
      rx: rx * 0.4,
      fill: hair,
    });
  if (style === "bun")
    out += el("circle", { cx: cx + rx * g.f(-0.2, 0.2), cy: cy - ry * 1.08, r: rx * 0.42, fill: hair });

  // Neck, shoulders, ears, head.
  const shoulderW = rx * g.f(2.3, 2.9);
  const shoulderY = cy + ry * 1.55;
  // The neck.
  out += el("rect", {
    x: cx - rx * 0.32,
    y: cy + ry * 0.6,
    width: rx * 0.64,
    height: shoulderY - cy - ry * 0.45,
    fill: shade,
  });
  // The shoulders, in a shirt of random color.
  out += el("path", {
    d: s`M ${cx - shoulderW} ${h}
         C ${cx - shoulderW} ${shoulderY + ry * 0.1} ${cx - shoulderW * 0.6} ${shoulderY} ${cx} ${shoulderY}
         C ${cx + shoulderW * 0.6} ${shoulderY} ${cx + shoulderW} ${shoulderY + ry * 0.1} ${cx + shoulderW} ${h}
         Z`,
    fill: hsl(g.f(0, 360), g.f(25, 60), g.f(32, 60)),
  });
  // Ears.
  for (const side of [-1, 1])
    out += el("ellipse", { cx: cx + side * rx * 0.97, cy: cy + ry * 0.08, rx: rx * 0.16, ry: ry * 0.2, fill: skin });
  // The head.
  out += el("ellipse", { cx, cy, rx, ry, fill: skin });

  // Hair in front.
  if (style === "curly") {
    // Nine curls in an arc over the top of the head.
    for (let curl = 0; curl < 9; curl++) {
      const angle = Math.PI * (1.05 + (curl / 8) * 0.9);
      out += el("circle", {
        cx: cx + Math.cos(angle) * rx * 0.95,
        cy: cy - ry * 0.15 + Math.sin(angle) * ry * 0.9,
        r: rx * g.f(0.28, 0.36),
        fill: hair,
      });
    }
  }
  if (style !== "bald") {
    // The hairline: a dome over the head, with a parting and two swept fringes.
    const part = rx * g.f(-0.4, 0.4);
    const right = g.f(0.15, 0.5);
    const left = g.f(0.15, 0.5);
    out += el("path", {
      d: s`M ${cx - rx * 1.04} ${cy + ry * 0.1}
           C ${cx - rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.04} ${cy + ry * 0.1}
           Q ${cx + rx * 0.9} ${cy - ry * right} ${cx + part} ${cy - ry * 0.6}
           Q ${cx - rx * 0.8} ${cy - ry * left} ${cx - rx * 1.04} ${cy + ry * 0.1}
           Z`,
      fill: hair,
    });
  }

  // Features.
  const eyeY = cy + ry * 0.05;
  const eyeX = rx * 0.38;
  const eyeR = rx * g.f(0.07, 0.1);
  const browDrop = ry * g.f(0.18, 0.26);
  const arch = ry * g.f(-0.02, 0.06) + ry * 0.04;
  // Cheeks.
  for (const side of [-1, 1])
    out += el("circle", {
      cx: cx + side * rx * 0.55,
      cy: cy + ry * 0.36,
      r: rx * 0.16,
      fill: "#e8766b",
      opacity: "0.25",
    });
  // Eyes.
  for (const side of [-1, 1]) out += el("circle", { cx: cx + side * eyeX, cy: eyeY, r: eyeR, fill: "#2a2320" });
  // Brows: one arched stroke over each eye, in a single path.
  let brows = "";
  for (const side of [-1, 1])
    brows += s`M ${cx + side * eyeX - rx * 0.14} ${eyeY - browDrop}
               Q ${cx + side * eyeX} ${eyeY - browDrop - arch} ${cx + side * eyeX + rx * 0.14} ${eyeY - browDrop} `;
  out += el("path", {
    d: brows,
    stroke: style === "bald" ? shade : hair,
    "stroke-width": rx * 0.06,
    "stroke-linecap": "round",
    fill: "none",
  });
  // The nose.
  out += el("path", {
    d: s`M ${cx} ${eyeY + ry * 0.1}
         Q ${cx + rx * 0.12} ${eyeY + ry * 0.3} ${cx} ${eyeY + ry * 0.33}`,
    stroke: shade,
    "stroke-width": rx * 0.045,
    "stroke-linecap": "round",
    fill: "none",
  });
  // The smile.
  const mouthY = cy + ry * 0.55;
  const mouthW = rx * g.f(0.2, 0.36);
  out += el("path", {
    d: s`M ${cx - mouthW} ${mouthY}
         Q ${cx} ${mouthY + ry * g.f(0.04, 0.3)} ${cx + mouthW} ${mouthY}`,
    stroke: "#7a3b33",
    "stroke-width": rx * 0.06,
    "stroke-linecap": "round",
    fill: "none",
  });
  if (g.chance(0.3)) {
    // Glasses: two round lenses joined by a bridge.
    out += el(
      "g",
      { fill: "none", stroke: "#222", "stroke-width": rx * 0.05 },
      el("circle", { cx: cx - eyeX, cy: eyeY, r: rx * 0.22 }),
      el("circle", { cx: cx + eyeX, cy: eyeY, r: rx * 0.22 }),
      el("path", { d: s`M ${cx - eyeX + rx * 0.22} ${eyeY} H ${cx + eyeX - rx * 0.22}` }),
    );
  }
  return out;
});
