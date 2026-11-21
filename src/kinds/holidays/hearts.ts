import { defineKind, el, hex, type Point, s } from "../../draw/core";
import { compact, place } from "./shared";

/** A heart 100 units across, centered on the origin. */
const HEART =
  "M0 44C-20 28 -50 8 -50 -16C-50 -34 -37 -44 -25 -44C-13 -44 -5 -36 0 -27C5 -36 13 -44 25 -44C37 -44 50 -34 50 -16C50 8 20 28 0 44Z";

type HeartStyle = "solid" | "outline" | "puffy" | "pattern" | "candy";

/** Hearts of many sizes and styles, solid, outlined, glossy, patterned and candy, scattered for Valentine's Day. */
export const hearts = /* @__PURE__ */ defineKind("hearts", "Hearts", (g, w, h, note) => {
  const unit = Math.min(w, h);
  // The background: blush, cream, a deep wine or a pale pastel.
  const mood = g.pick(["blush", "blush", "cream", "wine", "pastel"] as const);
  const back =
    mood === "blush"
      ? hex(g.f(345, 365), g.f(45, 70), g.f(89, 93))
      : mood === "cream"
        ? hex(g.f(30, 45), g.f(50, 70), g.f(91, 95))
        : mood === "wine"
          ? hex(g.f(335, 352), g.f(35, 50), g.f(17, 24))
          : hex(g.pick([g.f(150, 200), g.f(250, 290), g.f(40, 55)]), g.f(30, 45), g.f(90, 94));
  // A few colors that agree: reds, pinks and cream, or candy pastels.
  const pastel = mood === "pastel" || g.chance(0.2);
  const inks = pastel
    ? [340, 50, 150, 270, 20, 195].map(hue => hex(hue + g.f(-8, 8), g.f(60, 75), g.f(78, 85)))
    : [
        hex(g.f(348, 358), g.f(68, 78), g.f(44, 50)),
        hex(g.f(340, 350), g.f(60, 72), g.f(56, 62)),
        hex(g.f(335, 345), g.f(65, 80), g.f(72, 78)),
        hex(g.f(340, 355), g.f(70, 85), g.f(85, 90)),
        mood === "cream" ? hex(g.f(348, 356), g.f(55, 65), g.f(32, 38)) : hex(g.f(30, 42), g.f(60, 75), g.f(90, 94)),
      ];
  const candyInks = [340, 50, 150, 270, 20, 195].map(hue => hex(hue + g.f(-6, 6), g.f(65, 78), g.f(80, 86)));
  const defs: string[] = [];
  let out = el("rect", { width: w, height: h, fill: back });

  // Now and then a faint pattern on the background: dots or diagonal stripes.
  const backPattern = g.pick(["none", "none", "dots", "stripes"] as const);
  if (backPattern !== "none") {
    const id = g.id("bg");
    const q = unit * g.f(0.05, 0.08);
    const ink = mood === "wine" ? "#ffffff" : hex(g.f(340, 360), 60, 50);
    defs.push(
      el(
        "pattern",
        {
          id,
          width: q,
          height: q,
          patternUnits: "userSpaceOnUse",
          patternTransform: backPattern === "stripes" ? "rotate(45)" : undefined,
        },
        backPattern === "dots"
          ? el("path", {
              d: s`M${q / 4} ${q / 4}h0M${(q * 3) / 4} ${(q * 3) / 4}h0`,
              stroke: ink,
              "stroke-opacity": "0.1",
              "stroke-width": q * 0.16,
              "stroke-linecap": "round",
            })
          : el("rect", { width: q / 2, height: q, fill: ink, "fill-opacity": "0.06" }),
      ),
    );
    out += el("rect", { width: w, height: h, fill: `url(#${id})` });
  }

  const heartId = g.id("h");
  // One soft shadow for all the hearts, as if cut from paper and laid down.
  const shadowId = g.id("hs");
  defs.push(
    el("path", { id: heartId, d: HEART }),
    el(
      "filter",
      { id: shadowId, x: -0.1, y: -0.1, width: 1.2, height: 1.2 },
      el("feDropShadow", {
        dx: unit * 0.008,
        dy: unit * 0.011,
        stdDeviation: unit * 0.005,
        "flood-color": "#000000",
        "flood-opacity": mood === "wine" ? "0.35" : "0.14",
      }),
    ),
  );
  // Glossy hearts: soft shading over the fill and a highlight on the upper left.
  const puffyId = g.id("p");
  const shadeId = g.id("sh");
  // Candy hearts: a raised rim round a flat, paler face.
  const candyId = g.id("c");
  const made = new Set<string>();
  const need = (key: string) => {
    if (made.has(key)) return;
    made.add(key);
    if (key === "puffy")
      defs.push(
        el(
          "radialGradient",
          { id: shadeId, cx: 0.38, cy: 0.3, r: 0.8 },
          el("stop", { offset: 0, "stop-color": "#ffffff", "stop-opacity": "0.3" }),
          el("stop", { offset: 0.45, "stop-color": "#ffffff", "stop-opacity": "0" }),
          el("stop", { offset: 1, "stop-color": "#000000", "stop-opacity": "0.28" }),
        ),
        el(
          "g",
          { id: puffyId },
          el("use", { href: `#${heartId}` }),
          el("path", { d: HEART, fill: `url(#${shadeId})` }),
          el("path", {
            d: "M-38 -18C-40 -30 -32 -37 -24 -36C-30 -33 -34 -26 -34 -16ZM-14 -36h0",
            fill: "#fff",
            "fill-opacity": "0.7",
            stroke: "#fff",
            "stroke-opacity": "0.7",
            "stroke-width": 5,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
          }),
        ),
      );
    if (key === "candy")
      defs.push(
        el(
          "g",
          { id: candyId },
          el("use", { href: `#${heartId}` }),
          el("use", { href: `#${heartId}`, fill: "#000", "fill-opacity": "0.08" }),
          el("use", { href: `#${heartId}`, transform: "translate(-1 -3)scale(0.8)" }),
          el("use", {
            href: `#${heartId}`,
            transform: "translate(-1 -3)scale(0.8)",
            fill: "#fff",
            "fill-opacity": "0.25",
          }),
        ),
      );
  };
  // One or two patterned papers: stripes or dots in two of the colors.
  let firstDotty = false;
  const patterns = Array.from({ length: g.i(1, 2) }, (_, k) => {
    const id = g.id(`pt${k}`);
    const base = g.pick(inks);
    let accent = g.pick(inks);
    if (accent === base) accent = mood === "wine" || pastel ? "#ffffff" : inks[inks.length - 1];
    if (accent === base) accent = "#ffffff";
    const dotty = k ? !firstDotty : g.chance(0.5);
    firstDotty = dotty;
    const q = 16;
    defs.push(
      el(
        "pattern",
        {
          id,
          width: q,
          height: q,
          patternUnits: "userSpaceOnUse",
          patternTransform: dotty ? undefined : "rotate(-35)",
        },
        el("rect", { width: q, height: q, fill: base }),
        dotty
          ? el("path", {
              d: "M4 4h0M12 12h0",
              stroke: accent,
              "stroke-width": 5,
              "stroke-linecap": "round",
            })
          : el("rect", { width: q / 2, height: q, fill: accent }),
      ),
    );
    return `url(#${id})`;
  });

  // A string of little hearts sagging across the top, sometimes.
  const garland = g.chance(0.3);
  let top = 0;
  if (garland) {
    const y0 = h * 0.02 - unit * 0.02;
    const sag = unit * g.f(0.12, 0.18);
    const loops = Math.max(1, Math.round(w / (unit * 1.4)));
    const span = w / loops;
    let wire = "";
    // The little hearts alternate between two colors, each color in one group.
    const small = ["", ""];
    const step = Math.round(span / (unit * 0.15) / 2) * 2 + 1;
    for (let k = 0; k < loops; k++) {
      const a: Point = [k * span, y0];
      const c: Point = [(k + 0.5) * span, y0 + sag * 2];
      const b: Point = [(k + 1) * span, y0];
      wire += s`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
      for (let j = 1; j < step; j++) {
        const t = j / step;
        const x = (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0];
        const y = (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1];
        // Each hangs just under the string, turned a little with its slope.
        const slope = (Math.atan2(2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]), span) * 180) / Math.PI;
        small[(k * step + j) % 2] += el("use", {
          href: `#${heartId}`,
          transform: place(x, y + unit * 0.026, slope * 0.5, unit * 0.0006),
        });
      }
      top = Math.max(top, y0 + sag + unit * 0.06);
    }
    out += el("path", {
      d: wire,
      fill: "none",
      stroke: mood === "wine" ? "#ffffff" : "#000",
      "stroke-opacity": "0.3",
      "stroke-width": Math.max(1, unit * 0.005),
    });
    out += el("g", { fill: inks[0] }, small[0]) + el("g", { fill: inks[2] }, small[1]);
  }

  // The scattered hearts, biggest first so the small ones fill the gaps.
  const count = Math.round(((w * (h - top)) / (unit * unit)) ** 0.55 * g.f(13, 17));
  const sizes = Array.from({ length: count }, (_, k) => unit * (k < 2 ? g.f(0.26, 0.34) : g.f(0.09, 0.24))).sort(
    (a, b) => b - a,
  );
  const placed: [number, number, number][] = [];
  const styles: HeartStyle[] = [];
  let shown = "";
  for (const size of sizes) {
    const r = size * 0.5;
    let best: Point | undefined;
    let score = 0.95;
    for (let k = 0; k < 24; k++) {
      const x = g.f(r * 1.05, w - r * 1.05);
      const y = g.f(top + r * 1.05, h - r * 1.05);
      const room = Math.min(9, ...placed.map(([px, py, pr]) => Math.hypot(px - x, py - y) / (pr + r)));
      if (room > score) {
        score = room;
        best = [x, y];
      }
    }
    if (!best) continue;
    placed.push([best[0], best[1], r]);
    const roll = g.next();
    const style: HeartStyle =
      roll < (pastel ? 0.4 : 0.15)
        ? "candy"
        : roll < 0.5
          ? "solid"
          : roll < 0.68
            ? "outline"
            : roll < 0.84 && size > unit * 0.14
              ? "puffy"
              : size > unit * 0.12
                ? "pattern"
                : "solid";
    styles.push(style);
    const turn = g.f(-28, 28);
    const scale = size / 100;
    const at = place(best[0], best[1], turn, scale);
    const ink = g.pick(inks);
    if (style === "solid") shown += el("use", { href: `#${heartId}`, fill: ink, transform: at });
    else if (style === "outline")
      shown += el("use", {
        href: `#${heartId}`,
        fill: "none",
        stroke: ink,
        "stroke-width": g.pick([6, 8, 10]),
        transform: at,
      });
    else if (style === "puffy") {
      need("puffy");
      shown += el("use", { href: `#${puffyId}`, fill: inks[g.i(0, 1)], transform: at });
    } else if (style === "pattern") shown += el("use", { href: `#${heartId}`, fill: g.pick(patterns), transform: at });
    else {
      need("candy");
      shown += el("use", { href: `#${candyId}`, fill: g.pick(candyInks), transform: at });
    }
  }
  out = el("defs", {}, ...defs) + out + el("g", { filter: `url(#${shadowId})` }, shown);

  const candies = styles.filter(st => st === "candy").length;
  const subject = candies > 2 ? "Candy hearts among hearts of many sizes" : "Hearts of many sizes and styles";
  const where = garland
    ? "under a little garland of hearts"
    : backPattern !== "none"
      ? `scattered across a softly ${backPattern === "dots" ? "dotted" : "striped"} background`
      : `scattered across a ${mood === "wine" ? "deep" : "soft"} background`;
  note.alt(`${subject} ${where}`);
  note.focus(placed[0]?.[0] ?? w / 2, placed[0]?.[1] ?? h / 2);
  return compact(out);
});
