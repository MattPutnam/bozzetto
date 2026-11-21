/**
 * Palettes: the built-in ones, your own exact colors, and generators that build a good palette
 * from a starting color or hue and a color-wheel scheme.
 *
 * Every function here is pure and deterministic (the same options always give the same colors),
 * so a palette picker can regenerate as controls change, lock swatches, and share a palette as
 * a short code.
 */
import { makeRand, seedToInt } from "./core";
import { hexToLch, lchToHex, lightnessOf, parseColor, toHex, type LCH } from "./color";

/** A list of colors in any form `parseColor` reads, a built-in palette's or adjustment's name, or a palette code. */
export type PaletteSpec = readonly string[] | string;

/**
 * Named palettes that adjust a picture's own colors instead of replacing them, so each picture
 * keeps its variety: brighter (`vivid`), lighter and softer (`pastel`), greyer (`muted`),
 * darker and cooler (`dusk`), dimmer for dark pages with every hue kept (`dim`), or without color
 * (`grayscale`).
 */
export const ADJUSTMENTS = ["vivid", "pastel", "muted", "dusk", "dim", "grayscale"] as const;
export type Adjustment = (typeof ADJUSTMENTS)[number];

export const PALETTES: Record<string, readonly string[]> = {
  sunset: ["#2d1e2f", "#7a3b52", "#d1495b", "#edae49", "#f9e0a8"],
  "sea glass": ["#0b2e3b", "#1b6a73", "#4fa3a5", "#a7d7c5", "#eef6ee"],
  riso: ["#1f2a44", "#ff4f5e", "#ffb000", "#f5f0e6"],
  orchard: ["#283618", "#606c38", "#dda15e", "#bc6c25", "#fefae0"],
  candy: ["#3d2c8d", "#916bbf", "#c996cc", "#f2a7c3", "#fff1e6"],
  sepia: ["#2a1d10", "#7a5634", "#c9a46e", "#f4e8cf"],
  mono: ["#0e2523", "#40968f", "#9fd1cc", "#eef6f5"],
};

/** Every name a palette option accepts: adjustments first, then color palettes. */
export const PALETTE_NAMES: readonly string[] = [...ADJUSTMENTS, ...Object.keys(PALETTES)];

/**
 * Hue offsets, in degrees from the base hue, for each color-wheel scheme.
 * - monochrome: one hue, varied only in lightness and chroma
 * - analogous: neighbors on the wheel; calm and natural
 * - complementary: opposites; strong contrast
 * - split-complementary: the base plus the two neighbors of its opposite; contrast with less tension
 * - triadic: three evenly spaced hues; lively
 * - tetradic: four evenly spaced hues; the most varied
 */
export const SCHEMES = {
  monochrome: [0],
  analogous: [-32, 0, 32],
  complementary: [0, 180],
  "split-complementary": [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
} as const satisfies Record<string, readonly number[]>;

export type Scheme = keyof typeof SCHEMES;

export interface PaletteOptions {
  /** A starting color, which appears in the palette exactly, or a hue in degrees. Default: chosen by the seed. */
  base?: string | number;
  /** Default `analogous`. */
  scheme?: Scheme;
  /** Number of colors, 2–9. Default 5. */
  count?: number;
  /** How far apart the darkest and lightest colors are, 0–1. Default 0.7. */
  contrast?: number;
  /** How colorful, 0 (grey) to 1 (as vivid as the screen allows). Default 0.55. */
  vibrance?: number;
  /** Varies the small random adjustments, and the hue when there's no base. Default 1. */
  seed?: number | string;
  /** Colors to keep exactly, by position. `null` or `undefined` slots are generated. */
  locked?: readonly (string | null | undefined)[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Moves hue `h` toward `target` by at most `amount` degrees, the short way around. */
function shiftToward(h: number, target: number, amount: number): number {
  const diff = ((target - h + 540) % 360) - 180;
  return h + Math.sign(diff) * Math.min(Math.abs(diff), amount);
}

/**
 * A palette of `count` colors from dark to light, built in OKLCH so the steps look even.
 *
 * Hues come from the scheme, spread across the lightness steps so each hue appears both dark
 * and light. Like a painter's palette, light colors lean slightly warm and dark ones slightly
 * cool, and the darkest and lightest are less saturated than the middle.
 */
export function makePalette(options: PaletteOptions = {}): string[] {
  const rand = makeRand(seedToInt(options.seed ?? 1) ^ 0x5bd1e995);
  const count = clamp(Math.round(options.count ?? 5), 2, 9);
  const hues: readonly number[] = SCHEMES[options.scheme ?? "analogous"];
  const contrast = clamp(options.contrast ?? 0.7, 0, 1);
  const vibrance = clamp(options.vibrance ?? 0.55, 0, 1);

  let base: LCH | undefined;
  let baseHue: number;
  if (typeof options.base === "string") {
    if (!parseColor(options.base)) throw new Error(`bozzetto: can't read the color "${options.base}".`);
    base = hexToLch(options.base);
    baseHue = base[2];
  } else {
    baseHue = options.base ?? rand.f(0, 360);
  }
  // Drawn up front in a fixed order, so locking a swatch doesn't change the others.
  const lightJitter = Array.from({ length: count }, () => rand.f(-0.02, 0.02));
  const hueJitter = Array.from({ length: count }, () => rand.f(-6, 6));

  const darkest = 0.22 + (1 - contrast) * 0.32;
  const lightest = 0.96 - (1 - contrast) * 0.16;
  // Put the base hue (offset 0) on the middle step, and the scheme's other hues around it.
  const middle = Math.floor((count - 1) / 2);
  const start = (((hues.indexOf(0) - middle) % hues.length) + hues.length) % hues.length;

  const colors = Array.from({ length: count }, (_, k) => {
    const t = count === 1 ? 0.5 : k / (count - 1);
    const lightness = darkest + (lightest - darkest) * t + lightJitter[k];
    const leaning = t > 0.5 ? 85 : 265;
    const hue = shiftToward(baseHue + hues[(start + k) % hues.length] + hueJitter[k], leaning, Math.abs(t - 0.5) * 24);
    const chroma = vibrance * 0.22 * (1 - 0.6 * (2 * t - 1) ** 2);
    return lchToHex([lightness, chroma, hue]);
  });

  const locked = options.locked ?? [];
  const free = (k: number) => locked[k] === null || locked[k] === undefined;
  if (base) {
    // The base color goes in exactly, on the free step closest to it in lightness.
    const exact = toHex(parseColor(options.base as string)!);
    const steps = colors.map((c, k) => ({ k, gap: Math.abs(lightnessOf(c) - base![0]) })).filter(s => free(s.k));
    if (steps.length) colors[steps.reduce((a, b) => (b.gap < a.gap ? b : a)).k] = exact;
  }
  locked.slice(0, count).forEach((color, k) => {
    if (color === null || color === undefined) return;
    const rgb = parseColor(color);
    if (!rgb) throw new Error(`bozzetto: can't read the locked color "${color}".`);
    colors[k] = toHex(rgb);
  });
  return colors;
}

/** A pleasing palette chosen entirely by the seed: scheme, hue, contrast and vibrance. */
export function randomPalette(seed: number | string, options: Omit<PaletteOptions, "seed"> = {}): string[] {
  const rand = makeRand(seedToInt(seed) ^ 0x27d4eb2f);
  const schemes = Object.keys(SCHEMES) as Scheme[];
  return makePalette({
    scheme: rand.pick(schemes),
    base: rand.f(0, 360),
    contrast: rand.f(0.55, 0.95),
    vibrance: rand.f(0.3, 0.85),
    ...options,
    seed,
  });
}

/** A palette as a short, URL-safe code, such as `264653-2a9d8f-e9c46a`. */
export function encodePalette(colors: readonly string[]): string {
  return colors
    .map(c => {
      const rgb = parseColor(c);
      if (!rgb) throw new Error(`bozzetto: can't read the color "${c}".`);
      return toHex(rgb).slice(1);
    })
    .join("-");
}

/** The colors in a palette code, or undefined if it isn't one. */
export function decodePalette(code: string): string[] | undefined {
  const parts = code.trim().replace(/^#/, "").split("-");
  if (parts.length < 2 || !parts.every(p => /^[0-9a-f]{6}$/i.test(p))) return undefined;
  return parts.map(p => `#${p.toLowerCase()}`);
}

/** The colors a palette spec stands for, as `#rrggbb`. Throws on anything it can't read. */
export function resolvePalette(spec: PaletteSpec): string[] {
  if (typeof spec === "string") {
    const named = PALETTES[spec];
    if (named) return [...named];
    const decoded = decodePalette(spec);
    if (decoded) return decoded;
    throw new Error(`bozzetto: "${spec}" is neither a palette name (${PALETTE_NAMES.join(", ")}) nor a palette code.`);
  }
  if (spec.length === 0) throw new Error("bozzetto: a palette needs at least one color.");
  return spec.map(c => {
    const rgb = parseColor(c);
    if (!rgb) throw new Error(`bozzetto: can't read the color "${c}".`);
    return toHex(rgb);
  });
}
