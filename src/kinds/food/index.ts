/** Food: dishes seen from above or on a plate, with toppings that vary. */
import { donut } from "./donut";
import { pizza } from "./pizza";
import { iceCream } from "./ice-cream";
import { sushi } from "./sushi";
import { cake } from "./cake";
import { egg } from "./egg";
import { burger } from "./burger";
import { taco } from "./taco";
import { cupcake } from "./cupcake";
import { watermelon } from "./watermelon";
import { popsicle } from "./popsicle";
import { pancakes } from "./pancakes";
import { avocado } from "./avocado";
import { ramen } from "./ramen";
import { cookies } from "./cookies";
import { pie } from "./pie";
import { salad } from "./salad";
import { bread } from "./bread";
import { croissant } from "./croissant";
import { cocktail } from "./cocktail";
import { smoothie } from "./smoothie";
import { cheeseBoard } from "./cheese-board";
import { dumplings } from "./dumplings";

export {
  donut,
  pizza,
  iceCream,
  sushi,
  cake,
  egg,
  burger,
  taco,
  cupcake,
  watermelon,
  popsicle,
  pancakes,
  avocado,
  ramen,
  cookies,
  pie,
  salad,
  bread,
  croissant,
  cocktail,
  smoothie,
  cheeseBoard,
  dumplings,
};

/**
 * Every kind in the food category: dishes seen from above or on a plate, with toppings that vary.
 *
 * @category Categories
 */
export const food = [
  donut,
  pizza,
  iceCream,
  sushi,
  cake,
  egg,
  burger,
  taco,
  cupcake,
  watermelon,
  popsicle,
  pancakes,
  avocado,
  ramen,
  cookies,
  pie,
  salad,
  bread,
  croissant,
  cocktail,
  smoothie,
  cheeseBoard,
  dumplings,
] as const;
