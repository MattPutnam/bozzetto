/**
 * `bozzetto/react`: `<Placeholder>` and `<Avatar>` components and hooks for React 16.8 and later.
 *
 *     import { Placeholder } from "bozzetto/react";
 *     <Placeholder kind="owl" seed={3} size="320x240" palette="pastel" />
 */
import { createElement, useMemo, type CSSProperties, type ImgHTMLAttributes, type ReactElement } from "react";
import {
  avatar,
  avatars,
  placeholder,
  placeholders,
  type AvatarOptions,
  type AvatarShape,
  type AvatarsOptions,
  type Picture,
  type PlaceholderOptions,
  type PlaceholdersOptions,
} from "./index";
import { focusStyle, optionsKey } from "./frameworks";

/** One picture, drawn again only when its options change. */
export function usePlaceholder(options: PlaceholderOptions): Picture {
  const key = optionsKey(options);
  // The key stands for the options' contents, so an inline object doesn't redraw on every render.
  return useMemo(() => placeholder(options), [key]);
}

/** A list of pictures, drawn again only when the count or options change. */
export function usePlaceholders(count: number, options: PlaceholdersOptions = {}): Picture[] {
  const key = `${count}|${optionsKey(options)}`;
  return useMemo(() => placeholders(count, options), [key]);
}

export interface PlaceholderProps
  extends PlaceholderOptions, Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height" | "children"> {
  /** Draw the SVG markup into the page instead of an `<img>`. */
  inline?: boolean;
}

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height" | "children">;

/** A picture as an `<img>` (or inline SVG), with the props the components share. */
function pictureElement(
  picture: Picture,
  inline: boolean | undefined,
  props: ImgProps,
  shape?: AvatarShape,
): ReactElement {
  const { alt, style, ...rest } = props;
  if (inline) {
    return createElement("span", {
      ...(rest as object),
      role: "img",
      "aria-label": alt ?? picture.alt,
      style: { display: "inline-block", lineHeight: 0, ...style },
      dangerouslySetInnerHTML: { __html: picture.svg },
    });
  }
  const look: CSSProperties = { ...focusStyle(picture, shape), ...style };
  return createElement("img", {
    ...rest,
    src: picture.src,
    alt: alt ?? picture.alt,
    width: picture.width,
    height: picture.height,
    style: look,
  });
}

/**
 * A placeholder picture as an `<img>`, with its alt text and size. It's cropped around the
 * picture's focus when you size it with `object-fit: cover`, and shows the picture's color while
 * loading. Any other `<img>` attributes pass through; `alt` replaces the picture's own alt text.
 */
export function Placeholder(props: PlaceholderProps): ReactElement {
  const { kind, seed, size, palette, mapping, texture, label, inline, ...rest } = props;
  return pictureElement(usePlaceholder({ kind, seed, size, palette, mapping, texture, label }), inline, rest);
}

/** One avatar, drawn again only when its options change. */
export function useAvatar(options: AvatarOptions = {}): Picture {
  const key = optionsKey(options);
  return useMemo(() => avatar(options), [key]);
}

/** A list of avatars, drawn again only when the count or options change. */
export function useAvatars(count: number, options: AvatarsOptions = {}): Picture[] {
  const key = `${count}|${optionsKey(options)}`;
  return useMemo(() => avatars(count, options), [key]);
}

export interface AvatarProps extends AvatarOptions, ImgProps {
  /** Draw the SVG markup into the page instead of an `<img>`. */
  inline?: boolean;
}

/**
 * An avatar as an `<img>`: a face framed around its head, round by default, with its alt text.
 * Pass a user id as `seed` to give each user their own. Other `<img>` attributes pass through.
 */
export function Avatar(props: AvatarProps): ReactElement {
  const { kind, seed, size, shape, margin, palette, mapping, texture, inline, ...rest } = props;
  const picture = useAvatar({ kind, seed, size, shape, margin, palette, mapping, texture });
  return pictureElement(picture, inline, rest, shape ?? "circle");
}
