/** What the framework components share. */
import type { Kind, Picture } from "./index";

/**
 * A key that changes only when options' contents change, for memoizing pictures. Kinds are keyed
 * by id and fixed options, so an inline `cat.with({ tabby: true })` keys the same on every render.
 */
export function optionsKey(options: object): string {
  return JSON.stringify(options, (_, value: unknown) => {
    if (value && typeof value === "object" && "draw" in value && "id" in value) {
      const kind = value as Kind;
      return `kind:${kind.id}:${JSON.stringify(kind.fixed ?? {})}`;
    }
    return value;
  });
}

/** Styles that crop around the picture's focus and show its color while it loads. */
export function focusStyle(picture: Picture): { objectPosition: string; backgroundColor: string } {
  return {
    objectPosition: `${Math.round(picture.focus.x * 100)}% ${Math.round(picture.focus.y * 100)}%`,
    backgroundColor: picture.color,
  };
}
