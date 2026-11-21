import { defineKind, el, facing, fill, hsl, lin, qpt, s, type Point, type Rand } from "./core";
import { andList } from "./words";

// The portrait's skin tones, each with a shade for the neck, nose and ears.
const SKINS = [
  ["#f6d5c1", "#e2b49b"],
  ["#eec1a2", "#d69f7e"],
  ["#d9a17e", "#bd8361"],
  ["#b97b56", "#9a6141"],
  ["#8d5a3b", "#734629"],
  ["#5e3b27", "#4a2d1c"],
] as const;
// The portrait's hair colors, split so darker skin mostly gets darker hair, plus greys for older people.
const DARK_HAIR = ["#2b1d16", "#4a2f1f", "#1d1d24"];
const LIGHT_HAIR = ["#7b4a26", "#c58a3d", "#e3c27a", "#a33b20"];
const GREY_HAIR = ["#8f8f95", "#c4c4c8"];
// Repeats make the common styles commoner.
const STYLES = ["short", "short", "long", "long", "curly", "curly", "bun", "bob", "bald", "scarf"] as const;
const CLOTHES = ["tee", "vneck", "collar", "jacket", "sweater"] as const;
type Style = (typeof STYLES)[number];
/** A color as hue, saturation and lightness, so a kind can shade it. */
type Tone = readonly [number, number, number];
const paint = (tone: Tone, lighten = 0): string => hsl(tone[0], tone[1], tone[2] + lighten);

/** Everything about one person that stays the same however big they're drawn. */
interface Person {
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
function person(g: Rand): Person {
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
function traits(p: Person): string {
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
function describe(p: Person, one = false): string {
  const who = one ? (p.older ? "an older one" : "one") : p.older ? "an older person" : "a person";
  return `${who} with ${traits(p)}`;
}

/** Hair that sits behind the head, as in the portrait. */
function hairBehind(p: Person, cx: number, cy: number, rx: number, ry: number): string {
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

/** The neck and a torso `sw` wide each side, from the shoulders down to `bottom`, with a neckline. */
function bust(p: Person, cx: number, cy: number, rx: number, ry: number, sw: number, bottom: number): string {
  const top = cy + ry * 1.55;
  // The neck.
  let out = el("rect", {
    x: cx - rx * 0.32,
    y: cy + ry * 0.6,
    width: rx * 0.64,
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
      d: s`M ${cx - rx * 0.42} ${top - 1} H ${cx + rx * 0.42} L ${cx + rx * 0.16} ${bottom} H ${cx - rx * 0.16} Z`,
      fill: paint(p.inner),
    });
  // The neckline: a scoop or a V of skin, edged with a band.
  const dip = p.clothes === "vneck" ? ry * 0.5 : p.clothes === "sweater" ? ry * 0.16 : ry * 0.28;
  const neck =
    p.clothes === "vneck"
      ? s`M ${cx - rx * 0.34} ${top - 1} L ${cx} ${top + dip} L ${cx + rx * 0.34} ${top - 1}`
      : s`M ${cx - rx * 0.34} ${top - 1} Q ${cx} ${top + dip * 2} ${cx + rx * 0.34} ${top - 1}`;
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
           L ${cx + side * rx * 0.46} ${top - ry * 0.08}
           L ${cx + side * rx * 0.34} ${top + ry * 0.34}
           Z`,
        fill: paint(p.inner),
      });
  return out;
}

/**
 * The head over the neck: ears, face, hair or headscarf, beard and features, as in the portrait.
 * Looking "down" draws lowered lids instead of open eyes.
 */
function head(p: Person, cx: number, cy: number, rx: number, ry: number, look: "ahead" | "down" = "ahead"): string {
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
    // The hairline: a dome over the head, with a parting and two swept fringes.
    out += el("path", {
      d: s`M ${cx - rx * 1.04} ${cy + ry * 0.1}
         C ${cx - rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.1} ${cy - ry * 1.38} ${cx + rx * 1.04} ${cy + ry * 0.1}
         Q ${cx + rx * 0.9} ${cy - ry * p.right} ${cx + rx * p.part} ${cy - ry * 0.6}
         Q ${cx - rx * 0.8} ${cy - ry * p.left} ${cx - rx * 1.04} ${cy + ry * 0.1}
         Z`,
      fill: p.hair,
    });
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
function headBox(p: Person, cx: number, cy: number, rx: number, ry: number): [number, number, number, number] {
  const top = p.style === "bun" ? 1.55 : p.style === "curly" ? 1.4 : 1.3;
  return [cx - rx * 1.25, cy - ry * top, rx * 2.5, ry * (top + 1.15)];
}

/** A whole upper body: hair behind, torso, then the head, which may lean by `tilt` degrees. */
function figure(
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
function arm(p: Person, rx: number, from: Point, elbow: Point, hand: Point): string {
  return el("path", {
    d: s`M ${from[0]} ${from[1]} L ${elbow[0]} ${elbow[1]} L ${hand[0]} ${hand[1]}`,
    fill: "none",
    stroke: paint(p.top, -6),
    "stroke-width": rx * 0.58,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
}

const hand = (p: Person, x: number, y: number, rx: number) =>
  el("circle", { cx: x, cy: y, r: rx * 0.24, fill: p.skin });

/** Sets up a half-length figure: head size and place, shoulder width. */
function halfLength(g: Rand, p: Person, w: number, h: number, shift = 0) {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.1, 0.115);
  const ry = rx * p.long;
  const cx = w / 2 + shift;
  const cy = h / 2 - ry * 1.0;
  return { unit, rx, ry, cx, cy, sw: rx * g.f(1.75, 2.05), shoulderY: cy + ry * 1.55 };
}

/** A half-length figure reading a book, in an armchair or by a window. */
export const reader = defineKind("reader", "Reading", (g, w, h, note) => {
  const p = person(g.fork("person"));
  // The side the window or lamp is on; the reader sits a little off to the other side.
  const side = g.chance(0.5) ? 1 : -1;
  const unit = Math.min(w, h);
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h, -side * Math.min(w * 0.1, unit * 0.12));
  const hue = g.f(0, 360);
  const inChair = g.chance(0.5);
  const chair: Tone = [g.f(0, 360), g.f(25, 45), g.f(38, 55)];
  let out = fill(w, h, hsl(hue, 28, 84));

  if (inChair) {
    // A floor lamp beside the chair, its shade glowing.
    const lampX = cx + side * (sw * 1.5 + rx * 1.4);
    const lampTop = cy - ry * 0.6;
    out += el("rect", { x: lampX - rx * 0.05, y: lampTop, width: rx * 0.1, height: h - lampTop, fill: "#5a5048" });
    out += el("circle", { cx: lampX, cy: lampTop + rx * 0.5, r: rx * 1.3, fill: "#fff6d8", opacity: "0.5" });
    out += el("path", {
      d: s`M ${lampX - rx * 0.45} ${lampTop - rx * 0.7} H ${lampX + rx * 0.45}
         L ${lampX + rx * 0.75} ${lampTop + rx * 0.2} H ${lampX - rx * 0.75} Z`,
      fill: hsl(hue + 30, 45, 78),
    });
    // The chair's high back behind the reader.
    out += el("rect", {
      x: cx - sw * 1.45,
      y: cy + ry * 0.25,
      width: sw * 2.9,
      height: h,
      rx: rx * 0.9,
      fill: paint(chair),
    });
  } else {
    // A window with a cross of glazing bars and a sill.
    const winW = unit * 0.44;
    const winH = unit * 0.52;
    const winX = side > 0 ? cx + sw + rx * 1.1 : cx - sw - rx * 1.1 - winW;
    const winY = cy - ry * 1.1;
    const sky = g.id("sky");
    const frame = hsl(hue, 18, 95);
    out += el("defs", {}, lin(sky, [hsl(g.f(195, 220), 55, 78), hsl(g.f(30, 60), 70, 90)]));
    out += el("rect", { x: winX, y: winY, width: winW, height: winH, fill: frame });
    const pane = rx * 0.18;
    out += el("rect", {
      x: winX + pane,
      y: winY + pane,
      width: winW - pane * 2,
      height: winH - pane * 2,
      fill: `url(#${sky})`,
    });
    out += el("path", {
      d: s`M ${winX + winW / 2} ${winY} V ${winY + winH} M ${winX} ${winY + winH * 0.45} H ${winX + winW}`,
      stroke: frame,
      "stroke-width": pane,
    });
    out += el("rect", {
      x: winX - rx * 0.25,
      y: winY + winH,
      width: winW + rx * 0.5,
      height: rx * 0.22,
      fill: hsl(hue, 15, 90),
    });
    out += el("rect", {
      x: winX - rx * 0.25,
      y: winY + winH + rx * 0.22,
      width: winW + rx * 0.5,
      height: rx * 0.08,
      fill: "#000",
      opacity: "0.08",
    });
  }

  out += figure(p, cx, cy, rx, sw, h + 2, side * g.f(-3, -7), "down");

  // The book, held open at the chest with its cover toward us.
  const bx = cx;
  const by = shoulderY + ry * 1.35;
  const bw = rx * 2.2;
  const bh = rx * 1.45;
  const sag = bh * 0.08;
  const handY = by + bh * 0.22;
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.78, shoulderY + ry * 0.35],
      [cx + k * sw * 0.98, by + bh * 0.55],
      [bx + k * bw * 0.42, handY],
    );
  // Pages, just showing over the cover.
  out += el("path", {
    d: s`M ${bx - bw * 0.47} ${by - bh / 2 - sag * 0.6}
       Q ${bx - bw * 0.25} ${by - bh / 2 - sag * 1.6} ${bx} ${by - bh / 2 + sag * 0.6}
       Q ${bx + bw * 0.25} ${by - bh / 2 - sag * 1.6} ${bx + bw * 0.47} ${by - bh / 2 - sag * 0.6}
       V ${by} H ${bx - bw * 0.47} Z`,
    fill: "#f5f0e4",
  });
  const cover: Tone = [g.f(0, 360), g.f(35, 60), g.f(35, 52)];
  for (const k of [-1, 1])
    out += el("path", {
      d: s`M ${bx} ${by - bh / 2 + sag} L ${bx + (k * bw) / 2} ${by - bh / 2}
         V ${by + bh / 2} L ${bx} ${by + bh / 2 + sag} Z`,
      fill: paint(cover, k > 0 ? 6 : 0),
    });
  for (const k of [-1, 1]) out += hand(p, bx + k * bw * 0.42, handY, rx);

  if (inChair)
    // The chair's arms, in front of the reader's elbows.
    for (const k of [-1, 1]) {
      const armTop = by + bh * 0.75;
      out += el("rect", {
        x: k < 0 ? cx - sw * 1.6 : cx + sw * 1.6 - sw * 0.6,
        y: armTop,
        width: sw * 0.6,
        height: h,
        rx: rx * 0.35,
        fill: paint(chair, 7),
      });
    }

  note.alt(`${capital(describe(p))} reading a book ${inChair ? "in an armchair" : "by a window"}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A mug on a surface at `bottom`, with a handle on one side and a wisp of steam. */
function mug(x: number, bottom: number, size: number, color: string, handle: number): string {
  const mw = size * 0.75;
  const mh = size * 0.85;
  let out = el("ellipse", {
    cx: x + (handle * mw) / 2,
    cy: bottom - mh * 0.5,
    rx: size * 0.2,
    ry: size * 0.22,
    fill: "none",
    stroke: color,
    "stroke-width": size * 0.09,
  });
  out += el("rect", { x: x - mw / 2, y: bottom - mh, width: mw, height: mh, rx: size * 0.1, fill: color });
  out += el("ellipse", { cx: x, cy: bottom - mh, rx: mw / 2, ry: size * 0.07, fill: "#000", opacity: "0.15" });
  out += el("path", {
    d: s`M ${x} ${bottom - mh - size * 0.15} q ${size * 0.12} ${-size * 0.18} 0 ${-size * 0.36} t 0 ${-size * 0.36}`,
    fill: "none",
    stroke: "#fff",
    "stroke-width": size * 0.06,
    "stroke-linecap": "round",
    opacity: "0.55",
  });
  return out;
}

/** A potted plant on a surface at `bottom`: a pot and a fan of leaves. */
function plant(g: Rand, x: number, bottom: number, size: number): string {
  const pot = hsl(g.f(0, 40), g.f(35, 55), g.f(45, 62));
  const leaf = hsl(g.f(95, 150), g.f(30, 50), g.f(32, 45));
  const potTop = bottom - size * 0.75;
  let out = "";
  const leaves = g.i(4, 6);
  for (let k = 0; k < leaves; k++) {
    const angle = -70 + (140 * k) / (leaves - 1) + g.f(-8, 8);
    const len = size * g.f(0.55, 0.8);
    out += el("ellipse", {
      cx: x,
      cy: potTop - len / 2,
      rx: size * 0.13,
      ry: len / 2,
      fill: leaf,
      transform: s`rotate(${angle} ${x} ${potTop})`,
    });
  }
  out += el("path", {
    d: s`M ${x - size * 0.42} ${potTop} H ${x + size * 0.42} L ${x + size * 0.32} ${bottom} H ${x - size * 0.32} Z`,
    fill: pot,
  });
  return out;
}

/** A desk across the picture from `top` down: a surface with a soft edge line. */
function desk(w: number, h: number, top: number, wood: string): string {
  return (
    el("rect", { y: top, width: w, height: h - top, fill: wood }) +
    el("rect", { y: top, width: w, height: Math.max(1.5, h * 0.008), fill: "#000", opacity: "0.08" })
  );
}

/** A half-length figure working at a laptop on a desk, sometimes with a mug or a plant. */
export const worker = defineKind("worker", "At a laptop", (g, w, h, note) => {
  const p = person(g.fork("person"));
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h);
  const hue = g.f(0, 360);
  const deskY = cy + ry * 3.05;
  let out = fill(w, h, hsl(hue, 25, 86));

  // Sometimes a framed picture on the wall behind.
  const side = g.chance(0.5) ? 1 : -1;
  if (g.chance(0.55)) {
    const fw = rx * 2.2;
    const fh = rx * 1.6;
    const fx = cx + side * (sw + rx * 1.8) - fw / 2;
    const fy = cy - ry * 0.8;
    out += el("rect", { x: fx, y: fy, width: fw, height: fh, fill: hsl(hue + 20, 20, 35) });
    out += el("rect", {
      x: fx + rx * 0.15,
      y: fy + rx * 0.15,
      width: fw - rx * 0.3,
      height: fh - rx * 0.3,
      fill: hsl(hue + 180, 35, 80),
    });
    out += el("path", {
      d: s`M ${fx + rx * 0.15} ${fy + fh - rx * 0.15} L ${fx + fw * 0.4} ${fy + fh * 0.45}
         L ${fx + fw * 0.6} ${fy + fh * 0.65} L ${fx + fw * 0.75} ${fy + fh * 0.5} L ${fx + fw - rx * 0.15} ${fy + fh - rx * 0.15} Z`,
      fill: hsl(hue + 150, 30, 55),
    });
  }

  out += figure(p, cx, cy, rx, sw, deskY + 2, g.f(-3, 3));
  // Arms reaching down to the keyboard, behind the screen.
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.8, shoulderY + ry * 0.35],
      [cx + k * sw * 1.02, deskY - ry * 0.3],
      [cx + k * rx * 0.9, deskY],
    );
  out += desk(w, h, deskY, hsl(g.f(20, 45), g.f(20, 45), g.f(50, 72)));

  // The laptop, seen from behind its open screen.
  const lw = rx * 3.1;
  const lh = rx * 1.85;
  const lidBottom = deskY + Math.min((h - deskY) * 0.4, ry * 0.6);
  const lx = cx + rx * g.f(-0.3, 0.3);
  const lid = g.pick(["#c9ccd2", "#3a3d44", "#e4e1dc", hsl(g.f(0, 360), 25, 70)]);
  out += el("ellipse", { cx: lx, cy: lidBottom, rx: lw * 0.55, ry: rx * 0.12, fill: "#000", opacity: "0.12" });
  out += el("rect", { x: lx - lw / 2, y: lidBottom - lh, width: lw, height: lh, rx: rx * 0.12, fill: lid });
  out += el("circle", { cx: lx, cy: lidBottom - lh / 2, r: rx * 0.17, fill: "#fff", opacity: "0.35" });

  // Things on the desk either side.
  const things: string[] = [];
  const thingBottom = lidBottom + rx * 0.05;
  if (g.chance(0.7)) {
    out += mug(lx + side * (lw / 2 + rx * 1.0), thingBottom, rx, hsl(g.f(0, 360), g.f(30, 60), g.f(45, 70)), side);
    things.push("a mug");
  }
  if (g.chance(0.55)) {
    out += plant(g.fork("plant"), lx - side * (lw / 2 + rx * 1.1), thingBottom, rx * 1.3);
    things.push("a plant");
  }

  note.alt(`${capital(describe(p))} working at a laptop${things.length ? ` beside ${andList(things)}` : ""}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});

/** A half-length figure at a café table, holding a cup in both hands. */
export const cafe = defineKind("cafe", "Café", (g, w, h, note) => {
  const p = person(g.fork("person"));
  const { rx, ry, cx, cy, sw, shoulderY } = halfLength(g, p, w, h);
  const hue = g.f(10, 50);
  const tableY = cy + ry * 3.15;
  const side = g.chance(0.5) ? 1 : -1;
  // A warm wall with a darker panel along the bottom.
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("rect", { y: cy + ry * 2.2, width: w, height: h, fill: hsl(hue + g.f(-20, 160), 25, 62) });
  out += el("rect", { y: cy + ry * 2.2, width: w, height: rx * 0.12, fill: "#000", opacity: "0.1" });
  // A pendant lamp hanging to one side.
  const lampX = cx + side * (sw + rx * g.f(1.3, 2.2));
  const lampY = cy - ry * g.f(0.2, 0.8);
  out += el("path", { d: s`M ${lampX} 0 V ${lampY}`, stroke: "#3b332e", "stroke-width": rx * 0.05 });
  out += el("circle", { cx: lampX, cy: lampY + rx * 0.5, r: rx * 0.9, fill: "#fff6d8", opacity: "0.45" });
  out += el("path", {
    d: s`M ${lampX - rx * 0.65} ${lampY + rx * 0.5} Q ${lampX - rx * 0.6} ${lampY - rx * 0.05} ${lampX} ${lampY - rx * 0.05}
       Q ${lampX + rx * 0.6} ${lampY - rx * 0.05} ${lampX + rx * 0.65} ${lampY + rx * 0.5} Z`,
    fill: hsl(hue + 180, 35, 40),
  });
  out += el("circle", { cx: lampX, cy: lampY + rx * 0.5, r: rx * 0.16, fill: "#fff3c4" });

  out += figure(p, cx, cy, rx, sw, tableY + 2, g.f(-4, 4));
  out += desk(w, h, tableY, hsl(g.f(15, 40), g.f(25, 45), g.f(38, 60)));

  // The cup, held up from the table in both hands, elbows resting on the table.
  const takeaway = g.chance(0.35);
  const size = rx * 1.05;
  const cupBottom = tableY - ry * 0.2;
  const cupH = takeaway ? size * 1.25 : size * 0.85;
  const cupTop = cupBottom - cupH;
  const handY = cupBottom - cupH * 0.42;
  const cup = takeaway ? hsl(g.f(0, 360), 15, 92) : hsl(g.f(0, 360), g.f(20, 55), g.f(55, 85));
  const elbowY = tableY + Math.min((h - tableY) * 0.3, ry * 0.4);
  for (const k of [-1, 1])
    out += arm(
      p,
      rx,
      [cx + k * sw * 0.8, shoulderY + ry * 0.35],
      [cx + k * sw * 1.0, elbowY],
      [cx + k * size * 0.5, handY],
    );
  if (takeaway) {
    // A paper cup with a sleeve and a lid.
    out += el("path", {
      d: s`M ${cx - size * 0.45} ${cupTop} H ${cx + size * 0.45} L ${cx + size * 0.36} ${cupBottom} H ${cx - size * 0.36} Z`,
      fill: cup,
    });
    out += el("path", {
      d: s`M ${cx - size * 0.42} ${cupTop + cupH * 0.3} H ${cx + size * 0.42} L ${cx + size * 0.4} ${cupTop + cupH * 0.65} H ${cx - size * 0.4} Z`,
      fill: hsl(g.f(20, 40), 40, 55),
    });
    out += el("rect", {
      x: cx - size * 0.5,
      y: cupTop - size * 0.14,
      width: size,
      height: size * 0.16,
      rx: size * 0.06,
      fill: hsl(g.f(0, 360), 10, 30),
    });
  } else {
    // A wide cup with a darker rim of coffee.
    out += el("path", {
      d: s`M ${cx - size * 0.5} ${cupTop} H ${cx + size * 0.5}
         Q ${cx + size * 0.48} ${cupBottom} ${cx} ${cupBottom} Q ${cx - size * 0.48} ${cupBottom} ${cx - size * 0.5} ${cupTop} Z`,
      fill: cup,
    });
    out += el("ellipse", { cx, cy: cupTop, rx: size * 0.5, ry: size * 0.1, fill: "#6b4430" });
  }
  // Steam.
  out += el("path", {
    d: s`M ${cx - size * 0.12} ${cupTop - size * 0.22} q ${size * 0.12} ${-size * 0.15} 0 ${-size * 0.3} t 0 ${-size * 0.3}
       M ${cx + size * 0.18} ${cupTop - size * 0.25} q ${size * 0.12} ${-size * 0.14} 0 ${-size * 0.28}`,
    fill: "none",
    stroke: "#fff",
    "stroke-width": size * 0.06,
    "stroke-linecap": "round",
    opacity: "0.6",
  });
  for (const k of [-1, 1]) out += hand(p, cx + k * size * 0.5, handY, rx);

  // Sometimes a pastry on a plate beside the cup.
  let extra = "";
  if (g.chance(0.5)) {
    const px = cx - side * (sw * 1.35 + rx * 0.4);
    const py = tableY + Math.min((h - tableY) * 0.35, ry * 0.5);
    out += el("ellipse", { cx: px, cy: py, rx: rx * 1.0, ry: rx * 0.26, fill: "#f4f1ec" });
    out += el("ellipse", { cx: px, cy: py - rx * 0.03, rx: rx * 0.75, ry: rx * 0.17, fill: "#000", opacity: "0.06" });
    // A croissant: a fat crescent with a few creases.
    out += el("path", {
      d: s`M ${px - rx * 0.75} ${py - rx * 0.05}
         Q ${px} ${py - rx * 0.85} ${px + rx * 0.75} ${py - rx * 0.05}
         Q ${px} ${py - rx * 0.25} ${px - rx * 0.75} ${py - rx * 0.05} Z`,
      fill: "#d9a050",
    });
    out += el("path", {
      d: s`M ${px - rx * 0.3} ${py - rx * 0.5} L ${px - rx * 0.22} ${py - rx * 0.22}
         M ${px} ${py - rx * 0.6} V ${py - rx * 0.26} M ${px + rx * 0.3} ${py - rx * 0.5} L ${px + rx * 0.22} ${py - rx * 0.22}`,
      stroke: "#b47a34",
      "stroke-width": rx * 0.05,
      "stroke-linecap": "round",
    });
    extra = " beside a croissant";
  }

  note.alt(`${capital(describe(p))} holding a ${takeaway ? "takeaway cup" : "cup of coffee"} at a café table${extra}`);
  note.focus(cx, cy + ry);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});

/** Two people side by side, head and shoulders, leaning in. Each varies on their own. */
export const pair = defineKind("pair", "Pair of friends", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.125, 0.145);
  const gap = rx * g.f(1.2, 1.35);
  const people = [person(g.fork("left")), person(g.fork("right"))];
  const front = g.i(0, 1);
  const drop = g.f(-0.18, 0.18);
  const hue = g.f(0, 360);
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("circle", { cx: w / 2, cy: h * 0.45, r: unit * 0.42, fill: "#fff", opacity: "0.25" });
  const place = (k: number) => {
    const p = people[k];
    const ry = rx * p.long;
    const cx = w / 2 + (k ? gap : -gap);
    const cy = h / 2 - ry * 0.3 + (k ? -drop : drop) * ry;
    return { p, ry, cx, cy };
  };
  for (const k of [1 - front, front]) {
    const { p, cx, cy } = place(k);
    // Heads lean in toward each other.
    out += figure(p, cx, cy, rx, rx * g.f(1.9, 2.2), h + 2, (k ? -1 : 1) * g.f(3, 7));
  }
  const { p, ry, cx, cy } = place(front);
  const other = people[1 - front];
  note.alt(`Two smiling friends side by side, ${describe(p, true)} and ${describe(other, true)}`);
  note.focus(w / 2, cy);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});

/** Three people, head and shoulders, close together like a team photo. The middle one stands in front. */
export const group = defineKind("group", "Group of three", (g, w, h, note) => {
  const unit = Math.min(w, h);
  const rx = unit * g.f(0.11, 0.125);
  const spread = rx * g.f(1.85, 2.05);
  const hue = g.f(0, 360);
  let out = fill(w, h, hsl(hue, 35, 82));
  out += el("rect", { y: h * 0.62, width: w, height: h, fill: hsl(hue + 20, 30, 74) });
  const people = [person(g.fork("left")), person(g.fork("middle")), person(g.fork("right"))];
  // Left and right stand a step back, so a little higher and smaller.
  for (const k of [0, 2]) {
    const p = people[k];
    const back = rx * 0.92;
    const cy = h / 2 - back * p.long * g.f(0.5, 0.75);
    out += figure(p, w / 2 + (k - 1) * spread, cy, back, back * g.f(1.9, 2.1), h + 2, (1 - k) * g.f(2, 5));
  }
  const p = people[1];
  const ry = rx * p.long;
  const cx = w / 2;
  const cy = h / 2 - ry * g.f(0.0, 0.2);
  out += figure(p, cx, cy, rx, rx * g.f(1.95, 2.15), h + 2, g.f(-3, 3));
  note.alt(
    `Three smiling people close together for a group photo, the ${p.older ? "older one" : "one"} in the middle with ${traits(p)}`,
  );
  note.focus(cx, cy);
  note.frame(...headBox(p, cx, cy, rx, ry));
  return out;
});

const PLACES = ["beach", "park", "hill"] as const;

/** A small figure walking through a landscape, seen from the side, sometimes with a dog. */
export const walker = defineKind("walker", "Out for a walk", { place: PLACES, dog: [true, false] }, (g, w, h, note) => {
  const p = person(g.fork("person"));
  const unit = Math.min(w, h);
  const place = g.option("place", g.pick(PLACES));
  const withDog = g.option("dog", g.chance(0.45));
  const fig = unit * g.f(0.37, 0.42);
  const dir = g.chance(0.5) ? 1 : -1;
  const anchor = w * g.f(0.38, 0.62);
  const x = anchor - (withDog ? dir * fig * 0.25 : 0);
  const skyHue = g.f(190, 215);
  const sky = g.id("sky");
  let out = el("defs", {}, lin(sky, [hsl(skyHue, 55, 74), hsl(skyHue + 25, 60, 92)]));
  out += fill(w, h, `url(#${sky})`);
  // The sun, away from the walker.
  out += el("circle", {
    cx: anchor > w / 2 ? w * g.f(0.1, 0.3) : w * g.f(0.7, 0.9),
    cy: h * g.f(0.15, 0.3),
    r: unit * g.f(0.06, 0.09),
    fill: hsl(g.f(40, 55), 90, 88),
  });
  let fy: number;
  if (place === "beach") {
    // Sea to the horizon, a line of surf, then sand.
    const horizon = h * g.f(0.5, 0.58);
    const shore = h * g.f(0.66, 0.72);
    out += el("rect", { y: horizon, width: w, height: h, fill: hsl(skyHue - 5, 50, 52) });
    let wave = s`M 0 ${shore}`;
    const waves = Math.max(3, Math.round(w / (unit * 0.3)));
    for (let k = 0; k < waves; k++) wave += s` q ${w / waves / 2} ${-unit * 0.025} ${w / waves} 0`;
    out += el("path", { d: wave + s` V ${h} H 0 Z`, fill: hsl(skyHue - 10, 35, 88) });
    out += el("path", {
      d: wave + s` V ${h} H 0 Z`,
      fill: hsl(g.f(35, 45), 50, 80),
      transform: s`translate(0 ${unit * 0.03})`,
    });
    fy = h * 0.86;
  } else if (place === "park") {
    // A line of round trees behind the grass, and a path across it.
    const edge = h * g.f(0.6, 0.66);
    const leaf = hsl(g.f(95, 130), 32, 42);
    const trees = Math.max(2, Math.round(w / unit) + 1);
    for (let k = 0; k < trees; k++) {
      const tx = (w * (k + g.f(0.2, 0.8))) / trees;
      const tr = unit * g.f(0.08, 0.12);
      out += el("rect", { x: tx - tr * 0.12, y: edge - tr * 1.6, width: tr * 0.24, height: tr * 1.7, fill: "#6d5444" });
      out += el("circle", { cx: tx, cy: edge - tr * 1.7, r: tr, fill: leaf });
    }
    out += el("rect", { y: edge, width: w, height: h, fill: hsl(g.f(85, 115), 38, 58) });
    out += el("rect", { y: h * 0.8, width: w, height: h * 0.1, fill: hsl(35, 30, 80) });
    fy = h * 0.86;
  } else {
    // Far hills, then a near hill with a footpath along it.
    out += el("path", {
      d: s`M 0 ${h * g.f(0.5, 0.6)} C ${w * 0.3} ${h * g.f(0.38, 0.48)} ${w * 0.6} ${h * g.f(0.56, 0.66)} ${w} ${h * g.f(0.46, 0.56)} V ${h} H 0 Z`,
      fill: hsl(g.f(100, 140), 25, 66),
    });
    fy = 0;
  }
  if (place === "hill") {
    const y0 = h * g.f(0.78, 0.86);
    const y1 = h * g.f(0.7, 0.8);
    const y2 = h * g.f(0.78, 0.86);
    const grass = hsl(g.f(85, 115), 38, 52);
    out += el("path", { d: s`M 0 ${y0} Q ${w / 2} ${y1} ${w} ${y2} V ${h} H 0 Z`, fill: grass });
    out += el("path", {
      d: s`M 0 ${y0 + fig * 0.08} Q ${w / 2} ${y1 + fig * 0.08} ${w} ${y2 + fig * 0.08}`,
      fill: "none",
      stroke: hsl(35, 30, 76),
      "stroke-width": fig * 0.1,
    });
    // With the control point at the middle, x runs evenly along the curve.
    fy = qpt([0, y0], [w / 2, y1], [w, y2], x / w)[1] + fig * 0.1;
  }

  // The walker, drawn facing right and mirrored to face left.
  const skin = p.skin;
  const r = fig * 0.09;
  const hx = x + fig * 0.02;
  const hy = fy - fig + r;
  const shoulderY = hy + r * 1.5;
  const hipY = fy - fig * 0.46;
  const tw = fig * 0.17;
  const shorts = place === "beach" || g.chance(0.2);
  const pants = hsl(g.f(190, 240), g.f(15, 35), g.f(28, 45));
  const limb = (pts: Point[], color: string, width: number) =>
    el("path", {
      d: "M " + pts.map(pt => s`${pt[0]} ${pt[1]}`).join(" L "),
      fill: "none",
      stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
  const leg = (knee: Point, foot: Point, darker: number) => {
    let legs = "";
    if (shorts) {
      legs += limb([knee, foot], p.shade, fig * 0.065);
      legs += limb(
        [
          [x, hipY],
          [(x + knee[0]) / 2 + (knee[0] - x) * 0.2, (hipY + knee[1]) / 2 + (knee[1] - hipY) * 0.2],
        ],
        pants,
        fig * 0.09,
      );
    } else legs += limb([[x, hipY], knee, foot], pants, fig * 0.08);
    legs += el("ellipse", {
      cx: foot[0] + fig * 0.03,
      cy: fy - fig * 0.022,
      rx: fig * 0.05,
      ry: fig * 0.024,
      fill: "#3a3a42",
    });
    return darker ? el("g", { opacity: "0.85" }, legs) : legs;
  };
  const sleeve = paint(p.top, -8);
  let body = facing(x, dir);
  // Shadow on the ground.
  body += el("ellipse", { cx: x, cy: fy, rx: fig * 0.2, ry: fig * 0.025, fill: "#000", opacity: "0.12" });
  // The far leg steps back, the near leg forward; the arms swing the other way.
  body += leg([x - fig * 0.05, hipY + fig * 0.24], [x - fig * 0.15, fy - fig * 0.03], 1);
  body += leg([x + fig * 0.09, hipY + fig * 0.22], [x + fig * 0.15, fy - fig * 0.03], 0);
  const farHand: Point = [x + fig * 0.14, shoulderY + fig * 0.25];
  body += limb(
    [[x, shoulderY + r * 0.3], [x + fig * 0.07, shoulderY + fig * 0.15], farHand],
    paint(p.top, -14),
    fig * 0.06,
  );
  body += el("circle", { cx: farHand[0], cy: farHand[1], r: fig * 0.034, fill: p.shade });
  // A backpack on the hill path.
  if (place === "hill" && g.chance(0.6))
    body += el("rect", {
      x: x - tw * 0.5 - fig * 0.09,
      y: shoulderY + fig * 0.02,
      width: fig * 0.13,
      height: fig * 0.22,
      rx: fig * 0.04,
      fill: hsl(g.f(0, 360), 40, 42),
    });
  // Neck and torso, leaning a little into the stride.
  body += el("rect", { x: hx - r * 0.35, y: hy + r * 0.5, width: r * 0.6, height: r * 1.2, fill: p.shade });
  body += el("path", {
    d: s`M ${x - tw / 2 + fig * 0.015} ${shoulderY + tw * 0.25}
       Q ${x - tw / 2 + fig * 0.015} ${shoulderY} ${x + fig * 0.015} ${shoulderY}
       Q ${x + tw / 2 + fig * 0.015} ${shoulderY} ${x + tw / 2 + fig * 0.015} ${shoulderY + tw * 0.25}
       L ${x + tw / 2} ${hipY + tw * 0.1} H ${x - tw / 2} Z`,
    fill: paint(p.top),
  });
  // The head in profile.
  if (p.style === "long")
    body += el("path", {
      d: s`M ${hx - r * 0.9} ${hy - r * 0.3} Q ${hx - r * 1.25} ${hy + r * 1.3} ${hx - r * 0.75} ${hy + r * 1.9}
         L ${hx - r * 0.1} ${hy + r * 1.7} L ${hx - r * 0.2} ${hy} Z`,
      fill: p.hair,
    });
  if (p.style === "bun") body += el("circle", { cx: hx - r * 0.8, cy: hy - r * 0.75, r: r * 0.42, fill: p.hair });
  if (p.style === "scarf") {
    body += el("path", {
      d: s`M ${hx + r * 0.8} ${hy - r * 0.5} Q ${hx + r * 0.3} ${hy - r * 1.3} ${hx - r * 0.5} ${hy - r * 1.05}
         Q ${hx - r * 1.3} ${hy - r * 0.6} ${hx - r * 1.1} ${hy + r * 0.6} Q ${hx - r * 1.1} ${hy + r * 1.5} ${hx - r * 0.3} ${hy + r * 1.9}
         Q ${hx + r * 0.5} ${hy + r * 1.8} ${hx + r * 0.6} ${hy + r * 1.1} Z`,
      fill: paint(p.scarf),
    });
    body += el("ellipse", { cx: hx + r * 0.35, cy: hy + r * 0.12, rx: r * 0.58, ry: r * 0.78, fill: skin });
  } else body += el("circle", { cx: hx, cy: hy, r, fill: skin });
  // The nose.
  body += el("path", {
    d: s`M ${hx + r * 0.88} ${hy - r * 0.1} Q ${hx + r * 1.2} ${hy + r * 0.2} ${hx + r * 0.86} ${hy + r * 0.3} Z`,
    fill: skin,
  });
  if (p.style !== "bald" && p.style !== "scarf") {
    // Hair: a cap over the top and back of the head.
    body += el("path", {
      d: s`M ${hx + r * 0.8} ${hy - r * 0.55}
         Q ${hx + r * 0.3} ${hy - r * 1.35} ${hx - r * 0.5} ${hy - r * 0.95}
         Q ${hx - r * 1.2} ${hy - r * 0.45} ${hx - r * 0.95} ${hy + r * 0.4}
         Q ${hx - r * 0.7} ${hy + r * 0.75} ${hx - r * 0.35} ${hy + r * 0.55}
         Q ${hx - r * 0.5} ${hy - r * 0.1} ${hx} ${hy - r * 0.35}
         Q ${hx + r * 0.45} ${hy - r * 0.45} ${hx + r * 0.8} ${hy - r * 0.55} Z`,
      fill: p.hair,
    });
    if (p.style === "curly")
      for (let k = 0; k < 5; k++) {
        const angle = Math.PI * (0.85 + k * 0.17);
        body += el("circle", {
          cx: hx + Math.cos(angle) * r * 0.85,
          cy: hy - r * 0.1 - Math.abs(Math.sin(angle)) * r * 0.75,
          r: r * p.curls[k],
          fill: p.hair,
        });
      }
  }
  if (p.beard === "full")
    body += el("path", {
      d: s`M ${hx - r * 0.25} ${hy + r * 0.2} Q ${hx - r * 0.1} ${hy + r * 1.05} ${hx + r * 0.6} ${hy + r * 0.95}
         Q ${hx + r * 0.9} ${hy + r * 0.8} ${hx + r * 0.85} ${hy + r * 0.6} Q ${hx + r * 0.35} ${hy + r * 0.75} ${hx + r * 0.1} ${hy + r * 0.2} Z`,
      fill: p.hair,
    });
  if (p.style !== "scarf")
    body += el("ellipse", { cx: hx - r * 0.12, cy: hy + r * 0.08, rx: r * 0.15, ry: r * 0.22, fill: p.shade });
  // Eye and smile.
  body += el("circle", { cx: hx + r * 0.52, cy: hy - r * 0.02, r: r * 0.11, fill: "#2a2320" });
  body += el("path", {
    d: s`M ${hx + r * 0.45} ${hy + r * 0.45} Q ${hx + r * 0.65} ${hy + r * 0.62} ${hx + r * 0.82} ${hy + r * 0.45}`,
    fill: "none",
    stroke: "#7a3b33",
    "stroke-width": r * 0.1,
    "stroke-linecap": "round",
  });
  if (p.glasses)
    body += el("path", {
      d: s`M ${hx - r * 0.1} ${hy - r * 0.05} H ${hx + r * 0.32} M ${hx + r * 0.52} ${hy - r * 0.02} m ${-r * 0.2} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 ${r * 0.4} 0 a ${r * 0.2} ${r * 0.2} 0 1 0 ${-r * 0.4} 0`,
      fill: "none",
      stroke: "#222",
      "stroke-width": r * 0.08,
    });
  // The near arm swings back.
  const nearHand: Point = [x - fig * 0.11, shoulderY + fig * 0.26];
  body += limb([[x, shoulderY + r * 0.3], [x - fig * 0.05, shoulderY + fig * 0.15], nearHand], sleeve, fig * 0.065);
  body += el("circle", { cx: nearHand[0], cy: nearHand[1], r: fig * 0.036, fill: skin });

  if (withDog) {
    // A dog trotting ahead on a lead.
    const d = fig * 0.32;
    const dx = x + fig * 0.55;
    const coat = g.pick(["#c8894b", "#3b2f2a", "#e9dcc4", "#8a6a4f", "#d9b27c"]);
    const dark = g.pick(["#5a3d27", "#2a211d", "#8a6a4f"]);
    const leash: Point = [dx + d * 0.42, fy - d * 0.84];
    body += limb(
      [
        [dx - d * 0.25, fy - d * 0.6],
        [dx - d * 0.38, fy - d * 0.06],
      ],
      dark,
      d * 0.11,
    );
    body += limb(
      [
        [dx + d * 0.3, fy - d * 0.6],
        [dx + d * 0.22, fy - d * 0.06],
      ],
      dark,
      d * 0.11,
    );
    body += el("path", {
      d: s`M ${dx - d * 0.45} ${fy - d * 0.72} Q ${dx - d * 0.72} ${fy - d * 0.82} ${dx - d * 0.7} ${fy - d * 1.1}`,
      fill: "none",
      stroke: coat,
      "stroke-width": d * 0.09,
      "stroke-linecap": "round",
    });
    body += limb(
      [
        [dx - d * 0.3, fy - d * 0.6],
        [dx - d * 0.2, fy - d * 0.06],
      ],
      coat,
      d * 0.11,
    );
    body += limb(
      [
        [dx + d * 0.25, fy - d * 0.6],
        [dx + d * 0.38, fy - d * 0.06],
      ],
      coat,
      d * 0.11,
    );
    body += el("ellipse", { cx: dx, cy: fy - d * 0.66, rx: d * 0.52, ry: d * 0.22, fill: coat });
    body += el("circle", { cx: dx + d * 0.52, cy: fy - d * 0.95, r: d * 0.2, fill: coat });
    body += el("ellipse", { cx: dx + d * 0.72, cy: fy - d * 0.88, rx: d * 0.15, ry: d * 0.1, fill: coat });
    body += el("circle", { cx: dx + d * 0.86, cy: fy - d * 0.9, r: d * 0.04, fill: "#2a2320" });
    body += el("circle", { cx: dx + d * 0.6, cy: fy - d * 1.0, r: d * 0.035, fill: "#2a2320" });
    body += el("ellipse", {
      cx: dx + d * 0.42,
      cy: fy - d * 0.92,
      rx: d * 0.08,
      ry: d * 0.16,
      fill: dark,
      transform: s`rotate(15 ${dx + d * 0.42} ${fy - d * 0.92})`,
    });
    body += el("path", {
      d: s`M ${farHand[0]} ${farHand[1]} Q ${(farHand[0] + leash[0]) / 2} ${Math.max(farHand[1], leash[1]) + fig * 0.08} ${leash[0]} ${leash[1]}`,
      fill: "none",
      stroke: "#3b332e",
      "stroke-width": fig * 0.012,
    });
  }
  out += body + "</g>";

  const where = { beach: "along a beach", park: "through a park", hill: "along a hill path" };
  note.alt(`A person walking ${withDog ? "a dog " : ""}${where[place]}`);
  note.focus(x + dir * (withDog ? fig * 0.25 : 0), fy - fig * 0.6);
  return out;
});
