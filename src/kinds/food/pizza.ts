import { defineKind, el, fill, type Point, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { andList, numberWord } from "../../draw/words";

/** A whole pizza from above, cut into slices, with toppings. */
export const pizza = /* @__PURE__ */ defineKind(
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
