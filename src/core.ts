/**
 * The machinery every picture shares: a seeded random source, small SVG helpers,
 * and the step that wraps a kind's shapes in an `<svg>` element.
 */

/** Which shelf a kind sits on. */
export type Family = "landscape" | "art" | "face" | "animal";

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
  readonly family: Family;
  readonly draw: Draw;
}

export function defineKind<const I extends string>(id: I, name: string, family: Family, draw: Draw): Kind<I> {
  return { id, name, family, draw };
}

export interface RenderOptions {
  /** Width in px. Default 400. */
  width?: number;
  /** Height in px. Default 300. */
  height?: number;
  /** The same seed always gives the same picture. A string is hashed. Default 1. */
  seed?: number | string;
  /** Text drawn in the bottom-right corner, such as a number. */
  label?: string | number;
}

/** FNV-1a, for turning string seeds and id prefixes into integers. */
function hash(text: string): number {
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

const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

/** CSS `hsl()` with the hue wrapped and saturation and lightness clamped. */
export const hsl = (h: number, sat: number, light: number): string => `hsl(${Math.round(((h % 360) + 360) % 360)} ${clamp(sat)}% ${clamp(light)}%)`;

/** A top-to-bottom linear gradient with evenly spaced stops. */
export const lin = (id: string, stops: readonly string[]): string =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map((c, k) => `<stop offset="${n(k / (stops.length - 1))}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

/** A rectangle filling the whole picture. */
export const fill = (w: number, h: number, paint: string): string => s`<rect width="${w}" height="${h}" fill="${paint}"/>`;

/** Mixes two `#rrggbb` colors; t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const parse = (x: string) => [1, 3, 5].map(k => parseInt(x.slice(k, k + 2), 16));
  const pa = parse(a), pb = parse(b);
  return "#" + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, "0")).join("");
}

export type Point = readonly [number, number];

/** A point on a quadratic Bézier curve. */
export const qpt = (p0: Point, p1: Point, p2: Point, t: number): Point => [
  (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1],
];

/** `points` attribute text for a polygon. */
export const pts = (points: readonly Point[]): string => points.map(p => `${n(p[0])},${n(p[1])}`).join(" ");

/** Mirrors a group left to right around x = cx when dir is -1. */
export const facing = (cx: number, dir: number): string => s`<g transform="translate(${cx} 0) scale(${dir} 1) translate(${-cx} 0)">`;

/** The full SVG markup for one picture. */
export function toSvg(kind: Kind, options: RenderOptions = {}): string {
  const width = options.width ?? 400, height = options.height ?? 300, seed = seedToInt(options.seed);
  const prefix = `bz${hash(`${kind.id}:${seed}:${width}x${height}`).toString(36)}-`;
  let body = kind.draw(makeRand(seed, prefix), width, height);
  if (options.label !== undefined && options.label !== "") {
    const size = Math.min(width, height) * 0.093, pad = size * 0.57;
    body += s`<text x="${width - pad}" y="${height - pad}" text-anchor="end" font-family="system-ui,sans-serif" font-size="${size}" font-weight="600" fill="#fff" opacity="0.85">${escapeXml(String(options.label))}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

/** The picture as a `data:image/svg+xml` URI, ready for an `<img src>` or CSS `url()`. */
export function toDataUri(kind: Kind, options: RenderOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(kind, options))}`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
}
