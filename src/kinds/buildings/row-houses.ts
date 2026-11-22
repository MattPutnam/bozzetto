import { defineKind, el, hsl, type Point, s } from "../../draw/core";
import { BAR, dots, GLASS, LIT, shade, skyAt, timeOfDay, tone, UNLIT, veil, when } from "./shared";

/**
 * A terrace of narrow townhouses side by side, of varied heights, with doors up front steps.
 *
 * @category Buildings
 */
export const rowHouses = /* @__PURE__ */ defineKind("row-houses", "Row houses", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const time = timeOfDay(g);
  const dark = shade(time);
  const lit = time !== "day";
  const street = h * g.f(0.84, 0.88);
  const floor = Math.min(h * 0.17, unit * 0.16);
  let out = skyAt(g, w, h, time, street);
  const maxFloors = Math.max(2, Math.min(4, Math.floor((street - h * 0.14 - floor * 0.6) / floor)));
  const style = g.pick(["mixed", "gable", "cornice"] as const);
  const trim = tone(40, 20, 94, dark);
  // Windows, sills, doors and steps are gathered into a few paths, drawn after the fronts, with
  // whole-pixel corners to keep the markup short.
  const r = Math.round;
  const box = (x: number, y: number, bw: number, bh: number) => `M${r(x)} ${r(y)}h${r(bw)}v${r(bh)}h${-r(bw)}Z`;
  const cross = (x: number, y: number, bw: number, bh: number) =>
    `M${r(x + bw / 2)} ${r(y)}v${r(bh)}M${r(x)} ${r(y + bh * 0.45)}h${r(bw)}`;
  const glass = { day: "", dim: "", lit: "" };
  const bars = { trim: "", lit: "" };
  let trims = "";
  let doors = "";
  let stairs = "";
  let seams = "";
  const knobs: Point[] = [];
  let litCount = 0;
  const window = (x: number, y: number, bw: number, bh: number, chance: number) => {
    const on = lit && g.chance(chance);
    if (on) litCount++;
    if (on) glass.lit += box(x, y, bw, bh);
    else if (lit) glass.dim += box(x, y, bw, bh);
    else glass.day += box(x, y, bw, bh);
    if (on) bars.lit += cross(x, y, bw, bh);
    else bars.trim += cross(x, y, bw, bh);
  };
  // Upper-floor windows repeat in a tile, one column wide and one floor tall, filled over each
  // house's upper floors. Houses are whole numbers of tiles wide, so the tiles line up in every one.
  const tile = floor * 0.42 * Math.min(1.3, Math.max(1, w / h / 2.5));
  const ww = floor * 0.25;
  let x = -tile * g.f(0, 1.5);
  const tiles = g.id("windows");
  const tileGlass = (paint: string, bar: string) =>
    el("rect", { x: (tile - ww) / 2, y: floor * 0.22, width: ww, height: floor * 0.52, fill: paint }) +
    el("path", {
      d: s`M${tile / 2} ${floor * 0.22}v${floor * 0.52}M${(tile - ww) / 2} ${floor * 0.454}h${ww}`,
      stroke: bar,
      "stroke-width": floor * 0.03,
    });
  out += el(
    "defs",
    {},
    el(
      "pattern",
      { id: tiles, width: tile, height: floor, patternUnits: "userSpaceOnUse", x: x + tile / 2, y: street },
      tileGlass(lit ? UNLIT : GLASS, trim),
      el("rect", {
        x: (tile - ww) / 2 - tile * 0.04,
        y: floor * 0.74,
        width: ww + tile * 0.08,
        height: floor * 0.05,
        fill: trim,
      }),
    ),
  );
  let grids = "";
  let hue = g.f(0, 360);
  let houses = 0;
  let middle: Point = [w / 2, street - floor * 2];
  while (x < w) {
    houses++;
    // Two or three columns of windows; more often three in wide pictures, to keep the count down.
    const cols = g.chance(w > h * 2 ? 0.85 : 0.5) ? 3 : 2;
    const hw = (cols + 1) * tile;
    const floors = g.i(Math.max(2, maxFloors - 1), maxFloors);
    const top = street - floors * floor;
    hue = (hue + g.f(50, 140)) % 360;
    const body = tone(hue, g.f(35, 55), g.f(64, 78), dark);
    const roofKind = style === "mixed" ? g.pick(["gable", "cornice", "step"] as const) : style;
    // The front, with a gable, stepped gable or a cornice (and maybe a chimney) on top.
    let front = s`M${x} ${street}V${top}`;
    if (roofKind === "gable") {
      front += s`L${x + hw / 2} ${top - hw * 0.42}L${x + hw} ${top}`;
      window(x + hw * 0.42, top - hw * 0.25, hw * 0.16, hw * 0.16, 0.3);
    } else if (roofKind === "step") {
      const st = hw / 6;
      const rise = floor * 0.18;
      front += s`v${-rise}h${st}v${-rise}h${st}v${-rise}h${st * 2}v${rise}h${st}v${rise}h${st}`;
    } else {
      front += s`H${x + hw}`;
      trims += box(x - hw * 0.02, top - floor * 0.1, hw * 1.04, floor * 0.16);
      if (g.chance(0.5))
        out += el("rect", {
          x: x + hw * g.f(0.1, 0.6),
          y: top - floor * 0.35,
          width: hw * 0.16,
          height: floor * 0.4,
          fill: tone(15, 30, 40, dark),
        });
    }
    out += el("path", { d: front + s`V${street}Z`, fill: body });
    seams += s`M${x + hw} ${top}V${street}`;
    // Windows on the upper floors, some lit over the tiles at dusk.
    grids += box(x + tile / 2, top, cols * tile, (floors - 1) * floor);
    if (lit)
      for (let f = 1; f < floors; f++)
        for (let c = 0; c < cols; c++)
          if (g.chance(0.4)) {
            litCount++;
            const wx = x + tile / 2 + c * tile + (tile - ww) / 2;
            const wy = street - (f + 1) * floor + floor * 0.22;
            glass.lit += box(wx, wy, ww, floor * 0.52);
            bars.lit += cross(wx, wy, ww, floor * 0.52);
          }
    // The front door up a few steps, and a window beside it.
    const left = g.chance(0.5);
    const steps = g.i(1, 3);
    const stepH = floor * 0.06;
    const dw = hw * 0.26;
    const dx = left ? x + hw * 0.12 : x + hw * 0.88 - dw;
    const dh = floor * 0.68;
    const sill = street - steps * stepH;
    trims += box(dx - hw * 0.04, sill - dh - floor * 0.04, dw + hw * 0.08, dh + floor * 0.04);
    doors += el("path", {
      d: box(dx, sill - dh, dw, dh),
      fill: tone(g.pick([0, 45, 140, 210, 270, 20]), g.f(40, 60), g.f(28, 42), dark),
    });
    knobs.push([left ? dx + dw * 0.78 : dx + dw * 0.22, sill - dh * 0.45]);
    for (let k = 0; k < steps; k++) {
      const grow = (steps - k) * hw * 0.03;
      stairs += box(dx - hw * 0.03 - grow, street - (k + 1) * stepH, dw + hw * 0.06 + grow * 2, stepH);
    }
    const gw = hw * 0.32;
    const gx = left ? x + hw * 0.88 - gw : x + hw * 0.12;
    trims += box(gx - hw * 0.02, street - floor * 0.3, gw + hw * 0.04, floor * 0.05);
    window(gx, street - floor * 0.78, gw, floor * 0.48, 0.6);
    if (Math.abs(x + hw / 2 - w / 2) < hw / 2) middle = [x + hw / 2, (top + street) / 2];
    x += hw;
  }
  const barWidth = floor * 0.03;
  out += el("path", { d: seams, stroke: "#000", opacity: 0.12, "stroke-width": 1.5 });
  out +=
    el("path", { d: grids, fill: `url(#${tiles})` }) +
    el("path", { d: trims, fill: trim }) +
    doors +
    dots(knobs, floor * 0.025, hsl(45, 60, 60));
  out += el("path", { d: stairs, fill: tone(30, 8, 72, dark), stroke: tone(30, 8, 55, dark), "stroke-width": 0.6 });
  if (glass.day) out += el("path", { d: glass.day, fill: GLASS });
  if (glass.dim) out += el("path", { d: glass.dim, fill: UNLIT });
  if (bars.trim) out += el("path", { d: bars.trim, stroke: trim, "stroke-width": barWidth });
  // The pavement and the road.
  const kerb = street + (h - street) * 0.5;
  out += el("rect", { y: street, width: w, height: kerb - street, fill: tone(30, 6, 70, dark) });
  out += el("rect", { y: kerb, width: w, height: h - kerb, fill: tone(220, 8, 32, dark) });
  out += el("rect", { y: kerb, width: w, height: unit * 0.008, fill: tone(30, 6, 82, dark) });
  out += veil(w, h, time);
  if (glass.lit) out += el("path", { d: glass.lit, fill: LIT });
  if (bars.lit) out += el("path", { d: bars.lit, stroke: BAR, "stroke-width": barWidth });
  const many = houses > 8 ? "A long terrace of" : "A terrace of";
  const kind =
    style === "gable"
      ? "gabled townhouses"
      : style === "cornice"
        ? "townhouses with cornices"
        : "townhouses of varied heights";
  const windows = lit ? (litCount ? ", some windows lit" : "") : "";
  note.alt(`${many} narrow ${kind} with front steps${when(time)}${windows}`);
  note.focus(middle[0], middle[1]);
  return out;
});
