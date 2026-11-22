/** Sports: close-ups of gear, and boards hung on the wall. */
import { baseball } from "./baseball";
import { basketball } from "./basketball";
import { football } from "./football";
import { hockey } from "./hockey";
import { tennis } from "./tennis";
import { skateboard } from "./skateboard";
import { surfboard } from "./surfboard";

export { baseball, basketball, football, hockey, tennis, skateboard, surfboard };

/**
 * Every kind in the sports category: close-ups of gear, and boards hung on the wall.
 *
 * @category Categories
 */
export const sports = [baseball, basketball, football, hockey, tennis, skateboard, surfboard] as const;
