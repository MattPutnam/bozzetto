import { defineKind, el, fill, hsl, type Point, s } from "../../draw/core";
import { numberWord } from "../../draw/words";

const LADYBUGS = [
  { shell: "#d8322b", spot: "#1a1414" },
  { shell: "#e8731c", spot: "#1a1414" },
  { shell: "#f2b71f", spot: "#1a1414" },
  { shell: "#c62828", spot: "#1a1414" },
  { shell: "#1f1a1a", spot: "#d8322b" },
] as const;

/**
 * A ladybug crawling across a leaf, seen from above.
 *
 * @category Animals
 */
export const ladybug = /* @__PURE__ */ defineKind("ladybug", "Ladybug", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const colors = g.pick(LADYBUGS);
  const leafHue = g.f(90, 130);
  const leafAngle = g.f(-30, 30) + g.pick([0, 180]);
  const lx = w / 2;
  const ly = h / 2;
  const L = Math.max(w, h) * 0.55 + unit * 0.2;
  const lw = unit * g.f(0.38, 0.44);
  let out = fill(w, h, hsl(leafHue + g.f(-20, 20), 30, g.f(28, 38)));
  // Leaves behind, blurred into the background.
  for (let k = g.i(3, 5); k > 0; k--) {
    const x = w * g.f(0, 1);
    const y = h * g.f(0, 1);
    out += el("ellipse", {
      cx: x,
      cy: y,
      rx: unit * g.f(0.25, 0.4),
      ry: unit * g.f(0.1, 0.16),
      fill: hsl(leafHue + g.f(-15, 15), 35, g.f(36, 46)),
      transform: s`rotate(${g.f(0, 180)} ${x} ${y})`,
    });
  }
  // The leaf, its midrib and veins, all turned to the leaf's angle.
  const leafColor = hsl(leafHue, g.f(45, 60), g.f(44, 52));
  const vein = hsl(leafHue, 40, 66);
  let veins = s`M ${lx - L} ${ly} L ${lx + L * 0.95} ${ly}`;
  for (let k = 1; k <= 6; k++) {
    const x = lx - L + (k / 7) * L * 1.9;
    const width = lw * Math.sin((k / 7) * Math.PI) * 0.85;
    veins += s` M ${x} ${ly} Q ${x + width * 0.4} ${ly - width * 0.5} ${x + width * 0.75} ${ly - width}`;
    veins += s` M ${x} ${ly} Q ${x + width * 0.4} ${ly + width * 0.5} ${x + width * 0.75} ${ly + width}`;
  }
  out += el(
    "g",
    { transform: s`rotate(${leafAngle} ${lx} ${ly})` },
    el("path", {
      d: s`M ${lx - L * 1.05} ${ly}
           C ${lx - L * 0.5} ${ly - lw * 1.3} ${lx + L * 0.5} ${ly - lw * 1.2} ${lx + L} ${ly}
           C ${lx + L * 0.5} ${ly + lw * 1.2} ${lx - L * 0.5} ${ly + lw * 1.3} ${lx - L * 1.05} ${ly} Z`,
      fill: leafColor,
    }),
    el("path", { d: veins, stroke: vein, "stroke-width": Math.max(1.5, unit * 0.01), fill: "none", opacity: "0.7" }),
  );
  // A dewdrop on the leaf.
  const dew = g.chance(0.4);
  // The ladybug, heading along the leaf at a slight angle.
  const r = unit * g.f(0.12, 0.15);
  const heading = leafAngle + g.f(-35, 35) - 90;
  const along = g.f(-0.25, 0.25) * L;
  const rad = (leafAngle * Math.PI) / 180;
  const bx = lx + Math.cos(rad) * along;
  const by = ly + Math.sin(rad) * along;
  if (dew) {
    const dx = bx - Math.cos(rad) * r * 2.2 + Math.sin(rad) * lw * 0.45;
    const dy = by - Math.sin(rad) * r * 2.2 - Math.cos(rad) * lw * 0.45;
    out += el("circle", { cx: dx, cy: dy, r: r * 0.28, fill: "#fff", opacity: "0.35" });
    out += el("circle", { cx: dx - r * 0.08, cy: dy - r * 0.08, r: r * 0.08, fill: "#fff", opacity: "0.8" });
  }
  // Drawn pointing up (head at -y), then turned to its heading.
  let bug = el("ellipse", { cx: bx, cy: by + r * 0.08, rx: r * 1.05, ry: r * 1.08, fill: "#000", opacity: "0.2" });
  // Legs: three a side.
  let legs = "";
  for (const sd of [-1, 1])
    for (const k of [-0.45, 0, 0.45])
      legs += s`M ${bx + sd * r * 0.7} ${by + k * r} l ${sd * r * 0.45} ${k * r * 0.5 - r * 0.05} `;
  bug += el("path", { d: legs, stroke: "#1a1414", "stroke-width": r * 0.08, "stroke-linecap": "round" });
  // Antennae and head.
  bug += el("path", {
    d: s`M ${bx - r * 0.15} ${by - r * 1.15} q ${-r * 0.1} ${-r * 0.3} ${-r * 0.3} ${-r * 0.35}
         M ${bx + r * 0.15} ${by - r * 1.15} q ${r * 0.1} ${-r * 0.3} ${r * 0.3} ${-r * 0.35}`,
    stroke: "#1a1414",
    "stroke-width": r * 0.06,
    "stroke-linecap": "round",
    fill: "none",
  });
  bug += el("ellipse", { cx: bx, cy: by - r * 0.92, rx: r * 0.48, ry: r * 0.36, fill: "#1a1414" });
  for (const sd of [-1, 1])
    bug += el("circle", { cx: bx + sd * r * 0.25, cy: by - r * 0.98, r: r * 0.1, fill: "#f4f1ea" });
  // Shell, split down the middle.
  bug += el("ellipse", { cx: bx, cy: by, rx: r * 0.9, ry: r, fill: colors.shell });
  // Spots, mirrored across the split.
  const pairs = g.i(1, 3);
  let spots = el("circle", { cx: bx, cy: by - r * 0.62, r: r * 0.17, fill: colors.spot });
  const used: Point[] = [];
  for (let k = 0; k < pairs * 4 && used.length < pairs; k++) {
    const sx = r * g.f(0.28, 0.58);
    const sy = r * g.f(-0.45, 0.7);
    if (Math.hypot(sx / 0.9, sy) > r * 0.7) continue;
    if (used.some(([ux, uy]) => Math.hypot(ux - sx, uy - sy) < r * 0.4)) continue;
    used.push([sx, sy]);
  }
  const spotR = r * g.f(0.14, 0.19);
  for (const [sx, sy] of used)
    for (const sd of [-1, 1]) spots += el("circle", { cx: bx + sd * sx, cy: by + sy, r: spotR, fill: colors.spot });
  bug += spots;
  bug += el("path", {
    d: s`M ${bx} ${by - r * 0.62} V ${by + r}`,
    stroke: "#1a1414",
    "stroke-width": r * 0.05,
  });
  bug += el("ellipse", {
    cx: bx - r * 0.4,
    cy: by - r * 0.35,
    rx: r * 0.18,
    ry: r * 0.28,
    fill: "#fff",
    opacity: "0.3",
    transform: s`rotate(20 ${bx - r * 0.4} ${by - r * 0.35})`,
  });
  out += el("g", { transform: s`rotate(${heading + 90} ${bx} ${by})` }, bug);
  const spotCount = 1 + used.length * 2;
  note.alt(
    `A ladybug with ${numberWord(spotCount)} spot${spotCount > 1 ? "s" : ""} crawling on a leaf${dew ? " beside a dewdrop" : ""}`,
  );
  note.focus(bx, by);
  return out;
});
