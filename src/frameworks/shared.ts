/** What the framework components share. */
import type { Kind, Picture } from "../index";

const draws = new WeakMap<Kind["draw"], number>();
let nextDraw = 0;

/** A number for each drawing function, so two custom kinds that share an id still key apart. */
function drawKey(draw: Kind["draw"]): number {
  let key = draws.get(draw);
  if (key === undefined) draws.set(draw, (key = nextDraw++));
  return key;
}

/**
 * A key that changes only when options' contents change, for memoizing pictures. Kinds are keyed
 * by id, drawing function and fixed options, so an inline `cat.with({ tabby: true })` keys the same on every render.
 */
export function optionsKey(options: object): string {
  return JSON.stringify(options, (_, value: unknown) => {
    if (value && typeof value === "object" && "draw" in value && "id" in value) {
      const kind = value as Kind;
      return `kind:${kind.id}:${drawKey(kind.draw)}:${JSON.stringify(kind.fixed ?? {})}`;
    }
    return value;
  });
}

/** How round an avatar's corners are, matching the shape `avatar` clips it to. */
export const SHAPE_RADIUS = { circle: "50%", rounded: "22%", square: "0" } as const;

/**
 * Styles that crop around the picture's focus and show its color while it loads. For an avatar,
 * the loading color is rounded to its shape, so its transparent corners stay transparent.
 */
export function focusStyle(
  picture: Picture,
  shape?: keyof typeof SHAPE_RADIUS,
): { objectPosition: string; backgroundColor: string; borderRadius?: string } {
  return {
    objectPosition: `${Math.round(picture.focus.x * 100)}% ${Math.round(picture.focus.y * 100)}%`,
    backgroundColor: picture.color,
    ...(shape && shape !== "square" ? { borderRadius: SHAPE_RADIUS[shape] } : {}),
  };
}
