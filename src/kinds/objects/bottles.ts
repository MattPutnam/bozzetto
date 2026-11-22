import { defineKind, el, mix, s } from "../../draw/core";
import { andList, tally } from "../../draw/words";

/** Muted Morandi colors, pale to dark. */
const MORANDI = [
  "#efe9df",
  "#e3dccf",
  "#d7cbb7",
  "#e0c9b8",
  "#c8cfc9",
  "#c9b8a4",
  "#a89f91",
  "#8e9aa0",
  "#b07d62",
  "#9c8b7a",
  "#7f8c9a",
  "#6f7d74",
  "#5d6b73",
  "#8a6f5a",
];

/** Light walls with pale tabletops, and darker grounds that set off pale pots. */
const SCENES = [
  { wall: ["#e6ddd0", "#d9d4c7", "#e8e1d6", "#cfd3cc"], table: ["#cdbfa9", "#c3baa8", "#d4c7b0"] },
  { wall: ["#8f8b84", "#7d8580", "#968a7c", "#7b8088"], table: ["#5f584f", "#665c52", "#585c58"] },
];

const rgb = (color: string): number[] => [1, 3, 5].map(k => parseInt(color.slice(k, k + 2), 16));
/** Perceived lightness, 0 to 1. */
const light = (color: string): number => {
  const [r, gr, b] = rgb(color);
  return (0.299 * r + 0.587 * gr + 0.114 * b) / 255;
};
const distance = (a: string, b: string): number => {
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

type Item = { kind: string; x: number; y: number; hw: number; h: number; color: string };

/** Height over half-width for each kind of vessel. */
const SHAPE: Record<string, [number, number]> = {
  bottle: [5, 7],
  vase: [3.6, 5],
  jar: [1.6, 2.4],
  box: [1.1, 1.8],
};

/**
 * Bottles, jars and boxes in muted colors, grouped in two rows after Morandi's still lifes.
 *
 * @category Objects
 */
export const bottles = /* @__PURE__ */ defineKind("bottles", "Bottles", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.6, 0.68);
  // The back row stands just behind the table's front edge, the front row nearer
  const backY = top + (h - top) * g.f(0.15, 0.26);
  const frontY = top + (h - top) * g.f(0.56, 0.68);
  const scene = SCENES[g.chance(0.35) ? 1 : 0];
  const wall = g.pick(scene.wall);
  const tableTop = g.pick(scene.table);
  // Every pot stands clear of both the wall and the table
  const palette = MORANDI.filter(
    c => Math.abs(light(c) - light(wall)) > 0.17 && Math.abs(light(c) - light(tableTop)) > 0.1,
  );
  let out = el("rect", { width: w, height: h, fill: wall });
  out += el("rect", { y: top, width: w, height: h - top, fill: tableTop });
  // Table edge catching the light
  out += el("rect", { y: top, width: w, height: unit * 0.008, fill: mix(tableTop, "#ffffff", 0.2) });

  // The group spans most of the width; the back row sets the rhythm.
  const span = Math.min(w * 0.86, h * 2.8);
  const start = (w - span) / 2;
  const nBack = Math.max(2, Math.min(7, Math.round(span / (unit * g.f(0.3, 0.4)))));
  const spacing = span / nBack;
  const reach = backY - h * 0.08;
  const items: Item[] = [];
  const colorFor = (avoid: string[]): string => {
    const choices = palette.filter(c => avoid.every(a => distance(a, c) > 45));
    return g.pick(choices.length ? choices : palette);
  };
  const tallest = g.i(0, nBack - 1);
  for (let k = 0; k < nBack; k++) {
    // The tallest pot, which anchors the group, is always a bottle or a vase
    const kind = g.pick(k === tallest ? ["bottle", "bottle", "vase"] : ["bottle", "bottle", "vase", "bottle", "jar"]);
    const height = reach * (k === tallest ? g.f(0.88, 1) : kind === "jar" ? g.f(0.45, 0.6) : g.f(0.58, 0.9));
    const hw = Math.min(height / g.f(...SHAPE[kind]), spacing * 0.32);
    const x = start + spacing * (k + 0.5 + g.f(-0.1, 0.1));
    items.push({ kind, x, y: backY, hw, h: height, color: colorFor(items.slice(-1).map(i => i.color)) });
  }
  const back = items.slice();
  const avgBack = back.reduce((sum, item) => sum + item.h, 0) / nBack;
  for (let k = 0; k < nBack - 1; k++) {
    // Front pots sit in the gaps between back ones, low enough not to hide them
    if (nBack > 3 && g.chance(0.2)) continue;
    const kind = g.pick(["jar", "box", "bottle", "vase", "jar"]);
    const height = avgBack * (kind === "bottle" || kind === "vase" ? g.f(0.58, 0.75) : g.f(0.32, 0.5));
    const hw = Math.min(height / g.f(...SHAPE[kind]), spacing * 0.36);
    const x = (back[k].x + back[k + 1].x) / 2 + spacing * g.f(-0.08, 0.08);
    items.push({ kind, x, y: frontY, hw, h: height, color: colorFor([back[k].color, back[k + 1].color]) });
  }
  if (nBack === 2 && g.chance(0.6)) {
    // A small pot out front at one end, so a short group still reads as an arrangement
    const end = g.chance(0.5) ? 0 : 1;
    const height = avgBack * g.f(0.28, 0.4);
    const hw = Math.min(height / g.f(...SHAPE.box), spacing * 0.3);
    const x = back[end].x + (end ? 1 : -1) * spacing * 0.22;
    items.push({
      kind: g.pick(["box", "jar"]),
      x,
      y: frontY + (h - frontY) * 0.25,
      hw,
      h: height,
      color: colorFor([back[end].color]),
    });
  }

  const kinds: string[] = [];
  let sumX = 0;
  let sumY = 0;
  for (const { kind, x, y, hw, h: ih, color } of items) {
    kinds.push(kind);
    sumX += x;
    sumY += y - ih * 0.45;
    const shade = mix(color, "#000000", 0.14);
    // Contact shadow on the table
    out += el("ellipse", { cx: x + hw * 0.15, cy: y, rx: hw * 1.25, ry: unit * 0.012, fill: "#000", opacity: "0.14" });
    if (kind === "bottle")
      // Bottle with shoulders, a neck and a lip
      out +=
        el("path", {
          d: s`M ${x - hw} ${y}
               V ${y - ih * 0.6}
               Q ${x - hw} ${y - ih * 0.72} ${x - hw * 0.35} ${y - ih * 0.78}
               V ${y - ih * 0.97}
               H ${x + hw * 0.35}
               V ${y - ih * 0.78}
               Q ${x + hw} ${y - ih * 0.72} ${x + hw} ${y - ih * 0.6}
               V ${y}
               Z`,
          fill: color,
        }) + el("rect", { x: x - hw * 0.42, y: y - ih, width: hw * 0.84, height: ih * 0.04, fill: shade });
    else if (kind === "jar")
      // Jar and its lid
      out +=
        el("rect", { x: x - hw, y: y - ih * 0.88, width: hw * 2, height: ih * 0.88, rx: hw * 0.22, fill: color }) +
        el("rect", { x: x - hw * 0.86, y: y - ih, width: hw * 1.72, height: ih * 0.14, rx: hw * 0.06, fill: shade });
    else if (kind === "box")
      // Box and its lit top face
      out +=
        el("rect", { x: x - hw, y: y - ih * 0.86, width: hw * 2, height: ih * 0.86, fill: color }) +
        el("polygon", {
          points: s`${x - hw},${y - ih * 0.86} ${x + hw},${y - ih * 0.86} ${x + hw * 1.25},${y - ih} ${x - hw * 0.75},${y - ih}`,
          fill: mix(color, "#ffffff", 0.22),
        });
    else
      // Vase
      out += el("path", {
        d: s`M ${x - hw * 0.4} ${y - ih}
             Q ${x - hw * 1.75} ${y - ih * 0.42} ${x - hw * 0.7} ${y}
             H ${x + hw * 0.7}
             Q ${x + hw * 1.75} ${y - ih * 0.42} ${x + hw * 0.4} ${y - ih}
             Z`,
        fill: color,
      });
    // Shaded side and highlight
    if (kind !== "vase")
      out += el("rect", {
        x: x + hw * 0.45,
        y: y - ih * (kind === "bottle" ? 0.6 : 0.86),
        width: hw * 0.55,
        height: ih * (kind === "bottle" ? 0.6 : 0.86),
        fill: "#000",
        opacity: "0.07",
      });
    out += el("rect", {
      x: x - hw * 0.6,
      y: y - ih * (kind === "box" ? 0.75 : 0.55),
      width: hw * 0.18,
      height: ih * (kind === "box" || kind === "jar" ? 0.5 : 0.35),
      rx: hw * 0.09,
      fill: "#fff",
      opacity: "0.2",
    });
  }
  const plural = (name: string): string => (name === "box" ? "boxes" : `${name}s`);
  note.alt(`A still life of ${andList(tally(kinds, plural))}, after Giorgio Morandi`);
  note.focus(sumX / items.length, sumY / items.length);
  return out;
});
