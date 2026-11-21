/** Patterns: calm, even textures to sit behind text on cards and banners. */
import { terrazzo } from "./terrazzo";
import { marble } from "./marble";
import { gingham } from "./gingham";
import { plaid } from "./plaid";
import { topography } from "./topography";
import { gradient } from "./gradient";

export { terrazzo, marble, gingham, plaid, topography, gradient };

export const patterns = [terrazzo, marble, gingham, plaid, topography, gradient] as const;
