import { defineKind, el, facing, fill, hsl, lin, type Point, qpt, s } from "../../draw/core";
import { paint, person } from "./shared";

const PLACES = ["beach", "park", "hill"] as const;

/** A small figure walking through a landscape, seen from the side, sometimes with a dog. */
export const walker = /* @__PURE__ */ defineKind(
  "walker",
  "Out for a walk",
  { place: PLACES, dog: [true, false] },
  (g, w, h, note) => {
    const p = person(g.fork("person"));
    const unit = Math.min(w, h);
    const place = g.option("place", g.pick(PLACES));
    const withDog = g.option("dog", g.chance(0.45));
    const fig = unit * g.f(0.37, 0.42);
    const dir = g.chance(0.5) ? 1 : -1;
    const anchor = w * g.f(0.38, 0.62);
    const x = anchor - (withDog ? dir * fig * 0.25 : 0);
    const skyHue = g.f(190, 215);
    const sky = g.id("sky");
    let out = el("defs", {}, lin(sky, [hsl(skyHue, 55, 74), hsl(skyHue + 25, 60, 92)]));
    out += fill(w, h, `url(#${sky})`);
    // The sun, away from the walker.
    out += el("circle", {
      cx: anchor > w / 2 ? w * g.f(0.1, 0.3) : w * g.f(0.7, 0.9),
      cy: h * g.f(0.15, 0.3),
      r: unit * g.f(0.06, 0.09),
      fill: hsl(g.f(40, 55), 90, 88),
    });
    let fy: number;
    if (place === "beach") {
      // Sea to the horizon, a line of surf, then sand.
      const horizon = h * g.f(0.5, 0.58);
      const shore = h * g.f(0.66, 0.72);
      out += el("rect", { y: horizon, width: w, height: h, fill: hsl(skyHue - 5, 50, 52) });
      let wave = s`M 0 ${shore}`;
      const waves = Math.max(3, Math.round(w / (unit * 0.3)));
      for (let k = 0; k < waves; k++) wave += s` q ${w / waves / 2} ${-unit * 0.025} ${w / waves} 0`;
      out += el("path", { d: wave + s` V ${h} H 0 Z`, fill: hsl(skyHue - 10, 35, 88) });
      out += el("path", {
        d: wave + s` V ${h} H 0 Z`,
        fill: hsl(g.f(35, 45), 50, 80),
        transform: s`translate(0 ${unit * 0.03})`,
      });
      fy = h * 0.86;
    } else if (place === "park") {
      // A line of round trees behind the grass, and a path across it.
      const edge = h * g.f(0.6, 0.66);
      const leaf = hsl(g.f(95, 130), 32, 42);
      const trees = Math.max(2, Math.round(w / unit) + 1);
      for (let k = 0; k < trees; k++) {
        const tx = (w * (k + g.f(0.2, 0.8))) / trees;
        const tr = unit * g.f(0.08, 0.12);
        out += el("rect", {
          x: tx - tr * 0.12,
          y: edge - tr * 1.6,
          width: tr * 0.24,
          height: tr * 1.7,
          fill: "#6d5444",
        });
        out += el("circle", { cx: tx, cy: edge - tr * 1.7, r: tr, fill: leaf });
      }
      out += el("rect", { y: edge, width: w, height: h, fill: hsl(g.f(85, 115), 38, 58) });
      out += el("rect", { y: h * 0.8, width: w, height: h * 0.1, fill: hsl(35, 30, 80) });
      fy = h * 0.86;
    } else {
      // Far hills, then a near hill with a footpath along it.
      out += el("path", {
        d: s`M 0 ${h * g.f(0.5, 0.6)} C ${w * 0.3} ${h * g.f(0.38, 0.48)} ${w * 0.6} ${h * g.f(0.56, 0.66)} ${w} ${h * g.f(0.46, 0.56)} V ${h} H 0 Z`,
        fill: hsl(g.f(100, 140), 25, 66),
      });
      fy = 0;
    }
    if (place === "hill") {
      const y0 = h * g.f(0.78, 0.86);
      const y1 = h * g.f(0.7, 0.8);
      const y2 = h * g.f(0.78, 0.86);
      const grass = hsl(g.f(85, 115), 38, 52);
      out += el("path", { d: s`M 0 ${y0} Q ${w / 2} ${y1} ${w} ${y2} V ${h} H 0 Z`, fill: grass });
      out += el("path", {
        d: s`M 0 ${y0 + fig * 0.08} Q ${w / 2} ${y1 + fig * 0.08} ${w} ${y2 + fig * 0.08}`,
        fill: "none",
        stroke: hsl(35, 30, 76),
        "stroke-width": fig * 0.1,
      });
      // With the control point at the middle, x runs evenly along the curve.
      fy = qpt([0, y0], [w / 2, y1], [w, y2], x / w)[1] + fig * 0.1;
    }

    // The walker, drawn facing right and mirrored to face left.
    const skin = p.skin;
    const r = fig * 0.09;
    const hx = x + fig * 0.02;
    const hy = fy - fig + r;
    const shoulderY = hy + r * 1.5;
    const hipY = fy - fig * 0.46;
    const tw = fig * 0.17;
    const shorts = place === "beach" || g.chance(0.2);
    const pants = hsl(g.f(190, 240), g.f(15, 35), g.f(28, 45));
    const limb = (pts: Point[], color: string, width: number) =>
      el("path", {
        d: "M " + pts.map(pt => s`${pt[0]} ${pt[1]}`).join(" L "),
        fill: "none",
        stroke: color,
        "stroke-width": width,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
    const leg = (knee: Point, foot: Point, darker: number) => {
      let legs = "";
      if (shorts) {
        legs += limb([knee, foot], p.shade, fig * 0.065);
        legs += limb(
          [
            [x, hipY],
            [(x + knee[0]) / 2 + (knee[0] - x) * 0.2, (hipY + knee[1]) / 2 + (knee[1] - hipY) * 0.2],
          ],
          pants,
          fig * 0.09,
        );
      } else legs += limb([[x, hipY], knee, foot], pants, fig * 0.08);
      legs += el("ellipse", {
        cx: foot[0] + fig * 0.03,
        cy: fy - fig * 0.022,
        rx: fig * 0.05,
        ry: fig * 0.024,
        fill: "#3a3a42",
      });
      return darker ? el("g", { opacity: "0.85" }, legs) : legs;
    };
    const sleeve = paint(p.top, -8);
    let body = facing(x, dir);
    // Shadow on the ground.
    body += el("ellipse", { cx: x, cy: fy, rx: fig * 0.2, ry: fig * 0.025, fill: "#000", opacity: "0.12" });
    // The far leg steps back, the near leg forward; the arms swing the other way.
    body += leg([x - fig * 0.05, hipY + fig * 0.24], [x - fig * 0.15, fy - fig * 0.03], 1);
    body += leg([x + fig * 0.09, hipY + fig * 0.22], [x + fig * 0.15, fy - fig * 0.03], 0);
    const farHand: Point = [x + fig * 0.14, shoulderY + fig * 0.25];
    body += limb(
      [[x, shoulderY + r * 0.3], [x + fig * 0.07, shoulderY + fig * 0.15], farHand],
      paint(p.top, -14),
      fig * 0.06,
    );
    body += el("circle", { cx: farHand[0], cy: farHand[1], r: fig * 0.034, fill: p.shade });
    // A backpack on the hill path.
    if (place === "hill" && g.chance(0.6))
      body += el("rect", {
        x: x - tw * 0.5 - fig * 0.09,
        y: shoulderY + fig * 0.02,
        width: fig * 0.13,
        height: fig * 0.22,
        rx: fig * 0.04,
        fill: hsl(g.f(0, 360), 40, 42),
      });
    // Neck and torso, leaning a little into the stride.
    body += el("rect", { x: hx - r * 0.35, y: hy + r * 0.5, width: r * 0.6, height: r * 1.2, fill: p.shade });
    body += el("path", {
      d: s`M ${x - tw / 2 + fig * 0.015} ${shoulderY + tw * 0.25}
       Q ${x - tw / 2 + fig * 0.015} ${shoulderY} ${x + fig * 0.015} ${shoulderY}
       Q ${x + tw / 2 + fig * 0.015} ${shoulderY} ${x + tw / 2 + fig * 0.015} ${shoulderY + tw * 0.25}
       L ${x + tw / 2} ${hipY + tw * 0.1} H ${x - tw / 2} Z`,
      fill: paint(p.top),
    });
    // The head in profile.
    if (p.style === "long")
      body += el("path", {
        d: s`M ${hx - r * 0.9} ${hy - r * 0.3} Q ${hx - r * 1.25} ${hy + r * 1.3} ${hx - r * 0.75} ${hy + r * 1.9}
         L ${hx - r * 0.1} ${hy + r * 1.7} L ${hx - r * 0.2} ${hy} Z`,
        fill: p.hair,
      });
    if (p.style === "bun") body += el("circle", { cx: hx - r * 0.8, cy: hy - r * 0.75, r: r * 0.42, fill: p.hair });
    if (p.style === "scarf") {
      body += el("path", {
        d: s`M ${hx + r * 0.8} ${hy - r * 0.5} Q ${hx + r * 0.3} ${hy - r * 1.3} ${hx - r * 0.5} ${hy - r * 1.05}
         Q ${hx - r * 1.3} ${hy - r * 0.6} ${hx - r * 1.1} ${hy + r * 0.6} Q ${hx - r * 1.1} ${hy + r * 1.5} ${hx - r * 0.3} ${hy + r * 1.9}
         Q ${hx + r * 0.5} ${hy + r * 1.8} ${hx + r * 0.6} ${hy + r * 1.1} Z`,
        fill: paint(p.scarf),
      });
      body += el("ellipse", { cx: hx + r * 0.35, cy: hy + r * 0.12, rx: r * 0.58, ry: r * 0.78, fill: skin });
    } else body += el("circle", { cx: hx, cy: hy, r, fill: skin });
    // The nose.
    body += el("path", {
      d: s`M ${hx + r * 0.88} ${hy - r * 0.1} Q ${hx + r * 1.2} ${hy + r * 0.2} ${hx + r * 0.86} ${hy + r * 0.3} Z`,
      fill: skin,
    });
    if (p.style !== "bald" && p.style !== "scarf") {
      // Hair: a cap over the top and back of the head.
      body += el("path", {
        d: s`M ${hx + r * 0.8} ${hy - r * 0.55}
         Q ${hx + r * 0.3} ${hy - r * 1.35} ${hx - r * 0.5} ${hy - r * 0.95}
         Q ${hx - r * 1.2} ${hy - r * 0.45} ${hx - r * 0.95} ${hy + r * 0.4}
         Q ${hx - r * 0.7} ${hy + r * 0.75} ${hx - r * 0.35} ${hy + r * 0.55}
         Q ${hx - r * 0.5} ${hy - r * 0.1} ${hx} ${hy - r * 0.35}
         Q ${hx + r * 0.45} ${hy - r * 0.45} ${hx + r * 0.8} ${hy - r * 0.55} Z`,
        fill: p.hair,
      });
      if (p.style === "curly")
        for (let k = 0; k < 5; k++) {
          const angle = Math.PI * (0.85 + k * 0.17);
          body += el("circle", {
            cx: hx + Math.cos(angle) * r * 0.85,
            cy: hy - r * 0.1 - Math.abs(Math.sin(angle)) * r * 0.75,
            r: r * p.curls[k],
            fill: p.hair,
          });
        }
    }
    if (p.beard === "full")
      body += el("path", {
        d: s`M ${hx - r * 0.25} ${hy + r * 0.2} Q ${hx - r * 0.1} ${hy + r * 1.05} ${hx + r * 0.6} ${hy + r * 0.95}
         Q ${hx + r * 0.9} ${hy + r * 0.8} ${hx + r * 0.85} ${hy + r * 0.6} Q ${hx + r * 0.35} ${hy + r * 0.75} ${hx + r * 0.1} ${hy + r * 0.2} Z`,
        fill: p.hair,
      });
    if (p.style !== "scarf")
      body += el("ellipse", { cx: hx - r * 0.12, cy: hy + r * 0.08, rx: r * 0.15, ry: r * 0.22, fill: p.shade });
    // Eye and smile.
    body += el("circle", { cx: hx + r * 0.52, cy: hy - r * 0.02, r: r * 0.11, fill: "#2a2320" });
    body += el("path", {
      d: s`M ${hx + r * 0.45} ${hy + r * 0.45} Q ${hx + r * 0.65} ${hy + r * 0.62} ${hx + r * 0.82} ${hy + r * 0.45}`,
      fill: "none",
      stroke: "#7a3b33",
      "stroke-width": r * 0.1,
      "stroke-linecap": "round",
    });
    if (p.glasses)
      body += el("path", {
        d: s`M ${hx - r * 0.1} ${hy - r * 0.05} H ${hx + r * 0.32} M ${hx + r * 0.52} ${hy - r * 0.02} m ${-r * 0.2} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 ${r * 0.4} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 ${-r * 0.4} 0`,
        fill: "none",
        stroke: "#222",
        "stroke-width": r * 0.08,
      });
    // The near arm swings back.
    const nearHand: Point = [x - fig * 0.11, shoulderY + fig * 0.26];
    body += limb([[x, shoulderY + r * 0.3], [x - fig * 0.05, shoulderY + fig * 0.15], nearHand], sleeve, fig * 0.065);
    body += el("circle", { cx: nearHand[0], cy: nearHand[1], r: fig * 0.036, fill: skin });

    if (withDog) {
      // A dog trotting ahead on a lead.
      const d = fig * 0.32;
      const dx = x + fig * 0.55;
      const coat = g.pick(["#c8894b", "#3b2f2a", "#e9dcc4", "#8a6a4f", "#d9b27c"]);
      const dark = g.pick(["#5a3d27", "#2a211d", "#8a6a4f"]);
      const leash: Point = [dx + d * 0.42, fy - d * 0.84];
      body += limb(
        [
          [dx - d * 0.25, fy - d * 0.6],
          [dx - d * 0.38, fy - d * 0.06],
        ],
        dark,
        d * 0.11,
      );
      body += limb(
        [
          [dx + d * 0.3, fy - d * 0.6],
          [dx + d * 0.22, fy - d * 0.06],
        ],
        dark,
        d * 0.11,
      );
      body += el("path", {
        d: s`M ${dx - d * 0.45} ${fy - d * 0.72} Q ${dx - d * 0.72} ${fy - d * 0.82} ${dx - d * 0.7} ${fy - d * 1.1}`,
        fill: "none",
        stroke: coat,
        "stroke-width": d * 0.09,
        "stroke-linecap": "round",
      });
      body += limb(
        [
          [dx - d * 0.3, fy - d * 0.6],
          [dx - d * 0.2, fy - d * 0.06],
        ],
        coat,
        d * 0.11,
      );
      body += limb(
        [
          [dx + d * 0.25, fy - d * 0.6],
          [dx + d * 0.38, fy - d * 0.06],
        ],
        coat,
        d * 0.11,
      );
      body += el("ellipse", { cx: dx, cy: fy - d * 0.66, rx: d * 0.52, ry: d * 0.22, fill: coat });
      body += el("circle", { cx: dx + d * 0.52, cy: fy - d * 0.95, r: d * 0.2, fill: coat });
      body += el("ellipse", { cx: dx + d * 0.72, cy: fy - d * 0.88, rx: d * 0.15, ry: d * 0.1, fill: coat });
      body += el("circle", { cx: dx + d * 0.86, cy: fy - d * 0.9, r: d * 0.04, fill: "#2a2320" });
      body += el("circle", { cx: dx + d * 0.6, cy: fy - d * 1.0, r: d * 0.035, fill: "#2a2320" });
      body += el("ellipse", {
        cx: dx + d * 0.42,
        cy: fy - d * 0.92,
        rx: d * 0.08,
        ry: d * 0.16,
        fill: dark,
        transform: s`rotate(15 ${dx + d * 0.42} ${fy - d * 0.92})`,
      });
      body += el("path", {
        d: s`M ${farHand[0]} ${farHand[1]} Q ${(farHand[0] + leash[0]) / 2} ${Math.max(farHand[1], leash[1]) + fig * 0.08} ${leash[0]} ${leash[1]}`,
        fill: "none",
        stroke: "#3b332e",
        "stroke-width": fig * 0.012,
      });
    }
    out += body + "</g>";

    const where = { beach: "along a beach", park: "through a park", hill: "along a hill path" };
    note.alt(`A person walking ${withDog ? "a dog " : ""}${where[place]}`);
    note.focus(x + dir * (withDog ? fig * 0.25 : 0), fy - fig * 0.6);
    return out;
  },
);
