/**
 * The machinery every picture shares: what a kind is, a seeded random source, and small SVG helpers.
 */

/**
 * The random source a kind draws with. Every value comes from the seed.
 *
 * @category Your own kinds
 */
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
  /**
   * An option's value: the one the user fixed with `kind.with(...)`, or else `value`, the kind's
   * own random choice. Always make the random choice first, as in `r.option("tabby", r.chance(0.35))`,
   * so fixing one option doesn't change any of the picture's other choices.
   */
  option<T>(name: string, value: T): T;
  /**
   * A separate random source, seeded from this picture's seed and `name`. Use it for draws made
   * only in some branches (such as the curls of curly hair), so taking a branch or not doesn't
   * shift the choices that come after it.
   */
  fork(name: string): Rand;
}

/**
 * What a kind can say about the picture it drew. Both are optional: without them a picture's
 * alt text is the kind's name and its focus is the center.
 *
 * @category Your own kinds
 */
export interface Notes {
  /**
   * A short description for screen readers, such as "An owl perched on a branch at dusk".
   * Start with a capital, leave off the final period, and don't name colors: palettes change them.
   */
  alt(text: string): void;
  /** The point of interest, in px, such as a face or the sun, for cropping and `object-position`. */
  focus(x: number, y: number): void;
  /**
   * The bounds of the subject's head (or face), in px: what an avatar of this picture frames.
   * Only kinds with a face call it; `avatar` accepts only kinds that do.
   */
  frame(x: number, y: number, width: number, height: number): void;
}

/**
 * Draws one picture's contents (everything inside `<svg>`) at the given size.
 *
 * @category Your own kinds
 */
export type Draw = (r: Rand, width: number, height: number, note: Notes) => string;

/**
 * A value an option can take.
 *
 * @category Your own kinds
 */
export type OptionValue = string | number | boolean;

/**
 * A kind's options, each with the values it allows: `{ pupils: ["slit", "round"], tabby: [true, false] }`.
 *
 * @category Your own kinds
 */
export type OptionSpec = Readonly<Record<string, readonly OptionValue[]>>;

/**
 * Fixed values for some of a kind's options. Options left out are still chosen by the seed.
 *
 * @category Your own kinds
 */
export type OptionValues<O extends OptionSpec> = { readonly [K in keyof O]?: O[K][number] };

/**
 * One kind of picture: hills, an owl, a color field.
 *
 * @category Your own kinds
 */
export interface Kind<I extends string = string, O extends OptionSpec = OptionSpec> {
  /** The kind's id, such as `"ice-cream"`: lowercase, with hyphens. */
  readonly id: I;
  /** A display name, such as `"Ice cream"`; also the alt text of a picture that doesn't set its own. */
  readonly name: string;
  /** Draws the picture's SVG contents. */
  readonly draw: Draw;
  /** The options this kind offers, and the values each allows. Empty for kinds without options. */
  readonly options: O;
  /** The options fixed so far with `with`. */
  readonly fixed: OptionValues<O>;
  /**
   * This kind with some options fixed, such as `cat.with({ pupils: "round" })`. It goes anywhere
   * a kind does. Options left out still vary with the seed, and calls can be chained.
   */
  with(values: OptionValues<O>): Kind<I, O>;
}

/** Whether `key` is `record`'s own key, so names such as "constructor" aren't found on its prototype. */
export const own = (record: object, key: string): boolean => Object.prototype.hasOwnProperty.call(record, key);

function makeKind<I extends string, O extends OptionSpec>(
  id: I,
  name: string,
  options: O,
  draw: Draw,
  fixed: OptionValues<O>,
): Kind<I, O> {
  return {
    id,
    name,
    draw,
    options,
    fixed,
    with(values) {
      for (const [option, value] of Object.entries(values)) {
        if (value === undefined) continue;
        const allowed = own(options, option) ? options[option] : undefined;
        if (!allowed) {
          const known = Object.keys(options);
          throw new Error(
            `bozzetto: ${id} has no option "${option}". ${known.length ? `Its options are ${known.join(", ")}.` : "It has no options."}`,
          );
        }
        if (!allowed.includes(value as OptionValue)) {
          throw new Error(
            `bozzetto: ${id}'s ${option} can be ${allowed.map(v => JSON.stringify(v)).join(", ")}, not ${JSON.stringify(value)}.`,
          );
        }
      }
      // Kept in option order, so the same options fixed in any order make the same kind (its ids and picks).
      const merged: Record<string, unknown> = { ...fixed, ...values };
      const ordered = Object.fromEntries(
        Object.keys(options)
          .filter(option => merged[option] !== undefined)
          .map(option => [option, merged[option]]),
      );
      return makeKind(id, name, options, draw, ordered as OptionValues<O>);
    },
  };
}

/**
 * A kind: an id, a display name, and a function that draws it. Kinds with options list them before
 * the draw function: `defineKind("cat", "Cat", { pupils: ["slit", "round"] }, draw)`.
 *
 * @category Your own kinds
 */
export function defineKind<const I extends string>(id: I, name: string, draw: Draw): Kind<I, Record<never, never>>;
export function defineKind<const I extends string, const O extends OptionSpec>(
  id: I,
  name: string,
  options: O,
  draw: Draw,
): Kind<I, O>;
export function defineKind(id: string, name: string, optionsOrDraw: OptionSpec | Draw, draw?: Draw): Kind {
  return typeof optionsOrDraw === "function"
    ? makeKind(id, name, {}, optionsOrDraw, {})
    : makeKind(id, name, optionsOrDraw, draw!, {});
}

/**
 * Options with `null` values left out, so `null` (as React and Vue code often passes for "none")
 * means the same as leaving an option out.
 */
export function withoutNulls<T extends object>(options: T): T {
  return Object.values(options).includes(null)
    ? (Object.fromEntries(Object.entries(options).filter(([, value]) => value !== null)) as T)
    : options;
}

/**
 * Throws unless `value` is undefined or one of `allowed`, so an unknown name (from JavaScript, or
 * an HTML attribute) is an error rather than quietly drawing something else.
 */
export function checkOneOf(value: unknown, allowed: readonly string[], name: string): void {
  if (value !== undefined && !allowed.includes(value as string))
    throw new Error(`bozzetto: ${name} can be ${allowed.join(", ")}, not ${JSON.stringify(value)}.`);
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

/**
 * The integer a seed stands for, as an unsigned 32-bit number. A number is rounded down; a string,
 * such as a user id, is hashed. Default 1.
 *
 * @category Your own kinds
 */
export function seedToInt(seed: number | string = 1): number {
  return typeof seed === "string" ? hash(seed) : Math.floor(seed) >>> 0;
}

/**
 * A seed typed as text, as in an attribute or on the command line: a number such as "3", "-1" or
 * "1.5" is read as that number, so it draws what the same number does in code; other text is hashed.
 */
export function seedFromText(text: string): number | string {
  return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : text;
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

export function makeRand(
  seed: number,
  idPrefix = "",
  fixed: Readonly<Record<string, unknown>> = {},
  chosen: Record<string, unknown> = {},
): Rand {
  const next = mulberry32(seed);
  return {
    next,
    f: (min, max) => min + (max - min) * next(),
    i: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: items => items[Math.floor(next() * items.length)],
    chance: p => next() < p,
    id: name => idPrefix + name,
    option: <T>(name: string, value: T): T => {
      const result = fixed[name] === undefined ? value : (fixed[name] as T);
      chosen[name] = result;
      return result;
    },
    fork: name => makeRand((seed ^ hash(`fork:${name}`)) >>> 0, idPrefix, fixed, chosen),
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

/** An hsl color written as #rrggbb, so it can be mixed and stays short in a data URI. */
export function hex(hue: number, sat: number, light: number): string {
  const sv = Math.max(0, Math.min(100, sat)) / 100;
  const lv = Math.max(0, Math.min(100, light)) / 100;
  const hv = (((hue % 360) + 360) % 360) / 30;
  const a = sv * Math.min(lv, 1 - lv);
  const channel = (k: number) => {
    const t = (k + hv) % 12;
    const v = lv - a * Math.max(-1, Math.min(t - 3, 9 - t, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return "#" + channel(0) + channel(8) + channel(4);
}

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
