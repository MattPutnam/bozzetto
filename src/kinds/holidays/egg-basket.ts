import { defineKind, el, fill, hsl, lin, type Point, type Rand, s } from "../../draw/core";
import { numberWord } from "../../draw/words";
import { compact, curve, dots } from "./shared";

/** An egg drawn around (0, 0), `ry` tall each way: rounder at the bottom. */
const eggPath = (rx: number, ry: number): string =>
  s`M0 ${-ry}C${rx * 0.62} ${-ry} ${rx} ${-ry * 0.3} ${rx} ${ry * 0.2}C${rx} ${ry * 0.72} ${rx * 0.55} ${ry} 0 ${ry}
    C${-rx * 0.55} ${ry} ${-rx} ${ry * 0.72} ${-rx} ${ry * 0.2}C${-rx} ${-ry * 0.3} ${-rx * 0.62} ${-ry} 0 ${-ry}Z`;

/** The painted decoration for one egg, in the egg's own coordinates. */
function eggDecor(g: Rand, rx: number, ry: number, accent: string, second: string): string {
  const style = g.pick(["stripes", "zigzag", "dots", "halves", "plain"] as const);
  if (style === "plain") return "";
  if (style === "stripes") {
    let d = "";
    const count = g.i(2, 3);
    for (let k = 0; k < count; k++) {
      const y = -ry * 0.55 + (ry * 1.15 * (k + 0.5)) / count;
      d += s`M${-rx} ${y}h${rx * 2}`;
    }
    return el("path", { d, stroke: accent, "stroke-width": ry * g.f(0.1, 0.16) });
  }
  if (style === "zigzag") {
    let out = "";
    const rows = g.i(1, 2);
    for (let r = 0; r < rows; r++) {
      const y = rows === 1 ? ry * 0.05 : -ry * 0.3 + r * ry * 0.6;
      const teeth = 6;
      let d = s`M${-rx} ${y}`;
      for (let k = 1; k <= teeth; k++) d += s`L${-rx + (2 * rx * k) / teeth} ${y + (k % 2 ? -ry * 0.12 : ry * 0.12)}`;
      out += el("path", {
        d,
        stroke: r ? second : accent,
        "stroke-width": ry * 0.09,
        fill: "none",
        "stroke-linejoin": "round",
      });
    }
    return out;
  }
  if (style === "dots") {
    const spots: Point[] = [];
    for (let k = 0; k < 14 && spots.length < 7; k++) {
      const p: Point = [rx * g.f(-0.75, 0.75), ry * g.f(-0.7, 0.75)];
      if (spots.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > ry * 0.35)) spots.push(p);
    }
    return dots(spots, ry * 0.1, accent);
  }
  // Two tones meeting at a zigzag, and a thin band above.
  let d = s`M${-rx} ${ry * 0.1}`;
  for (let k = 1; k <= 6; k++) d += s`L${-rx + (rx * k) / 3} ${ry * (k % 2 ? -0.05 : 0.1)}`;
  return (
    el("path", { d: d + s`V${ry}H${-rx}Z`, fill: accent }) +
    el("path", { d: s`M${-rx} ${-ry * 0.35}h${rx * 2}`, stroke: second, "stroke-width": ry * 0.08 })
  );
}

/** A woven basket of painted eggs on the grass. */
export const eggBasket = /* @__PURE__ */ defineKind("egg-basket", "Basket of eggs", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const skyId = g.id("sky");
  const clip = g.id("egg");
  const shape = g.id("shape");
  const weave = g.id("weave");
  const gloss = g.id("gloss");
  const hue = g.f(190, 215);
  const groundY = h * g.f(0.46, 0.56);
  const bw = Math.min(unit * g.f(0.52, 0.6), w * 0.62);
  const bh = bw * g.f(0.38, 0.44);
  const cx = w / 2 + w * g.f(-0.06, 0.06);
  const bottom = h * g.f(0.85, 0.89);
  const rimY = bottom - bh;
  const rimRy = bw * 0.12;
  const er = bw * g.f(0.125, 0.14);
  const erx = er * 0.76;
  // The body: the rim's front arc on top, tapering to a rounded base.
  const body = s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${rimY}
                 L${cx + bw * 0.36} ${bottom - bh * 0.15}Q${cx + bw * 0.33} ${bottom} ${cx + bw * 0.25} ${bottom}
                 H${cx - bw * 0.25}Q${cx - bw * 0.33} ${bottom} ${cx - bw * 0.36} ${bottom - bh * 0.15}Z`;
  let out = el(
    "defs",
    {},
    lin(skyId, [hsl(hue, 55, 72), hsl(hue - 10, 45, 92)]),
    el("path", { id: shape, d: eggPath(erx, er) }),
    el("clipPath", { id: clip }, el("path", { d: eggPath(erx, er) })),
    el("clipPath", { id: weave }, el("path", { d: body })),
    // Shade on the egg's lower right and a glint on its upper left, shared by every egg.
    el(
      "g",
      { id: gloss },
      el(
        "g",
        { "clip-path": `url(#${clip})` },
        el("ellipse", { cx: erx * 0.5, cy: er * 0.35, rx: erx * 0.8, ry: er, fill: "#000", opacity: "0.08" }),
      ),
      el("ellipse", { cx: -erx * 0.4, cy: -er * 0.45, rx: erx * 0.16, ry: er * 0.22, fill: "#fff", opacity: "0.5" }),
    ),
  );
  out += fill(w, h, `url(#${skyId})`);
  // Soft clouds of hedges on the horizon, then the meadow with a few flowers.
  const hill = curve(w, groundY - h * g.f(0, 0.05), groundY - h * g.f(0, 0.05), -h * g.f(0.02, 0.06));
  const grassHue = g.f(85, 120);
  out += el("path", { d: hill.d() + s`V${h}H0Z`, fill: hsl(grassHue + 10, 30, 64) });
  out += el("rect", { y: groundY, width: w, height: h - groundY, fill: hsl(grassHue, 42, 58) });
  const flowerHue = g.f(0, 360);
  const blossoms: Point[] = [];
  for (let k = 0; k < 20; k++) {
    const x = w * g.f(0, 1);
    const y = groundY + (h - groundY) * g.f(0.08, 0.98);
    if (Math.abs(x - cx) < bw * 0.6 && y > rimY - bh) continue;
    blossoms.push([x, y]);
  }
  out += dots(blossoms.slice(0, 10), unit * 0.008, "#fff", "0.9");
  out += dots(blossoms.slice(10), unit * 0.008, hsl(flowerHue, 70, 75));
  // The basket's shadow, inside and back rim, and handle.
  const wicker = hsl(g.f(28, 40), g.f(40, 55), g.f(52, 62));
  const darker = hsl(g.f(25, 35), 40, 32);
  const rim = hsl(g.f(30, 40), 45, 66);
  out += el("ellipse", { cx, cy: bottom, rx: bw * 0.5, ry: bw * 0.06, fill: "#000", opacity: "0.15" });
  const hh = bw * g.f(0.45, 0.58);
  out += el("path", {
    d: s`M${cx - bw * 0.45} ${rimY}C${cx - bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY}`,
    stroke: wicker,
    "stroke-width": bw * 0.045,
    fill: "none",
  });
  out += el("path", {
    d: s`M${cx - bw * 0.45} ${rimY}C${cx - bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY - hh * 1.3} ${cx + bw * 0.45} ${rimY}`,
    stroke: "#000",
    opacity: "0.15",
    "stroke-width": bw * 0.045,
    "stroke-dasharray": `${Math.round(bw * 0.03)} ${Math.round(bw * 0.03)}`,
    fill: "none",
  });
  out += el("ellipse", { cx, cy: rimY, rx: bw / 2, ry: rimRy, fill: darker });
  out += el("path", {
    d: s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 1 ${cx + bw / 2} ${rimY}`,
    stroke: rim,
    "stroke-width": bw * 0.035,
    fill: "none",
  });
  // Eggs heaped in the basket: a back row higher up, a front row tucked behind the rim.
  const eggHue = g.f(0, 360);
  const egg = (x: number, y: number, tilt: number, scale: number) => {
    const k = g.i(0, 5);
    const base = hsl(eggHue + k * 60 + g.f(-10, 10), g.f(55, 75), g.f(72, 82));
    const accent = g.chance(0.3) ? "#fff" : hsl(eggHue + k * 60 + g.pick([120, 180, 240]), 60, 58);
    const second = hsl(eggHue + k * 60 + g.pick([60, 200]), 55, 62);
    const decor = eggDecor(g, erx, er, accent, second);
    return el(
      "g",
      { transform: s`translate(${x} ${y}) rotate(${tilt}) scale(${scale})` },
      el("use", { href: `#${shape}`, fill: base }),
      decor && el("g", { "clip-path": `url(#${clip})` }, decor),
      el("use", { href: `#${gloss}` }),
    );
  };
  const inner = bw * 0.82;
  const backs = Math.min(4, Math.max(2, Math.floor(inner / (erx * 1.9))));
  let eggs = 0;
  for (let k = 0; k < backs; k++) {
    const x = cx - inner / 2 + (inner * (k + 0.5)) / backs;
    const lift = Math.cos(((k + 0.5) / backs - 0.5) * Math.PI) * er * 0.35;
    out += egg(x + g.f(-0.1, 0.1) * erx, rimY - er * 0.4 - lift, g.f(-18, 18), g.f(0.92, 1.05));
    eggs++;
  }
  const fronts = backs - 1;
  for (let k = 0; k < fronts; k++) {
    const x = cx - inner / 2 + (inner * (k + 1)) / backs;
    out += egg(x, rimY + rimRy * 0.25, g.f(-22, 22), g.f(0.95, 1.05));
    eggs++;
  }
  // The basket's front, woven, with a thick rim.
  out += el("path", { d: body, fill: wicker });
  let d = "";
  for (let k = 1; k <= 4; k++) {
    const y = rimY + (bh * k) / 5;
    d += s`M${cx - bw / 2} ${y}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${y}`;
  }
  const ribs = 8;
  for (let k = 1; k < ribs; k++) {
    const t = k / ribs - 0.5;
    d += s`M${cx + t * bw} ${rimY}L${cx + t * bw * 0.66} ${bottom}`;
  }
  out += el(
    "g",
    { "clip-path": `url(#${weave})` },
    el("path", { d, stroke: "#000", opacity: "0.16", "stroke-width": bw * 0.012, fill: "none" }),
  );
  out += el("path", {
    d: s`M${cx - bw / 2} ${rimY}A${bw / 2} ${rimRy} 0 0 0 ${cx + bw / 2} ${rimY}`,
    stroke: rim,
    "stroke-width": bw * 0.05,
    "stroke-linecap": "round",
    fill: "none",
  });
  // An egg or two resting on the grass beside the basket.
  const loose = g.i(0, 2);
  const used: number[] = [];
  for (let k = 0; k < loose; k++) {
    const sd = used.includes(-1) ? 1 : used.includes(1) ? -1 : g.pick([-1, 1]);
    used.push(sd);
    const x = cx + sd * (bw / 2 + er * g.f(1.2, 2));
    if (x < er * 1.2 || x > w - er * 1.2) continue;
    const y = Math.min(bottom + unit * g.f(0, 0.04), h - erx - unit * 0.02);
    out += el("ellipse", { cx: x, cy: y, rx: er * 1.05, ry: er * 0.18, fill: "#000", opacity: "0.15" });
    out += egg(x, y - erx * 0.95, sd * g.f(70, 100), 1);
    eggs++;
  }
  // Tufts of grass at the foot of the basket.
  let tufts = "";
  for (let k = 0; k < 5; k++) {
    const x = cx + bw * g.f(-0.45, 0.45);
    const y = bottom + unit * g.f(0, 0.02);
    const t = unit * g.f(0.025, 0.045);
    tufts += s`M${x - t * 0.4} ${y - t}L${x} ${y}L${x + t * 0.3} ${y - t * 1.1}M${x} ${y}V${y - t * 1.2}`;
  }
  out += el("path", {
    d: tufts,
    stroke: hsl(grassHue, 45, 40),
    "stroke-width": unit * 0.006,
    "stroke-linecap": "round",
    fill: "none",
  });
  note.alt(`A woven basket of ${numberWord(eggs)} painted eggs on the grass`);
  note.focus(cx, rimY);
  return compact(out);
});
