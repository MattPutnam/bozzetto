/**
 * Palettes, moods and textures, applied to a finished picture by rewriting its colors.
 * Because this works on the markup, every kind gets it for free, built-in or custom.
 */

import { el } from "../src/core";

export type Mood = "vivid" | "pastel" | "muted" | "dusk" | "mono" | "sepia" | "grayscale";
export type Texture = "grain" | "paper";

export interface StyleOptions {
  mood?: Mood;
  /** Recolor with these colors instead. */
  palette?: readonly string[];
  /** How a palette is applied. `ramp` keeps light and dark where they were; `nearest` snaps each color to its closest match. */
  mapping?: "ramp" | "nearest";
  /** Hue for the `mono` mood. Default: blue-green. */
  hue?: number;
  texture?: Texture;
}

export const MOODS: readonly Mood[] = ["vivid", "pastel", "muted", "dusk", "mono", "sepia", "grayscale"];

export const PALETTES: Record<string, readonly string[]> = {
  sunset: ["#2d1e2f", "#7a3b52", "#d1495b", "#edae49", "#f9e0a8"],
  "sea glass": ["#0b2e3b", "#1b6a73", "#4fa3a5", "#a7d7c5", "#eef6ee"],
  riso: ["#1f2a44", "#ff4f5e", "#ffb000", "#f5f0e6"],
  orchard: ["#283618", "#606c38", "#dda15e", "#bc6c25", "#fefae0"],
  candy: ["#3d2c8d", "#916bbf", "#c996cc", "#f2a7c3", "#fff1e6"],
};

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
const hslText = (h: number, sat: number, l: number) =>
  `hsl(${Math.round(h)} ${Math.round(Math.max(0, Math.min(100, sat)))}% ${Math.round(Math.max(0, Math.min(100, l)))}%)`;

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
  const rampWith = (colors: readonly string[]) => {
    // Stretch the picture's own lightness range across the whole palette.
    const ls = (svg.match(COLOR) ?? []).map(m => lightness(parse(m)));
    const lo = Math.min(...ls);
    const hi = Math.max(...ls);
    const span = hi - lo || 1;
    const at = ramp(colors);
    return (c: RGB) => at((lightness(c) - lo) / span);
  };
  if (o.palette?.length) return o.mapping === "nearest" ? nearest(o.palette) : rampWith(o.palette);
  switch (o.mood) {
    case undefined:
      return undefined;
    case "mono": {
      const h = o.hue ?? 175;
      return rampWith([hslText(h, 45, 10), hslText(h, 40, 42), hslText(h, 35, 72), hslText(h, 30, 95)]);
    }
    case "sepia":
      return rampWith(["#2a1d10", "#7a5634", "#c9a46e", "#f4e8cf"]);
    case "grayscale":
      return c => {
        const l = lightness(c);
        return hslText(0, 0, l);
      };
    default:
      return c => {
        const [h, sat, l] = rgbToHsl(c);
        switch (o.mood) {
          case "vivid":
            return hslText(h, sat * 1.3 + 8, 50 + (l - 50) * 0.92);
          case "pastel":
            return hslText(h, Math.min(65, sat * 0.6 + 12), 74 + (l - 50) * 0.42);
          case "muted":
            return hslText(h, sat * 0.42, 52 + (l - 50) * 0.8);
          case "dusk":
            return hslText(h + (h > 60 && h < 200 ? 18 : 0) - (h <= 60 ? 6 : 0), sat * 0.8, l * 0.52 + 4);
          default:
            return hex(c);
        }
      };
  }
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
