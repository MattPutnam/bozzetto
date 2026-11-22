import { defineKind, el, hex, hsl, s } from "../../draw/core";

/*
 * Glyphs are drawn in staff units: a staff space is 10, so a notehead is about 13 wide and 10 tall,
 * and a stem is about 3.5 noteheads (35) long. Every shape in a glyph winds clockwise, so heads,
 * stems, flags and beams can share one path, and the holes of hollow heads wind the other way.
 */

/** A tilted oval: rx along the axis turned `deg` from horizontal. Clockwise, or the other way for a hole. */
function oval(cx: number, cy: number, rx: number, ry: number, deg: number, hole = false): string {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a) * rx;
  const dy = Math.sin(a) * rx;
  const arc = (x: number, y: number) => s`A${rx} ${ry} ${deg} 1 ${hole ? 0 : 1} ${x} ${y}`;
  return s`M${cx + dx} ${cy + dy}` + arc(cx - dx, cy - dy) + arc(cx + dx, cy + dy) + "Z";
}

/** A clockwise rectangle. */
const box = (x: number, y: number, bw: number, bh: number): string => s`M${x} ${y}h${bw}v${bh}h${-bw}z`;

const HEAD_RX = 6.5;

const HEAD_RY = 4.8;

const TILT = -20;

const STEM = 1.4;

/** The right end of a tilted head is at (6.32, -0.98); its left end mirrors it. */
const EDGE = 6.32;

const head = (x: number, y: number) => oval(x, y, HEAD_RX, HEAD_RY, TILT);

const halfHead = (x: number, y: number) => head(x, y) + oval(x, y, 5.2, 2.6, -35, true);

/**
 * A flag hanging to the right of a stem whose outer edge is at x. On an up-stem it starts at the
 * top (y) and curves down; on a down-stem it starts at the bottom and curves up.
 */
function flag(x: number, y: number, up: boolean): string {
  const v = (d: number) => (up ? y + d : y - d);
  if (up)
    return s`M${x} ${v(0)}C${x} ${v(8)} ${x + 8.7} ${v(11)} ${x + 6.7} ${v(22)}C${x + 6.2} ${v(16)} ${x + 2.7} ${v(12)} ${x} ${v(11)}Z`;
  // Mirrored, so the points run backwards to keep it clockwise.
  return s`M${x} ${v(11)}C${x + 2.7} ${v(12)} ${x + 6.2} ${v(16)} ${x + 6.7} ${v(22)}C${x + 8.7} ${v(11)} ${x} ${v(8)} ${x} ${v(0)}Z`;
}

/** A single note's path, head at the origin: quarter, half, whole, eighth or sixteenth, stem up or down. */
function single(type: string, up: boolean): string {
  if (type === "whole") return oval(0, 0, 8, 5.2, -8) + oval(0, 0, 4, 2.5, 55, true);
  const long = type === "sixteenth" ? 39 : 36;
  let d = type === "half" ? halfHead(0, 0) : head(0, 0);
  if (up) {
    d += box(EDGE - STEM, -long, STEM, long - 0.5);
    if (type === "eighth" || type === "sixteenth") d += flag(EDGE, -long, true);
    if (type === "sixteenth") d += flag(EDGE, -long + 8, true);
  } else {
    d += box(-EDGE, 0.5, STEM, long - 0.5);
    if (type === "eighth" || type === "sixteenth") d += flag(-EDGE + STEM, long, false);
    if (type === "sixteenth") d += flag(-EDGE + STEM, long - 8, false);
  }
  return d;
}

/** A sharp: two upright strokes, the left one set lower, crossed by two thick bars rising to the right. */
const sharp = (): string =>
  box(-3.1, -12, 1.1, 27) +
  box(2, -15, 1.1, 27) +
  [-4.5, 4.5].map(c => s`M-6 ${c + 0.5}L6 ${c - 3.7}L6 ${c - 0.5}L-6 ${c + 3.7}Z`).join("");

/** A flat: an upright stroke with a hollow rounded belly at its foot. */
const flatSign = (): string =>
  box(-4, -20, 1.2, 27) +
  "M-2.8 -2C1 -6 7 -4 5 0C3.5 3 -.5 5 -2.8 7Z" +
  "M-2.8 4.6C0 2.8 3.4 .6 3 -1.2C2.4 -3.2 -.4 -2.2 -2.8 -.2Z";

/** A notehead's bounds, for centering a glyph: [left, top, right, bottom] in staff units. */
type Bounds = [number, number, number, number];

/**
 * Two beamed eighths or four beamed sixteenths, stems up, with heads at the given staff steps.
 * Returns the path and its bounds, after moving it by (dx, dy).
 */
function beamed(steps: readonly number[], beams: number, dx = 0, dy = 0): [string, Bounds] {
  const gap = steps.length > 2 ? 17 : 21;
  const heads = steps.map((step, k): [number, number] => [k * gap + dx, -step * 5 + dy]);
  const first = heads[0];
  const last = heads[heads.length - 1];
  const span = last[0] - first[0];
  // The beam follows the melody but leans no more than a little.
  const slope = Math.max(-0.2, Math.min(0.2, (last[1] - first[1]) / span));
  // Its height is set so the stem nearest the beam is still a full 3.5 heads long.
  const base = Math.min(...heads.map(([x, y]) => y - slope * x)) - 35;
  const at = (x: number) => base + slope * x;
  let d = "";
  for (const [x, y] of heads) {
    d += head(x, y);
    d += box(x + EDGE - STEM, at(x + EDGE), STEM, y - 0.5 - at(x + EDGE));
  }
  const x0 = first[0] + EDGE - STEM;
  const x1 = last[0] + EDGE;
  for (let k = 0; k < beams; k++) {
    const off = k * 7.5;
    d += s`M${x0} ${at(x0) + off}L${x1} ${at(x1) + off}L${x1} ${at(x1) + off + 5}L${x0} ${at(x0) + off + 5}Z`;
  }
  const top = Math.min(at(x0), at(x1));
  const bottom = Math.max(...heads.map(([, y]) => y)) + HEAD_RY;
  return [d, [first[0] - HEAD_RX, top, x1, bottom]];
}

/**
 * Music notes of different kinds, sizes and colors scattered over a soft ground.
 *
 * @category Music
 */
export const notes = /* @__PURE__ */ defineKind("notes", "Music notes", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const dark = g.chance(0.3);
  const groundHue = g.f(0, 360);
  const ground = dark ? hsl(groundHue, g.f(20, 35), g.f(13, 19)) : hsl(groundHue, g.f(25, 45), g.f(92, 96));
  // A few hues stepped around the wheel from a seeded start, so the colors vary but agree.
  const start = g.f(0, 360);
  const step = g.f(45, 80) * g.pick([1, -1]);
  const inks = Array.from({ length: g.i(3, 5) }, (_, k) =>
    dark
      ? hex((start + k * step + 360) % 360, g.f(55, 75), g.f(64, 74))
      : hex((start + k * step + 360) % 360, g.f(50, 70), g.f(44, 56)),
  );
  let out = el("rect", { width: w, height: h, fill: ground });

  // Sometimes a faint staff drifts across the frame as a wavy ribbon.
  const staff = g.chance(0.45);
  if (staff) {
    const gapY = unit * g.f(0.03, 0.04);
    const y0 = h * g.f(0.35, 0.65) - gapY * 2;
    const rise = g.f(-0.15, 0.15) * h;
    const wave = unit * g.f(0.08, 0.16);
    let d = "";
    for (let k = 0; k < 5; k++) {
      const y = y0 + k * gapY;
      d += s`M${-10} ${y - rise}C${w * 0.35} ${y - wave - rise / 3} ${w * 0.65} ${y + wave + rise / 3} ${w + 10} ${y + rise}`;
    }
    out += el("path", {
      d,
      fill: "none",
      stroke: dark ? "#ffffff" : "#000000",
      "stroke-opacity": dark ? "0.16" : "0.12",
      "stroke-width": Math.max(1, unit * 0.005),
    });
  }

  // Glyphs, biggest first so the small ones fill the gaps between them. Long frames get more, though
  // not in full proportion, to keep the markup small.
  const count = Math.round(((w * h) / (unit * unit)) ** 0.75 * g.f(9, 12));
  const sizes = Array.from({ length: count }, () => unit * g.f(0.14, 0.3)).sort((a, b) => b - a);
  const placed: [number, number, number][] = [];
  // Single glyphs are drawn once, centered on the origin, and placed with `use`.
  const defs: Record<string, [string, Bounds]> = {};
  // Glyphs are grouped by color, to keep the markup short.
  const glyphs: string[] = inks.map(() => "");
  let beamedCount = 0;
  let focus: [number, number] | undefined;
  for (const size of sizes) {
    // Choose the glyph first, then find room for it. One scale for every note of a size, so a
    // whole note's head matches a quarter's.
    const roll = g.next();
    const turn = g.f(-20, 20);
    const color = g.i(0, inks.length - 1);
    let scale = size / 44;
    let shape: string;
    let bounds: Bounds;
    let tilt = turn;
    if (roll < 0.22 && beamedCount < 4) {
      // A beamed pair of eighths or a run of four sixteenths, the stems up or (turned over) down.
      // A few at most: they take the most markup.
      const four = g.chance(0.45);
      const steps = Array.from({ length: four ? 4 : 2 }, () => g.i(-3, 3));
      // Drawn once to measure, then again centered on the origin.
      const [, box] = beamed(steps, four ? 2 : 1);
      bounds = box;
      const [d] = beamed(steps, four ? 2 : 1, -(box[0] + box[2]) / 2, -(box[1] + box[3]) / 2);
      shape = el("path", { d });
      tilt = turn * 0.6 + (g.chance(0.4) ? 180 : 0);
      beamedCount++;
    } else {
      let key: string;
      if (roll < 0.9) {
        const type = g.pick(["quarter", "quarter", "eighth", "eighth", "half", "half", "sixteenth", "whole"]);
        const up = g.chance(0.6);
        // Flagged notes are drawn either way up; plain ones are just turned over, which keeps the
        // stem on the correct side of the head.
        const flagged = type === "eighth" || type === "sixteenth";
        key = type + (flagged && !up ? "-down" : "");
        if (!up && !flagged) tilt += 180;
        const long = type === "sixteenth" ? 39 : 36;
        bounds =
          type === "whole"
            ? [-8, -5.5, 8, 5.5]
            : flagged && !up
              ? [-HEAD_RX, -HEAD_RY, HEAD_RX, long]
              : [-HEAD_RX, -long, flagged ? EDGE + 8 : HEAD_RX, HEAD_RY];
        defs[key] ??= [single(type, flagged ? up : true), bounds];
      } else {
        // Now and then a sharp or a flat, a little smaller than the notes.
        key = g.chance(0.5) ? "sharp" : "flat";
        bounds = key === "sharp" ? [-6, -15, 6, 15] : [-4, -20, 5, 7];
        defs[key] ??= [key === "sharp" ? sharp() : flatSign(), bounds];
        scale *= 0.85;
        tilt = turn * 0.5;
      }
      shape = el("use", { href: `#${g.id(key)}` });
    }
    const r = (scale * Math.hypot(bounds[2] - bounds[0], bounds[3] - bounds[1])) / 2;
    let spot: [number, number] | undefined;
    for (let tries = 0; tries < 40 && !spot; tries++) {
      const x = g.f(r * 0.85, w - r * 0.85);
      const y = g.f(r * 0.9, h - r * 0.9);
      if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > (pr + r) * 0.9)) spot = [x, y];
    }
    if (!spot) continue;
    placed.push([spot[0], spot[1], r]);
    focus ??= spot;
    const transform =
      s`translate(${spot[0]} ${spot[1]})` + `rotate(${Math.round(tilt)})scale(${Math.round(scale * 100) / 100})`;
    glyphs[color] += shape.replace(/\/>$/, ` transform="${transform}"/>`);
  }
  const shapes = Object.entries(defs).map(([key, [d, b]]) =>
    el("path", { id: g.id(key), d, transform: s`translate(${-(b[0] + b[2]) / 2} ${-(b[1] + b[3]) / 2})` }),
  );
  out = el("defs", {}, ...shapes) + out;
  out += glyphs.map((group, k) => (group ? el("g", { fill: inks[k] }, group) : "")).join("");

  const [fx, fy] = focus ?? [w / 2, h / 2];
  note.focus(fx, fy);
  note.alt(
    staff
      ? "Music notes of many sizes drifting along a faint wavy staff"
      : beamedCount > 1 && g.chance(0.5)
        ? "Scattered music notes with beamed eighths and sixteenths"
        : "Music notes of many sizes scattered across the frame",
  );
  return out;
});
