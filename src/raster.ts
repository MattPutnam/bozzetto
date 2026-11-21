/**
 * Pictures as PNG, WebP or JPEG in the browser, drawn with a canvas. No dependencies.
 * (In Node, use `toPng` from `bozzetto/node`.)
 */
import type { Picture } from "./render";

export interface ImageOptions {
  /** `image/png` (default), `image/webp` or `image/jpeg`. WebP isn't supported by every browser. */
  type?: "image/png" | "image/webp" | "image/jpeg";
  /** Pixels per SVG pixel, such as 2 for high-density screens. Default 1. */
  scale?: number;
  /** For WebP and JPEG: quality from 0 to 1. The browser's default when left out. */
  quality?: number;
}

/** The width and height of a picture, or of SVG markup from its `width` and `height` attributes. */
export function sizeOf(input: Picture | string): { width: number; height: number } {
  if (typeof input !== "string") return { width: input.width, height: input.height };
  const width = Number(/<svg[^>]*\swidth="([\d.]+)"/.exec(input)?.[1]);
  const height = Number(/<svg[^>]*\sheight="([\d.]+)"/.exec(input)?.[1]);
  if (!(width > 0 && height > 0)) throw new Error("bozzetto: can't find the SVG's width and height.");
  return { width, height };
}

/**
 * A picture as an image file, drawn with a canvas: PNG by default, or WebP or JPEG.
 * Works in browsers; for Node, use `toPng` from `bozzetto/node`.
 */
export async function toImageBlob(input: Picture | string, options: ImageOptions = {}): Promise<Blob> {
  if (typeof Image === "undefined" || typeof document === "undefined") {
    throw new Error("bozzetto: toImageBlob needs a browser page. In Node, use toPng from bozzetto/node.");
  }
  const { width, height } = sizeOf(input);
  const scale = options.scale ?? 1;
  const svg = typeof input === "string" ? input : input.svg;
  const image = new Image();
  image.decoding = "async";
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("bozzetto: this browser couldn't make a 2D canvas.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      blob =>
        blob ? resolve(blob) : reject(new Error(`bozzetto: this browser can't make ${options.type ?? "image/png"}.`)),
      options.type ?? "image/png",
      options.quality,
    ),
  );
}
