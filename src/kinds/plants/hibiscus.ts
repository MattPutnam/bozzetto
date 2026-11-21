import { defineKind, el, hsl, mix, s } from "../../draw/core";
import { at, backdrop, fan, hexHsl, leaf, leafEl, type Part, SETTING, type View } from "./shared";

// Hibiscus colors: petal hue, saturation, lightness, and whether a dark eye marks the middle.
const HIBISCUS: readonly (readonly [number, number, number])[] = [
  [355, 85, 48],
  [352, 80, 44],
  [335, 68, 68],
  [18, 90, 58],
  [48, 90, 62],
  [30, 30, 95],
  [8, 80, 64],
];

/** A hibiscus close up: five broad petals around a long column of stamens, among glossy leaves. */
export const hibiscus = /* @__PURE__ */ defineKind("hibiscus", "Hibiscus", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const look = g.pick(["garden", "garden", "sky", "warm"] as const);
  let out = backdrop(g, w, h, look);
  const [hue, sat, light] = g.pick(HIBISCUS);
  const green = hexHsl(g.f(110, 140), g.f(40, 55), g.f(22, 30));
  const R = unit * g.f(0.34, 0.4);
  const faceOn = g.chance(0.5);
  const v: View = {
    x: w / 2 + unit * g.f(-0.1, 0.1),
    y: h / 2 + unit * g.f(-0.03, 0.05),
    tilt: faceOn ? g.f(1.3, 1.57) : g.f(0.85, 1.1),
    roll: g.f(-0.4, 0.4),
  };
  // Glossy leaves behind the flower
  const start = g.f(0, Math.PI * 2);
  for (let k = g.i(2, 3); k > 0; k--) {
    const angle = start + k * g.f(1.6, 2.2);
    const lx = v.x + Math.cos(angle) * R * 0.5;
    const ly = v.y + Math.sin(angle) * R * 0.5;
    out += leafEl(leaf(lx, ly, angle, R * g.f(1.05, 1.25), R * 0.36, 0.3, g.f(-0.06, 0.06)), green, unit * 0.005);
  }
  // Five petals in a pinwheel, each overlapping the next.
  const parts: (Part & { paint: string })[] = [];
  const turn = g.f(0, Math.PI * 2);
  const eye = light > 55 || hue === 18 ? hsl(350, 75, 38) : hsl(hue, sat, light - 18);
  const eyeParts: Part[] = [];
  for (let k = 0; k < 5; k++) {
    const theta = turn + (k * Math.PI * 2) / 5;
    const shape = { len: R * g.f(0.95, 1.03), wid: 0, spread: 0.8, lift: 0.14, cup: 0.06, wobble: 0.06 };
    const part = fan(g, v, theta, shape);
    part.z += k * 0.001;
    parts.push({ ...part, paint: hsl(hue, sat, light + (k % 2 ? 2 : -1) + g.f(-2, 2)) });
    eyeParts.push(fan(g, v, theta, { ...shape, len: shape.len * g.f(0.3, 0.4), spread: 0.75, wobble: 0.03 }));
  }
  out += parts
    .sort((a, b) => a.z - b.z)
    .map(part =>
      el("path", { d: part.d, fill: part.paint, stroke: eye, "stroke-opacity": "0.25", "stroke-width": R * 0.008 }),
    )
    .join("");
  out += el("path", { d: eyeParts.map(part => part.d).join(""), fill: eye });
  // Veins fanning from the eye
  let veins = "";
  for (let k = 0; k < 20; k++) {
    const theta = turn + (k / 20) * Math.PI * 2;
    const a = at(v, theta, [R * 0.1, R * 0.02, 0]);
    const b = at(v, theta, [R * g.f(0.45, 0.65), R * 0.08, 0]);
    veins += s`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  out += el("path", { d: veins, stroke: eye, "stroke-width": R * 0.012, opacity: "0.5", fill: "none" });
  // The staminal column: a long tube rising from the middle, with anthers near the tip and five
  // stigma pads at its end.
  const lean = turn + g.f(0, Math.PI * 2);
  const reach = faceOn ? R * 0.85 : R * 0.55;
  const tipPoint = at(v, lean, [reach, R * 1.0, 0]);
  const midPoint = at(v, lean, [reach * 0.35, R * 0.5, 0]);
  const root = at(v, lean, [0, 0, 0]);
  const column = light > 55 ? mix(hexHsl(hue, sat, light), "#ffffff", 0.35) : hsl(hue, sat, light + 6);
  out += el("path", {
    d: s`M${root[0]} ${root[1]}Q${midPoint[0]} ${midPoint[1]} ${tipPoint[0]} ${tipPoint[1]}`,
    stroke: column,
    "stroke-width": R * 0.045,
    fill: "none",
    "stroke-linecap": "round",
  });
  let anthers = "";
  for (let k = 0; k < 16; k++) {
    const t = g.f(0.55, 0.92);
    const x = (1 - t) ** 2 * root[0] + 2 * t * (1 - t) * midPoint[0] + t * t * tipPoint[0];
    const y = (1 - t) ** 2 * root[1] + 2 * t * (1 - t) * midPoint[1] + t * t * tipPoint[1];
    anthers += s`M${x + g.f(-1, 1) * R * 0.05} ${y + g.f(-1, 1) * R * 0.05}h.1`;
  }
  out += el("path", { d: anthers, stroke: "#f2c43a", "stroke-width": R * 0.04, "stroke-linecap": "round" });
  let pads = "";
  for (let k = 0; k < 5; k++) {
    const angle = (k / 5) * Math.PI * 2 + lean;
    const px = tipPoint[0] + Math.cos(angle) * R * 0.05;
    const py = tipPoint[1] + Math.sin(angle) * R * 0.05;
    pads += s`M${tipPoint[0]} ${tipPoint[1]}L${px} ${py}M${px} ${py}h.1`;
  }
  out += el("path", { d: pads, stroke: "#9b1830", "stroke-width": R * 0.028, "stroke-linecap": "round" });
  note.alt(
    `A hibiscus ${faceOn ? "open to the viewer" : "seen at an angle"} with its long column of stamens ${SETTING[look]}`,
  );
  note.focus(v.x, v.y);
  return out;
});
