import { defineKind, el, hsl, mix, type Point, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList, capitalize, numberWord } from "../../draw/words";
import { sidePlate, spread } from "./shared";

const SHELLS = ["#f2c14e", "#e9a93f", "#f3e1b6"];

const MEATS = ["#7a4a2e", "#a0643c", "#c98b4d", "#5b3a2a"];

/**
 * A plate of tacos, seen from the side, each filled with meat, lettuce and toppings.
 *
 * @category Food
 */
export const taco = /* @__PURE__ */ defineKind("taco", "Tacos", (g, w, h, note) => {
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
