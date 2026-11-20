import { el, hsl, mix, pts, s } from "../src/core";
import { blob, sketch, table } from "./shared";

/** A bowl of apples, oranges, pears and bananas on a table. */
export const fruitBowl = sketch("fruit-bowl", "Fruit bowl", "object", (g, w, h) => {
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
  for (const spot of place) {
    const kind = g.pick(["apple", "apple", "orange", "pear", "lemon", "banana"]);
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

/** A vase of round flowers on a table. */
export const flowers = sketch("flowers", "Vase of flowers", "object", (g, w, h) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.74, 0.8);
  const cx = w / 2 + w * g.f(-0.05, 0.05);
  const vaseW = unit * g.f(0.1, 0.14);
  const vaseH = unit * g.f(0.24, 0.3);
  const vaseY = top + unit * 0.02;
  const vase = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f6b58", "#e8b04b", "#7a5c9e"]);
  const petalHue = g.f(0, 360);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  // Stems
  const count = g.i(3, 6);
  const heads: { x: number; y: number; r: number }[] = [];
  let stems = "";
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const x = cx + (t - 0.5) * unit * g.f(0.45, 0.6);
    const y = vaseY - vaseH - unit * g.f(0.12, 0.3) * (1 - Math.abs(t - 0.5));
    heads.push({ x, y, r: unit * g.f(0.06, 0.09) });
    stems += s`M ${cx + (t - 0.5) * vaseW * 0.6} ${vaseY - vaseH * 0.8} Q ${cx + (t - 0.5) * vaseW} ${(y + vaseY - vaseH) / 2} ${x} ${y} `;
  }
  out += el("path", { d: stems.trim(), stroke: "#4b7a2a", "stroke-width": unit * 0.012, fill: "none" });
  // Leaves
  for (let k = g.i(1, 3); k > 0; k--) {
    const leafX = cx + g.f(-1, 1) * unit * 0.12;
    const leafY = vaseY - vaseH - unit * g.f(0.03, 0.1);
    out += el("ellipse", {
      cx: leafX,
      cy: leafY,
      rx: unit * 0.055,
      ry: unit * 0.02,
      fill: "#5e9c3a",
      transform: s`rotate(${g.f(-50, 50)} ${leafX} ${leafY})`,
    });
  }
  // Flower heads and their centers
  for (const head of heads) {
    const hue = petalHue + g.f(-40, 40);
    const lobes = g.i(5, 8);
    out += el("path", {
      d: blob(g, head.x, head.y, head.r, head.r, lobes, 0.28, 0.04),
      fill: hsl(hue, g.f(60, 85), g.f(60, 75)),
    });
    out += el("circle", {
      cx: head.x,
      cy: head.y,
      r: head.r * 0.35,
      fill: g.pick(["#f6c945", "#5a3d2b", "#fff4dd"]),
    });
  }
  // Vase
  const shape = g.pick(["round", "tall", "jar"]);
  const vaseTop = vaseY - vaseH;
  const neck = vaseW * (shape === "jar" ? 0.9 : 0.45);
  const d =
    shape === "round"
      ? s`M ${cx - neck} ${vaseTop}
          C ${cx - neck} ${vaseTop + vaseH * 0.25} ${cx - vaseW * 1.5} ${vaseTop + vaseH * 0.35} ${cx - vaseW * 1.2} ${vaseY - vaseH * 0.1}
          Q ${cx - vaseW * 1.05} ${vaseY} ${cx} ${vaseY}
          Q ${cx + vaseW * 1.05} ${vaseY} ${cx + vaseW * 1.2} ${vaseY - vaseH * 0.1}
          C ${cx + vaseW * 1.5} ${vaseTop + vaseH * 0.35} ${cx + neck} ${vaseTop + vaseH * 0.25} ${cx + neck} ${vaseTop}
          Z`
      : shape === "tall"
        ? s`M ${cx - neck} ${vaseTop}
            Q ${cx - vaseW * 1.1} ${vaseTop + vaseH * 0.6} ${cx - vaseW * 0.75} ${vaseY}
            H ${cx + vaseW * 0.75}
            Q ${cx + vaseW * 1.1} ${vaseTop + vaseH * 0.6} ${cx + neck} ${vaseTop}
            Z`
        : s`M ${cx - neck} ${vaseTop + vaseH * 0.25}
            Q ${cx - vaseW} ${vaseY} ${cx - vaseW * 0.6} ${vaseY}
            H ${cx + vaseW * 0.6}
            Q ${cx + vaseW} ${vaseY} ${cx + neck} ${vaseTop + vaseH * 0.25}
            Z`;
  out += el("ellipse", { cx, cy: vaseY, rx: vaseW * 1.3, ry: unit * 0.02, fill: "#000", opacity: "0.12" });
  out += el("path", { d, fill: vase });
  // Lip of the vase
  out += el("rect", {
    x: cx - neck * 1.15,
    y: (shape === "jar" ? vaseTop + vaseH * 0.25 : vaseTop) - unit * 0.015,
    width: neck * 2.3,
    height: unit * 0.025,
    rx: unit * 0.01,
    fill: mix(vase, "#000000", 0.15),
  });
  return out;
});

/** A cactus or succulent in a terracotta pot. */
export const cactus = sketch("cactus", "Potted cactus", "object", (g, w, h) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.78, 0.84);
  const cx = w / 2;
  const potW = unit * g.f(0.16, 0.2);
  const potH = unit * g.f(0.2, 0.25);
  const potY = top + unit * 0.02;
  const pot = g.pick(["#c4572f", "#d97b4f", "#e9e3d5", "#3e6d8e", "#2b2b2b", "#e8b04b"]);
  const green = hsl(g.f(95, 150), g.f(30, 50), g.f(38, 50));
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(50, 64)));
  const rimY = potY - potH;
  if (g.chance(0.6)) {
    // A columnar cactus
    const stemW = potW * g.f(0.55, 0.7);
    const stemH = unit * g.f(0.3, 0.42);
    const stemTop = rimY - stemH;
    // Arms
    const arms: string[] = [];
    for (const side of [-1, 1])
      if (g.chance(0.7)) {
        const armY = rimY - stemH * g.f(0.35, 0.6);
        const reach = stemW * g.f(1.1, 1.5);
        const rise = stemH * g.f(0.2, 0.4);
        arms.push(s`M ${cx} ${armY} H ${cx + side * reach} V ${armY - rise}`);
      }
    if (arms.length)
      out += el("path", {
        d: arms.join(" "),
        stroke: green,
        "stroke-width": stemW * 0.75,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none",
      });
    // Stem
    out += el("rect", {
      x: cx - stemW / 2,
      y: stemTop,
      width: stemW,
      height: stemH + unit * 0.02,
      rx: stemW / 2,
      fill: green,
    });
    // Ribs
    out += el("path", {
      d: s`M ${cx - stemW * 0.18} ${stemTop + stemW * 0.3} V ${rimY}
           M ${cx + stemW * 0.18} ${stemTop + stemW * 0.3} V ${rimY}`,
      stroke: "#000",
      "stroke-opacity": "0.12",
      "stroke-width": stemW * 0.06,
      "stroke-linecap": "round",
    });
    // Flower on top
    if (g.chance(0.5))
      out += el("path", {
        d: blob(g, cx, stemTop + stemW * 0.05, stemW * 0.28, stemW * 0.22, 5, 0.3, 0.03),
        fill: hsl(g.f(320, 380), 75, 68),
      });
  } else {
    // A succulent: a fan of leaves around a pale heart
    const leaves = g.i(7, 11);
    const spread = potW * g.f(1.1, 1.4);
    const cy = rimY - unit * 0.05;
    for (let k = 0; k < leaves; k++) {
      const angle = Math.PI + (k / (leaves - 1)) * Math.PI;
      const leafX = cx + Math.cos(angle) * spread * 0.55;
      const leafY = cy + Math.sin(angle) * spread * 0.55;
      out += el("ellipse", {
        cx: leafX,
        cy: leafY,
        rx: spread * 0.5,
        ry: spread * 0.17,
        fill: green,
        transform: s`rotate(${(angle * 180) / Math.PI} ${leafX} ${leafY})`,
      });
    }
    out += el("ellipse", { cx, cy, rx: spread * 0.32, ry: spread * 0.25, fill: hsl(g.f(95, 150), 40, 58) });
  }
  // Pot: shadow, body, and rim
  out += el("ellipse", { cx, cy: potY, rx: potW * 1.1, ry: unit * 0.018, fill: "#000", opacity: "0.12" });
  out += el("polygon", {
    points: pts([
      [cx - potW, rimY],
      [cx + potW, rimY],
      [cx + potW * 0.75, potY],
      [cx - potW * 0.75, potY],
    ]),
    fill: pot,
  });
  out += el("rect", {
    x: cx - potW * 1.1,
    y: rimY - unit * 0.045,
    width: potW * 2.2,
    height: unit * 0.055,
    rx: unit * 0.008,
    fill: mix(pot, "#ffffff", 0.12),
  });
  return out;
});

/** A cup of coffee on a saucer, or a mug, with steam. */
export const coffee = sketch("coffee", "Coffee", "object", (g, w, h) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.68, 0.76);
  const cx = w / 2 - unit * 0.03;
  const cupW = unit * g.f(0.17, 0.21);
  const cupH = cupW * g.f(0.9, 1.15);
  const bottomY = top + unit * 0.06;
  const mug = g.chance(0.4);
  const cup = g.pick(["#f4f1ea", "#3e6d8e", "#c4572f", "#e8b04b", "#2f6b58", "#e9a5b5"]);
  const dark = mix(cup, "#000000", 0.15);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(48, 62)));
  if (!mug) {
    // Saucer
    out += el("ellipse", { cx, cy: bottomY, rx: cupW * 1.7, ry: cupW * 0.32, fill: dark });
    out += el("ellipse", { cx, cy: bottomY - cupW * 0.05, rx: cupW * 1.6, ry: cupW * 0.27, fill: cup });
  } else {
    // Shadow
    out += el("ellipse", { cx, cy: bottomY, rx: cupW * 1.2, ry: cupW * 0.18, fill: "#000", opacity: "0.12" });
  }
  const topY = bottomY - cupH;
  // Handle
  out += el("path", {
    d: s`M ${cx + cupW * 0.9} ${topY + cupH * 0.25}
         c ${cupW * 0.55} ${-cupH * 0.05} ${cupW * 0.6} ${cupH * 0.55} ${cupW * 0.02} ${cupH * 0.6}`,
    stroke: cup,
    "stroke-width": cupW * 0.16,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Body: a straight-sided mug or a rounded cup
  out += mug
    ? el("path", {
        d: s`M ${cx - cupW} ${topY}
             V ${bottomY - cupW * 0.12}
             Q ${cx - cupW} ${bottomY} ${cx - cupW * 0.85} ${bottomY}
             H ${cx + cupW * 0.85}
             Q ${cx + cupW} ${bottomY} ${cx + cupW} ${bottomY - cupW * 0.12}
             V ${topY}
             Z`,
        fill: cup,
      })
    : el("path", {
        d: s`M ${cx - cupW} ${topY}
             Q ${cx - cupW} ${bottomY} ${cx} ${bottomY}
             Q ${cx + cupW} ${bottomY} ${cx + cupW} ${topY}
             Z`,
        fill: cup,
      });
  // Rim and coffee
  out += el("ellipse", { cx, cy: topY, rx: cupW, ry: cupW * 0.22, fill: dark });
  out += el("ellipse", {
    cx,
    cy: topY + cupW * 0.03,
    rx: cupW * 0.88,
    ry: cupW * 0.17,
    fill: g.pick(["#5a3622", "#7b4a2e", "#c69c6d"]),
  });
  if (g.chance(0.5))
    // Latte art
    out += el("path", {
      d: s`M ${cx - cupW * 0.25} ${topY + cupW * 0.02}
           Q ${cx} ${topY - cupW * 0.12} ${cx + cupW * 0.25} ${topY + cupW * 0.02}
           Q ${cx} ${topY + cupW * 0.14} ${cx - cupW * 0.25} ${topY + cupW * 0.02}
           Z`,
      fill: "#f1dfc4",
      opacity: "0.9",
    });
  // Steam
  let steam = "";
  for (let k = -1; k <= 1; k++) {
    const sx = cx + k * cupW * 0.35;
    const len = cupH * g.f(0.6, 0.9);
    steam += s`M ${sx} ${topY - cupW * 0.15} q ${cupW * 0.18} ${-len * 0.25} 0 ${-len * 0.5} t 0 ${-len * 0.5} `;
  }
  out += el("path", {
    d: steam.trim(),
    stroke: "#fff",
    "stroke-width": cupW * 0.07,
    fill: "none",
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  return out;
});

/** Books standing and leaning on a shelf, sometimes with a small plant. */
export const books = sketch("books", "Bookshelf", "object", (g, w, h) => {
  const unit = Math.min(w, h);
  const shelfY = h * g.f(0.74, 0.8);
  const wall = hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90));
  const hue = g.f(0, 360);
  // Wall
  let out = el("rect", { width: w, height: h, fill: wall });
  // Shelf and the shadow under it
  out += el("rect", { y: shelfY, width: w, height: h * 0.05, fill: hsl(g.f(20, 35), 35, 45) });
  out += el("rect", { y: shelfY + h * 0.05, width: w, height: h * 0.02, fill: "#000", opacity: "0.1" });
  let x = w * g.f(0.04, 0.12);
  const end = w * g.f(0.85, 0.96);
  const plantAt = g.chance(0.5) ? g.i(2, 5) : -1;
  for (let k = 0; x < end; k++) {
    if (k === plantAt) {
      // A small potted plant
      const potR = unit * 0.06;
      out += el("polygon", {
        points: pts([
          [x, shelfY - potR * 1.6],
          [x + potR * 1.6, shelfY - potR * 1.6],
          [x + potR * 1.3, shelfY],
          [x + potR * 0.3, shelfY],
        ]),
        fill: "#c4572f",
      });
      out += el("path", {
        d: blob(g, x + potR * 0.8, shelfY - potR * 2.6, potR * 1.1, potR * 1.0, 6, 0.25, 0.08),
        fill: "#4f8a5a",
      });
      x += potR * 1.6 + unit * 0.03;
      continue;
    }
    const bookW = unit * g.f(0.04, 0.075);
    const bookH = h * g.f(0.28, 0.45);
    const color = hsl(hue + g.f(-70, 70), g.f(30, 60), g.f(30, 65));
    const lean = x > w * 0.4 && g.chance(0.12) ? g.f(8, 18) : 0;
    // A pale band across some spines
    const band = g.chance(0.6)
      ? el("rect", {
          x,
          y: shelfY - bookH * g.f(0.75, 0.85),
          width: bookW,
          height: bookH * 0.06,
          fill: "#fff",
          opacity: "0.45",
        })
      : "";
    const book = el("rect", { x, y: shelfY - bookH, width: bookW, height: bookH, fill: color }) + band;
    // A leaning book tips over its bottom right corner.
    out += lean ? el("g", { transform: s`rotate(${lean} ${x + bookW} ${shelfY})` }, book) : book;
    x += bookW + (lean ? bookH * Math.sin((lean * Math.PI) / 180) : unit * 0.004);
  }
  return out;
});

const MORANDI = ["#c9b8a4", "#a89f91", "#8e9aa0", "#d7cbb7", "#b07d62", "#6f7d74", "#e3dccf", "#9c8b7a", "#7f8c9a"];

/** Bottles, jars and boxes in muted colors, after Morandi's still lifes. */
export const bottles = sketch("bottles", "Bottles", "object", (g, w, h) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.66, 0.72);
  const base = h * g.f(0.8, 0.86);
  // Wall and tabletop
  let out = el("rect", { width: w, height: h, fill: g.pick(["#e6ddd0", "#d9d4c7", "#e8e1d6", "#cfd3cc"]) });
  out += el("rect", { y: top, width: w, height: h - top, fill: g.pick(["#cdbfa9", "#c3baa8", "#d4c7b0"]) });
  const count = g.i(3, 5);
  const items: { x: number; draw: string; z: number }[] = [];
  for (let k = 0; k < count; k++) {
    const x = w * (0.2 + (0.6 * (k + g.f(0.2, 0.8))) / count);
    const z = g.f(0, 1);
    const y = base - z * (base - top) * 0.6;
    const color = g.pick(MORANDI);
    const shade = mix(color, "#000000", 0.12);
    const kind = g.pick(["bottle", "bottle", "jar", "box", "vase"]);
    const itemW = unit * g.f(0.06, 0.1);
    const itemH = unit * g.f(0.25, 0.5);
    let markup: string;
    if (kind === "bottle")
      // Bottle with shoulders and a neck
      markup = el("path", {
        d: s`M ${x - itemW} ${y}
             V ${y - itemH * 0.6}
             Q ${x - itemW} ${y - itemH * 0.72} ${x - itemW * 0.35} ${y - itemH * 0.78}
             V ${y - itemH}
             H ${x + itemW * 0.35}
             V ${y - itemH * 0.78}
             Q ${x + itemW} ${y - itemH * 0.72} ${x + itemW} ${y - itemH * 0.6}
             V ${y}
             Z`,
        fill: color,
      });
    else if (kind === "jar")
      // Jar and its lid
      markup =
        el("rect", {
          x: x - itemW * 1.3,
          y: y - itemH * 0.5,
          width: itemW * 2.6,
          height: itemH * 0.5,
          rx: itemW * 0.3,
          fill: color,
        }) +
        el("rect", {
          x: x - itemW * 1.1,
          y: y - itemH * 0.56,
          width: itemW * 2.2,
          height: itemH * 0.08,
          fill: shade,
        });
    else if (kind === "box")
      // Box and its lit top face
      markup =
        el("rect", {
          x: x - itemW * 1.2,
          y: y - itemH * 0.42,
          width: itemW * 2.4,
          height: itemH * 0.42,
          fill: color,
        }) +
        el("polygon", {
          points: s`${x - itemW * 1.2},${y - itemH * 0.42} ${x + itemW * 1.2},${y - itemH * 0.42} ${x + itemW * 1.5},${y - itemH * 0.48} ${x - itemW * 0.9},${y - itemH * 0.48}`,
          fill: mix(color, "#ffffff", 0.2),
        });
    else
      // Vase
      markup = el("path", {
        d: s`M ${x - itemW * 0.4} ${y - itemH * 0.8}
             Q ${x - itemW * 1.6} ${y - itemH * 0.35} ${x - itemW * 0.7} ${y}
             H ${x + itemW * 0.7}
             Q ${x + itemW * 1.6} ${y - itemH * 0.35} ${x + itemW * 0.4} ${y - itemH * 0.8}
             Z`,
        fill: color,
      });
    // Highlight
    markup += el("rect", {
      x: x - itemW * 0.55,
      y: y - itemH * 0.5,
      width: itemW * 0.18,
      height: itemH * 0.35,
      rx: itemW * 0.09,
      fill: "#fff",
      opacity: "0.18",
    });
    items.push({ x, z, draw: markup });
  }
  items.sort((a, b) => b.z - a.z);
  for (const item of items) out += item.draw;
  return out;
});

export const objects = [fruitBowl, flowers, cactus, coffee, books, bottles];
