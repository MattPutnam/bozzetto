/** Holidays: scenes through the year, from fireworks and hearts to pumpkins and snowmen. */
import { fireworks } from "./fireworks";
import { hearts } from "./hearts";
import { eggBasket } from "./egg-basket";
import { fallLeaves } from "./fall-leaves";
import { pumpkins } from "./pumpkins";
import { snowflakes } from "./snowflakes";
import { snowman } from "./snowman";
import { holidayTree } from "./holiday-tree";
import { gifts } from "./gifts";

export { fireworks, hearts, eggBasket, fallLeaves, pumpkins, snowflakes, snowman, holidayTree, gifts };

export const holidays = [
  fireworks,
  hearts,
  eggBasket,
  fallLeaves,
  pumpkins,
  snowflakes,
  snowman,
  holidayTree,
  gifts,
] as const;
