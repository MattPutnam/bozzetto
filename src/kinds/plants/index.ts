/** Plants: potted plants, and close-ups of real flowers. */
import { cactus } from "./cactus";
import { houseplant } from "./houseplant";
import { succulents } from "./succulents";
import { sunflower } from "./sunflower";
import { rose } from "./rose";
import { tulip } from "./tulip";
import { daisy } from "./daisy";
import { poppy } from "./poppy";
import { hibiscus } from "./hibiscus";
import { lotus } from "./lotus";

export { cactus, houseplant, succulents, sunflower, rose, tulip, daisy, poppy, hibiscus, lotus };

/**
 * Every kind in the plants category: potted plants, and close-ups of real flowers.
 *
 * @category Categories
 */
export const plants = [cactus, houseplant, succulents, sunflower, rose, tulip, daisy, poppy, hibiscus, lotus] as const;
