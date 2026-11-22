/** Buildings: cottages, castles, bridges and townhouses, by day, dusk or night. */
import { cottage } from "./cottage";
import { windmill } from "./windmill";
import { castle } from "./castle";
import { bridge } from "./bridge";
import { rowHouses } from "./row-houses";
import { greenhouse } from "./greenhouse";

export { cottage, windmill, castle, bridge, rowHouses, greenhouse };

/**
 * Every kind in the buildings category: cottages, castles, bridges and townhouses, by day, dusk or
 * night.
 *
 * @category Categories
 */
export const buildings = [cottage, windmill, castle, bridge, rowHouses, greenhouse] as const;
