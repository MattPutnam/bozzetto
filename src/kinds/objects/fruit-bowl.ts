import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList, tally } from "../../draw/words";

/** A bowl of apples, oranges, pears and bananas on a table. */
export const fruitBowl = /* @__PURE__ */ defineKind("fruit-bowl", "Fruit bowl", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.6, 0.68);
  const cx = w / 2;
  const bowlW = unit * g.f(0.42, 0.5);
  const rimY = h * g.f(0.6, 0.66);
  const depth = unit * 0.22;
  const bowl = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f4f4f", "#d9b44a"]);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(80, 88)), hsl(g.f(15, 40), g.f(25, 40), g.f(45, 62)));
  // Shadow
  out += el("ellipse", {
    cx,
    cy: rimY + depth * 1.02,
    rx: bowlW * 0.85,
    ry: unit * 0.035,
    fill: "#000",
    opacity: "0.12",
  });
  // The bowl's opening, drawn before the fruit: a rim, and the shadowed inside seen past it.
  const rimRy = unit * 0.045;
  const rim = mix(bowl, "#ffffff", 0.25);
  out += el("ellipse", { cx, cy: rimY, rx: bowlW, ry: rimRy, fill: rim });
  out += el("ellipse", {
    cx,
    cy: rimY + rimRy * 0.08,
    rx: bowlW * 0.95,
    ry: rimRy * 0.78,
    fill: mix(bowl, "#000000", 0.35),
  });
  // Fruit sits in two rows, sunk into the bowl. The front row is spread across the bowl with some jitter;
  // the back row sits higher, only in the gaps between front fruits, so nothing hides directly behind another.
  type Fruit = { x: number; y: number; draw: (x: number, y: number) => string };
  const fruits: Fruit[] = [];
  const front = g.i(3, 4);
  const slot = (bowlW * 1.5) / front;
  const place: { x: number; row: number }[] = [];
  for (let k = 0; k < front; k++)
    place.push({ x: cx - bowlW * 0.75 + slot * (k + 0.5) + g.f(-0.12, 0.12) * slot, row: 0 });
  for (let k = 0; k < front - 1; k++) {
    if (front === 4 && g.chance(0.3)) continue;
    const gap = (place[k].x + place[k + 1].x) / 2;
    place.push({ x: gap + g.f(-0.1, 0.1) * slot, row: 1 });
  }
  const kinds: string[] = [];
  for (const spot of place) {
    const kind = g.pick(["apple", "apple", "orange", "pear", "lemon", "banana"]);
    kinds.push(kind);
    const r = unit * g.f(0.08, 0.105);
    // Every fruit's lowest point lands about r below its y, so rows line up whatever the shape:
    // pears and lemons are shorter below their center than an apple, so they sit a little lower.
    // The back row sits only slightly higher than the front, so its bottoms stay below the near rim.
    const drop = kind === "pear" ? r * 0.28 : kind === "lemon" ? r * 0.1 : 0;
    const x = spot.x;
    const y = (spot.row === 0 ? rimY - r * g.f(0.05, 0.35) : rimY - r * g.f(0.38, 0.58)) + drop;
    fruits.push({
      x,
      y,
      draw: (fx, fy) => {
        switch (kind) {
          case "apple": {
            // Apple, stalk and leaf
            const color = g.pick(["#d62839", "#8cc63f", "#e8573f", "#b5172b"]);
            return (
              el("circle", { cx: fx, cy: fy, r, fill: color }) +
              el("path", {
                d: s`M ${fx} ${fy - r * 0.8}
                     q ${r * 0.05} ${-r * 0.35} ${r * 0.15} ${-r * 0.45}`,
                stroke: "#5a3d2b",
                "stroke-width": r * 0.12,
                fill: "none",
                "stroke-linecap": "round",
              }) +
              el("ellipse", {
                cx: fx + r * 0.35,
                cy: fy - r * 1.1,
                rx: r * 0.3,
                ry: r * 0.13,
                fill: "#4caf50",
                transform: s`rotate(-25 ${fx + r * 0.35} ${fy - r * 1.1})`,
              })
            );
          }
          case "orange":
            // Orange and its stem end
            return (
              el("circle", { cx: fx, cy: fy, r: r * 1.05, fill: "#f28c28" }) +
              el("circle", { cx: fx + r * 0.2, cy: fy - r * 0.55, r: r * 0.08, fill: "#6b8e23" })
            );
          case "lemon":
            return el("ellipse", {
              cx: fx,
              cy: fy,
              rx: r * 1.15,
              ry: r * 0.85,
              fill: "#f6d33c",
              transform: s`rotate(${g.f(-20, 20)} ${fx} ${fy})`,
            });
          case "pear":
            // Pear and its stalk
            return (
              el("path", {
                d: s`M ${fx} ${fy - r * 1.4}
                     C ${fx + r * 0.5} ${fy - r * 1.4} ${fx + r * 0.35} ${fy - r * 0.5} ${fx + r * 0.95} ${fy + r * 0.2}
                     C ${fx + r * 1.2} ${fy + r * 0.9} ${fx - r * 1.2} ${fy + r * 0.9} ${fx - r * 0.95} ${fy + r * 0.2}
                     C ${fx - r * 0.35} ${fy - r * 0.5} ${fx - r * 0.5} ${fy - r * 1.4} ${fx} ${fy - r * 1.4}
                     Z`,
                fill: g.pick(["#b5c94a", "#d9b44a", "#a0b83a"]),
              }) +
              el("path", {
                d: s`M ${fx} ${fy - r * 1.35}
                     l ${r * 0.08} ${-r * 0.3}`,
                stroke: "#5a3d2b",
                "stroke-width": r * 0.1,
                "stroke-linecap": "round",
              })
            );
          default: {
            // A banana is flatter than round fruit, so it sits lower to rest on the same surface.
            const by = fy + r * 0.45;
            return el("path", {
              d: s`M ${fx - r * 1.6} ${by - r * 0.6}
                   Q ${fx} ${by + r * 1.2} ${fx + r * 1.6} ${by - r * 0.7}
                   Q ${fx} ${by + r * 0.4} ${fx - r * 1.6} ${by - r * 0.6}
                   Z`,
              fill: "#f4d03f",
              stroke: "#c9a227",
              "stroke-width": r * 0.06,
            });
          }
        }
      },
    });
  }
  fruits.sort((a, b) => a.y - b.y);
  // Name each kind of fruit once: "apples" for several, "an apple" for one.
  const fruitNames = tally(kinds, name => `${name}s`, true).map(phrase => phrase.replace(/^a ([ao])/, "an $1"));
  note.alt(`A bowl of ${andList(fruitNames)} on a table`);
  note.focus(cx, fruits.reduce((sum, fruit) => sum + fruit.y, 0) / fruits.length);
  for (const fruit of fruits) out += fruit.draw(fruit.x, fruit.y);
  // The bowl's body in front of the fruit: its top edge is the near half of the rim, so fruit shows above it.
  out += el("path", {
    d: s`M ${cx - bowlW} ${rimY}
         A ${bowlW} ${rimRy} 0 0 0 ${cx + bowlW} ${rimY}
         Q ${cx + bowlW * 0.95} ${rimY + depth} ${cx} ${rimY + depth}
         Q ${cx - bowlW * 0.95} ${rimY + depth} ${cx - bowlW} ${rimY}
         Z`,
    fill: bowl,
  });
  // Near rim
  out += el("path", {
    d: s`M ${cx - bowlW} ${rimY}
         A ${bowlW} ${rimRy} 0 0 0 ${cx + bowlW} ${rimY}`,
    stroke: rim,
    "stroke-width": unit * 0.014,
    fill: "none",
  });
  // Highlight
  out += el("path", {
    d: s`M ${cx - bowlW * 0.7} ${rimY + depth * 0.35}
         Q ${cx - bowlW * 0.5} ${rimY + depth * 0.75} ${cx - bowlW * 0.2} ${rimY + depth * 0.82}`,
    stroke: "#fff",
    "stroke-width": unit * 0.012,
    fill: "none",
    opacity: "0.35",
    "stroke-linecap": "round",
  });
  return out;
});
