import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { blob, table } from "../../draw/shapes";
import { numberWord } from "../../draw/words";

/**
 * A vase of round flowers on a table.
 *
 * @category Objects
 */
export const flowers = /* @__PURE__ */ defineKind("flowers", "Vase of flowers", (g, w, h, note) => {
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
