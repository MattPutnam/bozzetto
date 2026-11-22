import { defineKind, el, fill, s } from "../../draw/core";
import { andList, numberWord } from "../../draw/words";

/**
 * Nigiri and maki on a dark plate, with chopsticks.
 *
 * @category Food
 */
export const sushi = /* @__PURE__ */ defineKind("sushi", "Sushi", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const bg = g.pick(["#d9cbb5", "#c9d6d0", "#e6ddd0", "#3a3f3a"]);
  let out = fill(w, h, bg);
  const plateW = w * 0.82;
  const plateH = h * 0.5;
  const plateX = (w - plateW) / 2;
  const plateY = h * 0.3;
  // Plate and its shadow
  out += el("rect", {
    x: plateX + 4,
    y: plateY + 6,
    width: plateW,
    height: plateH,
    rx: plateH * 0.12,
    fill: "#000",
    opacity: "0.12",
  });
  out += el("rect", {
    x: plateX,
    y: plateY,
    width: plateW,
    height: plateH,
    rx: plateH * 0.12,
    fill: g.pick(["#1f2328", "#5a2e2a", "#f2efe8"]),
  });
  const count = g.i(3, 4);
  const slot = plateW / count;
  const pieces: Record<string, number> = { salmon: 0, tuna: 0, egg: 0, maki: 0 };
  for (let k = 0; k < count; k++) {
    const x = plateX + slot * (k + 0.5);
    const y = plateY + plateH * 0.55;
    const kind = g.pick(["salmon", "tuna", "egg", "maki", "maki"]);
    pieces[kind]++;
    if (kind === "maki") {
      // Maki: nori, rice, filling
      const r = Math.min(slot, plateH) * 0.34;
      out += el("circle", { cx: x, cy: y, r, fill: "#1e2b22" });
      out += el("circle", { cx: x, cy: y, r: r * 0.82, fill: "#fbfaf4" });
      out += el("circle", { cx: x, cy: y, r: r * 0.35, fill: g.pick(["#f28b66", "#d94a4a", "#7bc96f", "#f6d365"]) });
    } else {
      const riceW = slot * 0.4;
      const riceH = plateH * 0.2;
      const fish = { salmon: "#f4895f", tuna: "#c8334a", egg: "#f6cd4c" }[kind]!;
      // Rice
      out += el("rect", {
        x: x - riceW,
        y: y - riceH * 0.2,
        width: riceW * 2,
        height: riceH * 1.4,
        rx: riceH * 0.6,
        fill: "#fbfaf4",
      });
      // Topping
      out += el("path", {
        d: s`M ${x - riceW * 1.12} ${y}
             Q ${x - riceW * 1.1} ${y - riceH * 1.2} ${x} ${y - riceH * 1.1}
             Q ${x + riceW * 1.15} ${y - riceH * 1.1} ${x + riceW * 1.12} ${y + riceH * 0.05}
             Z`,
        fill: fish,
      });
      if (kind === "salmon")
        // Salmon stripes
        out += el("path", {
          d: s`M ${x - riceW * 0.6} ${y - riceH * 0.95} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.85}
               M ${x} ${y - riceH * 1.05} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.95}
               M ${x + riceW * 0.6} ${y - riceH * 0.95} q ${riceW * 0.15} ${riceH * 0.4} ${riceW * 0.05} ${riceH * 0.9}`,
          stroke: "#ffd2bd",
          "stroke-width": riceH * 0.12,
          fill: "none",
          "stroke-linecap": "round",
        });
      if (kind === "egg")
        // Nori band
        out += el("rect", {
          x: x - riceW * 0.25,
          y: y - riceH * 1.15,
          width: riceW * 0.5,
          height: riceH * 2.4,
          fill: "#1e2b22",
        });
    }
  }
  // Chopsticks
  const stickY = plateY + plateH + h * 0.08;
  out += el("path", {
    d: s`M ${w * 0.1} ${stickY} L ${w * 0.88} ${stickY - h * 0.05}
         M ${w * 0.1} ${stickY + unit * 0.045} L ${w * 0.88} ${stickY - h * 0.02}`,
    stroke: g.pick(["#8b5a3c", "#c23b22", "#2b2b2b"]),
    "stroke-width": unit * 0.022,
    "stroke-linecap": "round",
  });
  // Group the nigiri by topping ("Two salmon and tuna nigiri"), then the maki.
  const fish = (["salmon", "tuna", "egg"] as const)
    .filter(kind => pieces[kind])
    .map(kind => (pieces[kind] === 1 ? kind : `${numberWord(pieces[kind])} ${kind}`));
  const maki = pieces.maki === 1 ? "a maki roll" : `${numberWord(pieces.maki)} maki rolls`;
  const text = !fish.length ? maki : `${andList(fish)} nigiri${pieces.maki ? ` with ${maki}` : ""}`;
  note.alt(`${text.charAt(0).toUpperCase()}${text.slice(1)} on a plate beside chopsticks`);
  note.focus(w / 2, plateY + plateH * 0.5);
  return out;
});
