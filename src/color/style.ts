/**
 * Styles a finished picture by rewriting its colors: with a palette of colors, or with an
 * adjustment of the picture's own colors (such as pastel or grayscale), plus an optional texture.
 * Because this works on the markup, every kind gets it for free, built-in or custom.
 */

import { el } from "../draw/core";
import { lchToHex, oklabToLch, rgbToOklab } from "./color";
import { ADJUSTMENTS, resolvePalette, type Adjustment, type PaletteSpec } from "./palettes";

export { ADJUSTMENTS, PALETTES } from "./palettes";

export type Texture = "grain" | "paper";
export type Mapping = "ramp" | "balanced" | "nearest";

export const MAPPINGS: readonly Mapping[] = ["balanced", "ramp", "nearest"];

export interface StyleOptions {
  /**
   * The colors to use: an adjustment's name (`vivid`, `pastel`, `muted`, `dusk`, `dim`, `grayscale`),
   * a built-in palette's name, a palette code, or a list of colors.
   */
  palette?: PaletteSpec;
  /**
   * How a list of colors is applied (adjustments ignore it):
   * - `balanced` (default) uses only the exact palette colors. It keeps light and dark where they
   *   were and chooses among similar lightnesses by hue, so differently colored areas stay different.
   * - `ramp` keeps light and dark where they were too, but blends between palette colors, adding
   *   in-between shades for a softer look.
   * - `nearest` snaps each color to its closest palette color. Bold, but areas can merge.
   */
  mapping?: Mapping;
  texture?: Texture;
  /**
   * A dark-mode version, built into the picture: in dark mode it switches to these colors by
   * itself. `true` uses the `dim` adjustment, which darkens the picture's own colors and keeps their hues; or
   * give any palette, as for `palette`. Follows the viewer's system setting, in images and inline.
   */
  dark?: boolean | PaletteSpec;
  /**
   * Use the dark colors under this selector, such as ".dark" or "[data-theme=dark]", instead of the
   * viewer's system setting, for pages with their own theme switch. Works for inline SVG only: an
   * `<img>` can't see the page's classes.
   */
  darkSelector?: string;
}

type RGB = [number, number, number];

const COLOR = /hsl\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)|#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function parse(text: string): RGB {
  if (text.startsWith("#")) {
    const hex = text.length === 4 ? [...text.slice(1)].map(c => c + c).join("") : text.slice(1);
    return [0, 2, 4].map(k => parseInt(hex.slice(k, k + 2), 16)) as RGB;
  }
  const [h, sat, l] = text.slice(4, -1).replace(/%/g, "").split(" ").map(Number);
  return hslToRgb(h, sat, l);
}

function hslToRgb(h: number, sat: number, l: number): RGB {
  const S = sat / 100;
  const L = l / 100;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

function rgbToHsl([r, g, b]: RGB): RGB {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const sat = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, sat * 100, l * 100];
}

/** Perceived lightness, CIE L* in 0–100. */
function lightness([r, g, b]: RGB): number {
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const Y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return Y <= 216 / 24389 ? (Y * 24389) / 27 : 116 * Math.cbrt(Y) - 16;
}

const hex = (c: RGB) =>
  "#" +
  c
    .map(v =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
// The hue is wrapped into 0–359: adjustments can push it below 0 (dusk shifts warm hues down), and
// although CSS accepts any angle, recoloring again (for dark mode, say) only reads 0–359.
const hslText = (h: number, sat: number, l: number) =>
  `hsl(${((Math.round(h) % 360) + 360) % 360} ${Math.round(Math.max(0, Math.min(100, sat)))}% ${Math.round(Math.max(0, Math.min(100, l)))}%)`;

/** Sorted by lightness, then sampled at t in 0–1 with linear interpolation. */
function ramp(colors: readonly string[]): (t: number) => string {
  const stops = colors.map(parse).sort((a, b) => lightness(a) - lightness(b));
  return t => {
    const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const k = Math.min(Math.floor(x), stops.length - 2);
    const f = x - k;
    const a = stops[k];
    const b = stops[k + 1];
    return hex([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
  };
}

function nearest(colors: readonly string[]): (c: RGB) => string {
  const options = colors.map(parse);
  return c => {
    let best = options[0];
    let bestD = Infinity;
    for (const o of options) {
      const rm = (c[0] + o[0]) / 2;
      const dr = c[0] - o[0];
      const dg = c[1] - o[1];
      const db = c[2] - o[2];
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return hex(best);
  };
}

/**
 * Picks an exact palette color for each picture color. The picture's lightness range is stretched
 * over the palette's, then the closest palette color in OKLab wins, so lightness decides most of
 * the choice and hue settles it between palette colors of similar lightness.
 */
function balanced(svg: string, colors: readonly string[]): (c: RGB) => string {
  const swatches = colors.map(c => ({ hex: c, lab: rgbToOklab(parse(c)) }));
  const swatchLs = swatches.map(s => s.lab[0]);
  const paletteLo = Math.min(...swatchLs);
  const paletteHi = Math.max(...swatchLs);
  const pictureLs = (svg.match(COLOR) ?? []).map(m => rgbToOklab(parse(m))[0]);
  const lo = Math.min(...pictureLs);
  const span = Math.max(...pictureLs) - lo || 1;
  return c => {
    const [L, a, b] = rgbToOklab(c);
    const target = paletteLo + ((L - lo) / span) * (paletteHi - paletteLo);
    let best = swatches[0];
    let bestDistance = Infinity;
    for (const s of swatches) {
      const distance = (target - s.lab[0]) ** 2 + (a - s.lab[1]) ** 2 + (b - s.lab[2]) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = s;
      }
    }
    return best.hex;
  };
}

/** Recolors a picture's markup. Masks are left alone, since their black and white are structural. */
export function stylize(svg: string, options: StyleOptions = {}): string {
  const masks: string[] = [];
  let body = svg.replace(/<mask[\s\S]*?<\/mask>/g, m => `\uE000${masks.push(m) - 1}\uE000`);
  const recolor = recolorer(body, options);
  if (recolor) body = body.replace(COLOR, m => recolor(parse(m)));
  body = body.replace(/\uE000(\d+)\uE000/g, (_, k) => masks[Number(k)]);
  return options.texture ? addTexture(body, options.texture) : body;
}

function recolorer(svg: string, o: StyleOptions): ((c: RGB) => string) | undefined {
  if (o.palette === undefined) return undefined;
  if (typeof o.palette === "string" && (ADJUSTMENTS as readonly string[]).includes(o.palette)) {
    return adjust(o.palette as Adjustment);
  }
  const colors = resolvePalette(o.palette);
  if (o.mapping === "nearest") return nearest(colors);
  if (o.mapping !== "ramp") return balanced(svg, colors);
  // Ramp: stretch the picture's own lightness range across the whole palette.
  const ls = (svg.match(COLOR) ?? []).map(m => lightness(parse(m)));
  const lo = Math.min(...ls);
  const span = Math.max(...ls) - lo || 1;
  const at = ramp(colors);
  return c => at((lightness(c) - lo) / span);
}

/** Adjustments change the picture's own colors instead of replacing them. */
function adjust(adjustment: Adjustment): (c: RGB) => string {
  return c => {
    if (adjustment === "grayscale") return hslText(0, 0, lightness(c));
    if (adjustment === "dim") {
      // For dark pages, in OKLCH so a pale color stays soft instead of turning vivid: lightness
      // squeezed into 0.16–0.61 so the brightest parts don't glare, chroma eased a little, every
      // hue kept as it was.
      const [L, C, hue] = oklabToLch(rgbToOklab(c));
      return lchToHex([0.16 + L * 0.45, C * 0.85, hue]);
    }
    const [h, sat, l] = rgbToHsl(c);
    switch (adjustment) {
      case "vivid":
        return hslText(h, sat * 1.3 + 8, 50 + (l - 50) * 0.92);
      case "pastel":
        return hslText(h, Math.min(65, sat * 0.6 + 12), 74 + (l - 50) * 0.42);
      case "muted":
        return hslText(h, sat * 0.42, 52 + (l - 50) * 0.8);
      case "dusk":
        return hslText(h + (h > 60 && h < 200 ? 18 : 0) - (h <= 60 ? 6 : 0), sat * 0.8, l * 0.52 + 4);
    }
  };
}

function addTexture(svg: string, texture: Texture): string {
  const width = svg.match(/width="([\d.]+)"/)?.[1] ?? "400";
  const height = svg.match(/height="([\d.]+)"/)?.[1] ?? "300";
  const id = `tx${((svg.length * 2654435761) >>> 0).toString(36)}`;
  const region = { id, x: "0", y: "0", width: "100%", height: "100%" };
  // Grain: fine grey noise blended over the picture. Paper: lit noise, like the tooth of watercolor paper.
  const filter =
    texture === "grain"
      ? el(
          "filter",
          region,
          el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.85", numOctaves: "2", stitchTiles: "stitch" }),
          el("feColorMatrix", { type: "saturate", values: "0" }),
        )
      : el(
          "filter",
          region,
          el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.6", numOctaves: "4", result: "n" }),
          el(
            "feDiffuseLighting",
            { in: "n", "lighting-color": "#fff", surfaceScale: "1.6" },
            el("feDistantLight", { azimuth: "45", elevation: "58" }),
          ),
        );
  const layer = el("rect", {
    width,
    height,
    filter: `url(#${id})`,
    opacity: texture === "grain" ? "0.22" : "0.45",
    style: texture === "grain" ? "mix-blend-mode:overlay" : "mix-blend-mode:multiply",
  });
  return svg.replace(/<\/svg>$/, `${filter}${layer}</svg>`);
}
