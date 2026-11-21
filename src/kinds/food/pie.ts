import { defineKind, el, hsl, mix, type Point, pts, s } from "../../draw/core";
import { table } from "../../draw/shapes";
import { andList } from "../../draw/words";
import { forkOutline, sidePlate } from "./shared";

/** A dollop of whipped cream with a curled tip, `d` across at its widest, sitting on (x, y). */
function whip(x: number, y: number, d: number): string {
  return (
    el("ellipse", { cx: x, cy: y, rx: d * 1.15, ry: d * 0.5, fill: "#efe7d6" }) +
    el("ellipse", { cx: x, cy: y - d * 0.35, rx: d, ry: d * 0.55, fill: "#fdfaf2" }) +
    el("ellipse", { cx: x, cy: y - d * 0.85, rx: d * 0.65, ry: d * 0.4, fill: "#fdfaf2" }) +
    el("path", {
      d: s`M ${x - d * 0.35} ${y - d * 1.1} Q ${x} ${y - d * 1.7} ${x + d * 0.15} ${y - d * 1.15} Z`,
      fill: "#fdfaf2",
    }) +
    el("path", {
      d: s`M ${x - d * 0.7} ${y - d * 0.4} Q ${x} ${y - d * 0.1} ${x + d * 0.6} ${y - d * 0.55}`,
      stroke: "#e6dcc8",
      "stroke-width": d * 0.12,
      fill: "none",
    })
  );
}

type PieFlavor = {
  /** What the alt text calls it. */
  name: string;
  filling: string;
  /** Pastry or graham crust. */
  crust: string[];
  /** Lattice top, meringue, whipped cream, or a plain baked top. */
  top: "lattice" | "meringue" | "cream" | "plain";
  /** What shows in the cut filling. */
  bits?: "cherry" | "blueberry" | "apple" | "banana";
};

const PASTRY = ["#e3b06a", "#d9a15b", "#e7bd7a"];

const GRAHAM = ["#c58f55", "#b97f45", "#cf9a60"];

const PIES: PieFlavor[] = [
  { name: "lattice-topped cherry", filling: "#b3202f", crust: PASTRY, top: "lattice", bits: "cherry" },
  { name: "lattice-topped blueberry", filling: "#4a3f7a", crust: PASTRY, top: "lattice", bits: "blueberry" },
  { name: "lattice-topped apple", filling: "#c7862f", crust: PASTRY, top: "lattice", bits: "apple" },
  { name: "pumpkin", filling: "#d9822b", crust: PASTRY, top: "plain" },
  { name: "lemon meringue", filling: "#f4d03f", crust: PASTRY, top: "meringue" },
  { name: "key lime", filling: "#dfe8a6", crust: GRAHAM, top: "plain" },
  { name: "banana cream", filling: "#f3e2a0", crust: GRAHAM, top: "cream", bits: "banana" },
  { name: "coconut cream", filling: "#f5efdf", crust: GRAHAM, top: "cream" },
];

/** A slice of pie on a plate, cut open to show its filling, sometimes with cream or a fork. */
export const pie = /* @__PURE__ */ defineKind("pie", "Slice of pie", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const flavor = g.pick(PIES);
  const crust = g.pick(flavor.crust);
  const wall = hsl(g.f(0, 360), 30, 86);
  const wood = hsl(g.f(20, 40), 35, 62);
  const fork = g.chance(0.4);
  const dollop = flavor.top !== "meringue" && flavor.top !== "cream" && g.chance(0.5);
  // The slice is a wedge on the plate's surface: its tip at T, its crust along an arc of radius R
  // facing `axis` (negative is away from us). Everything is laid out in units of R first, then sized.
  // Points on the plate are (x, z), z toward us, lifted by y; the plate is tipped by `sq`.
  const sq = g.f(0.36, 0.42);
  const tall = Math.sqrt(1 - sq * sq);
  const flip = g.chance(0.5) ? -1 : 1;
  const span = g.f(0.85, 1.02);
  const axis = g.f(-0.75, -0.25);
  const a1 = axis - span / 2;
  const a2 = axis + span / 2;
  const H = g.f(0.26, 0.32);
  const hc = H * 0.15;
  const cw = 0.09;
  const rimH = flavor.top === "lattice" || flavor.top === "plain" ? H * 0.12 : 0;
  const T = flavor.top === "meringue" ? H * g.f(0.7, 0.9) : flavor.top === "cream" ? H * g.f(0.45, 0.6) : 0;
  const Rt = 1 - cw * 0.5;
  const steps = 14;
  const angles: number[] = [];
  for (let k = 0; k <= steps; k++) angles.push(a1 + (span * k) / steps);
  // Center the wedge's footprint on the plate, toward the back when a fork lies in front
  const foot: Point[] = [[0, 0], ...angles.map((a): Point => [Math.cos(a), Math.sin(a)])];
  const xs = foot.map(p => p[0]);
  const zs = foot.map(p => p[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const mz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const rho = Math.max(...foot.map(([x, z]) => Math.hypot(x - mx, z - mz)));
  const plate1 = rho * (fork ? 1.55 : 1.22);
  const tx1 = -mx + g.f(-0.04, 0.04);
  const tz1 = -mz - (fork ? plate1 * 0.27 : 0);
  // How far the slice reaches up, and the plate down, in units of R
  const peak = flavor.top === "meringue" ? H * 0.35 : flavor.top === "cream" ? H * 0.3 : dollop ? H * 0.45 : 0;
  const reach = Math.min(...zs.map(z => (z + tz1) * sq - (H + Math.max(rimH, T) + peak) * tall));
  const low = plate1 * sq * 1.12;
  const R = Math.min((unit * 0.45) / plate1, (h * 0.84) / (low - reach), (w * 0.9) / (2 * plate1));
  const cx = w / 2;
  const plateY = h * 0.52 - ((low + reach) / 2) * R;
  const Rp = plate1 * R;
  const tx = tx1 * R;
  const tz = tz1 * R;
  const P = (x: number, z: number, y: number): Point => [cx + flip * x, plateY + z * sq - y * tall];
  // A point on the wedge: r and y in units of R, at angle a
  const at = (r: number, a: number, y: number): Point => P(tx + r * R * Math.cos(a), tz + r * R * Math.sin(a), y * R);
  const arcAt = (r: number, y: number, from = a1, to = a2): Point[] => {
    const out: Point[] = [];
    for (let k = 0; k <= steps; k++) out.push(at(r, from + ((to - from) * k) / steps, y));
    return out;
  };
  const top = Math.max(0, plateY - Rp * sq - unit * g.f(0.04, 0.1));
  let out = table(g, w, h, Math.max(h * 0.18, top), wall, wood);
  out += sidePlate(cx, plateY, Rp, Rp * sq);
  // A soft shadow under the slice
  out += el("polygon", {
    points: pts([at(0, axis, 0), ...arcAt(1.03, 0)].map(([x, y]): Point => [x, y + R * 0.03])),
    fill: "#000",
    opacity: "0.1",
  });
  const dark = (c: string, t: number) => mix(c, "#000000", t);
  const light = (c: string, t: number) => mix(c, "#ffffff", t);
  // The crust's outer wall, where it turns toward us
  if (a2 > 0) {
    const from = Math.max(a1, 0);
    out += el("polygon", {
      points: pts([...arcAt(1, 0, from, a2), ...arcAt(1, H + rimH, from, a2).reverse()]),
      fill: dark(crust, 0.12),
    });
    if (T)
      out += el("polygon", {
        points: pts([...arcAt(Rt, H, from, a2), ...arcAt(Rt, H + T, from, a2).reverse()]),
        fill: flavor.top === "meringue" ? "#f6ecd6" : "#f3ede0",
      });
  }
  // The cut faces that turn toward us, each a profile of (r, y) on the plane at angle a
  const bits = g.fork("bits");
  for (const [a, shown] of [
    [a1, Math.cos(a1) < 0],
    [a2, Math.cos(a2) > 0],
  ] as const) {
    if (!shown) continue;
    const face = (profile: [number, number][]) => pts(profile.map(([r, y]) => at(r, a, y)));
    const lit = a === a2 ? 0 : 0.1;
    out += el("polygon", {
      points: face([
        [0.03, 0],
        [1, 0],
        [1, H + rimH * 0.6],
        [1 - cw * 0.5, H + rimH],
        [1 - cw, H + rimH * 0.5],
        [1 - cw, hc],
        [0.03, hc * 0.6],
      ]),
      fill: dark(crust, lit),
    });
    out += el("polygon", {
      points: face([
        [0.03, hc * 0.6],
        [1 - cw, hc],
        [1 - cw, H],
        [0.03, H],
      ]),
      fill: dark(flavor.filling, 0.08 + lit),
    });
    if (flavor.bits && Math.abs(Math.cos(a)) > 0.5) {
      // Fruit cut through, spread over the face
      const cols = 7;
      for (let k = 0; k < cols * 2; k++) {
        const r = 0.12 + ((1 - cw - 0.18) * (Math.floor(k / 2) + bits.f(0.25, 0.75))) / cols;
        const y = hc + (H - hc) * ((k % 2) * 0.45 + bits.f(0.25, 0.4));
        const [px, py] = at(r, a, y);
        const size = R * H * 0.16;
        if (flavor.bits === "apple")
          out += el("rect", {
            x: px - size * 1.2,
            y: py - size * 0.5,
            width: size * 2.4,
            height: size,
            rx: size * 0.4,
            fill: "#f6e2a3",
            transform: s`rotate(${bits.f(-25, 25)} ${px} ${py})`,
          });
        else if (flavor.bits === "banana") {
          out += el("circle", { cx: px, cy: py, r: size * 0.8, fill: "#f8f0cc" });
        } else
          out += el("circle", {
            cx: px,
            cy: py,
            r: size * (flavor.bits === "cherry" ? 1 : 0.7),
            fill: flavor.bits === "cherry" ? "#7d0f1f" : "#2b2d5e",
          });
      }
    }
    if (T)
      out += el("polygon", {
        points: face([
          [0.03, H],
          [Rt, H],
          [Rt, H + T],
          [0.03, H + T],
        ]),
        fill: dark(flavor.top === "meringue" ? "#fbf3df" : "#fbf6ea", 0.04 + lit),
      });
  }
  // The top of the filling, with whatever covers it
  const tg = g.fork("top");
  if (T) {
    const surface = flavor.top === "meringue" ? "#f8eacb" : "#fbf6ea";
    out += el("polygon", { points: pts([at(0.03, axis, H + T), ...arcAt(Rt, H + T)]), fill: surface });
    const clip = g.id("pietop");
    out += el(
      "defs",
      {},
      el("clipPath", { id: clip }, el("polygon", { points: pts([at(0.03, axis, H + T), ...arcAt(Rt, H + T)]) })),
    );
    if (flavor.top === "cream" && !flavor.bits) {
      // Toasted coconut flakes
      let d = "";
      for (let k = 0; k < 22; k++) {
        const [px, py] = at(0.2 + tg.f(0, 0.75), a1 + span * tg.f(0.1, 0.9), H + T);
        const dx = R * tg.f(-0.03, 0.03);
        d += s`M${px - dx} ${py - R * 0.008}L${px + dx} ${py + R * 0.008}`;
      }
      out += el("path", {
        d,
        stroke: "#d9a15b",
        "stroke-width": R * 0.018,
        "stroke-linecap": "round",
        "clip-path": `url(#${clip})`,
      });
    }
    if (flavor.bits === "banana")
      // Two slices of banana on the cream
      for (const r of [0.25, 0.62]) {
        const [px, py] = at(r, axis + span * tg.f(-0.15, 0.15), H + T);
        out += el("ellipse", { cx: px, cy: py - R * 0.01, rx: R * 0.055, ry: R * 0.055 * sq * 1.6, fill: "#f8f0cc" });
        out += el("ellipse", { cx: px, cy: py - R * 0.01, rx: R * 0.03, ry: R * 0.03 * sq * 1.6, fill: "#efe0a2" });
      }
    // Peaks of meringue, or rosettes of cream along the crust, from the back forward
    const spots: [Point, number][] = [];
    if (flavor.top === "meringue")
      for (let k = 0; k < 9; k++) {
        const r = 0.25 + 0.6 * Math.sqrt((k + tg.f(0.2, 0.8)) / 9);
        const a = axis + span * (((k * 0.618 + tg.f(0, 0.2)) % 1) - 0.5) * 0.75 * Math.min(1, r / 0.45);
        spots.push([at(r, a, H + T), r]);
      }
    else {
      const m = tg.i(3, 4);
      for (let k = 0; k < m; k++) spots.push([at(0.8, a1 + (span * (k + 0.5)) / m, H + T), 0.8]);
      if (flavor.bits) spots.push([at(0.42, axis, H + T), 0.42]);
    }
    spots.sort((p, q) => p[0][1] - q[0][1]);
    for (const [[px, py], r] of spots) {
      const pw = R * (flavor.top === "meringue" ? 0.07 : 0.08) * (0.7 + r * 0.4);
      const ph = R * peak * tg.f(0.8, 1.1);
      if (flavor.top === "meringue") {
        // A peak of meringue
        out += el("path", {
          d: s`M ${px - pw} ${py} Q ${px - pw * 0.7} ${py - ph * 0.6} ${px} ${py - ph}
               Q ${px + pw * 0.7} ${py - ph * 0.6} ${px + pw} ${py} Q ${px} ${py + pw * 0.5} ${px - pw} ${py} Z`,
          fill: "#fbf3df",
        });
        // The toasted tip
        out += el("path", {
          d: s`M ${px - pw * 0.35} ${py - ph * 0.62} Q ${px} ${py - ph * 1.08} ${px + pw * 0.35} ${py - ph * 0.62}
               Q ${px} ${py - ph * 0.5} ${px - pw * 0.35} ${py - ph * 0.62} Z`,
          fill: "#c98a4a",
        });
      } else out += whip(px, py, pw);
    }
  } else {
    const surface = flavor.top === "plain" ? dark(flavor.filling, 0.04) : dark(flavor.filling, 0.15);
    const topPts = [at(0.03, axis, H), ...arcAt(1 - cw, H)];
    out += el("polygon", { points: pts(topPts), fill: surface });
    if (flavor.top === "lattice") {
      // Fruit showing through, then a lattice laid over the whole pie, clipped to this slice
      const clip = g.id("pietop");
      out += el("defs", {}, el("clipPath", { id: clip }, el("polygon", { points: pts(topPts) })));
      let fruit = "";
      for (let k = 0; k < 10; k++) {
        const [px, py] = at(0.15 + 0.8 * tg.next(), a1 + span * tg.next(), H);
        fruit += s`M${px} ${py}h0.01`;
      }
      out += el("path", {
        d: fruit,
        stroke: flavor.bits === "apple" ? "#f3d690" : dark(flavor.filling, 0.35),
        "stroke-width": R * 0.06,
        "stroke-linecap": "round",
        "clip-path": `url(#${clip})`,
      });
      const theta = tg.f(0, Math.PI / 2);
      const gap = tg.f(0.2, 0.24);
      const off = tg.f(0, gap);
      const sw = gap * 0.42;
      let strips = "";
      let shade = "";
      for (const dir of [theta, theta + Math.PI / 2]) {
        const ux = Math.cos(dir);
        const uz = Math.sin(dir);
        for (let c = -1.2 + off; c < 1.2; c += gap) {
          // One strip: a band of width sw at distance c across the pie, at the top's height
          const corner = (along: number, across: number) => {
            const px = tx + (ux * along - uz * across) * R;
            const pz = tz + (uz * along + ux * across) * R;
            return P(px, pz, (H + rimH * 0.4) * R);
          };
          const quad = [corner(-1.2, c), corner(1.2, c), corner(1.2, c + sw), corner(-1.2, c + sw)];
          const d = `M${pts(quad).replace(/ /g, "L")}Z`;
          if (dir === theta) strips += d;
          else shade += d;
        }
      }
      out += el("path", { d: strips, fill: light(crust, 0.08), "clip-path": `url(#${clip})` });
      out += el("path", { d: shade, fill: crust, "clip-path": `url(#${clip})` });
    } else {
      // A faint sheen on the baked top
      out += el("ellipse", {
        ...Object.fromEntries(["cx", "cy"].map((k, i) => [k, at(0.55, axis, H)[i]])),
        rx: R * 0.16,
        ry: R * 0.16 * sq,
        fill: "#fff",
        opacity: "0.15",
      });
    }
    // The raised crust at the edge: the inner wall at the back, then its crimped top
    out += el("polygon", {
      points: pts([...arcAt(1 - cw, H), ...arcAt(1 - cw, H + rimH).reverse()]),
      fill: dark(crust, 0.2),
    });
    out += el("polygon", {
      points: pts([...arcAt(1, H + rimH), ...arcAt(1 - cw, H + rimH).reverse()]),
      fill: light(crust, 0.1),
    });
    out += el("polyline", {
      points: pts(arcAt(1 - cw / 2, H + rimH)),
      fill: "none",
      stroke: dark(crust, 0.1),
      "stroke-width": R * 0.02,
      "stroke-dasharray": `${Math.max(1, Math.round(R * 0.015))} ${Math.max(2, Math.round(R * 0.05))}`,
      "stroke-linecap": "round",
    });
    if (dollop) {
      const [px, py] = at(0.5, axis, H);
      out += whip(px, py, R * 0.11);
    }
  }
  if (fork) {
    // A fork lying on the front of the plate
    const fa = g.f(-0.15, 0.15) + (g.chance(0.5) ? Math.PI : 0);
    const fx = Rp * g.f(-0.08, 0.08);
    const fz = Rp * g.f(0.64, 0.7);
    const flat = forkOutline(Rp * 0.95, Rp * 0.2, 4).map(([u, v]) =>
      P(fx + u * Math.cos(fa) - v * Math.sin(fa), fz + u * Math.sin(fa) + v * Math.cos(fa), Rp * 0.01),
    );
    out += el("polygon", {
      points: pts(flat.map(([x, y]): Point => [x + Rp * 0.015, y + Rp * 0.02])),
      fill: "#000",
      opacity: "0.12",
    });
    out += el("polygon", { points: pts(flat), fill: "#c9ccd1", stroke: "#a9aeb5", "stroke-width": Rp * 0.006 });
  }
  const [fx, fy] = at(0.55, axis, H + T);
  note.focus(fx, fy);
  note.alt(
    `A slice of ${flavor.name} pie${flavor.top === "meringue" ? " with toasted peaks" : ""} on a plate${
      dollop || fork ? `, with ${andList([dollop && "a dollop of cream", fork && "a fork"])}` : ""
    }`,
  );
  return out;
});
