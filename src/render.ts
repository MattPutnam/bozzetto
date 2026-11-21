/** Turning a kind into finished SVG: size, seed, label, and the colors and texture to style it with. */
import { el, hash, makeRand, seedToInt, type Kind } from "./core";
import { stylize, type StyleOptions } from "./style";

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

/** The full SVG markup for one picture. */
export function toSvg(kind: Kind, options: RenderOptions = {}): string {
  const { width, height } = resolveSize(options.size);
  const seed = seedToInt(options.seed);
  const prefix = `bz${hash(`${kind.id}:${seed}:${width}x${height}`).toString(36)}-`;
  let body = kind.draw(makeRand(seed, prefix), width, height);
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
  const svg = el(
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
  return options.palette !== undefined || options.texture !== undefined ? stylize(svg, options) : svg;
}

/** The picture as a `data:image/svg+xml` URI, ready for an `<img src>` or CSS `url()`. */
export function toDataUri(kind: Kind, options: RenderOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvg(kind, options))}`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, c => `&#${c.charCodeAt(0)};`);
}
