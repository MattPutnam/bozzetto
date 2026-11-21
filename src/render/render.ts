/** Turning a kind into a finished picture: size, seed, label, and the colors and texture to style it with. */
import { parseColor, toHex } from "../color/color";
import { el, hash, makeRand, seedToInt, type Kind, type OptionValue } from "../draw/core";
import { withDarkMode } from "../color/dark";
import { stylize, type StyleOptions } from "../color/style";

/** A finished picture, with what a gallery needs to lay it out and describe it. */
export interface Picture {
  /** A `data:image/svg+xml` URI, for an `<img src>` or CSS `url()`. */
  readonly src: string;
  /** The SVG markup, for inlining. Element ids are unique to this picture. */
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  /** The id of the kind that drew it, such as `"owl"`. */
  readonly kind: string;
  /** A short description for screen readers, such as "An owl on a branch under a crescent moon". */
  readonly alt: string;
  /** The point of interest as fractions of the width and height, for `object-position` or cropping. */
  readonly focus: { readonly x: number; readonly y: number };
  /** The picture's main background color as `#rrggbb`, to show while it loads. */
  readonly color: string;
  /** With the `dark` option: the main background color in dark mode. */
  readonly darkColor?: string;
  /** The value each of the kind's options took, whether fixed with `kind.with` or chosen by the seed. */
  readonly options: Readonly<Record<string, OptionValue>>;
  /**
   * The bounds of the subject's head, as fractions of the width and height, for kinds with a face
   * (the ones `avatar` takes); undefined for others.
   */
  readonly frame?: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

/**
 * A picture's size in px, as `"400x300"` or `{ width: 400, height: 300 }`.
 * (There's no bare-number form, so a list of sizes can't be mistaken for a width and a height.)
 */
export type Size = `${number}x${number}` | { readonly width: number; readonly height: number };

export interface RenderOptions extends StyleOptions {
  /** Default `"400x300"`. */
  size?: Size;
  /** The same seed always gives the same picture. A string is hashed. Default 1. */
  seed?: number | string;
  /** Text drawn in the bottom-right corner, such as a number. */
  label?: string | number;
}

/** The width and height a size stands for. Throws on anything that isn't a valid size. */
export function resolveSize(size: Size = "400x300"): { width: number; height: number } {
  const parsed =
    typeof size === "string"
      ? /^\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*$/i.exec(size)?.slice(1).map(Number)
      : [size.width, size.height];
  if (!parsed || !parsed.every(v => Number.isFinite(v) && v > 0)) {
    throw new Error(`bozzetto: ${JSON.stringify(size)} isn't a size. Use "400x300" or { width: 400, height: 300 }.`);
  }
  return { width: parsed[0], height: parsed[1] };
}

/** Draws a picture, with its alt text, focus and background color. */
export function render(kind: Kind, options: RenderOptions = {}): Picture {
  const { width, height } = resolveSize(options.size);
  const seed = seedToInt(options.seed);
  // Fixed options are part of the id prefix, so two variants of a kind with one seed can share a page.
  const fixed = Object.keys(kind.fixed ?? {}).length ? `:${JSON.stringify(kind.fixed)}` : "";
  const prefix = `bz${hash(`${kind.id}${fixed}:${seed}:${width}x${height}`).toString(36)}-`;
  let alt = kind.name;
  let focus = { x: 0.5, y: 0.5 };
  let frame: Picture["frame"];
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
  const chosen: Record<string, OptionValue> = {};
  let body = kind.draw(makeRand(seed, prefix, kind.fixed ?? {}, chosen), width, height, {
    alt: text => (alt = text),
    focus: (x, y) => (focus = { x: clamp(x / width), y: clamp(y / height) }),
    frame: (x, y, w, h) => {
      // Kept to the picture, so an avatar never frames beyond the drawing.
      const left = clamp(x / width);
      const top = clamp(y / height);
      frame = { x: left, y: top, width: clamp((x + w) / width) - left, height: clamp((y + h) / height) - top };
    },
  });
  if (options.label !== undefined && options.label !== "") {
    const fontSize = Math.min(width, height) * 0.093;
    const pad = fontSize * 0.57;
    body += el(
      "text",
      {
        x: width - pad,
        y: height - pad,
        "text-anchor": "end",
        "font-family": "system-ui,sans-serif",
        "font-size": fontSize,
        "font-weight": 600,
        fill: "#fff",
        opacity: "0.85",
      },
      escapeXml(String(options.label)),
    );
  }
  // The size is written as given, not rounded, so it matches the caller's numbers exactly.
  let svg = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: String(width),
      height: String(height),
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "xMidYMid slice",
    },
    body,
  );
  if (options.palette !== undefined || options.texture !== undefined) svg = stylize(svg, options);
  let darkColor: string | undefined;
  if (options.dark !== undefined && options.dark !== false) {
    const darkPalette = options.dark === true ? "dim" : options.dark;
    const dark = stylize(svg, { palette: darkPalette, mapping: options.mapping });
    darkColor = backgroundColor(dark, width, height);
    svg = withDarkMode(svg, dark, options.darkSelector);
  }
  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    svg,
    width,
    height,
    kind: kind.id,
    alt,
    focus,
    color: backgroundColor(svg, width, height),
    options: chosen,
    ...(frame ? { frame } : {}),
    ...(darkColor ? { darkColor } : {}),
  };
}

/** The full SVG markup for one picture. */
export function toSvg(kind: Kind, options: RenderOptions = {}): string {
  return render(kind, options).svg;
}

/** The picture as a `data:image/svg+xml` URI, ready for an `<img src>` or CSS `url()`. */
export function toDataUri(kind: Kind, options: RenderOptions = {}): string {
  return render(kind, options).src;
}

/**
 * The color of the first shape that covers the whole picture, or failing that the first color used.
 * A gradient counts as the average of its stops.
 */
function backgroundColor(svg: string, width: number, height: number): string {
  const full = new RegExp(`<rect (?:x="0" y="0" )?width="${width}" height="${height}" fill="([^"]+)"`).exec(svg);
  const paint = full?.[1] ?? /fill="(#[0-9a-f]{3,6}|hsl\([^)]*\)|rgb\([^)]*\))"/i.exec(svg)?.[1] ?? "#cccccc";
  const gradient = /^url\(#([^)]+)\)$/.exec(paint);
  if (gradient) {
    const def = new RegExp(`<linearGradient id="${gradient[1]}"[^>]*>(.*?)</linearGradient>`).exec(svg)?.[1] ?? "";
    const stops = [...def.matchAll(/stop-color="([^"]+)"/g)].map(m => parseColor(m[1])).filter(c => c !== undefined);
    if (stops.length) {
      const mean = [0, 1, 2].map(k => stops.reduce((sum, c) => sum + c[k], 0) / stops.length);
      return toHex(mean as [number, number, number]);
    }
  }
  const rgb = parseColor(paint);
  return rgb ? toHex(rgb) : "#cccccc";
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
}
