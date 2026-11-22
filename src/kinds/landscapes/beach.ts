import { defineKind, el, hsl, type Point, pts, s } from "../../draw/core";
import { AT, curve, daySky, palm, seaAndSky, TIMES } from "./shared";

/**
 * A sandy beach with a striped umbrella, a leaning palm, or shells at the water's edge.
 *
 * @category Landscapes
 */
export const beach = /* @__PURE__ */ defineKind(
  "beach",
  "Beach",
  { item: ["umbrella", "palm", "shells"] },
  (g, w, h, note) => {
    const time = g.pick(TIMES);
    const sky = daySky(g, time);
    const unit = Math.min(w, h);
    const horizon = h * g.f(0.4, 0.5);
    let out = seaAndSky(g, w, h, horizon, time, sky);
    // The waterline, the band of wet sand behind it, and the dry sand.
    const line = curve(w, h * g.f(0.6, 0.72), h * g.f(0.6, 0.72), h * g.f(-0.05, 0.05));
    const wet = unit * g.f(0.03, 0.05);
    const sandHue = g.f(32, 45);
    out += el("path", { d: line.d() + s`V${h}H0Z`, fill: hsl(sandHue, 38, 64 + sky.dim / 2) });
    out += el("path", {
      d: line.d(-unit * 0.035),
      fill: "none",
      stroke: "#fff",
      "stroke-width": unit * 0.006,
      opacity: "0.45",
    });
    out += el("path", { d: line.d(), fill: "none", stroke: "#fff", "stroke-width": unit * 0.012, opacity: "0.85" });
    out += el("path", { d: line.d(wet) + s`V${h}H0Z`, fill: hsl(sandHue, 62, 80 + sky.dim / 2) });
    // Where something on the dry sand can sit, from just past the wet band to near the bottom.
    const sandAt = (x: number, f: number) => {
      const top = line.at(x) + wet + unit * 0.04;
      return top + (h - unit * 0.05 - top) * f;
    };
    const item = g.option("item", g.pick(["umbrella", "palm", "shells"] as const));
    const shadow = time === "dawn" ? 1 : time === "dusk" ? -1 : g.pick([-1, 1]);
    if (item === "umbrella") {
      const bx = w * g.f(0.3, 0.7);
      const by = sandAt(bx, g.f(0.45, 0.7));
      const ht = unit * g.f(0.34, 0.44);
      const r = ht * g.f(0.55, 0.65);
      const rh = r * 0.48;
      const chord = by - ht + rh;
      const tilt = g.f(-12, 12);
      // The umbrella's shadow on the sand.
      out += el("ellipse", { cx: bx + shadow * r * 0.4, cy: by, rx: r, ry: r * 0.2, fill: "#000", opacity: "0.12" });
      // A towel beside it, lying flat.
      const side = g.pick([-1, 1]);
      const tl = r * 1.1;
      const td = r * 0.3;
      const skew = side * td * 0.5;
      const tx = Math.max(unit * 0.03, Math.min(w - tl - unit * 0.06, bx + side * r * g.f(0.7, 1) - tl / 2));
      const ty = by - td * 0.3;
      const corner = (u: number, v: number): Point => [tx + tl * u + skew * v, ty + td * v];
      const towel = g.f(0, 360);
      out += el("polygon", {
        points: pts([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]),
        fill: hsl(towel, 60, 58),
      });
      for (const u of [0.2, 0.7])
        out += el("polygon", {
          points: pts([corner(u, 0), corner(u + 0.1, 0), corner(u + 0.1, 1), corner(u, 1)]),
          fill: "#fff",
          opacity: "0.85",
        });
      // The pole and canopy, tilted together about the foot of the pole.
      const canopy = hsl(g.f(0, 360), 70, 55);
      const stripe = g.chance(0.6) ? "#fff" : hsl(g.f(0, 360), 75, 62);
      const bottom = (x: number): Point => [bx + x, chord + rh * 0.25 * (1 - (x / r) ** 2)];
      const apex: Point = [bx, by - ht];
      let stripes = "";
      const parts = g.pick([6, 8]);
      for (let k = 1; k < parts; k += 2)
        stripes += `M${pts([apex, bottom(-r + (2 * r * k) / parts), bottom(-r + (2 * r * (k + 1)) / parts)])}Z`;
      out += s`<g transform="rotate(${tilt} ${bx} ${by})">`;
      out += el("rect", { x: bx - unit * 0.006, y: by - ht, width: unit * 0.012, height: ht, fill: "#ece6da" });
      out += el("path", {
        d: s`M${bx - r} ${chord} A ${r} ${rh} 0 0 1 ${bx + r} ${chord} Q ${bx} ${chord + rh * 0.5} ${bx - r} ${chord}Z`,
        fill: canopy,
      });
      out += el("path", { d: stripes, fill: stripe });
      out += el("circle", { cx: bx, cy: by - ht, r: unit * 0.01, fill: "#ece6da" });
      out += "</g>";
      note.alt(`A striped beach umbrella and a towel on the sand ${AT[time]}`);
      note.focus(bx, by - ht * 0.6);
    } else if (item === "palm") {
      const left = g.chance(0.5);
      const x = w * (left ? g.f(0.1, 0.28) : g.f(0.72, 0.9));
      const y = sandAt(x, g.f(0.4, 0.7));
      const ht = Math.min(unit * g.f(0.5, 0.66), (y - unit * 0.14) / 1.05);
      const lean = (left ? 1 : -1) * g.f(0.15, 0.45);
      out += el("ellipse", {
        cx: x + lean * ht * 0.3,
        cy: y,
        rx: ht * 0.35,
        ry: ht * 0.06,
        fill: "#000",
        opacity: "0.1",
      });
      out += palm(g, x, y, ht, lean, hsl(g.f(25, 35), 35, 42 + sky.dim), hsl(g.f(95, 135), 50, 34 + sky.dim));
      // A coconut that has fallen onto the sand.
      out += el("circle", { cx: x - lean * ht * 0.2, cy: y - unit * 0.012, r: unit * 0.018, fill: hsl(30, 45, 28) });
      note.alt(`A palm tree leaning over a sandy beach ${AT[time]}`);
      note.focus(x + lean * ht * 0.45, y - ht);
    } else {
      // Shells and a starfish or two, larger nearer the viewer.
      const things = Array.from({ length: g.i(4, 7) }, (_, k) => {
        const x = w * ((k + g.f(0.15, 0.85)) / 7) * (7 / g.i(4, 7));
        return { x: Math.min(w * 0.92, Math.max(w * 0.08, x)), f: g.f(0, 1), star: k < 2 && g.chance(0.7) };
      });
      let stars = 0;
      let focus: Point = [w / 2, h * 0.8];
      for (const { x, f, star } of things.sort((a, b) => a.f - b.f)) {
        const y = sandAt(x, f);
        const r = unit * (0.045 + 0.04 * f);
        out += el("ellipse", { cx: x + r * 0.15, cy: y + r * 0.1, rx: r, ry: r * 0.35, fill: "#000", opacity: "0.1" });
        if (star) {
          stars++;
          focus = [x, y];
          const turn = g.f(0, Math.PI);
          const ring = Array.from({ length: 10 }, (_, j): Point => {
            const a = turn + (j * Math.PI) / 5;
            const rr = j % 2 ? r * 0.42 : r * 1.1;
            return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6];
          });
          out += el("polygon", { points: pts(ring), fill: hsl(g.f(5, 30), 75, 58), "stroke-linejoin": "round" });
        } else {
          // A scallop: a fan with ridges and a small hinge.
          const a0 = -Math.PI * 0.85;
          const a1 = -Math.PI * 0.15;
          const fan = (a: number): Point => [x + Math.cos(a) * r, y - r * 0.1 + Math.sin(a) * r * 0.8];
          const [sx, sy] = fan(a0);
          const [ex, ey] = fan(a1);
          out += el("path", {
            d: s`M${x} ${y} L${sx} ${sy} A ${r} ${r * 0.8} 0 0 1 ${ex} ${ey}Z`,
            fill: hsl(g.f(0, 40), 60, 86),
          });
          let ridges = "";
          for (let j = 1; j < 5; j++) {
            const [rx, ry] = fan(a0 + ((a1 - a0) * j) / 5);
            ridges += s`M${x} ${y}L${rx} ${ry}`;
          }
          out += el("path", { d: ridges, stroke: "#000", opacity: "0.15", "stroke-width": unit * 0.004 });
          out += el("rect", {
            x: x - r * 0.18,
            y: y - r * 0.08,
            width: r * 0.36,
            height: r * 0.16,
            rx: r * 0.05,
            fill: hsl(20, 40, 75),
          });
        }
      }
      note.alt(
        `Seashells${stars ? (stars > 1 ? " and starfish" : " and a starfish") : ""} on a sandy beach ${AT[time]}`,
      );
      note.focus(...focus);
    }
    return out;
  },
);
