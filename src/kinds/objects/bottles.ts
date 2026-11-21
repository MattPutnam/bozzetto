import { defineKind, el, mix, s } from "../../draw/core";
import { andList, tally } from "../../draw/words";

const MORANDI = ["#c9b8a4", "#a89f91", "#8e9aa0", "#d7cbb7", "#b07d62", "#6f7d74", "#e3dccf", "#9c8b7a", "#7f8c9a"];

/** Bottles, jars and boxes in muted colors, after Morandi's still lifes. */
export const bottles = /* @__PURE__ */ defineKind("bottles", "Bottles", (g, w, h, note) => {
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
