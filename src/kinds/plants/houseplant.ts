import { defineKind, el, hsl, mix, type Point, pts, qpt, type Rand, s } from "../../draw/core";
import { table } from "../../draw/shapes";

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
export const houseplant = /* @__PURE__ */ defineKind("houseplant", "Houseplant", (g, w, h, note) => {
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
