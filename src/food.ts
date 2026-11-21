import { defineKind, el, fill, hsl, mix, pts, s, type Point, type Rand } from "./core";
import { andList, capitalize, numberWord } from "./words";
import { blob, smoothClosed, sprinkles, table } from "./shapes";

const SPRINKLES = ["#f25c78", "#4fb4e6", "#f2c14e", "#7bd389", "#ffffff", "#9b6bd6"];

/** A glazed donut from above, with sprinkles on some. */
export const donut = defineKind("donut", "Donut", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.05, 0.05);
  const cy = h / 2 + h * g.f(-0.04, 0.04);
  const radius = unit * g.f(0.32, 0.38);
  const hole = radius * g.f(0.28, 0.34);
  const bg = hsl(g.f(0, 360), g.f(30, 55), g.f(82, 90));
  const glaze = g.pick(["#f49ac1", "#6b3e2e", "#fbf4e8", "#8fd3f4", "#f6d365", "#c9a7eb"]);
  let out = fill(w, h, bg);
  const plate = g.chance(0.5);
  if (plate) {
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
  const sprinkled = g.chance(0.7);
  if (sprinkled)
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
  note.alt(`A glazed donut${sprinkled ? " with sprinkles" : ""}${plate ? " on a plate" : ""}`);
  note.focus(cx, cy);
  return out;
});

/** A whole pizza from above, cut into slices, with toppings. */
export const pizza = defineKind(
  "pizza",
  "Pizza",
  { topping: ["pepperoni", "vegetable", "margherita"], slices: [6, 8] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = unit * g.f(0.38, 0.43);
    const slices = g.option("slices", g.pick([6, 8]));
    let out = fill(w, h, g.pick(["#e9dccb", "#d9e4dc", "#e7d5d0", "#2f3a3a"]));
    // Board, crust, sauce and cheese
    out += el("circle", { cx, cy, r: radius * 1.08, fill: "#b98a5a" });
    out += el("circle", { cx, cy, r: radius, fill: "#e3a857" });
    out += el("circle", { cx, cy, r: radius * 0.86, fill: "#c7442e" });
    out += el("path", { d: blob(g, cx, cy, radius * 0.8, radius * 0.8, g.i(5, 8), 0.06, 0.08), fill: "#f6d27a" });
    const kind = g.option("topping", g.pick(["pepperoni", "vegetable", "margherita"]));
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
    const toppings = new Set<string>();
    // Each topping draws differently, so they draw from their own stream and leave the cuts as they were.
    const toppingRand = g.fork("topping");
    for (const [x, y] of spots) {
      if (kind === "pepperoni") {
        // Pepperoni
        out += el("circle", { cx: x, cy: y, r: radius * toppingRand.f(0.085, 0.105), fill: "#a8322a" });
      } else if (kind === "margherita") {
        // Mozzarella or basil
        const cheese = toppingRand.chance(0.55);
        toppings.add(cheese ? "mozzarella" : "basil");
        out += cheese
          ? el("ellipse", {
              cx: x,
              cy: y,
              rx: radius * toppingRand.f(0.08, 0.11),
              ry: radius * toppingRand.f(0.065, 0.085),
              fill: "#fbf7ec",
              transform: s`rotate(${toppingRand.f(0, 180)} ${x} ${y})`,
            })
          : el("ellipse", {
              cx: x,
              cy: y,
              rx: radius * 0.075,
              ry: radius * 0.04,
              fill: "#3f8a3a",
              transform: s`rotate(${toppingRand.f(0, 180)} ${x} ${y})`,
            });
      } else {
        // Olive ring or pepper strip
        const olive = toppingRand.chance(0.5);
        toppings.add(olive ? "olives" : "peppers");
        out += olive
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
              fill: toppingRand.pick(["#4caf50", "#d64545", "#f2c14e"]),
              transform: s`rotate(${toppingRand.f(0, 180)} ${x} ${y})`,
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
    const order = ["mozzarella", "basil", "olives", "peppers"].filter(t => toppings.has(t));
    const name =
      kind === "pepperoni"
        ? "A pepperoni pizza"
        : kind === "margherita"
          ? `A margherita pizza with ${andList(order)}`
          : `A vegetable pizza with ${andList(order)}`;
    note.alt(`${name}, cut into ${numberWord(slices)} slices`);
    note.focus(cx, cy);
    return out;
  },
);

const SCOOPS = ["#f7c6d0", "#7b4a35", "#fff4dd", "#b8e0b0", "#f6d365", "#c9a7eb", "#f28b66"];

/** One to three scoops on a waffle cone, maybe with a cherry. */
export const iceCream = defineKind("ice-cream", "Ice cream", (g, w, h, note) => {
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
    const sx = cx + g.f(-0.08, 0.08) * r;
    out += el("circle", { cx: sx, cy: sy, r, fill: color });
    // The top scoop.
    note.focus(sx, sy);
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
  const cherry = g.chance(0.5);
  const stack = scoops === 1 ? "one scoop" : `${numberWord(scoops)} scoops`;
  note.alt(`An ice cream cone with ${stack}${cherry ? " and a cherry on top" : ""}`);
  if (cherry) {
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
export const sushi = defineKind("sushi", "Sushi", (g, w, h, note) => {
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
  const pieces: Record<string, number> = { salmon: 0, tuna: 0, egg: 0, maki: 0 };
  for (let k = 0; k < count; k++) {
    const x = plateX + slot * (k + 0.5);
    const y = plateY + plateH * 0.55;
    const kind = g.pick(["salmon", "tuna", "egg", "maki", "maki"]);
    pieces[kind]++;
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
  // Group the nigiri by topping ("Two salmon and tuna nigiri"), then the maki.
  const fish = (["salmon", "tuna", "egg"] as const)
    .filter(kind => pieces[kind])
    .map(kind => (pieces[kind] === 1 ? kind : `${numberWord(pieces[kind])} ${kind}`));
  const maki = pieces.maki === 1 ? "a maki roll" : `${numberWord(pieces.maki)} maki rolls`;
  const text = !fish.length ? maki : `${andList(fish)} nigiri${pieces.maki ? ` with ${maki}` : ""}`;
  note.alt(`${text.charAt(0).toUpperCase()}${text.slice(1)} on a plate beside chopsticks`);
  note.focus(w / 2, plateY + plateH * 0.5);
  return out;
});

const SPONGE = ["#f3d9a4", "#7b4a35", "#f7e7c6", "#e9b872"];
const CREAM = ["#fbf4e8", "#f7c6d0", "#f6d365", "#6b3e2e"];

/** A layered slice of cake on a plate, with a berry on top. */
export const cake = defineKind("cake", "Slice of cake", (g, w, h, note) => {
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
  const berry = g.chance(0.5);
  const tiers = (layers + 1) / 2;
  note.alt(
    `A slice of ${numberWord(tiers)}-layer cake on a plate, topped with ${berry ? "a strawberry" : "cream and a cherry"}`,
  );
  note.focus(tx, ty - unit * 0.04);
  if (berry) {
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
export const egg = defineKind("egg", "Fried egg", (g, w, h, note) => {
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
  const bacon = g.chance(0.45);
  if (bacon)
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
  note.alt(`A fried egg ${pan ? "in a pan" : "on a plate"}${bacon ? " with two rashers of bacon" : ""}`);
  note.focus(yolkX, yolkY);
  out += el("circle", {
    cx: yolkX - radius * 0.06,
    cy: yolkY - radius * 0.07,
    r: radius * 0.05,
    fill: "#fff",
    opacity: "0.6",
  });
  return out;
});

/** A plate seen at an angle: shadow, rim and a faint well. */
function sidePlate(cx: number, cy: number, rx: number, ry: number, color = "#ffffff"): string {
  let out = el("ellipse", { cx, cy: cy + ry * 0.12, rx, ry, fill: "#000", opacity: "0.08" });
  out += el("ellipse", { cx, cy, rx, ry, fill: color });
  out += el("ellipse", { cx, cy, rx: rx * 0.75, ry: ry * 0.72, fill: "#000", opacity: "0.05" });
  return out;
}

/** A plate seen from above: shadow, rim and a faint well. */
function topPlate(cx: number, cy: number, r: number, color = "#ffffff"): string {
  let out = el("circle", { cx: cx + r * 0.02, cy: cy + r * 0.04, r, fill: "#000", opacity: "0.1" });
  out += el("circle", { cx, cy, r, fill: color });
  out += el("circle", { cx, cy, r: r * 0.78, fill: "#000", opacity: "0.04" });
  return out;
}

/** `count` points spread evenly over a disc (a jittered sunflower), so toppings don't clump. */
function spread(g: Rand, cx: number, cy: number, radius: number, count: number, squash = 1): Point[] {
  const phase = g.f(0, Math.PI * 2);
  const out: Point[] = [];
  for (let k = 0; k < count; k++) {
    const dist = radius * Math.sqrt((k + g.f(0.3, 0.7)) / count);
    const angle = phase + k * 2.39996 + g.f(-0.25, 0.25);
    out.push([cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist * squash]);
  }
  return out;
}

const BUNS = ["#e7a456", "#d98c3f", "#c9772f", "#e3b06a"];

/** A burger on a plate, seen from the side: bun, patty and a few fillings. */
export const burger = defineKind("burger", "Burger", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.64, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const cx = w / 2;
  const plateY = h * 0.84;
  const bw = unit * g.f(0.24, 0.28);
  const plateRx = bw * 1.6;
  const plateRy = plateRx * 0.22;
  out += sidePlate(cx, plateY, plateRx, plateRy);
  const bun = g.pick(BUNS);
  const double = g.chance(0.3);
  const cheese = g.chance(0.7);
  const lettuce = g.chance(0.8);
  const tomato = g.chance(0.6);
  const onion = g.chance(0.35);
  const seeds = g.chance(0.75);
  let y = plateY + plateRy * 0.2;
  // Bottom bun
  const hb = bw * 0.28;
  out += el("rect", { x: cx - bw * 0.96, y: y - hb, width: bw * 1.92, height: hb, rx: hb * 0.45, fill: bun });
  y -= hb * 0.95;
  for (let k = 0; k < (double ? 2 : 1); k++) {
    // Patty
    const ph = bw * 0.26;
    out += el("rect", { x: cx - bw * 1.03, y: y - ph, width: bw * 2.06, height: ph, rx: ph * 0.4, fill: "#6b3e2e" });
    out += el("rect", {
      x: cx - bw * 0.95,
      y: y - ph * 0.82,
      width: bw * 1.9,
      height: ph * 0.12,
      rx: ph * 0.06,
      fill: "#8a553c",
    });
    y -= ph * 0.95;
    if (cheese) {
      // A square slice of cheese whose corners droop over the patty
      const t = bw * 0.06;
      let d = s`M ${cx - bw * 1.08} ${y - t * 0.5} L ${cx + bw * 1.08} ${y - t * 0.5} L ${cx + bw * 1.08} ${y + t * 0.5}`;
      for (const at of [0.7, 0.05, -0.62]) {
        const xd = cx + bw * (at + g.f(-0.08, 0.08));
        const dw = bw * 0.14;
        d += s` L ${xd + dw} ${y + t * 0.5} L ${xd} ${y + t * 0.5 + ph * g.f(0.4, 0.65)} L ${xd - dw} ${y + t * 0.5}`;
      }
      d += s` L ${cx - bw * 1.08} ${y + t * 0.5} Z`;
      out += el("path", { d, fill: "#f6c445", stroke: "#f6c445", "stroke-width": t * 0.6, "stroke-linejoin": "round" });
      y -= t;
    }
  }
  if (onion) {
    // Onion slice
    const oh = bw * 0.06;
    out += el("rect", { x: cx - bw * 0.95, y: y - oh, width: bw * 1.9, height: oh, rx: oh * 0.5, fill: "#ead9f2" });
    y -= oh * 0.9;
  }
  if (tomato) {
    // Tomato slice
    const th = bw * 0.11;
    out += el("rect", { x: cx - bw * 0.98, y: y - th, width: bw * 1.96, height: th, rx: th * 0.45, fill: "#e0473c" });
    y -= th * 0.9;
  }
  if (lettuce) {
    // A ruffled leaf of lettuce, frilled along its lower edge
    const lh = bw * 0.1;
    const frills = 7;
    let d = s`M ${cx - bw * 1.12} ${y - lh} L ${cx + bw * 1.12} ${y - lh}`;
    for (let k = 0; k < frills; k++) {
      const x0 = cx + bw * 1.12 - (k * bw * 2.24) / frills;
      const x1 = x0 - (bw * 2.24) / frills;
      d += s` Q ${(x0 + x1) / 2} ${y + lh * g.f(0.6, 1.3)} ${x1} ${y}`;
    }
    out += el("path", { d: d + " Z", fill: "#7bc043" });
    y -= lh;
  }
  // Top bun: a dome with rounded bottom corners
  const hd = bw * 0.72;
  const yb = y + bw * 0.03;
  out += el("path", {
    d: s`M ${cx - bw} ${yb - hd * 0.12} Q ${cx - bw} ${yb} ${cx - bw * 0.88} ${yb} L ${cx + bw * 0.88} ${yb}
         Q ${cx + bw} ${yb} ${cx + bw} ${yb - hd * 0.12}
         C ${cx + bw} ${yb - hd * 1.25} ${cx - bw} ${yb - hd * 1.25} ${cx - bw} ${yb - hd * 0.12} Z`,
    fill: bun,
  });
  // Highlight
  out += el("path", {
    d: s`M ${cx - bw * 0.72} ${yb - hd * 0.5} Q ${cx - bw * 0.55} ${yb - hd * 0.85} ${cx - bw * 0.15} ${yb - hd * 0.9}`,
    stroke: "#fff",
    "stroke-width": bw * 0.05,
    "stroke-linecap": "round",
    fill: "none",
    opacity: "0.35",
  });
  if (seeds) {
    // Sesame seeds in two loose rows over the dome
    let d = "";
    for (const [row, count] of [
      [0.78, 5],
      [0.5, 6],
    ] as const) {
      for (let k = 0; k < count; k++) {
        const u = -0.72 + (1.44 * (k + 0.5)) / count + g.f(-0.06, 0.06);
        const top = hd * (0.12 + 0.85 * Math.sqrt(1 - u * u));
        const sx = cx + u * bw;
        const sy = yb - top * (row + g.f(-0.05, 0.05));
        const a = g.f(-0.6, 0.6);
        const dx = Math.cos(a) * bw * 0.035;
        const dy = Math.sin(a) * bw * 0.035;
        d += s`M${sx - dx} ${sy - dy}L${sx + dx} ${sy + dy}`;
      }
    }
    out += el("path", { d, stroke: "#fbf1d6", "stroke-width": bw * 0.04, "stroke-linecap": "round" });
  }
  const fillings = andList([cheese && "cheese", lettuce && "lettuce", tomato && "tomato", onion && "onion"]);
  note.alt(`A ${double ? "double " : ""}burger${fillings ? ` with ${fillings}` : ""} on a plate`);
  note.focus(cx, y);
  return out;
});

const SHELLS = ["#f2c14e", "#e9a93f", "#f3e1b6"];
const MEATS = ["#7a4a2e", "#a0643c", "#c98b4d", "#5b3a2a"];

/** A plate of tacos, seen from the side, each filled with meat, lettuce and toppings. */
export const taco = defineKind("taco", "Tacos", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.6, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const many = g.i(2, 3);
  const count = w >= h * 1.2 ? many : Math.min(many, 2);
  const r = Math.min(unit * 0.27, (w * 0.8) / (count * 2.15 + 0.3));
  const cx = w / 2;
  const plateY = h * 0.8;
  const plateRx = (count * 2.15 * r + r * 0.6) / 2;
  const plateRy = Math.min(plateRx * 0.17, r * 0.6);
  out += sidePlate(cx, plateY, plateRx, plateRy, g.pick(["#ffffff", "#f3e6d0", "#d8ebe4", "#f2d5c4"]));
  const shell = g.pick(SHELLS);
  const meat = g.pick(MEATS);
  const cream = g.chance(0.4);
  const cheese = g.chance(0.7);
  const baseY = plateY + plateRy * 0.15;
  for (let k = 0; k < count; k++) {
    const tx = cx + (k - (count - 1) / 2) * r * 2.15;
    const at = (angle: number, radius: number): Point => [
      tx + Math.cos(angle) * radius,
      baseY - Math.sin(angle) * radius,
    ];
    // Filling poking out along the shell's arc: a ring of scallops, closed through the fold
    const ruffle = (radius: number, amp: number, n: number) => {
      const from = Math.PI * 0.9;
      const step = (Math.PI * 0.8) / n;
      let [x, y] = at(from, radius * r);
      let d = s`M ${tx} ${baseY} L ${x} ${y}`;
      for (let b = 0; b < n; b++) {
        const [qx, qy] = at(from - step * (b + 0.5), r * (radius + amp * g.f(0.6, 1.4)));
        [x, y] = at(from - step * (b + 1), radius * r);
        d += s` Q ${qx} ${qy} ${x} ${y}`;
      }
      return d + " Z";
    };
    // Shadow, and the back half of the shell
    out += el("ellipse", { cx: tx, cy: baseY, rx: r * 0.95, ry: r * 0.1, fill: "#000", opacity: "0.12" });
    out += el("path", {
      d: s`M ${tx - r} ${baseY} A ${r} ${r} 0 0 1 ${tx + r} ${baseY} Z`,
      fill: mix(shell, "#000000", 0.12),
    });
    // Lettuce, then the meat in front of it
    out += el("path", { d: ruffle(0.97, 0.3, 9), fill: "#7bc043" });
    out += el("path", { d: ruffle(0.93, 0.2, 7), fill: meat });
    // Cubes of tomato and shreds of cheese along the top
    let cubes = "";
    let shreds = "";
    for (let b = 0; b < 6; b++) {
      const angle = Math.PI * (0.8 - b * 0.12 + g.f(-0.025, 0.025));
      const [x, y] = at(angle, r * g.f(1.02, 1.08));
      const c = r * 0.06;
      cubes += s`M${x - c} ${y - c}h${c * 2}v${c * 2}h${-c * 2}Z`;
      const [sx, sy] = at(angle - Math.PI * 0.06, r * 1.1);
      const dx = r * 0.06 * Math.sin(angle);
      const dy = r * 0.06 * Math.cos(angle);
      shreds += s`M${sx - dx} ${sy - dy}L${sx + dx} ${sy + dy}`;
    }
    out += el("path", { d: cubes, fill: "#e0473c" });
    if (cheese)
      out += el("path", { d: shreds, stroke: "#f6c445", "stroke-width": r * 0.05, "stroke-linecap": "round" });
    if (cream) {
      // A dollop of sour cream
      const [dx, dy] = at(Math.PI * g.f(0.4, 0.6), r * 1.04);
      out += el("ellipse", { cx: dx, cy: dy, rx: r * 0.2, ry: r * 0.1, fill: "#fbf7ec" });
    }
    // The front half of the shell, with a few toasted spots
    out += el("path", {
      d: s`M ${tx - r * 0.9} ${baseY} A ${r * 0.9} ${r * 0.9} 0 0 1 ${tx + r * 0.9} ${baseY} Z`,
      fill: shell,
    });
    let spots = "";
    for (const [px, py] of spread(g, tx, baseY - r * 0.4, r * 0.48, 6, 0.65)) spots += s`M${px} ${py}h0.01`;
    out += el("path", {
      d: spots,
      stroke: mix(shell, "#7a4a2e", 0.35),
      "stroke-width": r * 0.07,
      "stroke-linecap": "round",
      opacity: "0.6",
    });
  }
  const extras = andList(["lettuce", "tomato", cheese && "cheese", cream && "sour cream"]);
  note.alt(`${capitalize(numberWord(count))} tacos with ${extras} on a plate`);
  note.focus(cx, baseY - r * 0.6);
  return out;
});

const FROSTING = ["#fbf4e8", "#f7c6d0", "#c9a7eb", "#b8e0b0", "#6b3e2e", "#8fd3f4", "#f6d365"];
const WRAPPERS = ["#f49ac1", "#8fd3f4", "#f6d365", "#7bd389", "#c9a7eb", "#f28b66", "#fbf4e8"];

/** One to three cupcakes on a table, with swirled frosting and sprinkles or a cherry. */
export const cupcake = defineKind("cupcake", "Cupcake", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.6, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const size = (c: number) => unit * [0.4, 0.34, 0.3][c - 1];
  let count = g.i(1, 3);
  while (count > 1 && count * size(count) * 1.3 > w * 0.92) count--;
  const S = size(count);
  const baseY = h * 0.88;
  const topping = g.pick(["sprinkles", "cherry", "both", "berry"]);
  const sponge = g.pick(["#e9b872", "#7b4a35", "#f3d9a4"]);
  let focusY = 0;
  for (let k = 0; k < count; k++) {
    const x = w / 2 + (k - (count - 1) / 2) * S * 1.3;
    const frost = g.pick(FROSTING);
    const wrap = g.pick(WRAPPERS.filter(c => c !== frost));
    const top = baseY - S * 0.56;
    // Shadow, and the paper wrapper with its pleats
    out += el("ellipse", { cx: x, cy: baseY, rx: S * 0.48, ry: S * 0.06, fill: "#000", opacity: "0.12" });
    out += el("polygon", {
      points: pts([
        [x - S * 0.36, baseY],
        [x + S * 0.36, baseY],
        [x + S * 0.47, top],
        [x - S * 0.47, top],
      ]),
      fill: wrap,
    });
    let pleats = "";
    for (let p = 1; p < 7; p++) {
      const u = -1 + p / 3.5;
      pleats += s`M${x + u * S * 0.36} ${baseY}L${x + u * S * 0.47} ${top}`;
    }
    out += el("path", { d: pleats, stroke: mix(wrap, "#000000", 0.12), "stroke-width": S * 0.02 });
    // The cake's crown above the wrapper
    out += el("ellipse", { cx: x, cy: top - S * 0.02, rx: S * 0.5, ry: S * 0.1, fill: sponge });
    // Three tiers of frosting, each shaded underneath
    const tiers: [number, number, number][] = [];
    for (let t = 0; t < 3; t++) {
      const rx = S * 0.52 * (1 - t * 0.27);
      const ry = S * 0.13 * (1 - t * 0.1);
      const cy = top - S * 0.1 - t * S * 0.17;
      tiers.push([cy, rx, ry]);
      out += el("ellipse", { cx: x, cy: cy + ry * 0.3, rx, ry, fill: mix(frost, "#000000", 0.1) });
      out += el("ellipse", { cx: x, cy, rx, ry, fill: frost });
    }
    const [ty, , tr] = tiers[2];
    // The swirl's peak
    out += el("path", {
      d: s`M ${x - S * 0.12} ${ty} C ${x - S * 0.1} ${ty - S * 0.15} ${x + S * 0.01} ${ty - S * 0.12} ${x + S * 0.03} ${ty - S * 0.24}
           C ${x + S * 0.1} ${ty - S * 0.12} ${x + S * 0.13} ${ty - S * 0.06} ${x + S * 0.12} ${ty} Z`,
      fill: frost,
    });
    focusY = ty - tr;
    if (topping !== "cherry" && topping !== "berry") {
      // Sprinkles spread over the front of each tier
      const colors = SPRINKLES.filter(c => c !== frost);
      const byColor = new Map<string, string>();
      for (const [cy, rx, ry] of tiers)
        for (let p = 0; p < 5; p++) {
          const u = -0.75 + p * 0.375 + g.f(-0.08, 0.08);
          const px = x + u * rx;
          const py = cy + ry * Math.sqrt(1 - u * u) * g.f(-0.3, 0.6);
          const a = g.f(0, Math.PI);
          const c = g.pick(colors);
          const d = s`M${px - Math.cos(a) * S * 0.025} ${py - Math.sin(a) * S * 0.025}l${Math.cos(a) * S * 0.05} ${Math.sin(a) * S * 0.05}`;
          byColor.set(c, (byColor.get(c) ?? "") + d);
        }
      for (const [c, path] of byColor)
        out += el("path", { d: path, stroke: c, "stroke-width": S * 0.022, "stroke-linecap": "round" });
    }
    if (topping === "cherry" || topping === "both") {
      // A cherry on the peak, with its stem
      const cy = ty - S * 0.2;
      out += el("path", {
        d: s`M ${x} ${cy - S * 0.06} q ${S * 0.02} ${-S * 0.12} ${S * 0.1} ${-S * 0.16}`,
        stroke: "#4b7a2a",
        "stroke-width": S * 0.025,
        fill: "none",
        "stroke-linecap": "round",
      });
      out += el("circle", { cx: x, cy, r: S * 0.085, fill: "#d62839" });
      out += el("circle", { cx: x - S * 0.03, cy: cy - S * 0.03, r: S * 0.022, fill: "#fff", opacity: "0.6" });
      focusY = cy;
    } else if (topping === "berry") {
      // A strawberry on the peak
      const cy = ty - S * 0.16;
      out += el("path", {
        d: s`M ${x} ${cy + S * 0.1} C ${x - S * 0.13} ${cy + S * 0.02} ${x - S * 0.1} ${cy - S * 0.1} ${x} ${cy - S * 0.08}
             C ${x + S * 0.1} ${cy - S * 0.1} ${x + S * 0.13} ${cy + S * 0.02} ${x} ${cy + S * 0.1} Z`,
        fill: "#e0384f",
      });
      out += el("path", {
        d: s`M ${x - S * 0.07} ${cy - S * 0.1} L ${x} ${cy - S * 0.06} L ${x + S * 0.07} ${cy - S * 0.1}`,
        stroke: "#4b8a2a",
        "stroke-width": S * 0.035,
        fill: "none",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      focusY = cy;
    }
  }
  const what =
    topping === "sprinkles"
      ? "sprinkles"
      : topping === "cherry"
        ? "a cherry"
        : topping === "both"
          ? "sprinkles and a cherry"
          : "a strawberry";
  note.alt(
    `${count === 1 ? "A cupcake" : `${capitalize(numberWord(count))} cupcakes`} with swirled frosting and ${what}`,
  );
  note.focus(w / 2, focusY);
  return out;
});

/** Wedges of watermelon on a plate, seen from above. */
export const watermelon = defineKind("watermelon", "Watermelon", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const plate = unit * 0.44;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(30, 50), g.f(80, 88)));
  out += topPlate(cx, cy, plate, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0", "#dfe7f5"]));
  const count = g.i(3, 5);
  const yellow = g.chance(0.2);
  const seeded = g.chance(0.8);
  const flesh = yellow ? "#f6d365" : g.pick(["#f25c5c", "#ef4f63", "#f26b6b"]);
  const R = plate * 0.8;
  const half = (Math.PI / count) * 0.72;
  const a0 = g.f(0, Math.PI * 2);
  for (let k = 0; k < count; k++) {
    const phi = a0 + (k * Math.PI * 2) / count + g.f(-0.06, 0.06);
    const tx = cx + Math.cos(phi) * plate * 0.08;
    const ty = cy + Math.sin(phi) * plate * 0.08;
    const wedge = (r: number, dx = 0, dy = 0) =>
      s`M ${tx + dx} ${ty + dy}
        L ${tx + dx + Math.cos(phi - half) * r} ${ty + dy + Math.sin(phi - half) * r}
        A ${r} ${r} 0 0 1 ${tx + dx + Math.cos(phi + half) * r} ${ty + dy + Math.sin(phi + half) * r} Z`;
    // Shadow, then rind, pale rind and flesh
    out += el("path", { d: wedge(R, plate * 0.015, plate * 0.03), fill: "#000", opacity: "0.1" });
    out += el("path", { d: wedge(R), fill: "#2f6b2f" });
    out += el("path", { d: wedge(R * 0.95), fill: "#8cc46b" });
    out += el("path", { d: wedge(R * 0.92), fill: "#f4f1d0" });
    out += el("path", { d: wedge(R * 0.89), fill: flesh });
    if (seeded) {
      // Seeds in two rows, pointing to the tip
      let seeds = "";
      for (const [row, n] of [
        [0.45, 2],
        [0.7, 3],
      ] as const)
        for (let p = 0; p < n; p++) {
          const a = phi + half * 0.62 * (-1 + (2 * p) / (n - 1)) + g.f(-0.05, 0.05);
          const dist = R * (row + g.f(-0.04, 0.04));
          seeds += el("ellipse", {
            cx: tx + Math.cos(a) * dist,
            cy: ty + Math.sin(a) * dist,
            rx: R * 0.03,
            ry: R * 0.017,
            transform: s`rotate(${(a * 180) / Math.PI} ${tx + Math.cos(a) * dist} ${ty + Math.sin(a) * dist})`,
          });
        }
      out += el("g", { fill: yellow ? "#3a2a1a" : "#2b2b2b" }, seeds);
    }
  }
  note.alt(`${capitalize(numberWord(count))} wedges of ${seeded ? "" : "seedless "}watermelon on a plate`);
  note.focus(cx, cy);
  return out;
});

const POPS = ["#f25c78", "#f28b66", "#f6d365", "#7bd389", "#8fd3f4", "#c9a7eb", "#f49ac1"];

/** One to three ice pops lying on a table, seen from above: plain, striped or dipped in chocolate. */
export const popsicle = defineKind("popsicle", "Popsicle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const bg = hsl(g.f(0, 360), g.f(35, 55), g.f(82, 90));
  let out = fill(w, h, bg);
  const bodyW = unit * 0.19;
  const bodyL = unit * 0.46;
  const stickW = bodyW * 0.3;
  const stickL = unit * 0.22;
  const hw = bodyW / 2;
  const top = -(bodyL + stickL) / 2;
  const bottom = top + bodyL;
  const tilt = g.f(-18, 18);
  const gap = bodyW * 1.75;
  const extent = (c: number) => (c - 1) * gap + bodyW + (bodyL + stickL) * Math.sin((Math.abs(tilt) * Math.PI) / 180);
  let count = g.i(1, 3);
  while (count > 1 && extent(count) > w * 0.9) count--;
  const body = s`M ${-hw} ${bottom - hw * 0.3} L ${-hw} ${top + hw} A ${hw} ${hw} 0 0 1 ${hw} ${top + hw}
                 L ${hw} ${bottom - hw * 0.3} Q ${hw} ${bottom} ${hw * 0.7} ${bottom} L ${-hw * 0.7} ${bottom}
                 Q ${-hw} ${bottom} ${-hw} ${bottom - hw * 0.3} Z`;
  const stick = el("rect", {
    x: -stickW / 2,
    y: bottom - stickW,
    width: stickW,
    height: stickL + stickW,
    rx: stickW / 2,
  });
  const styles = new Set<string>();
  let bitten = false;
  for (let k = 0; k < count; k++) {
    const px = w / 2 + (k - (count - 1) / 2) * gap;
    const py = h / 2 + unit * g.f(-0.03, 0.03);
    const angle = tilt + g.f(-5, 5);
    const style = g.pick(["plain", "stripes", "dipped"]);
    styles.add(style);
    const color = g.pick(POPS);
    const shape = g.id("pop");
    let defs = el("clipPath", { id: shape }, el("path", { d: body }));
    const bite = g.chance(0.3);
    const cut = bite ? g.id("bite") : "";
    if (bite) {
      // The bite: three overlapping scallops taken out of the top corner
      bitten = true;
      const r = hw * 0.4;
      const corner: Point = [hw * 0.8, top + hw * 0.5];
      let d = s`M ${-hw * 3} ${top - hw * 3} h ${hw * 6} v ${bodyL + stickL + hw * 6} h ${-hw * 6} Z`;
      for (const [ox, oy] of [
        [-0.55, -0.55],
        [0.1, 0],
        [0.4, 0.75],
      ])
        d += s` M ${corner[0] + ox * hw - r} ${corner[1] + oy * hw} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
      defs += el("clipPath", { id: cut }, el("path", { d, "clip-rule": "evenodd" }));
    }
    out += el("defs", {}, defs);
    const place = (dx: number, dy: number) => s`translate(${px + dx} ${py + dy}) rotate(${angle})`;
    const clip = bite ? `url(#${cut})` : undefined;
    // Shadow
    out += el(
      "g",
      { transform: place(unit * 0.015, unit * 0.025) },
      el("g", { "clip-path": clip, fill: "#000", opacity: "0.12" }, stick, el("path", { d: body })),
    );
    // Stick, then the ice and its decoration
    let inner = "";
    if (style === "stripes") {
      const colors = [color, g.pick(POPS.filter(c => c !== color)), "#fbf4e8"];
      for (let b = 1; b < 3; b++) {
        const y0 = top + (bodyL * b) / 3;
        inner += el("rect", { x: -hw, y: y0, width: bodyW, height: bodyL, fill: colors[b] });
      }
    } else if (style === "dipped") {
      // Chocolate over the top, with a wavy edge, and sometimes sprinkles
      const dip = top + bodyL * g.f(0.38, 0.5);
      let d = s`M ${-hw} ${top - hw} L ${-hw} ${dip}`;
      for (let b = 0; b < 4; b++)
        d += s` Q ${-hw + (bodyW * (b + 0.5)) / 4} ${dip + hw * g.f(0.15, 0.45)} ${-hw + (bodyW * (b + 1)) / 4} ${dip}`;
      inner += el("path", { d: d + s` L ${hw} ${top - hw} Z`, fill: g.pick(["#5a3522", "#6b3e2e", "#fbf4e8"]) });
      if (g.fork(`sprinkle${k}`).chance(0.6)) {
        styles.add("sprinkles");
        const dots: Point[] = [];
        const rows = 3;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < 3; c++)
            dots.push([
              hw * (-0.55 + c * 0.55 + g.f(-0.12, 0.12)),
              top + hw * 0.55 + ((dip - top - hw * 0.9) * (r + g.f(0.2, 0.8))) / rows,
            ]);
        const byColor = new Map<string, string>();
        for (const [x, y] of dots) {
          const a = g.f(0, Math.PI);
          const dx = Math.cos(a) * hw * 0.12;
          const dy = Math.sin(a) * hw * 0.12;
          const c = g.pick(SPRINKLES);
          byColor.set(c, (byColor.get(c) ?? "") + s`M${x - dx} ${y - dy}L${x + dx} ${y + dy}`);
        }
        for (const [c, path] of byColor)
          inner += el("path", { d: path, stroke: c, "stroke-width": hw * 0.1, "stroke-linecap": "round" });
      }
    }
    // Frosty highlight
    inner += el("path", {
      d: s`M ${-hw * 0.5} ${top + hw * 0.9} L ${-hw * 0.5} ${bottom - hw * 0.6}`,
      stroke: "#fff",
      "stroke-width": hw * 0.18,
      "stroke-linecap": "round",
      opacity: "0.35",
    });
    out += el(
      "g",
      { transform: place(0, 0) },
      el(
        "g",
        { "clip-path": clip },
        el("g", { fill: "#e8c48a" }, stick),
        el("path", { d: body, fill: color }),
        el("g", { "clip-path": `url(#${shape})` }, inner),
      ),
    );
  }
  const kinds = andList([
    styles.has("plain") && "plain",
    styles.has("stripes") && "striped",
    styles.has("dipped") && "dipped",
  ]);
  const sprinkled = styles.has("dipped") && styles.has("sprinkles") ? " with sprinkles" : "";
  const what =
    count === 1 ? `A ${kinds} ice pop${sprinkled}` : `${capitalize(numberWord(count))} ice pops, ${kinds}${sprinkled},`;
  note.alt(`${what} on a table${bitten ? ", with a bite taken" : ""}`);
  note.focus(w / 2, h / 2 + top * 0.4);
  return out;
});

/** A blueberry or raspberry, seen from the side or above. */
function berry(g: Rand, x: number, y: number, r: number, kind: "blueberry" | "raspberry"): string {
  if (kind === "blueberry")
    return (
      el("circle", { cx: x, cy: y, r, fill: "#3b4a8c" }) +
      el("circle", { cx: x + r * 0.15, cy: y - r * 0.2, r: r * 0.28, fill: "#26305e" }) +
      el("circle", { cx: x - r * 0.4, cy: y - r * 0.35, r: r * 0.2, fill: "#fff", opacity: "0.35" })
    );
  let out = el("circle", { cx: x, cy: y, r, fill: "#d6336c" });
  let dots = "";
  for (const [dx, dy] of spread(g, 0, 0, r * 0.7, 6)) dots += s`M${x + dx} ${y + dy}h0.01`;
  out += el("path", { d: dots, stroke: "#f07a9e", "stroke-width": r * 0.3, "stroke-linecap": "round" });
  return out;
}

/** A stack of pancakes on a plate, with butter, syrup and berries. */
export const pancakes = defineKind("pancakes", "Pancakes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  let out = table(g, w, h, h * 0.56, hsl(g.f(0, 360), 30, 86), hsl(g.f(20, 40), 35, 62));
  const cx = w / 2;
  const plateY = h * 0.85;
  const rx = unit * g.f(0.26, 0.3);
  const ry = rx * 0.26;
  const t = unit * 0.05;
  const plateRx = rx * 1.62;
  const plateRy = plateRx * 0.26;
  out += sidePlate(cx, plateY, plateRx, plateRy, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0"]));
  const count = g.i(3, 6);
  const edge = g.pick(["#efc27a", "#f3cf8e", "#e8b468"]);
  const face = g.pick(["#c98a3e", "#b9772f", "#d39a4c"]);
  let y = plateY;
  let px = cx;
  let prx = rx;
  for (let k = 0; k < count; k++) {
    // One pancake: its pale edge, then its browned top
    px = cx + rx * g.f(-0.04, 0.04);
    prx = rx * g.f(0.95, 1.02);
    out += el("ellipse", { cx: px, cy: y, rx: prx, ry, fill: mix(edge, "#000000", 0.08) });
    out += el("rect", { x: px - prx, y: y - t, width: prx * 2, height: t, fill: edge });
    out += el("ellipse", { cx: px, cy: y - t, rx: prx, ry, fill: face });
    y -= t;
  }
  const topY = y;
  const syrup = g.chance(0.75);
  const butter = g.chance(0.7);
  const kind = g.pick(["blueberry", "raspberry", "mixed"] as const);
  const pick = (): "blueberry" | "raspberry" => (kind === "mixed" ? g.pick(["blueberry", "raspberry"]) : kind);
  if (syrup) {
    // A pool of syrup on top, running down the front of the stack
    const color = "#a8561c";
    let drips = "";
    for (const u of [-0.55, -0.1, 0.35, 0.7]) {
      const x = px + prx * (u + g.f(-0.08, 0.08));
      const y0 = topY + ry * 0.5;
      const len = Math.min(plateY - topY - ry * 0.4, t * g.f(0.8, 2.4));
      drips += s`M${x} ${y0}V${y0 + len}`;
    }
    out += el("path", {
      d: drips,
      stroke: color,
      "stroke-width": unit * 0.03,
      "stroke-linecap": "round",
      opacity: "0.92",
    });
    out += el("path", {
      d: blob(g, px, topY + ry * 0.12, prx * 0.78, ry * 0.75, 5, 0.06, 0.04),
      fill: color,
      opacity: "0.92",
    });
  }
  // Berries around the top, behind the butter at the back and in front of it at the front
  const ring: Point[] = [];
  const n = g.i(4, 6);
  const a0 = g.f(0, Math.PI * 2);
  for (let k = 0; k < n; k++) {
    const a = a0 + (k * Math.PI * 2) / n + g.f(-0.2, 0.2);
    ring.push([px + Math.cos(a) * prx * 0.55, topY + Math.sin(a) * ry * 0.55]);
  }
  ring.sort((a, b) => a[1] - b[1]);
  const br = unit * 0.026;
  for (const [x, by] of ring.filter(p => p[1] < topY)) out += berry(g, x, by - br * 0.6, br, pick());
  if (butter) {
    // A pat of butter
    const b = rx * 0.17;
    const yb = topY - b * 0.1;
    out += el("rect", { x: px - b, y: yb - b * 0.45, width: b * 2, height: b * 0.45, fill: "#f2d36b" });
    out += el("polygon", {
      points: pts([
        [px - b, yb - b * 0.45],
        [px + b, yb - b * 0.45],
        [px + b * 0.75, yb - b * 0.85],
        [px - b * 0.75, yb - b * 0.85],
      ]),
      fill: "#fbe7a1",
    });
  }
  for (const [x, by] of ring.filter(p => p[1] >= topY)) out += berry(g, x, by - br * 0.6, br, pick());
  // A few berries on the plate beside the stack
  for (const side of [-1, 1]) {
    const m = g.i(1, 2);
    for (let k = 0; k < m; k++) {
      const x = cx + side * rx * (1.17 + k * 0.15 + g.f(-0.03, 0.03));
      out += berry(g, x, plateY + plateRy * (0.1 + k * 0.25) - br * 0.6, br, pick());
    }
  }
  const berries =
    kind === "mixed" ? "blueberries and raspberries" : `${kind === "blueberry" ? "blueberries" : "raspberries"}`;
  note.alt(
    `A stack of ${numberWord(count)} pancakes with ${andList([butter && "butter", syrup && "syrup", berries])} on a plate`,
  );
  note.focus(px, topY);
  return out;
});

/** An avocado cut in half on a board, one half still holding the pit. */
export const avocado = defineKind("avocado", "Avocado", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 45), g.f(82, 90)));
  const count = g.chance(0.75) ? 2 : 1;
  const ry = Math.min(unit * 0.3, (w * 0.8) / (count * 2.2 * 0.74 + 0.5));
  const rx = ry * 0.74;
  // Board, with a little grain
  const bw = Math.min(w * 0.94, count * rx * 2.5 + rx * 1.1);
  const bh = Math.min(h * 0.92, ry * 2.6);
  const wood = g.pick(["#d8ad78", "#c89a64", "#e3c08f", "#b9875a"]);
  out += el("rect", {
    x: cx - bw / 2 + unit * 0.01,
    y: cy - bh / 2 + unit * 0.02,
    width: bw,
    height: bh,
    rx: unit * 0.05,
    fill: "#000",
    opacity: "0.1",
  });
  out += el("rect", { x: cx - bw / 2, y: cy - bh / 2, width: bw, height: bh, rx: unit * 0.05, fill: wood });
  let grain = "";
  for (let k = 1; k < 5; k++) {
    const gy = cy - bh / 2 + (bh * (k + g.f(-0.2, 0.2))) / 5;
    grain += s`M${cx - bw * 0.42} ${gy}q${bw * 0.2} ${-bh * 0.02} ${bw * 0.42} 0t${bw * 0.42} 0`;
  }
  out += el("path", {
    d: grain,
    stroke: mix(wood, "#000000", 0.12),
    "stroke-width": unit * 0.006,
    fill: "none",
    opacity: "0.6",
  });
  // The outline of half an avocado, narrow end up, scaled about its middle
  const shape = (scale: number) => {
    const ring: Point[] = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      ring.push([rx * scale * Math.sin(a) * (1 - 0.22 * Math.cos(a)) * 1.08, -ry * scale * Math.cos(a)]);
    }
    return smoothClosed(ring);
  };
  const pitAt = count === 1 ? 0 : g.i(0, 1);
  for (let k = 0; k < count; k++) {
    const x = cx + (k - (count - 1) / 2) * rx * 2.5;
    const turn = count === 1 ? g.f(-20, 20) : (k === 0 ? -1 : 1) * g.f(6, 20);
    let half = el("path", {
      d: shape(1),
      fill: "#000",
      opacity: "0.12",
      transform: s`translate(${unit * 0.01} ${unit * 0.02})`,
    });
    half += el("path", { d: shape(1), fill: "#33501f" });
    half += el("path", { d: shape(0.93), fill: "#9cc24a" });
    half += el("path", { d: shape(0.8), fill: "#d6e28a" });
    const pr = rx * 0.46;
    const py = ry * 0.22;
    if (k === pitAt) {
      // The pit, with a shine
      half += el("circle", { cx: 0, cy: py + pr * 0.08, r: pr, fill: "#000", opacity: "0.15" });
      half += el("circle", { cx: 0, cy: py, r: pr, fill: "#7a4a2a" });
      half += el("circle", { cx: -pr * 0.35, cy: py - pr * 0.35, r: pr * 0.28, fill: "#fff", opacity: "0.25" });
    } else {
      // The hollow the pit left
      half += el("circle", { cx: 0, cy: py, r: pr, fill: "#b9c45a" });
      half += el("circle", { cx: 0, cy: py + pr * 0.12, r: pr * 0.88, fill: "#cfd87a" });
    }
    out += el("g", { transform: s`translate(${x} ${cy}) rotate(${turn})` }, half);
  }
  note.alt(
    count === 2
      ? "Two halves of an avocado on a cutting board, one with the pit"
      : "Half an avocado with its pit on a cutting board",
  );
  note.focus(cx, cy);
  return out;
});

const BROTHS: readonly [string, string][] = [
  ["#f1e3c6", "creamy"],
  ["#c47a3f", "soy"],
  ["#d99a4e", "miso"],
  ["#d9563a", "spicy"],
];

/** A bowl of ramen from above: noodles in broth, with toppings around them. */
export const ramen = defineKind("ramen", "Ramen", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = unit * 0.42;
  const r = R * 0.84;
  let out = fill(w, h, g.pick(["#c89a64", "#a87444", "#2f3a3a", "#e9dccb", "#d9cbb5"]));
  // Bowl: shadow, rim with a ring of pattern, broth
  const bowl = g.pick(["#fbfaf4", "#1f2328", "#c23b22", "#2b5d8a"]);
  out += el("circle", { cx: cx + R * 0.03, cy: cy + R * 0.06, r: R, fill: "#000", opacity: "0.15" });
  out += el("circle", { cx, cy, r: R, fill: bowl });
  out += el("circle", {
    cx,
    cy,
    r: R * 0.92,
    fill: "none",
    stroke: bowl === "#fbfaf4" ? "#2b5d8a" : "#fbfaf4",
    "stroke-width": R * 0.025,
    "stroke-dasharray": `${Math.round(R * 0.08)} ${Math.round(R * 0.05)}`,
    opacity: "0.7",
  });
  const [broth, flavor] = g.pick(BROTHS);
  out += el("circle", { cx, cy, r, fill: broth });
  // Drops of fat on the broth
  let fat = "";
  for (const [x, y] of spread(g, cx, cy, r * 0.9, 9)) fat += s`M${x} ${y}h0.01`;
  out += el("path", { d: fat, stroke: "#fff", "stroke-width": r * 0.05, "stroke-linecap": "round", opacity: "0.3" });
  // Wavy noodles in the middle, clipped to a round heap
  const clip = g.id("noodles");
  const nr = r * 0.55;
  out += el("defs", {}, el("clipPath", { id: clip }, el("circle", { cx, cy, r: nr })));
  let noodles = "";
  const lines = 12;
  for (let k = 0; k < lines; k++) {
    const y = cy - nr + (nr * 2 * (k + 0.5)) / lines;
    const step = nr * 0.22;
    noodles += s`M${cx - nr - g.f(0, step)} ${y}q${step / 2} ${-step * 0.35} ${step} 0`;
    for (let b = 0; b < 12; b++) noodles += s`t${step} 0`;
  }
  out += el("path", {
    d: noodles,
    stroke: "#f3d98b",
    "stroke-width": nr * 0.075,
    fill: "none",
    "clip-path": `url(#${clip})`,
  });
  out += el("circle", { cx, cy, r: nr, fill: "none", stroke: broth, "stroke-width": nr * 0.04, opacity: "0.5" });
  // Pick four or five toppings, in a seeded order, and set them around the noodles
  const pool = ["egg", "pork", "nori", "fishcake", "scallions", "corn", "bamboo"];
  for (let k = pool.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const chosen = pool.slice(0, g.i(4, 5));
  const S = r * 0.37;
  const a0 = g.f(0, Math.PI * 2);
  chosen.forEach((name, k) => {
    const a = a0 + (k * Math.PI * 2) / chosen.length;
    const x = cx + Math.cos(a) * r * 0.56;
    const y = cy + Math.sin(a) * r * 0.56;
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const deg = (a * 180) / Math.PI;
    const tg = g.fork(name);
    if (name === "egg")
      // Two halves of a soft-boiled egg
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.5 * side;
        const ey = y + ty * S * 0.5 * side;
        out += el("ellipse", {
          cx: ex,
          cy: ey,
          rx: S * 0.42,
          ry: S * 0.55,
          fill: "#fbfaf4",
          transform: s`rotate(${deg} ${ex} ${ey})`,
        });
        out += el("circle", { cx: ex, cy: ey, r: S * 0.28, fill: "#f39c2b" });
        out += el("circle", { cx: ex, cy: ey, r: S * 0.15, fill: "#f7b84b" });
      }
    else if (name === "pork")
      // Two slices of chashu, overlapping
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.32 * side;
        const ey = y + ty * S * 0.32 * side;
        out += el("circle", {
          cx: ex,
          cy: ey,
          r: S * 0.55,
          fill: "#e8b49a",
          stroke: "#a0583a",
          "stroke-width": S * 0.1,
        });
        out += el("path", {
          d: s`M ${ex - S * 0.25} ${ey + S * 0.1} q ${S * 0.25} ${-S * 0.35} ${S * 0.45} ${-S * 0.05}`,
          stroke: "#f6dccb",
          "stroke-width": S * 0.08,
          fill: "none",
          "stroke-linecap": "round",
        });
      }
    else if (name === "nori")
      // A sheet of nori tucked in at the edge
      out += el("rect", {
        x: x - S * 0.65 + Math.cos(a) * S * 0.2,
        y: y - S * 0.3 + Math.sin(a) * S * 0.2,
        width: S * 1.3,
        height: S * 0.6,
        rx: S * 0.04,
        fill: "#1f2a22",
        transform: s`rotate(${deg + 90} ${x + Math.cos(a) * S * 0.2} ${y + Math.sin(a) * S * 0.2})`,
      });
    else if (name === "fishcake")
      // Two slices of narutomaki, with a pink swirl
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.48 * side;
        const ey = y + ty * S * 0.48 * side;
        let swirl = s`M ${ex} ${ey}`;
        for (let p = 1; p <= 16; p++) {
          const sa = p * 0.75;
          const sr = S * 0.3 * (p / 16);
          swirl += s` L ${ex + Math.cos(sa) * sr} ${ey + Math.sin(sa) * sr}`;
        }
        out += el("circle", { cx: ex, cy: ey, r: S * 0.42, fill: "#fbfaf4" });
        out += el("path", {
          d: swirl,
          stroke: "#f06292",
          "stroke-width": S * 0.07,
          fill: "none",
          "stroke-linecap": "round",
        });
      }
    else if (name === "scallions") {
      // Rings of green onion
      let d = "";
      for (const [sx, sy] of spread(tg, x, y, S * 0.7, 11))
        d += s`M${sx - S * 0.1} ${sy}a${S * 0.1} ${S * 0.1} 0 1 0 ${S * 0.2} 0a${S * 0.1} ${S * 0.1} 0 1 0 ${-S * 0.2} 0Z`;
      out += el("path", { d, fill: "#c4e6a0", stroke: "#5aa03c", "stroke-width": S * 0.05 });
    } else if (name === "corn") {
      // Kernels of corn
      let d = "";
      for (const [sx, sy] of spread(tg, x, y, S * 0.7, 16)) d += s`M${sx} ${sy}h0.01`;
      out += el("path", { d, stroke: "#f6c945", "stroke-width": S * 0.18, "stroke-linecap": "round" });
    } else {
      // Strips of bamboo shoot
      let d = "";
      for (let p = 0; p < 4; p++) {
        const off = (p - 1.5) * S * 0.28;
        const sx = x + tx * off + Math.cos(a) * tg.f(-0.1, 0.1) * S;
        const sy = y + ty * off + Math.sin(a) * tg.f(-0.1, 0.1) * S;
        d += s`M${sx - Math.cos(a) * S * 0.38} ${sy - Math.sin(a) * S * 0.38}l${Math.cos(a) * S * 0.76} ${Math.sin(a) * S * 0.76}`;
      }
      out += el("path", { d, stroke: "#b8874a", "stroke-width": S * 0.16, "stroke-linecap": "round" });
    }
  });
  const sticks = g.chance(0.7);
  if (sticks) {
    // Chopsticks resting across the bowl
    const y0 = cy - R * g.f(0.45, 0.6);
    const d = s`M ${cx - R * 1.12} ${y0 + R * 0.12} L ${cx + R * 1.12} ${y0 - R * 0.12}
                M ${cx - R * 1.12} ${y0 + R * 0.24} L ${cx + R * 1.12} ${y0 + R * 0.02}`;
    out += el("path", {
      d,
      stroke: "#000",
      "stroke-width": R * 0.05,
      "stroke-linecap": "round",
      opacity: "0.15",
      transform: s`translate(${R * 0.03} ${R * 0.06})`,
    });
    out += el("path", {
      d,
      stroke: g.pick(["#8b5a3c", "#c23b22", "#2b2b2b", "#e8d5b0"]),
      "stroke-width": R * 0.045,
      "stroke-linecap": "round",
    });
  }
  const names: Record<string, string> = {
    egg: "a soft-boiled egg",
    pork: "pork",
    nori: "nori",
    fishcake: "fish cake",
    scallions: "scallions",
    corn: "corn",
    bamboo: "bamboo shoots",
  };
  note.alt(
    `A bowl of ${flavor} ramen with ${andList(chosen.map(c => names[c]))}${sticks ? ", chopsticks across the top" : ""}`,
  );
  note.focus(cx, cy);
  return out;
});

const COOKIES: Record<string, [string, string]> = {
  chip: ["#d9a15b", "chocolate chip"],
  chocolate: ["#5a3522", "fudge"],
  sugar: ["#f3d9a4", "sprinkle"],
  oat: ["#c89254", "oatmeal raisin"],
  jam: ["#e8c48a", "jam"],
  iced: ["#f0cf98", "iced"],
};

/** Cookies on a plate or a baking tray, seen from above. */
export const cookies = defineKind("cookies", "Cookies", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  let out = fill(w, h, hsl(g.f(0, 360), g.f(25, 45), g.f(80, 88)));
  const tray = g.chance(0.4);
  const spots: Point[] = [];
  let c: number;
  if (tray) {
    // Baking tray with parchment; the grid that gives the biggest cookies, among a few
    const tw = w * 0.86;
    const th = h * 0.78;
    const grids: [number, number, number][] = [];
    for (let rows = 1; rows <= 3; rows++)
      for (let cols = 2; cols <= 6; cols++)
        if (rows * cols >= 3 && rows * cols <= 10) grids.push([rows, cols, Math.min(tw / cols, th / rows) * 0.38]);
    const best = Math.max(...grids.map(q => q[2]));
    const [rows, cols, size] = g.pick(grids.filter(q => q[2] >= best * 0.85));
    c = size;
    out += el("rect", {
      x: cx - tw / 2 + unit * 0.01,
      y: cy - th / 2 + unit * 0.02,
      width: tw,
      height: th,
      rx: unit * 0.03,
      fill: "#000",
      opacity: "0.12",
    });
    out += el("rect", { x: cx - tw / 2, y: cy - th / 2, width: tw, height: th, rx: unit * 0.03, fill: "#aab1b8" });
    out += el("rect", {
      x: cx - tw / 2 + unit * 0.025,
      y: cy - th / 2 + unit * 0.025,
      width: tw - unit * 0.05,
      height: th - unit * 0.05,
      rx: unit * 0.015,
      fill: g.chance(0.6) ? "#f4ecd8" : "#bfc5cb",
    });
    for (let rr = 0; rr < rows; rr++)
      for (let cc = 0; cc < cols; cc++)
        spots.push([
          cx - tw / 2 + (tw * (cc + 0.5)) / cols + c * g.f(-0.08, 0.08),
          cy - th / 2 + (th * (rr + 0.5)) / rows + c * g.f(-0.08, 0.08),
        ]);
  } else {
    // Plate: a ring of cookies, with one in the middle when there are five or more
    const P = unit * 0.44;
    out += topPlate(cx, cy, P, g.pick(["#ffffff", "#ffffff", "#d8ebe4", "#f3e6d0", "#dfe7f5"]));
    const count = g.i(3, 7);
    const centered = count >= 5;
    const m = centered ? count - 1 : count;
    const ringK = Math.max(centered ? 2.1 : 0, 1.08 / Math.sin(Math.PI / m));
    c = (P * 0.86) / (ringK + 1);
    if (centered) spots.push([cx + c * g.f(-0.05, 0.05), cy + c * g.f(-0.05, 0.05)]);
    const a0 = g.f(0, Math.PI * 2);
    for (let k = 0; k < m; k++) {
      const a = a0 + (k * Math.PI * 2) / m;
      spots.push([cx + Math.cos(a) * c * ringK, cy + Math.sin(a) * c * ringK]);
    }
  }
  const mixed = g.chance(0.4);
  const one = g.pick(Object.keys(COOKIES));
  const kinds = new Set<string>();
  for (const [x, y] of spots) {
    const kind = mixed ? g.pick(Object.keys(COOKIES)) : one;
    kinds.add(kind);
    const base = COOKIES[kind][0];
    const r = c * g.f(0.92, 1);
    // Shadow, browned edge, and the cookie
    out += el("circle", { cx: x + r * 0.05, cy: y + r * 0.1, r, fill: "#000", opacity: "0.1" });
    out += el("circle", { cx: x, cy: y, r, fill: mix(base, "#000000", 0.15) });
    out += el("path", { d: blob(g, x, y, r * 0.87, r * 0.87, 2, 0.03, 0.04), fill: base });
    const tg = g.fork(`cookie${x}${y}`);
    if (kind === "chip" || kind === "chocolate") {
      let d = "";
      for (const [px, py] of spread(tg, x, y, r * 0.62, 7)) d += s`M${px} ${py}h0.01`;
      out += el("path", {
        d,
        stroke: kind === "chip" ? "#4a2c1d" : "#f5ecd7",
        "stroke-width": r * 0.2,
        "stroke-linecap": "round",
      });
    } else if (kind === "sugar") {
      out += sprinkles(tg, x, y, 0, r * 0.68, 12, r * 0.18, SPRINKLES.slice(0, 4), r * 0.07);
    } else if (kind === "oat") {
      // Oat flakes and raisins
      let flakes = "";
      let raisins = "";
      spread(tg, x, y, r * 0.65, 9).forEach(([px, py], k) => {
        if (k % 3 === 0) raisins += s`M${px} ${py}h0.01`;
        else flakes += s`M${px - r * 0.07} ${py}l${r * 0.14} ${r * 0.04}`;
      });
      out += el("path", { d: flakes, stroke: "#ecd09c", "stroke-width": r * 0.08, "stroke-linecap": "round" });
      out += el("path", { d: raisins, stroke: "#4a2a3a", "stroke-width": r * 0.17, "stroke-linecap": "round" });
    } else if (kind === "jam") {
      out += el("circle", { cx: x, cy: y, r: r * 0.36, fill: mix(base, "#000000", 0.12) });
      out += el("circle", { cx: x, cy: y, r: r * 0.3, fill: "#c1121f" });
      out += el("circle", { cx: x - r * 0.1, cy: y - r * 0.1, r: r * 0.08, fill: "#fff", opacity: "0.4" });
    } else {
      out += el("path", {
        d: blob(tg, x, y, r * 0.7, r * 0.7, 2, 0.04, 0.04),
        fill: tg.pick(["#f7c6d0", "#fbf4e8", "#c9a7eb", "#8fd3f4"]),
      });
    }
  }
  const order = Object.keys(COOKIES).filter(k => kinds.has(k));
  const where = tray ? "on a baking tray" : "on a plate";
  const count = capitalize(numberWord(spots.length));
  note.alt(
    order.length === 1
      ? `${count} ${COOKIES[order[0]][1]} cookies ${where}`
      : `${count} cookies ${where}: ${andList(order.map(k => COOKIES[k][1]))}`,
  );
  note.focus(cx, cy);
  return out;
});

/**
 * A fork's outline, flat, in its own frame: `u` runs from the end of the handle (-len/2) to the
 * tips of the tines (len/2), and `v` across it.
 */
function forkOutline(len: number, width: number, tines: number): Point[] {
  const hw = width * 0.2;
  const tw = width / (tines * 2 - 1);
  const slot = len * 0.3;
  const out: Point[] = [
    [-len / 2, -hw],
    [len * 0.08, -hw * 0.7],
    [len * 0.2, -width / 2],
  ];
  for (let k = 0; k < tines; k++) {
    const v0 = -width / 2 + k * 2 * tw;
    out.push([len / 2, v0], [len / 2, v0 + tw]);
    if (k < tines - 1) out.push([slot, v0 + tw], [slot, v0 + 2 * tw]);
  }
  out.push([len * 0.2, width / 2], [len * 0.08, hw * 0.7], [-len / 2, hw], [-len / 2 - hw * 0.7, 0]);
  return out;
}

/** A dollop of whipped cream with a curled tip, `d` across at its widest, sitting on (x, y). */
function whip(x: number, y: number, d: number): string {
  return (
    el("ellipse", { cx: x, cy: y, rx: d * 1.15, ry: d * 0.5, fill: "#efe7d6" }) +
    el("ellipse", { cx: x, cy: y - d * 0.35, rx: d, ry: d * 0.55, fill: "#fdfaf2" }) +
    el("ellipse", { cx: x, cy: y - d * 0.85, rx: d * 0.65, ry: d * 0.4, fill: "#fdfaf2" }) +
    el("path", {
      d: s`M ${x - d * 0.35} ${y - d * 1.1} Q ${x} ${y - d * 1.7} ${x + d * 0.15} ${y - d * 1.15} Z`,
      fill: "#fdfaf2",
    }) +
    el("path", {
      d: s`M ${x - d * 0.7} ${y - d * 0.4} Q ${x} ${y - d * 0.1} ${x + d * 0.6} ${y - d * 0.55}`,
      stroke: "#e6dcc8",
      "stroke-width": d * 0.12,
      fill: "none",
    })
  );
}

type PieFlavor = {
  /** What the alt text calls it. */
  name: string;
  filling: string;
  /** Pastry or graham crust. */
  crust: string[];
  /** Lattice top, meringue, whipped cream, or a plain baked top. */
  top: "lattice" | "meringue" | "cream" | "plain";
  /** What shows in the cut filling. */
  bits?: "cherry" | "blueberry" | "apple" | "banana";
};

const PASTRY = ["#e3b06a", "#d9a15b", "#e7bd7a"];
const GRAHAM = ["#c58f55", "#b97f45", "#cf9a60"];
const PIES: PieFlavor[] = [
  { name: "lattice-topped cherry", filling: "#b3202f", crust: PASTRY, top: "lattice", bits: "cherry" },
  { name: "lattice-topped blueberry", filling: "#4a3f7a", crust: PASTRY, top: "lattice", bits: "blueberry" },
  { name: "lattice-topped apple", filling: "#c7862f", crust: PASTRY, top: "lattice", bits: "apple" },
  { name: "pumpkin", filling: "#d9822b", crust: PASTRY, top: "plain" },
  { name: "lemon meringue", filling: "#f4d03f", crust: PASTRY, top: "meringue" },
  { name: "key lime", filling: "#dfe8a6", crust: GRAHAM, top: "plain" },
  { name: "banana cream", filling: "#f3e2a0", crust: GRAHAM, top: "cream", bits: "banana" },
  { name: "coconut cream", filling: "#f5efdf", crust: GRAHAM, top: "cream" },
];

/** A slice of pie on a plate, cut open to show its filling, sometimes with cream or a fork. */
export const pie = defineKind("pie", "Slice of pie", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const flavor = g.pick(PIES);
  const crust = g.pick(flavor.crust);
  const wall = hsl(g.f(0, 360), 30, 86);
  const wood = hsl(g.f(20, 40), 35, 62);
  const fork = g.chance(0.4);
  const dollop = flavor.top !== "meringue" && flavor.top !== "cream" && g.chance(0.5);
  // The slice is a wedge on the plate's surface: its tip at T, its crust along an arc of radius R
  // facing `axis` (negative is away from us). Everything is laid out in units of R first, then sized.
  // Points on the plate are (x, z), z toward us, lifted by y; the plate is tipped by `sq`.
  const sq = g.f(0.36, 0.42);
  const tall = Math.sqrt(1 - sq * sq);
  const flip = g.chance(0.5) ? -1 : 1;
  const span = g.f(0.85, 1.02);
  const axis = g.f(-0.75, -0.25);
  const a1 = axis - span / 2;
  const a2 = axis + span / 2;
  const H = g.f(0.26, 0.32);
  const hc = H * 0.15;
  const cw = 0.09;
  const rimH = flavor.top === "lattice" || flavor.top === "plain" ? H * 0.12 : 0;
  const T = flavor.top === "meringue" ? H * g.f(0.7, 0.9) : flavor.top === "cream" ? H * g.f(0.45, 0.6) : 0;
  const Rt = 1 - cw * 0.5;
  const steps = 14;
  const angles: number[] = [];
  for (let k = 0; k <= steps; k++) angles.push(a1 + (span * k) / steps);
  // Center the wedge's footprint on the plate, toward the back when a fork lies in front
  const foot: Point[] = [[0, 0], ...angles.map((a): Point => [Math.cos(a), Math.sin(a)])];
  const xs = foot.map(p => p[0]);
  const zs = foot.map(p => p[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const mz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const rho = Math.max(...foot.map(([x, z]) => Math.hypot(x - mx, z - mz)));
  const plate1 = rho * (fork ? 1.55 : 1.22);
  const tx1 = -mx + g.f(-0.04, 0.04);
  const tz1 = -mz - (fork ? plate1 * 0.27 : 0);
  // How far the slice reaches up, and the plate down, in units of R
  const peak = flavor.top === "meringue" ? H * 0.35 : flavor.top === "cream" ? H * 0.3 : dollop ? H * 0.45 : 0;
  const reach = Math.min(...zs.map(z => (z + tz1) * sq - (H + Math.max(rimH, T) + peak) * tall));
  const low = plate1 * sq * 1.12;
  const R = Math.min((unit * 0.45) / plate1, (h * 0.84) / (low - reach), (w * 0.9) / (2 * plate1));
  const cx = w / 2;
  const plateY = h * 0.52 - ((low + reach) / 2) * R;
  const Rp = plate1 * R;
  const tx = tx1 * R;
  const tz = tz1 * R;
  const P = (x: number, z: number, y: number): Point => [cx + flip * x, plateY + z * sq - y * tall];
  // A point on the wedge: r and y in units of R, at angle a
  const at = (r: number, a: number, y: number): Point => P(tx + r * R * Math.cos(a), tz + r * R * Math.sin(a), y * R);
  const arcAt = (r: number, y: number, from = a1, to = a2): Point[] => {
    const out: Point[] = [];
    for (let k = 0; k <= steps; k++) out.push(at(r, from + ((to - from) * k) / steps, y));
    return out;
  };
  const top = Math.max(0, plateY - Rp * sq - unit * g.f(0.04, 0.1));
  let out = table(g, w, h, Math.max(h * 0.18, top), wall, wood);
  out += sidePlate(cx, plateY, Rp, Rp * sq);
  // A soft shadow under the slice
  out += el("polygon", {
    points: pts([at(0, axis, 0), ...arcAt(1.03, 0)].map(([x, y]): Point => [x, y + R * 0.03])),
    fill: "#000",
    opacity: "0.1",
  });
  const dark = (c: string, t: number) => mix(c, "#000000", t);
  const light = (c: string, t: number) => mix(c, "#ffffff", t);
  // The crust's outer wall, where it turns toward us
  if (a2 > 0) {
    const from = Math.max(a1, 0);
    out += el("polygon", {
      points: pts([...arcAt(1, 0, from, a2), ...arcAt(1, H + rimH, from, a2).reverse()]),
      fill: dark(crust, 0.12),
    });
    if (T)
      out += el("polygon", {
        points: pts([...arcAt(Rt, H, from, a2), ...arcAt(Rt, H + T, from, a2).reverse()]),
        fill: flavor.top === "meringue" ? "#f6ecd6" : "#f3ede0",
      });
  }
  // The cut faces that turn toward us, each a profile of (r, y) on the plane at angle a
  const bits = g.fork("bits");
  for (const [a, shown] of [
    [a1, Math.cos(a1) < 0],
    [a2, Math.cos(a2) > 0],
  ] as const) {
    if (!shown) continue;
    const face = (profile: [number, number][]) => pts(profile.map(([r, y]) => at(r, a, y)));
    const lit = a === a2 ? 0 : 0.1;
    out += el("polygon", {
      points: face([
        [0.03, 0],
        [1, 0],
        [1, H + rimH * 0.6],
        [1 - cw * 0.5, H + rimH],
        [1 - cw, H + rimH * 0.5],
        [1 - cw, hc],
        [0.03, hc * 0.6],
      ]),
      fill: dark(crust, lit),
    });
    out += el("polygon", {
      points: face([
        [0.03, hc * 0.6],
        [1 - cw, hc],
        [1 - cw, H],
        [0.03, H],
      ]),
      fill: dark(flavor.filling, 0.08 + lit),
    });
    if (flavor.bits && Math.abs(Math.cos(a)) > 0.5) {
      // Fruit cut through, spread over the face
      const cols = 7;
      for (let k = 0; k < cols * 2; k++) {
        const r = 0.12 + ((1 - cw - 0.18) * (Math.floor(k / 2) + bits.f(0.25, 0.75))) / cols;
        const y = hc + (H - hc) * ((k % 2) * 0.45 + bits.f(0.25, 0.4));
        const [px, py] = at(r, a, y);
        const size = R * H * 0.16;
        if (flavor.bits === "apple")
          out += el("rect", {
            x: px - size * 1.2,
            y: py - size * 0.5,
            width: size * 2.4,
            height: size,
            rx: size * 0.4,
            fill: "#f6e2a3",
            transform: s`rotate(${bits.f(-25, 25)} ${px} ${py})`,
          });
        else if (flavor.bits === "banana") {
          out += el("circle", { cx: px, cy: py, r: size * 0.8, fill: "#f8f0cc" });
        } else
          out += el("circle", {
            cx: px,
            cy: py,
            r: size * (flavor.bits === "cherry" ? 1 : 0.7),
            fill: flavor.bits === "cherry" ? "#7d0f1f" : "#2b2d5e",
          });
      }
    }
    if (T)
      out += el("polygon", {
        points: face([
          [0.03, H],
          [Rt, H],
          [Rt, H + T],
          [0.03, H + T],
        ]),
        fill: dark(flavor.top === "meringue" ? "#fbf3df" : "#fbf6ea", 0.04 + lit),
      });
  }
  // The top of the filling, with whatever covers it
  const tg = g.fork("top");
  if (T) {
    const surface = flavor.top === "meringue" ? "#f8eacb" : "#fbf6ea";
    out += el("polygon", { points: pts([at(0.03, axis, H + T), ...arcAt(Rt, H + T)]), fill: surface });
    const clip = g.id("pietop");
    out += el(
      "defs",
      {},
      el("clipPath", { id: clip }, el("polygon", { points: pts([at(0.03, axis, H + T), ...arcAt(Rt, H + T)]) })),
    );
    if (flavor.top === "cream" && !flavor.bits) {
      // Toasted coconut flakes
      let d = "";
      for (let k = 0; k < 22; k++) {
        const [px, py] = at(0.2 + tg.f(0, 0.75), a1 + span * tg.f(0.1, 0.9), H + T);
        const dx = R * tg.f(-0.03, 0.03);
        d += s`M${px - dx} ${py - R * 0.008}L${px + dx} ${py + R * 0.008}`;
      }
      out += el("path", {
        d,
        stroke: "#d9a15b",
        "stroke-width": R * 0.018,
        "stroke-linecap": "round",
        "clip-path": `url(#${clip})`,
      });
    }
    if (flavor.bits === "banana")
      // Two slices of banana on the cream
      for (const r of [0.25, 0.62]) {
        const [px, py] = at(r, axis + span * tg.f(-0.15, 0.15), H + T);
        out += el("ellipse", { cx: px, cy: py - R * 0.01, rx: R * 0.055, ry: R * 0.055 * sq * 1.6, fill: "#f8f0cc" });
        out += el("ellipse", { cx: px, cy: py - R * 0.01, rx: R * 0.03, ry: R * 0.03 * sq * 1.6, fill: "#efe0a2" });
      }
    // Peaks of meringue, or rosettes of cream along the crust, from the back forward
    const spots: [Point, number][] = [];
    if (flavor.top === "meringue")
      for (let k = 0; k < 9; k++) {
        const r = 0.25 + 0.6 * Math.sqrt((k + tg.f(0.2, 0.8)) / 9);
        const a = axis + span * (((k * 0.618 + tg.f(0, 0.2)) % 1) - 0.5) * 0.75 * Math.min(1, r / 0.45);
        spots.push([at(r, a, H + T), r]);
      }
    else {
      const m = tg.i(3, 4);
      for (let k = 0; k < m; k++) spots.push([at(0.8, a1 + (span * (k + 0.5)) / m, H + T), 0.8]);
      if (flavor.bits) spots.push([at(0.42, axis, H + T), 0.42]);
    }
    spots.sort((p, q) => p[0][1] - q[0][1]);
    for (const [[px, py], r] of spots) {
      const pw = R * (flavor.top === "meringue" ? 0.07 : 0.08) * (0.7 + r * 0.4);
      const ph = R * peak * tg.f(0.8, 1.1);
      if (flavor.top === "meringue") {
        // A peak of meringue
        out += el("path", {
          d: s`M ${px - pw} ${py} Q ${px - pw * 0.7} ${py - ph * 0.6} ${px} ${py - ph}
               Q ${px + pw * 0.7} ${py - ph * 0.6} ${px + pw} ${py} Q ${px} ${py + pw * 0.5} ${px - pw} ${py} Z`,
          fill: "#fbf3df",
        });
        // The toasted tip
        out += el("path", {
          d: s`M ${px - pw * 0.35} ${py - ph * 0.62} Q ${px} ${py - ph * 1.08} ${px + pw * 0.35} ${py - ph * 0.62}
               Q ${px} ${py - ph * 0.5} ${px - pw * 0.35} ${py - ph * 0.62} Z`,
          fill: "#c98a4a",
        });
      } else out += whip(px, py, pw);
    }
  } else {
    const surface = flavor.top === "plain" ? dark(flavor.filling, 0.04) : dark(flavor.filling, 0.15);
    const topPts = [at(0.03, axis, H), ...arcAt(1 - cw, H)];
    out += el("polygon", { points: pts(topPts), fill: surface });
    if (flavor.top === "lattice") {
      // Fruit showing through, then a lattice laid over the whole pie, clipped to this slice
      const clip = g.id("pietop");
      out += el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: pts(topPts) })));
      let fruit = "";
      for (let k = 0; k < 10; k++) {
        const [px, py] = at(0.15 + 0.8 * tg.next(), a1 + span * tg.next(), H);
        fruit += s`M${px} ${py}h0.01`;
      }
      out += el("path", {
        d: fruit,
        stroke: flavor.bits === "apple" ? "#f3d690" : dark(flavor.filling, 0.35),
        "stroke-width": R * 0.06,
        "stroke-linecap": "round",
        "clip-path": `url(#${clip})`,
      });
      const theta = tg.f(0, Math.PI / 2);
      const gap = tg.f(0.2, 0.24);
      const off = tg.f(0, gap);
      const sw = gap * 0.42;
      let strips = "";
      let shade = "";
      for (const dir of [theta, theta + Math.PI / 2]) {
        const ux = Math.cos(dir);
        const uz = Math.sin(dir);
        for (let c = -1.2 + off; c < 1.2; c += gap) {
          // One strip: a band of width sw at distance c across the pie, at the top's height
          const corner = (along: number, across: number) => {
            const px = tx + (ux * along - uz * across) * R;
            const pz = tz + (uz * along + ux * across) * R;
            return P(px, pz, (H + rimH * 0.4) * R);
          };
          const quad = [corner(-1.2, c), corner(1.2, c), corner(1.2, c + sw), corner(-1.2, c + sw)];
          const d = `M${pts(quad).replace(/ /g, "L")}Z`;
          if (dir === theta) strips += d;
          else shade += d;
        }
      }
      out += el("path", { d: strips, fill: light(crust, 0.08), "clip-path": `url(#${clip})` });
      out += el("path", { d: shade, fill: crust, "clip-path": `url(#${clip})` });
    } else {
      // A faint sheen on the baked top
      out += el("ellipse", {
        ...Object.fromEntries(["cx", "cy"].map((k, i) => [k, at(0.55, axis, H)[i]])),
        rx: R * 0.16,
        ry: R * 0.16 * sq,
        fill: "#fff",
        opacity: "0.15",
      });
    }
    // The raised crust at the edge: the inner wall at the back, then its crimped top
    out += el("polygon", {
      points: pts([...arcAt(1 - cw, H), ...arcAt(1 - cw, H + rimH).reverse()]),
      fill: dark(crust, 0.2),
    });
    out += el("polygon", {
      points: pts([...arcAt(1, H + rimH), ...arcAt(1 - cw, H + rimH).reverse()]),
      fill: light(crust, 0.1),
    });
    out += el("polyline", {
      points: pts(arcAt(1 - cw / 2, H + rimH)),
      fill: "none",
      stroke: dark(crust, 0.1),
      "stroke-width": R * 0.02,
      "stroke-dasharray": `${Math.max(1, Math.round(R * 0.015))} ${Math.max(2, Math.round(R * 0.05))}`,
      "stroke-linecap": "round",
    });
    if (dollop) {
      const [px, py] = at(0.5, axis, H);
      out += whip(px, py, R * 0.11);
    }
  }
  if (fork) {
    // A fork lying on the front of the plate
    const fa = g.f(-0.15, 0.15) + (g.chance(0.5) ? Math.PI : 0);
    const fx = Rp * g.f(-0.08, 0.08);
    const fz = Rp * g.f(0.64, 0.7);
    const flat = forkOutline(Rp * 0.95, Rp * 0.2, 4).map(([u, v]) =>
      P(fx + u * Math.cos(fa) - v * Math.sin(fa), fz + u * Math.sin(fa) + v * Math.cos(fa), Rp * 0.01),
    );
    out += el("polygon", {
      points: pts(flat.map(([x, y]): Point => [x + Rp * 0.015, y + Rp * 0.02])),
      fill: "#000",
      opacity: "0.12",
    });
    out += el("polygon", { points: pts(flat), fill: "#c9ccd1", stroke: "#a9aeb5", "stroke-width": Rp * 0.006 });
  }
  const [fx, fy] = at(0.55, axis, H + T);
  note.focus(fx, fy);
  note.alt(
    `A slice of ${flavor.name} pie${flavor.top === "meringue" ? " with toasted peaks" : ""} on a plate${
      dollop || fork ? `, with ${andList([dollop && "a dollop of cream", fork && "a fork"])}` : ""
    }`,
  );
  return out;
});

const LEAVES = ["#6fae3f", "#8cc152", "#4f8f34", "#a5d36a", "#3f7a35"];
const TOPPINGS: Record<string, [number, number, string]> = {
  // How many pieces, at least and at most, and what the alt text calls them
  egg: [2, 2, "egg"],
  avocado: [2, 3, "avocado"],
  carrot: [3, 4, "carrot"],
  onion: [2, 3, "onion rings"],
  cucumber: [3, 5, "cucumber"],
  tomato: [3, 4, "tomatoes"],
  feta: [5, 7, "feta"],
  crouton: [4, 6, "croutons"],
  olive: [4, 6, "olives"],
};

/** A bowl of salad from above: leaves heaped inside with toppings over them, and sometimes servers. */
export const salad = defineKind("salad", "Salad", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wide = w >= h;
  const main = wide ? w : h;
  const cross = wide ? h : w;
  const backdrop = g.pick(["#c89a64", "#a87444", "#e9dccb", "#d9cbb5", "#dfe7e2", "#f1e6d2"]);
  let out = fill(w, h, backdrop);
  if (g.chance(0.5)) {
    // Boards of a wooden table
    let d = "";
    const gap = unit * g.f(0.22, 0.3);
    for (let y = gap * g.f(0.3, 1); y < h; y += gap) d += s`M0 ${y}H${w}`;
    out += el("path", { d, stroke: "#000", "stroke-width": unit * 0.006, opacity: "0.08" });
  }
  // What lies beside the bowl, in a row along the long side of the picture
  const extra = g.pick(["servers", "servers", "fork", "none"] as const);
  const jugWanted = g.chance(0.35);
  const items: ["servers" | "fork" | "jug", number][] = [];
  if (extra === "servers") items.push(["servers", unit * 0.2]);
  if (extra === "fork") items.push(["fork", unit * 0.11]);
  if (jugWanted && (items.length === 0 || main >= cross * 1.45)) items.push(["jug", unit * 0.26]);
  const gap = unit * 0.06;
  const beside = items.reduce((sum, [, size]) => sum + gap + size, 0);
  const R = Math.min(unit * (items.length ? 0.4 : 0.43), (main * 0.94 - beside) / 2);
  // The bowl and the row, centered together
  let along = main / 2 - beside / 2;
  const cx = wide ? along : w / 2;
  const cy = wide ? h / 2 : along;
  along += R;
  const place = (size: number): Point => {
    along += gap + size / 2;
    const at: Point = wide ? [along, h / 2] : [w / 2, along];
    along += size / 2;
    return at;
  };
  // The bowl: shadow, rim, the inside wall, and the leaves heaped inside it
  // A wooden or terracotta bowl only on a pale table, so it stands out
  const pale = backdrop !== "#c89a64" && backdrop !== "#a87444";
  const bowl = g.pick(["#fbfaf4", "#d8ebe4", "#2b5d8a", "#f3e6d0", ...(pale ? ["#b9824f", "#c96f4a"] : [])]);
  out += el("circle", { cx: cx + R * 0.04, cy: cy + R * 0.07, r: R, fill: "#000", opacity: "0.15" });
  out += el("circle", { cx, cy, r: R, fill: bowl });
  out += el("circle", { cx, cy, r: R * 0.93, fill: mix(bowl, "#000000", 0.12) });
  const r = R * 0.86;
  const clip = g.id("bowl");
  out += el("defs", {}, el("clipPath", { id: clip }, el("circle", { cx, cy, r })));
  const greens = [g.pick(LEAVES), g.pick(LEAVES), g.pick(LEAVES)];
  let leaves = el("circle", { cx, cy, r, fill: mix(greens[0], "#000000", 0.25) });
  let veins = "";
  const lg = g.fork("leaves");
  const byColor = new Map<string, string>();
  for (const [x, y] of spread(lg, cx, cy, r * 0.95, 12)) {
    const lr = r * lg.f(0.32, 0.42);
    const color = lg.chance(0.12) ? "#8e2f5c" : lg.pick(greens);
    const long = lg.chance(0.5);
    byColor.set(
      color,
      (byColor.get(color) ?? "") + blob(lg, x, y, long ? lr : lr * 0.72, long ? lr * 0.72 : lr, 2, 0.18, 0.12),
    );
    const a = lg.f(0, Math.PI);
    veins += s`M${x - Math.cos(a) * lr * 0.6} ${y - Math.sin(a) * lr * 0.6}l${Math.cos(a) * lr * 1.2} ${Math.sin(a) * lr * 1.2}`;
  }
  for (const [color, d] of byColor) leaves += el("path", { d, fill: color });
  leaves += el("path", {
    d: veins,
    stroke: "#fff",
    "stroke-width": r * 0.025,
    opacity: "0.3",
    "stroke-linecap": "round",
  });
  out += el("g", { "clip-path": `url(#${clip})` }, leaves);
  // Three to six toppings, their pieces spread evenly over the leaves, the big ones laid first
  const pool = Object.keys(TOPPINGS);
  for (let k = pool.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const chosen = pool.slice(0, g.i(3, 6));
  const counts = chosen.map(t => g.i(TOPPINGS[t][0], TOPPINGS[t][1]));
  const pieces: string[] = [];
  for (let k = 0; k < Math.max(...counts); k++) chosen.forEach((t, i) => k < counts[i] && pieces.push(t));
  const spots = spread(g, cx, cy, r * 0.74, pieces.length);
  const S = r * 0.21;
  const tg = g.fork("toppings");
  const order = Object.keys(TOPPINGS).filter(t => chosen.includes(t));
  // Round pieces are drawn as dots (a zero-length stroke with round caps), squares as short thick strokes
  const dots = (at: Point[], width: number, color: string, dx = 0, dy = 0, opacity?: string) =>
    el("path", {
      d: at.map(([x, y]) => s`M${x + dx} ${y + dy}h0.01`).join(""),
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      opacity,
    });
  const rings = (at: Point[], radius: number, width: number, color: string) =>
    el("path", {
      d: at
        .map(
          ([x, y]) =>
            s`M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
        )
        .join(""),
      stroke: color,
      "stroke-width": width,
      fill: "none",
    });
  const squares = (at: Point[], side: number, color: string) =>
    el("path", {
      d: at
        .map(([x, y]) => {
          const a = tg.f(0, Math.PI);
          return s`M${x - (Math.cos(a) * side) / 2} ${y - (Math.sin(a) * side) / 2}l${Math.cos(a) * side} ${Math.sin(a) * side}`;
        })
        .join(""),
      stroke: color,
      "stroke-width": side,
    });
  for (const name of order) {
    const at = spots.filter((_, k) => pieces[k] === name);
    if (name === "egg")
      for (const [x, y] of at) {
        // Half a boiled egg
        out += el("ellipse", {
          cx: x,
          cy: y,
          rx: S * 0.75,
          ry: S * 0.55,
          fill: "#fbfaf4",
          transform: s`rotate(${tg.f(0, 180)} ${x} ${y})`,
        });
        out += el("circle", { cx: x, cy: y, r: S * 0.32, fill: "#f6c13a" });
      }
    else if (name === "avocado")
      for (const [x, y] of at)
        out += el("ellipse", {
          cx: x,
          cy: y,
          rx: S * 0.8,
          ry: S * 0.32,
          fill: "#c6d97a",
          stroke: "#4f7a2a",
          "stroke-width": S * 0.08,
          transform: s`rotate(${tg.f(0, 180)} ${x} ${y})`,
        });
    else if (name === "carrot") {
      // Ribbons of carrot, curling
      let d = "";
      for (const [x, y] of at) {
        const a = tg.f(0, Math.PI);
        const [ux, uy] = [Math.cos(a) * S * 0.8, Math.sin(a) * S * 0.8];
        d += s`M${x - ux} ${y - uy}q${ux * 0.5 + uy * 0.5} ${uy * 0.5 - ux * 0.5} ${ux} ${uy}t${ux} ${uy}`;
      }
      out += el("path", { d, stroke: "#f08a2c", "stroke-width": S * 0.22, fill: "none", "stroke-linecap": "round" });
    } else if (name === "onion") {
      out += rings(at, S * 0.55, S * 0.1, "#9b4d8c");
      out += rings(at, S * 0.32, S * 0.08, "#c88ab8");
    } else if (name === "cucumber") {
      out += dots(at, S * 1.2, "#4f8a3a");
      out += dots(at, S * 1.0, "#dff0b8");
      out += dots(at, S * 0.4, "#c2dd8e");
    } else if (name === "tomato") {
      // Cherry tomatoes cut in half
      out += dots(at, S * 0.96, "#e0384f");
      out += dots(at, S * 0.6, "#f27b7b");
      out += dots(at, S * 0.16, "#fff", -S * 0.15, -S * 0.17, "0.5");
    } else if (name === "feta") out += squares(at, S * 0.5, "#f7f5ec");
    else if (name === "crouton") out += squares(at, S * 0.6, "#d9a35b");
    else out += rings(at, S * 0.24, S * 0.16, "#2b2b2b");
  }
  // What lies beside the bowl
  const wood = g.pick(["#c8955c", "#a8743f", "#d9b07a"]);
  const shadowed = (body: string, x: number, y: number, flat: string) =>
    el("g", { transform: s`translate(${x + unit * 0.01} ${y + unit * 0.018})`, fill: "#000", opacity: "0.15" }, flat) +
    el("g", { transform: s`translate(${x} ${y})` }, body);
  for (const [item, size] of items) {
    const [x, y] = place(size);
    // Each is drawn lengthwise across the row, around (0, 0)
    const len = Math.min(cross * 0.82, R * 2.1);
    const turn = wide ? "" : "rotate(90)";
    if (item === "servers") {
      let shape = "";
      for (const side of [-1, 1]) {
        const sx = side * size * 0.25;
        shape += el("rect", {
          x: sx - unit * 0.016,
          y: -len * 0.1,
          width: unit * 0.032,
          height: len * 0.6,
          rx: unit * 0.016,
        });
        shape +=
          side < 0
            ? el("ellipse", { cx: sx, cy: -len * 0.3, rx: size * 0.22, ry: len * 0.21 })
            : el("polygon", {
                points: pts(forkOutline(len * 0.5, size * 0.42, 3).map(([u, v]): Point => [sx + v, -len * 0.2 - u])),
              });
      }
      const body = `<g transform="${turn}" fill="${wood}">${shape}</g>`;
      out += shadowed(body, x, y, `<g transform="${turn}">${shape}</g>`);
      // The hollow of the spoon
      out += el("ellipse", {
        cx: 0,
        cy: 0,
        rx: size * 0.15,
        ry: len * 0.15,
        fill: "#000",
        opacity: "0.1",
        transform: s`translate(${x} ${y}) ${turn} translate(${-size * 0.25} ${-len * 0.3})`,
      });
    } else if (item === "fork") {
      const shape = el("polygon", {
        points: pts(forkOutline(len * 0.75, size * 0.7, 4).map(([u, v]): Point => [v, -u])),
        transform: turn || undefined,
      });
      out += shadowed(shape.replace("<polygon", '<polygon fill="#c9ccd1"'), x, y, shape);
    } else {
      // A little jug of dressing seen from above: handle, body, dressing and its spout
      const jr = size * 0.38;
      const dressing = g.pick(["#d9a83a", "#f3eedf", "#b5652e", "#e8d27a"]);
      const shape = el("circle", { cx: 0, cy: 0, r: jr });
      const body =
        el("path", {
          d: s`M${jr * 0.6} ${-jr * 0.55}C${jr * 1.7} ${-jr * 0.7} ${jr * 1.7} ${jr * 0.7} ${jr * 0.6} ${jr * 0.55}`,
          fill: "none",
          stroke: "#fbfaf4",
          "stroke-width": jr * 0.2,
        }) +
        el("path", { d: s`M${-jr * 0.7} ${-jr * 0.55}L${-jr * 1.35} 0L${-jr * 0.7} ${jr * 0.55}Z`, fill: "#fbfaf4" }) +
        el("circle", { cx: 0, cy: 0, r: jr, fill: "#fbfaf4" }) +
        el("circle", { cx: 0, cy: 0, r: jr * 0.78, fill: dressing }) +
        el("circle", { cx: -jr * 0.25, cy: -jr * 0.25, r: jr * 0.15, fill: "#fff", opacity: "0.4" });
      out += shadowed(body, x, y, shape);
    }
  }
  const names = order.map(t => TOPPINGS[t][2]);
  const side = items.map(([item]) => ({ servers: "salad servers", fork: "a fork", jug: "a jug of dressing" })[item]);
  note.alt(`A bowl of salad with ${andList(names)}${side.length ? `, ${andList(side)} beside it` : ""}`);
  note.focus(cx, cy);
  return out;
});
