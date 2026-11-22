import { defineKind, el, fill, mix, type Point, s } from "../../draw/core";
import { tile } from "./shared";

/**
 * Chips of stone in a few colors scattered thickly over a pale ground.
 *
 * @category Patterns
 */
export const terrazzo = /* @__PURE__ */ defineKind("terrazzo", "Terrazzo", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const scheme = g.pick([
    { ground: "#efebe4", chips: ["#c9b8a6", "#9aa5a0", "#d98b6a", "#5f6b6d"] },
    { ground: "#f3ede6", chips: ["#e3a48d", "#f1c9a8", "#8fb3a8", "#c95f4c"] },
    { ground: "#e9ece8", chips: ["#7f9c96", "#c7d3cc", "#d8b46a", "#4a5a5f"] },
    { ground: "#f2efe9", chips: ["#b7c4d6", "#e8b7a5", "#6c7f99", "#d6cfc2"] },
    { ground: "#ece4da", chips: ["#a3745a", "#d9b99b", "#6e7b72", "#efd6c0"] },
    { ground: "#f1eee8", chips: ["#2f3437", "#9c958a", "#c9c2b6", "#b85c38"] },
  ]);
  const colors = scheme.chips.slice(0, g.i(3, 4));
  const big = g.f(0.035, 0.06);
  // A square tile of chips, repeated. Chips near an edge are drawn again on the far side so the
  // tile wraps without seams.
  const layer = (name: string, size: number, count: number, low: number, high: number, extra = ""): string => {
    const paths = colors.map(() => "");
    const placed: Point[] = [];
    for (let tries = 0; tries < 300 && placed.length < count; tries++) {
      const x = g.f(0, size);
      const y = g.f(0, size);
      // Keep chips from piling up, wrapping distances around the tile.
      const near = placed.some(([px, py]) => {
        const dx = Math.min(Math.abs(px - x), size - Math.abs(px - x));
        const dy = Math.min(Math.abs(py - y), size - Math.abs(py - y));
        return Math.hypot(dx, dy) < unit * big * high * 2.2;
      });
      if (near) continue;
      placed.push([x, y]);
      // An angular chip: a few corners at uneven distances around its center.
      const r = unit * big * g.f(low, high);
      const corners = g.i(4, 6);
      const turn = g.f(0, Math.PI * 2);
      const ring: Point[] = [];
      for (let k = 0; k < corners; k++) {
        const a = turn + ((k + g.f(-0.3, 0.3)) / corners) * Math.PI * 2;
        const reach = r * g.f(0.6, 1.1);
        ring.push([Math.cos(a) * reach, Math.sin(a) * reach * g.f(0.6, 1)]);
      }
      const shape = (ox: number, oy: number) =>
        s`M${ox + ring[0][0]} ${oy + ring[0][1]}` +
        ring
          .slice(1)
          .map(([px, py], k) => s`l${px - ring[k][0]} ${py - ring[k][1]}`)
          .join("") +
        "z";
      const color = g.i(0, colors.length - 1);
      for (const ox of [x, x - size, x + size]) {
        if (ox !== x && Math.abs(ox - size / 2) > size / 2 + r) continue;
        for (const oy of [y, y - size, y + size]) {
          if (oy !== y && Math.abs(oy - size / 2) > size / 2 + r) continue;
          paths[color] += shape(ox, oy);
        }
      }
    }
    const id = g.id(name);
    defs += tile(g, id, size, ...paths.map((d, k) => (d ? el("path", { d, fill: colors[k] }) : "")), extra);
    return el("rect", { width: w, height: h, fill: `url(#${id})` });
  };
  // Fine specks between the chips.
  const small = unit * g.f(0.5, 0.65);
  const specks: string[] = [];
  for (let k = g.i(25, 35); k > 0; k--) specks.push(s`M${g.f(0, small)} ${g.f(0, small)}h0`);
  const specked = el("path", {
    d: specks.join(""),
    stroke: mix(scheme.ground, colors[colors.length - 1], 0.5),
    "stroke-width": unit * 0.008,
    "stroke-linecap": "round",
  });
  // Two tiles of different sizes laid over each other, so the repeat is hard to spot: large chips
  // on one, small chips and specks on the other.
  let defs = "";
  const large = layer("large", small * g.f(1.3, 1.45), g.i(10, 14), 0.8, 1.3);
  const fine = layer("fine", small, g.i(18, 24), 0.3, 0.6, specked);
  let out = el("defs", {}, defs);
  out += fill(w, h, scheme.ground);
  out += large + fine;
  note.focus(w / 2, h / 2);
  note.alt(
    g.chance(0.5)
      ? "Terrazzo stone with angular chips scattered over a pale ground"
      : "A speckled terrazzo surface of small stone chips set in pale cement",
  );
  return out;
});
