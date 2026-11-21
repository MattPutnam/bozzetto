/** Helpers shared by several people kinds. */
import { el, hsl, type Point, type Rand, s } from "../../draw/core";
import { andList } from "../../draw/words";

// The portrait's skin tones, each with a shade for the neck, nose and ears.
export const SKINS = [
  ["#f6d5c1", "#e2b49b"],
  ["#eec1a2", "#d69f7e"],
  ["#d9a17e", "#bd8361"],
  ["#b97b56", "#9a6141"],
  ["#8d5a3b", "#734629"],
  ["#5e3b27", "#4a2d1c"],
] as const;

// The portrait's hair colors, split so darker skin mostly gets darker hair, plus greys for older people.
export const DARK_HAIR = ["#2b1d16", "#4a2f1f", "#1d1d24"];

export const LIGHT_HAIR = ["#7b4a26", "#c58a3d", "#e3c27a", "#a33b20"];

export const GREY_HAIR = ["#8f8f95", "#c4c4c8"];

// Repeats make the common styles commoner.
export const STYLES = ["short", "short", "long", "long", "curly", "curly", "bun", "bob", "bald", "scarf"] as const;

export const CLOTHES = ["tee", "vneck", "collar", "jacket", "sweater"] as const;

export type Style = (typeof STYLES)[number];

/** A color as hue, saturation and lightness, so a kind can shade it. */
export type Tone = readonly [number, number, number];

export const paint = (tone: Tone, lighten = 0): string => hsl(tone[0], tone[1], tone[2] + lighten);

/** Everything about one person that stays the same however big they're drawn. */
export interface Person {
  skin: string;
  shade: string;
  hair: string;
  older: boolean;
  style: Style;
  beard: "none" | "full" | "mustache";
  glasses: boolean;
  clothes: (typeof CLOTHES)[number];
  top: Tone;
  inner: Tone;
  scarf: Tone;
  long: number;
  eyeR: number;
  browDrop: number;
  arch: number;
  mouthW: number;
  curve: number;
  part: number;
  left: number;
  right: number;
  bunX: number;
  curls: number[];
}

/** One person's looks, all drawn from their own stream so each person varies on their own. */
export function person(g: Rand): Person {
  const skinIndex = g.i(0, SKINS.length - 1);
  const older = g.chance(0.2);
  const lightHair = skinIndex < 3 && g.chance(0.5);
  const hair = older ? g.pick(GREY_HAIR) : g.pick(lightHair ? LIGHT_HAIR : DARK_HAIR);
  const style = g.pick(STYLES);
  const beardRoll = g.next();
  const beardKind = g.chance(0.7) ? "full" : "mustache";
  const canBeard = style === "short" || style === "curly" || style === "bald";
  return {
    skin: SKINS[skinIndex][0],
    shade: SKINS[skinIndex][1],
    hair,
    older,
    style,
    beard: canBeard && beardRoll < 0.35 ? beardKind : "none",
    glasses: g.chance(older ? 0.55 : 0.25),
    clothes: g.pick(CLOTHES),
    top: [g.f(0, 360), g.f(25, 60), g.f(35, 58)],
    inner: [g.f(0, 360), g.f(10, 40), g.f(78, 90)],
    scarf: [g.f(0, 360), g.f(30, 55), g.f(42, 62)],
    long: g.f(1.12, 1.28),
    eyeR: g.f(0.07, 0.1),
    browDrop: g.f(0.18, 0.26),
    arch: g.f(0.02, 0.1),
    mouthW: g.f(0.2, 0.34),
    curve: g.f(0.1, 0.28),
    part: g.f(-0.4, 0.4),
    left: g.f(0.15, 0.5),
    right: g.f(0.15, 0.5),
    bunX: g.f(-0.2, 0.2),
    curls: Array.from({ length: 9 }, () => g.f(0.28, 0.36)),
  };
}

/** What stands out about a person, for alt text: "curly hair and glasses". */
export function traits(p: Person): string {
  const hairs = {
    short: "short hair",
    long: "long hair",
    bun: "hair in a bun",
    curly: "curly hair",
    bald: "a bald head",
    bob: "a bob haircut",
    scarf: "a headscarf",
  };
  return andList([
    hairs[p.style],
    p.beard === "full" && "a beard",
    p.beard === "mustache" && "a mustache",
    p.glasses && "glasses",
  ]);
}

/** How the alt text names a person: "an older person with curly hair", or "one with ..." among friends. */
export function describe(p: Person, one = false): string {
  const who = one ? (p.older ? "an older one" : "one") : p.older ? "an older person" : "a person";
  return `${who} with ${traits(p)}`;
}

/** Hair that sits behind the head, as in the portrait. */
export function hairBehind(p: Person, cx: number, cy: number, rx: number, ry: number): string {
  if (p.style === "long")
    return el("path", {
      d: s`M ${cx - rx * 1.12} ${cy}
         Q ${cx - rx * 1.3} ${cy + ry * 1.6} ${cx - rx * 0.9} ${cy + ry * 1.95}
         H ${cx + rx * 0.9}
         Q ${cx + rx * 1.3} ${cy + ry * 1.6} ${cx + rx * 1.12} ${cy}
         Z`,
      fill: p.hair,
    });
  if (p.style === "bob")
    return el("rect", {
      x: cx - rx * 1.18,
      y: cy - ry * 0.3,
      width: rx * 2.36,
      height: ry * 1.2,
      rx: rx * 0.4,
      fill: p.hair,
    });
  if (p.style === "bun") return el("circle", { cx: cx + rx * p.bunX, cy: cy - ry * 1.08, r: rx * 0.42, fill: p.hair });
  return "";
}

/** How far below the head's center the shoulders sit, in head radii: a short neck shows under the chin. */
export const SHOULDER = 1.38;

/** The neck and a torso `sw` wide each side, from the shoulders down to `bottom`, with a neckline. */
export function bust(p: Person, cx: number, cy: number, rx: number, ry: number, sw: number, bottom: number): string {
  const top = cy + ry * SHOULDER;
  // The neck: short and sturdy, from under the jaw to the shoulders.
  let out = el("rect", {
    x: cx - rx * 0.37,
    y: cy + ry * 0.6,
    width: rx * 0.74,
    height: top - cy - ry * 0.45,
    fill: p.shade,
  });
  // The torso: rounded shoulders, then straight sides.
  out += el("path", {
    d: s`M ${cx - sw} ${bottom}
       V ${Math.min(bottom, top + ry * 0.45)}
       C ${cx - sw} ${top + ry * 0.05} ${cx - sw * 0.6} ${top} ${cx} ${top}
       C ${cx + sw * 0.6} ${top} ${cx + sw} ${top + ry * 0.05} ${cx + sw} ${Math.min(bottom, top + ry * 0.45)}
       V ${bottom}
       Z`,
    fill: paint(p.top),
  });
  if (p.clothes === "jacket")
    // An open jacket over a light shirt.
    out += el("path", {
      d: s`M ${cx - rx * 0.5} ${top - 1} H ${cx + rx * 0.5} L ${cx + rx * 0.16} ${bottom} H ${cx - rx * 0.16} Z`,
      fill: paint(p.inner),
    });
  // The neckline: a scoop or a V of skin, edged with a band.
  const dip = p.clothes === "vneck" ? ry * 0.5 : p.clothes === "sweater" ? ry * 0.16 : ry * 0.28;
  const neck =
    p.clothes === "vneck"
      ? s`M ${cx - rx * 0.42} ${top - 1} L ${cx} ${top + dip} L ${cx + rx * 0.42} ${top - 1}`
      : s`M ${cx - rx * 0.42} ${top - 1} Q ${cx} ${top + dip * 2} ${cx + rx * 0.42} ${top - 1}`;
  out += el("path", { d: neck + " Z", fill: p.shade });
  out += el("path", {
    d: neck,
    fill: "none",
    stroke: p.clothes === "jacket" ? paint(p.inner, -14) : paint(p.top, -10),
    "stroke-width": rx * (p.clothes === "sweater" ? 0.16 : 0.08),
    "stroke-linejoin": "round",
  });
  if (p.clothes === "collar")
    // Two collar points either side of the neck.
    for (const side of [-1, 1])
      out += el("path", {
        d: s`M ${cx} ${top + ry * 0.24}
           L ${cx + side * rx * 0.54} ${top - ry * 0.08}
           L ${cx + side * rx * 0.42} ${top + ry * 0.34}
           Z`,
        fill: paint(p.inner),
      });
  return out;
}

/**
 * The outline of hair over the head: a dome with a parting at `part` (from the middle) and two swept
 * fringes whose depth `left` and `right` (0.15 to 0.5) vary. The fringes always stop well above the
 * brows, so the forehead shows under any hair color.
 */
export function hairline(cx: number, cy: number, rx: number, ry: number, part: number, left: number, right: number) {
  // Each fringe runs from the temple, up the side of the face, then sweeps in to the parting.
  const temple = (side: number) => s`${cx + side * rx * 0.97} ${cy - ry * 0.4}`;
  const sweep = (side: number, depth: number) =>
    s`${cx + side * rx * (0.35 + depth * 0.5)} ${cy - ry * (0.66 - depth * 0.3)}`;
  return s`M ${cx - rx * 1.04} ${cy + ry * 0.1}
     C ${cx - rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.04} ${cy + ry * 0.1}
     C ${temple(1)} ${sweep(1, right)} ${cx + part} ${cy - ry * 0.7}
     C ${sweep(-1, left)} ${temple(-1)} ${cx - rx * 1.04} ${cy + ry * 0.1}
     Z`;
}

/**
 * The head over the neck: ears, face, hair or headscarf, beard and features, as in the portrait.
 * Looking "down" draws lowered lids instead of open eyes.
 */
export function head(
  p: Person,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  look: "ahead" | "down" = "ahead",
): string {
  let out = "";
  if (p.style === "scarf") {
    // A headscarf: a dome over the head that drapes over the neck and shoulders.
    out += el("path", {
      d: s`M ${cx - rx * 1.2} ${cy + ry * 0.2}
         C ${cx - rx * 1.3} ${cy - ry * 1.5} ${cx + rx * 1.3} ${cy - ry * 1.5} ${cx + rx * 1.2} ${cy + ry * 0.2}
         C ${cx + rx * 1.25} ${cy + ry * 1.0} ${cx + rx * 1.6} ${cy + ry * 1.45} ${cx + rx * 1.75} ${cy + ry * 1.9}
         Q ${cx} ${cy + ry * 2.3} ${cx - rx * 1.75} ${cy + ry * 1.9}
         C ${cx - rx * 1.6} ${cy + ry * 1.45} ${cx - rx * 1.25} ${cy + ry * 1.0} ${cx - rx * 1.2} ${cy + ry * 0.2}
         Z`,
      fill: paint(p.scarf),
    });
    // A soft fold under the chin.
    out += el("path", {
      d: s`M ${cx - rx * 0.9} ${cy + ry * 0.95} Q ${cx} ${cy + ry * 1.45} ${cx + rx * 0.9} ${cy + ry * 0.95}`,
      fill: "none",
      stroke: paint(p.scarf, -12),
      "stroke-width": rx * 0.07,
      "stroke-linecap": "round",
    });
    // The face, framed by the scarf.
    out += el("ellipse", { cx, cy: cy + ry * 0.06, rx: rx * 0.88, ry: ry * 0.92, fill: p.skin });
  } else {
    // Ears and head.
    for (const side of [-1, 1])
      out += el("ellipse", {
        cx: cx + side * rx * 0.97,
        cy: cy + ry * 0.08,
        rx: rx * 0.16,
        ry: ry * 0.2,
        fill: p.skin,
      });
    out += el("ellipse", { cx, cy, rx, ry, fill: p.skin });
  }
  // Hair in front.
  if (p.style === "curly") {
    // Nine curls in an arc over the top of the head.
    let curls = "";
    for (let curl = 0; curl < 9; curl++) {
      const angle = Math.PI * (1.05 + (curl / 8) * 0.9);
      curls += el("circle", {
        cx: cx + Math.cos(angle) * rx * 0.95,
        cy: cy - ry * 0.15 + Math.sin(angle) * ry * 0.9,
        r: rx * p.curls[curl],
      });
    }
    out += el("g", { fill: p.hair }, curls);
  }
  if (p.style !== "bald" && p.style !== "scarf")
    out += el("path", { d: hairline(cx, cy, rx, ry, rx * p.part, p.left, p.right), fill: p.hair });
  if (p.beard === "full")
    // A beard along the jaw, leaving the mouth clear.
    out += el("path", {
      d: s`M ${cx - rx * 0.98} ${cy + ry * 0.05}
         C ${cx - rx} ${cy + ry * 1.4} ${cx + rx} ${cy + ry * 1.4} ${cx + rx * 0.98} ${cy + ry * 0.05}
         L ${cx + rx * 0.8} ${cy + ry * 0.2}
         Q ${cx + rx * 0.72} ${cy + ry * 0.76} ${cx} ${cy + ry * 0.78}
         Q ${cx - rx * 0.72} ${cy + ry * 0.76} ${cx - rx * 0.8} ${cy + ry * 0.2}
         Z`,
      fill: p.hair,
    });

  // Features.
  const eyeY = cy + ry * 0.05;
  const eyeX = rx * 0.38;
  const eyeR = rx * p.eyeR;
  const browDrop = ry * (p.browDrop - (look === "down" ? 0.03 : 0));
  const pair = (y: number, apart: number, r: number) =>
    el("circle", { cx: cx - apart, cy: y, r }) + el("circle", { cx: cx + apart, cy: y, r });
  // Cheeks.
  out += el("g", { fill: "#e8766b", opacity: "0.25" }, pair(cy + ry * 0.36, rx * 0.55, rx * 0.16));
  // Strokes share a group: lids or brows, nose, smile, mustache.
  let lines = "";
  if (look === "down") {
    // Lowered lids: a short downward curve for each eye.
    let lids = "";
    for (const side of [-1, 1])
      lids += s`M ${cx + side * eyeX - eyeR * 1.5} ${eyeY}
               Q ${cx + side * eyeX} ${eyeY + eyeR * 1.6} ${cx + side * eyeX + eyeR * 1.5} ${eyeY} `;
    lines += el("path", { d: lids, stroke: "#2a2320", "stroke-width": rx * 0.06 });
  } else out += el("g", { fill: "#2a2320" }, pair(eyeY, eyeX, eyeR));
  // Brows: one arched stroke over each eye, in a single path.
  let brows = "";
  for (const side of [-1, 1])
    brows += s`M ${cx + side * eyeX - rx * 0.14} ${eyeY - browDrop}
             Q ${cx + side * eyeX} ${eyeY - browDrop - ry * p.arch} ${cx + side * eyeX + rx * 0.14} ${eyeY - browDrop} `;
  lines += el("path", {
    d: brows,
    stroke: p.style === "bald" && p.beard === "none" ? p.shade : p.hair,
    "stroke-width": rx * 0.06,
  });
  // The nose.
  lines += el("path", {
    d: s`M ${cx} ${eyeY + ry * 0.1}
       Q ${cx + rx * 0.12} ${eyeY + ry * 0.3} ${cx} ${eyeY + ry * 0.33}`,
    stroke: p.shade,
    "stroke-width": rx * 0.045,
  });
  // The smile.
  const mouthY = cy + ry * 0.55;
  const mouthW = rx * p.mouthW;
  lines += el("path", {
    d: s`M ${cx - mouthW} ${mouthY}
       Q ${cx} ${mouthY + ry * p.curve} ${cx + mouthW} ${mouthY}`,
    stroke: "#7a3b33",
    "stroke-width": rx * 0.06,
  });
  if (p.beard !== "none")
    // A mustache over the smile.
    lines += el("path", {
      d: s`M ${cx - rx * 0.32} ${mouthY - ry * 0.04}
         Q ${cx} ${mouthY - ry * 0.2} ${cx + rx * 0.32} ${mouthY - ry * 0.04}`,
      stroke: p.hair,
      "stroke-width": ry * 0.1,
    });
  out += el("g", { fill: "none", "stroke-linecap": "round" }, lines);
  if (p.glasses)
    // Glasses: two round lenses joined by a bridge.
    out += el(
      "g",
      { fill: "none", stroke: "#222", "stroke-width": rx * 0.05 },
      pair(eyeY, eyeX, rx * 0.22),
      el("path", { d: s`M ${cx - eyeX + rx * 0.22} ${eyeY} H ${cx + eyeX - rx * 0.22}` }),
    );
  return out;
}

/** Head and hair, from the top of a bun or curls down to the chin, as [x, y, width, height]. */
export function headBox(p: Person, cx: number, cy: number, rx: number, ry: number): [number, number, number, number] {
  const top = p.style === "bun" ? 1.55 : p.style === "curly" ? 1.4 : 1.3;
  return [cx - rx * 1.25, cy - ry * top, rx * 2.5, ry * (top + 1.15)];
}

/** A whole upper body: hair behind, torso, then the head, which may lean by `tilt` degrees. */
export function figure(
  p: Person,
  cx: number,
  cy: number,
  rx: number,
  sw: number,
  bottom: number,
  tilt = 0,
  look: "ahead" | "down" = "ahead",
): string {
  const ry = rx * p.long;
  const lean = (inner: string) =>
    tilt && inner ? el("g", { transform: s`rotate(${tilt} ${cx} ${cy + ry})` }, inner) : inner;
  return (
    lean(hairBehind(p, cx, cy, rx, ry)) + bust(p, cx, cy, rx, ry, sw, bottom) + lean(head(p, cx, cy, rx, ry, look))
  );
}

/** A sleeved arm from the shoulder through the elbow to the hand, without the hand. */
export function arm(p: Person, rx: number, from: Point, elbow: Point, hand: Point): string {
  return el("path", {
    d: s`M ${from[0]} ${from[1]} L ${elbow[0]} ${elbow[1]} L ${hand[0]} ${hand[1]}`,
    fill: "none",
    stroke: paint(p.top, -6),
    "stroke-width": rx * 0.58,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
}

export const hand = (p: Person, x: number, y: number, rx: number) =>
  el("circle", { cx: x, cy: y, r: rx * 0.24, fill: p.skin });

/** Sets up a half-length figure: head size and place, shoulder width. */
export function halfLength(g: Rand, p: Person, w: number, h: number, shift = 0) {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.1, 0.115);
  const ry = rx * p.long;
  const cx = w / 2 + shift;
  const cy = h / 2 - ry * 1.0;
  return { unit, rx, ry, cx, cy, sw: rx * g.f(1.75, 2.05), shoulderY: cy + ry * SHOULDER };
}

export const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A desk across the picture from `top` down: a surface with a soft edge line. */
export function desk(w: number, h: number, top: number, wood: string): string {
  return (
    el("rect", { y: top, width: w, height: h - top, fill: wood }) +
    el("rect", { y: top, width: w, height: Math.max(1.5, h * 0.008), fill: "#000", opacity: "0.08" })
  );
}
