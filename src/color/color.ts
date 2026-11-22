/**
 * Color math for palettes: parsing, sRGB <-> OKLab/OKLCH, and gamut clamping.
 *
 * OKLCH is used for generating palettes because equal steps in its lightness look equal,
 * and changing its hue doesn't change how light a color looks, unlike HSL.
 * Reference: Björn Ottosson, "A perceptual color space for image processing" (2020).
 */

/** sRGB channels in 0–255. */
/**
 * A color as pictures write it: `hsl(h s% l%)` or `#rrggbb`/`#rgb`. One pattern for everything
 * that finds colors in markup (styling, dark mode), so they always agree on what a color is.
 */
export const COLOR = /hsl\(\d+(?:\.\d+)? \d+(?:\.\d+)?% \d+(?:\.\d+)?%\)|#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

export type RGB = [number, number, number];
/** OKLab: lightness 0–1, then the green–red and blue–yellow axes. */
export type Lab = [number, number, number];
/** OKLCH: lightness 0–1, chroma (0 to about 0.37), hue in degrees. */
export type LCH = [number, number, number];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const FUNC = /^(rgb|hsl)a?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/i;

/** Reads `#rgb`, `#rrggbb` (the `#` is optional), `rgb(…)` or `hsl(…)`. Returns undefined for anything else. */
export function parseColor(text: string): RGB | undefined {
  const value = text.trim();
  const hex = HEX.exec(value);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map(c => c + c).join("") : hex[1];
    return [0, 2, 4].map(k => parseInt(digits.slice(k, k + 2), 16)) as RGB;
  }
  const func = FUNC.exec(value);
  if (!func) return undefined;
  const [a, b, c] = [func[2], func[3], func[4]].map(Number);
  return func[1].toLowerCase() === "rgb" ? [a, b, c] : hslToRgb(a, b, c);
}

export function hslToRgb(h: number, sat: number, light: number): RGB {
  const S = sat / 100;
  const L = light / 100;
  const a = S * Math.min(L, 1 - L);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [channel(0), channel(8), channel(4)];
}

export const toHex = (c: RGB): string =>
  "#" +
  c
    .map(v =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklab([r8, g8, b8]: RGB): Lab {
  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab to sRGB, without clamping: channels can fall outside 0–255 for colors sRGB can't show. */
export function oklabToRgbUnclamped([L, A, B]: Lab): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function oklabToLch([L, A, B]: Lab): LCH {
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

export function lchToOklab([L, C, h]: LCH): Lab {
  const rad = (h * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

const inGamut = (c: RGB) => c.every(v => v >= -0.5 && v <= 255.5);

/**
 * The sRGB color for an OKLCH color. If sRGB can't show it, chroma is lowered until it can,
 * keeping lightness and hue, which is the least noticeable way to fit it.
 */
export function lchToHex(lch: LCH): string {
  const [L, C, h] = lch;
  const lightness = Math.max(0, Math.min(1, L));
  let rgb = oklabToRgbUnclamped(lchToOklab([lightness, C, h]));
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = C;
    for (let k = 0; k < 20; k++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToRgbUnclamped(lchToOklab([lightness, mid, h])))) lo = mid;
      else hi = mid;
    }
    rgb = oklabToRgbUnclamped(lchToOklab([lightness, lo, h]));
  }
  return toHex(rgb);
}

export const hexToLch = (color: string): LCH => oklabToLch(rgbToOklab(parseColor(color) ?? [0, 0, 0]));

/** Perceived lightness of any color, 0–1 (OKLab L). */
export const lightnessOf = (color: string): number => rgbToOklab(parseColor(color) ?? [0, 0, 0])[0];
