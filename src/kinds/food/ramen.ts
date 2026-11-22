import { defineKind, el, fill, s } from "../../draw/core";
import { andList } from "../../draw/words";
import { spread } from "./shared";

const BROTHS: readonly [string, string][] = [
  ["#f1e3c6", "creamy"],
  ["#c47a3f", "soy"],
  ["#d99a4e", "miso"],
  ["#d9563a", "spicy"],
];

/**
 * A bowl of ramen from above: noodles in broth, with toppings around them.
 *
 * @category Food
 */
export const ramen = /* @__PURE__ */ defineKind("ramen", "Ramen", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = unit * 0.42;
  const r = R * 0.84;
  let out = fill(w, h, g.pick(["#c89a64", "#a87444", "#2f3a3a", "#e9dccb", "#d9cbb5"]));
  // Bowl: shadow, rim with a ring of pattern, broth
  const bowl = g.pick(["#fbfaf4", "#1f2328", "#c23b22", "#2b5d8a"]);
  out += el("circle", { cx: cx + R * 0.03, cy: cy + R * 0.06, r: R, fill: "#000", opacity: "0.15" });
  out += el("circle", { cx, cy, r: R, fill: bowl });
  out += el("circle", {
    cx,
    cy,
    r: R * 0.92,
    fill: "none",
    stroke: bowl === "#fbfaf4" ? "#2b5d8a" : "#fbfaf4",
    "stroke-width": R * 0.025,
    "stroke-dasharray": `${Math.round(R * 0.08)} ${Math.round(R * 0.05)}`,
    opacity: "0.7",
  });
  const [broth, flavor] = g.pick(BROTHS);
  out += el("circle", { cx, cy, r, fill: broth });
  // Drops of fat on the broth
  let fat = "";
  for (const [x, y] of spread(g, cx, cy, r * 0.9, 9)) fat += s`M${x} ${y}h0.01`;
  out += el("path", { d: fat, stroke: "#fff", "stroke-width": r * 0.05, "stroke-linecap": "round", opacity: "0.3" });
  // Wavy noodles in the middle, clipped to a round heap
  const clip = g.id("noodles");
  const nr = r * 0.55;
  out += el("defs", {}, el("clipPath", { id: clip }, el("circle", { cx, cy, r: nr })));
  let noodles = "";
  const lines = 12;
  for (let k = 0; k < lines; k++) {
    const y = cy - nr + (nr * 2 * (k + 0.5)) / lines;
    const step = nr * 0.22;
    noodles += s`M${cx - nr - g.f(0, step)} ${y}q${step / 2} ${-step * 0.35} ${step} 0`;
    for (let b = 0; b < 12; b++) noodles += s`t${step} 0`;
  }
  out += el("path", {
    d: noodles,
    stroke: "#f3d98b",
    "stroke-width": nr * 0.075,
    fill: "none",
    "clip-path": `url(#${clip})`,
  });
  out += el("circle", { cx, cy, r: nr, fill: "none", stroke: broth, "stroke-width": nr * 0.04, opacity: "0.5" });
  // Pick four or five toppings, in a seeded order, and set them around the noodles
  const pool = ["egg", "pork", "nori", "fishcake", "scallions", "corn", "bamboo"];
  for (let k = pool.length - 1; k > 0; k--) {
    const j = g.i(0, k);
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const chosen = pool.slice(0, g.i(4, 5));
  const S = r * 0.37;
  const a0 = g.f(0, Math.PI * 2);
  chosen.forEach((name, k) => {
    const a = a0 + (k * Math.PI * 2) / chosen.length;
    const x = cx + Math.cos(a) * r * 0.56;
    const y = cy + Math.sin(a) * r * 0.56;
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const deg = (a * 180) / Math.PI;
    const tg = g.fork(name);
    if (name === "egg")
      // Two halves of a soft-boiled egg
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.5 * side;
        const ey = y + ty * S * 0.5 * side;
        out += el("ellipse", {
          cx: ex,
          cy: ey,
          rx: S * 0.42,
          ry: S * 0.55,
          fill: "#fbfaf4",
          transform: s`rotate(${deg} ${ex} ${ey})`,
        });
        out += el("circle", { cx: ex, cy: ey, r: S * 0.28, fill: "#f39c2b" });
        out += el("circle", { cx: ex, cy: ey, r: S * 0.15, fill: "#f7b84b" });
      }
    else if (name === "pork")
      // Two slices of chashu, overlapping
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.32 * side;
        const ey = y + ty * S * 0.32 * side;
        out += el("circle", {
          cx: ex,
          cy: ey,
          r: S * 0.55,
          fill: "#e8b49a",
          stroke: "#a0583a",
          "stroke-width": S * 0.1,
        });
        out += el("path", {
          d: s`M ${ex - S * 0.25} ${ey + S * 0.1} q ${S * 0.25} ${-S * 0.35} ${S * 0.45} ${-S * 0.05}`,
          stroke: "#f6dccb",
          "stroke-width": S * 0.08,
          fill: "none",
          "stroke-linecap": "round",
        });
      }
    else if (name === "nori")
      // A sheet of nori tucked in at the edge
      out += el("rect", {
        x: x - S * 0.65 + Math.cos(a) * S * 0.2,
        y: y - S * 0.3 + Math.sin(a) * S * 0.2,
        width: S * 1.3,
        height: S * 0.6,
        rx: S * 0.04,
        fill: "#1f2a22",
        transform: s`rotate(${deg + 90} ${x + Math.cos(a) * S * 0.2} ${y + Math.sin(a) * S * 0.2})`,
      });
    else if (name === "fishcake")
      // Two slices of narutomaki, with a pink swirl
      for (const side of [-1, 1]) {
        const ex = x + tx * S * 0.48 * side;
        const ey = y + ty * S * 0.48 * side;
        let swirl = s`M ${ex} ${ey}`;
        for (let p = 1; p <= 16; p++) {
          const sa = p * 0.75;
          const sr = S * 0.3 * (p / 16);
          swirl += s` L ${ex + Math.cos(sa) * sr} ${ey + Math.sin(sa) * sr}`;
        }
        out += el("circle", { cx: ex, cy: ey, r: S * 0.42, fill: "#fbfaf4" });
        out += el("path", {
          d: swirl,
          stroke: "#f06292",
          "stroke-width": S * 0.07,
          fill: "none",
          "stroke-linecap": "round",
        });
      }
    else if (name === "scallions") {
      // Rings of green onion
      let d = "";
      for (const [sx, sy] of spread(tg, x, y, S * 0.7, 11))
        d += s`M${sx - S * 0.1} ${sy}a${S * 0.1} ${S * 0.1} 0 1 0 ${S * 0.2} 0a${S * 0.1} ${S * 0.1} 0 1 0 ${-S * 0.2} 0Z`;
      out += el("path", { d, fill: "#c4e6a0", stroke: "#5aa03c", "stroke-width": S * 0.05 });
    } else if (name === "corn") {
      // Kernels of corn
      let d = "";
      for (const [sx, sy] of spread(tg, x, y, S * 0.7, 16)) d += s`M${sx} ${sy}h0.01`;
      out += el("path", { d, stroke: "#f6c945", "stroke-width": S * 0.18, "stroke-linecap": "round" });
    } else {
      // Strips of bamboo shoot
      let d = "";
      for (let p = 0; p < 4; p++) {
        const off = (p - 1.5) * S * 0.28;
        const sx = x + tx * off + Math.cos(a) * tg.f(-0.1, 0.1) * S;
        const sy = y + ty * off + Math.sin(a) * tg.f(-0.1, 0.1) * S;
        d += s`M${sx - Math.cos(a) * S * 0.38} ${sy - Math.sin(a) * S * 0.38}l${Math.cos(a) * S * 0.76} ${Math.sin(a) * S * 0.76}`;
      }
      out += el("path", { d, stroke: "#b8874a", "stroke-width": S * 0.16, "stroke-linecap": "round" });
    }
  });
  const sticks = g.chance(0.7);
  if (sticks) {
    // Chopsticks resting across the bowl
    const y0 = cy - R * g.f(0.45, 0.6);
    const d = s`M ${cx - R * 1.12} ${y0 + R * 0.12} L ${cx + R * 1.12} ${y0 - R * 0.12}
                M ${cx - R * 1.12} ${y0 + R * 0.24} L ${cx + R * 1.12} ${y0 + R * 0.02}`;
    out += el("path", {
      d,
      stroke: "#000",
      "stroke-width": R * 0.05,
      "stroke-linecap": "round",
      opacity: "0.15",
      transform: s`translate(${R * 0.03} ${R * 0.06})`,
    });
    out += el("path", {
      d,
      stroke: g.pick(["#8b5a3c", "#c23b22", "#2b2b2b", "#e8d5b0"]),
      "stroke-width": R * 0.045,
      "stroke-linecap": "round",
    });
  }
  const names: Record<string, string> = {
    egg: "a soft-boiled egg",
    pork: "pork",
    nori: "nori",
    fishcake: "fish cake",
    scallions: "scallions",
    corn: "corn",
    bamboo: "bamboo shoots",
  };
  note.alt(
    `A bowl of ${flavor} ramen with ${andList(chosen.map(c => names[c]))}${sticks ? ", chopsticks across the top" : ""}`,
  );
  note.focus(cx, cy);
  return out;
});
