import { defineKind, fill, hsl, s } from "./core";

const SKINS = [
  ["#f6d5c1", "#e2b49b"],
  ["#eec1a2", "#d69f7e"],
  ["#d9a17e", "#bd8361"],
  ["#b97b56", "#9a6141"],
  ["#8d5a3b", "#734629"],
  ["#5e3b27", "#4a2d1c"],
] as const;
const HAIR = ["#2b1d16", "#4a2f1f", "#7b4a26", "#c58a3d", "#e3c27a", "#a33b20", "#8f8f95", "#1d1d24"];
const STYLES = ["short", "long", "bun", "curly", "bald", "bob"] as const;

/** Head and shoulders. Skin, hair color and style, head shape, brows, smile and glasses vary. */
export const portrait = defineKind("portrait", "Portrait", "face", (g, w, h) => {
  const [skin, shade] = g.pick(SKINS), hair = g.pick(HAIR), style = g.pick(STYLES);
  const u = Math.min(w, h), rx = u * g.f(0.15, 0.185), ry = rx * g.f(1.12, 1.3), cx = w / 2, cy = h / 2 - ry * g.f(0.2, 0.5);
  let out = fill(w, h, hsl(g.f(0, 360), 35, 82));

  // Hair that sits behind the head.
  if (style === "long") out += s`<path d="M ${cx - rx * 1.12} ${cy} Q ${cx - rx * 1.3} ${cy + ry * 1.6} ${cx - rx * 0.9} ${cy + ry * 1.95} H ${cx + rx * 0.9} Q ${cx + rx * 1.3} ${cy + ry * 1.6} ${cx + rx * 1.12} ${cy} Z" fill="${hair}"/>`;
  if (style === "bob") out += s`<rect x="${cx - rx * 1.18}" y="${cy - ry * 0.3}" width="${rx * 2.36}" height="${ry * 1.2}" rx="${rx * 0.4}" fill="${hair}"/>`;
  if (style === "bun") out += s`<circle cx="${cx + rx * g.f(-0.2, 0.2)}" cy="${cy - ry * 1.08}" r="${rx * 0.42}" fill="${hair}"/>`;

  // Neck, shoulders, ears, head.
  const sw = rx * g.f(2.3, 2.9), sy = cy + ry * 1.55;
  out += s`<rect x="${cx - rx * 0.32}" y="${cy + ry * 0.6}" width="${rx * 0.64}" height="${sy - cy - ry * 0.45}" fill="${shade}"/>`;
  out += s`<path d="M ${cx - sw} ${h} C ${cx - sw} ${sy + ry * 0.1} ${cx - sw * 0.6} ${sy} ${cx} ${sy} C ${cx + sw * 0.6} ${sy} ${cx + sw} ${sy + ry * 0.1} ${cx + sw} ${h} Z" fill="${hsl(g.f(0, 360), g.f(25, 60), g.f(32, 60))}"/>`;
  for (const side of [-1, 1]) out += s`<ellipse cx="${cx + side * rx * 0.97}" cy="${cy + ry * 0.08}" rx="${rx * 0.16}" ry="${ry * 0.2}" fill="${skin}"/>`;
  out += s`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>`;

  // Hair in front.
  if (style === "curly") {
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (1.05 + (k / 8) * 0.9);
      out += s`<circle cx="${cx + Math.cos(a) * rx * 0.95}" cy="${cy - ry * 0.15 + Math.sin(a) * ry * 0.9}" r="${rx * g.f(0.28, 0.36)}" fill="${hair}"/>`;
    }
  }
  if (style !== "bald") {
    const part = rx * g.f(-0.4, 0.4), right = g.f(0.15, 0.5), left = g.f(0.15, 0.5);
    out += s`<path d="M ${cx - rx * 1.04} ${cy + ry * 0.1} C ${cx - rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.04} ${cy + ry * 0.1} Q ${cx + rx * 0.9} ${cy - ry * right} ${cx + part} ${cy - ry * 0.6} Q ${cx - rx * 0.8} ${cy - ry * left} ${cx - rx * 1.04} ${cy + ry * 0.1} Z" fill="${hair}"/>`;
  }

  // Features.
  const ey = cy + ry * 0.05, ex = rx * 0.38, er = rx * g.f(0.07, 0.1), bd = ry * g.f(0.18, 0.26), arch = ry * g.f(-0.02, 0.06) + ry * 0.04;
  for (const side of [-1, 1]) out += s`<circle cx="${cx + side * rx * 0.55}" cy="${cy + ry * 0.36}" r="${rx * 0.16}" fill="#e8766b" opacity="0.25"/>`;
  for (const side of [-1, 1]) out += s`<circle cx="${cx + side * ex}" cy="${ey}" r="${er}" fill="#2a2320"/>`;
  let brows = "";
  for (const side of [-1, 1]) brows += s`M ${cx + side * ex - rx * 0.14} ${ey - bd} Q ${cx + side * ex} ${ey - bd - arch} ${cx + side * ex + rx * 0.14} ${ey - bd} `;
  out += s`<path d="${brows.trim()}" stroke="${style === "bald" ? shade : hair}" stroke-width="${rx * 0.06}" stroke-linecap="round" fill="none"/>`;
  out += s`<path d="M ${cx} ${ey + ry * 0.1} Q ${cx + rx * 0.12} ${ey + ry * 0.3} ${cx} ${ey + ry * 0.33}" stroke="${shade}" stroke-width="${rx * 0.045}" stroke-linecap="round" fill="none"/>`;
  const my = cy + ry * 0.55, mw = rx * g.f(0.2, 0.36);
  out += s`<path d="M ${cx - mw} ${my} Q ${cx} ${my + ry * g.f(0.04, 0.3)} ${cx + mw} ${my}" stroke="#7a3b33" stroke-width="${rx * 0.06}" stroke-linecap="round" fill="none"/>`;
  if (g.chance(0.3)) {
    out += s`<g fill="none" stroke="#222" stroke-width="${rx * 0.05}"><circle cx="${cx - ex}" cy="${ey}" r="${rx * 0.22}"/><circle cx="${cx + ex}" cy="${ey}" r="${rx * 0.22}"/><path d="M ${cx - ex + rx * 0.22} ${ey} H ${cx + ex - rx * 0.22}"/></g>`;
  }
  return out;
});
