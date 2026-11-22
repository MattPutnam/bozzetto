/**
 * Avatars: a face kind framed in a square around its head, round by default.
 *
 * The picture is drawn on a square canvas, then the SVG's viewBox is set to a square around the
 * head the kind reports with `note.frame`. Nothing is redrawn, so an avatar stays sharp at any size.
 */
import { checkOneOf, el, hash, n, withoutNulls, type Kind } from "../draw/core";
import type { KindChoice, Order } from "./placeholder";
import { render, type Picture } from "./render";
import type { StyleOptions } from "../color/style";

/**
 * An avatar's outline: `circle` (default), `rounded` (a rounded square) or `square`.
 *
 * @category Avatars
 */
export type AvatarShape = "circle" | "rounded" | "square";

/** Every avatar shape. */
export const SHAPES: readonly AvatarShape[] = ["circle", "rounded", "square"];

/**
 * How to draw an avatar: its face, size, shape and margin, plus the colors and texture to style it with.
 *
 * @category Avatars
 */
export interface AvatarOptions extends StyleOptions {
  /** Default: any kind with a face (the `faces` category), chosen by the seed. */
  kind?: KindChoice;
  /** The same seed always gives the same avatar. A string, such as a user id, is hashed. Default 1. */
  seed?: number | string;
  /** Width and height in px. Default 64. */
  size?: number;
  /** `circle` (default), `rounded` or `square`. Corners outside the shape are transparent. */
  shape?: AvatarShape;
  /** Space around the head, as a fraction of its size: 0 or more. Default 0.12. */
  margin?: number;
}

/**
 * How to draw a list of avatars: as for one avatar, plus how to go through the list of kinds.
 *
 * @category Avatars
 */
export interface AvatarsOptions extends AvatarOptions {
  /** How a list of kinds is gone through: `shuffle` (default), `cycle` or `random`, as in `placeholders`. */
  order?: Order;
}

const CANVAS = 400;

/** Builds `avatar` for the kinds that `resolveKind` knows, with `faces` as the default. */
export function makeAvatar(
  resolveKind: (choice: KindChoice | undefined, seed?: number | string) => Kind,
  faces: readonly Kind[],
): (options?: AvatarOptions) => Picture {
  return (given = {}) => {
    const options = withoutNulls(given);
    const size = options.size ?? 64;
    if (!(size > 0 && Number.isFinite(size)))
      throw new Error("bozzetto: an avatar's size must be a number more than 0.");
    const margin = options.margin ?? 0.12;
    if (!(margin >= 0 && Number.isFinite(margin)))
      throw new Error("bozzetto: an avatar's margin must be a number of at least 0.");
    checkOneOf(options.shape, SHAPES, "an avatar's shape");
    const kind = resolveKind(options.kind ?? faces, options.seed);
    const picture = render(kind, {
      size: { width: CANVAS, height: CANVAS },
      seed: options.seed,
      palette: options.palette,
      mapping: options.mapping,
      texture: options.texture,
      dark: options.dark,
      darkSelector: options.darkSelector,
    });
    if (!picture.frame) {
      throw new Error(
        `bozzetto: ${kind.id} can't be an avatar, because it has no face to frame. Kinds that can: ${faces.map(k => k.id).join(", ")}.`,
      );
    }

    // A square around the head, with a margin, kept within the drawing.
    const f = picture.frame;
    const side = Math.min(CANVAS, Math.max(f.width, f.height) * CANVAS * (1 + 2 * margin));
    const centerX = (f.x + f.width / 2) * CANVAS;
    const centerY = (f.y + f.height / 2) * CANVAS;
    const left = Math.max(0, Math.min(CANVAS - side, centerX - side / 2));
    const top = Math.max(0, Math.min(CANVAS - side, centerY - side / 2));

    const body = picture.svg.slice(picture.svg.indexOf(">") + 1, picture.svg.lastIndexOf("</svg>"));
    const shape = options.shape ?? "circle";
    const clip = `bzav${hash(`${picture.svg}:${shape}:${left}:${top}:${side}`).toString(36)}-shape`;
    const clipShape =
      shape === "circle"
        ? el("circle", { cx: left + side / 2, cy: top + side / 2, r: side / 2 })
        : el("rect", { x: left, y: top, width: side, height: side, rx: side * 0.22 });
    const contents =
      shape === "square"
        ? body
        : el("defs", {}, el("clipPath", { id: clip }, clipShape)) + el("g", { "clip-path": `url(#${clip})` }, body);
    const svg = el(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: String(size),
        height: String(size),
        viewBox: `${n(left)} ${n(top)} ${n(side)} ${n(side)}`,
      },
      contents,
    );
    const within = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
    return {
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      svg,
      width: size,
      height: size,
      kind: picture.kind,
      alt: picture.alt,
      focus: {
        x: within((picture.focus.x * CANVAS - left) / side),
        y: within((picture.focus.y * CANVAS - top) / side),
      },
      color: picture.color,
      ...(picture.darkColor ? { darkColor: picture.darkColor } : {}),
      options: picture.options,
    };
  };
}
