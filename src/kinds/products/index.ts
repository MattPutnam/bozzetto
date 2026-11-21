/** Products: studio shots of one item on a seamless backdrop, as in a shop. */
import { sneakers } from "./sneakers";
import { watch } from "./watch";
import { backpack } from "./backpack";
import { sunglasses } from "./sunglasses";
import { handbag } from "./handbag";
import { perfume } from "./perfume";
import { headphones } from "./headphones";
import { phone } from "./phone";
import { laptop } from "./laptop";
import { speaker } from "./speaker";
import { controller } from "./controller";

export { sneakers, watch, backpack, sunglasses, handbag, perfume, headphones, phone, laptop, speaker, controller };

export const products = [
  sneakers,
  watch,
  backpack,
  sunglasses,
  handbag,
  perfume,
  headphones,
  phone,
  laptop,
  speaker,
  controller,
] as const;
