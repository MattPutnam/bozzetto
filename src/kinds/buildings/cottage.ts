import { defineKind, el, hsl, type Point, s } from "../../draw/core";
import { andList } from "../../draw/words";
import {
  BAR,
  blossoms,
  dot,
  dots,
  FLOWERS,
  GLASS,
  hill,
  LIT,
  local,
  shade,
  skyAt,
  timeOfDay,
  tone,
  tree,
  veil,
  when,
} from "./shared";

type Local = ReturnType<typeof local>;

/** A window with a cross of glazing bars, its top left at (x, y) in local units. */
const pane = (u: Local, x: number, y: number, pw: number, ph: number, glass: string, bar: string): string =>
  u.rect(x, y, pw, ph, { fill: glass }) +
  u.path(`M ${x + pw / 2} ${y} V ${y + ph} M ${x} ${y + ph * 0.45} H ${x + pw}`, {
    stroke: bar,
    "stroke-width": u.k(Math.min(pw, ph) * 0.09),
  });

/** A small country cottage with a smoking chimney, a garden path and flowers or a fence. */
export const cottage = /* @__PURE__ */ defineKind(
  "cottage",
  "Country cottage",
  { roof: ["tiled", "thatched"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const time = timeOfDay(g);
    const dark = shade(time);
    const roof = g.option("roof", g.pick(["tiled", "thatched"] as const));
    const ground = h * g.f(0.68, 0.75);
    const size = Math.min(unit * 0.62, w * 0.44, (ground - h * 0.05) / 1.3);
    const cx = w * g.f(0.42, 0.58);
    const grass = g.f(85, 125);
    let out = skyAt(g, w, h, time, ground);
    out += hill(g, w, h, ground - h * g.f(0.06, 0.14), h * g.f(0.03, 0.08), tone(grass + 12, 26, 62, dark));
    out += el("rect", { y: ground, width: w, height: h - ground, fill: tone(grass, 40, 46, dark) });
    // Trees standing behind, to either side.
    const leaf = tone(grass + 10, 38, 32, dark);
    const trunk = tone(25, 30, 28, dark);
    for (const dir of [-1, 1])
      if (g.chance(0.6)) out += tree(cx + dir * size * g.f(0.85, 1.3), ground + 1, size * g.f(0.75, 1.05), leaf, trunk);
    const u = local(cx, ground, size);
    const lit = time !== "day";
    let lights = "";
    // The chimney, behind the roof, and its smoke.
    const side = g.pick([-1, 1]);
    const chx = side * g.f(0.18, 0.3);
    const smoke = lit || g.chance(0.7);
    if (smoke) {
      const drift = g.f(0.04, 0.1) * g.pick([-1, 1]);
      for (let k = 0; k < 3; k++)
        out += u.circle(chx + drift * (k + 0.5), -1.17 - k * 0.12, 0.04 + 0.025 * k, {
          fill: hsl(220, 10, 88),
          opacity: 0.7 - k * 0.15,
        });
    }
    const brick = tone(g.f(5, 25), 35, 42, dark);
    out += u.rect(chx - 0.055, -1.1, 0.11, 0.45, { fill: brick });
    out += u.rect(chx - 0.07, -1.12, 0.14, 0.04, { fill: tone(20, 15, 30, dark) });
    // The walls.
    const wall = g.pick([
      [40, 35, 90],
      [30, 30, 84],
      [45, 45, 80],
      [15, 35, 84],
      [200, 20, 86],
      [35, 12, 72],
    ] as const);
    out += u.rect(-0.5, -0.52, 1, 0.52, { fill: tone(wall[0], wall[1], wall[2], dark) });
    // The roof.
    if (roof === "thatched") {
      const straw = g.f(34, 44);
      out += u.path(
        "M -0.63 -0.44 C -0.68 -0.72 -0.48 -0.99 -0.28 -0.99 H 0.28 C 0.48 -0.99 0.68 -0.72 0.63 -0.44 Q 0 -0.4 -0.63 -0.44 Z",
        { fill: tone(straw, 45, 58, dark) },
      );
      let strokes = "";
      for (let k = 0; k <= 8; k++) {
        const x = -0.52 + k * 0.13;
        strokes += `M ${x * 0.55} -0.95 L ${x} -0.47 `;
      }
      out += u.path(strokes, { stroke: "#000", opacity: 0.12, "stroke-width": u.k(0.012) });
      out += u.path("M -0.63 -0.44 Q 0 -0.4 0.63 -0.44", {
        fill: "none",
        stroke: tone(straw - 6, 40, 38, dark),
        "stroke-width": u.k(0.03),
      });
      out += u.rect(-0.3, -1.01, 0.6, 0.06, { rx: u.k(0.03), fill: tone(straw - 4, 40, 46, dark) });
    } else {
      const tile = g.pick([
        [12, 55, 45],
        [215, 15, 36],
        [22, 35, 34],
        [5, 45, 38],
      ] as const);
      out += u.poly(
        [
          [-0.6, -0.47],
          [-0.38, -0.96],
          [0.38, -0.96],
          [0.6, -0.47],
        ],
        { fill: tone(tile[0], tile[1], tile[2], dark) },
      );
      let rows = "";
      for (let k = 1; k < 4; k++) {
        const y = -0.47 - k * 0.12;
        const t = k * 0.12;
        rows += `M ${-0.6 + 0.449 * t} ${y} H ${0.6 - 0.449 * t} `;
      }
      out += u.path(rows, { stroke: "#000", opacity: 0.15, "stroke-width": u.k(0.012) });
      out += u.rect(-0.4, -0.98, 0.8, 0.035, { rx: u.k(0.015), fill: tone(tile[0], tile[1], tile[2] - 10, dark) });
      out += u.rect(-0.5, -0.47, 1, 0.035, { fill: "#000", opacity: 0.12 });
    }
    // The door, with windows either side of it or beside it.
    const doorX = g.pick([0, 0, -0.27, 0.27]);
    const windows = doorX === 0 ? [-0.29, 0.29] : [-doorX, 0];
    const paint = g.pick([
      [205, 45, 40],
      [150, 30, 35],
      [0, 50, 42],
      [45, 70, 50],
      [270, 20, 42],
      [20, 40, 30],
    ] as const);
    const door = tone(paint[0], paint[1], paint[2], dark);
    out += u.rect(doorX - 0.11, -0.02, 0.22, 0.03, { fill: tone(30, 8, 60, dark) });
    out += u.path(`M ${doorX - 0.085} 0 V -0.22 A 0.085 0.085 0 0 1 ${doorX + 0.085} -0.22 V 0 Z`, { fill: door });
    out += u.circle(doorX + 0.05, -0.13, 0.012, { fill: hsl(45, 60, 60) });
    const shutters = g.chance(0.4);
    const boxes = g.chance(0.5);
    const trim = tone(40, 20, 94, dark);
    for (const x of windows) {
      if (shutters) {
        out += u.rect(x - 0.14, -0.39, 0.055, 0.18, { fill: door });
        out += u.rect(x + 0.085, -0.39, 0.055, 0.18, { fill: door });
      }
      out += u.rect(x - 0.095, -0.4, 0.19, 0.2, { fill: trim });
      const glass = pane(u, x - 0.075, -0.38, 0.15, 0.16, lit ? LIT : GLASS, BAR);
      if (lit) lights += glass;
      else out += glass;
      if (boxes) {
        out += u.rect(x - 0.11, -0.2, 0.22, 0.045, { fill: tone(25, 40, 32, dark) });
        const spots: Point[] = [];
        for (let k = 0; k < 6; k++) spots.push([u.x(x - 0.09 + k * 0.036), u.y(-0.205 - (k % 2) * 0.015)]);
        out += blossoms(g, spots, size * 0.018, FLOWERS);
      }
    }
    // Flower bushes along the foot of the wall, kept clear of the door.
    const bush = tone(grass + 15, 40, 30, dark);
    const flowerSpots: Point[] = [];
    let bushes = "";
    for (let x = -0.44; x < 0.46; x += g.f(0.12, 0.18)) {
      if (Math.abs(x - doorX) < 0.16) continue;
      const r = g.f(0.05, 0.07);
      bushes += dot(u.x(x), u.y(-0.02), size * r);
      for (let k = 0; k < 3; k++) flowerSpots.push([u.x(x + g.f(-r, r) * 0.8), u.y(-0.02 - g.f(0, r) * 0.9)]);
    }
    out += el("path", { d: bushes, fill: bush });
    out += blossoms(g, flowerSpots, size * 0.015, FLOWERS);
    // The garden path from the door to the front of the picture.
    const top = u.x(doorX);
    const foot = top + size * g.f(-0.35, 0.35);
    const bend = size * g.f(-0.2, 0.2);
    const wide = size * 0.28;
    out += el("path", {
      d: s`M${top - size * 0.08} ${ground}
         Q ${(top + foot) / 2 + bend - wide * 0.6} ${(ground + h) / 2} ${foot - wide} ${h}
         H ${foot + wide}
         Q ${(top + foot) / 2 + bend + wide * 0.6} ${(ground + h) / 2} ${top + size * 0.08} ${ground}Z`,
      fill: tone(35, 20, 74, dark),
    });
    // A picket fence across the front garden, with a gap for the path; or flowers along the path.
    const fence = g.chance(0.6);
    if (fence) {
      const fy = ground + (h - ground) * g.f(0.4, 0.55);
      const gap = (top + foot) / 2 + bend * 0.5;
      const gapW = wide * 0.9;
      const ph = size * 0.13;
      const pw = size * 0.035;
      const step = size * 0.07;
      const wood = g.chance(0.6) ? tone(40, 20, 92, dark) : tone(30, 25, 55, dark);
      // One pointed picket in a tile repeated along the fence.
      const id = g.id("picket");
      out += el(
        "defs",
        {},
        el(
          "pattern",
          { id, width: step, height: ph, patternUnits: "userSpaceOnUse", x: gap + gapW, y: fy - ph },
          el("path", { d: s`M0 ${ph}V${pw / 2}L${pw / 2} 0L${pw} ${pw / 2}V${ph}Z`, fill: wood }),
        ),
      );
      // The tiles start at the right side of the gap; the left run stops at the last whole picket.
      const left = gap + gapW + Math.floor((-2 * gapW - pw) / step) * step + pw;
      let rails = "";
      for (const ry of [fy - ph * 0.75, fy - ph * 0.35]) {
        rails += s`M0 ${ry}H${left}v${size * 0.02}H0Z`;
        rails += s`M${gap + gapW} ${ry}H${w}v${size * 0.02}H${gap + gapW}Z`;
      }
      out += el("path", { d: rails, fill: wood });
      out += el("rect", { y: fy - ph, width: Math.max(0, left), height: ph, fill: `url(#${id})` });
      out += el("rect", {
        x: gap + gapW,
        y: fy - ph,
        width: Math.max(0, w - gap - gapW),
        height: ph,
        fill: `url(#${id})`,
      });
    } else {
      const spots: Point[] = [];
      const far: Point[] = [];
      const near: Point[] = [];
      for (let k = 0; k < 10; k++) {
        const t = (k + g.f(0.2, 0.8)) / 10;
        const yy = ground + (h - ground) * t;
        const half = size * 0.08 + (wide - size * 0.08) * t;
        const mid = top + (foot - top) * t + bend * 2 * t * (1 - t);
        for (const dir of [-1, 1]) {
          const x = mid + dir * (half + size * (0.04 + 0.04 * t));
          (k < 5 ? far : near).push([x, yy]);
          spots.push([x, yy - size * 0.01]);
        }
      }
      out += dots(far, size * 0.032, bush) + dots(near, size * 0.048, bush);
      out += blossoms(g, spots, size * 0.022, FLOWERS);
    }
    out += veil(w, h, time) + lights;
    const kind = roof === "thatched" ? "A thatched cottage" : "A country cottage";
    const extras = andList([smoke && "chimney smoke", "a garden path", fence ? "a picket fence" : "flowers"]);
    note.alt(`${kind} with ${extras}${when(time)}${lit ? ", windows lit" : ""}`);
    note.focus(cx, ground - size * 0.45);
    return out;
  },
);
