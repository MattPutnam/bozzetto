/** Objects: still lifes on a table or shelf. */
import { fruitBowl } from "./fruit-bowl";
import { flowers } from "./flowers";
import { coffee } from "./coffee";
import { books } from "./books";
import { bottles } from "./bottles";
import { teapot } from "./teapot";
import { lamp } from "./lamp";
import { clock } from "./clock";
import { candles } from "./candles";
import { balloons } from "./balloons";
import { camera } from "./camera";
import { armchair } from "./armchair";

export { fruitBowl, flowers, coffee, books, bottles, teapot, lamp, clock, candles, balloons, camera, armchair };

export const objects = [
  fruitBowl,
  flowers,
  coffee,
  books,
  bottles,
  teapot,
  lamp,
  clock,
  candles,
  balloons,
  camera,
  armchair,
] as const;
