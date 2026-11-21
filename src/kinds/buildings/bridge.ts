import { defineKind, el, hsl, type Point, s } from "../../draw/core";
import { dot, dots, hill, LIT, shade, skyAt, timeOfDay, tone, veil, when } from "./shared";

/** A stone arch bridge over a river, or a suspension bridge across a bay. */
export const bridge = /* @__PURE__ */ defineKind(
  "bridge",
  "Bridge",
  { style: ["stone", "suspension"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const time = timeOfDay(g);
    const dark = shade(time);
    const style = g.option("style", g.pick(["stone", "suspension"] as const));
    const lit = time !== "day";
    const grass = g.f(85, 125);
    const waterPaint = time === "night" ? hsl(225, 35, 22) : time === "dusk" ? hsl(310, 22, 48) : hsl(205, 45, 60);
    let out = "";
    let lights = "";
    if (style === "stone") {
      const waterY = h * g.f(0.6, 0.66);
      const tall = Math.min(h * 0.3, unit * g.f(0.3, 0.36));
      const deckTop = waterY - tall;
      const parapet = tall * 0.12;
      const apex = deckTop + parapet + tall * 0.1;
      const spring = waterY - tall * 0.12;
      const ry = spring - apex;
      const rx = ry * g.f(0.95, 1.2);
      const pier = rx * g.f(0.3, 0.45);
      const arches = Math.max(1, Math.min(7, Math.floor((w * 0.8 + pier) / (2 * rx + pier))));
      const span = arches * 2 * rx + (arches - 1) * pier;
      const start = (w - span) / 2;
      const horizon = deckTop - h * g.f(0.04, 0.1);
      // Through the arches: the far trees, a strip of meadow, then the far waterline low in each arch.
      const shore = spring + (waterY - spring) * g.f(0, 0.4);
      const treeLine = apex + ry * g.f(0.25, 0.42);
      // The river is kept bluer and deeper than the stone, even at dusk.
      const river = time === "night" ? waterPaint : time === "dusk" ? hsl(238, 26, 42) : hsl(205, 50, 54);
      out += skyAt(g, w, h, time, horizon);
      out += hill(g, w, h, horizon, h * g.f(0.03, 0.08), tone(grass + 15, 24, 60, dark));
      out += el("rect", { y: shore, width: w, height: h - shore, fill: river });
      // Trees along the far bank, their tops showing over the bridge.
      const leaf = tone(grass + 10, 36, 32, dark);
      let crowns = "";
      for (let x = g.f(-0.05, 0.05) * w; x < w; x += unit * g.f(0.08, 0.2)) {
        const r = unit * g.f(0.04, 0.07);
        crowns += dot(x, shore - (shore - deckTop) - r * g.f(-0.6, 0.6), r);
      }
      out += el("path", { d: crowns, fill: leaf });
      // The far bank, kept as a group so the river can mirror it through the arches too.
      const bank = g.id("bank");
      out += el(
        "g",
        { id: bank },
        el("rect", { y: horizon + h * 0.02, width: w, height: treeLine - horizon - h * 0.02, fill: leaf }),
        el("rect", { y: treeLine, width: w, height: shore - treeLine, fill: tone(grass + 5, 36, 56, dark) }),
        el("rect", { y: shore - unit * 0.01, width: w, height: unit * 0.012, fill: "#000", opacity: 0.15 }),
      );
      // The bridge: one body with the arches cut out, arch rings, and the parapet.
      const stonePaint = g.pick([
        [35, 15, 70],
        [28, 25, 62],
        [210, 6, 64],
        [15, 18, 66],
      ] as const);
      const body = tone(stonePaint[0], stonePaint[1], stonePaint[2], dark);
      let d = s`M-1 ${deckTop + parapet}H${w + 1}V${waterY + 1}H-1Z`;
      let rings = "";
      let soffits = "";
      for (let k = 0; k < arches; k++) {
        const x0 = start + k * (2 * rx + pier);
        soffits += s`M${x0} ${waterY}V${spring}A${rx} ${ry} 0 0 1 ${x0 + 2 * rx} ${spring}V${waterY}`;
        d += s`M${x0} ${waterY + 1}V${spring}A${rx} ${ry} 0 0 1 ${x0 + 2 * rx} ${spring}V${waterY + 1}Z`;
        const t = ry * 0.09;
        rings += s`M${x0 - t} ${spring}A${rx + t} ${ry + t} 0 0 1 ${x0 + 2 * rx + t} ${spring}`;
      }
      // A shadow just inside each arch, under the stone, so the openings read as deep.
      let bridge = el("path", { d: soffits, fill: "none", stroke: "#000", opacity: 0.22, "stroke-width": ry * 0.22 });
      bridge += el("path", { d, fill: body, "fill-rule": "evenodd" });
      bridge += el("path", {
        d: rings,
        fill: "none",
        stroke: tone(stonePaint[0], stonePaint[1], stonePaint[2] + 10, dark),
        "stroke-width": ry * 0.18,
        "stroke-dasharray": s`${ry * 0.08} ${ry * 0.04}`,
      });
      bridge += el("rect", { x: -1, y: deckTop, width: w + 2, height: parapet, fill: body });
      bridge += el("rect", {
        x: -1,
        y: deckTop - parapet * 0.15,
        width: w + 2,
        height: parapet * 0.3,
        fill: tone(stonePaint[0], stonePaint[1], stonePaint[2] + 12, dark),
      });
      bridge += el("rect", {
        x: -1,
        y: deckTop + parapet,
        width: w + 2,
        height: parapet * 0.25,
        fill: "#000",
        opacity: 0.12,
      });
      // Lamps along the parapet.
      const lamps = g.chance(lit ? 0.85 : 0.4);
      if (lamps) {
        let posts = "";
        for (let k = 0; k <= arches; k++) {
          const x = start + k * (2 * rx + pier) - pier / 2;
          if (x < 0 || x > w) continue;
          posts += s`M${x - unit * 0.004} ${deckTop}v${-tall * 0.28}h${unit * 0.008}v${tall * 0.28}Z`;
          lights += el("circle", {
            cx: x,
            cy: deckTop - tall * 0.3,
            r: unit * 0.012,
            fill: lit ? LIT : hsl(45, 20, 88),
          });
          if (lit)
            lights += el("circle", { cx: x, cy: deckTop - tall * 0.3, r: unit * 0.035, fill: LIT, opacity: 0.25 });
        }
        bridge += el("path", { d: posts, fill: tone(220, 10, 25, dark) });
      }
      // The bridge and its reflection.
      const id = g.id("bridge");
      const clip = g.id("clip");
      out += el("defs", {}, el("clipPath", { id: clip }, el("rect", { y: waterY, width: w, height: h - waterY })));
      out += el("g", { id }, bridge);
      out += el(
        "g",
        { "clip-path": `url(#${clip})`, opacity: 0.4 },
        el(
          "g",
          { transform: s`translate(0 ${2 * waterY}) scale(1 -1)` },
          el("use", { href: `#${bank}` }),
          el("use", { href: `#${id}` }),
        ),
      );
      let ripples = "";
      for (let k = g.i(5, 9); k > 0; k--)
        ripples += s`M${w * g.f(0, 1)} ${waterY + (h - waterY) * g.f(0.1, 0.95)}h${unit * g.f(0.04, 0.1)}`;
      out += el("path", { d: ripples, stroke: "#ffffff", opacity: 0.35, "stroke-width": unit * 0.006 });
      // The banks the bridge runs into, sloping from the road down to the water and the near corners.
      let banks = "";
      const edge = start - pier * 0.4;
      for (const dir of [-1, 1]) {
        const x0 = dir < 0 ? 0 : w;
        const toe = x0 - dir * Math.max(edge, unit * 0.06);
        banks += s`M${x0} ${deckTop + parapet}
                 Q${toe + dir * (toe - x0) * -0.1} ${deckTop + parapet} ${toe} ${waterY}
                 Q${toe - dir * unit * g.f(0, 0.1)} ${(waterY + h) / 2} ${x0 - dir * w * g.f(0.02, 0.12)} ${h}
                 H${x0}Z`;
      }
      out += el("path", { d: banks, fill: tone(grass, 40, 40, dark) });
      out += veil(w, h, time) + lights;
      const count =
        arches === 1 ? "a single arch" : arches < 4 ? `${["", "", "two", "three"][arches]} arches` : "many arches";
      note.alt(
        `A stone bridge with ${count} reflected in a calm river${when(time)}${lamps && lit ? ", lamps lit" : ""}`,
      );
      note.focus(w / 2, apex);
      return out;
    }
    // A suspension bridge: far headlands, the bay, two towers and the cables.
    const horizon = h * g.f(0.52, 0.6);
    const deckY = horizon - unit * g.f(0.02, 0.08);
    const base = horizon + (h - horizon) * g.f(0.2, 0.35);
    const span = Math.min(w * g.f(0.45, 0.6), unit * g.f(1.1, 1.4));
    const t1 = w / 2 - span / 2 + w * g.f(-0.05, 0.05);
    const t2 = t1 + span;
    const towerH = Math.min(deckY - h * 0.08, unit * g.f(0.38, 0.5));
    const peak = deckY - towerH;
    out += skyAt(g, w, h, time, horizon);
    const land = tone(grass + 20, 20, 55, dark);
    out += el("path", {
      d: s`M0 ${horizon - h * g.f(0.04, 0.12)} Q ${w * g.f(0.05, 0.2)} ${horizon - h * g.f(0.1, 0.18)} ${w * g.f(0.3, 0.45)} ${horizon} H0Z`,
      fill: land,
    });
    out += el("path", {
      d: s`M${w} ${horizon - h * g.f(0.03, 0.1)} Q ${w * g.f(0.8, 0.95)} ${horizon - h * g.f(0.08, 0.15)} ${w * g.f(0.55, 0.7)} ${horizon} H${w}Z`,
      fill: tone(grass + 25, 16, 62, dark),
    });
    out += el("rect", { y: horizon, width: w, height: h - horizon, fill: waterPaint });
    const paint = g.pick([
      [210, 8, 70],
      [40, 15, 88],
      [180, 30, 40],
      [220, 25, 35],
    ] as const);
    const steel = tone(paint[0], paint[1], paint[2], dark);
    // Reflections of the towers.
    for (const tx of [t1, t2])
      out += el("rect", {
        x: tx - unit * 0.03,
        y: base,
        width: unit * 0.06,
        height: (h - base) * 0.8,
        fill: steel,
        opacity: 0.18,
      });
    const cableY = (x: number) => {
      if (x >= t1 && x <= t2) {
        const t = (x - t1) / span;
        const low = deckY - towerH * 0.06;
        const c = 2 * low - (peak + peak) / 2;
        return (1 - t) ** 2 * peak + 2 * t * (1 - t) * c + t * t * peak;
      }
      // The side spans fall to the deck half a span out.
      const t = Math.min(1, Math.abs(x < t1 ? t1 - x : x - t2) / (span / 2));
      const c = (peak + deckY) / 2 + towerH * 0.12;
      return (1 - t) ** 2 * peak + 2 * t * (1 - t) * c + t * t * deckY;
    };
    let cable = "";
    for (let k = 0; k <= 40; k++) {
      const x = t1 - span / 2 + (2 * span * k) / 40;
      cable += s`${k ? "L" : "M"}${x} ${cableY(x)}`;
    }
    let hangers = "";
    for (let x = t1 - span / 2; x < t2 + span / 2; x += unit * 0.025)
      if (Math.abs(x - t1) > unit * 0.02 && Math.abs(x - t2) > unit * 0.02) hangers += s`M${x} ${cableY(x)}V${deckY}`;
    out += el("path", { d: hangers, stroke: steel, "stroke-width": unit * 0.003 });
    out += el("path", { d: cable, fill: "none", stroke: steel, "stroke-width": unit * 0.008 });
    // Piers holding the approaches.
    const deck = unit * 0.03;
    let piers = "";
    for (const dir of [-1, 1])
      for (
        let x = (dir < 0 ? t1 : t2) + dir * span * 0.25;
        x > -unit * 0.1 && x < w + unit * 0.1;
        x += dir * span * 0.25
      )
        piers += s`M${x - unit * 0.012} ${deckY}h${unit * 0.024}V${base}h${-unit * 0.024}Z`;
    out += el("path", { d: piers, fill: tone(paint[0], paint[1] * 0.4, paint[2] * 0.8, dark) });
    out += el("rect", { x: -1, y: deckY, width: w + 2, height: deck, fill: tone(220, 8, 34, dark) });
    out += el("rect", { x: -1, y: deckY - deck * 0.2, width: w + 2, height: deck * 0.45, fill: steel });
    // The towers: two legs joined by cross beams.
    let towers = "";
    const legW = unit * 0.016;
    const gap = unit * 0.045;
    for (const tx of [t1, t2]) {
      for (const dir of [-1, 1])
        towers += s`M${tx + (dir * gap) / 2 - legW / 2} ${peak - unit * 0.01}h${legW}V${base}h${-legW}Z`;
      for (const y of [peak, peak + (deckY - peak) * 0.35, peak + (deckY - peak) * 0.7, deckY + deck])
        towers += s`M${tx - gap / 2} ${y}h${gap}v${unit * 0.014}h${-gap}Z`;
    }
    out += el("path", { d: towers, fill: steel });
    out += el("rect", {
      x: t1 - gap,
      y: base - unit * 0.01,
      width: gap * 2,
      height: unit * 0.02,
      fill: tone(30, 8, 45, dark),
    });
    out += el("rect", {
      x: t2 - gap,
      y: base - unit * 0.01,
      width: gap * 2,
      height: unit * 0.02,
      fill: tone(30, 8, 45, dark),
    });
    if (lit) {
      const beads: Point[] = [];
      for (let x = g.f(0, unit * 0.05); x < w; x += unit * 0.05) beads.push([x, deckY + deck * 0.3]);
      lights += dots(beads, unit * 0.005, LIT);
      let glints = "";
      for (let x = g.f(0, unit * 0.1); x < w; x += unit * g.f(0.08, 0.14))
        glints += s`M${x} ${base + (h - base) * g.f(0.1, 0.6)}h${unit * g.f(0.02, 0.05)}`;
      lights += el("path", { d: glints, stroke: LIT, opacity: 0.4, "stroke-width": unit * 0.005 });
      lights += el("circle", { cx: t1, cy: peak - unit * 0.012, r: unit * 0.006, fill: hsl(0, 90, 60) });
      lights += el("circle", { cx: t2, cy: peak - unit * 0.012, r: unit * 0.006, fill: hsl(0, 90, 60) });
    }
    out += veil(w, h, time) + lights;
    note.alt(`A suspension bridge across a bay${when(time)}${lit ? ", its deck lights glowing" : ""}`);
    note.focus((t1 + t2) / 2, (peak + deckY) / 2);
    return out;
  },
);
