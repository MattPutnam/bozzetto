import { defineKind, el, fill, mix, type Point, pts, s } from "../../draw/core";
import { blob } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { forkOutline, spread } from "./shared";

const LEAVES = ["#6fae3f", "#8cc152", "#4f8f34", "#a5d36a", "#3f7a35"];

const TOPPINGS: Record<string, [number, number, string]> = {
  // How many pieces, at least and at most, and what the alt text calls them
  egg: [2, 2, "egg"],
  avocado: [2, 3, "avocado"],
  carrot: [3, 4, "carrot"],
  onion: [2, 3, "onion rings"],
  cucumber: [3, 5, "cucumber"],
  tomato: [3, 4, "tomatoes"],
  feta: [5, 7, "feta"],
  crouton: [4, 6, "croutons"],
  olive: [4, 6, "olives"],
};

/** A bowl of salad from above: leaves heaped inside with toppings over them, and sometimes servers. */
export const salad = /* @__PURE__ */ defineKind("salad", "Salad", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const wide = w >= h;
  const main = wide ? w : h;
  const cross = wide ? h : w;
  const backdrop = g.pick(["#c89a64", "#a87444", "#e9dccb", "#d9cbb5", "#dfe7e2", "#f1e6d2"]);
  let out = fill(w, h, backdrop);
  if (g.chance(0.5)) {
    // Boards of a wooden table
    let d = "";
    const gap = unit * g.f(0.22, 0.3);
    for (let y = gap * g.f(0.3, 1); y < h; y += gap) d += s`M0 ${y}H${w}`;
    out += el("path", { d, stroke: "#000", "stroke-width": unit * 0.006, opacity: "0.08" });
  }
  // What lies beside the bowl, in a row along the long side of the picture
  const extra = g.pick(["servers", "servers", "fork", "none"] as const);
  const jugWanted = g.chance(0.35);
  const items: ["servers" | "fork" | "jug", number][] = [];
  if (extra === "servers") items.push(["servers", unit * 0.2]);
  if (extra === "fork") items.push(["fork", unit * 0.11]);
  if (jugWanted && (items.length === 0 || main >= cross * 1.45)) items.push(["jug", unit * 0.26]);
  const gap = unit * 0.06;
  const beside = items.reduce((sum, [, size]) => sum + gap + size, 0);
  const R = Math.min(unit * (items.length ? 0.4 : 0.43), (main * 0.94 - beside) / 2);
  // The bowl and the row, centered together
  let along = main / 2 - beside / 2;
  const cx = wide ? along : w / 2;
  const cy = wide ? h / 2 : along;
  along += R;
  const place = (size: number): Point => {
    along += gap + size / 2;
    const at: Point = wide ? [along, h / 2] : [w / 2, along];
    along += size / 2;
    return at;
  };
  // The bowl: shadow, rim, the inside wall, and the leaves heaped inside it
  // A wooden or terracotta bowl only on a pale table, so it stands out
  const pale = backdrop !== "#c89a64" && backdrop !== "#a87444";
  const bowl = g.pick(["#fbfaf4", "#d8ebe4", "#2b5d8a", "#f3e6d0", ...(pale ? ["#b9824f", "#c96f4a"] : [])]);
  out += el("circle", { cx: cx + R * 0.04, cy: cy + R * 0.07, r: R, fill: "#000", opacity: "0.15" });
  out += el("circle", { cx, cy, r: R, fill: bowl });
  out += el("circle", { cx, cy, r: R * 0.93, fill: mix(bowl, "#000000", 0.12) });
  const r = R * 0.86;
  const clip = g.id("bowl");
  out += el("defs", {}, el("clipPath", { id: clip }, el("circle", { cx, cy, r })));
  const greens = [g.pick(LEAVES), g.pick(LEAVES), g.pick(LEAVES)];
  let leaves = el("circle", { cx, cy, r, fill: mix(greens[0], "#000000", 0.25) });
  let veins = "";
  const lg = g.fork("leaves");
  const byColor = new Map<string, string>();
  for (const [x, y] of spread(lg, cx, cy, r * 0.95, 12)) {
    const lr = r * lg.f(0.32, 0.42);
    const color = lg.chance(0.12) ? "#8e2f5c" : lg.pick(greens);
    const long = lg.chance(0.5);
    byColor.set(
      color,
      (byColor.get(color) ?? "") + blob(lg, x, y, long ? lr : lr * 0.72, long ? lr * 0.72 : lr, 2, 0.18, 0.12),
    );
    const a = lg.f(0, Math.PI);
    veins += s`M${x - Math.cos(a) * lr * 0.6} ${y - Math.sin(a) * lr * 0.6}l${Math.cos(a) * lr * 1.2} ${Math.sin(a) * lr * 1.2}`;
  }
  for (const [color, d] of byColor) leaves += el("path", { d, fill: color });
  leaves += el("path", {
    d: veins,
    stroke: "#fff",
    "stroke-width": r * 0.025,
    opacity: "0.3",
    "stroke-linecap": "round",
  });
  out += el("g", { "clip-path": `url(#${clip})` }, leaves);
  // Three to six toppings, their pieces spread evenly over the leaves, the big ones laid first
  const pool = Object.keys(TOPPINGS);
  for (let k = pool.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const chosen = pool.slice(0, g.i(3, 6));
  const counts = chosen.map(t => g.i(TOPPINGS[t][0], TOPPINGS[t][1]));
  const pieces: string[] = [];
  for (let k = 0; k < Math.max(...counts); k++) chosen.forEach((t, i) => k < counts[i] && pieces.push(t));
  const spots = spread(g, cx, cy, r * 0.74, pieces.length);
  const S = r * 0.21;
  const tg = g.fork("toppings");
  const order = Object.keys(TOPPINGS).filter(t => chosen.includes(t));
  // Round pieces are drawn as dots (a zero-length stroke with round caps), squares as short thick strokes
  const dots = (at: Point[], width: number, color: string, dx = 0, dy = 0, opacity?: string) =>
    el("path", {
      d: at.map(([x, y]) => s`M${x + dx} ${y + dy}h0.01`).join(""),
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      opacity,
    });
  const rings = (at: Point[], radius: number, width: number, color: string) =>
    el("path", {
      d: at
        .map(
          ([x, y]) =>
            s`M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
        )
        .join(""),
      stroke: color,
      "stroke-width": width,
      fill: "none",
    });
  const squares = (at: Point[], side: number, color: string) =>
    el("path", {
      d: at
        .map(([x, y]) => {
          const a = tg.f(0, Math.PI);
          return s`M${x - (Math.cos(a) * side) / 2} ${y - (Math.sin(a) * side) / 2}l${Math.cos(a) * side} ${Math.sin(a) * side}`;
        })
        .join(""),
      stroke: color,
      "stroke-width": side,
    });
  for (const name of order) {
    const at = spots.filter((_, k) => pieces[k] === name);
    if (name === "egg")
      for (const [x, y] of at) {
        // Half a boiled egg
        out += el("ellipse", {
          cx: x,
          cy: y,
          rx: S * 0.75,
          ry: S * 0.55,
          fill: "#fbfaf4",
          transform: s`rotate(${tg.f(0, 180)} ${x} ${y})`,
        });
        out += el("circle", { cx: x, cy: y, r: S * 0.32, fill: "#f6c13a" });
      }
    else if (name === "avocado")
      for (const [x, y] of at)
        out += el("ellipse", {
          cx: x,
          cy: y,
          rx: S * 0.8,
          ry: S * 0.32,
          fill: "#c6d97a",
          stroke: "#4f7a2a",
          "stroke-width": S * 0.08,
          transform: s`rotate(${tg.f(0, 180)} ${x} ${y})`,
        });
    else if (name === "carrot") {
      // Ribbons of carrot, curling
      let d = "";
      for (const [x, y] of at) {
        const a = tg.f(0, Math.PI);
        const [ux, uy] = [Math.cos(a) * S * 0.8, Math.sin(a) * S * 0.8];
        d += s`M${x - ux} ${y - uy}q${ux * 0.5 + uy * 0.5} ${uy * 0.5 - ux * 0.5} ${ux} ${uy}t${ux} ${uy}`;
      }
      out += el("path", { d, stroke: "#f08a2c", "stroke-width": S * 0.22, fill: "none", "stroke-linecap": "round" });
    } else if (name === "onion") {
      out += rings(at, S * 0.55, S * 0.1, "#9b4d8c");
      out += rings(at, S * 0.32, S * 0.08, "#c88ab8");
    } else if (name === "cucumber") {
      out += dots(at, S * 1.2, "#4f8a3a");
      out += dots(at, S * 1.0, "#dff0b8");
      out += dots(at, S * 0.4, "#c2dd8e");
    } else if (name === "tomato") {
      // Cherry tomatoes cut in half
      out += dots(at, S * 0.96, "#e0384f");
      out += dots(at, S * 0.6, "#f27b7b");
      out += dots(at, S * 0.16, "#fff", -S * 0.15, -S * 0.17, "0.5");
    } else if (name === "feta") out += squares(at, S * 0.5, "#f7f5ec");
    else if (name === "crouton") out += squares(at, S * 0.6, "#d9a35b");
    else out += rings(at, S * 0.24, S * 0.16, "#2b2b2b");
  }
  // What lies beside the bowl
  const wood = g.pick(["#c8955c", "#a8743f", "#d9b07a"]);
  const shadowed = (body: string, x: number, y: number, flat: string) =>
    el("g", { transform: s`translate(${x + unit * 0.01} ${y + unit * 0.018})`, fill: "#000", opacity: "0.15" }, flat) +
    el("g", { transform: s`translate(${x} ${y})` }, body);
  for (const [item, size] of items) {
    const [x, y] = place(size);
    // Each is drawn lengthwise across the row, around (0, 0)
    const len = Math.min(cross * 0.82, R * 2.1);
    const turn = wide ? "" : "rotate(90)";
    if (item === "servers") {
      let shape = "";
      for (const side of [-1, 1]) {
        const sx = side * size * 0.25;
        shape += el("rect", {
          x: sx - unit * 0.016,
          y: -len * 0.1,
          width: unit * 0.032,
          height: len * 0.6,
          rx: unit * 0.016,
        });
        shape +=
          side < 0
            ? el("ellipse", { cx: sx, cy: -len * 0.3, rx: size * 0.22, ry: len * 0.21 })
            : el("polygon", {
                points: pts(forkOutline(len * 0.5, size * 0.42, 3).map(([u, v]): Point => [sx + v, -len * 0.2 - u])),
              });
      }
      const body = `<g transform="${turn}" fill="${wood}">${shape}</g>`;
      out += shadowed(body, x, y, `<g transform="${turn}">${shape}</g>`);
      // The hollow of the spoon
      out += el("ellipse", {
        cx: 0,
        cy: 0,
        rx: size * 0.15,
        ry: len * 0.15,
        fill: "#000",
        opacity: "0.1",
        transform: s`translate(${x} ${y}) ${turn} translate(${-size * 0.25} ${-len * 0.3})`,
      });
    } else if (item === "fork") {
      const shape = el("polygon", {
        points: pts(forkOutline(len * 0.75, size * 0.7, 4).map(([u, v]): Point => [v, -u])),
        transform: turn || undefined,
      });
      out += shadowed(shape.replace("<polygon", '<polygon fill="#c9ccd1"'), x, y, shape);
    } else {
      // A little jug of dressing seen from above: handle, body, dressing and its spout
      const jr = size * 0.38;
      const dressing = g.pick(["#d9a83a", "#f3eedf", "#b5652e", "#e8d27a"]);
      const shape = el("circle", { cx: 0, cy: 0, r: jr });
      const body =
        el("path", {
          d: s`M${jr * 0.6} ${-jr * 0.55}C${jr * 1.7} ${-jr * 0.7} ${jr * 1.7} ${jr * 0.7} ${jr * 0.6} ${jr * 0.55}`,
          fill: "none",
          stroke: "#fbfaf4",
          "stroke-width": jr * 0.2,
        }) +
        el("path", { d: s`M${-jr * 0.7} ${-jr * 0.55}L${-jr * 1.35} 0L${-jr * 0.7} ${jr * 0.55}Z`, fill: "#fbfaf4" }) +
        el("circle", { cx: 0, cy: 0, r: jr, fill: "#fbfaf4" }) +
        el("circle", { cx: 0, cy: 0, r: jr * 0.78, fill: dressing }) +
        el("circle", { cx: -jr * 0.25, cy: -jr * 0.25, r: jr * 0.15, fill: "#fff", opacity: "0.4" });
      out += shadowed(body, x, y, shape);
    }
  }
  const names = order.map(t => TOPPINGS[t][2]);
  const side = items.map(([item]) => ({ servers: "salad servers", fork: "a fork", jug: "a jug of dressing" })[item]);
  note.alt(`A bowl of salad with ${andList(names)}${side.length ? `, ${andList(side)} beside it` : ""}`);
  note.focus(cx, cy);
  return out;
});
