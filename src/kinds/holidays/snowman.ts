import { defineKind, el, fill, hsl, lin, type Point, pts, s } from "../../draw/core";
import { compact, curve, dots } from "./shared";

/** A snowman in a snowy yard: three snowballs, a hat and scarf, a carrot nose and stick arms. */
export const snowman = /* @__PURE__ */ defineKind(
  "snowman",
  "Snowman",
  { hat: ["top-hat", "beanie", "bowler"] },
  (g, w, h, note) => {
    const unit = Math.min(w, h);
    const time = g.pick(["day", "overcast", "evening"] as const);
    const hue = time === "evening" ? g.f(245, 275) : g.f(200, 222);
    const skyId = g.id("sky");
    const stops =
      time === "day"
        ? [hsl(hue, 55, 66), hsl(hue - 5, 50, 92)]
        : time === "overcast"
          ? [hsl(hue, 12, 70), hsl(hue, 15, 88)]
          : [hsl(hue, 32, 36), hsl(g.f(300, 330), 30, 62), hsl(g.f(20, 35), 60, 80)];
    const snow = (light: number) => hsl(hue, time === "evening" ? 25 : 30, light);
    let out = el("defs", {}, lin(skyId, stops));
    out += fill(w, h, `url(#${skyId})`);
    const groundY = h * g.f(0.58, 0.66);
    const far = curve(w, groundY - h * g.f(0.04, 0.1), groundY - h * g.f(0.04, 0.1), -h * g.f(0.02, 0.06));
    out += el("path", { d: far.d() + s`V${h}H0Z`, fill: snow(84) });
    const back = g.pick(["pines", "fence"] as const);
    const green = hsl(g.f(140, 170), 25, time === "evening" ? 26 : 32);
    if (back === "pines") {
      // Snowy pines along the far slope.
      let d = "";
      let caps = "";
      for (let x = g.f(0, 0.1) * w; x < w; x += unit * g.f(0.1, 0.2)) {
        const ht = unit * g.f(0.14, 0.22);
        const wd = ht * 0.32;
        const y = far.at(x) + ht * 0.05;
        d += s`M${x} ${y - ht}L${x + wd} ${y}H${x - wd}Z`;
        caps += s`M${x} ${y - ht}L${x + wd * 0.35} ${y - ht * 0.65}Q${x} ${y - ht * 0.58} ${x - wd * 0.35} ${y - ht * 0.65}Z`;
      }
      out += el("path", { d, fill: green });
      out += el("path", { d: caps, fill: snow(97) });
    }
    const near = curve(w, groundY + h * g.f(-0.03, 0.03), groundY + h * g.f(-0.03, 0.03), -h * g.f(0, 0.04));
    out += el("path", { d: near.d() + s`V${h}H0Z`, fill: snow(96) });
    if (back === "fence") {
      // A picket fence across the yard, snow on each picket.
      const wood = time === "evening" ? hsl(25, 20, 40) : hsl(g.f(20, 35), g.f(10, 30), g.f(45, 70));
      const ph = unit * g.f(0.1, 0.14);
      const pw = unit * 0.03;
      let d = "";
      let caps = "";
      const step = pw * 2.2;
      for (let x = g.f(0, step); x < w + pw; x += step) {
        const y = near.at(x) - unit * 0.02;
        d += s`M${x - pw / 2} ${y}v${-ph}l${pw / 2} ${-pw * 0.5}l${pw / 2} ${pw * 0.5}v${ph}Z`;
        caps += s`M${x - pw * 0.6} ${y - ph + pw * 0.1}l${pw * 0.6} ${-pw * 0.65}l${pw * 0.6} ${pw * 0.65}Z`;
      }
      let rails = "";
      for (const t of [0.3, 0.75]) {
        const y0 = near.at(0) - unit * 0.02 - ph * t;
        const y1 = near.at(w) - unit * 0.02 - ph * t;
        const ym = near.at(w / 2) - unit * 0.02 - ph * t;
        rails += s`M0 ${y0}Q${w / 2} ${2 * ym - (y0 + y1) / 2} ${w} ${y1}`;
      }
      out += el("path", { d: rails, stroke: wood, "stroke-width": pw * 0.6, fill: "none" });
      out += el("path", { d, fill: wood });
      out += el("path", { d: caps, fill: snow(98) });
      // Snow piled along the foot of the fence.
      out += el("path", {
        d: s`M0 ${near.at(0) - unit * 0.035}Q${w / 2} ${2 * near.at(w / 2) - (near.at(0) + near.at(w)) / 2 - unit * 0.035} ${w} ${near.at(w) - unit * 0.035}V${h}H0Z`,
        fill: snow(96),
      });
    }
    // The snowman: bottom, middle and head, each resting on the one below.
    const x = w * g.f(0.38, 0.62);
    const base = Math.min(h * g.f(0.86, 0.9), h - unit * 0.06);
    const r0 = Math.min((base - h * 0.06) / 4.75, unit * 0.2) * g.f(0.92, 1);
    const r1 = r0 * g.f(0.7, 0.76);
    const r2 = r0 * g.f(0.5, 0.56);
    const y0 = base - r0 * 0.95;
    const y1 = y0 - (r0 + r1) * 0.82;
    const y2 = y1 - (r1 + r2) * 0.84;
    const dir = g.pick([-1, 1]);
    // A soft shadow, and a few snow bumps around the yard.
    let bumps = "";
    for (let k = g.i(2, 4); k > 0; k--) {
      const bx = w * g.f(0, 1);
      if (Math.abs(bx - x) < r0 * 2) continue;
      const by = near.at(bx) + (h - near.at(bx)) * g.f(0.3, 0.8);
      const br = unit * g.f(0.04, 0.08);
      bumps += s`M${bx - br} ${by}a${br} ${br * 0.45} 0 0 1 ${br * 2} 0Z`;
    }
    if (bumps) out += el("path", { d: bumps, fill: snow(90) });
    out += el("ellipse", { cx: x + r0 * 0.2, cy: base, rx: r0 * 1.25, ry: r0 * 0.16, fill: "#000", opacity: "0.12" });
    // Stick arms, behind the middle snowball.
    const bark = hsl(g.f(15, 30), 35, 28);
    let arms = "";
    for (const side of [-1, 1]) {
      const sx = x + side * r1 * 0.7;
      const sy = y1 - r1 * 0.15;
      const ex = x + side * r1 * g.f(1.9, 2.2);
      const ey = y1 - r1 * g.f(0.4, 1.2);
      const mx = sx + (ex - sx) * 0.65;
      const my = sy + (ey - sy) * 0.65;
      arms += s`M${sx} ${sy}L${ex} ${ey}M${mx} ${my}l${side * r1 * 0.25} ${-r1 * 0.35}`;
      arms += s`M${ex} ${ey}l${side * r1 * 0.12} ${-r1 * 0.18}M${ex} ${ey}l${side * r1 * 0.2} ${r1 * 0.02}`;
    }
    out += el("path", {
      d: arms,
      stroke: bark,
      "stroke-width": unit * 0.012,
      "stroke-linecap": "round",
      fill: "none",
    });
    // Each ball in shade, then lit from the upper left.
    for (const [cy, r] of [
      [y0, r0],
      [y1, r1],
      [y2, r2],
    ]) {
      out += el("circle", { cx: x, cy, r, fill: snow(84) });
      out += el("circle", { cx: x - r * 0.1, cy: cy - r * 0.1, r: r * 0.9, fill: snow(98) });
    }
    // Coal buttons, eyes and smile, and a carrot nose.
    const coal = "#2d2b2e";
    const buttons: Point[] = [];
    for (let k = 0; k < 3; k++) buttons.push([x + dir * r1 * 0.05, y1 - r1 * 0.4 + k * r1 * 0.38]);
    if (g.chance(0.5)) buttons.push([x, y0 - r0 * 0.4]);
    out += dots(buttons, r1 * 0.08, coal);
    const eyes: Point[] = [
      [x - r2 * 0.32 + dir * r2 * 0.1, y2 - r2 * 0.2],
      [x + r2 * 0.32 + dir * r2 * 0.1, y2 - r2 * 0.2],
    ];
    out += dots(eyes, r2 * 0.1, coal);
    const smile: Point[] = [];
    for (let k = 0; k < 5; k++) {
      const a = Math.PI * (0.25 + (0.5 * k) / 4);
      smile.push([x + dir * r2 * 0.1 + Math.cos(a) * r2 * 0.45, y2 + Math.sin(a) * r2 * 0.5]);
    }
    out += dots(smile, r2 * 0.055, coal);
    out += el("polygon", {
      points: pts([
        [x + dir * r2 * 0.05, y2 - r2 * 0.06],
        [x + dir * r2 * g.f(0.75, 0.95), y2 + r2 * 0.1],
        [x + dir * r2 * 0.05, y2 + r2 * 0.14],
      ]),
      fill: hsl(g.f(20, 30), 90, 55),
    });
    // The scarf: a band at the neck and a tail hanging down one side.
    const scarfHue = g.f(0, 360);
    const scarf = hsl(scarfHue, g.f(55, 75), g.f(45, 55));
    const stripe = g.chance(0.5) ? hsl(scarfHue + g.pick([0, 40, 180]), 40, 88) : "";
    const ny = y2 + r2 * 0.88;
    const nw = r2 * 1.05;
    const nh = r2 * 0.3;
    const ts = -dir * g.pick([1, 1, -1]);
    const tx = x + ts * r2 * 0.5;
    const tl = r1 * g.f(0.8, 1.1);
    out += el("path", {
      d: s`M${tx - r2 * 0.18} ${ny}L${tx - r2 * 0.18 + ts * r2 * 0.12} ${ny + tl}h${r2 * 0.38}L${tx + r2 * 0.2} ${ny}Z`,
      fill: scarf,
    });
    out += el("path", {
      d: s`M${tx - r2 * 0.18 + ts * r2 * 0.12} ${ny + tl}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}m${r2 * 0.12} ${-r2 * 0.14}v${r2 * 0.14}`,
      stroke: scarf,
      "stroke-width": r2 * 0.05,
    });
    if (stripe)
      out += el("path", {
        d: s`M${tx - r2 * 0.16 + ts * r2 * 0.1} ${ny + tl * 0.78}h${r2 * 0.38}M${tx - r2 * 0.17 + ts * r2 * 0.07} ${ny + tl * 0.55}h${r2 * 0.38}`,
        stroke: stripe,
        "stroke-width": r2 * 0.08,
      });
    out += el("path", {
      d: s`M${x - nw} ${ny - nh / 2} Q ${x} ${ny + nh * 0.6} ${x + nw} ${ny - nh / 2}
           L ${x + nw * 0.95} ${ny + nh / 2} Q ${x} ${ny + nh * 1.6} ${x - nw * 0.95} ${ny + nh / 2}Z`,
      fill: scarf,
    });
    if (stripe)
      out += el("path", {
        d: s`M${x - nw * 0.97} ${ny} Q ${x} ${ny + nh * 1.1} ${x + nw * 0.97} ${ny}`,
        stroke: stripe,
        "stroke-width": r2 * 0.08,
        fill: "none",
      });
    // The hat.
    const hat = g.option("hat", g.pick(["top-hat", "top-hat", "beanie", "bowler"] as const));
    const hatHue = g.f(0, 360);
    const crown = y2 - r2 * 0.72;
    if (hat === "top-hat") {
      const felt = g.chance(0.6) ? "#2b2a30" : hsl(hatHue, 35, 30);
      out += el("rect", { x: x - r2 * 0.6, y: crown - r2 * 1.05, width: r2 * 1.2, height: r2 * 1.1, fill: felt });
      out += el("rect", {
        x: x - r2 * 0.6,
        y: crown - r2 * 0.32,
        width: r2 * 1.2,
        height: r2 * 0.22,
        fill: scarf,
      });
      out += el("rect", {
        x: x - r2 * 0.95,
        y: crown - r2 * 0.06,
        width: r2 * 1.9,
        height: r2 * 0.16,
        rx: r2 * 0.08,
        fill: felt,
      });
    } else if (hat === "bowler") {
      const felt = hsl(hatHue, 30, 28);
      out += el("path", {
        d: s`M${x - r2 * 0.6} ${crown}a${r2 * 0.6} ${r2 * 0.62} 0 0 1 ${r2 * 1.2} 0Z`,
        fill: felt,
      });
      out += el("rect", {
        x: x - r2 * 0.6,
        y: crown - r2 * 0.18,
        width: r2 * 1.2,
        height: r2 * 0.14,
        fill: scarf,
      });
      out += el("ellipse", { cx: x, cy: crown, rx: r2 * 0.88, ry: r2 * 0.1, fill: felt });
    } else {
      // A knit beanie with a cuff and a pompom.
      const knit = g.chance(0.5) ? scarf : hsl(hatHue, 55, 50);
      const by = y2 - r2 * 0.45;
      out += el("path", {
        d: s`M${x - r2 * 0.88} ${by}C${x - r2 * 0.9} ${by - r2 * 1.05} ${x + r2 * 0.9} ${by - r2 * 1.05} ${x + r2 * 0.88} ${by}Z`,
        fill: knit,
      });
      out += el("rect", {
        x: x - r2 * 0.94,
        y: by - r2 * 0.12,
        width: r2 * 1.88,
        height: r2 * 0.28,
        rx: r2 * 0.12,
        fill: stripe || hsl(hatHue + 30, 40, 85),
      });
      out += el("circle", { cx: x, cy: by - r2 * 0.8, r: r2 * 0.2, fill: stripe || hsl(hatHue + 30, 40, 88) });
    }
    // Falling snow.
    const flakes = time === "overcast" ? g.i(20, 30) : g.chance(0.45) ? g.i(12, 22) : 0;
    const fl: Point[] = [];
    for (let k = 0; k < flakes; k++) fl.push([w * g.f(0, 1), h * g.f(0, 1)]);
    out += dots(fl, unit * 0.007, "#fff", "0.85");
    const hats = { "top-hat": "a top hat", beanie: "a knit hat", bowler: "a bowler hat" };
    const when = time === "day" ? "on a clear day" : time === "overcast" ? "in falling snow" : "at dusk";
    note.alt(
      `A snowman in ${hats[hat]} and a scarf in a snowy yard${back === "fence" ? " by a picket fence" : " among pines"} ${flakes && time !== "overcast" ? "as snow falls" : when}`,
    );
    note.focus(x, y2);
    note.frame(x - r2 * 1.25, crown - r2 * 1.2, r2 * 2.5, y2 + r2 * 1.1 - (crown - r2 * 1.2));
    return compact(out);
  },
);
