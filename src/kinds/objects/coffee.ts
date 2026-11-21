import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { table } from "../../draw/shapes";

/** A cup of coffee on a saucer, or a mug, with steam. */
export const coffee = /* @__PURE__ */ defineKind("coffee", "Coffee", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.68, 0.76);
  const cx = w / 2 - unit * 0.03;
  const cupW = unit * g.f(0.17, 0.21);
  const cupH = cupW * g.f(0.9, 1.15);
  const bottomY = top + unit * 0.06;
  const mug = g.chance(0.4);
  const cup = g.pick(["#f4f1ea", "#3e6d8e", "#c4572f", "#e8b04b", "#2f6b58", "#e9a5b5"]);
  const dark = mix(cup, "#000000", 0.15);
  let out = table(g, w, h, top, hsl(g.f(0, 360), g.f(20, 40), g.f(82, 90)), hsl(g.f(15, 40), g.f(20, 35), g.f(48, 62)));
  if (!mug) {
    // Saucer
    out += el("ellipse", { cx, cy: bottomY, rx: cupW * 1.7, ry: cupW * 0.32, fill: dark });
    out += el("ellipse", { cx, cy: bottomY - cupW * 0.05, rx: cupW * 1.6, ry: cupW * 0.27, fill: cup });
  } else {
    // Shadow
    out += el("ellipse", { cx, cy: bottomY, rx: cupW * 1.2, ry: cupW * 0.18, fill: "#000", opacity: "0.12" });
  }
  const topY = bottomY - cupH;
  // Handle
  out += el("path", {
    d: s`M ${cx + cupW * 0.9} ${topY + cupH * 0.25}
         c ${cupW * 0.55} ${-cupH * 0.05} ${cupW * 0.6} ${cupH * 0.55} ${cupW * 0.02} ${cupH * 0.6}`,
    stroke: cup,
    "stroke-width": cupW * 0.16,
    fill: "none",
    "stroke-linecap": "round",
  });
  // Body: a straight-sided mug or a rounded cup
  out += mug
    ? el("path", {
        d: s`M ${cx - cupW} ${topY}
             V ${bottomY - cupW * 0.12}
             Q ${cx - cupW} ${bottomY} ${cx - cupW * 0.85} ${bottomY}
             H ${cx + cupW * 0.85}
             Q ${cx + cupW} ${bottomY} ${cx + cupW} ${bottomY - cupW * 0.12}
             V ${topY}
             Z`,
        fill: cup,
      })
    : el("path", {
        d: s`M ${cx - cupW} ${topY}
             Q ${cx - cupW} ${bottomY} ${cx} ${bottomY}
             Q ${cx + cupW} ${bottomY} ${cx + cupW} ${topY}
             Z`,
        fill: cup,
      });
  // Rim and coffee
  out += el("ellipse", { cx, cy: topY, rx: cupW, ry: cupW * 0.22, fill: dark });
  out += el("ellipse", {
    cx,
    cy: topY + cupW * 0.03,
    rx: cupW * 0.88,
    ry: cupW * 0.17,
    fill: g.pick(["#5a3622", "#7b4a2e", "#c69c6d"]),
  });
  const latte = g.chance(0.5);
  const vessel = mug ? "A steaming mug of coffee" : "A steaming cup of coffee on a saucer";
  const art = latte ? (mug ? " with latte art" : ", with latte art") : mug ? " on a table" : "";
  note.alt(vessel + art);
  note.focus(cx, topY);
  if (latte)
    // Latte art
    out += el("path", {
      d: s`M ${cx - cupW * 0.25} ${topY + cupW * 0.02}
           Q ${cx} ${topY - cupW * 0.12} ${cx + cupW * 0.25} ${topY + cupW * 0.02}
           Q ${cx} ${topY + cupW * 0.14} ${cx - cupW * 0.25} ${topY + cupW * 0.02}
           Z`,
      fill: "#f1dfc4",
      opacity: "0.9",
    });
  // Steam
  let steam = "";
  for (let k = -1; k <= 1; k++) {
    const sx = cx + k * cupW * 0.35;
    const len = cupH * g.f(0.6, 0.9);
    steam += s`M ${sx} ${topY - cupW * 0.15} q ${cupW * 0.18} ${-len * 0.25} 0 ${-len * 0.5} t 0 ${-len * 0.5} `;
  }
  out += el("path", {
    d: steam.trim(),
    stroke: "#fff",
    "stroke-width": cupW * 0.07,
    fill: "none",
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  return out;
});
