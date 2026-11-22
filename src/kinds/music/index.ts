/** Music: instruments, records, CDs and drum kits, and scattered notes. */
import { guitar } from "./guitar";
import { piano } from "./piano";
import { drums } from "./drums";
import { record } from "./record";
import { cds } from "./cds";
import { notes } from "./notes";

export { guitar, piano, drums, record, cds, notes };

/**
 * Every kind in the music category: instruments, records, CDs and drum kits, and scattered notes.
 *
 * @category Categories
 */
export const music = [guitar, piano, drums, record, cds, notes] as const;
