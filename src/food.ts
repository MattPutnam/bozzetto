import { defineKind, el, fill, hsl, mix, pts, s, type Point } from "./core";
import { blob, sprinkles, table } from "./shapes";

const SPRINKLES = ["#f25c78", "#4fb4e6", "#f2c14e", "#7bd389", "#ffffff", "#9b6bd6"];

/** A glazed donut from above, with sprinkles on some. */
export const donut = defineKind("donut", "Donut", (g, w, h) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.05, 0.05);
  const cy = h / 2 + h * g.f(-0.04, 0.04);
  const radius = unit * g.f(0.32, 0.38);
  const hole = radius * g.f(0.28, 0.34);
  const bg = hsl(g.f(0, 360), g.f(30, 55), g.f(82, 90));
  const glaze = g.pick(["#f49ac1", "#6b3e2e", "#fbf4e8", "#8fd3f4", "#f6d365", "#c9a7eb"]);
  let out = fill(w, h, bg);
  if (g.chance(0.5)) {
    // Plate, with a faint dip in the middle
    out += el("circle", { cx, cy: cy + unit * 0.015, r: radius * 1.28, fill: "#fff", opacity: "0.85" });
    out += el("circle", { cx, cy: cy + unit * 0.015, r: radius * 1.08, fill: "#000", opacity: "0.04" });
  }
  // Shadow
  out += el("circle", { cx, cy: cy + radius * 0.04, r: radius, fill: "#000", opacity: "0.08" });
  // Dough
  out += el("circle", { cx, cy, r: radius, fill: "#d99a5b" });
  // Glaze
  out += el("path", { d: blob(g, cx, cy, radius * 0.86, radius * 0.86, g.i(7, 11), 0.07, 0.05), fill: glaze });
  // Bare dough around the hole, then the hole itself
  out += el("circle", { cx, cy, r: hole * 1.35, fill: "#d99a5b" });
  out += el("circle", { cx, cy, r: hole, fill: bg });
  if (g.chance(0.7))
    out += sprinkles(
      g,
      cx,
      cy,
      hole * 1.5,
      radius * 0.78,
      g.i(22, 40),
      radius * 0.09,
      glaze === "#fbf4e8" ? SPRINKLES.slice(0, 4) : SPRINKLES,
      radius * 0.035,
    );
  // Highlight
  out += el("path", {
    d: s`M ${cx - radius * 0.55} ${cy - radius * 0.45}
         Q ${cx - radius * 0.2} ${cy - radius * 0.72} ${cx + radius * 0.15} ${cy - radius * 0.68}`,
    stroke: "#fff",
    "stroke-width": radius * 0.05,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.4",
  });
  return out;
});

/** A whole pizza from above, cut into slices, with toppings. */
export const pizza = defineKind("pizza", "Pizza", (g, w, h) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const radius = unit * g.f(0.38, 0.43);
  const slices = g.pick([6, 8]);
  let out = fill(w, h, g.pick(["#e9dccb", "#d9e4dc", "#e7d5d0", "#2f3a3a"]));
  // Board, crust, sauce and cheese
  out += el("circle", { cx, cy, r: radius * 1.08, fill: "#b98a5a" });
  out += el("circle", { cx, cy, r: radius, fill: "#e3a857" });
  out += el("circle", { cx, cy, r: radius * 0.86, fill: "#c7442e" });
  out += el("path", { d: blob(g, cx, cy, radius * 0.8, radius * 0.8, g.i(5, 8), 0.06, 0.08), fill: "#f6d27a" });
  const kind = g.pick(["pepperoni", "veg", "margherita"]);
  // Toppings sit on two jittered rings (and sometimes the center), so they cover the pie evenly.
  const spots: Point[] = [];
  if (g.chance(0.7)) spots.push([cx + radius * g.f(-0.04, 0.04), cy + radius * g.f(-0.04, 0.04)]);
  for (const [ringR, count] of [
    [0.34, g.i(5, 6)],
    [0.63, g.i(9, 11)],
  ] as const) {
    const a0 = g.f(0, Math.PI * 2);
    const step = (Math.PI * 2) / count;
    for (let k = 0; k < count; k++) {
      const angle = a0 + k * step + g.f(-0.18, 0.18) * step;
      const dist = radius * (ringR + g.f(-0.04, 0.04));
      spots.push([cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist]);
    }
  }
  for (const [x, y] of spots) {
    if (kind === "pepperoni") {
      // Pepperoni
      out += el("circle", { cx: x, cy: y, r: radius * g.f(0.085, 0.105), fill: "#a8322a" });
    } else if (kind === "margherita") {
      // Mozzarella or basil
      out += g.chance(0.55)
        ? el("ellipse", {
            cx: x,
            cy: y,
            rx: radius * g.f(0.08, 0.11),
            ry: radius * g.f(0.065, 0.085),
            fill: "#fbf7ec",
            transform: s`rotate(${g.f(0, 180)} ${x} ${y})`,
          })
        : el("ellipse", {
            cx: x,
            cy: y,
            rx: radius * 0.075,
            ry: radius * 0.04,
            fill: "#3f8a3a",
            transform: s`rotate(${g.f(0, 180)} ${x} ${y})`,
          });
    } else {
      // Olive ring or pepper strip
      out += g.chance(0.5)
        ? el("circle", {
            cx: x,
            cy: y,
            r: radius * 0.05,
            fill: "none",
            stroke: "#2b2b2b",
            "stroke-width": radius * 0.03,
          })
        : el("rect", {
            x: x - radius * 0.065,
            y: y - radius * 0.025,
            width: radius * 0.13,
            height: radius * 0.05,
            rx: radius * 0.02,
            fill: g.pick(["#4caf50", "#d64545", "#f2c14e"]),
            transform: s`rotate(${g.f(0, 180)} ${x} ${y})`,
          });
    }
  }
  // Slice cuts
  let cuts = "";
  const off = g.f(0, Math.PI);
  for (let k = 0; k < slices / 2; k++) {
    const angle = off + (k * Math.PI * 2) / slices;
    cuts += s`M ${cx - Math.cos(angle) * radius} ${cy - Math.sin(angle) * radius} L ${cx + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius} `;
  }
  out += el("path", { d: cuts.trim(), stroke: "#8a5a2b", "stroke-width": radius * 0.018, opacity: "0.55" });
  return out;
});

const SCOOPS = ["#f7c6d0", "#7b4a35", "#fff4dd", "#b8e0b0", "#f6d365", "#c9a7eb", "#f28b66"];

/** One to three scoops on a waffle cone, maybe with a cherry. */
export const iceCream = defineKind("ice-cream", "Ice cream", (g, w, h) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.04, 0.04);
  const scoops = g.i(1, 3);
  const scale = g.f(1.05, 1.2);
  const clip = g.id("cone");
  // Size the cone so the whole stack fits: cone 3 units tall, each scoop adds about 1.2 scoop radii.
  const units = 3 + scale * (1.85 + 1.25 * (scoops - 1));
  const coneW = Math.min(unit * 0.18, (h * 0.84) / units);
  const tipY = h * 0.93;
  const topY = tipY - coneW * 3;
  const scoopR = coneW * scale;
  const cone = pts([
    [cx - coneW, topY],
    [cx + coneW, topY],
    [cx, tipY],
  ]);
  let out = el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: cone })));
  out += fill(w, h, hsl(g.f(0, 360), g.f(40, 60), g.f(84, 90)));
  // Cone
  out += el("polygon", { points: cone, fill: "#e2a65c" });
  // Waffle hatch, clipped to the cone
  let hatch = "";
  for (let k = -6; k <= 6; k++) {
    const x = cx + k * coneW * 0.32;
    hatch += s`M ${x - coneW} ${topY - coneW * 0.2} L ${x + coneW} ${tipY} M ${x + coneW} ${topY - coneW * 0.2} L ${x - coneW} ${tipY} `;
  }
  out += el("path", {
    d: hatch.trim(),
    stroke: "#b97b36",
    "stroke-width": coneW * 0.05,
    "clip-path": `url(#${clip})`,
  });
  // Scoops, stacked upward
  let y = topY;
  for (let k = 0; k < scoops; k++) {
    const r = scoopR * (1 - k * 0.08);
    const color = g.pick(SCOOPS);
    const sy = y - r * (k === 0 ? 0.8 : 0.75);
    out += el("circle", { cx: cx + g.f(-0.08, 0.08) * r, cy: sy, r, fill: color });
    if (k === 0) {
      // A scalloped skirt where the first scoop melts over the rim of the cone.
      let skirt = s`M ${cx - r * 1.05} ${y - r * 0.25}`;
      const bumps = g.i(4, 6);
      for (let b = 0; b < bumps; b++) {
        const x0 = cx - r * 1.05 + ((b + 1) * r * 2.1) / bumps;
        const dy = r * g.f(0.25, 0.55);
        skirt += s` Q ${x0 - (r * 1.05) / bumps} ${y + dy} ${x0} ${y}`;
      }
      out += el("path", {
        d: skirt + s` L ${cx + r * 1.05} ${y - r * 0.25} Z`,
        fill: color,
      });
    }
    y = sy - r * 0.5;
  }
  if (g.chance(0.5)) {
    // Cherry and its stem
    out += el("path", {
      d: s`M ${cx} ${y + scoopR * 0.1}
           q ${scoopR * 0.1} ${-scoopR * 0.45} ${scoopR * 0.35} ${-scoopR * 0.55}`,
      stroke: "#4b7a2a",
      "stroke-width": scoopR * 0.06,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += el("circle", { cx, cy: y + scoopR * 0.12, r: scoopR * 0.2, fill: "#d62839" });
  }
  return out;
});

/** Nigiri and maki on a dark plate, with chopsticks. */
export const sushi = defineKind("sushi", "Sushi", (g, w, h) => {
  const unit = Math.min(w, h);
  const bg = g.pick(["#d9cbb5", "#c9d6d0", "#e6ddd0", "#3a3f3a"]);
  let out = fill(w, h, bg);
  const plateW = w * 0.82;
  const plateH = h * 0.5;
  const plateX = (w - plateW) / 2;
  const plateY = h * 0.3;
  // Plate and its shadow
  out += el("rect", {
    x: plateX + 4,
    y: plateY + 6,
    width: plateW,
    height: plateH,
    rx: plateH * 0.12,
    fill: "#000",
    opacity: "0.12",
  });
  out += el("rect", {
    x: plateX,
    y: plateY,
    width: plateW,
    height: plateH,
    rx: plateH * 0.12,
    fill: g.pick(["#1f2328", "#5a2e2a", "#f2efe8"]),
  });
  const count = g.i(3, 4);
  const slot = plateW / count;
  for (let k = 0; k < count; k++) {
    const x = plateX + slot * (k + 0.5);
    const y = plateY + plateH * 0.55;
    const kind = g.pick(["salmon", "tuna", "egg", "maki", "maki"]);
    if (kind === "maki") {
      // Maki: nori, rice, filling
      const r = Math.min(slot, plateH) * 0.34;
      out += el("circle", { cx: x, cy: y, r, fill: "#1e2b22" });
      out += el("circle", { cx: x, cy: y, r: r * 0.82, fill: "#fbfaf4" });
      out += el("circle", { cx: x, cy: y, r: r * 0.35, fill: g.pick(["#f28b66", "#d94a4a", "#7bc96f", "#f6d365"]) });
    } else {
      const riceW = slot * 0.4;
      const riceH = plateH * 0.2;
      const fish = { salmon: "#f4895f", tuna: "#c8334a", egg: "#f6cd4c" }[kind]!;
      // Rice
      out += el("rect", {
        x: x - riceW,
        y: y - riceH * 0.2,
        width: riceW * 2,
        height: riceH * 1.4,
        rx: riceH * 0.6,
        fill: "#fbfaf4",
      });
      // Topping
      out += el("path", {
        d: s`M ${x - riceW * 1.12} ${y}
             Q ${x - riceW * 1.1} ${y - riceH * 1.2} ${x} ${y - riceH * 1.1}
             Q ${x + riceW * 1.15} ${y - riceH * 1.1} ${x + riceW * 1.12} ${y + riceH * 0.05}
             Z`,
        fill: fish,
      });
      if (kind === "salmon")
        // Salmon stripes
        out += el("path", {
          d: s`M ${x - riceW * 0.6} ${y - riceH * 0.95} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.85}
               M ${x} ${y - riceH * 1.05} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.95}
               M ${x + riceW * 0.6} ${y - riceH * 0.95} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.9}`,
          stroke: "#ffd2bd",
          "stroke-width": riceH * 0.12,
          fill: "none",
          "stroke-linecap": "round",
        });
      if (kind === "egg")
        // Nori band
        out += el("rect", {
          x: x - riceW * 0.25,
          y: y - riceH * 1.15,
          width: riceW * 0.5,
          height: riceH * 2.4,
          fill: "#1e2b22",
        });
    }
  }
  // Chopsticks
  const stickY = plateY + plateH + h * 0.08;
  out += el("path", {
    d: s`M ${w * 0.1} ${stickY} L ${w * 0.88} ${stickY - h * 0.05}
         M ${w * 0.1} ${stickY + unit * 0.045} L ${w * 0.88} ${stickY - h * 0.02}`,
    stroke: g.pick(["#8b5a3c", "#c23b22", "#2b2b2b"]),
    "stroke-width": unit * 0.022,
    "stroke-linecap": "round",
  });
  return out;
});

const SPONGE = ["#f3d9a4", "#7b4a35", "#f7e7c6", "#e9b872"];
const CREAM = ["#fbf4e8", "#f7c6d0", "#f6d365", "#6b3e2e"];

/** A layered slice of cake on a plate, with a berry on top. */
export const cake = defineKind("cake", "Slice of cake", (g, w, h) => {
  const unit = Math.min(w, h);
  const sponge = g.pick(SPONGE);
  const cream = g.pick(CREAM.filter(c => c !== sponge));
  const frost = g.chance(0.5) ? cream : g.pick(CREAM);
  let out = table(g, w, h, h * 0.72, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  // The plate is sized to the slice's footprint, and the slice sits centered on it:
  // the front edge in the near half of the plate, the back corner in the far half.
  const cx = w / 2;
  const plateY = h * 0.8;
  const frontW = unit * g.f(0.3, 0.38);
  const dx = frontW * g.f(0.45, 0.6);
  const frontH = unit * g.f(0.28, 0.34);
  const plateRx = Math.max(unit * 0.46, (frontW + dx) * 0.72);
  const plateRy = plateRx * 0.22;
  const dy = plateRy * g.f(0.65, 0.85);
  const x0 = cx - (frontW + dx) / 2;
  const bottomY = plateY + plateRy * 0.4;
  const topY = bottomY - frontH;
  // Plate: shadow, rim, and well
  out += el("ellipse", { cx, cy: plateY + plateRy * 0.12, rx: plateRx, ry: plateRy, fill: "#000", opacity: "0.08" });
  out += el("ellipse", { cx, cy: plateY, rx: plateRx, ry: plateRy, fill: "#fff" });
  out += el("ellipse", { cx, cy: plateY, rx: plateRx * 0.75, ry: plateRy * 0.72, fill: "#000", opacity: "0.05" });
  // Shaded side of the slice
  out += el("polygon", {
    points: pts([
      [x0 + frontW, bottomY],
      [x0 + frontW + dx, bottomY - dy],
      [x0 + frontW + dx, topY - dy],
      [x0 + frontW, topY],
    ]),
    fill: mix(sponge, "#000000", 0.18),
  });
  // Layers of sponge and cream on the front face
  const layers = g.i(2, 3) * 2 + 1;
  for (let k = 0; k < layers; k++) {
    const y0 = topY + (frontH * k) / layers;
    const isCream = k % 2 === 1;
    out += el("rect", { x: x0, y: y0, width: frontW, height: frontH / layers + 0.5, fill: isCream ? cream : sponge });
  }
  // Frosting on top, and its front edge
  out += el("polygon", {
    points: pts([
      [x0, topY],
      [x0 + frontW, topY],
      [x0 + frontW + dx, topY - dy],
      [x0 + dx * 0.15, topY - dy * 0.12],
    ]),
    fill: frost,
  });
  out += el("rect", { x: x0, y: topY, width: frontW, height: frontH * 0.06, fill: frost });
  const tx = x0 + frontW * 0.55 + dx * 0.4;
  const ty = topY - dy * 0.45;
  if (g.chance(0.5)) {
    // Strawberry and its leaves
    out += el("path", {
      d: s`M ${tx} ${ty - unit * 0.08}
           C ${tx - unit * 0.07} ${ty - unit * 0.07} ${tx - unit * 0.06} ${ty + unit * 0.01} ${tx} ${ty + unit * 0.01}
           C ${tx + unit * 0.06} ${ty + unit * 0.01} ${tx + unit * 0.07} ${ty - unit * 0.07} ${tx} ${ty - unit * 0.08}
           Z`,
      fill: "#e0384f",
    });
    out += el("path", {
      d: s`M ${tx - unit * 0.03} ${ty - unit * 0.085}
           L ${tx} ${ty - unit * 0.06}
           L ${tx + unit * 0.03} ${ty - unit * 0.085}`,
      stroke: "#4b8a2a",
      "stroke-width": unit * 0.018,
      fill: "none",
      "stroke-linecap": "round",
    });
  } else {
    // A dollop of cream with a cherry
    out += el("circle", {
      cx: tx,
      cy: ty - unit * 0.03,
      r: unit * 0.045,
      fill: frost === "#fbf4e8" ? "#f7c6d0" : "#fbf4e8",
    });
    out += el("circle", { cx: tx, cy: ty - unit * 0.09, r: unit * 0.035, fill: "#c1121f" });
  }
  return out;
});

/** A fried egg in a pan or on a plate, sometimes with bacon. */
export const egg = defineKind("egg", "Fried egg", (g, w, h) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const pan = g.chance(0.5);
  const radius = unit * 0.42;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 50), g.f(80, 88)));
  if (pan) {
    // Pan: handle, rim, and base
    out += el("rect", {
      x: cx + radius * 0.8,
      y: cy - radius * 0.1,
      width: w,
      height: radius * 0.2,
      rx: radius * 0.1,
      fill: "#2b2b2b",
      transform: s`rotate(${g.f(-30, 30)} ${cx} ${cy})`,
    });
    out += el("circle", { cx, cy, r: radius, fill: "#3a3a3a" });
    out += el("circle", { cx, cy, r: radius * 0.88, fill: "#2b2b2b" });
  } else {
    // Plate
    out += el("circle", { cx, cy, r: radius, fill: "#fff" });
    out += el("circle", { cx, cy, r: radius * 0.78, fill: "#000", opacity: "0.04" });
  }
  if (g.chance(0.45))
    for (let k = 0; k < 2; k++) {
      // A rasher of bacon: a wavy stroke with a paler streak of fat along it
      const by = cy + radius * (0.25 + k * 0.22);
      const bx = cx - radius * 0.5;
      const wave = s`M ${bx} ${by}
                     q ${radius * 0.12} ${-radius * 0.08} ${radius * 0.24} 0
                     t ${radius * 0.24} 0
                     t ${radius * 0.24} 0
                     t ${radius * 0.24} 0`;
      out += el("path", {
        d: wave,
        stroke: "#b5452f",
        "stroke-width": radius * 0.12,
        fill: "none",
        "stroke-linecap": "round",
      });
      out += el("path", {
        d: wave,
        stroke: "#f2b8a2",
        "stroke-width": radius * 0.035,
        fill: "none",
        "stroke-linecap": "round",
      });
    }
  // White
  const ex = cx + radius * g.f(-0.12, 0.12);
  const ey = cy - radius * g.f(0.05, 0.2);
  out += el("path", { d: blob(g, ex, ey, radius * 0.55, radius * 0.5, g.i(4, 6), 0.12, 0.08), fill: "#fbfbf6" });
  // Yolk and its shine
  const yolkX = ex + radius * g.f(-0.12, 0.12);
  const yolkY = ey + radius * g.f(-0.1, 0.05);
  out += el("circle", { cx: yolkX, cy: yolkY, r: radius * 0.2, fill: "#f6a21a" });
  out += el("circle", {
    cx: yolkX - radius * 0.06,
    cy: yolkY - radius * 0.07,
    r: radius * 0.05,
    fill: "#fff",
    opacity: "0.6",
  });
  return out;
});
