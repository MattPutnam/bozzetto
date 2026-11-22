import { defineKind, el, fill, hex, lin, type Point, type Rand, s } from "../../draw/core";
import { compact, penDots, spread } from "./shared";

/**
 * One arm of a snowflake, pointing up from the center to (0, -10): its stroked lines and any filled
 * plates. Six turned copies make the flake.
 */
function arm(g: Rand, style: "dendrite" | "fern" | "plate" | "stellar" | "simple"): [string, string] {
  let lines = "M0 0V-10";
  let plates = "";
  const sin = Math.sin(Math.PI / 3);
  const cos = Math.cos(Math.PI / 3);
  // A pair of branches leaving the spine at y = -t, `len` long, angled out toward the tip.
  const pair = (t: number, len: number) => {
    lines += s`M${-len * sin} ${-t - len * cos}L0 ${-t}L${len * sin} ${-t - len * cos}`;
  };
  // A hexagon ring at radius r: one side per arm.
  const ring = (r: number) => {
    lines += s`M0 ${-r}L${r * sin} ${-r * cos}`;
  };
  if (style === "dendrite") {
    const count = g.i(2, 3);
    for (let k = 0; k < count; k++) {
      const t = 3 + k * (5 / count) + g.f(-0.4, 0.4);
      const len = (10 - t) * g.f(0.45, 0.6);
      pair(t, len);
      // Twigs on the bigger branches.
      if (len > 2.6 && g.chance(0.7)) {
        const m = len * 0.55;
        for (const side of [-1, 1]) {
          const bx = side * m * sin;
          const by = -t - m * cos;
          lines += s`M${bx + side * 0.9} ${by + 0.3}L${bx} ${by}l0 ${-1.1}`;
        }
      }
    }
    if (g.chance(0.5)) ring(g.f(1.8, 2.6));
  } else if (style === "fern") {
    for (let t = 2.2; t < 9.2; t += g.f(1, 1.4)) pair(t, (10 - t) * 0.35 + 0.4);
  } else if (style === "plate") {
    // A hexagonal plate, with the arm reaching on past it.
    const p = g.f(3.5, 5);
    plates += s`M0 0L0 ${-p}L${p * sin} ${-p * cos}Z`;
    ring(p);
    if (g.chance(0.6)) ring(p * 0.55);
    pair(p + (10 - p) * 0.45, (10 - p) * 0.4);
  } else if (style === "stellar") {
    // A broad pointed arm, like a star's point, with notches near its end.
    const wd = g.f(1, 1.6);
    plates += s`M0 0L${wd} ${-3}L0 ${-9.6}L${-wd} ${-3}Z`;
    pair(g.f(5.5, 7), g.f(1.4, 2.2));
    if (g.chance(0.5)) ring(g.f(1.5, 2.2));
  } else {
    pair(g.f(5, 6.5), g.f(2, 3));
    if (g.chance(0.6)) pair(8.2, 1.2);
  }
  // Now and then a little diamond at the tip.
  if (style !== "stellar" && g.chance(0.35)) plates += "M0 -9L0.8 -10.2L0 -11.4L-0.8 -10.2Z";
  return [lines, plates];
}

/**
 * A scattering of six-fold snowflakes of different sizes and designs on a wintry sky.
 *
 * @category Holidays
 */
export const snowflakes = /* @__PURE__ */ defineKind("snowflakes", "Snowflakes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const mood = g.pick(["icy", "twilight", "pale"] as const);
  const hue = g.f(198, 228);
  const skyId = g.id("sky");
  const stops =
    mood === "icy"
      ? [hex(hue, 50, g.f(62, 70)), hex(hue - 8, 45, 86)]
      : mood === "twilight"
        ? [hex(hue + g.f(15, 35), 40, 18), hex(hue, 40, 38)]
        : [hex(hue, 35, 95), hex(hue, 40, 84)];
  const ink = mood === "pale" ? hex(hue, 55, 58) : hex(hue, 70, 98);
  let defs = lin(skyId, stops);
  let out = fill(w, h, `url(#${skyId})`);

  // A few designs, each one arm turned six times.
  const styles = ["dendrite", "dendrite", "fern", "plate", "stellar", "simple"] as const;
  const design = (name: string, thick: number) => {
    const style = g.pick(styles);
    const [lines, plates] = arm(g, style);
    const armId = g.id(`${name}a`);
    const trioId = g.id(`${name}t`);
    // Three arms make a trio, and the trio turned a sixth of the way round makes the six.
    const trio = el(
      "g",
      { id: trioId },
      el(
        "g",
        { id: armId },
        el("path", { d: lines, fill: "none" }),
        plates ? el("path", { d: plates, "fill-opacity": style === "plate" ? "0.45" : false }) : "",
      ),
      el("use", { href: `#${armId}`, transform: "rotate(120)" }),
      el("use", { href: `#${armId}`, transform: "rotate(240)" }),
    );
    defs += el(
      "g",
      { id: g.id(name), "stroke-width": thick },
      trio,
      el("use", { href: `#${trioId}`, transform: "rotate(60)" }),
    );
    return g.id(name);
  };
  const area = (w * h) / (unit * unit);
  const front = Math.min(5, Math.round(1.5 + area * 0.7));
  const mid = Math.round(3 * area ** 0.7 + 2);
  const back = Math.round(5 * area ** 0.7 + 3);
  const frontIds = Array.from({ length: front }, (_, k) => design(`f${k}`, g.f(0.6, 0.8)));
  const midIds = [0, 1, 2].map(k => design(`m${k}`, g.f(0.8, 1)));
  const backIds = [0, 1].map(k => design(`b${k}`, 1.3));

  // Places the flakes, biggest first, each clear of the others and `edge` radii in from the sides.
  const placed: [number, number, number][] = [];
  const layer = (n: number, ids: string[], lo: number, hi: number, edge: number) => {
    let uses = "";
    const spots: Point[] = [];
    for (let k = 0; k < n; k++) {
      const r = unit * g.f(lo, hi);
      const [x, y] = spread(g, placed, r * 1.08, r * edge, w - r * edge, r * edge, h - r * edge, 24);
      spots.push([x, y]);
      uses += el("use", {
        href: `#${ids[k % ids.length]}`,
        transform: `translate(${Math.round(x)} ${Math.round(y)})rotate(${g.i(0, 59)})` + s`scale(${r / 10.5})`,
      });
    }
    return [uses, spots] as const;
  };
  const [frontUses, frontSpots] = layer(front, frontIds, 0.13, 0.2, 1.05);
  const [midUses] = layer(mid, midIds, 0.06, 0.1, 0.8);
  const [backUses] = layer(back, backIds, 0.025, 0.045, 0.5);
  const paint = { fill: ink, stroke: ink, "stroke-linecap": "round", "stroke-linejoin": "round" };
  out += el("g", { ...paint, opacity: mood === "pale" ? "0.4" : "0.5" }, backUses);
  // Tiny falling snow between them.
  const snow: Point[] = [];
  for (let k = Math.round(area ** 0.5 * g.f(14, 20)); k > 0; k--) snow.push([g.f(0, w), g.f(0, h)]);
  out += penDots(snow, unit * 0.005, ink, "0.55");
  out += el("g", { ...paint, opacity: "0.8" }, midUses);
  out += el("g", paint, frontUses);

  note.alt(
    mood === "twilight"
      ? "Snowflakes of many shapes falling through a twilight sky"
      : mood === "icy"
        ? "Snowflakes of many shapes drifting on a wintry sky"
        : "Delicate snowflake crystals scattered over a frosty background",
  );
  note.focus(frontSpots[0][0], frontSpots[0][1]);
  return compact(el("defs", {}, defs) + out);
});
