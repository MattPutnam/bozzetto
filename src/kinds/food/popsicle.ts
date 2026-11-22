import { defineKind, el, fill, hsl, type Point, s } from "../../draw/core";
import { andList, capitalize, numberWord } from "../../draw/words";
import { SPRINKLES } from "./shared";

const POPS = ["#f25c78", "#f28b66", "#f6d365", "#7bd389", "#8fd3f4", "#c9a7eb", "#f49ac1"];

/**
 * One to three ice pops lying on a table, seen from above: plain, striped or dipped in chocolate.
 *
 * @category Food
 */
export const popsicle = /* @__PURE__ */ defineKind("popsicle", "Popsicle", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const bg = hsl(g.f(0, 360), g.f(35, 55), g.f(82, 90));
  let out = fill(w, h, bg);
  const bodyW = unit * 0.19;
  const bodyL = unit * 0.46;
  const stickW = bodyW * 0.3;
  const stickL = unit * 0.22;
  const hw = bodyW / 2;
  const top = -(bodyL + stickL) / 2;
  const bottom = top + bodyL;
  const tilt = g.f(-18, 18);
  const gap = bodyW * 1.75;
  const extent = (c: number) => (c - 1) * gap + bodyW + (bodyL + stickL) * Math.sin((Math.abs(tilt) * Math.PI) / 180);
  let count = g.i(1, 3);
  while (count > 1 && extent(count) > w * 0.9) count--;
  const body = s`M ${-hw} ${bottom - hw * 0.3} L ${-hw} ${top + hw} A ${hw} ${hw} 0 0 1 ${hw} ${top + hw}
                 L ${hw} ${bottom - hw * 0.3} Q ${hw} ${bottom} ${hw * 0.7} ${bottom} L ${-hw * 0.7} ${bottom}
                 Q ${-hw} ${bottom} ${-hw} ${bottom - hw * 0.3} Z`;
  const stick = el("rect", {
    x: -stickW / 2,
    y: bottom - stickW,
    width: stickW,
    height: stickL + stickW,
    rx: stickW / 2,
  });
  const styles = new Set<string>();
  let bitten = false;
  for (let k = 0; k < count; k++) {
    const px = w / 2 + (k - (count - 1) / 2) * gap;
    const py = h / 2 + unit * g.f(-0.03, 0.03);
    const angle = tilt + g.f(-5, 5);
    const style = g.pick(["plain", "stripes", "dipped"]);
    styles.add(style);
    const color = g.pick(POPS);
    const shape = g.id(`pop${k}`);
    let defs = el("clipPath", { id: shape }, el("path", { d: body }));
    const bite = g.chance(0.3);
    const cut = bite ? g.id(`bite${k}`) : "";
    if (bite) {
      // The bite: three overlapping scallops taken out of the top corner
      bitten = true;
      const r = hw * 0.4;
      const corner: Point = [hw * 0.8, top + hw * 0.5];
      let d = s`M ${-hw * 3} ${top - hw * 3} h ${hw * 6} v ${bodyL + stickL + hw * 6} h ${-hw * 6} Z`;
      for (const [ox, oy] of [
        [-0.55, -0.55],
        [0.1, 0],
        [0.4, 0.75],
      ])
        d += s` M ${corner[0] + ox * hw - r} ${corner[1] + oy * hw} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
      defs += el("clipPath", { id: cut }, el("path", { d, "clip-rule": "evenodd" }));
    }
    out += el("defs", {}, defs);
    const place = (dx: number, dy: number) => s`translate(${px + dx} ${py + dy}) rotate(${angle})`;
    const clip = bite ? `url(#${cut})` : undefined;
    // Shadow
    out += el(
      "g",
      { transform: place(unit * 0.015, unit * 0.025) },
      el("g", { "clip-path": clip, fill: "#000", opacity: "0.12" }, stick, el("path", { d: body })),
    );
    // Stick, then the ice and its decoration
    let inner = "";
    if (style === "stripes") {
      const colors = [color, g.pick(POPS.filter(c => c !== color)), "#fbf4e8"];
      for (let b = 1; b < 3; b++) {
        const y0 = top + (bodyL * b) / 3;
        inner += el("rect", { x: -hw, y: y0, width: bodyW, height: bodyL, fill: colors[b] });
      }
    } else if (style === "dipped") {
      // Chocolate over the top, with a wavy edge, and sometimes sprinkles
      const dip = top + bodyL * g.f(0.38, 0.5);
      let d = s`M ${-hw} ${top - hw} L ${-hw} ${dip}`;
      for (let b = 0; b < 4; b++)
        d += s` Q ${-hw + (bodyW * (b + 0.5)) / 4} ${dip + hw * g.f(0.15, 0.45)} ${-hw + (bodyW * (b + 1)) / 4} ${dip}`;
      inner += el("path", { d: d + s` L ${hw} ${top - hw} Z`, fill: g.pick(["#5a3522", "#6b3e2e", "#fbf4e8"]) });
      if (g.fork(`sprinkle${k}`).chance(0.6)) {
        styles.add("sprinkles");
        const dots: Point[] = [];
        const rows = 3;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < 3; c++)
            dots.push([
              hw * (-0.55 + c * 0.55 + g.f(-0.12, 0.12)),
              top + hw * 0.55 + ((dip - top - hw * 0.9) * (r + g.f(0.2, 0.8))) / rows,
            ]);
        const byColor = new Map<string, string>();
        for (const [x, y] of dots) {
          const a = g.f(0, Math.PI);
          const dx = Math.cos(a) * hw * 0.12;
          const dy = Math.sin(a) * hw * 0.12;
          const c = g.pick(SPRINKLES);
          byColor.set(c, (byColor.get(c) ?? "") + s`M${x - dx} ${y - dy}L${x + dx} ${y + dy}`);
        }
        for (const [c, path] of byColor)
          inner += el("path", { d: path, stroke: c, "stroke-width": hw * 0.1, "stroke-linecap": "round" });
      }
    }
    // Frosty highlight
    inner += el("path", {
      d: s`M ${-hw * 0.5} ${top + hw * 0.9} L ${-hw * 0.5} ${bottom - hw * 0.6}`,
      stroke: "#fff",
      "stroke-width": hw * 0.18,
      "stroke-linecap": "round",
      opacity: "0.35",
    });
    out += el(
      "g",
      { transform: place(0, 0) },
      el(
        "g",
        { "clip-path": clip },
        el("g", { fill: "#e8c48a" }, stick),
        el("path", { d: body, fill: color }),
        el("g", { "clip-path": `url(#${shape})` }, inner),
      ),
    );
  }
  const kinds = andList([
    styles.has("plain") && "plain",
    styles.has("stripes") && "striped",
    styles.has("dipped") && "dipped",
  ]);
  const sprinkled = styles.has("dipped") && styles.has("sprinkles") ? " with sprinkles" : "";
  const what =
    count === 1 ? `A ${kinds} ice pop${sprinkled}` : `${capitalize(numberWord(count))} ice pops, ${kinds}${sprinkled},`;
  note.alt(`${what} on a table${bitten ? ", with a bite taken" : ""}`);
  note.focus(w / 2, h / 2 + top * 0.4);
  return out;
});
