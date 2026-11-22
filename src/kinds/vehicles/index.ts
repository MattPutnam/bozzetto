/** Vehicles: side views on roads, rails, water and sky, by day, dusk or night. */
import { car } from "./car";
import { bicycle } from "./bicycle";
import { sailboat } from "./sailboat";
import { hotAirBalloon } from "./hot-air-balloon";
import { rocket } from "./rocket";
import { train } from "./train";
import { bus } from "./bus";
import { airplane } from "./airplane";

export { car, bicycle, sailboat, hotAirBalloon, rocket, train, bus, airplane };

/**
 * Every kind in the vehicles category: side views on roads, rails, water and sky, by day, dusk or
 * night.
 *
 * @category Categories
 */
export const vehicles = [car, bicycle, sailboat, hotAirBalloon, rocket, train, bus, airplane] as const;
