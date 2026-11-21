import { defineKind, el, fill, hsl, mix, n, pts, qpt, s, type Point, type Rand } from "./core";
import { andList, capitalize, numberWord, tally } from "./words";
import { blob, table } from "./shapes";

/** A bowl of apples, oranges, pears and bananas on a table. */
export const fruitBowl = defineKind("fruit-bowl", "Fruit bowl", (g, w, h, note) => {
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

/** A vase of round flowers on a table. */
export const flowers = defineKind("flowers", "Vase of flowers", (g, w, h, note) => {
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
  const holder = shape === "round" ? "a round vase" : shape === "tall" ? "a tall vase" : "a jar";
  note.alt(`${numberWord(count).replace(/^./, c => c.toUpperCase())} flowers in ${holder} on a table`);
  note.focus(
    heads.reduce((sum, head) => sum + head.x, 0) / count,
    heads.reduce((sum, head) => sum + head.y, 0) / count,
  );
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
export const cactus = defineKind("cactus", "Potted cactus", (g, w, h, note) => {
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
    const flowering = g.chance(0.5);
    const armsText = arms.length === 0 ? "" : arms.length === 1 ? " with one arm" : " with two arms";
    const flowerText = flowering ? (arms.length ? " and a flower" : " with a flower") : "";
    note.alt(`A potted cactus${armsText}${flowerText}`);
    note.focus(cx, stemTop + stemH * 0.35);
    if (flowering)
      out += el("path", {
        d: blob(g, cx, stemTop + stemW * 0.05, stemW * 0.28, stemW * 0.22, 5, 0.3, 0.03),
        fill: hsl(g.f(320, 380), 75, 68),
      });
  } else {
    // A succulent: a fan of leaves around a pale heart
    const leaves = g.i(7, 11);
    const spread = potW * g.f(1.1, 1.4);
    const cy = rimY - unit * 0.05;
    note.alt("A succulent rosette in a pot");
    note.focus(cx, cy - spread * 0.2);
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
export const coffee = defineKind("coffee", "Coffee", (g, w, h, note) => {
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
  const latte = g.chance(0.5);
  const vessel = mug ? "A steaming mug of coffee" : "A steaming cup of coffee on a saucer";
  const art = latte ? (mug ? " with latte art" : ", with latte art") : mug ? " on a table" : "";
  note.alt(vessel + art);
  note.focus(cx, topY);
  if (latte)
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
export const books = defineKind("books", "Bookshelf", (g, w, h, note) => {
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
  const startX = x;
  let bookCount = 0;
  let leaning = 0;
  let plant = false;
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
      plant = true;
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
    bookCount++;
    if (lean) leaning++;
  }
  const leanText = leaning === 0 ? "" : leaning === 1 ? ", one leaning" : `, ${numberWord(leaning)} leaning`;
  note.alt(`A row of ${numberWord(bookCount)} books on a shelf${leanText}${plant ? ", beside a small plant" : ""}`);
  note.focus((startX + x) / 2, shelfY - h * 0.18);
  return out;
});

const MORANDI = ["#c9b8a4", "#a89f91", "#8e9aa0", "#d7cbb7", "#b07d62", "#6f7d74", "#e3dccf", "#9c8b7a", "#7f8c9a"];

/** Bottles, jars and boxes in muted colors, after Morandi's still lifes. */
export const bottles = defineKind("bottles", "Bottles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.66, 0.72);
  const base = h * g.f(0.8, 0.86);
  // Wall and tabletop
  let out = el("rect", { width: w, height: h, fill: g.pick(["#e6ddd0", "#d9d4c7", "#e8e1d6", "#cfd3cc"]) });
  out += el("rect", { y: top, width: w, height: h - top, fill: g.pick(["#cdbfa9", "#c3baa8", "#d4c7b0"]) });
  const count = g.i(3, 5);
  const items: { x: number; draw: string; z: number }[] = [];
  const kinds: string[] = [];
  let sumX = 0;
  let sumY = 0;
  for (let k = 0; k < count; k++) {
    const x = w * (0.2 + (0.6 * (k + g.f(0.2, 0.8))) / count);
    const z = g.f(0, 1);
    const y = base - z * (base - top) * 0.6;
    const color = g.pick(MORANDI);
    const shade = mix(color, "#000000", 0.12);
    const kind = g.pick(["bottle", "bottle", "jar", "box", "vase"]);
    const itemW = unit * g.f(0.06, 0.1);
    const itemH = unit * g.f(0.25, 0.5);
    kinds.push(kind);
    sumX += x;
    sumY += y - itemH * 0.4;
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
  const plural = (name: string): string => (name === "box" ? "boxes" : `${name}s`);
  note.alt(`A still life of ${andList(tally(kinds, plural))}, after Giorgio Morandi`);
  note.focus(sumX / count, sumY / count);
  for (const item of items) out += item.draw;
  return out;
});

/** A soft round glow: `color` fading out from the center. */
const glow = (id: string, color: string, strength = 0.7): string =>
  el(
    "radialGradient",
    { id },
    el("stop", { offset: 0, "stop-color": color, "stop-opacity": String(strength) }),
    el("stop", { offset: 1, "stop-color": color, "stop-opacity": "0" }),
  );

/** A teapot on a table, sometimes with a cup of tea beside it. */
export const teapot = defineKind("teapot", "Teapot", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.66, 0.74);
  const withCup = g.chance(0.6);
  // The spout points toward the cup.
  const dir = g.chance(0.5) ? 1 : -1;
  const bw = unit * g.f(0.13, 0.155);
  const bh = unit * g.f(0.2, 0.26);
  const potX = withCup ? w / 2 - dir * unit * 0.15 : w / 2 - dir * unit * 0.03;
  const bottom = top + unit * 0.05;
  const cy = bottom - unit * 0.02 - bh * 0.5;
  const bodyTop = cy - bh * 0.5;
  const X = (dx: number) => potX + dir * dx;
  const pot = g.pick([
    "#3e6d8e",
    "#e9e3d5",
    "#c4572f",
    "#2f6b58",
    "#e8b04b",
    "#e9a5b5",
    "#7a5c9e",
    "#f4f1ea",
    "#3b3b3b",
  ]);
  const dark = mix(pot, "#000000", 0.15);
  const clip = g.id("pot");
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(48, 62)));
  // Shadow
  out += el("ellipse", { cx: potX, cy: bottom, rx: bw * 1.2, ry: unit * 0.025, fill: "#000", opacity: "0.12" });
  const cane = g.chance(0.25);
  if (cane)
    // A cane handle arching over the lid
    out += el("path", {
      d: s`M ${X(-bw * 0.62)} ${bodyTop + bh * 0.14}
           C ${X(-bw * 0.55)} ${bodyTop - bh * 0.6} ${X(bw * 0.55)} ${bodyTop - bh * 0.6} ${X(bw * 0.62)} ${bodyTop + bh * 0.14}`,
      stroke: "#b08850",
      "stroke-width": bw * 0.09,
      fill: "none",
      "stroke-linecap": "round",
    });
  else
    // Handle
    out += el("path", {
      d: s`M ${X(-bw * 0.7)} ${cy - bh * 0.3}
           C ${X(-bw * 1.55)} ${cy - bh * 0.45} ${X(-bw * 1.55)} ${cy + bh * 0.3} ${X(-bw * 0.8)} ${cy + bh * 0.24}`,
      stroke: pot,
      "stroke-width": bw * 0.15,
      fill: "none",
      "stroke-linecap": "round",
    });
  // Spout, rising from low on the body to a tip level with the lid
  out += el("path", {
    d: s`M ${X(bw * 0.8)} ${cy + bh * 0.22}
         C ${X(bw * 1.35)} ${cy + bh * 0.15} ${X(bw * 1.45)} ${cy - bh * 0.3} ${X(bw * 1.75)} ${cy - bh * 0.56}
         L ${X(bw * 1.66)} ${cy - bh * 0.66}
         C ${X(bw * 1.3)} ${cy - bh * 0.42} ${X(bw * 1.2)} ${cy - bh * 0.12} ${X(bw * 0.82)} ${cy - bh * 0.14}
         Z`,
    fill: pot,
  });
  // Foot and body
  out += el("rect", {
    x: potX - bw * 0.55,
    y: bottom - unit * 0.025,
    width: bw * 1.1,
    height: unit * 0.025,
    rx: unit * 0.006,
    fill: dark,
  });
  out += el("ellipse", { cx: potX, cy, rx: bw, ry: bh * 0.5, fill: pot });
  // Pattern, kept inside the body
  const pattern = g.pick(["plain", "plain", "band", "dots"]);
  const paint = pot === "#f4f1ea" || pot === "#e9e3d5" ? g.pick(["#3e6d8e", "#c4572f", "#2f6b58"]) : "#ffffff";
  if (pattern !== "plain") {
    let marks = "";
    if (pattern === "band")
      marks += el("rect", {
        x: potX - bw,
        y: cy - bh * 0.06,
        width: bw * 2,
        height: bh * 0.12,
        fill: paint,
        opacity: "0.7",
      });
    else
      for (let row = -1; row <= 1; row++)
        for (let col = -3; col <= 3; col++)
          marks += el("circle", {
            cx: potX + (col + (row === 0 ? 0.5 : 0)) * bw * 0.3,
            cy: cy + row * bh * 0.22,
            r: bw * 0.055,
            fill: paint,
            opacity: "0.7",
          });
    out += el("clipPath", { id: clip }, el("ellipse", { cx: potX, cy, rx: bw, ry: bh * 0.5 }));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // Lid and knob
  const lidY = bodyTop + bh * 0.07;
  const lw = bw * 0.48;
  out += el("path", {
    d: s`M ${potX - lw} ${lidY}
         A ${lw} ${bh * 0.15} 0 0 1 ${potX + lw} ${lidY}
         Z`,
    fill: mix(pot, "#ffffff", 0.1),
  });
  out += el("rect", {
    x: potX - lw * 1.12,
    y: lidY - unit * 0.006,
    width: lw * 2.24,
    height: unit * 0.014,
    rx: unit * 0.006,
    fill: dark,
  });
  out += el("circle", { cx: potX, cy: lidY - bh * 0.17, r: bw * 0.1, fill: dark });
  // Highlight
  out += el("ellipse", {
    cx: potX - bw * 0.5,
    cy: cy - bh * 0.15,
    rx: bw * 0.12,
    ry: bh * 0.2,
    fill: "#fff",
    opacity: "0.25",
    transform: s`rotate(20 ${potX - bw * 0.5} ${cy - bh * 0.15})`,
  });
  if (withCup) {
    // A teacup on a saucer, a little nearer than the pot
    const cupW = unit * g.f(0.07, 0.085);
    const cupX = X(bw * 1.75 + unit * 0.15);
    const cupBottom = bottom + unit * 0.035;
    const cupTop = cupBottom - cupW * 0.85;
    const cup = g.chance(0.5) ? pot : "#f4f1ea";
    const cupDark = mix(cup, "#000000", 0.15);
    out += el("ellipse", { cx: cupX, cy: cupBottom, rx: cupW * 1.7, ry: cupW * 0.32, fill: cupDark });
    out += el("ellipse", { cx: cupX, cy: cupBottom - cupW * 0.05, rx: cupW * 1.6, ry: cupW * 0.26, fill: cup });
    out += el("path", {
      d: s`M ${cupX + dir * cupW * 0.85} ${cupTop + cupW * 0.2}
           c ${dir * cupW * 0.5} ${-cupW * 0.05} ${dir * cupW * 0.5} ${cupW * 0.5} ${-dir * cupW * 0.15} ${cupW * 0.5}`,
      stroke: cup,
      "stroke-width": cupW * 0.14,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M ${cupX - cupW} ${cupTop}
           Q ${cupX - cupW} ${cupBottom - cupW * 0.05} ${cupX} ${cupBottom - cupW * 0.05}
           Q ${cupX + cupW} ${cupBottom - cupW * 0.05} ${cupX + cupW} ${cupTop}
           Z`,
      fill: cup,
    });
    out += el("ellipse", { cx: cupX, cy: cupTop, rx: cupW, ry: cupW * 0.22, fill: cupDark });
    out += el("ellipse", {
      cx: cupX,
      cy: cupTop + cupW * 0.03,
      rx: cupW * 0.86,
      ry: cupW * 0.16,
      fill: g.pick(["#b5652b", "#c98a3c", "#8a4a22"]),
    });
  }
  // Steam from the spout
  if (g.chance(0.6)) {
    const tipX = X(bw * 1.71);
    const tipY = cy - bh * 0.66;
    out += el("path", {
      d: s`M ${tipX} ${tipY - bh * 0.05} q ${dir * bw * 0.25} ${-bh * 0.15} 0 ${-bh * 0.3} t 0 ${-bh * 0.3}`,
      stroke: "#fff",
      "stroke-width": bw * 0.07,
      fill: "none",
      "stroke-linecap": "round",
      opacity: "0.6",
    });
  }
  const look =
    pattern === "dots" ? "A polka-dot teapot" : pattern === "band" ? "A teapot with a painted band" : "A teapot";
  const handle = cane ? (pattern === "band" ? " and a cane handle" : " with a cane handle") : "";
  note.alt(`${look}${handle}${withCup ? " beside a cup of tea" : ""} on a table`);
  note.focus(withCup ? (potX + X(bw * 1.75 + unit * 0.15)) / 2 : potX, cy);
  return out;
});

/** A lit lamp in the evening: a table lamp on a table, or a floor lamp. */
export const lamp = defineKind("lamp", "Lamp", { stand: ["table", "floor"] }, (g, w, h, note) => {
  const unit = Math.min(w, h);
  const floorLamp = g.option("stand", g.chance(0.35) ? "floor" : "table") === "floor";
  const hue = g.f(0, 360);
  const wall = hsl(hue, g.f(15, 30), g.f(30, 40));
  const wood = hsl(g.f(15, 35), g.f(25, 40), g.f(24, 34));
  const light = g.pick(["#ffe7a3", "#ffd98a", "#fff0c2"]);
  const shade = hsl(g.f(20, 60), g.f(40, 70), g.f(78, 88));
  const metal = g.pick(["#c9a24a", "#2b2b2b", "#d9dcdf", "#8a6b4a"]);
  const top = floorLamp ? h * g.f(0.84, 0.88) : h * g.f(0.72, 0.78);
  const bottom = top + unit * (floorLamp ? 0.03 : 0.04);
  const cx = w / 2 + w * g.f(-0.08, 0.08);
  const sh = unit * g.f(0.15, 0.19);
  const sbw = unit * g.f(0.14, 0.18);
  const stw = sbw * g.f(0.55, 0.75);
  const id = g.id("glow");
  let out = el("defs", {}, glow(id, light, 0.55));
  out += table(g, w, h, top, wall, wood);
  // The shade's height: on a tall pole for a floor lamp, or on a base and short neck on a table.
  let shadeBottom: number;
  let base = "";
  let what: string;
  if (floorLamp) {
    shadeBottom = h * g.f(0.08, 0.14) + sh;
    const tripod = g.chance(0.5);
    what = tripod ? "A lit floor lamp on a tripod" : "A lit floor lamp";
    if (tripod) {
      // Three splayed legs
      const legTop = shadeBottom + (bottom - shadeBottom) * 0.55;
      const spread = unit * 0.13;
      base += el("path", {
        d: s`M ${cx} ${legTop} L ${cx - spread} ${bottom} M ${cx} ${legTop} L ${cx + spread} ${bottom} M ${cx} ${legTop} L ${cx + spread * 0.2} ${bottom - unit * 0.03}`,
        stroke: metal,
        "stroke-width": unit * 0.014,
        "stroke-linecap": "round",
      });
      base += el("rect", {
        x: cx - unit * 0.006,
        y: shadeBottom,
        width: unit * 0.012,
        height: legTop - shadeBottom,
        fill: metal,
      });
    } else {
      // Pole on a round foot
      base += el("ellipse", { cx, cy: bottom, rx: unit * 0.09, ry: unit * 0.022, fill: "#000", opacity: "0.15" });
      base += el("rect", {
        x: cx - unit * 0.006,
        y: shadeBottom,
        width: unit * 0.012,
        height: bottom - shadeBottom,
        fill: metal,
      });
      base += el("path", {
        d: s`M ${cx - unit * 0.075} ${bottom} Q ${cx} ${bottom - unit * 0.05} ${cx + unit * 0.075} ${bottom} Z`,
        fill: metal,
      });
    }
  } else {
    // A base on the table and a short neck up to the shade
    const baseH = unit * g.f(0.13, 0.19);
    const baseW = unit * g.f(0.06, 0.08);
    const neck = unit * g.f(0.05, 0.08);
    const baseTop = bottom - baseH;
    shadeBottom = baseTop - neck;
    const form = g.pick(["jar", "column", "cone"]);
    const ceramic = g.pick(["#3e6d8e", "#e9e3d5", "#c4572f", "#2f6b58", "#e8b04b", "#7a5c9e", "#a8b5a2"]);
    base += el("ellipse", { cx, cy: bottom, rx: baseW * 1.4, ry: unit * 0.02, fill: "#000", opacity: "0.2" });
    base += el("rect", {
      x: cx - unit * 0.005,
      y: shadeBottom,
      width: unit * 0.01,
      height: neck + unit * 0.01,
      fill: metal,
    });
    base += el("path", {
      d:
        form === "jar"
          ? s`M ${cx - baseW * 0.45} ${baseTop}
              C ${cx - baseW * 1.5} ${baseTop + baseH * 0.15} ${cx - baseW * 1.4} ${bottom} ${cx - baseW * 0.6} ${bottom}
              H ${cx + baseW * 0.6}
              C ${cx + baseW * 1.4} ${bottom} ${cx + baseW * 1.5} ${baseTop + baseH * 0.15} ${cx + baseW * 0.45} ${baseTop}
              Z`
          : form === "column"
            ? s`M ${cx - baseW * 0.5} ${baseTop} H ${cx + baseW * 0.5} L ${cx + baseW * 0.6} ${bottom - baseH * 0.12}
                H ${cx + baseW} V ${bottom} H ${cx - baseW} V ${bottom - baseH * 0.12} H ${cx - baseW * 0.6} Z`
            : s`M ${cx - baseW * 0.25} ${baseTop} H ${cx + baseW * 0.25} L ${cx + baseW} ${bottom} H ${cx - baseW} Z`,
      fill: ceramic,
    });
    // Highlight
    base += el("rect", {
      x: cx - baseW * 0.45,
      y: baseTop + baseH * 0.25,
      width: baseW * 0.15,
      height: baseH * 0.45,
      rx: baseW * 0.07,
      fill: "#fff",
      opacity: "0.25",
    });
    const stack = g.chance(0.5);
    what = stack ? "A lit table lamp beside a stack of books" : "A lit table lamp on a table";
    if (stack) {
      // A few books lying flat beside the lamp
      const side = g.chance(0.5) ? 1 : -1;
      const bx = cx + side * (sbw + unit * 0.1);
      let y = bottom;
      for (let k = g.i(2, 4); k > 0; k--) {
        const bookW = unit * g.f(0.15, 0.2);
        const bookH = unit * g.f(0.025, 0.04);
        y -= bookH;
        base += el("rect", {
          x: bx - bookW / 2 + g.f(-0.02, 0.02) * unit,
          y,
          width: bookW,
          height: bookH,
          rx: unit * 0.004,
          fill: hsl(g.f(0, 360), g.f(30, 55), g.f(35, 60)),
        });
      }
    }
  }
  const shadeTop = shadeBottom - sh;
  // The glow, and light thrown down onto the surface
  out += el("circle", { cx, cy: shadeBottom - sh * 0.4, r: unit * 0.55, fill: `url(#${id})` });
  out += el("polygon", {
    points: pts([
      [cx - sbw, shadeBottom],
      [cx + sbw, shadeBottom],
      [cx + sbw * 2, bottom],
      [cx - sbw * 2, bottom],
    ]),
    fill: light,
    opacity: "0.14",
  });
  out += el("ellipse", { cx, cy: bottom, rx: sbw * 2, ry: unit * 0.035, fill: light, opacity: "0.2" });
  out += base;
  // Bulb seen under the shade, then the shade itself
  out += el("ellipse", { cx, cy: shadeBottom, rx: sbw * 0.96, ry: unit * 0.022, fill: "#fff8de" });
  out += el("polygon", {
    points: pts([
      [cx - stw, shadeTop],
      [cx + stw, shadeTop],
      [cx + sbw, shadeBottom],
      [cx - sbw, shadeBottom],
    ]),
    fill: shade,
  });
  // Trim at the shade's bottom edge
  out += el("rect", {
    x: cx - sbw,
    y: shadeBottom - unit * 0.012,
    width: sbw * 2,
    height: unit * 0.012,
    fill: "#000",
    opacity: "0.08",
  });
  note.alt(what);
  note.focus(cx, shadeBottom - sh * 0.5);
  return out;
});

/** A monstera leaf pointing up from its base at (0, 0): heart-shaped, with slits cut in from the edges. */
function monsteraLeaf(g: Rand, len: number, width: number, slits: number): string {
  const right: Point[] = [];
  const cuts = new Set<number>();
  // Slits sit between the leaf's widest part and its tip.
  for (let k = 0; k < slits; k++) cuts.add(3 + k * 2);
  const steps = 12;
  for (let k = 1; k < steps; k++) {
    const u = k / steps;
    const half = (width / 2) * Math.sin(Math.PI * u) ** 0.7;
    const y = -len * (1.12 * u - 0.12);
    if (cuts.has(k)) {
      right.push([half, y + len * 0.02]);
      right.push([half * g.f(0.3, 0.45), y - len * 0.05]);
      right.push([half * 0.97, y - len * 0.03]);
    } else right.push([half, y]);
  }
  const left = right.map(([x, y]): Point => [-x, y]).reverse();
  return pts([[0, 0], ...right, [0, -len], ...left]);
}

/** A leafy houseplant in a pot on the floor: a monstera, a fern or a snake plant. */
export const houseplant = defineKind("houseplant", "Houseplant", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.8, 0.86);
  const cx = w / 2 + w * g.f(-0.05, 0.05);
  const potW = unit * g.f(0.12, 0.15);
  const potH = unit * g.f(0.18, 0.22);
  const potY = top + unit * 0.04;
  const rimY = potY - potH;
  const hue = g.f(100, 145);
  const green = (shift = 0) => hsl(hue + g.f(-8, 8), g.f(38, 52), g.f(30, 40) + shift);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(15, 35), g.f(84, 92)), hsl(g.f(20, 40), g.f(20, 35), g.f(45, 62)));
  // How tall and wide the plant may grow and stay in the picture
  const maxH = Math.min(rimY - h * 0.05, unit * 0.68);
  const reach = Math.min(w * 0.46, unit * 0.7);
  const kind = g.pick(["monstera", "fern", "snake"]);
  if (kind === "monstera") {
    const count = g.i(4, 7);
    let stems = "";
    let leaves = "";
    for (let k = 0; k < count; k++) {
      const t = (k + g.f(0.2, 0.8)) / count;
      const angle = (t - 0.5) * g.f(2.2, 2.7);
      const len = unit * g.f(0.15, 0.21);
      const total =
        Math.min(maxH / Math.max(0.35, Math.cos(angle)), reach / Math.max(0.1, Math.abs(Math.sin(angle)))) *
        g.f(0.7, 0.92);
      const stemLen = Math.max(unit * 0.05, total - len);
      const bx = cx + Math.sin(angle) * stemLen;
      const by = rimY - Math.cos(angle) * stemLen;
      const sx = cx + g.f(-0.4, 0.4) * potW;
      stems += s`M ${sx} ${rimY + unit * 0.02} Q ${sx + (bx - sx) * 0.2} ${(rimY + by) / 2} ${bx} ${by} `;
      // The blade tips a little further out than its stem, as if drooping.
      const tilt = ((angle * 180) / Math.PI) * 1.15;
      const slits = len > unit * 0.17 ? g.i(2, 4) : g.i(0, 2);
      leaves += el("polygon", {
        points: monsteraLeaf(g, len, len * g.f(0.85, 1), slits),
        fill: green(g.f(-4, 6)),
        transform: s`translate(${bx} ${by}) rotate(${tilt})`,
      });
      leaves += el("path", {
        d: s`M 0 0 V ${-len * 0.9}`,
        stroke: "#000",
        "stroke-opacity": "0.15",
        "stroke-width": unit * 0.006,
        transform: s`translate(${bx} ${by}) rotate(${tilt})`,
      });
    }
    out += el("path", {
      d: stems.trim(),
      stroke: hsl(hue, 35, 38),
      "stroke-width": unit * 0.011,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += leaves;
  } else if (kind === "fern") {
    const count = g.i(7, 10);
    for (let k = 0; k < count; k++) {
      const t = count === 1 ? 0.5 : k / (count - 1);
      const angle = (t - 0.5) * g.f(2.6, 3) + g.f(-0.1, 0.1);
      const len = Math.min(maxH * 1.1, reach) * g.f(0.7, 1) * (1 - Math.abs(t - 0.5) * 0.4);
      // Each frond arches up and out, then droops under its own weight.
      const p0: Point = [cx + (t - 0.5) * potW, rimY + unit * 0.01];
      const p1: Point = [cx + Math.sin(angle) * len * 0.55, rimY - Math.cos(angle) * len * 0.55 - len * 0.25];
      const p2: Point = [cx + Math.sin(angle) * len, Math.min(rimY, rimY - Math.cos(angle) * len + len * 0.25)];
      const color = green(k % 2 ? 0 : 6);
      let d = s`M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
      for (let j = 2; j < 12; j++) {
        const u = j / 12;
        const [x, y] = qpt(p0, p1, p2, u);
        const [nx, ny] = qpt(p0, p1, p2, Math.min(1, u + 0.02));
        const dx = nx - x;
        const dy = ny - y;
        const mag = Math.hypot(dx, dy) || 1;
        const leaf = len * 0.17 * (1 - u * 0.65);
        for (const side of [-1, 1]) {
          // Leaflets angle forward toward the frond's tip.
          const lx = ((-dy / mag) * side * 0.8 + (dx / mag) * 0.6) * leaf;
          const ly = ((dx / mag) * side * 0.8 + (dy / mag) * 0.6) * leaf;
          d += s`M ${x} ${y}l ${lx} ${ly}`;
        }
      }
      out += el("path", {
        d,
        stroke: color,
        "stroke-width": unit * 0.016,
        "stroke-linecap": "round",
        fill: "none",
      });
    }
  } else {
    // Snake plant: upright pointed blades, some with pale edges
    const count = g.i(5, 8);
    const edged = g.chance(0.5);
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const bladeH = maxH * g.f(0.55, 1) * (1 - Math.abs(t - 0.5) * 0.6);
      const bladeW = unit * g.f(0.035, 0.05);
      const x = cx + (t - 0.5) * potW * 1.3;
      const lean = (t - 0.5) * bladeH * 0.5 + g.f(-0.05, 0.05) * bladeH;
      const blade = (wd: number) =>
        s`M ${x - wd} ${rimY + unit * 0.02}
          Q ${x - wd * 1.6 + lean * 0.3} ${rimY - bladeH * 0.5} ${x + lean} ${rimY - bladeH}
          Q ${x + wd * 1.6 + lean * 0.3} ${rimY - bladeH * 0.5} ${x + wd} ${rimY + unit * 0.02}
          Z`;
      if (edged) out += el("path", { d: blade(bladeW), fill: "#d9d27a" });
      out += el("path", { d: blade(edged ? bladeW * 0.7 : bladeW), fill: green(k % 2 ? 0 : 5) });
    }
  }
  // Pot: shadow, body, and rim
  const potStyle = g.pick(["clay", "clay", "round", "basket"]);
  const pot =
    potStyle === "basket"
      ? g.pick(["#c9a477", "#b88d5a", "#d8c19a"])
      : g.pick(["#c4572f", "#e9e3d5", "#3e6d8e", "#2b2b2b", "#e8b04b", "#f4f1ea", "#7a8f7e"]);
  out += el("ellipse", { cx, cy: potY, rx: potW * 1.15, ry: unit * 0.02, fill: "#000", opacity: "0.12" });
  if (potStyle === "round")
    out += el("path", {
      d: s`M ${cx - potW} ${rimY}
           C ${cx - potW * 1.25} ${rimY + potH * 0.6} ${cx - potW * 0.9} ${potY} ${cx - potW * 0.55} ${potY}
           H ${cx + potW * 0.55}
           C ${cx + potW * 0.9} ${potY} ${cx + potW * 1.25} ${rimY + potH * 0.6} ${cx + potW} ${rimY}
           Z`,
      fill: pot,
    });
  else {
    out += el("polygon", {
      points: pts([
        [cx - potW, rimY],
        [cx + potW, rimY],
        [cx + potW * 0.78, potY],
        [cx - potW * 0.78, potY],
      ]),
      fill: pot,
    });
    if (potStyle === "basket") {
      // Woven rows
      let rows = "";
      for (let k = 1; k < 5; k++) {
        const y = rimY + (potH * k) / 5;
        const half = potW * (1 - 0.22 * (k / 5));
        rows += s`M ${cx - half} ${y} H ${cx + half} `;
      }
      out += el("path", { d: rows.trim(), stroke: "#000", "stroke-opacity": "0.15", "stroke-width": unit * 0.008 });
    }
  }
  if (potStyle !== "round")
    out += el("rect", {
      x: cx - potW * 1.08,
      y: rimY - unit * 0.035,
      width: potW * 2.16,
      height: unit * 0.045,
      rx: unit * 0.008,
      fill: mix(pot, "#ffffff", 0.12),
    });
  const name = kind === "monstera" ? "A monstera" : kind === "fern" ? "A fern" : "A snake plant";
  const holder = potStyle === "basket" ? "in a woven basket" : potStyle === "round" ? "in a round pot" : "in a pot";
  note.alt(`${name} ${holder} on the floor`);
  note.focus(cx, rimY - maxH * 0.45);
  return out;
});

const MINUTE_WORDS: Record<number, string> = { 5: "five", 10: "ten", 20: "twenty", 25: "twenty-five" };

/** A time on a clock face in words: "ten past four", "quarter to nine", "six o'clock". */
function timeWords(hour: number, minute: number): string {
  const next = (hour % 12) + 1;
  if (minute === 0) return `${numberWord(hour)} o'clock`;
  if (minute === 15) return `quarter past ${numberWord(hour)}`;
  if (minute === 30) return `half past ${numberWord(hour)}`;
  if (minute === 45) return `quarter to ${numberWord(next)}`;
  return minute < 30
    ? `${MINUTE_WORDS[minute]} past ${numberWord(hour)}`
    : `${MINUTE_WORDS[60 - minute]} to ${numberWord(next)}`;
}

/** A wall clock with its hands at a seeded time. */
export const clock = defineKind("clock", "Wall clock", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2 + w * g.f(-0.06, 0.06);
  const cy = h * g.f(0.46, 0.52);
  const shape = g.pick(["round", "round", "square", "sunburst"]);
  const r = unit * (shape === "sunburst" ? g.f(0.24, 0.27) : g.f(0.3, 0.35));
  const hour = g.i(1, 12);
  const minute = g.i(0, 11) * 5;
  const second = g.i(0, 59);
  const frame = g.pick(["#3b3b3b", "#c4572f", "#3e6d8e", "#e8b04b", "#2f6b58", "#8a5a3b", "#f4f1ea", "#c9a24a"]);
  const darkFace = g.chance(0.2);
  const face = darkFace ? g.pick(["#263238", "#2f4f4f", "#3b2f2a"]) : g.pick(["#fbf8f1", "#f4f1ea", "#fffdf7"]);
  const ink = darkFace ? "#f4f1ea" : "#2b2b2b";
  // Wall, with a rail line sometimes
  let out = fill(w, h, hsl(g.f(0, 360), g.f(15, 35), g.f(80, 90)));
  if (g.chance(0.4)) out += el("rect", { y: h * 0.86, width: w, height: h * 0.14, fill: "#000", opacity: "0.06" });
  // Shadow on the wall, down and to the right
  const outer = shape === "sunburst" ? r * 1.45 : r;
  let faceR: number;
  if (shape === "square") {
    out += el("rect", {
      x: cx - r + r * 0.05,
      y: cy - r + r * 0.07,
      width: r * 2,
      height: r * 2,
      rx: r * 0.2,
      fill: "#000",
      opacity: "0.12",
    });
    out += el("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: r * 0.2, fill: frame });
    faceR = r * 0.8;
  } else if (shape === "sunburst") {
    // Rays of alternating length around a small rim
    let rays = "";
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const len = k % 2 ? outer * 0.8 : outer;
      rays += s`M ${cx + Math.cos(a) * r * 0.9} ${cy + Math.sin(a) * r * 0.9} L ${cx + Math.cos(a) * len} ${cy + Math.sin(a) * len} `;
    }
    const gold = g.pick(["#c9a24a", "#b08850", "#d9b44a"]);
    out += el("path", {
      d: rays.trim(),
      stroke: "#000",
      "stroke-opacity": "0.1",
      "stroke-width": unit * 0.02,
      "stroke-linecap": "round",
      transform: s`translate(${r * 0.05} ${r * 0.07})`,
    });
    out += el("path", { d: rays.trim(), stroke: gold, "stroke-width": unit * 0.02, "stroke-linecap": "round" });
    out += el("circle", { cx, cy, r, fill: gold });
    faceR = r * 0.84;
  } else {
    out += el("circle", { cx: cx + r * 0.05, cy: cy + r * 0.07, r, fill: "#000", opacity: "0.12" });
    out += el("circle", { cx, cy, r, fill: frame });
    faceR = r * 0.86;
  }
  out += el("circle", { cx, cy, r: faceR, fill: face });
  // Hour marks, longer at the quarters
  let major = "";
  let minor = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const inner = k % 3 ? faceR * 0.82 : faceR * 0.72;
    const seg = s`M ${cx + Math.sin(a) * inner} ${cy - Math.cos(a) * inner} L ${cx + Math.sin(a) * faceR * 0.9} ${cy - Math.cos(a) * faceR * 0.9} `;
    if (k % 3) minor += seg;
    else major += seg;
  }
  out += el("path", { d: major.trim(), stroke: ink, "stroke-width": faceR * 0.06 });
  out += el("path", { d: minor.trim(), stroke: ink, "stroke-width": faceR * 0.03 });
  // Hands
  const hand = (turns: number, len: number, width: number, color: string) => {
    const a = turns * Math.PI * 2;
    return el("path", {
      d: s`M ${cx - Math.sin(a) * len * 0.15} ${cy + Math.cos(a) * len * 0.15} L ${cx + Math.sin(a) * len} ${cy - Math.cos(a) * len}`,
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
    });
  };
  out += hand(((hour % 12) + minute / 60) / 12, faceR * 0.5, faceR * 0.07, ink);
  out += hand(minute / 60, faceR * 0.76, faceR * 0.045, ink);
  if (g.chance(0.6)) out += hand(second / 60, faceR * 0.82, faceR * 0.015, "#d63c2f");
  out += el("circle", { cx, cy, r: faceR * 0.05, fill: ink });
  const name =
    shape === "square" ? "A square wall clock" : shape === "sunburst" ? "A sunburst wall clock" : "A round wall clock";
  note.alt(`${name} reading ${timeWords(hour, minute)}`);
  note.focus(cx, cy);
  return out;
});

/** A few lit candles of different heights on a table in a dim room. */
export const candles = defineKind("candles", "Candles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.74, 0.8);
  const hue = g.f(0, 360);
  const count = g.i(3, 5);
  const cw = unit * g.f(0.045, 0.06);
  const gap = unit * g.f(0.03, 0.06);
  const spacing = cw * 2 + gap;
  const flameH = cw * 1.5;
  const maxH = Math.min(unit * 0.46, top - h * 0.12 - flameH);
  const wax = g.pick([
    ["#f3ead8", "#efe2c8", "#f7f0e2"],
    ["#f3ead8", "#efe2c8", "#f7f0e2"],
    ["#e9b8c4", "#f0c9d2", "#e3a9b8"],
    ["#b9d8c2", "#a8cdb4", "#c9e2d0"],
    ["#c7b8e0", "#b6a5d6", "#d6cbea"],
    ["#f2d38a", "#ecc66f", "#f6dea6"],
    ["#a9c9e3", "#98bddb", "#bcd5ea"],
  ]);
  const holder = g.pick(["none", "plate", "dishes"]);
  const id = g.id("glow");
  let out = el("defs", {}, glow(id, "#ffd27a", 0.5));
  out += table(g, w, h, top, hsl(hue, g.f(15, 30), g.f(18, 28)), hsl(g.f(15, 35), g.f(25, 40), g.f(22, 32)));
  // Distinct heights, shuffled along the row
  const heights = Array.from(
    { length: count },
    (_, k) => unit * 0.12 + ((maxH - unit * 0.12) * (k + g.f(0.1, 0.9))) / count,
  );
  for (let k = heights.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [heights[k], heights[j]] = [heights[j], heights[k]];
  }
  const startX = w / 2 - ((count - 1) * spacing) / 2;
  const baseY = top + unit * g.f(0.05, 0.07);
  // Light pooling around the candles
  const tallest = Math.max(...heights);
  out += el("circle", {
    cx: w / 2,
    cy: baseY - tallest,
    r: Math.max(unit * 0.55, count * spacing * 0.9),
    fill: `url(#${id})`,
  });
  if (holder === "plate") {
    const plate = g.pick(["#c9a24a", "#e9e3d5", "#8a6b4a"]);
    const half = ((count - 1) * spacing) / 2 + cw * 1.8;
    out += el("ellipse", {
      cx: w / 2,
      cy: baseY + unit * 0.01,
      rx: half,
      ry: unit * 0.035,
      fill: mix(plate, "#000000", 0.25),
    });
    out += el("ellipse", { cx: w / 2, cy: baseY, rx: half * 0.97, ry: unit * 0.028, fill: plate });
  }
  let flames = "";
  for (let k = 0; k < count; k++) {
    const x = startX + k * spacing + g.f(-0.1, 0.1) * gap;
    const ch = heights[k];
    const color = g.pick(wax);
    const y = baseY - ch;
    if (holder === "dishes") {
      out += el("ellipse", { cx: x, cy: baseY + unit * 0.008, rx: cw * 1.6, ry: unit * 0.022, fill: "#9a7b3a" });
      out += el("ellipse", { cx: x, cy: baseY, rx: cw * 1.5, ry: unit * 0.016, fill: "#c9a24a" });
    } else if (holder === "none")
      out += el("ellipse", { cx: x, cy: baseY, rx: cw * 1.3, ry: unit * 0.015, fill: "#000", opacity: "0.2" });
    // Body, its lit side, and the melted pool on top
    out += el("rect", { x: x - cw, y, width: cw * 2, height: ch, rx: cw * 0.15, fill: color });
    out += el("rect", { x: x - cw * 0.2, y, width: cw * 1.2, height: ch, fill: "#000", opacity: "0.08" });
    out += el("ellipse", { cx: x, cy: y, rx: cw, ry: cw * 0.28, fill: mix(color, "#ffffff", 0.35) });
    // A drip down the front
    if (g.chance(0.6)) {
      const dx = x + g.f(-0.6, 0.3) * cw;
      const dl = ch * g.f(0.1, 0.25);
      out += el("path", {
        d: s`M ${dx} ${y} V ${y + dl}`,
        stroke: mix(color, "#ffffff", 0.2),
        "stroke-width": cw * 0.3,
        "stroke-linecap": "round",
      });
    }
    // Wick and flame
    const fy = y - cw * 0.05;
    out += el("path", { d: s`M ${x} ${fy} v ${-cw * 0.35}`, stroke: "#3b2f2a", "stroke-width": cw * 0.1 });
    const fx = x + g.f(-0.08, 0.08) * cw;
    flames += el("circle", { cx: fx, cy: fy - flameH * 0.5, r: flameH * 0.8, fill: "#ffd27a", opacity: "0.25" });
    flames += el("path", {
      d: s`M ${fx} ${fy - flameH}
           C ${fx + cw * 0.15} ${fy - flameH * 0.6} ${fx + cw * 0.5} ${fy - flameH * 0.3} ${x} ${fy - cw * 0.15}
           C ${x - cw * 0.5} ${fy - flameH * 0.3} ${fx - cw * 0.15} ${fy - flameH * 0.6} ${fx} ${fy - flameH}
           Z`,
      fill: "#ffb83d",
    });
    flames += el("ellipse", { cx: x, cy: fy - flameH * 0.3, rx: cw * 0.17, ry: flameH * 0.22, fill: "#fff3b0" });
  }
  out += flames;
  const on = holder === "plate" ? " on a plate" : holder === "dishes" ? " in brass holders" : " on a table";
  note.alt(`${capitalize(numberWord(count))} lit candles of different heights${on}`);
  note.focus(w / 2, baseY - tallest);
  return out;
});

/** A bunch of balloons on strings, tied to a weight on the floor. */
export const balloons = defineKind("balloons", "Balloons", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.84, 0.9);
  const count = g.i(3, 7);
  const r = unit * g.f(0.095, 0.115);
  const ry = r * 1.18;
  const knot = r * 0.16;
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(25, 45), g.f(84, 92)), hsl(g.f(20, 40), g.f(20, 35), g.f(50, 64)));
  // The weight: a small gift box, or a round weight
  const px = w / 2 + w * g.f(-0.08, 0.08);
  const floorY = top + unit * 0.04;
  const box = g.chance(0.6);
  const size = unit * 0.07;
  const pivotY = floorY - (box ? size * 1.15 : size * 0.7);
  const hue = g.f(0, 360);
  const multi = g.chance(0.7);
  // Balloons fan out from the weight, alternating between two string lengths.
  const reachTop = pivotY - h * 0.05 - ry * 2 - knot;
  const amax = Math.min(
    0.55,
    0.16 * count,
    Math.asin(Math.min(1, (w * 0.47 - Math.abs(px - w / 2) - r * 1.2) / (reachTop + knot + ry * 2))),
  );
  type Balloon = { x: number; y: number; a: number; color: string };
  const items: Balloon[] = [];
  let strings = "";
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const a = (t - 0.5) * 2 * amax + g.f(-0.05, 0.05);
    const len = reachTop * (count > 3 && k % 2 ? g.f(0.66, 0.76) : g.f(0.9, 1));
    const kx = px + Math.sin(a) * len;
    const ky = pivotY - Math.cos(a) * len;
    const sway = g.f(-1, 1) * unit * 0.03;
    strings += s`M ${kx} ${ky} Q ${(kx + px) / 2 + sway} ${(ky + pivotY) / 2} ${px} ${pivotY} `;
    const color = multi
      ? hsl(hue + k * g.f(50, 80), g.f(55, 72), g.f(58, 66))
      : hsl(hue + g.f(-15, 15), g.f(55, 72), g.f(52, 68));
    items.push({ x: kx, y: ky, a, color });
  }
  out += el("path", {
    d: strings.trim(),
    stroke: "#6b6b6b",
    "stroke-width": unit * 0.004,
    fill: "none",
    opacity: "0.8",
  });
  // The weight, over the gathered string ends
  out += el("ellipse", { cx: px, cy: floorY, rx: size * 0.9, ry: unit * 0.015, fill: "#000", opacity: "0.12" });
  const weightColor = hsl(hue + 180, g.f(45, 65), g.f(50, 62));
  if (box) {
    out += el("rect", {
      x: px - size * 0.6,
      y: floorY - size,
      width: size * 1.2,
      height: size,
      rx: unit * 0.004,
      fill: weightColor,
    });
    out += el("rect", {
      x: px - size * 0.1,
      y: floorY - size,
      width: size * 0.2,
      height: size,
      fill: "#fff",
      opacity: "0.7",
    });
    out += el("path", {
      d: s`M ${px} ${floorY - size} q ${-size * 0.35} ${-size * 0.3} ${-size * 0.3} 0 M ${px} ${floorY - size} q ${size * 0.35} ${-size * 0.3} ${size * 0.3} 0`,
      stroke: "#fff",
      "stroke-width": size * 0.12,
      fill: "none",
      opacity: "0.85",
    });
  } else {
    out += el("path", {
      d: s`M ${px - size * 0.45} ${floorY} A ${size * 0.45} ${size * 0.7} 0 0 1 ${px + size * 0.45} ${floorY} Z`,
      fill: weightColor,
    });
  }
  // Balloons, the farther (higher) ones first, each tilted along its string
  items.sort((p, q) => p.y - q.y);
  for (const b of items) {
    const deg = (b.a * 180) / Math.PI;
    out += el(
      "g",
      { transform: s`translate(${b.x} ${b.y}) rotate(${deg})` },
      el("polygon", {
        points: pts([
          [0, -knot - 1],
          [-r * 0.13, 0],
          [r * 0.13, 0],
        ]),
        fill: b.color,
      }),
      el("ellipse", { cy: -knot - ry, rx: r, ry, fill: b.color }),
      el("ellipse", {
        cx: -r * 0.4,
        cy: -knot - ry * 1.4,
        rx: r * 0.18,
        ry: r * 0.3,
        fill: "#fff",
        opacity: "0.35",
        transform: s`rotate(30 ${-r * 0.4} ${-knot - ry * 1.4})`,
      }),
    );
  }
  const to = box ? "a gift box" : "a weight";
  note.alt(`A bunch of ${numberWord(count)} balloons tied to ${to}`);
  note.focus(items.reduce((sum, b) => sum + b.x, 0) / count, items.reduce((sum, b) => sum + b.y, 0) / count - ry);
  return out;
});

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
export const camera = defineKind("camera", "Vintage camera", (g, w, h, note) => {
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

/** An upholstered armchair, sometimes with a cushion, and sometimes beside a side table. */
export const armchair = defineKind("armchair", "Armchair", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.8, 0.86);
  const withTable = g.chance(0.5);
  const side = g.chance(0.5) ? 1 : -1;
  // A smaller chair leaves room for the side table at every size.
  const u = unit * (withTable ? 0.8 : 0.95);
  const style = g.pick(["club", "wingback", "modern"]);
  const cw = u * g.f(0.66, 0.74);
  const tableW = u * 0.26;
  const cx = w / 2 - (withTable ? side * (tableW * 0.5 + u * 0.03) : 0);
  const floorY = top + unit * 0.05;
  const legH = u * (style === "modern" ? g.f(0.09, 0.12) : g.f(0.04, 0.06));
  const baseY = floorY - legH;
  const seatTop = baseY - u * 0.17;
  const armY = seatTop - u * g.f(0.1, 0.14);
  const backTop = armY - u * (style === "wingback" ? g.f(0.24, 0.28) : g.f(0.16, 0.22));
  const aw = cw * (style === "club" ? 0.2 : 0.15);
  const left = cx - cw / 2;
  const right = cx + cw / 2;
  const fabric = g.pick([
    "#3e6d8e",
    "#c4572f",
    "#2f6b58",
    "#e8b04b",
    "#7a5c9e",
    "#a8b5a2",
    "#8a5a3b",
    "#d98b6a",
    "#4f6d7a",
    "#b5838d",
    "#6b8f71",
    "#c9a46a",
    "#5c5470",
    "#9e3f3f",
  ]);
  const shadeOf = (t: number) => mix(fabric, t > 0 ? "#ffffff" : "#000000", Math.abs(t));
  const leg = g.pick(["#5b3a29", "#3b2f2a", "#8a5a3b", "#c9a477"]);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(15, 35), g.f(82, 90)), hsl(g.f(20, 40), g.f(20, 35), g.f(48, 62)));
  // Shadow
  out += el("ellipse", { cx, cy: floorY, rx: cw * 0.6, ry: unit * 0.025, fill: "#000", opacity: "0.15" });
  // Legs
  const legW = u * 0.025;
  const legs =
    style === "modern"
      ? s`M ${left + aw * 0.6} ${baseY} L ${left + aw * 0.2} ${floorY} M ${right - aw * 0.6} ${baseY} L ${right - aw * 0.2} ${floorY}`
      : s`M ${left + aw * 0.5} ${baseY} V ${floorY} M ${right - aw * 0.5} ${baseY} V ${floorY}`;
  out += el("path", { d: legs, stroke: leg, "stroke-width": legW, "stroke-linecap": "round" });
  // Back, with wings for a wingback
  const bx0 = left + aw * 0.4;
  const bx1 = right - aw * 0.4;
  if (style === "wingback")
    out += el("path", {
      d: s`M ${bx0} ${seatTop}
           V ${armY - u * 0.02}
           C ${left - aw * 0.15} ${armY - u * 0.08} ${left} ${backTop + u * 0.02} ${bx0 + aw * 0.5} ${backTop}
           Q ${cx} ${backTop - u * 0.06} ${bx1 - aw * 0.5} ${backTop}
           C ${right} ${backTop + u * 0.02} ${right + aw * 0.15} ${armY - u * 0.08} ${bx1} ${armY - u * 0.02}
           V ${seatTop}
           Z`,
      fill: shadeOf(-0.12),
    });
  else
    out += el("rect", {
      x: bx0,
      y: backTop,
      width: bx1 - bx0,
      height: seatTop - backTop + u * 0.02,
      rx: style === "club" ? u * 0.08 : u * 0.03,
      fill: shadeOf(-0.12),
    });
  // Buttons tufting the back
  if (style !== "club" && g.chance(0.5)) {
    let tufts = "";
    for (const [col, row] of [
      [-0.25, 0],
      [0, 0],
      [0.25, 0],
      [-0.125, 1],
      [0.125, 1],
    ])
      tufts += el("circle", {
        cx: cx + col * (bx1 - bx0),
        cy: backTop + (armY - backTop) * (0.35 + row * 0.35),
        r: u * 0.008,
        fill: "#000",
        opacity: "0.25",
      });
    out += tufts;
  }
  // Seat cushion and the front panel under it
  out += el("rect", {
    x: left + aw * 0.7,
    y: seatTop + u * 0.06,
    width: cw - aw * 1.4,
    height: baseY - seatTop - u * 0.06,
    fill: shadeOf(-0.06),
  });
  out += el("rect", {
    x: left + aw * 0.7,
    y: seatTop - u * 0.02,
    width: cw - aw * 1.4,
    height: u * 0.09,
    rx: u * 0.03,
    fill: shadeOf(0.08),
  });
  // A throw cushion leaning on the back
  const cushion = g.chance(0.55);
  if (cushion) {
    const pw = u * 0.17;
    const ph = u * 0.15;
    const room = (bx1 - bx0) / 2 - aw * 0.6 - pw / 2;
    const px = cx + g.f(-1, 1) * Math.max(0, room);
    const py = seatTop - ph * 0.45;
    const pillow = hsl(g.f(0, 360), g.f(35, 65), g.f(55, 75));
    out += el(
      "g",
      { transform: s`rotate(${g.f(-14, 14)} ${px} ${py})` },
      el("rect", { x: px - pw / 2, y: py - ph / 2, width: pw, height: ph, rx: u * 0.03, fill: pillow }),
      g.chance(0.5)
        ? el("rect", { x: px - pw / 2, y: py - ph * 0.08, width: pw, height: ph * 0.16, fill: "#fff", opacity: "0.5" })
        : "",
    );
  }
  // Arms, in front of the seat
  const armR = style === "club" ? aw * 0.5 : u * 0.02;
  out += el("rect", { x: left, y: armY, width: aw, height: baseY - armY, rx: armR, fill: fabric });
  out += el("rect", { x: right - aw, y: armY, width: aw, height: baseY - armY, rx: armR, fill: fabric });
  out += el("rect", {
    x: left + aw * 0.15,
    y: armY + u * 0.01,
    width: aw * 0.18,
    height: (baseY - armY) * 0.5,
    rx: aw * 0.09,
    fill: "#fff",
    opacity: "0.12",
  });
  let tableText = "";
  if (withTable) {
    // A round side table beside the chair, a little taller than the arm
    const tx = side > 0 ? right + u * 0.04 + tableW / 2 : left - u * 0.04 - tableW / 2;
    const tTop = armY - u * 0.02;
    const wood = g.pick(["#8a5a3b", "#c9a477", "#5b3a29", "#e9e3d5", "#3b3b3b"]);
    out += el("ellipse", { cx: tx, cy: floorY, rx: tableW * 0.4, ry: unit * 0.015, fill: "#000", opacity: "0.15" });
    out += el("rect", { x: tx - u * 0.012, y: tTop, width: u * 0.024, height: floorY - tTop, fill: wood });
    out += el("ellipse", { cx: tx, cy: floorY - u * 0.005, rx: tableW * 0.28, ry: u * 0.018, fill: wood });
    out += el("rect", {
      x: tx - tableW / 2,
      y: tTop - u * 0.02,
      width: tableW,
      height: u * 0.025,
      rx: u * 0.01,
      fill: mix(wood, "#000000", 0.1),
    });
    const thing = g.pick(["mug", "plant", "books"]);
    const ty = tTop - u * 0.02;
    if (thing === "mug") {
      const mw = u * 0.035;
      out += el("path", {
        d: s`M ${tx + mw} ${ty - mw * 1.5} c ${mw * 0.6} 0 ${mw * 0.6} ${mw} 0 ${mw}`,
        stroke: "#f4f1ea",
        "stroke-width": mw * 0.3,
        fill: "none",
      });
      out += el("rect", { x: tx - mw, y: ty - mw * 2, width: mw * 2, height: mw * 2, rx: mw * 0.2, fill: "#f4f1ea" });
      tableText = " beside a side table with a mug";
    } else if (thing === "plant") {
      const pr = u * 0.04;
      out += el("path", { d: blob(g, tx, ty - pr * 2.4, pr * 1.3, pr * 1.1, 6, 0.22, 0.08), fill: "#4f8a5a" });
      out += el("polygon", {
        points: pts([
          [tx - pr, ty - pr * 1.4],
          [tx + pr, ty - pr * 1.4],
          [tx + pr * 0.75, ty],
          [tx - pr * 0.75, ty],
        ]),
        fill: "#c4572f",
      });
      tableText = " beside a side table with a plant";
    } else {
      let y = ty;
      for (let k = 0; k < 3; k++) {
        const bh = u * g.f(0.02, 0.03);
        const bw2 = tableW * g.f(0.55, 0.75);
        y -= bh;
        out += el("rect", {
          x: tx - bw2 / 2 + g.f(-0.05, 0.05) * tableW,
          y,
          width: bw2,
          height: bh,
          rx: u * 0.003,
          fill: hsl(g.f(0, 360), g.f(30, 55), g.f(35, 60)),
        });
      }
      tableText = " beside a side table with books";
    }
  }
  const name =
    style === "wingback" ? "A wingback armchair" : style === "modern" ? "A mid-century armchair" : "A club armchair";
  note.alt(`${name}${cushion ? " with a cushion" : ""}${tableText}`);
  note.focus(cx, (backTop + seatTop) / 2);
  return out;
});

type Succulent = "echeveria" | "haworthia" | "jade" | "pearls" | "aloe" | "cactus";
type SucculentPot = "terracotta" | "glazed" | "concrete" | "bowl";

const SUCCULENT_NAMES: Record<Succulent, string> = {
  echeveria: "an echeveria",
  haworthia: "a haworthia",
  jade: "a jade plant",
  pearls: "string of pearls",
  aloe: "an aloe",
  cactus: "a round cactus",
};

/** Shuffles a copy of `items`. */
function shuffled<T>(g: Rand, items: readonly T[]): T[] {
  const out = [...items];
  for (let k = out.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [out[k], out[j]] = [out[j], out[k]];
  }
  return out;
}

/** Compact path data: commands as given, numbers rounded to whole pixels (tenths when small), spaced only where needed. */
function pathData(...items: (string | number)[]): string {
  let out = "";
  let number = false;
  for (const item of items) {
    if (typeof item === "number") {
      const v = Math.abs(item) < 10 ? n(item) : Math.round(item);
      out += (number && v >= 0 ? " " : "") + v;
      number = true;
    } else {
      out += item;
      number = false;
    }
  }
  return out;
}

/** An echeveria: rings of fleshy pointed leaves, seen a little from above. */
function echeveria(g: Rand, cx: number, cy: number, r: number): string {
  const hue = g.pick([150, 165, 175, 185, 300, 120]);
  const sat = g.f(18, 32);
  const light = g.f(52, 60);
  // A point at `angle` (0 is straight back) and `radius` from the heart, squashed by the view.
  const at = (angle: number, radius: number): [number, number] => [
    cx + Math.sin(angle) * radius,
    cy - Math.cos(angle) * radius * 0.55,
  ];
  let out = "";
  [1, 0.68, 0.4].forEach((size, k) => {
    const count = [g.i(8, 10), g.i(6, 8), 5][k];
    const step = (Math.PI * 2) / count;
    const offset = g.f(0, step);
    const radius = r * size;
    // Each leaf: out from a valley along a full belly to a sharp tip, and back in.
    const parts: (string | number)[] = ["M", ...at(offset - step / 2, radius * 0.4)];
    for (let j = 0; j < count; j++) {
      const a = offset + j * step;
      parts.push("Q", ...at(a - step * 0.45, radius * 0.8), ...at(a, radius));
      parts.push("Q", ...at(a + step * 0.45, radius * 0.8), ...at(a + step / 2, radius * 0.4));
    }
    if (k > 0)
      out += el("ellipse", {
        cx,
        cy: cy + radius * 0.06,
        rx: radius * 0.92,
        ry: radius * 0.52,
        fill: "#000",
        opacity: "0.1",
      });
    out += el("path", { d: pathData(...parts, "Z"), fill: hsl(hue + g.f(-5, 5), sat, light + k * 7) });
  });
  return out + el("ellipse", { cx, cy, rx: r * 0.12, ry: r * 0.08, fill: hsl(hue, sat, light + 24) });
}

/** A haworthia: a tight fan of upright spiky leaves with pale stripes. */
function haworthia(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const hue = g.f(120, 150);
  const stripe = hsl(g.f(90, 140), 15, 88);
  const count = g.i(7, 9);
  const wd = spread * g.f(0.17, 0.21);
  // Two layers, the outer leaves behind and the middle ones in front, each striped.
  const layers = [
    { leaves: [] as (string | number)[], stripes: [] as (string | number)[] },
    { leaves: [] as (string | number)[], stripes: [] as (string | number)[] },
  ];
  for (let k = 0; k < count; k++) {
    const t = k / (count - 1) - 0.5;
    const a = t * g.f(1.4, 1.7);
    const len = height * (1 - Math.abs(t) * 0.55) * g.f(0.85, 1);
    const bx = cx + t * spread * 0.6;
    const at = (along: number, side: number): [number, number] => [
      bx + Math.sin(a) * along + Math.cos(a) * side,
      base - Math.cos(a) * along + Math.sin(a) * side,
    ];
    const layer = layers[Math.abs(t) < 0.3 ? 1 : 0];
    layer.leaves.push("M", ...at(0, -wd), "Q", ...at(len * 0.45, -wd), ...at(len, 0));
    layer.leaves.push("Q", ...at(len * 0.45, wd), ...at(0, wd), "Z");
    for (let along = len * 0.3; along < len * 0.8; along += len * 0.13) {
      const half = wd * (1 - along / len);
      const [x0, y0] = at(along, -half);
      const [x1, y1] = at(along + len * 0.02, half);
      layer.stripes.push("M", x0, y0, "l", x1 - x0, y1 - y0);
    }
  }
  let out = "";
  layers.forEach((layer, k) => {
    out += el("path", { d: pathData(...layer.leaves), fill: hsl(hue, g.f(30, 45), 26 + k * 6) });
    out += el("path", {
      d: pathData(...layer.stripes),
      stroke: stripe,
      "stroke-width": wd * 0.18,
      "stroke-linecap": "round",
      opacity: "0.8",
    });
  });
  return out;
}

/** A jade plant: a thick branching trunk with round, fleshy paddle leaves. */
function jade(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const bark = hsl(g.f(25, 60), g.f(20, 32), g.f(36, 46));
  const hue = g.f(105, 140);
  const thick = spread * 0.16;
  const stems: (string | number)[][] = [[], [], []];
  const tips: { x: number; y: number; a: number; end: boolean }[] = [];
  const grow = (x: number, y: number, a: number, len: number, depth: number) => {
    const nx = x + Math.sin(a) * len;
    const ny = y - Math.cos(a) * len;
    stems[depth].push("M", x, y, "Q", x + Math.sin(a) * len * 0.4, y - Math.cos(a) * len * 0.6, nx, ny);
    if (depth === 2) {
      tips.push({ x: nx, y: ny, a, end: true });
      return;
    }
    const branches = depth === 0 ? g.i(2, 3) : g.i(1, 2);
    for (let k = 0; k < branches; k++) {
      const t = branches === 1 ? g.f(-0.5, 0.5) : k / (branches - 1) - 0.5;
      grow(nx, ny, a * 0.5 + t * g.f(1.1, 1.5), len * g.f(0.7, 0.85), depth + 1);
    }
    // A pair of leaves along the way
    if (depth > 0) tips.push({ x: (x + nx) / 2, y: (y + ny) / 2, a, end: false });
  };
  grow(cx + g.f(-0.1, 0.1) * spread, base, g.f(-0.15, 0.15), height * 0.26, 0);
  let out = "";
  stems.forEach((d, k) => {
    if (d.length)
      out += el("path", {
        d: pathData(...d),
        stroke: bark,
        "stroke-width": thick * (1 - k * 0.28),
        "stroke-linecap": "round",
        fill: "none",
      });
  });
  // Leaves as ellipses drawn with two arcs, in two shades
  const leaf = spread * g.f(0.27, 0.31);
  const shades: (string | number)[][] = [[], []];
  for (const tip of tips)
    for (const turn of tip.end ? [-0.9, 0, 0.9] : [-1.3, 1.3]) {
      const a = tip.a + turn + g.f(-0.15, 0.15);
      const dx = Math.sin(a) * leaf * 0.85;
      const dy = -Math.cos(a) * leaf * 0.85;
      const x = tip.x + dx * 0.9;
      const y = tip.y + dy * 0.9;
      const tilt = (Math.atan2(dy, dx) * 180) / Math.PI;
      const arc = ["A", leaf * 0.85, leaf * 0.55, tilt, 0, 1];
      shades[g.i(0, 1)].push("M", x - dx, y - dy, ...arc, x + dx, y + dy, ...arc, x - dx, y - dy);
    }
  shades.forEach((d, k) => {
    if (d.length)
      out += el("path", {
        d: pathData(...d),
        fill: hsl(hue + k * 6, g.f(38, 50), 36 + k * 6),
      });
  });
  return out;
}

/** A ball cactus: a round, ribbed body dotted with spines, sometimes with a flower. */
function ballCactus(g: Rand, cx: number, cy: number, r: number): string {
  const green = hsl(g.f(95, 140), g.f(30, 45), g.f(36, 46));
  let out = el("ellipse", { cx, cy, rx: r, ry: r * 0.92, fill: green });
  const ribs: (string | number)[] = [];
  for (let k = -2; k <= 2; k++) {
    const x = Math.sin(k * 0.55) * r;
    ribs.push("M", cx, cy - r * 0.92, "Q", cx + x * 1.3, cy, cx + x * 0.6, cy + r * 0.85);
  }
  const d = pathData(...ribs);
  out += el("path", { d, stroke: "#000", "stroke-opacity": "0.15", "stroke-width": r * 0.05, fill: "none" });
  // Spines: dots along the ribs, from a dashed stroke
  out += el("path", {
    d,
    stroke: "#f6f1e4",
    "stroke-width": r * 0.1,
    "stroke-linecap": "round",
    "stroke-dasharray": s`0 ${r * 0.24}`,
    "stroke-dashoffset": -r * 0.12,
    fill: "none",
  });
  out += el("ellipse", {
    cx: cx - r * 0.4,
    cy: cy - r * 0.35,
    rx: r * 0.18,
    ry: r * 0.3,
    fill: "#ffffff",
    opacity: "0.15",
  });
  if (g.chance(0.4))
    out += el("path", {
      d: blob(g, cx, cy - r * 0.92, r * 0.3, r * 0.2, 5, 0.3, 0.03),
      fill: hsl(g.f(320, 400), 75, 66),
    });
  return out;
}

/** An aloe: a rosette of long, tapering spears with toothed edges. */
function aloe(g: Rand, cx: number, base: number, height: number, spread: number): string {
  const hue = g.f(95, 150);
  const count = g.i(6, 8);
  const order = Array.from({ length: count }, (_, k) => k).sort(
    (a, b) => Math.abs(b - (count - 1) / 2) - Math.abs(a - (count - 1) / 2),
  );
  let out = "";
  for (const k of order) {
    const t = k / (count - 1) - 0.5;
    const a = t * g.f(1.7, 2.1);
    const len = height * (1 - Math.abs(t) * 0.45) * g.f(0.85, 1);
    const wd = spread * g.f(0.15, 0.19);
    const bend = t * len * 0.35;
    const bx = cx + t * spread * 0.4;
    const at = (u: number, side: number): [number, number] => [
      bx + Math.sin(a) * len * u + Math.cos(a) * (side + bend * u * u),
      base - Math.cos(a) * len * u + Math.sin(a) * (side + bend * u * u),
    ];
    const steps = 7;
    const left: (string | number)[] = [];
    const right: (string | number)[] = [];
    for (let j = 0; j <= steps; j++) {
      const u = j / steps;
      // Every other edge point pokes out a little: the teeth.
      const half = wd * Math.pow(1 - u, 0.8) + (j % 2 && j < steps ? wd * 0.2 : 0);
      left.push(...at(u, -half));
      if (j < steps) right.unshift(...at(u, half));
    }
    out += el("path", {
      d: pathData("M", ...left, "L", ...right, "Z"),
      fill: hsl(hue + g.f(-6, 6), g.f(25, 40), g.f(38, 50)),
    });
  }
  return out;
}

/** String of pearls: a mound of beads with strands trailing over the pot's rim. */
function pearls(g: Rand, cx: number, rimY: number, potW: number, drop: number): string {
  const hue = g.f(90, 125);
  const bead = potW * g.f(0.11, 0.13);
  // Beads are the dots of a dashed stroke: rows over the mound, then the strands.
  const rows: (string | number)[] = [];
  for (let row = 0; row < 3; row++) {
    const half = potW * (1 - row * 0.28);
    const y = rimY - bead * (0.6 + row * 1.5);
    rows.push("M", cx - half, y, "Q", cx, y - bead * (2.4 - row * 0.5), cx + half, y);
  }
  const vines: (string | number)[] = [];
  const strands = g.i(3, 5);
  for (let k = 0; k < strands; k++) {
    const u = (k / (strands - 1) - 0.5) * 2;
    const x0 = cx + u * potW * g.f(0.8, 1.02);
    const len = drop * g.f(0.55, 1);
    const lean = u * potW * 0.18;
    const sway = g.f(-1, 1) * bead * 1.5;
    vines.push("M", x0, rimY - bead, "Q", x0 + lean + sway, rimY + len * 0.5, x0 + lean, rimY + len);
  }
  const strings = pathData(...vines);
  const beads = {
    "stroke-width": bead * 2,
    "stroke-linecap": "round",
    "stroke-dasharray": s`0 ${bead * 2.05}`,
    fill: "none",
  } as const;
  return (
    el("path", { d: strings, stroke: hsl(hue, 35, 30), "stroke-width": bead * 0.3, fill: "none" }) +
    el("path", { d: pathData(...rows), stroke: hsl(hue, g.f(35, 45), g.f(40, 46)), ...beads }) +
    el("path", { d: strings, stroke: hsl(hue, g.f(40, 50), g.f(46, 52)), ...beads })
  );
}

/** A color and a lighter version of it, for a pot and its rim. */
const tones = (hue: number, sat: number, light: number): [string, string] => [
  hsl(hue, sat, light),
  hsl(hue, sat, Math.min(96, light + 9)),
];

/** A pot of the given style, with its shadow, standing at `cx` on `base`. */
function succulentPot(
  g: Rand,
  style: SucculentPot,
  cx: number,
  base: number,
  pw: number,
  ph: number,
  unit: number,
): string {
  const rimY = base - ph;
  let out = el("ellipse", { cx, cy: base, rx: pw * 1.2, ry: unit * 0.014, fill: "#000", opacity: "0.14" });
  if (style === "terracotta") {
    const [clay, clayLight] = tones(g.f(12, 24), g.f(48, 60), g.f(46, 58));
    out += el("polygon", {
      points: pts([
        [cx - pw, rimY],
        [cx + pw, rimY],
        [cx + pw * 0.76, base],
        [cx - pw * 0.76, base],
      ]),
      fill: clay,
    });
    out += el("rect", {
      x: cx - pw * 1.08,
      y: rimY - ph * 0.04,
      width: pw * 2.16,
      height: ph * 0.24,
      rx: unit * 0.005,
      fill: clayLight,
    });
  } else if (style === "glazed") {
    const [glaze, glazeLight] = g.chance(0.3)
      ? tones(g.f(30, 50), g.f(20, 40), g.f(84, 90))
      : tones(g.f(170, 430) % 360, g.f(25, 42), g.f(45, 62));
    out += el("path", {
      d: s`M ${cx - pw} ${rimY} V ${base - ph * 0.3} Q ${cx - pw} ${base} ${cx - pw * 0.7} ${base}
           H ${cx + pw * 0.7} Q ${cx + pw} ${base} ${cx + pw} ${base - ph * 0.3} V ${rimY} Z`,
      fill: glaze,
    });
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph * 0.08, fill: glazeLight });
    out += el("rect", {
      x: cx - pw * 0.62,
      y: rimY + ph * 0.2,
      width: pw * 0.16,
      height: ph * 0.5,
      rx: pw * 0.08,
      fill: "#ffffff",
      opacity: "0.22",
    });
  } else if (style === "concrete") {
    const [grey, greyLight] = tones(g.f(25, 60), g.f(3, 8), g.f(62, 74));
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph, rx: unit * 0.004, fill: grey });
    out += el("rect", { x: cx - pw, y: rimY, width: pw * 2, height: ph * 0.1, fill: greyLight });
    const dots: (string | number)[] = [];
    for (let k = 0; k < 6; k++) dots.push("M", cx + g.f(-0.85, 0.85) * pw, rimY + g.f(0.2, 0.9) * ph, "h0");
    out += el("path", {
      d: pathData(...dots),
      stroke: "#000",
      "stroke-width": unit * 0.006,
      "stroke-linecap": "round",
      opacity: "0.18",
    });
  } else {
    const [glaze, glazeLight] = g.chance(0.4)
      ? tones(g.f(20, 45), g.f(15, 35), g.f(82, 88))
      : tones(g.f(170, 430) % 360, g.f(25, 45), g.f(45, 65));
    out += el("path", {
      d: s`M ${cx - pw} ${rimY}
           C ${cx - pw} ${base - ph * 0.1} ${cx - pw * 0.7} ${base} ${cx - pw * 0.45} ${base}
           H ${cx + pw * 0.45}
           C ${cx + pw * 0.7} ${base} ${cx + pw} ${base - ph * 0.1} ${cx + pw} ${rimY} Z`,
      fill: glaze,
    });
    out += el("rect", {
      x: cx - pw,
      y: rimY - ph * 0.04,
      width: pw * 2,
      height: ph * 0.12,
      rx: ph * 0.06,
      fill: glazeLight,
    });
  }
  return out;
}

/** Two to four potted succulents side by side on a table or windowsill. */
export const succulents = defineKind("succulents", "Succulents", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.78, 0.84);
  const base = top + unit * g.f(0.035, 0.05);
  const sill = g.chance(0.5);
  const wall = hsl(g.f(0, 360), g.f(12, 30), g.f(84, 92));
  let out = sill
    ? table(g, w, h, top, wall, hsl(g.f(30, 50), g.f(10, 25), g.f(86, 93)))
    : table(g, w, h, top, wall, hsl(g.f(18, 40), g.f(20, 35), g.f(46, 62)));
  if (sill) {
    // A window behind the sill
    const x0 = w * 0.07;
    const x1 = w * 0.93;
    const y0 = h * 0.07;
    const bar = unit * 0.028;
    const frame = hsl(g.f(30, 50), g.f(5, 15), g.f(92, 97));
    const glass = hsl(g.f(190, 215), g.f(40, 60), g.f(80, 88));
    const panes = w > h * 2 ? 3 : 2;
    const split = y0 + (top - y0) * g.f(0.35, 0.45);
    // Glass inside a frame, crossed by glazing bars
    out += el("rect", {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: top - y0,
      fill: glass,
      stroke: frame,
      "stroke-width": bar * 2,
    });
    const bars: (string | number)[] = ["M", x0, split, "H", x1];
    for (let k = 1; k < panes; k++) bars.push("M", x0 + ((x1 - x0) * k) / panes, y0, "V", top);
    out += el("path", { d: pathData(...bars), stroke: frame, "stroke-width": bar });
    out += el("rect", { y: top - unit * 0.012, width: w, height: unit * 0.024, fill: "#000", opacity: "0.06" });
  }
  // How many pots fit: fewer when narrow.
  const aspect = w / h;
  const count = aspect < 0.9 ? 2 : aspect < 1.1 ? g.i(2, 3) : aspect < 2 ? (g.chance(0.75) ? 3 : 2) : g.i(3, 4);
  const plants = shuffled(g, ["echeveria", "haworthia", "jade", "pearls", "aloe", "cactus"] as const).slice(0, count);
  const styles = shuffled(g, ["terracotta", "glazed", "concrete", "bowl", "terracotta", "glazed"] as const);
  const items = plants.map((plant: Succulent, k) => {
    let style: SucculentPot = styles[k];
    // Tall or trailing plants need a proper pot, not a shallow bowl.
    if (style === "bowl" && (plant === "jade" || plant === "pearls" || plant === "aloe")) style = "glazed";
    const bowl = style === "bowl";
    const pw = unit * g.f(0.13, 0.155) * (bowl ? 1.25 : 1);
    const ph = unit * (plant === "pearls" ? g.f(0.17, 0.21) : g.f(0.12, 0.19)) * (bowl ? 0.45 : 1);
    const size = g.f(0.9, 1.1);
    const reach = { echeveria: 1.35, haworthia: 1.15, jade: 1.8, pearls: 1.15, aloe: 1.9, cactus: 1 }[plant] * size;
    return { plant, style, pw, ph, size, reach, half: 0 };
  });
  // Fit the group across the width.
  const gap = unit * g.f(0.03, 0.06);
  for (const it of items) it.half = Math.max(it.pw * 1.1, it.pw * it.reach);
  const total = items.reduce((sum, it) => sum + it.half * 2, 0) + gap * (count - 1);
  const fit = Math.min(1, (w * 0.86) / total);
  let x = w / 2 - (total * fit) / 2 + w * g.f(-0.03, 0.03) * fit;
  let tallest = base;
  for (const it of items) {
    const pw = it.pw * fit;
    const ph = it.ph * fit;
    const half = it.half * fit;
    const cx = x + half;
    x += half * 2 + gap * fit;
    const rimY = base - ph;
    const grow = (it.style === "bowl" ? pw / 1.25 : pw) * it.size;
    let back = "";
    let front = "";
    if (it.plant === "echeveria") {
      const r = grow * 1.3;
      front = echeveria(g, cx, rimY - r * 0.12, r);
      tallest = Math.min(tallest, rimY - r * 0.7);
    } else if (it.plant === "haworthia") {
      const hh = grow * g.f(1.5, 2);
      back = haworthia(g, cx, rimY + ph * 0.1, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "jade") {
      const hh = grow * g.f(2.3, 3);
      back = jade(g, cx, rimY + ph * 0.1, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "aloe") {
      const hh = grow * g.f(2.2, 2.8);
      back = aloe(g, cx, rimY + ph * 0.15, hh, grow);
      tallest = Math.min(tallest, rimY - hh);
    } else if (it.plant === "pearls") {
      front = pearls(g, cx, rimY + ph * 0.05, pw, ph * 0.85);
      tallest = Math.min(tallest, rimY - pw * 0.5);
    } else {
      const r = grow * 0.85;
      back = ballCactus(g, cx, rimY - r * 0.55, r);
      tallest = Math.min(tallest, rimY - r * 1.5);
    }
    out += back + succulentPot(g, it.style, cx, base, pw, ph, unit) + front;
  }
  const names = andList(plants.map(plant => SUCCULENT_NAMES[plant]));
  note.alt(`${capitalize(numberWord(count))} potted succulents: ${names}, on a ${sill ? "windowsill" : "table"}`);
  note.focus(w / 2, (tallest + base) / 2);
  return out;
});
