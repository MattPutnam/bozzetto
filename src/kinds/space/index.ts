/** Space: planets, nebulae, galaxies, black holes, astronauts and the surface of a moon. */
import { planets } from "./planets";
import { nebula } from "./nebula";
import { galaxy } from "./galaxy";
import { blackHole } from "./black-hole";
import { astronaut } from "./astronaut";
import { moon } from "./moon";

export { planets, nebula, galaxy, blackHole, astronaut, moon };

/**
 * Every kind in the space category: planets, nebulae, galaxies, black holes, astronauts and the
 * surface of a moon.
 *
 * @category Categories
 */
export const space = [planets, nebula, galaxy, blackHole, astronaut, moon] as const;
