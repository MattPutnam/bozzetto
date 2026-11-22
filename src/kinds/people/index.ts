/** People: portraits, people reading, working and out for a walk, pairs and groups. */
import { portrait } from "./portrait";
import { reader } from "./reader";
import { worker } from "./worker";
import { cafe } from "./cafe";
import { pair } from "./pair";
import { group } from "./group";
import { walker } from "./walker";

export { portrait, reader, worker, cafe, pair, group, walker };

/**
 * Every kind in the people category: portraits, people reading, working and out for a walk, pairs
 * and groups.
 *
 * @category Categories
 */
export const people = [portrait, reader, worker, cafe, pair, group, walker] as const;
