/**
 * The machinery every picture shares: what a kind is, a seeded random source, and small SVG helpers.
 */

/** The random source a kind draws with. Every value comes from the seed. */
export interface Rand {
  /** A float in [0, 1). */
  next(): number;
  /** A float in [min, max). */
  f(min: number, max: number): number;
  /** An integer in [min, max], both ends included. */
  i(min: number, max: number): number;
  /** One element of `items`. */
  pick<T>(items: readonly T[]): T;
  /** True with probability `p`. */
  chance(p: number): boolean;
  /** An element id unique to this picture, so several inline SVGs can share a page. */
  id(name: string): string;
}

/** Draws one picture's contents (everything inside `<svg>`) at the given size. */
export type Draw = (r: Rand, width: number, height: number) => string;

/** One kind of picture: hills, an owl, a color field. */
export interface Kind<I extends string = string> {
  readonly id: I;
  readonly name: string;
  readonly draw: Draw;
}

export function defineKind<const I extends string>(id: I, name: string, draw: Draw): Kind<I> {
  return { id, name, draw };
}

/** FNV-1a, for turning string seeds and id prefixes into integers. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let k = 0; k < text.length; k++) {
    h ^= text.charCodeAt(k);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The integer a seed stands for. */
export function seedToInt(seed: number | string = 1): number {
  return typeof seed === "string" ? hash(seed) : Math.floor(seed) >>> 0;
}

/** mulberry32: small, fast, and good enough for pictures. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRand(seed: number, idPrefix = ""): Rand {
  const next = mulberry32(seed);
  return {
    next,
    f: (min, max) => min + (max - min) * next(),
    i: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: items => items[Math.floor(next() * items.length)],
    chance: p => next() < p,
    id: name => idPrefix + name,
  };
}

/** Rounds to one decimal place: plenty for pixels, and keeps the markup short. */
export const n = (v: number): number => Math.round(v * 10) / 10;

/** Template tag that rounds every number it interpolates with `n`. */
export function s(strings: TemplateStringsArray, ...values: (string | number)[]): string {
  let out = strings[0];
  for (let k = 0; k < values.length; k++) {
    const v = values[k];
    out += (typeof v === "number" ? n(v) : v) + strings[k + 1];
  }
  return out;
}

/** An attribute value: numbers are rounded with `n`, and `undefined` or `false` leaves the attribute out. */
export type AttrValue = string | number | undefined | false;

/**
 * One SVG element. Attributes are written in the order given, numbers rounded, and runs of
 * whitespace in string values collapsed, so path data can be laid out over several lines.
 * With children it is written as an open/close pair, otherwise self-closed.
 */
export function el(tag: string, attrs: Record<string, AttrValue>, ...children: string[]): string {
  let out = `<${tag}`;
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    out += ` ${name}="${typeof value === "number" ? n(value) : value.replace(/\s+/g, " ").trim()}"`;
  }
  return children.length ? `${out}>${children.join("")}</${tag}>` : `${out}/>`;
}

const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

/** CSS `hsl()` with the hue wrapped and saturation and lightness clamped. */
export const hsl = (h: number, sat: number, light: number): string =>
  `hsl(${Math.round(((h % 360) + 360) % 360)} ${clamp(sat)}% ${clamp(light)}%)`;

/** A top-to-bottom linear gradient with evenly spaced stops. */
export const lin = (id: string, stops: readonly string[]): string =>
  el(
    "linearGradient",
    { id, x1: 0, y1: 0, x2: 0, y2: 1 },
    ...stops.map((color, k) => el("stop", { offset: k / (stops.length - 1), "stop-color": color })),
  );

/** A rectangle filling the whole picture. */
export const fill = (w: number, h: number, paint: string): string => el("rect", { width: w, height: h, fill: paint });

/** Mixes two `#rrggbb` colors; t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const parse = (x: string) => [1, 3, 5].map(k => parseInt(x.slice(k, k + 2), 16));
  const from = parse(a);
  const to = parse(b);
  const channel = (v: number, k: number) =>
    Math.round(v + (to[k] - v) * t)
      .toString(16)
      .padStart(2, "0");
  return "#" + from.map(channel).join("");
}

export type Point = readonly [number, number];

/** A point on a quadratic Bézier curve. */
export const qpt = (p0: Point, p1: Point, p2: Point, t: number): Point => [
  (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1],
];

/** `points` attribute text for a polygon. */
export const pts = (points: readonly Point[]): string => points.map(p => `${n(p[0])},${n(p[1])}`).join(" ");

/**
 * Opens a group that mirrors its contents left to right around x = cx when dir is -1.
 * The caller closes it with `</g>` after drawing the contents.
 */
export const facing = (cx: number, dir: number): string =>
  s`<g transform="translate(${cx} 0) scale(${dir} 1) translate(${-cx} 0)">`;
