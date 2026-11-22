import { defineKind, el, fill, hex, mix, s } from "../../draw/core";
import { andList, numberWord } from "../../draw/words";
import { room } from "./shared";

/** Shell finishes as hue, saturation and lightness. */
const FINISHES: readonly [number, number, number][] = [
  [356, 62, 42],
  [214, 52, 40],
  [162, 42, 32],
  [272, 32, 40],
  [192, 58, 40],
  [28, 72, 48],
  [220, 8, 13],
  [40, 18, 88],
];

/**
 * A drum kit seen from the audience: the bass drum at the front, rack toms on top of it, the snare
 * and hi-hat on our right, a floor tom on our left, and crash and ride cymbals on stands.
 *
 * @category Music
 */
export const drums = /* @__PURE__ */ defineKind("drums", "Drum kit", (g, w, h, note) => {
  const racks = g.pick([1, 2, 2]);
  const crashes = g.pick([1, 1, 2]);
  const cowbell = g.chance(0.25);
  const splash = g.chance(0.25);
  const stage = g.chance(0.5);
  const rug = g.chance(stage ? 0.5 : 0.75);

  // The layout, in bass drum diameters: u runs right from the bass drum's middle, v up from the floor
  // under its front head. Pieces further back stand a little higher on the floor (z).
  const floorTom = { x: -0.93, r: 0.36, top: 0.92 + g.f(-0.03, 0.03) };
  const rideX = -1.12;
  const ride = { x: rideX + g.f(-0.05, 0.05), y: 1.72 + g.f(-0.06, 0.06), r: 0.46, stand: rideX - 0.3 };
  const crashList = [{ x: 0.74 + g.f(-0.06, 0.06), y: 2.0 + g.f(-0.06, 0.06), r: 0.4, stand: 1.06 }];
  if (crashes === 2) crashList.push({ x: -0.5 + g.f(-0.05, 0.05), y: 2.12 + g.f(-0.05, 0.05), r: 0.37, stand: -0.66 });
  const hat = { x: 1.38, y: 1.34 + g.f(-0.04, 0.04), r: 0.3 };
  const snare = { x: 0.8, top: 1.0, r: 0.31 };
  const rackSpots: Record<number, [number, number][]> = {
    1: [[-0.04, 0.27]],
    2: [
      [-0.27, 0.28],
      [0.25, 0.25],
    ],
  };
  const toms = rackSpots[racks];

  const left = Math.min(floorTom.x - floorTom.r - 0.12, ride.x - ride.r, ride.stand - 0.28);
  const right = Math.max(hat.x + hat.r, crashList[0].x + crashList[0].r, crashList[0].stand + 0.28);
  const top = Math.max(...crashList.map(c => c.y + 0.12));
  const K = Math.min((h * 0.84) / (top + 0.12), (w * 0.95) / (right - left));
  const base = Math.min(h * 0.95, h / 2 + ((top + 0.05) * K) / 2 + 0.1 * K);
  const cx = w / 2 - ((left + right) / 2) * K + w * g.f(-0.02, 0.02);
  const X = (u: number) => cx + u * K;
  const Y = (v: number) => base - v * K;

  // Colors
  const [fh, fs, fl] = g.pick(FINISHES);
  const wood = g.chance(0.22);
  const sparkle = !wood && g.chance(0.4);
  const hue = wood ? g.f(18, 34) : fh + g.f(-6, 6);
  const sat = wood ? g.f(45, 62) : fs;
  const light = wood ? g.f(36, 50) : fl + g.f(-3, 3);
  const shellAt = (dl: number) => hex(hue, sat, light + dl);
  const chrome = "#c6cbd1";
  const chromeDark = "#8f969e";
  const bronze = g.pick(["#d6a443", "#cf9a3e", "#ddb052", "#c99847"]);
  const coated = "#f1eee6";

  let out = "";
  // The room or stage
  const wallY = Y(0.42);
  if (stage) {
    const curtain = hex(g.pick([350, 220, 270, 200, 30]) + g.f(-8, 8), g.f(25, 45), g.f(14, 20));
    const fold = g.id("fold");
    const spot = g.id("spot");
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id: fold, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: K * 0.32, y2: 0, spreadMethod: "repeat" },
        el("stop", { offset: 0, "stop-color": "#000000", "stop-opacity": 0.35 }),
        el("stop", { offset: 0.5, "stop-color": "#ffffff", "stop-opacity": 0.06 }),
        el("stop", { offset: 1, "stop-color": "#000000", "stop-opacity": 0.35 }),
      ),
      el(
        "radialGradient",
        { id: spot },
        el("stop", { offset: 0, "stop-color": "#fff6e0", "stop-opacity": 0.4 }),
        el("stop", { offset: 1, "stop-color": "#fff6e0", "stop-opacity": 0 }),
      ),
    );
    out += fill(w, h, curtain);
    out += el("rect", { width: w, height: wallY, fill: `url(#${fold})` });
    const boards = hex(g.f(20, 32), g.f(20, 32), g.f(20, 28));
    out += el("rect", { y: wallY, width: w, height: h - wallY, fill: boards });
    // Board seams running toward us
    let seams = "";
    for (let k = -5; k <= 5; k++) {
      const u = k * 0.8;
      seams += s`M ${X(u)} ${wallY} L ${X(u * 1.25)} ${h} `;
    }
    out += el("path", { d: seams, stroke: "#000", "stroke-opacity": "0.18", "stroke-width": K * 0.008 });
    // The stage's front edge, when there is floor in front of the kit
    const edge = Y(-0.32);
    if (edge < h - K * 0.05) out += el("rect", { y: edge, width: w, height: h - edge, fill: "#000", opacity: "0.45" });
    out += el("ellipse", { cx: X(0), cy: Y(1.1), rx: K * 2.4, ry: K * 1.7, fill: `url(#${spot})` });
  } else out += room(g, w, h, wallY);
  if (rug) {
    const rugColor = hex(g.f(0, 360), g.f(20, 45), stage ? g.f(22, 32) : g.f(35, 55));
    const back = Y(0.36);
    const front = Y(-0.22);
    const rl = left - 0.12;
    const rr = right + 0.12;
    out += el("path", {
      d: s`M ${X(rl)} ${back} L ${X(rr)} ${back} L ${X(rr + 0.18)} ${front} L ${X(rl - 0.18)} ${front} Z`,
      fill: rugColor,
      stroke: mix(stage ? "#3a3a3a" : "#e8e0d0", "#000000", 0.1),
      "stroke-opacity": "0.5",
      "stroke-width": K * 0.02,
    });
  }
  // A soft shadow under the whole kit
  out += el("ellipse", {
    cx: X((left + right) / 2),
    cy: Y(0.06),
    rx: ((right - left) / 2) * K,
    ry: K * 0.13,
    fill: "#000",
    opacity: "0.2",
  });

  // Gradients and textures for the shells
  const grad = g.id("shell");
  const tex = g.id("tex");
  const brz = g.id("brz");
  const stops = [
    [0, -14],
    [0.2, 0],
    [0.33, 14],
    [0.5, 2],
    [0.82, -6],
    [1, -16],
  ];
  let defs = el(
    "linearGradient",
    { id: grad, x1: 0, y1: 0, x2: 1, y2: 0 },
    ...stops.map(([o, dl]) => el("stop", { offset: o, "stop-color": shellAt(dl) })),
  );
  defs += el(
    "linearGradient",
    { id: brz, x1: 0, y1: 0, x2: 1, y2: 0 },
    el("stop", { offset: 0, "stop-color": mix(bronze, "#000000", 0.25) }),
    el("stop", { offset: 0.35, "stop-color": mix(bronze, "#ffffff", 0.35) }),
    el("stop", { offset: 0.6, "stop-color": bronze }),
    el("stop", { offset: 1, "stop-color": mix(bronze, "#000000", 0.3) }),
  );
  if (sparkle) {
    const t = K * 0.06;
    let dots = "";
    for (const [a, b] of [
      [0.2, 0.3],
      [0.7, 0.15],
      [0.45, 0.7],
      [0.85, 0.8],
      [0.1, 0.85],
    ])
      dots += s`M ${a * t} ${b * t} h 0 `;
    dots = el("path", {
      d: dots,
      stroke: "#ffffff",
      "stroke-opacity": "0.55",
      "stroke-width": t * 0.14,
      "stroke-linecap": "round",
    });
    defs += el("pattern", { id: tex, width: t, height: t, patternUnits: "userSpaceOnUse" }, dots);
  } else if (wood) {
    const t = K * 0.1;
    defs += el(
      "pattern",
      { id: tex, width: t, height: K * 2, patternUnits: "userSpaceOnUse" },
      el("path", {
        d: s`M ${t * 0.2} 0 V ${K * 2} M ${t * 0.55} 0 V ${K * 2} M ${t * 0.8} 0 V ${K * 2}`,
        stroke: "#000",
        "stroke-opacity": "0.12",
        "stroke-width": t * 0.08,
      }),
    );
  }
  out += el("defs", {}, defs);
  const texture = (d: string) => (sparkle || wood ? el("path", { d, fill: `url(#${tex})` }) : "");

  // A drum seen from the front, a little above: its shell, hoops, lugs and top head.
  // ry is how open the top head looks; lugs are the lugs around the shell.
  const drum = (x: number, topV: number, r: number, depth: number, ry: number, lugs: number, shell: string) => {
    const l = X(x - r);
    const rr = X(x + r);
    const t = Y(topV);
    const b = t + depth * K;
    const Rx = r * K;
    const Ry = ry * K;
    const d = s`M ${l} ${t} L ${l} ${b} A ${Rx} ${Ry} 0 0 0 ${rr} ${b} L ${rr} ${t} Z`;
    let o = el("path", { d, fill: shell });
    if (shell === `url(#${grad})`) o += texture(d);
    // Lugs on the front half of the shell
    let lugPath = "";
    const tall = depth > 0.45;
    for (let k = 0; k < lugs; k++) {
      const a = ((k + 0.5) / lugs) * Math.PI * 2;
      if (Math.sin(a) < 0.15) continue;
      const lx = X(x + r * Math.cos(a));
      const dy = Ry * Math.sin(a);
      const lw = K * 0.03 * Math.sin(a);
      const lh = K * (tall ? 0.16 : Math.min(0.09, depth * 0.35));
      lugPath += s`M ${lx - lw / 2} ${t + dy + (depth * K - lh) / 2} h ${lw} v ${lh} h ${-lw} Z `;
    }
    o += el("path", { d: lugPath, fill: chrome });
    // The top head, then both hoops
    o += el("ellipse", { cx: X(x), cy: t, rx: Rx, ry: Ry, fill: coated, stroke: chrome, "stroke-width": K * 0.012 });
    o += el("path", {
      d: s`M ${l} ${b} A ${Rx} ${Ry} 0 0 0 ${rr} ${b} M ${l} ${t} A ${Rx} ${Ry} 0 0 0 ${rr} ${t}`,
      fill: "none",
      stroke: chrome,
      "stroke-width": K * 0.028,
    });
    return o;
  };

  // A cymbal seen nearly edge on, dome up (dir 1) or down (dir -1), tilted by deg
  const cymbal = (x: number, y: number, r: number, deg: number, dir = 1) => {
    const cx0 = X(x);
    const cy0 = Y(y);
    const R = r * K;
    let o = el("path", {
      d: s`M ${cx0 - R} ${cy0} Q ${cx0} ${cy0 - dir * R * 0.2} ${cx0 + R} ${cy0} Q ${cx0} ${cy0 + dir * R * 0.06} ${cx0 - R} ${cy0} Z`,
      fill: `url(#${brz})`,
    });
    o += el("ellipse", {
      cx: cx0,
      cy: cy0 - dir * R * 0.1,
      rx: R * 0.17,
      ry: R * 0.07,
      fill: mix(bronze, "#ffffff", 0.15),
    });
    return deg ? el("g", { transform: s`rotate(${deg} ${cx0} ${cy0})` }, o) : o;
  };

  // Stands and hardware, all behind the drums: tubes, then legs and rods
  let tubes = "";
  let legs = "";
  const tripod = (x: number, z: number, spread: number, hub: number) => {
    legs += s`M ${X(x - spread)} ${Y(z)} L ${X(x)} ${Y(z + hub)} L ${X(x + spread)} ${Y(z)} M ${X(x)} ${Y(z + hub)} L ${X(x + 0.01)} ${Y(z - 0.05)} `;
  };
  // A boom stand: tripod, upright tube, then a boom arm up to the cymbal
  const boom = (sx: number, z: number, cx1: number, cy1: number) => {
    const knee = Math.min(cy1 - 0.3, 1.55);
    tripod(sx, z, 0.26, 0.24);
    tubes += s`M ${X(sx)} ${Y(z + 0.24)} L ${X(sx)} ${Y(knee)} `;
    legs += s`M ${X(sx)} ${Y(knee)} L ${X(cx1)} ${Y(cy1 - 0.03)} `;
  };
  boom(ride.stand, 0.16, ride.x, ride.y);
  for (const c of crashList) boom(c.stand, 0.17, c.x, c.y);
  const splashAt = { x: 0.32, y: 1.84, r: 0.2 };
  if (splash) legs += s`M ${X(crashList[0].stand)} ${Y(1.45)} L ${X(splashAt.x)} ${Y(splashAt.y - 0.02)} `;
  // Hi-hat: tripod, tube to the bottom cymbal, and the pull rod through both
  tripod(hat.x, 0.12, 0.24, 0.22);
  tubes += s`M ${X(hat.x)} ${Y(0.34)} L ${X(hat.x)} ${Y(hat.y - 0.08)} `;
  legs += s`M ${X(hat.x)} ${Y(hat.y)} L ${X(hat.x)} ${Y(hat.y + 0.2)} `;
  // Snare stand: tripod, a short tube and the basket arms
  const snareBottom = snare.top - 0.22;
  tripod(snare.x, 0.13, 0.22, 0.2);
  tubes += s`M ${X(snare.x)} ${Y(0.33)} L ${X(snare.x)} ${Y(snareBottom - 0.14)} `;
  legs += s`M ${X(snare.x - 0.22)} ${Y(snareBottom - 0.02)} L ${X(snare.x)} ${Y(snareBottom - 0.14)} L ${X(snare.x + 0.22)} ${Y(snareBottom - 0.02)} `;
  // Floor tom legs from brackets on the shell
  const ft = floorTom;
  const bracket = ft.top - 0.2;
  legs += s`M ${X(ft.x - ft.r + 0.02)} ${Y(bracket)} L ${X(ft.x - ft.r - 0.1)} ${Y(0.1)} M ${X(ft.x + ft.r - 0.02)} ${Y(bracket)} L ${X(ft.x + ft.r + 0.1)} ${Y(0.1)} M ${X(ft.x + 0.04)} ${Y(bracket)} L ${X(ft.x + 0.06)} ${Y(0.16)} `;
  // Bass drum spurs, angled out and forward to the floor
  legs += s`M ${X(-0.45)} ${Y(0.4)} L ${X(-0.66)} ${Y(-0.03)} M ${X(0.45)} ${Y(0.4)} L ${X(0.66)} ${Y(-0.03)} `;
  // The tom holder: a post out of the bass drum, with an arm to each rack tom
  tubes += s`M ${X(-0.02)} ${Y(1.0)} L ${X(-0.02)} ${Y(1.17)} `;
  for (const [tx] of toms) legs += s`M ${X(-0.02)} ${Y(1.14)} L ${X(tx)} ${Y(1.2)} `;
  out += el("path", {
    d: legs,
    fill: "none",
    stroke: chrome,
    "stroke-width": K * 0.018,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  out += el("path", { d: tubes, stroke: chromeDark, "stroke-width": K * 0.03, "stroke-linecap": "round" });

  // Cymbals: ride, crashes and the splash, each tilted a little toward the drummer's seat
  out += cymbal(ride.x, ride.y, ride.r, g.f(4, 9));
  for (const c of crashList) out += cymbal(c.x, c.y, c.r, (c.x > 0 ? -1 : 1) * g.f(6, 14));
  if (splash) out += cymbal(splashAt.x, splashAt.y, splashAt.r, g.f(-10, -4));
  // Hi-hat: bottom cymbal dome down, top cymbal dome up, nearly closed
  out += cymbal(hat.x, hat.y - 0.02, hat.r, 0, -1);
  out += cymbal(hat.x, hat.y + 0.01, hat.r, 0, 1);
  out += el("rect", {
    x: X(hat.x) - K * 0.025,
    y: Y(hat.y + 0.1),
    width: K * 0.05,
    height: K * 0.04,
    fill: chromeDark,
  });

  // The floor tom
  out += drum(ft.x, ft.top, ft.r, ft.top - 0.3, 0.07, 8, `url(#${grad})`);
  // Snare: sometimes a metal shell, sometimes matching the kit
  const metal = g.chance(0.4);
  if (metal) {
    const sg = g.id("snare");
    out += el(
      "defs",
      {},
      el(
        "linearGradient",
        { id: sg, x1: 0, y1: 0, x2: 1, y2: 0 },
        el("stop", { offset: 0, "stop-color": "#7d848c" }),
        el("stop", { offset: 0.3, "stop-color": "#eef1f4" }),
        el("stop", { offset: 0.6, "stop-color": "#b4bac1" }),
        el("stop", { offset: 1, "stop-color": "#6f767e" }),
      ),
    );
    out += drum(snare.x, snare.top, snare.r, 0.22, 0.07, 10, `url(#${sg})`);
  } else out += drum(snare.x, snare.top, snare.r, 0.22, 0.07, 10, `url(#${grad})`);
  // Rack toms, tipped toward the drummer and a little in toward the middle
  for (const [tx, tr] of toms) {
    const depth = tr * 1.45;
    const topV = 1.12 + depth;
    const tilt = tx < -0.1 ? g.f(3, 7) : tx > 0.1 ? -g.f(3, 7) : 0;
    out += el(
      "g",
      { transform: s`rotate(${tilt} ${X(tx)} ${Y(1.12)})` },
      drum(tx, topV, tr, depth, 0.04, 6, `url(#${grad})`),
    );
  }

  // The bass drum: the top of its shell running back, then the hoop and front head
  const kx = X(0);
  const ky = Y(0.5);
  out += el("circle", { cx: kx, cy: Y(0.56), r: K * 0.485, fill: shellAt(-12) });
  out += el("circle", { cx: kx, cy: ky, r: K * 0.5, fill: `url(#${grad})` });
  out += texture(
    s`M ${kx - K * 0.5} ${ky} a ${K * 0.5} ${K * 0.5} 0 1 0 ${K} 0 a ${K * 0.5} ${K * 0.5} 0 1 0 ${-K} 0 Z`,
  );
  // Claws holding the front hoop, as dashes around it
  const gap = (Math.PI * 2 * 0.472 * K) / 8;
  out += el("circle", {
    cx: kx,
    cy: ky,
    r: K * 0.472,
    fill: "none",
    stroke: chrome,
    "stroke-width": K * 0.06,
    "stroke-dasharray": s`${K * 0.035} ${gap - K * 0.035}`,
    "stroke-dashoffset": s`${gap / 2}`,
  });
  out += el("circle", {
    cx: kx,
    cy: ky,
    r: K * 0.468,
    fill: "none",
    stroke: chromeDark,
    "stroke-width": K * 0.01,
  });
  const headStyle = g.pick(["dark", "coated", "coated", "match"]);
  const head = headStyle === "dark" ? "#1e1e22" : headStyle === "coated" ? coated : shellAt(-4);
  out += el("circle", { cx: kx, cy: ky, r: K * 0.452, fill: head });
  // A simple mark on the front head: a ring, a disc or nothing, and maybe a port hole
  const mark = g.pick(["ring", "disc", "none"]);
  const accent = headStyle === "coated" ? shellAt(0) : headStyle === "dark" ? shellAt(10) : coated;
  if (mark === "ring")
    out += el("circle", {
      cx: kx,
      cy: ky,
      r: K * g.f(0.26, 0.34),
      fill: "none",
      stroke: accent,
      "stroke-width": K * g.f(0.02, 0.04),
    });
  else if (mark === "disc") out += el("circle", { cx: kx, cy: ky, r: K * g.f(0.14, 0.22), fill: accent });
  if (g.chance(0.5)) {
    const pa = g.f(0.6, 1.2);
    out += el("circle", {
      cx: kx + Math.cos(pa) * K * 0.3,
      cy: ky + Math.sin(pa) * K * 0.3,
      r: K * 0.075,
      fill: "#141416",
      stroke: chromeDark,
      "stroke-width": K * 0.012,
    });
  }
  // A soft sheen across the head
  out += el("ellipse", {
    cx: kx - K * 0.16,
    cy: ky - K * 0.2,
    rx: K * 0.2,
    ry: K * 0.1,
    transform: s`rotate(-35 ${kx - K * 0.16} ${ky - K * 0.2})`,
    fill: "#ffffff",
    opacity: "0.12",
  });
  // A cowbell clamped to the bass drum hoop, mouth up and toward the drummer
  if (cowbell) {
    const bx = X(0.3);
    const by = Y(1.02);
    out += el("path", {
      d: s`M ${bx - K * 0.05} ${by} L ${bx + K * 0.05} ${by} L ${bx + K * 0.075} ${by - K * 0.16} L ${bx - K * 0.075} ${by - K * 0.16} Z`,
      fill: "#3a3b3f",
      transform: s`rotate(12 ${bx} ${by})`,
    });
    out += el("rect", { x: bx - K * 0.03, y: by - K * 0.01, width: K * 0.06, height: K * 0.05, fill: chromeDark });
  }

  const pieces = 3 + racks;
  const extras = andList([cowbell && "a cowbell", splash && "a splash cymbal"]);
  note.alt(
    `A ${numberWord(pieces)}-piece drum kit${extras ? ` with ${extras}` : ""} ${stage ? "on a stage" : "in a room"}`,
  );
  note.focus(kx, Y(1.0));
  // Path data without the spaces around commands, and in whole pixels when the kit is big, to keep
  // the data URI short
  const whole = (v: string) => String(Math.round(Number(v)));
  out = out.replace(/ d="([^"]*)"/g, (_, d: string) => {
    const short = d.replace(/\s*([A-Za-z])\s*/g, "$1");
    return ` d="${K > 50 ? short.replace(/-?\d+\.\d/g, whole) : short}"`;
  });
  return K > 50 ? out.replace(/="(\d{2,}\.\d)"/g, (_, v: string) => `="${whole(v)}"`) : out;
});
