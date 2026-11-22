import { defineKind, el, fill, hsl, lin, type Point, s } from "../../draw/core";
import { clipCircle, craters, earth, shadeDef, starCount, starDots } from "./shared";

/**
 * An astronaut floating in space, sometimes tethered to a station, with Earth or a moon behind.
 *
 * @category Space
 */
export const astronaut = /* @__PURE__ */ defineKind(
  "astronaut",
  "Astronaut",
  { tether: [true, false] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const skyHue = g.f(220, 270);
    const lx = g.pick([-1, 1]);
    const tethered = g.option("tether", g.chance(0.6));
    const side = g.pick([-1, 1]);
    const sky = g.id("sky");
    const shade = g.id("shade");
    const globeClip = g.id("globe");
    const visorPaint = g.id("visor");
    const gold = g.chance(0.4);
    // The globe in a lower corner, opposite the station.
    const isEarth = g.chance(0.7);
    const gr = unit * g.f(0.45, 0.6);
    const gx = side > 0 ? gr * g.f(0.1, 0.5) : w - gr * g.f(0.1, 0.5);
    const gy = h + gr * g.f(0.15, 0.35);
    let out = el(
      "defs",
      {},
      lin(sky, [hsl(skyHue, 45, 5), hsl(skyHue + 15, 40, 13)]),
      shadeDef(shade, lx, 0.6),
      clipCircle(globeClip, gx, gy, gr),
      lin(visorPaint, gold ? [hsl(42, 75, 58), hsl(30, 65, 28)] : [hsl(215, 45, 18), hsl(200, 55, 42)]),
    );
    out += fill(w, h, `url(#${sky})`);
    out += starDots(g, w, h, starCount(g, w, h), unit);
    out += isEarth
      ? earth(g, gx, gy, gr, globeClip, shade, unit)
      : craters(g, gx, gy, gr, hsl(g.f(30, 220), 8, 66), lx, globeClip, 10) +
        el("circle", { cx: gx, cy: gy, r: gr, fill: `url(#${shade})` });

    // The astronaut, drawn in a local frame 100 units tall, centered on the torso.
    const size = unit * g.f(0.5, 0.58);
    const k = size / 100;
    const cx = Math.max(64 * k, Math.min(w - 64 * k, w / 2 - side * w * g.f(0, 0.12)));
    const cy = Math.max(64 * k, Math.min(h - 62 * k, h * g.f(0.46, 0.54)));
    const angle = g.f(-28, 28);
    const toWorld = (x: number, y: number): Point => {
      const a = (angle * Math.PI) / 180;
      return [cx + k * (x * Math.cos(a) - y * Math.sin(a)), cy + k * (x * Math.sin(a) + y * Math.cos(a))];
    };
    const suit = g.pick(["#f2f2ee", "#eef1f5", "#f4efe4"]);
    const trim = g.pick(["#c7ccd4", "#cfcac0", "#c2c8cf"]);
    const pack = g.pick(["#a9b0ba", "#b5ada0", "#9fa8b3"]);
    const accent = g.pick(["#e0693e", "#3f7fc4", "#e3b23c", "#5aa36b", "#c4544f"]);
    // A limb as a thick round-capped stroke through a joint: angles in degrees, lengths in local units.
    const limb = (x: number, y: number, a1: number, a2: number, len: number) => {
      const r1 = (a1 * Math.PI) / 180;
      const r2 = (a2 * Math.PI) / 180;
      const jx = x + Math.cos(r1) * len;
      const jy = y + Math.sin(r1) * len;
      return [jx, jy, jx + Math.cos(r2) * len, jy + Math.sin(r2) * len];
    };
    let body = "";
    body += el("rect", { x: -29, y: -33, width: 58, height: 54, rx: 8, fill: pack });
    body += el("rect", { x: -29, y: -33, width: 9, height: 54, rx: 4, fill: "#000", opacity: 0.12 });
    // Legs, then arms, both tucked under the torso where they join.
    let limbs = "";
    let boots = "";
    let hands = "";
    for (const dir of [-1, 1]) {
      const a1 = 90 - dir * g.f(6, 26);
      const [kx, ky, fx, fy] = limb(dir * 10, 14, a1, a1 + dir * g.f(-15, 20), 21);
      limbs += s`M${dir * 10} 14L${kx} ${ky}L${fx} ${fy}`;
      boots += s`M${fx + (kx - fx) * 0.3} ${fy + (ky - fy) * 0.3}L${fx} ${fy}`;
    }
    body += el("path", {
      d: limbs,
      stroke: suit,
      "stroke-width": 16,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "none",
    });
    body += el("path", { d: boots, stroke: trim, "stroke-width": 17, "stroke-linecap": "round", fill: "none" });
    limbs = "";
    let cuffs = "";
    for (const dir of [-1, 1]) {
      const up = g.f(-60, 40);
      const a1 = dir > 0 ? up : 180 - up;
      const a2 = a1 + dir * g.f(-55, 15);
      const [ex, ey, hx, hy] = limb(dir * 17, -17, a1, a2, 20);
      limbs += s`M${dir * 17} -17L${ex} ${ey}L${hx} ${hy}`;
      const wx = ex + (hx - ex) * 0.82;
      const wy = ey + (hy - ey) * 0.82;
      cuffs += s`M${wx - 7} ${wy}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`;
      hands += s`M${hx - 7.5} ${hy}a7.5 7.5 0 1 0 15 0a7.5 7.5 0 1 0 -15 0`;
    }
    body += el("path", {
      d: limbs,
      stroke: suit,
      "stroke-width": 14,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "none",
    });
    body += el("path", { d: cuffs, fill: accent });
    body += el("path", { d: hands, fill: trim });
    // Torso, belt and chest panel.
    body += el("rect", { x: -22, y: -27, width: 44, height: 47, rx: 10, fill: suit });
    body += el("rect", { x: -22, y: 9, width: 44, height: 7, fill: trim });
    body += el("rect", { x: -11, y: -14, width: 22, height: 16, rx: 3, fill: trim });
    body += el("rect", { x: -7, y: -10, width: 8, height: 4, rx: 1, fill: accent });
    body += el("circle", { cx: 5, cy: -8, r: 2.2, fill: hsl(140, 60, 55) });
    body += el("circle", { cx: -3, cy: -1.5, r: 2.2, fill: hsl(200, 70, 60) });
    body += el("circle", { cx: 5, cy: -1.5, r: 2.2, fill: hsl(5, 70, 60) });
    body += el("rect", { x: 10, y: -27, width: 12, height: 6, rx: 2, fill: accent, opacity: 0.9 });
    // The helmet: shell, neck ring, and a mirrored visor with glare.
    body += el("ellipse", { cx: 0, cy: -27, rx: 15, ry: 5, fill: trim });
    body += el("circle", { cx: 0, cy: -44, r: 20, fill: suit });
    body += el("ellipse", { cx: 0, cy: -43, rx: 15, ry: 12.5, fill: `url(#${visorPaint})` });
    body += el("path", {
      d: "M-11 -46Q-9 -53 -1 -54.5",
      stroke: "#fff",
      "stroke-width": 2.6,
      "stroke-linecap": "round",
      fill: "none",
      opacity: 0.75,
    });
    body += el("circle", { cx: 7, cy: -37, r: 1.8, fill: "#fff", opacity: 0.6 });
    body += el("rect", { x: -22, y: -49, width: 5, height: 9, rx: 2, fill: trim });
    body += el("rect", { x: 17, y: -49, width: 5, height: 9, rx: 2, fill: trim });

    // The tether runs from the belt to a handrail on a station hull in an upper corner.
    if (tethered) {
      const hw = unit * g.f(0.32, 0.45);
      const hh = unit * g.f(0.16, 0.24);
      const hx = side > 0 ? w - hw : -unit;
      const hull = "#d9dde2";
      out += el("rect", { x: hx, y: -unit, width: hw + unit, height: hh + unit, rx: unit * 0.03, fill: hull });
      out += el("rect", {
        x: hx,
        y: hh - unit * 0.035,
        width: hw + unit,
        height: unit * 0.035,
        fill: "#000",
        opacity: 0.15,
      });
      let seams = "";
      const step = unit * 0.09;
      for (let x = side > 0 ? hx + step : hw - step; side > 0 ? x < w : x > 0; x += side * step)
        seams += s`M${x} 0V${hh - unit * 0.035}`;
      out += el("path", { d: seams, stroke: "#000", "stroke-width": Math.max(1, unit * 0.004), opacity: 0.12 });
      out += el("rect", {
        x: side > 0 ? hx + hw * 0.2 : hw * 0.55,
        y: hh * 0.25,
        width: hw * 0.25,
        height: hh * 0.4,
        rx: unit * 0.01,
        fill: hsl(215, 40, 30),
      });
      const rail = side > 0 ? hx + hw * 0.12 : hw * 0.88;
      const ry = hh + unit * 0.025;
      out += el("path", {
        d: s`M${rail - unit * 0.035} ${hh}V${ry}H${rail + unit * 0.035}V${hh}`,
        stroke: accent,
        "stroke-width": Math.max(1.5, unit * 0.01),
        fill: "none",
      });
      const [bx, by] = toWorld(side * 22, 13);
      const sag = unit * g.f(0.1, 0.2);
      out += el("path", {
        d: s`M${bx} ${by}C${bx + side * unit * 0.12} ${by + sag} ${rail} ${ry + sag * 1.5} ${rail} ${ry}`,
        stroke: "#e8e4da",
        "stroke-width": Math.max(1.2, unit * 0.007),
        fill: "none",
      });
    }
    out += el("g", { transform: s`translate(${cx} ${cy})rotate(${angle})scale(${k})` }, body);
    const [fx, fy] = toWorld(0, -44);
    note.frame(fx - 26 * k, fy - 26 * k, 52 * k, 52 * k);
    note.focus(fx, fy);
    const behind = isEarth ? "the Earth" : "a cratered moon";
    note.alt(
      tethered
        ? `An astronaut floating on a tether beside a space station, ${behind} below`
        : `An astronaut floating free among the stars, ${behind} below`,
    );
    return out;
  },
);
