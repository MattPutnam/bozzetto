import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { table } from "../../draw/shapes";

/** A teapot on a table, sometimes with a cup of tea beside it. */
export const teapot = /* @__PURE__ */ defineKind("teapot", "Teapot", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const top = h * g.f(0.66, 0.74);
  const withCup = g.chance(0.6);
  // The spout points toward the cup.
  const dir = g.chance(0.5) ? 1 : -1;
  const bw = unit * g.f(0.13, 0.155);
  const bh = unit * g.f(0.2, 0.26);
  const potX = withCup ? w / 2 - dir * unit * 0.15 : w / 2 - dir * unit * 0.03;
  const bottom = top + unit * 0.05;
  const cy = bottom - unit * 0.02 - bh * 0.5;
  const bodyTop = cy - bh * 0.5;
  const X = (dx: number) => potX + dir * dx;
  const pot = g.pick([
    "#3e6d8e",
    "#e9e3d5",
    "#c4572f",
    "#2f6b58",
    "#e8b04b",
    "#e9a5b5",
    "#7a5c9e",
    "#f4f1ea",
    "#3b3b3b",
  ]);
  const dark = mix(pot, "#000000", 0.15);
  const clip = g.id("pot");
  const pale = pot === "#f4f1ea" || pot === "#e9e3d5";
  const wallHue = g.f(0, 360);
  const wallSat = g.f(20, 40) * (pale ? 0.75 : 1);
  // A pale pot goes against a deep wall, so it never fades into it
  const wallLight = g.f(82, 90) - (pale ? 48 : 0);
  let out = table(g, w, h, top, hsl(wallHue, wallSat, wallLight), hsl(g.f(15, 40), g.f(20, 35), g.f(48, 62)));
  // Shadow
  out += el("ellipse", { cx: potX, cy: bottom, rx: bw * 1.2, ry: unit * 0.025, fill: "#000", opacity: "0.12" });
  const cane = g.chance(0.25);
  if (cane)
    // A cane handle arching over the lid
    out += el("path", {
      d: s`M ${X(-bw * 0.62)} ${bodyTop + bh * 0.14}
           C ${X(-bw * 0.55)} ${bodyTop - bh * 0.6} ${X(bw * 0.55)} ${bodyTop - bh * 0.6} ${X(bw * 0.62)} ${bodyTop + bh * 0.14}`,
      stroke: "#b08850",
      "stroke-width": bw * 0.09,
      fill: "none",
      "stroke-linecap": "round",
    });
  else
    // Handle
    out += el("path", {
      d: s`M ${X(-bw * 0.7)} ${cy - bh * 0.3}
           C ${X(-bw * 1.55)} ${cy - bh * 0.45} ${X(-bw * 1.55)} ${cy + bh * 0.3} ${X(-bw * 0.8)} ${cy + bh * 0.24}`,
      stroke: pot,
      "stroke-width": bw * 0.15,
      fill: "none",
      "stroke-linecap": "round",
    });
  // Spout, rising from low on the body to a tip level with the lid
  out += el("path", {
    d: s`M ${X(bw * 0.8)} ${cy + bh * 0.22}
         C ${X(bw * 1.35)} ${cy + bh * 0.15} ${X(bw * 1.45)} ${cy - bh * 0.3} ${X(bw * 1.75)} ${cy - bh * 0.56}
         L ${X(bw * 1.66)} ${cy - bh * 0.66}
         C ${X(bw * 1.3)} ${cy - bh * 0.42} ${X(bw * 1.2)} ${cy - bh * 0.12} ${X(bw * 0.82)} ${cy - bh * 0.14}
         Z`,
    fill: pot,
  });
  // Foot and body
  out += el("rect", {
    x: potX - bw * 0.55,
    y: bottom - unit * 0.025,
    width: bw * 1.1,
    height: unit * 0.025,
    rx: unit * 0.006,
    fill: dark,
  });
  out += el("ellipse", { cx: potX, cy, rx: bw, ry: bh * 0.5, fill: pot });
  // Pattern, kept inside the body
  const pattern = g.pick(["plain", "plain", "band", "dots"]);
  const paint = pale ? g.pick(["#3e6d8e", "#c4572f", "#2f6b58"]) : "#ffffff";
  if (pattern !== "plain") {
    let marks = "";
    if (pattern === "band")
      marks += el("rect", {
        x: potX - bw,
        y: cy - bh * 0.06,
        width: bw * 2,
        height: bh * 0.12,
        fill: paint,
        opacity: "0.7",
      });
    else
      for (let row = -1; row <= 1; row++)
        for (let col = -3; col <= 3; col++)
          marks += el("circle", {
            cx: potX + (col + (row === 0 ? 0.5 : 0)) * bw * 0.3,
            cy: cy + row * bh * 0.22,
            r: bw * 0.055,
            fill: paint,
            opacity: "0.7",
          });
    out += el("clipPath", { id: clip }, el("ellipse", { cx: potX, cy, rx: bw, ry: bh * 0.5 }));
    out += el("g", { "clip-path": `url(#${clip})` }, marks);
  }
  // Lid and knob
  const lidY = bodyTop + bh * 0.07;
  const lw = bw * 0.48;
  out += el("path", {
    d: s`M ${potX - lw} ${lidY}
         A ${lw} ${bh * 0.15} 0 0 1 ${potX + lw} ${lidY}
         Z`,
    fill: mix(pot, "#ffffff", 0.1),
  });
  out += el("rect", {
    x: potX - lw * 1.12,
    y: lidY - unit * 0.006,
    width: lw * 2.24,
    height: unit * 0.014,
    rx: unit * 0.006,
    fill: dark,
  });
  out += el("circle", { cx: potX, cy: lidY - bh * 0.17, r: bw * 0.1, fill: dark });
  // Highlight
  out += el("ellipse", {
    cx: potX - bw * 0.5,
    cy: cy - bh * 0.15,
    rx: bw * 0.12,
    ry: bh * 0.2,
    fill: "#fff",
    opacity: "0.25",
    transform: s`rotate(20 ${potX - bw * 0.5} ${cy - bh * 0.15})`,
  });
  if (withCup) {
    // A teacup on a saucer, a little nearer than the pot
    const cupW = unit * g.f(0.07, 0.085);
    const cupX = X(bw * 1.75 + unit * 0.15);
    const cupBottom = bottom + unit * 0.035;
    const cupTop = cupBottom - cupW * 0.85;
    const cup = g.chance(0.5) ? pot : "#f4f1ea";
    const cupDark = mix(cup, "#000000", 0.15);
    out += el("ellipse", { cx: cupX, cy: cupBottom, rx: cupW * 1.7, ry: cupW * 0.32, fill: cupDark });
    out += el("ellipse", { cx: cupX, cy: cupBottom - cupW * 0.05, rx: cupW * 1.6, ry: cupW * 0.26, fill: cup });
    out += el("path", {
      d: s`M ${cupX + dir * cupW * 0.85} ${cupTop + cupW * 0.2}
           c ${dir * cupW * 0.5} ${-cupW * 0.05} ${dir * cupW * 0.5} ${cupW * 0.5} ${-dir * cupW * 0.15} ${cupW * 0.5}`,
      stroke: cup,
      "stroke-width": cupW * 0.14,
      fill: "none",
      "stroke-linecap": "round",
    });
    out += el("path", {
      d: s`M ${cupX - cupW} ${cupTop}
           Q ${cupX - cupW} ${cupBottom - cupW * 0.05} ${cupX} ${cupBottom - cupW * 0.05}
           Q ${cupX + cupW} ${cupBottom - cupW * 0.05} ${cupX + cupW} ${cupTop}
           Z`,
      fill: cup,
    });
    out += el("ellipse", { cx: cupX, cy: cupTop, rx: cupW, ry: cupW * 0.22, fill: cupDark });
    out += el("ellipse", {
      cx: cupX,
      cy: cupTop + cupW * 0.03,
      rx: cupW * 0.86,
      ry: cupW * 0.16,
      fill: g.pick(["#b5652b", "#c98a3c", "#8a4a22"]),
    });
  }
  // Steam from the spout
  if (g.chance(0.6)) {
    const tipX = X(bw * 1.71);
    const tipY = cy - bh * 0.66;
    out += el("path", {
      d: s`M ${tipX} ${tipY - bh * 0.05} q ${dir * bw * 0.25} ${-bh * 0.15} 0 ${-bh * 0.3} t 0 ${-bh * 0.3}`,
      stroke: "#fff",
      "stroke-width": bw * 0.07,
      fill: "none",
      "stroke-linecap": "round",
      opacity: "0.6",
    });
  }
  const look =
    pattern === "dots" ? "A polka-dot teapot" : pattern === "band" ? "A teapot with a painted band" : "A teapot";
  const handle = cane ? (pattern === "band" ? " and a cane handle" : " with a cane handle") : "";
  note.alt(`${look}${handle}${withCup ? " beside a cup of tea" : ""} on a table`);
  note.focus(withCup ? (potX + X(bw * 1.75 + unit * 0.15)) / 2 : potX, cy);
  return out;
});
