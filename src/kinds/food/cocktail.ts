import { defineKind, el, hsl, mix, type Point, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { CITRUS, fruitWheel, vessel } from "./shared";

const DRINKS = ["#e0a03a", "#f28aa0", "#f6d365", "#a8dcc4", "#e8553a", "#e4eef2", "#9b2f45", "#f3b562"];

const GARNISHES: Record<string, string[]> = {
  coupe: ["citrus", "cherry", "umbrella"],
  martini: ["olive", "olive", "cherry", "citrus"],
  highball: ["citrus", "mint", "umbrella"],
  tumbler: ["citrus", "cherry", "mint"],
};

/**
 * A cocktail on a bar or table: a coupe, martini glass, highball or tumbler, with a garnish and sometimes ice.
 *
 * @category Food
 */
export const cocktail = /* @__PURE__ */ defineKind("cocktail", "Cocktail", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const type = g.pick(["coupe", "martini", "highball", "tumbler"] as const);
  const garnish = g.pick(GARNISHES[type]);
  const liquid = g.pick(DRINKS);
  const dark = g.chance(0.4);
  const coaster = g.chance(0.35);
  const straw = type === "highball" || (type === "tumbler" && garnish !== "cherry" && g.chance(0.4));
  const stemmed = type === "coupe" || type === "martini";
  // Sizes as fractions of the scale S: rim half-width, bowl height, stem height and foot
  const [r0, bowl0, stem0] = {
    coupe: [0.21, 0.13, 0.2],
    martini: [0.22, 0.21, 0.19],
    highball: [0.115, 0.44, 0],
    tumbler: [0.16, 0.26, 0],
  }[type];
  const extra0 = Math.max(
    { umbrella: 0.2, mint: 0.13, citrus: 0.1, olive: 0.1, cherry: 0.05 }[garnish] ?? 0,
    straw ? 0.12 : 0,
  );
  const S = unit * Math.min(1.45, 0.82 / (bowl0 + stem0 + extra0 + 0.03));
  const R = r0 * S;
  const bowl = bowl0 * S;
  const stem = stem0 * S;
  const extra = extra0 * S;
  const tilt = 0.2;
  const cx = w / 2;
  const foot = stemmed ? S * 0.12 : R;
  // Low enough to center the glass, high enough to keep a coaster in the picture
  const baseY = Math.min(
    h * 0.93,
    h - Math.max(foot, R) * 1.45 * 0.22 * 1.3 - unit * 0.02,
    h / 2 + (bowl + stem + extra) / 2 + S * 0.02,
  );
  const rimY = baseY - stem - bowl;
  const wall = dark ? hsl(g.f(0, 360), g.f(20, 35), g.f(22, 30)) : hsl(g.f(0, 360), 30, 86);
  const wood = dark ? hsl(g.f(15, 35), 35, g.f(30, 40)) : hsl(g.f(20, 40), 35, 62);
  let out = table(g, w, h, Math.max(h * 0.08, baseY - unit * 0.14), wall, wood);
  if (coaster) {
    const cr = Math.max(foot, R) * 1.45;
    const paper = g.pick(["#fbfaf4", "#2b2b2b", "#c23b22", "#2b5d8a", "#d9b07a"]);
    out += el("ellipse", { cx, cy: baseY + cr * 0.05, rx: cr, ry: cr * 0.22, fill: mix(paper, "#000000", 0.25) });
    out += el("ellipse", { cx, cy: baseY, rx: cr, ry: cr * 0.22, fill: paper });
  }
  out += el("ellipse", { cx, cy: baseY, rx: foot * 1.05, ry: foot * 0.22, fill: "#000", opacity: "0.18" });
  const glass = (d: string) => el("path", { d, fill: "#ffffff", opacity: dark ? "0.18" : "0.4" });
  const edge = (d: string) =>
    el("path", { d, fill: "none", stroke: "#ffffff", "stroke-width": unit * 0.007, opacity: "0.85" });
  // The glass's outline and the inside its drink fills
  let outer: string;
  let inner: string;
  let half: (t: number) => number;
  let innerBot: number;
  let level: number;
  if (stemmed) {
    const bowlBot = rimY + bowl;
    half = type === "coupe" ? t => R * Math.sqrt(1 - 0.97 * t * t) : t => R * (1 - 0.96 * t);
    outer = vessel(cx, rimY, bowlBot, half, tilt);
    innerBot = bowlBot - S * 0.01;
    inner = vessel(cx, rimY, innerBot, t => half(t) * 0.95, tilt);
    level = type === "coupe" ? 0.2 : 0.16;
    // Foot and stem
    const fy = baseY - foot * 0.2;
    out += el("ellipse", { cx, cy: fy, rx: foot, ry: foot * 0.2, fill: "#ffffff", opacity: dark ? "0.3" : "0.55" });
    out += el("ellipse", {
      cx,
      cy: fy,
      rx: foot,
      ry: foot * 0.2,
      fill: "none",
      stroke: "#ffffff",
      "stroke-width": unit * 0.006,
    });
    out += el("rect", {
      x: cx - S * 0.012,
      y: bowlBot - S * 0.01,
      width: S * 0.024,
      height: fy - bowlBot + S * 0.01,
      fill: "#ffffff",
      opacity: dark ? "0.45" : "0.75",
    });
  } else {
    const taper = type === "highball" ? 0.06 : 0.1;
    half = t => R * (1 - taper * t);
    outer = vessel(cx, rimY, baseY - R * (1 - taper) * tilt, half, tilt);
    innerBot = baseY - bowl * (type === "highball" ? 0.08 : 0.14) - R * tilt;
    inner = vessel(cx, rimY, innerBot, t => half(t) - S * 0.012, tilt);
    level = type === "highball" ? 0.14 : 0.36;
  }
  const halfIn = (t: number) => (stemmed ? half(t) * 0.95 : half(t) - S * 0.012);
  const levelY = rimY + (innerBot - rimY) * level;
  out += glass(outer);
  // The drink, its surface and any ice, all inside the glass
  const clip = g.id("drink");
  out += el("defs", {}, el("clipPath", { id: clip }, el("path", { d: inner })));
  const sr = halfIn(level);
  let drink = el("rect", {
    x: cx - R * 1.2,
    y: levelY,
    width: R * 2.4,
    height: baseY - levelY,
    fill: liquid,
    opacity: "0.85",
  });
  drink += el("ellipse", { cx, cy: levelY, rx: sr, ry: sr * tilt, fill: mix(liquid, "#ffffff", 0.3), opacity: "0.9" });
  const ice = g.fork("ice");
  const cube = (x: number, y: number, c: number) =>
    el("rect", {
      x: x - c / 2,
      y: y - c / 2,
      width: c,
      height: c,
      rx: c * 0.18,
      fill: "#ffffff",
      "fill-opacity": "0.35",
      stroke: "#ffffff",
      "stroke-opacity": "0.75",
      "stroke-width": c * 0.05,
      transform: s`rotate(${ice.f(-15, 15)} ${x} ${y})`,
    });
  const cherryLeft = type === "tumbler" && garnish === "cherry";
  if (type === "highball") {
    const c = halfIn(0.5) * 1.05;
    for (let k = 0; k < 3; k++) drink += cube(cx + c * ice.f(-0.25, 0.25), innerBot - c * (0.4 + k * 0.92), c);
  } else if (type === "tumbler") {
    const c = halfIn(0.5) * (cherryLeft ? 0.95 : 1.1);
    drink += cube(cx + (cherryLeft ? halfIn(0.5) * 0.25 : c * ice.f(-0.1, 0.1)), innerBot - c * 0.52, c);
  }
  out += el("g", { "clip-path": `url(#${clip})` }, drink);
  if (straw) {
    const top: Point = [cx + R * 0.7, rimY - extra];
    out += el("path", {
      d: s`M ${cx - halfIn(0.8) * 0.3} ${innerBot - S * 0.02} L ${top[0]} ${top[1]}`,
      stroke: g.pick(["#f25c78", "#2b2b2b", "#4fb4e6", "#f6d365", "#fbfaf4"]),
      "stroke-width": S * 0.018,
      "stroke-linecap": "round",
    });
  }
  const gg = g.fork("garnish");
  if (garnish === "citrus") {
    const [rind, flesh] = gg.pick(CITRUS);
    const wr = S * 0.075;
    out += fruitWheel(cx + R * 0.9, rimY - wr * 0.35, wr, rind, flesh);
  } else if (garnish === "cherry") {
    const cr = S * 0.035;
    const x = cherryLeft ? cx - halfIn(0.8) * 0.55 : cx;
    // Sunk to the bottom of the glass
    const y = cherryLeft ? innerBot - cr : type === "coupe" ? innerBot - cr * 1.1 : rimY + (innerBot - rimY) * 0.84;
    out += el("path", {
      d: s`M ${x} ${y - cr * 0.8} Q ${x + cr * 0.6} ${y - cr * 3} ${x + cr * 2.2} ${y - cr * 4}`,
      stroke: "#5a3a1a",
      "stroke-width": cr * 0.22,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += el("circle", { cx: x, cy: y, r: cr, fill: "#b3121f" });
    out += el("circle", { cx: x - cr * 0.35, cy: y - cr * 0.35, r: cr * 0.25, fill: "#fff", opacity: "0.5" });
  } else if (garnish === "olive") {
    const a: Point = [cx - R * 0.8, rimY - S * 0.09];
    const b: Point = [cx + R * 0.12, rimY + bowl * 0.72];
    out += el("path", {
      d: s`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`,
      stroke: "#e8d5b0",
      "stroke-width": S * 0.008,
      "stroke-linecap": "round",
    });
    out += el("circle", { cx: a[0], cy: a[1], r: S * 0.012, fill: "#c23b22" });
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    for (const f of [0.55, 0.78]) {
      const x = a[0] + (b[0] - a[0]) * f;
      const y = a[1] + (b[1] - a[1]) * f;
      out += el("ellipse", {
        cx: x,
        cy: y,
        rx: S * 0.038,
        ry: S * 0.029,
        fill: "#8a9a3b",
        transform: s`rotate(${angle} ${x} ${y})`,
      });
      out += el("circle", { cx: x - S * 0.012, cy: y - S * 0.008, r: S * 0.012, fill: "#d9442b" });
    }
  } else if (garnish === "mint") {
    const a: Point = [cx - R * 0.2, levelY + S * 0.02];
    const b: Point = [cx - R * 0.45, rimY - extra * 0.85];
    out += el("path", { d: s`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, stroke: "#4f8f34", "stroke-width": S * 0.008 });
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    [0.45, 0.6, 0.75, 0.88, 1].forEach((f, k) => {
      const x = a[0] + (b[0] - a[0]) * f;
      const y = a[1] + (b[1] - a[1]) * f;
      const side = k === 4 ? 0 : k % 2 ? 1 : -1;
      const turn = angle + side * 55;
      const lx = x + Math.cos((turn * Math.PI) / 180) * S * 0.03;
      const ly = y + Math.sin((turn * Math.PI) / 180) * S * 0.03;
      out += el("ellipse", {
        cx: lx,
        cy: ly,
        rx: S * 0.034,
        ry: S * 0.018,
        fill: k % 2 ? "#5aa547" : "#6fbf4f",
        transform: s`rotate(${turn} ${lx} ${ly})`,
      });
    });
  } else if (garnish === "umbrella") {
    const a: Point = [cx - R * 0.15, levelY + S * 0.03];
    const b: Point = [cx + R * 0.45 + S * 0.05, rimY - extra * 0.72];
    out += el("path", { d: s`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, stroke: "#e8d5b0", "stroke-width": S * 0.008 });
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
    const ur = S * 0.1;
    const paper = gg.pick(["#f25c78", "#4fb4e6", "#f2c14e", "#7bd389", "#9b6bd6"]);
    let scallops = "";
    for (let k = 0; k < 4; k++) scallops += s` Q ${ur * (0.75 - k * 0.5)} ${ur * 0.12} ${ur * (0.5 - k * 0.5)} 0`;
    out += el(
      "g",
      { transform: s`translate(${b[0]} ${b[1]}) rotate(${angle})` },
      el("path", { d: s`M ${-ur} 0 Q 0 ${-ur * 0.75} ${ur} 0${scallops} Z`, fill: paper }),
      el("path", {
        d: s`M 0 ${-ur * 0.37} L ${-ur * 0.5} 0 M 0 ${-ur * 0.37} L 0 0 M 0 ${-ur * 0.37} L ${ur * 0.5} 0`,
        stroke: "#fff",
        "stroke-width": ur * 0.05,
        opacity: "0.6",
      }),
    );
  }
  // The glass in front: its edges, rim and a highlight
  out += edge(outer);
  out += el("path", {
    d: s`M ${cx - half(0.15) * 0.72} ${rimY + (innerBot - rimY) * 0.15} L ${cx - half(0.6) * 0.72} ${rimY + (innerBot - rimY) * 0.6}`,
    stroke: "#ffffff",
    "stroke-width": S * 0.014,
    "stroke-linecap": "round",
    opacity: "0.55",
  });
  const what = {
    coupe: "A cocktail in a coupe glass",
    martini: "A martini",
    highball: "A tall cocktail over ice",
    tumbler: "A cocktail on the rocks",
  }[type];
  const extras = andList([
    {
      citrus: "a citrus wheel",
      cherry: "a cherry",
      olive: "olives on a pick",
      mint: "a sprig of mint",
      umbrella: "a paper umbrella",
    }[garnish],
    straw && "a straw",
  ]);
  note.alt(`${what} with ${extras} on a ${dark ? "bar" : "table"}`);
  note.focus(cx, (rimY + innerBot) / 2);
  return out;
});
